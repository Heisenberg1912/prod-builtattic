import mongoose from 'mongoose';

import AssociateProfile from '../models/AssociateProfile.js';
import {
  ensureAssociateProfile as provisionAssociateProfile,
  ensureFirmMembership as provisionFirmMembership,
} from '../services/roleProvisioning.js';

export const OWNER_TYPES = {
  ASSOCIATE: 'associate',
  FIRM: 'firm',
};

export const resolveFirmMembership = (user, allowedRoles = ['owner', 'admin', 'associate']) => {
  const memberships = (user?.memberships || []).map((membership) => ({
    firm: membership.firm?.toString?.() || membership.firm,
    role: String(membership.role || '').toLowerCase(),
  }));
  if (!memberships.length) return null;
  const preferred = memberships.find((entry) => allowedRoles.includes(entry.role));
  return preferred || memberships[0];
};

export const ensureAssociateOwnerId = async (user) => {
  if (!user?._id) return null;
  const existing = await AssociateProfile.findOne({ user: user._id }).select('_id').lean();
  if (existing?._id) {
    return new mongoose.Types.ObjectId(existing._id);
  }
  const created = await provisionAssociateProfile(user);
  if (created?._id) {
    return new mongoose.Types.ObjectId(created._id);
  }
  return null;
};

export const ensureFirmOwnerId = async (user, allowedRoles = ['owner', 'admin', 'associate']) => {
  if (!user?._id) return null;
  const membership =
    (await provisionFirmMembership(user, allowedRoles)) || resolveFirmMembership(user, allowedRoles);
  if (!membership?.firm) return null;
  return new mongoose.Types.ObjectId(membership.firm);
};

export const deriveOwnerType = (user, requested) => {
  const normalized = String(requested || '').toLowerCase();
  if (normalized === OWNER_TYPES.ASSOCIATE || normalized === OWNER_TYPES.FIRM) {
    return normalized;
  }
  const role = String(user?.role || '').toLowerCase();
  if (role === OWNER_TYPES.ASSOCIATE) return OWNER_TYPES.ASSOCIATE;
  return OWNER_TYPES.FIRM;
};

export const determineOwnerScope = async (user, requestedType) => {
  if (!user?._id) {
    return { error: 'unauthorized' };
  }
  const ownerType = deriveOwnerType(user, requestedType);
  if (ownerType === OWNER_TYPES.ASSOCIATE) {
    const ownerId = await ensureAssociateOwnerId(user);
    if (!ownerId) {
      return { ownerType, error: 'associate_missing' };
    }
    return { ownerType, ownerId };
  }
  const ownerId = await ensureFirmOwnerId(user);
  if (!ownerId) {
    return { ownerType: OWNER_TYPES.FIRM, error: 'firm_missing' };
  }
  return { ownerType: OWNER_TYPES.FIRM, ownerId };
};

export default {
  OWNER_TYPES,
  resolveFirmMembership,
  ensureAssociateOwnerId,
  ensureFirmOwnerId,
  deriveOwnerType,
  determineOwnerScope,
};

