import { Router } from "express";
import * as auth from "../middleware/auth.js";
import { ROLES } from "../config/constants.js";
import { getOwnAssociateProfile, upsertOwnAssociateProfile } from "../controllers/associatePortalController.js";

const safeMiddleware = (fn) => (typeof fn === "function" ? fn : (_req, _res, next) => next());
const safeFactory = (factory, ...args) => (typeof factory === "function" ? factory(...args) : (_req, _res, next) => next());

const authenticateJWT = safeMiddleware(auth.authenticateJWT || auth.verifyToken || auth.protect);
const authorizeAssociate = safeFactory(auth.authorizeRoles, ROLES.ASSOCIATE, ROLES.SUPER_ADMIN, ROLES.ADMIN);

const router = Router();
router.use(authenticateJWT, authorizeAssociate);

router.get('/profile', getOwnAssociateProfile);
router.put('/profile', upsertOwnAssociateProfile);
router.patch('/profile', upsertOwnAssociateProfile);

export default router;
