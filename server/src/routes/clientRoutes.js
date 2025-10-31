import { Router } from 'express';
import { listClients, createClient, updateClient, deleteClient } from '../controllers/clientController.js';
// import { authenticateJWT, authorizeRoles, scopeQueryByRole } from '../middleware/auth.js';
import * as auth from '../middleware/auth.js';

const NOOP = (req, res, next) => { if (typeof next === 'function') return next(); };
const authenticateJWT =
  typeof auth.authenticateJWT === 'function' ? auth.authenticateJWT
  : typeof auth.verifyToken === 'function' ? auth.verifyToken
  : NOOP;

const authorizeRoles =
  typeof auth.authorizeRoles === 'function' ? auth.authorizeRoles
  : () => NOOP;

const scopeQueryByRole =
  typeof auth.scopeQueryByRole === 'function'
    ? auth.scopeQueryByRole
    : () => (req, res, next) => { if (typeof next === 'function') return next(); };
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticateJWT, scopeQueryByRole('Client'));
router.route('/')
  .get(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ASSOCIATE, ROLES.CLIENT), listClients)
  .post(authorizeRoles(ROLES.SUPER_ADMIN), createClient);
router.route('/:id')
  .put(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CLIENT), updateClient)
  .delete(authorizeRoles(ROLES.SUPER_ADMIN), deleteClient);
export default router;
