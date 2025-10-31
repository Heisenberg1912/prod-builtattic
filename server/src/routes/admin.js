import { Router } from 'express';
import Firm from '../models/Firm.js';
import User from '../models/User.js';
import { requireAuth, requireGlobal } from '../rbac/guards.js';

const r = Router();

r.get(
  '/admin/vendors',
  requireAuth,
  requireGlobal('admin', 'superadmin'),
  async (_req, res) => {
    const firms = await Firm.find({}).limit(100).lean();
    res.json({ ok: true, firms });
  }
);

r.get(
  '/admin/users',
  requireAuth,
  requireGlobal('admin', 'superadmin'),
  async (_req, res) => {
    const users = await User.find({})
      .select('email rolesGlobal memberships isClient createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ ok: true, users });
  }
);

r.patch(
  '/admin/vendors/:id/approve',
  requireAuth,
  requireGlobal('admin', 'superadmin'),
  async (req, res) => {
    const firm = await Firm.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    res.json({ ok: true, firm });
  }
);

export default r;
