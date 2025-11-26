import mongoose from 'mongoose';

import AssociateProfile from '../models/AssociateProfile.js';
import Firm from '../models/Firm.js';
import ServicePack from '../models/ServicePack.js';
import MeetingSchedule from '../models/MeetingSchedule.js';
import PlanUpload from '../models/PlanUpload.js';
import WorkspaceDownload from '../models/WorkspaceDownload.js';
import { determineOwnerScope, OWNER_TYPES } from '../utils/ownerScope.js';
import { mapPlanUploadResponse } from './planUploadController.js';

const httpError = (status, message, details) =>
  Object.assign(new Error(message), { statusCode: status, details });

const mapServicePack = (pack) => ({
  id: pack._id.toString(),
  title: pack.title,
  summary: pack.summary || '',
  price: pack.price ?? null,
  currency: pack.currency || 'USD',
  deliverables: Array.isArray(pack.deliverables) ? pack.deliverables : [],
  duration: pack.duration || '',
  availability: pack.availability || '',
  meetingPrep: pack.meetingPrep || '',
  status: pack.status || 'draft',
  updatedAt: pack.updatedAt,
});

const mapMeeting = (meeting) => ({
  id: meeting._id.toString(),
  title: meeting.title,
  status: meeting.status || 'scheduled',
  type: meeting.type || 'consultation',
  scheduledFor: meeting.scheduledFor,
  durationMinutes: meeting.durationMinutes ?? null,
  meetingLink: meeting.meetingLink || '',
  location: meeting.location || '',
  recordingUrl: meeting.recordingUrl || '',
  attendees: Array.isArray(meeting.attendees) ? meeting.attendees : [],
});

const mapDownload = (download) => ({
  id: download._id.toString(),
  label: download.label,
  description: download.description || '',
  tag: download.tag || '',
  accessLevel: download.accessLevel || 'client',
  status: download.status || 'draft',
  fileUrl: download.fileUrl || '',
  expiresAt: download.expiresAt,
  downloadCode: download.downloadCode || '',
  notes: download.notes || '',
  updatedAt: download.updatedAt,
});

const buildProfileSnapshot = (profile = {}, ownerType) => {
  if (ownerType === OWNER_TYPES.FIRM) {
    return profile
      ? {
          name: profile.name,
          tagline: profile.tagline,
          logo: profile.logo,
          location: profile.location,
          updatedAt: profile.updatedAt,
        }
      : null;
  }
  return profile
    ? {
        fullName: profile.fullName || profile.firmName || null,
        title: profile.title || '',
        location: profile.location || '',
        availability: profile.availability || '',
        timezone: profile.timezone || '',
        contactEmail: profile.contactEmail || profile.contact?.email || '',
        deliverables: profile.deliverables || [],
        heroImage: profile.heroImage || profile.coverImage || '',
        profileImage: profile.profileImage || profile.avatar || '',
        registrationId: profile.registrationId || '',
        verificationDoc: profile.verificationDoc || '',
        firmType: profile.firmType || '',
        teamSize: profile.teamSize || null,
        primaryCategories: profile.primaryCategories || [],
        primaryStyles: profile.primaryStyles || [],
        avgDesignRate: profile.avgDesignRate || null,
        servicesOffered: profile.servicesOffered || [],
        portfolioLink: profile.portfolioLink || '',
        portfolioUpload: profile.portfolioUpload || '',
      }
    : null;
};

export const getStudioHub = async (req, res, next) => {
  try {
    const scope = await determineOwnerScope(req.user, req.query.ownerType);
    if (!scope.ownerId) {
      throw scope.error === 'unauthorized'
        ? httpError(401, 'Unauthorized')
        : httpError(403, 'Link a workspace to continue');
    }

    const filters = { ownerType: scope.ownerType, ownerId: new mongoose.Types.ObjectId(scope.ownerId) };
    const [planUploads, servicePacks, meetings, downloads] = await Promise.all([
      PlanUpload.find(filters)
        .sort({ updatedAt: -1 })
        .limit(24)
        .populate({
          path: 'media.asset',
          select: 'publicUrl storagePath driveFileId mimeType sizeBytes key secure originalName kind',
        })
        .lean(),
      ServicePack.find(filters).sort({ updatedAt: -1 }).limit(12).lean(),
      MeetingSchedule.find(filters).sort({ scheduledFor: 1 }).limit(12).lean(),
      WorkspaceDownload.find(filters).sort({ updatedAt: -1 }).limit(20).lean(),
    ]);

    let profileDoc = null;
    if (scope.ownerType === OWNER_TYPES.ASSOCIATE) {
      profileDoc = await AssociateProfile.findById(scope.ownerId).lean();
    } else {
      profileDoc = await Firm.findById(scope.ownerId).lean();
    }

    const workHistory = scope.ownerType === OWNER_TYPES.ASSOCIATE && profileDoc?.workHistory
      ? profileDoc.workHistory
      : [];
    const toolset =
      scope.ownerType === OWNER_TYPES.ASSOCIATE
        ? (profileDoc?.toolset?.length ? profileDoc.toolset : profileDoc?.softwares || [])
        : [];
    const deliverables =
      scope.ownerType === OWNER_TYPES.ASSOCIATE
        ? profileDoc?.deliverables || []
        : servicePacks.flatMap((pack) => pack.deliverables || []);
    const portfolioMedia =
      scope.ownerType === OWNER_TYPES.ASSOCIATE ? profileDoc?.portfolioMedia || [] : [];

    const publishedPlans = planUploads.filter((plan) => (plan.status || 'draft') === 'published').length;
    const upcomingConsultations = meetings.filter((meeting) => meeting.status === 'scheduled').length;

    res.json({
      ok: true,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId.toString(),
      profile: buildProfileSnapshot(profileDoc, scope.ownerType),
      stats: {
        totalPlans: planUploads.length,
        publishedPlans,
        upcomingConsultations,
        deliverableCount: deliverables.length,
      },
      planUploads: planUploads.map(mapPlanUploadResponse),
      servicePacks: servicePacks.map(mapServicePack),
      meetings: meetings.map(mapMeeting),
      downloads: downloads.map(mapDownload),
      workHistory,
      toolset,
      deliverables,
      portfolioMedia,
      profileDetails: scope.ownerType === OWNER_TYPES.ASSOCIATE ? profileDoc : null,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getStudioHub,
};
