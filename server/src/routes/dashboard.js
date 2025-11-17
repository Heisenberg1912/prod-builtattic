import { Router } from 'express';
import * as auth from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import {
  getAssociateDashboard,
  getFirmDashboard,
  getVendorDashboard,
} from '../controllers/dashboardController.js';

const safeMiddleware = (fn) => (typeof fn === 'function' ? fn : (_req, _res, next) => next());
const safeFactory = (factory, ...args) =>
  typeof factory === 'function' ? factory(...args) : (_req, _res, next) => next();

const authenticateJWT = safeMiddleware(auth.authenticateJWT || auth.verifyToken || auth.protect);
const authorizeAssociate = safeFactory(
  auth.authorizeRoles,
  ROLES.ASSOCIATE,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
);
const authorizeFirm = safeFactory(
  auth.authorizeRoles,
  ROLES.FIRM,
  ROLES.VENDOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
);
const authorizeVendor = safeFactory(
  auth.authorizeRoles,
  ROLES.VENDOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
);

const router = Router();
router.use(authenticateJWT);

router.get('/associate', authorizeAssociate, getAssociateDashboard);
router.get('/firm', authorizeFirm, getFirmDashboard);
router.get('/vendor', authorizeVendor, getVendorDashboard);

export default router;
