import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import * as auth from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import { requestConsultation } from '../controllers/skillStudioController.js';
import { getStudioHub } from '../controllers/studioHubController.js';

const router = Router();

// Lightweight limiter to keep consultation requests sane when exposed publicly.
const consultationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
});

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

router.get('/workspace', authenticateJWT, authorizeWorkspace, getStudioHub);
router.post('/associates/:id/consultations', consultationLimiter, requestConsultation);

export default router;
