import { Router } from "express";
import * as auth from "../middleware/auth.js";
import { ROLES } from "../config/constants.js";
import {
  listStudios,
  getStudio,
  createStudio,
  updateStudio,
  publishStudio,
  deleteStudio,
} from "../controllers/studioPortalController.js";

const safeMiddleware = (fn) => (typeof fn === "function" ? fn : (_req, _res, next) => next());
const safeFactory = (factory, ...args) => (typeof factory === "function" ? factory(...args) : (_req, _res, next) => next());

const authenticateJWT = safeMiddleware(auth.authenticateJWT || auth.verifyToken || auth.protect);
const authorizePortal = safeFactory(
  auth.authorizeRoles,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.FIRM,
  ROLES.VENDOR,
  ROLES.ASSOCIATE
);

const router = Router();
router.use(authenticateJWT, authorizePortal);

router.get('/studios', listStudios);
router.post('/studios', createStudio);
router.get('/studios/:id', getStudio);
router.put('/studios/:id', updateStudio);
router.patch('/studios/:id', updateStudio);
router.post('/studios/:id/publish', publishStudio);
router.delete('/studios/:id', deleteStudio);

export default router;
