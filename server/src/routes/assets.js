import { Router } from 'express';
import Asset from '../models/Asset.js';
import { readDecryptedAsset, verifyDownloadToken } from '../services/storageService.js';

const router = Router();

router.get('/:id/download', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ ok: false, error: 'Token required' });
    const payload = verifyDownloadToken(token);
    if (String(payload.sub) !== String(req.params.id)) {
      return res.status(403).json({ ok: false, error: 'Invalid token' });
    }
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ ok: false, error: 'Asset not found' });
    if (asset.storageProvider === 'remote' && asset.storagePath) {
      return res.redirect(asset.storagePath);
    }
    const buffer = readDecryptedAsset(asset);
    res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asset.originalName || asset.key}"`
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
