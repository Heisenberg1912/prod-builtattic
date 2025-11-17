import { Types } from "mongoose";
import { z } from "zod";
import AssociateProfile from "../models/AssociateProfile.js";

const dayEnum = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

const availabilityWindowSchema = z
  .object({
    day: dayEnum,
    from: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    to: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
  })
  .refine(
    (window) => {
      if (!window.from && !window.to) return true;
      return Boolean(window.from && window.to);
    },
    {
      message: "Both from and to are required when specifying availability windows",
      path: ["to"],
    }
  );

const keyProjectSchema = z.object({
  title: z.string().trim().min(2).max(160),
  scope: z.string().trim().max(200).optional(),
  year: z
    .number({ invalid_type_error: "year must be a number" })
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  role: z.string().trim().max(80).optional(),
});

const ratesSchema = z
  .object({
    hourly: z.number().min(0).max(100000).optional(),
    daily: z.number().min(0).max(500000).optional(),
    currency: z.string().trim().length(3).or(z.string().trim().length(4)).optional(),
  })
  .partial();

const urlishString = z.string().trim().min(4).max(2048);

const portfolioMediaItemSchema = z.object({
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(600).optional(),
  mediaUrl: urlishString,
  kind: z.string().trim().max(48).optional(),
});

const profileInputSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    location: z.string().trim().max(160).optional(),
    hourlyRate: z.number().min(0).max(100000).optional(),
    rates: ratesSchema.optional(),
    availability: z.string().trim().max(240).optional(),
    availabilityWindows: z.array(availabilityWindowSchema).max(14).optional(),
    timezone: z.string().trim().max(80).optional(),
    experienceYears: z.number().min(0).max(80).optional(),
    specialisations: z.array(z.string().trim().min(1).max(120)).max(24).optional(),
    softwares: z.array(z.string().trim().min(1).max(120)).max(24).optional(),
    languages: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
    completedProjects: z.number().min(0).max(2000).optional(),
    rating: z.number().min(0).max(5).optional(),
    avatar: urlishString.optional(),
    heroImage: urlishString.optional(),
    profileImage: urlishString.optional(),
    summary: z.string().trim().max(1200).optional(),
    certifications: z.array(z.string().trim().min(1).max(140)).max(20).optional(),
    portfolioLinks: z.array(z.string().trim().url()).max(15).optional(),
    keyProjects: z.array(keyProjectSchema).max(12).optional(),
    contactEmail: z.string().trim().email().optional(),
    serviceBadges: z.array(z.string().trim().min(1).max(80)).max(24).optional(),
    deliverables: z.array(z.string().trim().min(1).max(160)).max(40).optional(),
    expertise: z.array(z.string().trim().min(1).max(160)).max(40).optional(),
    portfolioMedia: z.array(portfolioMediaItemSchema).max(20).optional(),
  })
  .partial();

const httpError = (status, message, details) => Object.assign(new Error(message), { statusCode: status, details });

const normaliseStringArray = (value) => {
  if (!Array.isArray(value)) return undefined;
  const normalised = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  if (normalised.length === 0) return [];
  return Array.from(new Set(normalised));
};

const normaliseProjectArray = (projects) => {
  if (!Array.isArray(projects)) return undefined;
  const cleaned = projects
    .map((project) => ({
      title: project.title?.trim(),
      scope: project.scope?.trim(),
      year: project.year,
      role: project.role?.trim(),
    }))
    .filter((project) => project.title);
  return cleaned;
};

const normaliseMediaArray = (media) => {
  if (!Array.isArray(media)) return undefined;
  return media
    .map((item) => ({
      title: item.title?.trim(),
      description: item.description?.trim(),
      mediaUrl: item.mediaUrl?.trim(),
      kind: item.kind?.trim(),
    }))
    .filter((item) => item.mediaUrl);
};

const compactObject = (input) => {
  if (!input || typeof input !== "object") return input;
  if (Array.isArray(input)) {
    return input
      .map(compactObject)
      .filter(
        (value) =>
          value !== undefined &&
          value !== null &&
          (typeof value !== "object" || (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0))
      );
  }
  return Object.entries(input).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null) return accumulator;
    const normalisedValue = compactObject(value);
    const isEmptyObject =
      typeof normalisedValue === "object" &&
      normalisedValue !== null &&
      !Array.isArray(normalisedValue) &&
      Object.keys(normalisedValue).length === 0;
    if (isEmptyObject) return accumulator;
    accumulator[key] = normalisedValue;
    return accumulator;
  }, {});
};

export const getOwnAssociateProfile = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw httpError(401, "Unauthorized");
    }
    const profile = await AssociateProfile.findOne({ user: req.user._id })
      .populate("user", "email role firstName lastName name")
      .lean();
    res.json({ ok: true, profile });
  } catch (error) {
    next(error);
  }
};

export const upsertOwnAssociateProfile = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw httpError(401, "Unauthorized");
    }
    const parsed = profileInputSchema.parse(req.body || {});

    const update = { ...parsed };
    if (update.specialisations) update.specialisations = normaliseStringArray(update.specialisations) || [];
    if (update.softwares) update.softwares = normaliseStringArray(update.softwares) || [];
    if (update.languages) update.languages = normaliseStringArray(update.languages) || [];
    if (update.certifications) update.certifications = normaliseStringArray(update.certifications) || [];
    if (update.serviceBadges) update.serviceBadges = normaliseStringArray(update.serviceBadges) || [];
    if (update.deliverables) update.deliverables = normaliseStringArray(update.deliverables) || [];
    if (update.expertise) update.expertise = normaliseStringArray(update.expertise) || [];
    if (update.portfolioLinks) update.portfolioLinks = normaliseStringArray(update.portfolioLinks) || [];
    if (update.keyProjects) update.keyProjects = normaliseProjectArray(update.keyProjects) || [];
    if (update.portfolioMedia) update.portfolioMedia = normaliseMediaArray(update.portfolioMedia) || [];
    if (update.rates?.currency) update.rates.currency = update.rates.currency.toUpperCase();
    if (update.contactEmail) update.contactEmail = update.contactEmail.toLowerCase();
    if (update.heroImage) update.heroImage = update.heroImage.trim();
    if (update.profileImage) update.profileImage = update.profileImage.trim();

    const cleaned = compactObject(update);

    const profile = await AssociateProfile.findOneAndUpdate(
      { user: new Types.ObjectId(req.user._id) },
      { $set: { ...cleaned, user: req.user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("user", "email role firstName lastName name")
      .lean();

    res.json({ ok: true, profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(httpError(400, "Validation failed", error.flatten()));
    }
    next(error);
  }
};
