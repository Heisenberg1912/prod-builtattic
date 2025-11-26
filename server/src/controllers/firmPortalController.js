import { z } from 'zod';
import Firm from '../models/Firm.js';
import { resolveFirmIdAsync } from '../utils/firmAccess.js';

const httpError = (status, message, details) => Object.assign(new Error(message), { statusCode: status, details });

const arrayOfStrings = (options = {}) =>
  z
    .array(z.string().trim().min(1).max(options.maxLength || 160))
    .max(options.maxItems || 50)
    .optional();

const profileInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    tagline: z.string().trim().max(200).optional(),
    summary: z.string().trim().max(4000).optional(),
    foundedYear: z.number().int().min(1800).max(new Date().getFullYear() + 1).optional(),
    teamSize: z.number().int().min(0).max(50000).optional(),
    headquarters: z.string().trim().max(240).optional(),
    regions: arrayOfStrings({ maxItems: 24 }),
    services: arrayOfStrings({ maxItems: 24 }),
    specialisations: arrayOfStrings({ maxItems: 24 }),
    notableProjects: arrayOfStrings({ maxItems: 24, maxLength: 200 }),
    awards: arrayOfStrings({ maxItems: 24, maxLength: 200 }),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().trim().max(40).optional(),
    website: z.string().trim().max(240).optional(),
    heroImage: z.string().trim().url().optional(),
    gallery: arrayOfStrings({ maxItems: 30, maxLength: 500 }),
    certifications: arrayOfStrings({ maxItems: 20 }),
    billingCurrency: z.string().trim().min(3).max(4).optional(),
    averageFee: z.number().min(0).max(1_000_000_000).optional(),
    partnerNetwork: arrayOfStrings({ maxItems: 24 }),
    languages: arrayOfStrings({ maxItems: 20 }),
    sustainability: z.string().trim().max(2000).optional(),
    secretCode: z.string().trim().max(120).optional(),
    letterOfIntent: z.string().trim().max(4000).optional(),
    leadTimeDays: z.number().int().min(0).max(2000).optional(),
    minOrderQuantity: z.number().min(0).max(1_000_000).optional(),
    productionCapacity: z.string().trim().max(200).optional(),
    paymentTerms: z.string().trim().max(400).optional(),
    shippingRegions: arrayOfStrings({ maxItems: 24, maxLength: 200 }),
    logisticsNotes: z.string().trim().max(2000).optional(),
    catalogCategories: arrayOfStrings({ maxItems: 24, maxLength: 120 }),
    catalogHighlights: arrayOfStrings({ maxItems: 24, maxLength: 240 }),
    catalogSkus: arrayOfStrings({ maxItems: 60, maxLength: 120 }),
  })
  .partial();

const compactObject = (input) => {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input)) {
    return input
      .map(compactObject)
      .filter((value) =>
        value !== undefined &&
        value !== null &&
        (typeof value !== 'object' || (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0))
      );
  }
  return Object.entries(input).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null) return accumulator;
    const normalisedValue = compactObject(value);
    const isEmptyObject =
      typeof normalisedValue === 'object' &&
      normalisedValue !== null &&
      !Array.isArray(normalisedValue) &&
      Object.keys(normalisedValue).length === 0;
    const isEmptyArray = Array.isArray(normalisedValue) && normalisedValue.length === 0;
    if (isEmptyObject || isEmptyArray) return accumulator;
    accumulator[key] = normalisedValue;
    return accumulator;
  }, {});
};

const enrichFirmWithProfile = (firm, profile) => {
  const enriched = firm;
  if (profile?.tagline) enriched.tagline = profile.tagline;
  if (profile?.summary) enriched.description = profile.summary;
  if (profile?.services) enriched.services = profile.services;
  if (profile?.specialisations) enriched.styles = profile.specialisations;
  if (profile?.heroImage) enriched.coverImage = profile.heroImage;
  if (profile?.gallery) enriched.gallery = profile.gallery;
  if (profile?.regions) enriched.operatingRegions = profile.regions;
  if (profile?.languages) enriched.languages = profile.languages;
  if (profile?.partnerNetwork) enriched.partners = profile.partnerNetwork;
  if (profile?.averageFee !== undefined) enriched.priceSqft = profile.averageFee;
  if (profile?.billingCurrency) enriched.currency = profile.billingCurrency;
  if (profile?.contactEmail || profile?.contactPhone || profile?.website) {
    enriched.contact = enriched.contact || {};
    if (profile.contactEmail) enriched.contact.email = profile.contactEmail;
    if (profile.contactPhone) enriched.contact.phone = profile.contactPhone;
    if (profile.website) enriched.contact.website = profile.website;
  }
  if (profile?.headquarters) {
    const [city, country] = profile.headquarters.split(',').map((part) => part.trim()).filter(Boolean);
    if (city || country) {
      enriched.location = enriched.location || {};
      if (city) enriched.location.city = city;
      if (country) enriched.location.country = country;
    }
  }
  if (profile?.name) enriched.name = profile.name;
  return enriched;
};

export const getFirmProfile = async (req, res, next) => {
  try {
    const firmId = await resolveFirmIdAsync(req, undefined, { provisionIfMissing: true, allowedRoles: ['owner', 'admin', 'vendor'] });
    const firm = await Firm.findById(firmId).lean();
    if (!firm) {
      throw httpError(404, 'Firm not found');
    }
    res.json({
      ok: true,
      firm: firm,
      profile: firm.profile || {},
      meta: { updatedAt: firm.profile?.updatedAt || firm.updatedAt },
    });
  } catch (error) {
    next(error);
  }
};

export const upsertFirmProfile = async (req, res, next) => {
  try {
    const firmId = await resolveFirmIdAsync(req, undefined, { provisionIfMissing: true, allowedRoles: ['owner', 'admin', 'vendor'] });
    const parsed = profileInputSchema.parse(req.body || {});
    const cleaned = compactObject(parsed);
    cleaned.updatedAt = new Date().toISOString();

    const firm = await Firm.findById(firmId);
    if (!firm) {
      throw httpError(404, 'Firm not found');
    }

    firm.profile = { ...(firm.profile || {}), ...cleaned };
    enrichFirmWithProfile(firm, firm.profile);
    await firm.save();

    res.json({
      ok: true,
      firm: firm.toObject(),
      profile: firm.profile || {},
      meta: { updatedAt: firm.profile?.updatedAt },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(httpError(400, 'Validation failed', error.flatten()));
    }
    next(error);
  }
};
