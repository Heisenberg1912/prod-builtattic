import mongoose from 'mongoose';

import WorkspaceDownload from '../models/WorkspaceDownload.js';
import { determineOwnerScope } from '../utils/ownerScope.js';
import logger from '../utils/logger.js';

const ACCESS_LEVELS = new Set(['internal', 'client', 'public']);
const STATUS_VALUES = new Set(['draft', 'processing', 'released', 'failed']);

const httpError = (status, message, details) =>
  Object.assign(new Error(message), { statusCode: status, details });

const resolveScopeOrThrow = async (user, requestedType) => {
  const scope = await determineOwnerScope(user, requestedType);
  if (scope.ownerId) return scope;
  if (scope.error === 'unauthorized') throw httpError(401, 'Unauthorized');
  if (scope.error === 'associate_missing') {
    throw httpError(404, 'Associate profile missing');
  }
  throw httpError(403, 'Join a firm to use downloads');
};

const normalizeList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : null))
    .filter(Boolean);
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sanitizeAccess = (value, fallback = 'client') => {
  const normalized = String(value || '').toLowerCase();
  return ACCESS_LEVELS.has(normalized) ? normalized : fallback;
};

const sanitizeStatus = (value, fallback = 'draft') => {
  const normalized = String(value || '').toLowerCase();
  return STATUS_VALUES.has(normalized) ? normalized : fallback;
};

const mapDownload = (doc) => ({
  id: doc._id.toString(),
  label: doc.label,
  description: doc.description || '',
  tag: doc.tag || 'WD-W3',
  accessLevel: doc.accessLevel || 'client',
  status: doc.status || 'draft',
  fileUrl: doc.fileUrl || '',
  expiresAt: doc.expiresAt,
  downloadCode: doc.downloadCode || '',
  notes: doc.notes || '',
  metadata: doc.metadata || null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const wait = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveArtifactMeta = (doc) => {
  const suffix = doc.tag || doc._id.toString().slice(-6);
  const artifactUrl = `${doc.fileUrl}?bundle=${suffix}`;
  const packageSize = Math.max(400_000, Math.round(Math.random() * 5_000_000));
  return { artifactUrl, packageSize };
};

const processWorkspaceDownloadInline = async (downloadId, options = {}) => {
  const doc = await WorkspaceDownload.findById(downloadId);
  if (!doc) {
    throw httpError(404, 'Workspace download not found');
  }

  doc.status = 'processing';
  doc.metadata = {
    ...(doc.metadata || {}),
    jobHistory: [
      ...(Array.isArray(doc.metadata?.jobHistory) ? doc.metadata.jobHistory : []),
      {
        status: 'processing',
        startedAt: new Date(),
      },
    ],
  };
  await doc.save();

  await wait(options.delayMs ?? 150);

  const artifact = resolveArtifactMeta(doc);
  doc.status = 'released';
  doc.metadata = {
    ...(doc.metadata || {}),
    artifactUrl: artifact.artifactUrl,
    artifactSize: artifact.packageSize,
    lastProcessedAt: new Date(),
  };
  await doc.save();

  logger.info('Workspace download processed inline', {
    downloadId,
    artifactUrl: artifact.artifactUrl,
  });

  return artifact;
};

export const listWorkspaceDownloads = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 50);
    const downloads = await WorkspaceDownload.find({
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
      downloads: downloads.map(mapDownload),
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkspaceDownload = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const label = String(req.body?.label || '').trim();
    if (!label) throw httpError(400, 'Label is required');
    const fileUrl = String(req.body?.fileUrl || '').trim();
    if (!fileUrl) throw httpError(400, 'File URL is required');

    const payload = {
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
      label,
      description: String(req.body?.description || '').trim(),
      tag: req.body?.tag ? String(req.body.tag).trim() : undefined,
      accessLevel: sanitizeAccess(req.body?.accessLevel),
      status: sanitizeStatus(req.body?.status),
      fileUrl,
      downloadCode: req.body?.downloadCode ? String(req.body.downloadCode).trim() : undefined,
      expiresAt: toDate(req.body?.expiresAt),
      notes: String(req.body?.notes || '').trim(),
      metadata: req.body?.metadata || undefined,
      createdBy: req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined,
    };

    const doc = await WorkspaceDownload.create(payload);
    res.status(201).json({
      ok: true,
      download: mapDownload(doc),
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspaceDownload = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType);
    const downloadId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(downloadId)) {
      throw httpError(400, 'Invalid download id');
    }
    const doc = await WorkspaceDownload.findOne({
      _id: downloadId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });
    if (!doc) throw httpError(404, 'Download not found');

    if (req.body?.label !== undefined) {
      const label = String(req.body.label || '').trim();
      if (!label) throw httpError(400, 'Label cannot be empty');
      doc.label = label;
    }
    if (req.body?.description !== undefined) {
      doc.description = String(req.body.description || '').trim();
    }
    if (req.body?.fileUrl !== undefined) {
      const fileUrl = String(req.body.fileUrl || '').trim();
      if (!fileUrl) throw httpError(400, 'File URL cannot be empty');
      doc.fileUrl = fileUrl;
    }
    if (req.body?.tag !== undefined) {
      doc.tag = String(req.body.tag || '').trim() || doc.tag;
    }
    if (req.body?.accessLevel !== undefined) {
      doc.accessLevel = sanitizeAccess(req.body.accessLevel, doc.accessLevel);
    }
    if (req.body?.status !== undefined) {
      doc.status = sanitizeStatus(req.body.status, doc.status);
    }
    if (req.body?.downloadCode !== undefined) {
      doc.downloadCode = String(req.body.downloadCode || '').trim();
    }
    if (req.body?.expiresAt !== undefined) {
      doc.expiresAt = toDate(req.body.expiresAt);
    }
    if (req.body?.notes !== undefined) {
      doc.notes = String(req.body.notes || '').trim();
    }
    if (req.body?.metadata !== undefined) {
      doc.metadata = req.body.metadata;
    }

    await doc.save();
    res.json({
      ok: true,
      download: mapDownload(doc),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspaceDownload = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const downloadId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(downloadId)) {
      throw httpError(400, 'Invalid download id');
    }
    const doc = await WorkspaceDownload.findOneAndDelete({
      _id: downloadId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });
    if (!doc) throw httpError(404, 'Download not found');
    res.json({ ok: true, deleted: true, download: mapDownload(doc) });
  } catch (error) {
    next(error);
  }
};

export const triggerWorkspaceDownload = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.body.ownerType || req.query.ownerType);
    const downloadId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(downloadId)) {
      throw httpError(400, 'Invalid download id');
    }
    const doc = await WorkspaceDownload.findOne({
      _id: downloadId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    });
    if (!doc) throw httpError(404, 'Download not found');
    if (!doc.fileUrl) throw httpError(400, 'File URL missing; upload assets first');

    await processWorkspaceDownloadInline(downloadId, { delayMs: 50 });
    const fresh = await WorkspaceDownload.findById(downloadId).lean();
    res.json({
      ok: true,
      mode: 'inline',
      download: mapDownload(fresh),
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceDownloadStatus = async (req, res, next) => {
  try {
    const scope = await resolveScopeOrThrow(req.user, req.query.ownerType);
    const downloadId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(downloadId)) {
      throw httpError(400, 'Invalid download id');
    }
    const doc = await WorkspaceDownload.findOne({
      _id: downloadId,
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
    }).lean();
    if (!doc) throw httpError(404, 'Download not found');
    res.json({
      ok: true,
      download: mapDownload(doc),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listWorkspaceDownloads,
  createWorkspaceDownload,
  updateWorkspaceDownload,
  deleteWorkspaceDownload,
  triggerWorkspaceDownload,
  getWorkspaceDownloadStatus,
};
