import { Router } from 'express';
import * as auth from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import {
  listMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  publishMaterial,
  deleteMaterial,
} from '../controllers/vendorMaterialController.js';

const safeMiddleware = (fn) => (typeof fn === 'function' ? fn : (_req, _res, next) => next());
const safeFactory = (factory, ...args) => (typeof factory === 'function' ? factory(...args) : (_req, _res, next) => next());

const authenticateJWT = safeMiddleware(auth.authenticateJWT || auth.verifyToken || auth.protect);
const authorizeVendor = safeFactory(
  auth.authorizeRoles,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.VENDOR,
  ROLES.FIRM,
);

const router = Router();
router.use(authenticateJWT, authorizeVendor);

router.get('/', listMaterials);
router.post('/', createMaterial);
router.get('/:id', getMaterial);
router.put('/:id', updateMaterial);
router.patch('/:id', updateMaterial);
router.post('/:id/publish', publishMaterial);
router.delete('/:id', deleteMaterial);

export default router;
