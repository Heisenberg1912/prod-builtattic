import mongoose from 'mongoose';

import MeetingSchedule from '../models/MeetingSchedule.js';
import { determineOwnerScope, OWNER_TYPES } from '../utils/ownerScope.js';

const MEETING_STATUSES = new Set(['scheduled', 'completed', 'cancelled']);
const MEETING_TYPES = new Set(['consultation', 'review', 'handover', 'site', 'check-in', 'other']);

const httpError = (status, message, details) =>
  Object.assign(new Error(message), { statusCode: status, details });

const resolveScopeOrThrow = async (user, requestedType) => {
  const scope = await determineOwnerScope(user, requestedType);
  if (scope.ownerId) return scope;
  if (scope.error === 'unauthorized') throw httpError(401, 'Unauthorized');
  if (scope.ownerType === OWNER_TYPES.ASSOCIATE) {
    throw httpError(404, 'Associate profile missing');
  }
  throw httpError(403, 'Join a firm to schedule meetings');
};

const toNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const pickStatus = (value, fallback = 'scheduled') => {
  const normalized = String(value || '').toLowerCase();
  return MEETING_STATUSES.has(normalized) ? normalized : fallback;
};

const pickType = (value, fallback = 'consultation') => {
  const normalized = String(value || '').toLowerCase();
  return MEETING_TYPES.has(normalized) ? normalized : fallback;
};

const normaliseAttendees = (attendees) => {
  if (!attendees) return [];
  const list = Array.isArray(attendees) ? attendees : [attendees];
  return list
    .map((entry) => {
      if (!entry) return null;
      const next =
        typeof entry === 'string'
          ? { email: entry }
          : {
              name: entry.name,
              email: entry.email,
              role: entry.role,
            };
      const name = next.name ? String(next.name).trim() : '';
      const email = next.email ? String(next.email).trim() : '';
      const role = next.role ? String(next.role).trim() : '';
      if (!name && !email) return null;
      return { name, email, role };
    })
    .filter(Boolean);
};

const mapMeeting = (meeting) => ({
  id: meeting._id.toString(),
  title: meeting.title,
  agenda: meeting.agenda || '',
  notes: meeting.notes || '',
  scheduledFor: meeting.scheduledFor,
  durationMinutes: meeting.durationMinutes ?? null,
  status: meeting.status,
  type: meeting.type || 'consultation',
  location: meeting.location || '',
  meetingLink: meeting.meetingLink || '',
  recordingUrl: meeting.recordingUrl || '',
  attendees: Array.isArray(meeting.attendees) ? meeting.attendees : [],
  createdAt: meeting.createdAt,
  updatedAt: meeting.updatedAt,
});

export const listMeetings = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const statusQuery = String(req.query.status || '').toLowerCase();
    const typeQuery = String(req.query.type || '').toLowerCase();
    const filters = {
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    };
    if (statusQuery === 'completed' || statusQuery === 'cancelled') {
      filters.status = statusQuery;
    } else if (statusQuery === 'all') {
      // no status filter
    } else {
      filters.status = 'scheduled';
      filters.scheduledFor = { $gte: new Date() };
    }
    if (MEETING_TYPES.has(typeQuery)) {
      filters.type = typeQuery;
    }

    const meetings = await MeetingSchedule.find(filters).sort({ scheduledFor: 1 }).limit(limit).lean();

    res.json({
      ok: true,
      ownerType: scope.ownerType,
      meetings: meetings.map(mapMeeting),
    });
  } catch (error) {
    next(error);
  }
};

export const scheduleMeeting = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const title = String(req.body?.title || '').trim();
    if (!title) throw httpError(400, 'Title is required');
    const scheduledFor = toDate(req.body?.scheduledFor);
    if (!scheduledFor) throw httpError(400, 'A valid meeting date/time is required');
    const attendees = normaliseAttendees(req.body?.attendees);
    const meeting = await MeetingSchedule.create({
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
      title,
      agenda: String(req.body?.agenda || '').trim(),
      notes: String(req.body?.notes || '').trim(),
      scheduledFor,
      durationMinutes: toNumber(req.body?.durationMinutes, 30),
      status: pickStatus(req.body?.status, 'scheduled'),
      type: pickType(req.body?.type, 'consultation'),
      location: String(req.body?.location || '').trim(),
      meetingLink: String(req.body?.meetingLink || '').trim(),
      recordingUrl: String(req.body?.recordingUrl || '').trim(),
      attendees,
      createdBy: req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined,
    });

    res.status(201).json({
      ok: true,
      meeting: mapMeeting(meeting),
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeeting = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const meetingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(meetingId)) throw httpError(400, 'Invalid meeting id');

    const meeting = await MeetingSchedule.findOne({
      _id: meetingId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });
    if (!meeting) throw httpError(404, 'Meeting not found');

    if (req.body?.title !== undefined) {
      const nextTitle = String(req.body.title || '').trim();
      if (!nextTitle) throw httpError(400, 'Title cannot be empty');
      meeting.title = nextTitle;
    }
    if (req.body?.agenda !== undefined) {
      meeting.agenda = String(req.body.agenda || '').trim();
    }
    if (req.body?.notes !== undefined) {
      meeting.notes = String(req.body.notes || '').trim();
    }
    if (req.body?.durationMinutes !== undefined) {
      meeting.durationMinutes = toNumber(req.body.durationMinutes, meeting.durationMinutes);
    }
    if (req.body?.scheduledFor !== undefined) {
      const nextDate = toDate(req.body.scheduledFor);
      if (!nextDate) throw httpError(400, 'Provide a valid meeting date/time');
      meeting.scheduledFor = nextDate;
    }
    if (req.body?.status !== undefined) {
      meeting.status = pickStatus(req.body.status, meeting.status);
    }
    if (req.body?.type !== undefined) {
      meeting.type = pickType(req.body.type, meeting.type);
    }
    if (req.body?.location !== undefined) {
      meeting.location = String(req.body.location || '').trim();
    }
    if (req.body?.meetingLink !== undefined) {
      meeting.meetingLink = String(req.body.meetingLink || '').trim();
    }
    if (req.body?.recordingUrl !== undefined) {
      meeting.recordingUrl = String(req.body.recordingUrl || '').trim();
    }
    if (req.body?.attendees !== undefined) {
      meeting.attendees = normaliseAttendees(req.body.attendees);
    }

    await meeting.save();
    res.json({
      ok: true,
      meeting: mapMeeting(meeting),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMeeting = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const meetingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(meetingId)) throw httpError(400, 'Invalid meeting id');

    const meeting = await MeetingSchedule.findOneAndDelete({
      _id: meetingId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });
    if (!meeting) throw httpError(404, 'Meeting not found');

    res.json({
      ok: true,
      deleted: true,
      meeting: mapMeeting(meeting),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listMeetings,
  scheduleMeeting,
  updateMeeting,
  deleteMeeting,
};
