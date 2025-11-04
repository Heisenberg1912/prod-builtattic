const STORAGE_KEY = 'firm_dashboard_profiles_v1';

const toLineString = (value) => (Array.isArray(value) ? value.join("\n") : value || "");
const toCommaString = (value) => (Array.isArray(value) ? value.join(", ") : value || "");

const splitLines = (value, limit) => {
  if (!value) return [];
  const entries = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  return typeof limit === 'number' ? entries.slice(0, limit) : entries;
};

const splitComma = (value, limit) => {
  if (!value) return [];
  const entries = value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return typeof limit === 'number' ? entries.slice(0, limit) : entries;
};

const safeParseJSON = (value, fallback = {}) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const getNowISO = () => new Date().toISOString();

const readStoredProfiles = () => {
  if (typeof window === 'undefined') return {};
  return safeParseJSON(localStorage.getItem(STORAGE_KEY), {});
};

const writeStoredProfiles = (profiles) => {
  if (typeof window === 'undefined') return profiles;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.warn('firm_profile_storage_error', error);
  }
  return profiles;
};

const normaliseKey = (firmId, firm) => {
  if (firmId) return String(firmId);
  if (firm?._id) return String(firm._id);
  if (firm?.slug) return String(firm.slug);
  if (firm?.name) return firm.name.toLowerCase().replace(/\s+/g, '-');
  return 'local-firm-profile';
};

export const EMPTY_FIRM_PROFILE_FORM = {
  name: '',
  tagline: '',
  summary: '',
  foundedYear: '',
  teamSize: '',
  headquarters: '',
  regions: '',
  services: '',
  specialisations: '',
  notableProjects: '',
  awards: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  heroImage: '',
  gallery: '',
  certifications: '',
  billingCurrency: 'USD',
  averageFee: '',
  partnerNetwork: '',
  languages: '',
  sustainability: '',
  secretCode: '',
  letterOfIntent: '',
};

const normaliseString = (value) => (typeof value === 'string' ? value.trim() : '');

export const mapFirmProfileToForm = (profile = {}) => ({
  ...EMPTY_FIRM_PROFILE_FORM,
  name: normaliseString(profile.name || profile.companyName || profile.title),
  tagline: normaliseString(profile.tagline),
  summary: normaliseString(profile.summary || profile.bio || profile.about),
  foundedYear: profile.foundedYear ?? profile.founded ?? '',
  teamSize: profile.teamSize ?? profile.team ?? '',
  headquarters: normaliseString(profile.headquarters || profile.location || profile.address),
  regions: toLineString(profile.regions || profile.deliveryRegions || profile.operatingRegions),
  services: toCommaString(profile.services),
  specialisations: toCommaString(profile.specialisations || profile.styles),
  notableProjects: toLineString(profile.notableProjects || profile.projects),
  awards: toLineString(profile.awards),
  contactEmail: normaliseString(profile.contactEmail || profile.email),
  contactPhone: normaliseString(profile.contactPhone || profile.phone),
  website: normaliseString(profile.website),
  heroImage: normaliseString(profile.heroImage || profile.coverImage),
  gallery: toLineString(profile.gallery),
  certifications: toCommaString(profile.certifications),
  billingCurrency: normaliseString(profile.billingCurrency || profile.currency || 'USD'),
  averageFee: profile.averageFee ?? profile.priceSqft ?? '',
  partnerNetwork: toLineString(profile.partners || profile.partnerNetwork),
  languages: toCommaString(profile.languages),
  sustainability: normaliseString(profile.sustainability || profile.initiatives),
  secretCode: normaliseString(profile.secretCode),
  letterOfIntent: normaliseString(profile.letterOfIntent || profile.loi),
});

const sanitiseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const firmFormToProfile = (form = {}) => {
  const profile = {
    name: normaliseString(form.name),
    tagline: normaliseString(form.tagline),
    summary: normaliseString(form.summary),
    foundedYear: sanitiseNumber(form.foundedYear),
    teamSize: sanitiseNumber(form.teamSize),
    headquarters: normaliseString(form.headquarters),
    regions: splitLines(form.regions, 12),
    services: splitComma(form.services, 20),
    specialisations: splitComma(form.specialisations, 20),
    notableProjects: splitLines(form.notableProjects, 12),
    awards: splitLines(form.awards, 10),
    contactEmail: normaliseString(form.contactEmail),
    contactPhone: normaliseString(form.contactPhone),
    website: normaliseString(form.website),
    heroImage: normaliseString(form.heroImage),
    gallery: splitLines(form.gallery, 12),
    certifications: splitComma(form.certifications, 12),
    billingCurrency: normaliseString(form.billingCurrency || 'USD') || 'USD',
    averageFee: sanitiseNumber(form.averageFee),
    partnerNetwork: splitLines(form.partnerNetwork, 12),
    languages: splitComma(form.languages, 12),
    sustainability: normaliseString(form.sustainability),
    secretCode: normaliseString(form.secretCode),
    letterOfIntent: normaliseString(form.letterOfIntent),
  };

  Object.keys(profile).forEach((key) => {
    const value = profile[key];
    const isArray = Array.isArray(value);
    if (
      value === undefined ||
      value === null ||
      (isArray && value.length === 0) ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      delete profile[key];
    }
  });

  return profile;
};

export const deriveFirmProfileStats = (profile = {}) => {
  const services = Array.isArray(profile.services) ? profile.services.length : 0;
  const regions = Array.isArray(profile.regions) ? profile.regions.length : 0;
  const projects = Array.isArray(profile.notableProjects) ? profile.notableProjects.length : 0;
  const certifications = Array.isArray(profile.certifications) ? profile.certifications.length : 0;
  const partners = Array.isArray(profile.partnerNetwork) ? profile.partnerNetwork.length : 0;
  const languages = Array.isArray(profile.languages) ? profile.languages.length : 0;
  const team = Number(profile.teamSize) || null;

  return {
    services,
    regions,
    projects,
    certifications,
    partners,
    languages,
    team,
  };
};

export const loadFirmProfile = (firmId, firm) => {
  const key = normaliseKey(firmId, firm);
  const stored = readStoredProfiles();
  return stored[key] || null;
};

export const saveFirmProfile = (firmId, profile, firm) => {
  const key = normaliseKey(firmId, profile || firm);
  const stored = readStoredProfiles();
  stored[key] = {
    ...(stored[key] || {}),
    ...profile,
    updatedAt: profile?.updatedAt || getNowISO(),
  };
  writeStoredProfiles(stored);
  return stored[key];
};

export const clearFirmProfile = (firmId, firm) => {
  const key = normaliseKey(firmId, firm);
  const stored = readStoredProfiles();
  if (stored[key]) {
    delete stored[key];
    writeStoredProfiles(stored);
  }
};

export const mapFirmToProfile = (firm = {}, owner = null) => {
  const locationParts = [firm.location?.city, firm.location?.country].filter(Boolean);
  const fee = firm.priceSqft != null ? Number(firm.priceSqft) : undefined;

  return {
    name: firm.name || firm.title || owner?.firmName || '',
    tagline: firm.tagline || '',
    summary: firm.bio || firm.description || '',
    foundedYear: firm.foundedYear || undefined,
    teamSize: firm.teamSize || undefined,
    headquarters: locationParts.join(', '),
    regions: firm.operatingRegions || [],
    services: Array.isArray(firm.services) ? firm.services : [],
    specialisations: Array.isArray(firm.styles) ? firm.styles : [],
    notableProjects: Array.isArray(firm.notableProjects) ? firm.notableProjects : [],
    awards: Array.isArray(firm.awards) ? firm.awards : [],
    contactEmail: firm.contact?.email || firm.email || owner?.email || '',
    contactPhone: firm.contact?.phone || firm.phone || '',
    website: firm.website || '',
    heroImage: firm.coverImage || firm.heroImage || '',
    gallery: Array.isArray(firm.gallery) ? firm.gallery : [],
    certifications: Array.isArray(firm.certifications) ? firm.certifications : [],
    billingCurrency: firm.currency || firm.pricing?.currency || 'USD',
    averageFee: fee,
    partnerNetwork: Array.isArray(firm.partners) ? firm.partners : [],
    languages: Array.isArray(firm.languages) ? firm.languages : [],
    sustainability: firm.sustainability || '',
    secretCode: firm.secretCode || '',
    letterOfIntent: firm.letterOfIntent || firm.loi || '',
    updatedAt: firm.updatedAt || firm.createdAt || getNowISO(),
  };
};

export const decorateFirmWithProfile = (firm = {}, profile = null) => {
  if (!profile) return firm;
  const enriched = { ...firm };
  if (profile.name) enriched.name = profile.name;
  if (profile.summary) enriched.bio = profile.summary;
  if (profile.specialisations?.length) enriched.styles = profile.specialisations;
  if (profile.services?.length) enriched.services = profile.services;
  if (profile.heroImage) enriched.coverImage = profile.heroImage;
  if (profile.gallery?.length) enriched.gallery = Array.from(new Set(profile.gallery));
  if (profile.tagline) enriched.tagline = profile.tagline;
  if (profile.regions?.length) enriched.operatingRegions = profile.regions;
  if (profile.languages?.length) enriched.languages = profile.languages;
  if (profile.partnerNetwork?.length) enriched.partners = profile.partnerNetwork;
  if (profile.notableProjects?.length) enriched.notableProjects = profile.notableProjects;
  if (profile.awards?.length) enriched.awards = profile.awards;
  if (profile.headquarters) {
    const [city, country] = profile.headquarters.split(',').map((part) => part.trim());
    enriched.location = enriched.location || {};
    if (city) enriched.location.city = city;
    if (country) enriched.location.country = country;
  }
  if (profile.averageFee) enriched.priceSqft = profile.averageFee;
  if (profile.billingCurrency) enriched.currency = profile.billingCurrency;
  if (profile.certifications?.length) enriched.certifications = profile.certifications;
  if (profile.sustainability) enriched.sustainability = profile.sustainability;
  if (profile.secretCode) enriched.secretCode = profile.secretCode;
  if (profile.letterOfIntent) enriched.letterOfIntent = profile.letterOfIntent;
  if (profile.contactEmail || profile.contactPhone) {
    enriched.contact = { ...(enriched.contact || {}) };
    if (profile.contactEmail) enriched.contact.email = profile.contactEmail;
    if (profile.contactPhone) enriched.contact.phone = profile.contactPhone;
  }
  if (profile.website) enriched.website = profile.website;
  if (profile.updatedAt) enriched.profileUpdatedAt = profile.updatedAt;
  return enriched;
};

export const decorateFirmsWithProfiles = (firms = []) => {
  const stored = readStoredProfiles();
  return firms.map((firm) => {
    const key = normaliseKey(firm?._id, firm);
    const profile = stored[key] || null;
    return decorateFirmWithProfile(firm, profile);
  });
};
