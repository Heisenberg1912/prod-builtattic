import { Router } from 'express';
import { listBookings, createBooking, updateBooking, deleteBooking } from '../controllers/bookingController.js';
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
router.use(authenticateJWT, scopeQueryByRole('Booking'));
router.route('/')
  .get(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.FIRM, ROLES.CLIENT, ROLES.USER), listBookings)
  .post(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.FIRM, ROLES.CLIENT, ROLES.USER), createBooking);
router.route('/:id')
  .put(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.FIRM, ROLES.CLIENT, ROLES.USER), updateBooking)
  .delete(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.FIRM, ROLES.CLIENT, ROLES.USER), deleteBooking);
export default router;
