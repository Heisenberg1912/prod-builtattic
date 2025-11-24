import mongoose from "mongoose";
import { z } from "zod";
import Product from "../models/Product.js";
import { ensureFirmMembership } from "../services/roleProvisioning.js";
import { ensureUniqueSlug } from "../utils/slugify.js";

const OBJECT_ID = z
  .string({ invalid_type_error: "firmId must be a string" })
  .refine((value) => mongoose.isValidObjectId(value), "Invalid firmId provided");

const locationSchema = z
  .object({
    city: z.string().trim().max(120).optional(),
    country: z.string().trim().max(120).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    timezone: z.string().trim().max(80).optional(),
  })
  .partial();

const pricingTierSchema = z.object({
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  price: z.number().min(0),
});

const pricingSchema = z
  .object({
    unit: z.string().trim().max(40).optional(),
    unitLabel: z.string().trim().max(80).optional(),
    currency: z.string().trim().length(3).optional(),
    basePrice: z.number().min(0).optional(),
    minQuantity: z.number().min(0).optional(),
    maxQuantity: z.number().min(0).optional(),
    tierPricing: z.array(pricingTierSchema).max(10).optional(),
  })
  .partial();

const deliverySchema = z
  .object({
    leadTimeWeeks: z.number().min(0).max(208).optional(),
    fulfilmentType: z.enum(["digital", "hybrid", "logistics"]).optional(),
    includesInstallation: z.boolean().optional(),
    handoverMethod: z.enum(["download", "email", "courier", "onsite"]).optional(),
    instructions: z.string().trim().max(2000).optional(),
    items: z.array(z.string().trim().min(1).max(160)).max(30).optional(),
  })
  .partial();

const assetSchema = z
  .object({
    key: z.string().trim().min(1),
    url: z.string().trim().url().optional(),
    filename: z.string().trim().max(160).optional(),
    mimeType: z.string().trim().max(120).optional(),
    sizeBytes: z.number().min(0).optional(),
    checksum: z.string().trim().max(120).optional(),
    kind: z.enum(["preview", "deliverable", "spec", "marketing"]).optional(),
    secure: z.boolean().optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .partial();

const studioPayloadSchema = z
  .object({
    firmId: OBJECT_ID.optional(),
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(6000).optional(),
    summary: z.string().trim().max(600).optional(),
    heroImage: z.string().trim().url().optional(),
    gallery: z.array(z.string().trim().url()).max(20).optional(),
    price: z.number().min(0).optional(),
    priceSqft: z.number().min(0).optional(),
    pricing: pricingSchema.optional(),
    currency: z.string().trim().length(3).optional(),
    category: z.string().trim().max(120).optional(),
    categories: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
    tags: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
    style: z.string().trim().max(120).optional(),
    highlights: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
    areaSqft: z.number().min(0).max(1_000_000).optional(),
    plotAreaSqft: z.number().min(0).max(2_000_000).optional(),
    areaUnit: z.enum(["sq ft", "m2"]).optional(),
    bedrooms: z.number().min(0).max(50).optional(),
    bathrooms: z.number().min(0).max(50).optional(),
    floors: z.number().min(0).max(25).optional(),
    specs: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(160),
          value: z.union([z.string().trim().max(400), z.number()]),
          unit: z.string().trim().max(40).optional(),
        })
      )
      .max(40)
      .optional(),
    location: locationSchema.optional(),
    delivery: deliverySchema.optional(),
    assets: z.array(assetSchema).max(40).optional(),
    highlightsOrder: z.array(z.string()).optional(),
  })
  .partial();

const httpError = (status, message, details) => Object.assign(new Error(message), { statusCode: status, details });

const isGlobalAdmin = (user) => {
  const primary = String(user?.role || "").toLowerCase();
  if (primary === "superadmin" || primary === "admin") return true;
  const globals = (user?.rolesGlobal || []).map((role) => String(role).toLowerCase());
  return globals.includes("superadmin") || globals.includes("admin");
};

const resolveFirmId = async (req, explicitFirmId) => {
  const memberships = (req.user?.memberships || []).map((membership) => ({
    firm: membership.firm?.toString(),
    role: String(membership.role || "").toLowerCase(),
  }));
  const global = isGlobalAdmin(req.user);

  let firmId = explicitFirmId || req.params.firmId || req.query.firmId;
  if (!firmId && memberships.length === 1) {
    firmId = memberships[0].firm;
  }

  if (!firmId) {
    if (!global) {
      const provisioned = await ensureFirmMembership(req.user, ["owner", "admin"]);
      if (provisioned?.firm) return provisioned.firm;
    }
    if (global) {
      throw httpError(400, "firmId is required for admin users");
    }
    throw httpError(403, "No firm membership found for user");
  }

  if (!mongoose.isValidObjectId(firmId)) {
    throw httpError(400, "Invalid firmId provided");
  }

  if (global) return firmId;

  const membership = memberships.find((item) => item.firm === firmId);
  if (!membership) {
    throw httpError(403, "You are not linked to this firm");
  }
  return membership.firm;
};

const sanitiseArray = (value) => {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : null))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
};

const buildMeta = async (firmId) => {
  const [draftCount, publishedCount, total] = await Promise.all([
    Product.countDocuments({ firm: firmId, kind: "studio", status: "draft" }),
    Product.countDocuments({ firm: firmId, kind: "studio", status: "published" }),
    Product.countDocuments({ firm: firmId, kind: "studio" }),
  ]);
  return { total, draftCount, publishedCount };
};

export const listStudios = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, "Unauthorized");
    const firmId = await resolveFirmId(req);
    const statusFilter = req.query.status?.toString();
    const match = { firm: firmId, kind: "studio" };
    if (statusFilter === "draft" || statusFilter === "published") {
      match.status = statusFilter;
    }
    const items = await Product.find(match).sort({ updatedAt: -1 }).lean();
    const meta = await buildMeta(firmId);
    res.json({ ok: true, items, meta });
  } catch (error) {
    next(error);
  }
};

export const getStudio = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, "Unauthorized");
    const firmId = await resolveFirmId(req);
    const studio = await Product.findOne({
      _id: req.params.id,
      firm: firmId,
      kind: "studio",
    }).lean();
    if (!studio) {
      throw httpError(404, "Studio not found");
    }
    res.json({ ok: true, studio });
  } catch (error) {
    next(error);
  }
};

const prepareStudioUpdate = (payload) => {
  const update = { ...payload };
  if (update.categories) update.categories = sanitiseArray(update.categories) || [];
  if (update.tags) update.tags = sanitiseArray(update.tags) || [];
  if (update.highlights) update.highlights = sanitiseArray(update.highlights) || [];
  if (update.gallery) update.gallery = sanitiseArray(update.gallery) || [];
  if (update.category) {
    update.category = update.category.trim();
    update.primaryCategory = update.category;
  }
  if (update.currency) update.currency = update.currency.toUpperCase();
  if (update.pricing?.currency) update.pricing.currency = update.pricing.currency.toUpperCase();

  const metrics = {};
  if (typeof update.areaSqft === 'number') metrics.areaSqft = update.areaSqft;
  if (typeof update.plotAreaSqft === 'number') metrics.plotAreaSqft = update.plotAreaSqft;
  if (update.areaUnit) metrics.areaUnit = update.areaUnit;
  if (Object.keys(metrics).length) {
    update.metrics = { ...(update.metrics || {}), ...metrics };
  }

  const metadata = {};
  if (typeof update.bedrooms === 'number') metadata.bedrooms = update.bedrooms;
  if (typeof update.bathrooms === 'number') metadata.bathrooms = update.bathrooms;
  if (typeof update.floors === 'number') metadata.floors = update.floors;
  if (Object.keys(metadata).length) {
    update.metadata = { ...(update.metadata || {}), ...metadata };
  }
  return update;
};

export const createStudio = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, "Unauthorized");
    const parsed = studioPayloadSchema.parse(req.body || {});
    if (!parsed.title) {
      throw httpError(400, "title is required");
    }
    const firmId = await resolveFirmId(req, parsed.firmId);
    const update = prepareStudioUpdate(parsed);
    const slug = await ensureUniqueSlug(Product, update.title, { fallback: `studio-${Date.now()}` });
    const doc = await Product.create({
      ...update,
      firm: firmId,
      slug,
      kind: "studio",
      status: "draft",
    });
    const meta = await buildMeta(firmId);
    res.status(201).json({ ok: true, studio: doc.toObject(), meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(httpError(400, "Validation failed", error.flatten()));
    }
    next(error);
  }
};

export const updateStudio = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, "Unauthorized");
    const parsed = studioPayloadSchema.parse(req.body || {});
    const firmId = await resolveFirmId(req, parsed.firmId);
    if (parsed.firmId) delete parsed.firmId;
    const update = prepareStudioUpdate(parsed);
    if (update.title) {
      update.slug = await ensureUniqueSlug(Product, update.title, { fallback: update.title, excludeId: req.params.id });
    }
    const studio = await Product.findOneAndUpdate(
      { _id: req.params.id, firm: firmId, kind: "studio" },
      { $set: update },
      { new: true }
    ).lean();
    if (!studio) throw httpError(404, "Studio not found");
    const meta = await buildMeta(firmId);
    res.json({ ok: true, studio, meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(httpError(400, "Validation failed", error.flatten()));
    }
    next(error);
  }
};

export const publishStudio = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, "Unauthorized");
    const firmId = await resolveFirmId(req);
    const studio = await Product.findOneAndUpdate(
      { _id: req.params.id, firm: firmId, kind: "studio" },
      { status: "published" },
      { new: true }
    ).lean();
    if (!studio) throw httpError(404, "Studio not found");
    const meta = await buildMeta(firmId);
    res.json({ ok: true, studio, meta });
  } catch (error) {
    next(error);
  }
};

export const deleteStudio = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, "Unauthorized");
    const firmId = await resolveFirmId(req);
    const studio = await Product.findOneAndDelete({
      _id: req.params.id,
      firm: firmId,
      kind: "studio",
    }).lean();
    if (!studio) throw httpError(404, "Studio not found");
    const meta = await buildMeta(firmId);
    res.json({ ok: true, meta });
  } catch (error) {
    next(error);
  }
};
