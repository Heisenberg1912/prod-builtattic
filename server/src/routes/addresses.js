import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../rbac/guards.js';

const router = Router();
router.use(requireAuth);

const sanitizeAddress = (payload = {}) => {
  const trimmed = (v) => (typeof v === 'string' ? v.trim() : v);
  return {
    label: trimmed(payload.label) || 'Primary address',
    name: trimmed(payload.name) || null,
    line1: trimmed(payload.line1) || null,
    line2: trimmed(payload.line2) || null,
    city: trimmed(payload.city) || null,
    state: trimmed(payload.state) || null,
    postalCode: trimmed(payload.postalCode) || null,
    country: trimmed(payload.country) || 'India',
    phone: trimmed(payload.phone) || null,
    gstNumber: trimmed(payload.gstNumber) || null,
    isDefault: Boolean(payload.isDefault),
  };
};

router.get('/addresses', async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses').lean();
  res.json({ ok: true, items: user?.addresses || [] });
});

router.post('/addresses', async (req, res) => {
  const address = sanitizeAddress(req.body);
  const update = { $push: { addresses: address } };
  if (address.isDefault) {
    update.$set = { 'addresses.$[].isDefault': false };
  }
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: false }).lean();
  res.status(201).json({ ok: true, items: user?.addresses || [] });
});

router.put('/addresses/:id', async (req, res) => {
  const addressId = req.params.id;
  const update = sanitizeAddress(req.body);
  const user = await User.findOne({ _id: req.user._id, 'addresses._id': addressId }).select('addresses');
  if (!user) {
    return res.status(404).json({ ok: false, error: 'address_not_found' });
  }
  user.addresses = user.addresses.map((entry) =>
    String(entry._id) === String(addressId) ? { ...entry.toObject(), ...update } : { ...entry.toObject(), isDefault: update.isDefault ? false : entry.isDefault },
  );
  await user.save();
  const items = user.addresses.map((entry) => entry.toObject());
  res.json({ ok: true, items });
});

router.delete('/addresses/:id', async (req, res) => {
  const addressId = req.params.id;
  const user = await User.findById(req.user._id).select('addresses');
  if (!user) {
    return res.status(404).json({ ok: false, error: 'user_not_found' });
  }
  const original = user.addresses.length;
  user.addresses = user.addresses.filter((entry) => String(entry._id) !== String(addressId));
  if (user.addresses.length === original) {
    return res.status(404).json({ ok: false, error: 'address_not_found' });
  }
  await user.save();
  res.json({ ok: true, items: user.addresses.map((entry) => entry.toObject()) });
});

export default router;
