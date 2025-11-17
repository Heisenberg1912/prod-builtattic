import { Router } from 'express';
import * as auth from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import { getFirmProfile, upsertFirmProfile } from '../controllers/firmPortalController.js';
import {
  getHostingConfig,
  upsertHostingConfig,
  listStudioRequests,
  updateStudioRequestStatus,
} from '../controllers/firmHostingController.js';

const safeMiddleware = (fn) => (typeof fn === 'function' ? fn : (_req, _res, next) => next());
const safeFactory = (factory, ...args) => (typeof factory === 'function' ? factory(...args) : (_req, _res, next) => next());

const authenticateJWT = safeMiddleware(auth.authenticateJWT || auth.verifyToken || auth.protect);
const authorizeFirmRoles = safeFactory(
  auth.authorizeRoles,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.FIRM,
  ROLES.VENDOR
);

const router = Router();
router.use(authenticateJWT, authorizeFirmRoles);

router.get('/profile', getFirmProfile);
router.put('/profile', upsertFirmProfile);
router.patch('/profile', upsertFirmProfile);
router.get('/design-studio/hosting', getHostingConfig);
router.put('/design-studio/hosting', upsertHostingConfig);
router.patch('/design-studio/hosting', upsertHostingConfig);
router.get('/design-studio/requests', listStudioRequests);
router.patch('/design-studio/requests/:id', updateStudioRequestStatus);

export default router;
