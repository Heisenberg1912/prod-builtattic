import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createStudioRequest } from '../controllers/firmHostingController.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== 'string') return next();
    const [scheme, token] = authHeader.split(' ');
    if (!/^Bearer$/i.test(scheme) || !token || !ACCESS_SECRET) return next();
    const decoded = jwt.verify(token, ACCESS_SECRET);
    const userId = decoded._id || decoded.sub || decoded.id;
    if (!userId) return next();
    const user = await User.findById(userId).lean();
    if (user) req.user = user;
    next();
  } catch (_error) {
    next();
  }
};

const router = Router();
router.post('/', optionalAuth, createStudioRequest);

export default router;

