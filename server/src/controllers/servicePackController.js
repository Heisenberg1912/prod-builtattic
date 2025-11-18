import mongoose from 'mongoose';

import ServicePack from '../models/ServicePack.js';
import { determineOwnerScope, OWNER_TYPES } from '../utils/ownerScope.js';

const ALLOWED_STATUSES = new Set(['draft', 'published']);

const httpError = (status, message, details) =>
  Object.assign(new Error(message), { statusCode: status, details });

const resolveScopeOrThrow = async (user, requestedType, messages = {}) => {
  const scope = await determineOwnerScope(user, requestedType);
  if (scope.ownerId) return scope;
  if (scope.error === 'unauthorized') throw httpError(401, 'Unauthorized');
  if (scope.ownerType === OWNER_TYPES.ASSOCIATE) {
    throw httpError(404, messages.missingAssociateMsg || 'Associate profile missing');
  }
  throw httpError(403, messages.missingFirmMsg || 'Join a firm to manage service packs');
};

const normaliseList = (value) => {
  if (!value && value !== 0) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry == null ? '' : String(entry).trim()))
      .filter(Boolean);
  }
  return String(value)
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const pickStatus = (value, fallback = 'draft') => {
  const normalized = String(value || '').toLowerCase();
  return ALLOWED_STATUSES.has(normalized) ? normalized : fallback;
};

const sanitizeCurrency = (value = 'USD') => {
  const trimmed = String(value || 'USD').trim().toUpperCase();
  return trimmed || 'USD';
};

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
  createdAt: pack.createdAt,
  updatedAt: pack.updatedAt,
});

export const listServicePacks = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const packs = await ServicePack.find({
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      ok: true,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId.toString(),
      servicePacks: packs.map(mapServicePack),
    });
  } catch (error) {
    next(error);
  }
};

export const createServicePack = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const title = String(req.body?.title || '').trim();
    if (!title) throw httpError(400, 'Title is required');

    const payload = {
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
      title,
      summary: String(req.body?.summary || '').trim(),
      price: toNumber(req.body?.price),
      currency: sanitizeCurrency(req.body?.currency),
      deliverables: normaliseList(req.body?.deliverables),
      duration: String(req.body?.duration || '').trim(),
      availability: String(req.body?.availability || '').trim(),
      meetingPrep: String(req.body?.meetingPrep || '').trim(),
      status: pickStatus(req.body?.status, 'draft'),
      createdBy: req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined,
    };

    const pack = await ServicePack.create(payload);
    res.status(201).json({
      ok: true,
      servicePack: mapServicePack(pack),
    });
  } catch (error) {
    next(error);
  }
};

export const updateServicePack = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const packId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(packId)) throw httpError(400, 'Invalid service pack id');

    const pack = await ServicePack.findOne({
      _id: packId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });

    if (!pack) throw httpError(404, 'Service pack not found');

    if (req.body?.title !== undefined) {
      const title = String(req.body.title || '').trim();
      if (!title) throw httpError(400, 'Title cannot be empty');
      pack.title = title;
    }
    if (req.body?.summary !== undefined) {
      pack.summary = String(req.body.summary || '').trim();
    }
    if (req.body?.price !== undefined) {
      pack.price = toNumber(req.body.price);
    }
    if (req.body?.currency !== undefined) {
      pack.currency = sanitizeCurrency(req.body.currency);
    }
    if (req.body?.deliverables !== undefined) {
      pack.deliverables = normaliseList(req.body.deliverables);
    }
    if (req.body?.duration !== undefined) {
      pack.duration = String(req.body.duration || '').trim();
    }
    if (req.body?.availability !== undefined) {
      pack.availability = String(req.body.availability || '').trim();
    }
    if (req.body?.meetingPrep !== undefined) {
      pack.meetingPrep = String(req.body.meetingPrep || '').trim();
    }
    if (req.body?.status !== undefined) {
      pack.status = pickStatus(req.body.status, pack.status);
    }

    await pack.save();
    res.json({
      ok: true,
      servicePack: mapServicePack(pack),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteServicePack = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const packId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(packId)) throw httpError(400, 'Invalid service pack id');

    const pack = await ServicePack.findOneAndDelete({
      _id: packId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });

    if (!pack) throw httpError(404, 'Service pack not found');

    res.json({
      ok: true,
      deleted: true,
      servicePack: mapServicePack(pack),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listServicePacks,
  createServicePack,
  updateServicePack,
  deleteServicePack,
};
