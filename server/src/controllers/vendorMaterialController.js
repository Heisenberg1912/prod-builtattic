import mongoose from 'mongoose';
import { z } from 'zod';
import Product from '../models/Product.js';
import { ensureUniqueSlug } from '../utils/slugify.js';

const OBJECT_ID = z
  .string({ invalid_type_error: 'firmId must be a string' })
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid firmId provided');

const badgeArray = z.array(z.string().trim().min(1).max(160)).max(40).optional();
const stringArray = z.array(z.string().trim().min(1).max(120)).max(30).optional();

const deliverySchema = z
  .object({
    leadTimeWeeks: z.number().min(0).max(260).optional(),
    fulfilmentType: z.enum(['digital', 'hybrid', 'logistics']).optional(),
    includesInstallation: z.boolean().optional(),
    handoverMethod: z.enum(['download', 'email', 'courier', 'onsite']).optional(),
    instructions: z.string().trim().max(2000).optional(),
  })
  .partial();

const materialPayloadSchema = z
  .object({
    firmId: OBJECT_ID.optional(),
    title: z.string().trim().min(3).max(200).optional(),
    summary: z.string().trim().max(800).optional(),
    description: z.string().trim().max(6000).optional(),
    highlights: badgeArray,
    categories: stringArray,
    tags: stringArray,
    price: z.number().min(0).optional(),
    currency: z.string().trim().length(3).optional(),
    sku: z.string().trim().max(160).optional(),
    unit: z.string().trim().max(40).optional(),
    unitLabel: z.string().trim().max(120).optional(),
    inventory: z.number().min(0).optional(),
    minOrderQuantity: z.number().min(0).optional(),
    maxOrderQuantity: z.number().min(0).optional(),
    gallery: z.array(z.string().trim().url()).max(20).optional(),
    heroImage: z.string().trim().url().optional(),
    delivery: deliverySchema.optional(),
    logistics: z.string().trim().max(2000).optional(),
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
    status: z.enum(['draft', 'published']).optional(),
  })
  .partial();

const httpError = (status, message, details) => Object.assign(new Error(message), { statusCode: status, details });

const isGlobalAdmin = (user) => {
  const primary = String(user?.role || '').toLowerCase();
  if (primary === 'superadmin' || primary === 'admin') return true;
  const globals = (user?.rolesGlobal || []).map((role) => String(role).toLowerCase());
  return globals.includes('superadmin') || globals.includes('admin');
};

const resolveFirmId = (req, explicitFirmId) => {
  const memberships = (req.user?.memberships || []).map((membership) => ({
    firm: membership.firm?.toString(),
    role: String(membership.role || '').toLowerCase(),
  }));
  const global = isGlobalAdmin(req.user);

  let firmId = explicitFirmId || req.params.firmId || req.query.firmId;
  if (!firmId && memberships.length === 1) {
    firmId = memberships[0].firm;
  }

  if (!firmId) {
    if (global) {
      throw httpError(400, 'firmId is required for admin users');
    }
    throw httpError(403, 'No firm membership found for user');
  }

  if (!mongoose.isValidObjectId(firmId)) {
    throw httpError(400, 'Invalid firmId provided');
  }

  if (global) return firmId;

  const membership = memberships.find((item) => item.firm === firmId);
  if (!membership) {
    throw httpError(403, 'You are not linked to this firm');
  }
  return membership.firm;
};

const sanitiseArray = (value) => {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .map((item) => (typeof item === 'string' ? item.trim() : null))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
};

const prepareMaterialUpdate = (payload) => {
  const update = { ...payload };
  if (update.categories) update.categories = sanitiseArray(update.categories) || [];
  if (update.tags) update.tags = sanitiseArray(update.tags) || [];
  if (update.highlights) update.highlights = sanitiseArray(update.highlights) || [];
  if (update.gallery) update.gallery = sanitiseArray(update.gallery) || [];
  if (update.currency) update.currency = update.currency.toUpperCase();
  return update;
};

const buildMeta = async (firmId) => {
  const [draftCount, publishedCount, total] = await Promise.all([
    Product.countDocuments({ firm: firmId, kind: 'material', status: 'draft' }),
    Product.countDocuments({ firm: firmId, kind: 'material', status: 'published' }),
    Product.countDocuments({ firm: firmId, kind: 'material' }),
  ]);
  return { total, draftCount, publishedCount };
};

export const listMaterials = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, 'Unauthorized');
    const firmId = resolveFirmId(req);
    const statusFilter = req.query.status?.toString();
    const match = { firm: firmId, kind: 'material' };
    if (statusFilter === 'draft' || statusFilter === 'published') {
      match.status = statusFilter;
    }
    const items = await Product.find(match).sort({ updatedAt: -1 }).lean();
    const inventoryCount = items.reduce((sum, item) => sum + (Number(item.inventory) || 0), 0);
    const meta = await buildMeta(firmId);
    meta.inventoryCount = inventoryCount;
    res.json({ ok: true, items, meta });
  } catch (error) {
    next(error);
  }
};

export const getMaterial = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, 'Unauthorized');
    const firmId = resolveFirmId(req);
    const material = await Product.findOne({
      _id: req.params.id,
      firm: firmId,
      kind: 'material',
    }).lean();
    if (!material) throw httpError(404, 'Material not found');
    res.json({ ok: true, material });
  } catch (error) {
    next(error);
  }
};

export const createMaterial = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, 'Unauthorized');
    const parsed = materialPayloadSchema.parse(req.body || {});
    if (!parsed.title) {
      throw httpError(400, 'title is required');
    }
    const firmId = resolveFirmId(req, parsed.firmId);
    const update = prepareMaterialUpdate(parsed);
    const slug = await ensureUniqueSlug(Product, update.title, { fallback: 'material-' + Date.now() });
    const doc = await Product.create({
      ...update,
      firm: firmId,
      slug,
      kind: 'material',
      status: 'draft',
    });
    const meta = await buildMeta(firmId);
    res.status(201).json({ ok: true, material: doc.toObject(), meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(httpError(400, 'Validation failed', error.flatten()));
    }
    next(error);
  }
};

export const updateMaterial = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, 'Unauthorized');
    const parsed = materialPayloadSchema.parse(req.body || {});
    const firmId = resolveFirmId(req, parsed.firmId);
    if (parsed.firmId) delete parsed.firmId;
    const update = prepareMaterialUpdate(parsed);
    if (update.title) {
      update.slug = await ensureUniqueSlug(Product, update.title, {
        fallback: update.title,
        excludeId: req.params.id,
      });
    }
    const material = await Product.findOneAndUpdate(
      { _id: req.params.id, firm: firmId, kind: 'material' },
      {  $set: update } ,
      { new: true }
    ).lean();
    if (!material) throw httpError(404, 'Material not found');
    const meta = await buildMeta(firmId);
    res.json({ ok: true, material, meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(httpError(400, 'Validation failed', error.flatten()));
    }
    next(error);
  }
};

export const publishMaterial = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, 'Unauthorized');
    const firmId = resolveFirmId(req);
    const material = await Product.findOneAndUpdate(
      { _id: req.params.id, firm: firmId, kind: 'material' },
      { status: 'published' },
      { new: true }
    ).lean();
    if (!material) throw httpError(404, 'Material not found');
    const meta = await buildMeta(firmId);
    res.json({ ok: true, material, meta });
  } catch (error) {
    next(error);
  }
};

export const deleteMaterial = async (req, res, next) => {
  try {
    if (!req.user) throw httpError(401, 'Unauthorized');
    const firmId = resolveFirmId(req);
    const material = await Product.findOneAndDelete({
      _id: req.params.id,
      firm: firmId,
      kind: 'material',
    }).lean();
    if (!material) throw httpError(404, 'Material not found');
    const meta = await buildMeta(firmId);
    res.json({ ok: true, meta });
  } catch (error) {
    next(error);
  }
};

