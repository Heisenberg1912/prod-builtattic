import { OAuth2Client } from 'google-auth-library';
import argon2 from 'argon2';
import User from '../models/User.js';
import { signAccess } from '../auth/middleware.js';

const ALLOWED_ROLES = new Set(['user', 'client', 'associate', 'firm', 'vendor']);
const WORKSPACE_LABELS = {
  user: 'Builtattic user',
  client: 'client',
  vendor: 'vendor',
  firm: 'firm',
  associate: 'associate',
};
const GENERAL_PORTAL_ROLES = new Set(['user', 'client']);

const parseClientIds = () => {
  const sources = [
    process.env.GOOGLE_CLIENT_IDS,
    process.env.GOOGLE_CLIENT_ID,
    process.env.VITE_GOOGLE_CLIENT_ID,
  ];
  const ids = sources
    .filter(Boolean)
    .flatMap((value) => String(value).split(',').map((item) => item.trim()))
    .filter(Boolean);
  return Array.from(new Set(ids));
};

const allowedClientIds = parseClientIds();
const hasGoogleClients = allowedClientIds.length > 0;
const client = new OAuth2Client();

const normaliseRole = (role) => {
  if (!role) return 'user';
  const normalized = String(role).toLowerCase();
  return ALLOWED_ROLES.has(normalized) ? normalized : 'user';
};

export async function verifyGoogleToken(idToken) {
  if (!hasGoogleClients) throw new Error('Google client not configured');
  const ticket = await client.verifyIdToken({
    idToken,
    audience: allowedClientIds,
  });
  return ticket.getPayload();
}

const describeWorkspace = (role = 'user') => WORKSPACE_LABELS[role] || role || 'user';
const rolesCompatible = (currentRole, requestedRole) => {
  if (!requestedRole) return true;
  const normalizedCurrent = normaliseRole(currentRole);
  if (normalizedCurrent === requestedRole) return true;
  if (
    GENERAL_PORTAL_ROLES.has(normalizedCurrent) &&
    GENERAL_PORTAL_ROLES.has(requestedRole)
  ) {
    return true;
  }
  return false;
};

export async function signInWithGoogle(idToken, { targetRole } = {}) {
  const payload = await verifyGoogleToken(idToken);
  const email = payload?.email?.toLowerCase?.();
  if (!email) throw new Error('Google account missing verified email');

  const requestedRole =
    typeof targetRole === 'string' && targetRole.trim() ? normaliseRole(targetRole) : null;
  const resolvedRole = requestedRole || 'user';

  let user = await User.findOne({ email });
  if (!user) {
    const randomPass = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const passHash = await argon2.hash(randomPass);
    user = await User.create({
      email,
      passHash,
      role: resolvedRole,
      rolesGlobal: [],
      memberships: [],
      isClient: resolvedRole === 'client',
    });
  } else {
    const currentRole = user.role || 'user';
    if (!rolesCompatible(currentRole, requestedRole) && ALLOWED_ROLES.has(requestedRole)) {
      const workspace = describeWorkspace(currentRole);
      throw new Error(
        `This Google account is already linked to the ${workspace} dashboard. Please sign in through that portal.`,
      );
    }
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

export const googleAuthConfigured = () => hasGoogleClients;
