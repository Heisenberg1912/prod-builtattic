import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createCrudControllers } from './genericFactory.js';

const base = createCrudControllers(User, 'User');

export const listUsers = base.list;
export const createUser = async (req, res) => {
  try {
    if (req.body.password) {
      req.body.passwordHash = await bcrypt.hash(req.body.password, 10);
      delete req.body.password;
    }
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
export const updateUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, ...req.scopeFilter });
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (req.body.password) {
      user.passwordHash = await bcrypt.hash(req.body.password, 10);
      delete req.body.password;
    }
    Object.assign(user, req.body);
    await user.save();
    res.json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
export const deleteUser = base.remove;
export const impersonateUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const user = await User.findById(targetId);
    if (!user) return res.status(404).json({ message: 'Not found' });
    // Simple impersonation token
    const { signAccessToken } = await import('../utils/tokens.js');
    const accessToken = signAccessToken({ id: user._id, role: user.role, impersonated: true });
    res.json({ accessToken, user: { id: user._id, role: user.role, name: user.name }, impersonated: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
