import mongoose from 'mongoose';

import AssociateProfile from '../models/AssociateProfile.js';
import MeetingSchedule from '../models/MeetingSchedule.js';
import logger from '../utils/logger.js';
import { createSafeAuditTrail } from '../utils/piiRedaction.js';

const httpError = (status, message, details) =>
  Object.assign(new Error(message), { statusCode: status, details });

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');

const normaliseEmail = (value) => {
  const trimmed = cleanString(value).toLowerCase();
  if (!trimmed) return '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : '';
};

const mapMeeting = (meeting) => ({
  id: meeting._id.toString(),
  title: meeting.title,
  agenda: meeting.agenda || '',
  notes: meeting.notes || '',
  scheduledFor: meeting.scheduledFor,
  durationMinutes: meeting.durationMinutes ?? null,
  status: meeting.status || 'scheduled',
  type: meeting.type || 'consultation',
  meetingLink: meeting.meetingLink || '',
  attendees: Array.isArray(meeting.attendees) ? meeting.attendees : [],
  createdAt: meeting.createdAt,
  updatedAt: meeting.updatedAt,
});

const resolveAssociate = async (id) => {
  if (!id) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const match = isObjectId ? { $or: [{ _id: id }, { user: id }] } : { _id: null };
  return AssociateProfile.findOne(match)
    .populate('user', 'email firstName lastName name')
    .lean();
};

const buildAttendees = (requester, associate) => {
  const attendees = [];
  if (requester?.email || requester?.name || requester?.phone) {
    attendees.push({
      name: requester.name || 'Skill Studio buyer',
      email: requester.email || undefined,
      role: requester.phone ? `Phone: ${requester.phone}` : 'buyer',
    });
  }
  const associateContact =
    associate?.contactEmail ||
    associate?.contact?.email ||
    associate?.user?.email ||
    null;
  if (associateContact) {
    attendees.push({
      name:
        associate?.fullName ||
        associate?.title ||
        associate?.firmName ||
        'Associate',
      email: associateContact,
      role: 'associate',
    });
  }
  return attendees;
};

export const requestConsultation = async (req, res, next) => {
  try {
    const associateId = req.params?.id;
    if (!associateId) throw httpError(400, 'Associate id is required');

    const associate = await resolveAssociate(associateId);
    if (!associate) throw httpError(404, 'Associate not found');

    const name = cleanString(req.body?.name) || 'Skill Studio buyer';
    const email = normaliseEmail(req.body?.email);
    const phone = cleanString(req.body?.phone);
    if (!email && !phone) {
      throw httpError(400, 'Provide a contact email or phone number');
    }

    const message = cleanString(req.body?.message || req.body?.notes);
    const scheduledFor =
      toDate(req.body?.scheduledFor) || new Date(Date.now() + 60 * 60 * 1000);
    const durationRaw = Number(req.body?.durationMinutes);
    const durationMinutes =
      Number.isFinite(durationRaw) && durationRaw > 0
        ? Math.min(Math.max(Math.round(durationRaw), 15), 240)
        : 30;

    const meeting = await MeetingSchedule.create({
      ownerType: 'associate',
      ownerId: associate._id,
      title:
        associate.fullName ||
        associate.title ||
        `Consultation with ${name}`,
      agenda: message || 'Consultation request via Skill Studio',
      notes: phone ? `Phone: ${phone}` : '',
      scheduledFor,
      durationMinutes,
      status: 'scheduled',
      type: 'consultation',
      meetingLink:
        cleanString(associate.schedulingMeeting) ||
        cleanString(associate.contact?.calendly) ||
        cleanString(associate.contact?.website),
      attendees: buildAttendees({ name, email, phone }, associate),
      createdBy: req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined,
    });

    logger.info('skill_studio_consultation_request', {
      associateId: associate._id.toString(),
      ...createSafeAuditTrail({ name, email, phone }, req.user?._id),
      meetingId: meeting._id.toString(),
    });

    res.status(201).json({
      ok: true,
      meeting: mapMeeting(meeting),
      associate: {
        id: associate._id.toString(),
        name: associate.fullName || associate.title || associate.firmName || null,
        contactEmail:
          associate.contactEmail ||
          associate.contact?.email ||
          associate.user?.email ||
          null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  requestConsultation,
};
