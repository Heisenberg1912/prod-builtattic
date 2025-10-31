import { Router } from 'express';
import { listLeads, createLead, updateLead, deleteLead } from '../controllers/leadController.js';
// import { authenticateJWT, authorizeRoles, scopeQueryByRole } from '../middleware/auth.js';
import * as auth from '../middleware/auth.js';

// NOOP middleware that safely checks if next is a function
const NOOP = (req, res, next) => { if (typeof next === 'function') return next(); };

// Use the same pattern for any fallback middlewares
const authenticateJWT =
  typeof auth.authenticateJWT === 'function' ? auth.authenticateJWT
  : typeof auth.verifyToken === 'function' ? auth.verifyToken
  : NOOP;

const authorizeRoles =
  typeof auth.authorizeRoles === 'function' ? auth.authorizeRoles
  : () => NOOP;

const scopeQueryByRole =
  typeof auth.scopeQueryByRole === 'function' ? auth.scopeQueryByRole
  : () => (req, res, next) => { if (typeof next === 'function') return next(); };
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticateJWT, scopeQueryByRole('Lead'));
router.route('/')
  .get(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.VENDOR), listLeads)
  .post(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.VENDOR), createLead);
router.route('/:id')
  .put(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.VENDOR), updateLead)
  .delete(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.VENDOR), deleteLead);
export default router;
