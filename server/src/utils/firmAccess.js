import mongoose from 'mongoose';

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
  if (!firmId && memberships.length === 1) {
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

export default {
  resolveFirmId,
  isGlobalAdmin,
};

