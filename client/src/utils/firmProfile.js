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

const getNowISO = () => new Date().toISOString();

const safeParseJSON = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const FIRM_PROFILE_CACHE_KEY = 'firm_profile_cache_v1';
const firmProfileStorageKey = (firmId) =>
  firmId ? `${FIRM_PROFILE_CACHE_KEY}::${firmId}` : FIRM_PROFILE_CACHE_KEY;


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
  billingCurrency: normaliseString(profile.billingCurrency || profile.currency || 'USD') || 'USD',
  averageFee: profile.averageFee ?? profile.priceSqft ?? '',
  partnerNetwork: toLineString(profile.partnerNetwork || profile.partners),
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

export const mapFirmToProfile = (firm = {}, owner = null) => {
  const source = firm.profile || {};
  const locationFallback = [firm.location?.city, firm.location?.country].filter(Boolean).join(', ');
  return {
    name: source.name || firm.name || firm.title || owner?.firmName || '',
    tagline: source.tagline || firm.tagline || '',
    summary: source.summary || firm.bio || firm.description || '',
    foundedYear: source.foundedYear ?? firm.foundedYear ?? undefined,
    teamSize: source.teamSize ?? firm.teamSize ?? undefined,
    headquarters: source.headquarters || locationFallback,
    regions: Array.isArray(source.regions) ? source.regions : firm.operatingRegions || [],
    services: Array.isArray(source.services) ? source.services : firm.services || [],
    specialisations: Array.isArray(source.specialisations) ? source.specialisations : firm.styles || [],
    notableProjects: Array.isArray(source.notableProjects) ? source.notableProjects : firm.notableProjects || [],
    awards: Array.isArray(source.awards) ? source.awards : firm.awards || [],
    contactEmail: source.contactEmail || firm.contact?.email || firm.email || owner?.email || '',
    contactPhone: source.contactPhone || firm.contact?.phone || firm.phone || '',
    website: source.website || firm.contact?.website || firm.website || '',
    heroImage: source.heroImage || firm.coverImage || firm.heroImage || '',
    gallery: Array.isArray(source.gallery) ? source.gallery : firm.gallery || [],
    certifications: Array.isArray(source.certifications) ? source.certifications : firm.certifications || [],
    billingCurrency: source.billingCurrency || firm.currency || firm.pricing?.currency || 'USD',
    averageFee:
      source.averageFee !== undefined
        ? source.averageFee
        : firm.priceSqft != null
        ? Number(firm.priceSqft)
        : undefined,
    partnerNetwork: Array.isArray(source.partnerNetwork) ? source.partnerNetwork : firm.partners || [],
    languages: Array.isArray(source.languages) ? source.languages : firm.languages || [],
    sustainability: source.sustainability || firm.sustainability || '',
    secretCode: source.secretCode || firm.secretCode || '',
    letterOfIntent: source.letterOfIntent || firm.letterOfIntent || firm.loi || '',
    leadTimeDays: source.leadTimeDays ?? undefined,
    minOrderQuantity: source.minOrderQuantity ?? undefined,
    shippingRegions: Array.isArray(source.shippingRegions) ? source.shippingRegions : [],
    catalogCategories: Array.isArray(source.catalogCategories) ? source.catalogCategories : [],
    catalogHighlights: Array.isArray(source.catalogHighlights) ? source.catalogHighlights : [],
    catalogSkus: Array.isArray(source.catalogSkus) ? source.catalogSkus : [],
    updatedAt: source.updatedAt || firm.updatedAt || firm.createdAt || getNowISO(),
  };
};

export const decorateFirmWithProfile = (firm = {}, profileOverride = null) => {
  const profile = profileOverride || firm.profile || null;
  if (!profile) return { ...firm };
  const enriched = { ...firm, profile: { ...profile } };
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
    if (city || country) {
      enriched.location = enriched.location || {};
      if (city) enriched.location.city = city;
      if (country) enriched.location.country = country;
    }
  }
  if (profile.averageFee !== undefined) enriched.priceSqft = profile.averageFee;
  if (profile.billingCurrency) enriched.currency = profile.billingCurrency;
  if (profile.certifications?.length) enriched.certifications = profile.certifications;
  if (profile.sustainability) enriched.sustainability = profile.sustainability;
  if (profile.secretCode) enriched.secretCode = profile.secretCode;
  if (profile.letterOfIntent) enriched.letterOfIntent = profile.letterOfIntent;
  if (profile.contactEmail || profile.contactPhone || profile.website) {
    enriched.contact = { ...(enriched.contact || {}) };
    if (profile.contactEmail) enriched.contact.email = profile.contactEmail;
    if (profile.contactPhone) enriched.contact.phone = profile.contactPhone;
    if (profile.website) enriched.contact.website = profile.website;
  }
  if (profile.updatedAt) enriched.profileUpdatedAt = profile.updatedAt;
  return enriched;
};

export const decorateFirmsWithProfiles = (firms = []) => firms.map((firm) => decorateFirmWithProfile(firm));

const readCachedFirmProfile = (firmId) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    return safeParseJSON(window.localStorage.getItem(firmProfileStorageKey(firmId)));
  } catch (error) {
    console.warn('firm_profile_cache_read_error', error);
    return null;
  }
};

export const cacheFirmProfile = (profile, firmId) => {
  if (!profile || typeof window === 'undefined' || !window.localStorage) {
    return profile || null;
  }
  try {
    window.localStorage.setItem(firmProfileStorageKey(firmId), JSON.stringify(profile));
  } catch (error) {
    console.warn('firm_profile_cache_write_error', error);
  }
  return profile || null;
};

export const loadFirmProfile = (firmId, fallbackFirm = null) => {
  const cached = readCachedFirmProfile(firmId);
  if (cached) {
    return cached;
  }
  const profile = fallbackFirm?.profile || null;
  if (profile) {
    cacheFirmProfile(profile, firmId);
  }
  return profile;
};

