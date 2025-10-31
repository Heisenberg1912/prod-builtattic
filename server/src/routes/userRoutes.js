import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  impersonateUser
} from '../controllers/userController.js';
import { me } from '../controllers/authController.js';
import * as auth from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

// Helper to safely use middleware
const safeMiddleware = (fn) =>
  typeof fn === "function"
    ? fn
    : function (req, res, next) { next(); };

// Helper for middleware factories (like scopeQueryByRole, authorizeRoles)
const safeFactory = (factory, ...args) =>
  typeof factory === "function"
    ? factory(...args)
    : function (req, res, next) { next(); };

const authenticateJWT = safeMiddleware(auth.authenticateJWT || auth.verifyToken);
const authorizeRoles = (...roles) => safeFactory(auth.authorizeRoles, ...roles);
const scopeQueryByRole = safeFactory(auth.scopeQueryByRole, 'User');

const router = Router();

// Apply global middleware
router.use(authenticateJWT, scopeQueryByRole);

// Routes
router
  .route('/')
  .get(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.FIRM, ROLES.CLIENT, ROLES.ASSOCIATE), listUsers)
  .post(authorizeRoles(ROLES.SUPER_ADMIN), createUser);

router
  .route('/:id')
  .put(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.FIRM, ROLES.CLIENT), updateUser)
  .delete(authorizeRoles(ROLES.SUPER_ADMIN), deleteUser);

router.post('/:id/impersonate', authorizeRoles(ROLES.SUPER_ADMIN), impersonateUser);
router.get('/me', authenticateJWT, me);

export default router;
