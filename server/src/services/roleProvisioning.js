import Firm from '../models/Firm.js';
import AssociateProfile from '../models/AssociateProfile.js';
import User from '../models/User.js';
import { ensureUniqueSlug } from '../utils/slugify.js';

const resolveFirmMembership = (user, allowedRoles = ['owner', 'admin', 'associate']) => {
  const memberships = (user?.memberships || []).map((membership) => ({
    firm: membership.firm?.toString?.() || membership.firm,
    role: String(membership.role || '').toLowerCase(),
  }));
  if (!memberships.length) return null;
  const preferred = memberships.find((entry) => allowedRoles.includes(entry.role));
  return preferred || memberships[0];
};

const deriveFirmName = (profile = {}, user) => {
  const fromProfile =
    profile.companyName ||
    profile.legalName ||
    profile.brandName ||
    profile.firmName ||
    profile.fullName;
  if (fromProfile) return fromProfile;
  const local = String(user?.email || 'studio').split('@')[0];
  return `${local.replace(/[^a-z0-9]/gi, ' ')} Studio`.trim();
};

export const ensureAssociateProfile = async (user, overrides = {}) => {
  if (!user?._id) return null;
  const existing = await AssociateProfile.findOne({ user: user._id }).lean();
  if (existing) return existing;
  const defaults = {
    title: overrides.title || 'Associate designer',
    summary:
      overrides.summary ||
      'Update your Skill Studio profile with availability, portfolio links, and recent case studies.',
    location: overrides.location || 'Remote',
    timezone: overrides.timezone || 'UTC',
    languages: overrides.languages || ['English'],
    softwares: overrides.softwares || ['Revit', 'Rhino'],
    availability: overrides.availability || 'Set availability in Skill Studio',
    portfolioLinks: overrides.portfolioLinks || (overrides.portfolioUrl ? [overrides.portfolioUrl] : []),
    hourlyRate: overrides.hourlyRate || 45,
  };
  const profile = await AssociateProfile.create({ user: user._id, ...defaults });
  return profile.toObject();
};

const createFirmForUser = async (user, overrides = {}) => {
  const name = deriveFirmName(overrides, user);
  const slug = await ensureUniqueSlug(Firm, name, { fallback: `firm-${Date.now()}` });
  const profile = {
    name,
    tagline: overrides.tagline || overrides.summary || 'Update your studio profile to publish bundles.',
    summary: overrides.summary || '',
    updatedAt: new Date().toISOString(),
  };
  const firm = await Firm.create({
    name,
    slug,
    ownerUserId: user._id,
    approved: false,
    profile,
  });
  return firm;
};

export const ensureFirmMembership = async (user, allowedRoles = ['owner', 'admin'], overrides = {}) => {
  if (!user?._id) return null;
  const membership = resolveFirmMembership(user, allowedRoles);
  if (membership?.firm) return membership;

  const ownedFirm = await Firm.findOne({ ownerUserId: user._id }).lean();
  const fallbackFirm =
    ownedFirm ||
    (await createFirmForUser(user, overrides)) ||
    (await Firm.findOne().lean());
  if (!fallbackFirm?._id) return null;

  const resolvedRole = ownedFirm ? 'owner' : allowedRoles[0] || 'admin';
  const entry = {
    firm: fallbackFirm._id,
    role: resolvedRole,
    title: resolvedRole === 'owner' ? 'Firm Owner' : 'Firm Admin',
  };

  await User.updateOne(
    { _id: user._id, 'memberships.firm': { $ne: entry.firm } },
    { $push: { memberships: entry } },
  );

  if (Array.isArray(user.memberships)) {
    user.memberships.push({ ...entry, firm: entry.firm.toString() });
  } else {
    user.memberships = [{ ...entry, firm: entry.firm.toString() }];
  }
  return entry;
};

export const autoProvisionUserResources = async (user, { profile } = {}) => {
  if (!user) return;
  const role = String(user.role || '').toLowerCase();
  if (role === 'associate') {
    await ensureAssociateProfile(user, profile);
  }
  if (role === 'firm' || role === 'vendor') {
    await ensureFirmMembership(user, ['owner', 'admin'], profile);
  }
  if (role === 'client' || role === 'user') {
    if (!user.isClient) {
      user.isClient = true;
      await user.save();
    }
  }
};

export default {
  ensureAssociateProfile,
  ensureFirmMembership,
  autoProvisionUserResources,
};
