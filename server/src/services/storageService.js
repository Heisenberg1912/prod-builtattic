import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { uploadBufferToDrive, downloadDriveFile } from './driveStorageService.js';

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
const SECURE_DIR = path.join(STORAGE_ROOT, 'secure');
const PUBLIC_DIR = path.join(STORAGE_ROOT, 'public');
const STORAGE_PROVIDER = (process.env.ASSET_STORAGE_PROVIDER || 'drive').toLowerCase();

function ensureDirs() {
  if (!fs.existsSync(STORAGE_ROOT)) fs.mkdirSync(STORAGE_ROOT);
  if (!fs.existsSync(SECURE_DIR)) fs.mkdirSync(SECURE_DIR);
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
}

const generateKey = (extension = 'bin') =>
  `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;

let cachedEncryptionKey;
const HEX_64 = /^[0-9a-f]{64}$/i;

function getEncryptionKey() {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }
  const key = process.env.FILE_ENCRYPTION_KEY;
  if (!key || !key.trim()) {
    throw new Error('FILE_ENCRYPTION_KEY is not configured');
  }
  if (HEX_64.test(key.trim())) {
    cachedEncryptionKey = Buffer.from(key.trim(), 'hex');
    return cachedEncryptionKey;
  }
  cachedEncryptionKey = crypto.createHash('sha256').update(key).digest();
  return cachedEncryptionKey;
}

const getAssetTokenSecret = () => {
  const secret = process.env.ASSET_TOKEN_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('ASSET_TOKEN_SECRET is not configured');
  }
  return secret;
};

export async function storeEncryptedBuffer(buffer, { filename, mimeType, driveFolderId }) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  const key = generateKey('bin');

  if (STORAGE_PROVIDER === 'drive') {
    const uploaded = await uploadBufferToDrive(encrypted, {
      filename: key,
      mimeType: 'application/octet-stream',
      secure: true,
      parentFolderId: driveFolderId,
    });
    return {
      key,
      storageProvider: 'drive',
      storagePath: null,
      driveFileId: uploaded.driveFileId,
      driveFolderId: uploaded.driveFolderId,
      sizeBytes: buffer.length,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      checksum,
      originalName: filename,
      mimeType,
    };
  }

  ensureDirs();
  const storagePath = path.join(SECURE_DIR, key);
  fs.writeFileSync(storagePath, encrypted);
  return {
    key,
    storageProvider: 'local',
    storagePath,
    sizeBytes: buffer.length,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    checksum,
    originalName: filename,
    mimeType,
  };
}

export async function storePublicBuffer(buffer, { filename, mimeType, driveFolderId }) {
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  const extension = path.extname(filename || '').replace('.', '') || 'bin';
  const key = generateKey(extension);

  if (STORAGE_PROVIDER === 'drive') {
    const uploaded = await uploadBufferToDrive(buffer, {
      filename: filename || key,
      mimeType,
      secure: false,
      parentFolderId: driveFolderId,
    });
    return {
      key,
      storageProvider: 'drive',
      storagePath: uploaded.publicUrl,
      driveFileId: uploaded.driveFileId,
      driveFolderId: uploaded.driveFolderId,
      sizeBytes: uploaded.sizeBytes ?? buffer.length,
      checksum,
      originalName: filename,
      mimeType: uploaded.mimeType || mimeType,
      publicUrl: uploaded.publicUrl,
    };
  }

  ensureDirs();
  const storagePath = path.join(PUBLIC_DIR, key);
  fs.writeFileSync(storagePath, buffer);
  return {
    key,
    storageProvider: 'local',
    storagePath,
    sizeBytes: buffer.length,
    checksum,
    originalName: filename,
    mimeType,
    publicUrl: storagePath,
  };
}

export function generateDownloadToken(assetId, { expiresIn = '10m' } = {}) {
  const secret = getAssetTokenSecret();
  return jwt.sign({ sub: String(assetId) }, secret, { expiresIn });
}

export function verifyDownloadToken(token) {
  const secret = getAssetTokenSecret();
  return jwt.verify(token, secret);
}

export async function readDecryptedAsset(asset) {
  let encryptedBuffer;
  if (asset.storageProvider === 'drive') {
    const driveFileId = asset.driveFileId || asset.storagePath || asset.key;
    if (!driveFileId) {
      throw new Error('Drive file id is missing for asset');
    }
    encryptedBuffer = await downloadDriveFile(driveFileId);
  } else {
    const filePath = asset.storagePath || path.join(SECURE_DIR, asset.key);
    encryptedBuffer = fs.readFileSync(filePath);
  }

  const decipher = crypto.createDecipheriv(
    asset.algorithm || 'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(asset.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(asset.authTag, 'hex'));
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted;
}
