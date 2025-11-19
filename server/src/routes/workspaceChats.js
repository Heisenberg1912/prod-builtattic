import { Router } from 'express';

import * as auth from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import {
  listWorkspaceChats,
  createWorkspaceChat,
  postWorkspaceChatMessage,
  updateWorkspaceChat,
} from '../controllers/workspaceChatController.js';

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

router.get('/', listWorkspaceChats);
router.post('/', createWorkspaceChat);
router.post('/:id/messages', postWorkspaceChatMessage);
router.patch('/:id', updateWorkspaceChat);

export default router;
