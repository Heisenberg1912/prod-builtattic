import { z } from 'zod';
import Firm from '../models/Firm.js';
import StudioRequest from '../models/StudioRequest.js';
import { resolveFirmIdAsync } from '../utils/firmAccess.js';
import Product from '../models/Product.js';

const DEFAULT_SERVICE_SUMMARY =
  'An architecture studio sells professional services—architectural design, planning, interior systems, and sustainable consultancy—rather than boxed products. Studio teams create residential and commercial blueprints, manage delivery, and specify low-carbon solutions so clients can build with confidence.';

const tileSchema = z.object({
  id: z.string().trim().max(80).optional(),
  label: z.string().trim().min(2).max(160),
  description: z.string().trim().max(800).optional(),
  status: z.enum(['available', 'on-request']).optional(),
  statusLabel: z.string().trim().max(80).optional(),
  extra: z.string().trim().max(200).optional(),
});

const hostingSchema = z.object({
  enabled: z.boolean().optional(),
  summary: z.string().trim().min(10).max(2000).optional(),
  services: z.array(tileSchema).min(1).max(12),
  products: z.array(tileSchema).min(1).max(12),
});

const requestStatusSchema = z.enum(['new', 'in-progress', 'responded', 'archived']);

const normaliseTile = (tile, type, index = 0) => ({
  id: tile.id || `custom-${type}-${Math.random().toString(36).slice(2, 9)}`,
  label: tile.label?.trim() || `${type === 'service' ? 'Service' : 'Product'} ${index + 1}`,
  description: tile.description?.trim() || '',
  status: tile.status || 'available',
  statusLabel: tile.statusLabel?.trim() || null,
  extra: tile.extra?.trim() || '',
});

export const getHostingConfig = async (req, res, next) => {
  try {
    const firmId = await resolveFirmIdAsync(req, undefined, { provisionIfMissing: true, allowedRoles: ['owner', 'admin', 'vendor'] });
    const firm = await Firm.findById(firmId).select('hosting name slug').lean();
    if (!firm) {
      return res.status(404).json({ ok: false, error: 'Firm not found' });
    }
    res.json({ ok: true, hosting: firm.hosting || null });
  } catch (error) {
    next(error);
  }
};

export const upsertHostingConfig = async (req, res, next) => {
  try {
    const firmId = await resolveFirmIdAsync(req, undefined, { provisionIfMissing: true, allowedRoles: ['owner', 'admin', 'vendor'] });
    const parsed = hostingSchema.parse(req.body || {});
    const payload = {
      enabled: parsed.enabled ?? true,
      serviceSummary: (parsed.summary || DEFAULT_SERVICE_SUMMARY).trim(),
      services: parsed.services.map((tile, index) => normaliseTile(tile, 'service', index)),
      products: parsed.products.map((tile, index) => normaliseTile(tile, 'product', index)),
      updatedAt: new Date(),
    };
    const firm = await Firm.findByIdAndUpdate(
      firmId,
      { hosting: payload },
      { new: true, runValidators: false }
    ).select('hosting');
    res.json({ ok: true, hosting: firm.hosting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(Object.assign(new Error('Validation failed'), { statusCode: 400, details: error.flatten() }));
    }
    next(error);
  }
};

export const listStudioRequests = async (req, res, next) => {
  try {
    const firmId = await resolveFirmIdAsync(req, undefined, { provisionIfMissing: true, allowedRoles: ['owner', 'admin', 'vendor'] });
    const filter = { firm: firmId };
    if (req.query.status) filter.status = req.query.status;
    const requests = await StudioRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ ok: true, requests });
  } catch (error) {
    next(error);
  }
};

export const updateStudioRequestStatus = async (req, res, next) => {
  try {
    const firmId = await resolveFirmIdAsync(req, undefined, { provisionIfMissing: true, allowedRoles: ['owner', 'admin', 'vendor'] });
    const status = requestStatusSchema.parse(req.body?.status);
    const request = await StudioRequest.findOneAndUpdate(
      { _id: req.params.id, firm: firmId },
      { status },
      { new: true }
    ).lean();
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }
    res.json({ ok: true, request });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(Object.assign(new Error('Invalid status'), { statusCode: 400, details: error.flatten() }));
    }
    next(error);
  }
};

export const createStudioRequest = async (req, res, next) => {
  try {
    const schema = z.object({
      studioId: z.string().trim().optional(),
      studioSlug: z.string().trim().optional(),
      firmId: z.string().trim().optional(),
      name: z.string().trim().min(2).max(160),
      email: z.string().email(),
      company: z.string().trim().max(160).optional(),
      message: z.string().trim().min(20).max(4000),
    });
    const parsed = schema.parse(req.body || {});

    let firmId = parsed.firmId;
    let studioTitle = null;
    if (!firmId && parsed.studioId) {
      const studio = await Product.findById(parsed.studioId).select('firm title slug').lean();
      if (studio) {
        firmId = studio.firm?.toString();
        studioTitle = studio.title;
      }
    }
    if (!firmId && parsed.studioSlug) {
      const studio = await Product.findOne({ slug: parsed.studioSlug }).select('firm title').lean();
      if (studio) {
        firmId = studio.firm?.toString();
        studioTitle = studio.title;
      }
    }
    if (!firmId) {
      return res.status(400).json({ ok: false, error: 'Unable to resolve firm for this request' });
    }

    const source = req.user?.role ? (req.user.role === 'client' ? 'client' : 'user') : 'guest';
    const entry = await StudioRequest.create({
      firm: firmId,
      studio: parsed.studioId || null,
      studioSlug: parsed.studioSlug || null,
      studioTitle,
      requester: req.user?._id || null,
      source,
      contactName: parsed.name,
      contactEmail: parsed.email,
      contactCompany: parsed.company || null,
      message: parsed.message,
    });

    res.json({ ok: true, request: entry.toObject() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(Object.assign(new Error('Validation failed'), { statusCode: 400, details: error.flatten() }));
    }
    next(error);
  }
};
