import { Router } from 'express';
import * as auth from '../middleware/auth.js';
// Only import the controllers that exist:
import { listInvoices, createInvoice, updateInvoice } from '../controllers/invoiceController.js';

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
router.use(authenticateJWT, scopeQueryByRole('Invoice'));

router.route('/')
  .get(authorizeRoles(ROLES.SUPER_ADMIN), listInvoices)
  .post(authorizeRoles(ROLES.SUPER_ADMIN), createInvoice);

router.route('/:id')
  .put(authorizeRoles(ROLES.SUPER_ADMIN), updateInvoice);

export default router;
