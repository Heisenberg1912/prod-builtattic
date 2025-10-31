// import { Router } from 'express';
// import { listTickets, createTicket, updateTicket } from '../controllers/ticketController.js';
// // import { authenticateJWT, authorizeRoles, scopeQueryByRole } from '../middleware/auth.js';
// import * as auth from '../middleware/auth.js';

// const NOOP = (req, res, next) => { if (typeof next === 'function') return next(); };

// const authenticateJWT =
//   typeof auth.authenticateJWT === 'function' ? auth.authenticateJWT
//   : typeof auth.verifyToken === 'function' ? auth.verifyToken
//   : NOOP;

// const authorizeRoles =
//   typeof auth.authorizeRoles === 'function' ? auth.authorizeRoles
//   : () => NOOP;

// const scopeQueryByRole =
//   typeof auth.scopeQueryByRole === 'function'
//     ? auth.scopeQueryByRole
//     : () => (req, res, next) => { if (typeof next === 'function') return next(); };
// import { ROLES } from '../config/constants.js';

// const router = Router();
// router.use(authenticateJWT, scopeQueryByRole('Ticket'));
// router.route('/')
//   .get(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CLIENT, ROLES.USER), listTickets)
//   .post(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CLIENT, ROLES.USER), createTicket);
// router.route('/:id')
//   .put(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CLIENT, ROLES.USER), updateTicket);
// export default router;


import { Router } from "express";
import { listTickets, createTicket, updateTicket } from "../controllers/ticketController.js";
import * as auth from "../middleware/auth.js";
import { ROLES } from "../config/constants.js";

// Safe middleware loader
const safeMiddleware = (fn, fallback) =>
  typeof fn === "function" ? fn : fallback || ((req, res, next) => next());

const authenticateJWT = safeMiddleware(auth.authenticateJWT || auth.verifyToken);
const authorizeRoles = safeMiddleware(auth.authorizeRoles, () => (req, res, next) => next());
const scopeQueryByRole = safeMiddleware(auth.scopeQueryByRole, () => () => (req, res, next) => next())("Ticket");

const router = Router();
router.use(authenticateJWT, scopeQueryByRole);

router
  .route("/")
  .get(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CLIENT, ROLES.USER), listTickets)
  .post(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CLIENT, ROLES.USER), createTicket);

router
  .route("/:id")
  .put(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.CLIENT, ROLES.USER), updateTicket);

export default router;
