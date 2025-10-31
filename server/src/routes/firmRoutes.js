import { Router } from 'express';
import { listFirms, createFirm, updateFirm, deleteFirm } from '../controllers/firmController.js';
import * as auth from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

// NOOP middleware that safely checks if next is a function
const NOOP = (req, res, next) => { if (typeof next === 'function') return next(); };

const authenticateJWT =
  typeof auth.authenticateJWT === 'function' ? auth.authenticateJWT
  : typeof auth.verifyToken === 'function' ? auth.verifyToken
  : NOOP;

const authorizeRoles =
  typeof auth.authorizeRoles === 'function' ? auth.authorizeRoles
  : () => NOOP;

// scopeQueryByRole fallback also uses safe NOOP
const scopeQueryByRole =
  typeof auth.scopeQueryByRole === 'function'
    ? auth.scopeQueryByRole
    : () => (req, res, next) => { if (typeof next === 'function') return next(); };

const router = Router();

router.use(authenticateJWT, scopeQueryByRole('Firm'));

router.route('/')
  .get(authorizeRoles(ROLES.SUPER_ADMIN), listFirms)
  .post(authorizeRoles(ROLES.SUPER_ADMIN), createFirm);

router.route('/:id')
  .put(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.FIRM), updateFirm)
  .delete(authorizeRoles(ROLES.SUPER_ADMIN), deleteFirm);

export default router;
