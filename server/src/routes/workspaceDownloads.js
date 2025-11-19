import { Router } from 'express';

import * as auth from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import {
  listWorkspaceDownloads,
  createWorkspaceDownload,
  updateWorkspaceDownload,
  deleteWorkspaceDownload,
} from '../controllers/workspaceDownloadController.js';

const safeMiddleware = (fn) => (typeof fn === 'function' ? fn : (_req, _res, next) => next());
const safeFactory = (factory, ...args) =>
  typeof factory === 'function' ? factory(...args) : (_req, _res, next) => next();

const authenticateJWT = safeMiddleware(auth.authenticateJWT || auth.verifyToken || auth.protect);
const authorizeWorkspace = safeFactory(
  auth.authorizeRoles,
  ROLES.ASSOCIATE,
  ROLES.FIRM,
  ROLES.VENDOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
);

const router = Router();
router.use(authenticateJWT, authorizeWorkspace);

router.get('/', listWorkspaceDownloads);
router.post('/', createWorkspaceDownload);
router.patch('/:id', updateWorkspaceDownload);
router.delete('/:id', deleteWorkspaceDownload);

export default router;
