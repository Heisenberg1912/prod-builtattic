import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import Product from '../models/Product.js';
import { storeEncryptedBuffer, storePublicBuffer, generateDownloadToken } from '../services/storageService.js';
import { getOrCreateUserDriveFolder } from '../services/driveFolderService.js';
import logger from '../utils/logger.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const USE_DRIVE_STORAGE = (process.env.ASSET_STORAGE_PROVIDER || 'drive').toLowerCase() === 'drive';
const ROOT_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

const normalizeBoolean = (value, defaultValue = true) => {
  if (typeof value === 'boolean') return value;
  if (value == null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return defaultValue;
};

const resolveBaseUrl = (req) => {
  const configured = process.env.ASSET_BASE_URL;
  if (configured && configured.trim()) {
    return configured.replace(/\/+$/, '');
  }
  const host = req.get('host');
  return `${req.protocol}://${host}`;
};

const normalizeKind = (value) => {
  if (!value) return 'deliverable';
  const trimmed = String(value).trim();
  if (!trimmed) return 'deliverable';
  return trimmed.slice(0, 64);
};

const asObjectId = (value) => {
  if (!value) return undefined;
  return mongoose.isValidObjectId(value) ? value : undefined;
};

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: 'File missing' });

    const {
      productId: rawProductId,
      orderId: rawOrderId,
      planUploadId: rawPlanUploadId,
      kind: rawKind = 'deliverable',
      secure,
    } = req.body || {};
    const productId = asObjectId(rawProductId);
    const orderId = asObjectId(rawOrderId);
    const planUploadId = asObjectId(rawPlanUploadId);
    const kind = normalizeKind(rawKind);
    const isSecure = normalizeBoolean(secure, true);
    let targetDriveFolderId;
    if (USE_DRIVE_STORAGE) {
      targetDriveFolderId = await getOrCreateUserDriveFolder(req.user, { parentId: ROOT_DRIVE_FOLDER_ID });
    }

    const storageResult = isSecure
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
      storageProvider: storageResult.storageProvider || (isSecure ? 'local' : 'remote'),
      storagePath: storageResult.storagePath,
      originalName: storageResult.originalName,
      mimeType: storageResult.mimeType || file.mimetype,
      sizeBytes: storageResult.sizeBytes,
      checksum: storageResult.checksum,
      secure: isSecure,
      uploader: req.user?._id,
      product: productId,
      order: orderId,
      planUpload: planUploadId,
      kind,
      status: 'ready',
      driveFileId: storageResult.driveFileId,
      driveFolderId: storageResult.driveFolderId || targetDriveFolderId,
      publicUrl: storageResult.publicUrl,
    };

    if (isSecure) {
      assetPayload.algorithm = 'aes-256-gcm';
      assetPayload.iv = storageResult.iv;
      assetPayload.authTag = storageResult.authTag;
    }

    const asset = await Asset.create(assetPayload);
    let downloadUrl = asset.publicUrl || asset.storagePath;
    if (!downloadUrl && isSecure && asset._id) {
      const token = generateDownloadToken(asset._id, { expiresIn: '30d' });
      const baseUrl = resolveBaseUrl(req);
      downloadUrl = `${baseUrl}/assets/${asset._id}/download?token=${token}`;
    }

    if (productId) {
      await Product.updateOne(
        { _id: productId },
        {
          $addToSet: {
            assets: {
              key: asset.key,
              filename: asset.originalName,
              mimeType: asset.mimeType,
              sizeBytes: asset.sizeBytes,
              kind: asset.kind,
              secure: asset.secure,
              url: asset.secure ? undefined : asset.publicUrl || asset.storagePath,
            },
          },
        }
      );
    }

    res.status(201).json({ ok: true, asset, downloadUrl });
  } catch (error) {
    logger.error('Upload failed', { error: error.message, stack: error.stack });
    const status = error?.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ ok: false, error: error.message });
  }
});

export default router;

