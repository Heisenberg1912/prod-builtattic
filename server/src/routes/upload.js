import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import Product from '../models/Product.js';
import { storeEncryptedBuffer } from '../services/storageService.js';
import logger from '../utils/logger.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const normalizeBoolean = (value, defaultValue = true) => {
  if (typeof value === 'boolean') return value;
  if (value == null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return defaultValue;
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

    const { productId: rawProductId, orderId: rawOrderId, kind: rawKind = 'deliverable', secure } = req.body || {};
    const productId = asObjectId(rawProductId);
    const orderId = asObjectId(rawOrderId);
    const kind = normalizeKind(rawKind);
    const isSecure = normalizeBoolean(secure, true);

    const stored = await storeEncryptedBuffer(file.buffer, { filename: file.originalname });
    const asset = await Asset.create({
      key: stored.key,
      storageProvider: 'local',
      storagePath: stored.storagePath,
      originalName: stored.originalName,
      mimeType: file.mimetype,
      sizeBytes: stored.sizeBytes,
      checksum: stored.checksum,
      secure: isSecure,
      algorithm: 'aes-256-gcm',
      iv: stored.iv,
      authTag: stored.authTag,
      uploader: req.user?._id,
      product: productId,
      order: orderId,
      kind,
      status: 'ready',
    });

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
              url: asset.secure ? undefined : asset.storagePath,
            },
          },
        }
      );
    }

    res.status(201).json({ ok: true, asset });
  } catch (error) {
    logger.error('Upload failed', { error: error.message, stack: error.stack });
    const status = error?.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ ok: false, error: error.message });
  }
});

export default router;

