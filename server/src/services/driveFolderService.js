import DriveFolder from '../models/DriveFolder.js';
import { ensureDriveSubfolder } from './driveStorageService.js';

const sanitizeFolderName = (value) => {
  if (!value) return null;
  return String(value).replace(/[^a-z0-9@._-]/gi, '-').slice(0, 120);
};

const buildFolderNameForUser = (user = {}) => {
  const derived =
    sanitizeFolderName(user.email) ||
    sanitizeFolderName(user.username) ||
    (user._id ? `user-${user._id}` : null);
  return derived || `user-${Date.now()}`;
};

export const getOrCreateUserDriveFolder = async (user, { parentId } = {}) => {
  if (!user?._id) return parentId || null;
  const existing = await DriveFolder.findOne({ user: user._id });
  if (existing) {
    return existing.folderId;
  }
  const folderName = buildFolderNameForUser(user);
  const folder = await ensureDriveSubfolder({
    name: folderName,
    parentId,
  });
  const doc = await DriveFolder.create({
    user: user._id,
    folderId: folder.id,
    name: folder.name,
    parentId: parentId || null,
  });
  return doc.folderId;
};
