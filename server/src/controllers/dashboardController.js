import mongoose from 'mongoose';

import AssociateProfile from '../models/AssociateProfile.js';
import Firm from '../models/Firm.js';
import Lead from '../models/Lead.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import Rating from '../models/Rating.js';
import ServicePack from '../models/ServicePack.js';
import MeetingSchedule from '../models/MeetingSchedule.js';
import PlanUpload from '../models/PlanUpload.js';
import {
  ensureAssociateProfile as provisionAssociateProfile,
  ensureFirmMembership as provisionFirmMembership,
} from '../services/roleProvisioning.js';

const httpError = (status, message, details) =>
  Object.assign(new Error(message), { statusCode: status, details });

const profileFields = [
  'title',
  'summary',
  'location',
  'timezone',
  'experienceYears',
  'completedProjects',
  'hourlyRate',
  'rates.hourly',
  'languages',
  'softwares',
  'specialisations',
  'portfolioLinks',
];

const resolveValue = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

const calculateCompleteness = (profile) => {
  if (!profile) return 0;
  const filled = profileFields.filter((field) => {
    const value = resolveValue(profile, field);
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return !Number.isNaN(value) && value !== 0;
    if (!value) return false;
    return String(value).trim().length > 0;
  }).length;
  return Math.round((filled / profileFields.length) * 100);
};

const mapLead = (lead) => ({
  id: lead._id.toString(),
  title: lead.title,
  status: lead.status,
  contact: lead.contact || null,
  updatedAt: lead.updatedAt,
});

const mapOrderForUser = (order, userId) => {
  const total = order.amounts?.grand ?? order.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const items = order.items.map((item) => ({
    title: item.title || item.product?.title || 'Studio asset',
    firm: item.firm ? item.firm.toString() : null,
    qty: item.qty,
    lineTotal: item.lineTotal,
  }));
  return {
    id: order._id.toString(),
    status: order.status,
    createdAt: order.createdAt,
    total,
    currency: order.items[0]?.currency || order.amounts?.currency || 'USD',
    items,
    owner: order.user?.toString?.() || userId.toString(),
  };
};

const buildAssociateActions = (profile, metrics) => {
  const actions = [];
  if (metrics.profileCompleteness < 85) {
    actions.push({
      title: 'Complete your Skill Studio card',
      detail: 'Fill in missing expertise, languages, or portfolio links to reach 100% readiness.',
    });
  }
  if (!profile?.portfolioLinks?.length) {
    actions.push({
      title: 'Add portfolio links',
      detail: 'Attach Behance, LinkedIn, or case studies so buyers can vet your work faster.',
    });
  }
  if (!profile?.availability) {
    actions.push({
      title: 'Set availability',
      detail: 'Share when you can onboard new work so the operations team can route leads.',
    });
  }
  if (actions.length === 0) {
    actions.push({
      title: 'Everything looks great',
      detail: 'Keep an eye on new leads in your pipeline and refresh your profile monthly.',
    });
  }
  return actions;
};

const resolveFirmMembership = (user, allowedRoles = ['owner', 'admin', 'associate']) => {
  const memberships = (user?.memberships || []).map((membership) => ({
    firm: membership.firm?.toString?.() || membership.firm,
    role: String(membership.role || '').toLowerCase(),
  }));
  if (!memberships.length) return null;
  const preferred = memberships.find((entry) => allowedRoles.includes(entry.role));
  return preferred || memberships[0];
};

const ensureFirmMembership = async (user, allowedRoles = ['owner', 'admin']) =>
  provisionFirmMembership(user, allowedRoles);

const mapProduct = (product) => ({
  id: product._id.toString(),
  title: product.title,
  status: product.status,
  price: product.price ?? product.pricing?.basePrice ?? null,
  currency: product.pricing?.currency || product.currency || 'USD',
  updatedAt: product.updatedAt,
  kind: product.kind,
});

const mapAsset = (asset) => ({
  id: asset._id.toString(),
  filename: asset.filename || asset.originalName || asset.key,
  kind: asset.kind,
  createdAt: asset.createdAt,
  secure: asset.secure,
});

const mapServicePackEntry = (pack) => ({
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

const mapMeetingScheduleEntry = (meeting) => ({
  id: meeting._id.toString(),
  title: meeting.title,
  status: meeting.status,
  scheduledFor: meeting.scheduledFor,
  durationMinutes: meeting.durationMinutes ?? null,
  meetingLink: meeting.meetingLink || '',
  attendees: Array.isArray(meeting.attendees) ? meeting.attendees : [],
  agenda: meeting.agenda || '',
});

const mapPlanUploadEntry = (plan) => ({
  id: plan._id.toString(),
  projectTitle: plan.projectTitle,
  category: plan.category || '',
  subtype: plan.subtype || '',
  primaryStyle: plan.primaryStyle || '',
  conceptPlan: plan.conceptPlan || '',
  renderImages: Array.isArray(plan.renderImages) ? plan.renderImages : [],
  walkthrough: plan.walkthrough || '',
  areaSqft: plan.areaSqft ?? null,
  floors: plan.floors ?? null,
  materials: Array.isArray(plan.materials) ? plan.materials : [],
  climate: plan.climate || '',
  designRate: plan.designRate ?? null,
  constructionCost: plan.constructionCost ?? null,
  licenseType: plan.licenseType || '',
  delivery: plan.delivery || '',
  description: plan.description || '',
  tags: Array.isArray(plan.tags) ? plan.tags : [],
});

const obfuscateAuthor = (email) => {
  if (!email) return 'Marketplace buyer';
  const [name, domain] = email.split('@');
  if (!domain) {
    return email;
  }
  if (!name) {
    return `***@${domain}`;
  }
  const visible = name.length <= 2 ? name : name.slice(0, 2);
  return `${visible}***@${domain}`;
};

const mapFeedbackEntries = (entries = []) =>
  entries
    .filter((entry) => entry && (entry.comment || typeof entry.score === 'number'))
    .map((entry) => ({
      id: entry._id.toString(),
      score: entry.score || 0,
      comment: entry.comment || '',
      author: entry.user?.email ? obfuscateAuthor(entry.user.email) : 'Marketplace buyer',
      updatedAt: entry.updatedAt || entry.createdAt,
    }));

const buildFeedbackSummary = async (targetType, targetId, entity) => {
  if (!targetId) {
    return {
      average: typeof entity?.rating === 'number' ? Number(entity.rating.toFixed(1)) : null,
      count: entity?.ratingsCount || 0,
      recent: [],
    };
  }

  const recentEntries = await Rating.find({ targetType, target: targetId })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('score comment updatedAt createdAt user')
    .populate('user', 'email')
    .lean();

  const computedAverage = recentEntries.length
    ? Number(
        (
          recentEntries.reduce((sum, entry) => sum + (Number(entry.score) || 0), 0) /
          recentEntries.length
        ).toFixed(2)
      )
    : null;
  const average = typeof entity?.rating === 'number' ? Number(entity.rating.toFixed(1)) : computedAverage;
  const count = Number.isFinite(entity?.ratingsCount) ? entity.ratingsCount : recentEntries.length;

  return {
    average: average ?? null,
    count: count || 0,
    recent: mapFeedbackEntries(recentEntries),
  };
};

const attachFirmProfile = (firm) => {
  if (!firm) return null;
  const doc = firm.toObject ? firm.toObject() : firm;
  if (doc.profile && doc.profile.updatedAt) {
    return doc.profile;
  }
  return { updatedAt: doc.updatedAt, name: doc.name, tagline: doc.tagline };
};

const ensureAssociateProfile = async (userId) =>
  provisionAssociateProfile({ _id: userId }) || AssociateProfile.findOne({ user: userId });

export const getAssociateDashboard = async (req, res, next) => {
  try {
    if (!req.user?._id) throw httpError(401, 'Unauthorized');
    await ensureAssociateProfile(req.user._id);
    const profilePromise = AssociateProfile.findOne({ user: req.user._id }).lean();
    const leadsPromise = Lead.find({ ownerSalesId: req.user._id }).sort({ updatedAt: -1 }).limit(6).lean();
    const ordersPromise = Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(6).lean();
    const [profile, leads, orders] = await Promise.all([profilePromise, leadsPromise, ordersPromise]);

    let servicePacks = [];
    let meetings = [];
    let planUploads = [];
    if (profile?._id) {
      [servicePacks, meetings, planUploads] = await Promise.all([
        ServicePack.find({ ownerType: 'associate', ownerId: profile._id })
          .sort({ updatedAt: -1 })
          .limit(6)
          .lean(),
        MeetingSchedule.find({ ownerType: 'associate', ownerId: profile._id })
          .sort({ scheduledFor: 1 })
          .limit(6)
          .lean(),
        PlanUpload.find({ ownerType: 'associate', ownerId: profile._id })
          .sort({ updatedAt: -1 })
          .limit(12)
          .lean(),
      ]);
    }

    const metrics = {
      profileCompleteness: calculateCompleteness(profile),
      hourlyRate: profile?.hourlyRate ?? profile?.rates?.hourly ?? null,
      activeLeads: leads.filter((lead) => lead.status !== 'won' && lead.status !== 'lost').length,
      applicationsTracked: orders.length,
      alerts: leads.filter((lead) => lead.status === 'proposal').length,
    };

    const feedback = await buildFeedbackSummary('associate', profile?._id, profile);

    const response = {
      ok: true,
      profile: profile || null,
      metrics,
      leads: leads.map(mapLead),
      applications: orders.map((order) => mapOrderForUser(order, req.user._id)),
      nextActions: buildAssociateActions(profile, metrics),
      availability: {
        timezone: profile?.timezone || req.user?.settings?.profile?.timezone || null,
        note: profile?.availability || null,
      },
      feedback,
      servicePacks: servicePacks.map(mapServicePackEntry),
      meetings: meetings.map(mapMeetingScheduleEntry),
      planUploads: planUploads.map(mapPlanUploadEntry),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getFirmDashboard = async (req, res, next) => {
  try {
    if (!req.user?._id) throw httpError(401, 'Unauthorized');
    const membership = (await ensureFirmMembership(req.user, ['owner', 'admin'])) ||
      resolveFirmMembership(req.user, ['owner', 'admin']);
    if (!membership || !membership.firm) {
      throw httpError(403, 'Join a firm to access the Design Studio dashboard');
    }
    const firmId = new mongoose.Types.ObjectId(membership.firm);
    const [firm, studios, orders] = await Promise.all([
      Firm.findById(firmId).lean(),
      Product.find({ firm: firmId, kind: 'studio' }).sort({ updatedAt: -1 }).limit(12).lean(),
      Order.find({ 'items.firm': firmId }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    if (!firm) throw httpError(404, 'Firm not found');

    const assets = await Asset.find({ product: { $in: studios.map((studio) => studio._id) } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const published = studios.filter((studio) => studio.status === 'published');
    const draft = studios.filter((studio) => studio.status !== 'published');
    const publishedValue = published.reduce(
      (sum, studio) => sum + (studio.price ?? studio.pricing?.basePrice ?? 0),
      0,
    );

    const mappedOrders = orders.map((order) => mapOrderForUser(order, order.user));
    mappedOrders.forEach((order) => {
      order.items = order.items.filter((item) => item.firm === membership.firm);
    });

    const feedback = await buildFeedbackSummary('firm', firmId, firm);
    const [servicePacks, meetings, planUploads] = await Promise.all([
      ServicePack.find({ ownerType: 'firm', ownerId: firmId }).sort({ updatedAt: -1 }).limit(6).lean(),
      MeetingSchedule.find({ ownerType: 'firm', ownerId: firmId }).sort({ scheduledFor: 1 }).limit(6).lean(),
      PlanUpload.find({ ownerType: 'firm', ownerId: firmId }).sort({ updatedAt: -1 }).limit(12).lean(),
    ]);

    res.json({
      ok: true,
      firm,
      profile: attachFirmProfile(firm),
      metrics: {
        studiosPublished: published.length,
        draftStudios: draft.length,
        publishedValue,
        documents: assets.length,
        recentOrders: mappedOrders.length,
      },
      studios: studios.map(mapProduct),
      documents: assets.map(mapAsset),
      orders: mappedOrders,
      feedback,
      servicePacks: servicePacks.map(mapServicePackEntry),
      meetings: meetings.map(mapMeetingScheduleEntry),
      planUploads: planUploads.map(mapPlanUploadEntry),
      nextActions: [
        {
          title: 'Publish a new design bundle',
          detail: 'Studios with recent uploads get promoted on the Design Studio landing page.',
        },
        {
          title: 'Refresh your firm profile',
          detail: 'Update hero images and partner logos so prospects trust your listing.',
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorDashboard = async (req, res, next) => {
  try {
    if (!req.user?._id) throw httpError(401, 'Unauthorized');
    const membership = (await ensureFirmMembership(req.user, ['owner', 'admin'])) ||
      resolveFirmMembership(req.user, ['owner', 'admin']);
    if (!membership || !membership.firm) {
      throw httpError(403, 'Link your vendor firm to access Material Studio');
    }
    const firmId = new mongoose.Types.ObjectId(membership.firm);
    const [firm, materials, orders, leads] = await Promise.all([
      Firm.findById(firmId).lean(),
      Product.find({ firm: firmId, kind: 'material' })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),
      Order.find({ 'items.firm': firmId }).sort({ createdAt: -1 }).limit(8).lean(),
      Lead.find({ ownerSalesId: req.user._id }).sort({ updatedAt: -1 }).limit(6).lean(),
    ]);

    if (!firm) throw httpError(404, 'Vendor firm not found');

    const inventoryCount = materials.reduce((sum, material) => sum + (material.inventory || 0), 0);
    const mappedOrders = orders.map((order) => mapOrderForUser(order, order.user));

    res.json({
      ok: true,
      firm,
      profile: attachFirmProfile(firm),
      metrics: {
        listedSkus: materials.length,
        inventoryCount,
        openOrders: mappedOrders.filter((order) => order.status !== 'fulfilled').length,
        pipelineLeads: leads.length,
      },
      materials: materials.map(mapProduct),
      orders: mappedOrders,
      leads: leads.map(mapLead),
      nextActions: [
        {
          title: 'Sync logistics data',
          detail: 'Add lead time and MOQ for each SKU so procurement teams can filter you in Material Studio.',
        },
        {
          title: 'Respond to pipeline leads',
          detail: 'Follow up on the newest construction requests before they expire.',
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};
