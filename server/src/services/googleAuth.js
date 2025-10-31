import { OAuth2Client } from 'google-auth-library';
import argon2 from 'argon2';
import User from '../models/User.js';
import { signAccess } from '../auth/middleware.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken) {
  if (!client) throw new Error('Google client not configured');
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

export async function signInWithGoogle(idToken) {
  const payload = await verifyGoogleToken(idToken);
  const email = payload?.email?.toLowerCase?.();
  if (!email) throw new Error('Google account missing verified email');

  let user = await User.findOne({ email });
  if (!user) {
    const randomPass = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const passHash = await argon2.hash(randomPass);
    user = await User.create({
      email,
      passHash,
      role: 'user',
      rolesGlobal: [],
      memberships: [],
      isClient: true,
    });
  }

  const token = signAccess(user);
  return {
    token,
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      rolesGlobal: user.rolesGlobal || [],
      memberships: user.memberships || [],
    },
  };
}
