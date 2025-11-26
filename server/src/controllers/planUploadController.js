import mongoose from 'mongoose';

import PlanUpload from '../models/PlanUpload.js';
import Asset from '../models/Asset.js';
import { determineOwnerScope, OWNER_TYPES } from '../utils/ownerScope.js';
import logger from '../utils/logger.js';
import { storePublicBuffer, storeEncryptedBuffer, generateDownloadToken } from '../services/storageService.js';
import { getOrCreateUserDriveFolder } from '../services/driveFolderService.js';

const httpError = (status, message, details) =>
  Object.assign(new Error(message), { statusCode: status, details });

const ALLOWED_STATUSES = new Set(['draft', 'published']);

const cleanString = (value) => (typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim());

const normaliseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(cleanString).filter(Boolean);
  }
  return String(value)
    .split(/[\n,;,]+/)
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

const pickBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

const buildDriveViewUrl = (driveFileId) => (driveFileId ? `https://drive.google.com/uc?id=${driveFileId}` : null);

const resolveAssetUrl = (asset) => {
  if (!asset) return null;
  const candidate = asset.publicUrl || asset.storagePath || buildDriveViewUrl(asset.driveFileId);
  if (candidate) return candidate;
  if (asset.secure && asset._id) {
    const token = generateDownloadToken(asset._id, { expiresIn: '30d' });
    return `/assets/${asset._id}/download?token=${token}`;
  }
  return null;
};

const mapMediaEntry = (entry = {}) => {
  const asset = entry.asset || {};
  const url = entry.url || resolveAssetUrl(asset);
  const thumbnail = entry.thumbnail || url || buildDriveViewUrl(asset.driveFileId);
  return {
    id: entry._id ? entry._id.toString() : undefined,
    assetId: asset?._id ? asset._id.toString() : null,
    url,
    thumbnail,
    kind: entry.kind || asset.kind || 'render',
    title: entry.title || asset.originalName || '',
    sizeBytes: entry.sizeBytes ?? asset.sizeBytes ?? null,
    mimeType: entry.mimeType || asset.mimeType || '',
    driveFileId: entry.driveFileId || asset.driveFileId || '',
    uploadedAt: entry.uploadedAt || entry.createdAt || null,
    secure: asset.secure === true,
    downloadUrl: asset?.secure && asset?._id
      ? `/assets/${asset._id}/download?token=${generateDownloadToken(asset._id, { expiresIn: '30d' })}`
      : url,
  };
};

const resolveScopeOrThrow = async (user, requestedType, messages = {}) => {
  const scope = await determineOwnerScope(user, requestedType);
  if (scope.ownerId) return scope;
  if (scope.error === 'unauthorized') throw httpError(401, 'Unauthorized');
  if (scope.ownerType === OWNER_TYPES.ASSOCIATE) {
    throw httpError(404, messages.missingAssociateMsg || 'Associate profile missing');
  }
  throw httpError(403, messages.missingFirmMsg || 'Join a firm to upload plans');
};

const mapPlanUpload = (plan) => ({
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
  status: plan.status || 'draft',
  publishedAt: plan.publishedAt || null,
  coverImage:
    plan.coverImage ||
    (Array.isArray(plan.media) && plan.media[0]?.thumbnail) ||
    (Array.isArray(plan.renderImages) ? plan.renderImages[0] : ''),
  media: Array.isArray(plan.media) ? plan.media.map(mapMediaEntry) : [],
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

const normalisePlanUpload = async (planId) => {
  const plan = await PlanUpload.findById(planId);
  if (!plan) {
    throw httpError(404, 'Plan upload not found');
  }
  const now = new Date();
  plan.metadata = {
    ...(plan.metadata || {}),
    lastValidatedAt: now,
    lintWarnings: plan.description?.length ? [] : ['Description missing'],
  };
  await plan.save();
  logger.info('Plan upload normalised inline', { planId });
  return plan.metadata;
};

export const listPlanUploads = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const plans = await PlanUpload.find({
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate({
        path: 'media.asset',
        select: 'publicUrl storagePath driveFileId mimeType sizeBytes key secure originalName kind',
      })
      .lean();

    res.json({
      ok: true,
      ownerType: scope.ownerType,
      planUploads: plans.map(mapPlanUpload),
    });
  } catch (error) {
    next(error);
  }
};

export const createPlanUpload = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const title = cleanString(req.body?.projectTitle);
    if (!title) throw httpError(400, 'Project title is required');
    const status = pickStatus(req.body?.status, 'draft');
    const payload = {
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
      projectTitle: title,
      category: cleanString(req.body?.category),
      subtype: cleanString(req.body?.subtype),
      primaryStyle: cleanString(req.body?.primaryStyle),
      conceptPlan: cleanString(req.body?.conceptPlan),
      renderImages: normaliseList(req.body?.renderImages),
      walkthrough: cleanString(req.body?.walkthrough),
      areaSqft: toNumber(req.body?.areaSqft),
      floors: toNumber(req.body?.floors),
      materials: normaliseList(req.body?.materials),
      climate: cleanString(req.body?.climate),
      designRate: toNumber(req.body?.designRate),
      constructionCost: toNumber(req.body?.constructionCost),
      licenseType: cleanString(req.body?.licenseType),
      delivery: cleanString(req.body?.delivery),
      description: cleanString(req.body?.description),
      tags: normaliseList(req.body?.tags),
      createdBy: req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined,
      status,
      publishedAt: status === 'published' ? new Date() : undefined,
      coverImage: cleanString(req.body?.coverImage),
    };
    const plan = await PlanUpload.create(payload);
    await normalisePlanUpload(plan._id.toString());
    res.status(201).json({ ok: true, planUpload: mapPlanUpload(plan) });
  } catch (error) {
    next(error);
  }
};

export const updatePlanUpload = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const planId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(planId)) throw httpError(400, 'Invalid plan id');
    const plan = await PlanUpload.findOne({
      _id: planId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });
    if (!plan) throw httpError(404, 'Plan upload not found');

    if (req.body?.projectTitle !== undefined) {
      const title = cleanString(req.body.projectTitle);
      if (!title) throw httpError(400, 'Project title cannot be empty');
      plan.projectTitle = title;
    }
    if (req.body?.category !== undefined) plan.category = cleanString(req.body.category);
    if (req.body?.subtype !== undefined) plan.subtype = cleanString(req.body.subtype);
    if (req.body?.primaryStyle !== undefined) plan.primaryStyle = cleanString(req.body.primaryStyle);
    if (req.body?.conceptPlan !== undefined) plan.conceptPlan = cleanString(req.body.conceptPlan);
    if (req.body?.renderImages !== undefined) plan.renderImages = normaliseList(req.body.renderImages);
    if (req.body?.walkthrough !== undefined) plan.walkthrough = cleanString(req.body.walkthrough);
    if (req.body?.areaSqft !== undefined) plan.areaSqft = toNumber(req.body.areaSqft);
    if (req.body?.floors !== undefined) plan.floors = toNumber(req.body.floors);
    if (req.body?.materials !== undefined) plan.materials = normaliseList(req.body.materials);
    if (req.body?.climate !== undefined) plan.climate = cleanString(req.body.climate);
    if (req.body?.designRate !== undefined) plan.designRate = toNumber(req.body.designRate);
    if (req.body?.constructionCost !== undefined) plan.constructionCost = toNumber(req.body.constructionCost);
    if (req.body?.licenseType !== undefined) plan.licenseType = cleanString(req.body.licenseType);
    if (req.body?.delivery !== undefined) plan.delivery = cleanString(req.body.delivery);
    if (req.body?.description !== undefined) plan.description = cleanString(req.body.description);
    if (req.body?.tags !== undefined) plan.tags = normaliseList(req.body.tags);
    if (req.body?.status !== undefined) {
      const nextStatus = pickStatus(req.body.status, plan.status);
      plan.status = nextStatus;
      if (nextStatus === 'published' && !plan.publishedAt) {
        plan.publishedAt = new Date();
      }
    }
    if (req.body?.coverImage !== undefined) {
      plan.coverImage = cleanString(req.body.coverImage);
    }

    await plan.save();
    await plan.populate({
      path: 'media.asset',
      select: 'publicUrl storagePath driveFileId mimeType sizeBytes key secure originalName kind',
    });
    await normalisePlanUpload(plan._id.toString());
    res.json({ ok: true, planUpload: mapPlanUpload(plan) });
  } catch (error) {
    next(error);
  }
};

export const deletePlanUpload = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const planId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(planId)) throw httpError(400, 'Invalid plan id');
    const plan = await PlanUpload.findOneAndDelete({
      _id: planId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });
    if (!plan) throw httpError(404, 'Plan upload not found');
    res.json({ ok: true, deleted: true, planUpload: mapPlanUpload(plan) });
  } catch (error) {
    next(error);
  }
};

export const attachPlanMedia = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType || req.query.ownerType);
    const planId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(planId)) throw httpError(400, 'Invalid plan id');
    const plan = await PlanUpload.findOne({
      _id: planId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });
    if (!plan) throw httpError(404, 'Plan upload not found');

    const file = req.file;
    if (!file) throw httpError(400, 'File is required');

    const kind = cleanString(req.body?.kind) || 'render';
    const title = cleanString(req.body?.title) || file.originalname;
    const secure = pickBoolean(req.body?.secure, false);
    const useDrive = (process.env.ASSET_STORAGE_PROVIDER || 'drive').toLowerCase() === 'drive';
    const targetDriveFolderId = useDrive
      ? await getOrCreateUserDriveFolder(req.user, { parentId: process.env.GOOGLE_DRIVE_FOLDER_ID })
      : null;

    const storageResult = secure
      ? await storeEncryptedBuffer(file.buffer, {
          filename: file.originalname,
          mimeType: file.mimetype,
          driveFolderId: targetDriveFolderId,
        })
      : await storePublicBuffer(file.buffer, {
          filename: file.originalname,
          mimeType: file.mimetype,
          driveFolderId: targetDriveFolderId,
        });

    const assetPayload = {
      key: storageResult.key,
      storageProvider: storageResult.storageProvider || (secure ? 'local' : 'remote'),
      storagePath: storageResult.storagePath,
      originalName: storageResult.originalName || file.originalname,
      mimeType: storageResult.mimeType || file.mimetype,
      sizeBytes: storageResult.sizeBytes ?? file.size,
      checksum: storageResult.checksum,
      secure,
      uploader: req.user?._id,
      planUpload: plan._id,
      kind,
      status: 'ready',
      driveFileId: storageResult.driveFileId,
      driveFolderId: storageResult.driveFolderId || targetDriveFolderId,
      publicUrl: storageResult.publicUrl,
      algorithm: secure ? 'aes-256-gcm' : undefined,
      iv: secure ? storageResult.iv : undefined,
      authTag: secure ? storageResult.authTag : undefined,
      metadata: { workspace: scope.ownerType },
    };

    const asset = await Asset.create(assetPayload);
    const url = resolveAssetUrl(asset);
    const mediaEntry = {
      asset: asset._id,
      url,
      thumbnail: url,
      kind,
      title,
      sizeBytes: asset.sizeBytes,
      mimeType: asset.mimeType,
      driveFileId: asset.driveFileId,
    };
    plan.media = Array.isArray(plan.media) ? [...plan.media, mediaEntry] : [mediaEntry];
    if (!plan.coverImage && mediaEntry.thumbnail) {
      plan.coverImage = mediaEntry.thumbnail;
    }
    if (!secure && url && kind === 'render') {
      const current = Array.isArray(plan.renderImages) ? plan.renderImages : [];
      plan.renderImages = Array.from(new Set([...current, url]));
    }

    await plan.save();
    await plan.populate({
      path: 'media.asset',
      select: 'publicUrl storagePath driveFileId mimeType sizeBytes key secure originalName kind',
    });
    await normalisePlanUpload(plan._id.toString());
    const latestMedia = plan.media[plan.media.length - 1];
    res.status(201).json({
      ok: true,
      media: mapMediaEntry(latestMedia),
      planUpload: mapPlanUpload(plan),
    });
  } catch (error) {
    next(error);
  }
};

export const mapPlanUploadResponse = mapPlanUpload;

export default {
  listPlanUploads,
  createPlanUpload,
  updatePlanUpload,
  deletePlanUpload,
  attachPlanMedia,
  mapPlanUploadResponse,
};
