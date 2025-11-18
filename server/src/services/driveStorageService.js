import { PassThrough } from 'node:stream';
import { getDriveClient } from './driveClient.js';
import logger from '../utils/logger.js';

const DEFAULT_PUBLIC_TEMPLATE = 'https://drive.google.com/uc?id={{fileId}}';
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const DRIVE_SUPPORTS_ALL = process.env.GOOGLE_DRIVE_SUPPORT_SHARED === 'true';
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

const createReadable = (buffer) => {
  const stream = new PassThrough();
  stream.end(buffer);
  return stream;
};

const buildPublicUrl = (fileId) => {
  const template = process.env.GOOGLE_DRIVE_PUBLIC_URL_TEMPLATE || DEFAULT_PUBLIC_TEMPLATE;
  return template.replace('{{fileId}}', fileId);
};

const ensurePublicPermission = async (drive, fileId) => {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
      fields: 'id',
      supportsAllDrives: DRIVE_SUPPORTS_ALL,
    });
  } catch (error) {
    if (error?.code === 403) {
      logger.warn('Unable to mark Drive file as public; ensure link sharing is allowed', { fileId });
    } else if (error?.code !== 400) {
      logger.error('Failed to apply Drive permission', { fileId, error: error.message });
      throw error;
    }
  }
};

const escapeDriveQueryValue = (value) => String(value).replace(/'/g, "\\'");

export const ensureDriveSubfolder = async ({ name, parentId = DRIVE_FOLDER_ID }) => {
  const drive = getDriveClient();
  const queryParts = [
    `name='${escapeDriveQueryValue(name)}'`,
    `mimeType='${DRIVE_FOLDER_MIME}'`,
    'trashed=false',
  ];
  if (parentId) {
    queryParts.push(`'${parentId}' in parents`);
  }
  const { data } = await drive.files.list({
    q: queryParts.join(' and '),
    fields: 'files(id, name)',
    supportsAllDrives: DRIVE_SUPPORTS_ALL,
    includeItemsFromAllDrives: DRIVE_SUPPORTS_ALL,
    corpora: DRIVE_SUPPORTS_ALL ? 'allDrives' : 'user',
  });
  if (data.files?.length) {
    return data.files[0];
  }
  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: DRIVE_FOLDER_MIME,
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id, name',
    supportsAllDrives: DRIVE_SUPPORTS_ALL,
  });
  return response.data;
};

export const uploadBufferToDrive = async (buffer, { filename, mimeType, secure, parentFolderId }) => {
  const drive = getDriveClient();
  const requestBody = { name: filename || 'upload.bin' };
  const targetFolder = parentFolderId || DRIVE_FOLDER_ID;
  if (targetFolder) {
    requestBody.parents = [targetFolder];
  }
  const media = { mimeType: mimeType || 'application/octet-stream', body: createReadable(buffer) };
  const response = await drive.files.create({
    requestBody,
    media,
    fields: 'id, size, mimeType',
    supportsAllDrives: DRIVE_SUPPORTS_ALL,
  });
  const driveFileId = response.data.id;
  let publicUrl;
  if (!secure) {
    await ensurePublicPermission(drive, driveFileId);
    publicUrl = buildPublicUrl(driveFileId);
  }
  return {
    driveFileId,
    driveFolderId: targetFolder || null,
    publicUrl,
    mimeType: response.data.mimeType || mimeType,
    sizeBytes: Number(response.data.size) || buffer.length,
  };
};

export const downloadDriveFile = async (fileId) => {
  const drive = getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: DRIVE_SUPPORTS_ALL },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(response.data);
};
