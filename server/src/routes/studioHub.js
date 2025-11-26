import { Router } from 'express';

import * as auth from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import { getStudioHub } from '../controllers/studioHubController.js';

const safeMiddleware = (fn) => (typeof fn === 'function' ? fn : (_req, _res, next) => next());
const safeFactory = (factory, ...args) =>
  typeof factory === 'function' ? factory(...args) : (_req, _res, next) => next();

const authenticateJWT = safeMiddleware(auth.authenticateJWT || auth.verifyToken || auth.protect);
const authorizeWorkspace = safeFactory(
  auth.authorizeRoles,
  ROLES.ASSOCIATE,
  ROLES.FIRM,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.VENDOR,
);

const router = Router();
router.use(authenticateJWT, authorizeWorkspace);

router.get('/', getStudioHub);

export default router;
