import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function attachUser(req, _res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // Always fetch fresh roles/memberships from DB
    const fresh = await User.findById(payload._id)
      .select('email role rolesGlobal memberships')
      .lean();
    if (fresh) {
      req.user = {
        _id: fresh._id,
        email: fresh.email,
        role: fresh.role,
        rolesGlobal: fresh.rolesGlobal || [],
        memberships: fresh.memberships || [],
      };
    } else {
      req.user = payload;
    }
  } catch {}
  next();
}

export function signAccess(user) {
  const payload = {
    _id: user._id,
    email: user.email,
    role: user.role || 'user',
    rolesGlobal: user.rolesGlobal || [],
    memberships: user.memberships || [],
  };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
}
