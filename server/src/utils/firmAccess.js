import mongoose from 'mongoose';
import { ensureFirmMembership } from '../services/roleProvisioning.js';

const normaliseRole = (role) => String(role || '').toLowerCase();

export const isGlobalAdmin = (user) => {
  if (!user) return false;
  const primary = normaliseRole(user.role);
  if (primary === 'superadmin' || primary === 'admin') return true;
  const globals = (user.rolesGlobal || []).map(normaliseRole);
  return globals.includes('superadmin') || globals.includes('admin');
};

const resolveMemberships = (user) =>
  (user?.memberships || []).map((membership) => ({
    firm: membership.firm?.toString?.() || membership.firm,
    role: normaliseRole(membership.role),
  }));

export const resolveFirmId = (req, explicitFirmId) => {
  const memberships = resolveMemberships(req.user);
  const global = isGlobalAdmin(req.user);

  let firmId = explicitFirmId || req.params.firmId || req.query.firmId;

  // Prefer an existing membership when no firmId is passed (helps admins running portal routes)
  if (!firmId && memberships.length === 1) {
    firmId = memberships[0].firm;
  } else if (!firmId && global && memberships.length > 0) {
    firmId = memberships[0].firm;
  }

  if (!firmId) {
    if (global) {
      throw Object.assign(new Error('firmId is required for admin users'), { statusCode: 400 });
    }
    throw Object.assign(new Error('No firm membership found for user'), { statusCode: 403 });
  }

  if (!mongoose.isValidObjectId(firmId)) {
    throw Object.assign(new Error('Invalid firmId provided'), { statusCode: 400 });
  }

  if (global) return firmId;
  const membership = memberships.find((item) => item.firm === firmId);
  if (!membership) {
    throw Object.assign(new Error('You are not linked to this firm'), { statusCode: 403 });
  }
  return membership.firm;
};

// Async variant that can auto-provision a firm membership (used by portal flows)
export const resolveFirmIdAsync = async (
  req,
  explicitFirmId,
  { provisionIfMissing = true, allowedRoles = ['owner', 'admin'] } = {},
) => {
  const memberships = resolveMemberships(req.user);
  const global = isGlobalAdmin(req.user);

  let firmId = explicitFirmId || req.params?.firmId || req.query?.firmId;

  if (!firmId && memberships.length === 1) {
    firmId = memberships[0].firm;
  } else if (!firmId && global && memberships.length > 0) {
    firmId = memberships[0].firm;
  }

  if (!firmId && provisionIfMissing) {
    try {
      const provisioned = await ensureFirmMembership?.(req.user, allowedRoles);
      if (provisioned?.firm) {
        firmId = provisioned.firm?.toString?.() || provisioned.firm;
      }
    } catch (error) {
      // fall through to standard errors below
    }
  }

  if (!firmId) {
    if (global) {
      throw Object.assign(new Error('firmId is required for admin users'), { statusCode: 400 });
    }
    throw Object.assign(new Error('No firm membership found for user'), { statusCode: 403 });
  }

  if (!mongoose.isValidObjectId(firmId)) {
    throw Object.assign(new Error('Invalid firmId provided'), { statusCode: 400 });
  }

  if (global) return firmId;
  const membership = resolveMemberships(req.user).find((item) => item.firm === firmId);
  if (!membership) {
    throw Object.assign(new Error('You are not linked to this firm'), { statusCode: 403 });
  }
  return membership.firm;
};

export default {
  resolveFirmId,
  resolveFirmIdAsync,
  isGlobalAdmin,
};
