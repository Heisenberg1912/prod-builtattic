import { Router } from 'express';
import Firm from '../models/Firm.js';
import User from '../models/User.js';
import { requireAuth, requireFirmRole } from '../rbac/guards.js';

const r = Router();

r.post('/vendor/apply', requireAuth, async (req, res) => {
  const { name, slug } = req.body || {};
  const exists = await Firm.findOne({ slug });
  if (exists) {
    return res.status(409).json({ ok: false, error: 'slug exists' });
  }

  const firm = await Firm.create({
    name,
    slug,
    ownerUserId: req.user._id,
    approved: false,
  });

  await User.updateOne(
    { _id: req.user._id },
    { $addToSet: { memberships: { firm: firm._id, role: 'owner' } } }
  );

  res.json({ ok: true, firm });
});

r.get(
  '/firms/:firmId',
  requireAuth,
  requireFirmRole('owner', 'admin', 'associate'),
  async (req, res) => {
    const firm = await Firm.findById(req.params.firmId).lean();
    if (!firm) {
      return res.status(404).json({ ok: false, error: 'firm not found' });
    }
    res.json({ ok: true, firm });
  }
);

export default r;
