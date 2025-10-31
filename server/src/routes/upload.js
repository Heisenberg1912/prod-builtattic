import express from 'express';
import multer from 'multer';
import Asset from '../models/Asset.js';
import Product from '../models/Product.js';
import { storeEncryptedBuffer } from '../services/storageService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: 'File missing' });

    const { productId, orderId, kind = 'deliverable', secure = 'true' } = req.body || {};
    const stored = await storeEncryptedBuffer(file.buffer, { filename: file.originalname });
    const asset = await Asset.create({
      key: stored.key,
      storageProvider: 'local',
      storagePath: stored.storagePath,
      originalName: stored.originalName,
      mimeType: file.mimetype,
      sizeBytes: stored.sizeBytes,
      checksum: stored.checksum,
      secure: secure !== 'false',
      algorithm: 'aes-256-gcm',
      iv: stored.iv,
      authTag: stored.authTag,
      uploader: req.user?._id,
      product: productId || undefined,
      order: orderId || undefined,
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
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;

