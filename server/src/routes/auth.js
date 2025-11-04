import crypto from 'node:crypto';
import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import User from '../models/User.js';
import { signAccess } from '../auth/middleware.js';
import { requireAuth } from '../rbac/guards.js';
import { validateEmailDeliverability } from '../utils/emailValidation.js';
import { signInWithGoogle } from '../services/googleAuth.js';

import { sendSignupCredentialsEmail, sendPasswordResetEmail } from '../services/email/emailService.js';
import logger from '../utils/logger.js';
const r = Router();
const credsSchema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8)
});
const signupSchema = credsSchema.extend({
  role: z.enum(['user','client','vendor','firm','associate','admin','superadmin']).optional()
});
const forgotPasswordSchema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
});
const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8),
});


async function handleSignup(req, res) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok:false, error: parsed.error.issues[0].message });
  const { email, password, role } = parsed.data;

  const exists = await User.findOne({ email }).lean();
  if (exists) return res.status(409).json({ ok:false, error:'email exists' });
  const deliverable = await validateEmailDeliverability(email);
  if (!deliverable) {
    return res.status(400).json({ ok:false, error:'email domain does not accept mail' });
  }

  const passHash = await argon2.hash(password);
  // superadmin/admin roles also reflected in rolesGlobal for backward compatibility
  const rolesGlobal = [];
  if (role === 'superadmin') rolesGlobal.push('superadmin');
  if (role === 'admin') rolesGlobal.push('admin');
  const resolvedRole = role || 'user';
  const u = await User.create({
    email,
    passHash,
    role: resolvedRole,
    rolesGlobal,
    isClient: resolvedRole === 'client'
  });

  try {
    await sendSignupCredentialsEmail({
      to: email,
      password,
      role: resolvedRole,
    });
  } catch (error) {
    logger.warn('Failed to send signup credentials email', {
      email,
      error: error.message,
    });
  }

  const token = signAccess(u);
  res.json({
    ok:true,
    token,
    user:{
      _id:u._id,
      email:u.email,
      role:u.role,
      rolesGlobal:u.rolesGlobal||[],
      memberships:[]
    }
  });
}

r.post('/signup', handleSignup);
r.post('/register', handleSignup);

r.post('/login', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok:false, error: parsed.error.issues[0].message });
  const { email, password } = parsed.data;

  const u = await User.findOne({ email }).select('+passHash');
  if (!u) return res.status(401).json({ ok:false, error:'invalid credentials' });

  const ok = await argon2.verify(u.passHash, password);
  if (!ok) return res.status(401).json({ ok:false, error:'invalid credentials' });

  const token = signAccess(u);
  const fresh = await User.findById(u._id).select('email role rolesGlobal memberships').lean();
  res.json({
    ok:true,
    token,
    user:{
      _id:u._id,
      email:fresh.email,
      role:fresh.role,
      rolesGlobal:fresh.rolesGlobal||[],
      memberships:fresh.memberships||[]
    }
  });
});

r.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ ok: false, error: 'idToken required' });
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ ok: false, error: 'Google sign-in not configured' });
    }
    const { token, user } = await signInWithGoogle(idToken);
    res.json({ ok: true, token, user });
  } catch (err) {
    res.status(401).json({ ok: false, error: err.message || 'Google sign-in failed' });
  }
});

r.get('/me', requireAuth, async (req, res) => {
  const fresh = await User.findById(req.user._id).select('email role rolesGlobal memberships').lean();
  if (!fresh) return res.status(404).json({ ok:false, error:'user not found' });
  res.json({
    ok:true,
    user:{
      _id:req.user._id,
      email:fresh.email,
      role:fresh.role,
      rolesGlobal:fresh.rolesGlobal||[],
      memberships:fresh.memberships||[]
    }
  });
});

r.post('/forgot-password', async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message || 'Invalid email' });
  }
  const { email } = parsed.data;
  const genericResponse = {
    ok: true,
    message: 'If that email is registered, you\'ll receive a password reset link shortly.',
  };

  const user = await User.findOne({ email }).select('email passwordReset');
  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  user.passwordReset = { tokenHash, expiresAt };
  await user.save({ validateBeforeSave: false });

  const resolveResetUrl = (token) => {
    const candidates = [
      process.env.PASSWORD_RESET_URL,
      process.env.CLIENT_RESET_URL,
      process.env.APP_BASE_URL,
      process.env.CLIENT_BASE_URL,
      process.env.PUBLIC_CLIENT_URL,
      req.get('origin'),
    ];
    for (const raw of candidates) {
      if (typeof raw !== 'string' || !raw.trim()) continue;
      const trimmed = raw.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        if (trimmed.includes('token=')) {
          return trimmed;
        }
        if (trimmed.includes('?')) {
          const joiner = trimmed.endsWith('?') || trimmed.endsWith('&') ? '' : '&';
          return `${trimmed}${joiner}token=${token}`;
        }
        const normalized = trimmed.replace(/\/+$/g, '');
        if (/reset-password/i.test(normalized)) {
          return `${normalized}${normalized.includes('?') ? '&' : '?'}token=${token}`;
        }
        return `${normalized}/reset-password?token=${token}`;
      }
    }
    return `http://localhost:5173/reset-password?token=${token}`;
  };
  const resetUrl = resolveResetUrl(rawToken);
  try {
    await sendPasswordResetEmail({ to: email, resetUrl, expiresInMinutes: 60 });
  } catch (error) {
    logger.warn('Failed to send password reset email', {
      email,
      error: error.message,
    });
  }

  const payload = { ...genericResponse };
  res.json(payload);
});

r.post('/reset-password', async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message || 'Invalid request' });
  }
  const { token, password } = parsed.data;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ 'passwordReset.tokenHash': tokenHash }).select('+passwordReset.tokenHash passwordReset.expiresAt');
  if (!user || !user.passwordReset?.expiresAt) {
    return res.status(400).json({ ok: false, error: 'Invalid or expired reset token' });
  }
  if (user.passwordReset.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ ok: false, error: 'Invalid or expired reset token' });
  }

  user.passHash = await argon2.hash(password);
  user.passwordReset = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ ok: true, message: 'Password updated successfully' });
});

export default r;

