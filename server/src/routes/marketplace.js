import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Firm from '../models/Firm.js';
import AssociateProfile from '../models/AssociateProfile.js';
import ServicePack from '../models/ServicePack.js';
import PlanUpload from '../models/PlanUpload.js';
import DummyCatalogEntry from '../models/DummyCatalogEntry.js';
import { attachWeb3Proof, createWeb3Proof, summariseProofs } from '../services/web3ProofService.js';
import { mapCatalogEntry } from '../utils/dummyCatalog.js';
import logger from '../utils/logger.js';

const router = Router();

const cacheStore = new Map();
const DEFAULT_CACHE_TTL_MS = Number.parseInt(process.env.MARKETPLACE_CACHE_TTL_MS || '15000', 10);

export const clearMarketplaceCache = () => {
  cacheStore.clear();
  return cacheStore.size;
};

const buildCacheKey = (req) => {
  const params = new URLSearchParams();
  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else if (value != null) {
      params.append(key, value);
    }
  });
  return `${req.path}?${params.toString()}`;
};

const shouldBypassCache = (req) =>
  String(req.query?.noCache || '').toLowerCase() === 'true' ||
  String(req.headers['x-cache-bust'] || '').length > 0;

const marketplaceCache = (ttlMs = DEFAULT_CACHE_TTL_MS) => (req, res, next) => {
  if (!ttlMs || ttlMs <= 0 || shouldBypassCache(req)) {
    return next();
  }

  const key = buildCacheKey(req);
  const cached = cacheStore.get(key);
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.payload);
  }

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cacheStore.set(key, { payload, expiry: Date.now() + ttlMs });
      if (cacheStore.size > 200) {
        const firstKey = cacheStore.keys().next().value;
        cacheStore.delete(firstKey);
      }
    }
    return originalJson(payload);
  };

  next();
};

const promotionSummaries = [
  {
    key: 'architectureCapital',
    title: 'Architecture Capital',
    subtitle: 'Designs from Copenhagen',
    slug: 'architecture-capital-collection',
    firmSlug: 'architecture-capital',
    primaryCategory: 'Commercial',
    image: 'https://images.unsplash.com/photo-1529421308418-eab9888ae93c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'skyHigh',
    title: 'Sky High',
    subtitle: 'Towering heights and cloudy views',
    slug: 'sky-high-observatory',
    firmSlug: 'sky-high-collective',
    primaryCategory: 'Mixed-Use',
    image: 'https://images.unsplash.com/photo-1505732542984-19267bd26150?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'studioMosby',
    title: 'Studio Mosby',
    subtitle: '10% off on all designs',
    slug: 'studio-mosby-galleria',
    firmSlug: 'studio-mosby',
    primaryCategory: 'Hospitality',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'hammerWeek',
    title: 'Hammer & Nails',
    subtitle: 'New fall collection',
    slug: 'hammer-and-nails-market-hall',
    firmSlug: 'hammer-and-nails',
    primaryCategory: 'Retail',
    image: 'https://images.unsplash.com/photo-1504457047772-27faf1ee1873?auto=format&fit=crop&w=1200&q=80',
  },
];

const mapPlanUploadForMarketplace = (plan) => ({
  id: plan._id.toString(),
  projectTitle: plan.projectTitle,
  category: plan.category || '',
  subtype: plan.subtype || '',
  primaryStyle: plan.primaryStyle || '',
  conceptPlan: plan.conceptPlan || '',
  renderImages: Array.isArray(plan.renderImages) ? plan.renderImages : [],
  walkthrough: plan.walkthrough || '',
  areaSqft: plan.areaSqft ?? null,
  floors: plan.floors ?? null,
  materials: Array.isArray(plan.materials) ? plan.materials : [],
  climate: plan.climate || '',
  designRate: plan.designRate ?? null,
  constructionCost: plan.constructionCost ?? null,
  licenseType: plan.licenseType || '',
  delivery: plan.delivery || '',
  description: plan.description || '',
  tags: Array.isArray(plan.tags) ? plan.tags : [],
  updatedAt: plan.updatedAt,
});

const mapServicePackForMarketplace = (pack) => ({
  id: pack._id.toString(),
  title: pack.title,
  summary: pack.summary || '',
  price: pack.price ?? null,
  currency: pack.currency || 'USD',
  deliverables: Array.isArray(pack.deliverables) ? pack.deliverables : [],
  duration: pack.duration || '',
  availability: pack.availability || '',
  meetingPrep: pack.meetingPrep || '',
  status: pack.status || 'draft',
  updatedAt: pack.updatedAt,
});

async function fetchCatalog(kind, query, { includeFirm = true, defaultLimit = 12 } = {}) {
  const {
    search,
    category,
    tag,
    style,
    city,
    country,
    firmId,
    firmSlug,
    minPrice,
    maxPrice,
    limit = defaultLimit,
    page = 1,
  } = query;

  const match = { status: 'published', kind };

  const limitInput = Number(limit);
  const unlimited = limitInput === 0;
  const maxLimit = 500;
  const limitNum = unlimited
    ? 0
    : Math.min(
        Number.isFinite(limitInput) && limitInput > 0 ? Math.floor(limitInput) : defaultLimit,
        maxLimit,
      );
  const pageNum = unlimited ? 1 : Math.max(Number(page) || 1, 1);
  const skip = unlimited ? 0 : (pageNum - 1) * limitNum;

  if (firmId) {
    match.firm = firmId;
  }
  if (firmSlug) {
    const firm = await Firm.findOne({ slug: firmSlug }).select('_id').lean();
    if (!firm) {
      return {
        items: [],
        meta: {
          total: 0,
          page: 1,
          pageSize: unlimited ? 0 : limitNum || defaultLimit,
          facets: {},
          web3: summariseProofs(),
        },
      };
    }
    match.firm = firm._id;
  }

  if (category) match.categories = { $regex: new RegExp(category, 'i') };
  if (tag) match.tags = { $regex: new RegExp(tag, 'i') };
  if (style) match.style = { $regex: new RegExp(style, 'i') };
  if (city) match['location.city'] = { $regex: new RegExp(city, 'i') };
  if (country) match['location.country'] = { $regex: new RegExp(country, 'i') };
  if (search) match.$text = { $search: search };

  if (minPrice || maxPrice) {
    match['pricing.basePrice'] = {};
    if (minPrice) match['pricing.basePrice'].$gte = Number(minPrice);
    if (maxPrice) match['pricing.basePrice'].$lte = Number(maxPrice);
  }

  const queryExec = Product.find(match)
    .sort({ createdAt: -1 })
    .skip(skip)
    .lean();

  if (!unlimited && limitNum > 0) {
    queryExec.limit(limitNum);
  }

  if (includeFirm) {
    queryExec.populate(
      'firm',
      'name slug tagline coverImage rating ratingsCount category styles services partners contact gallery certifications languages operatingRegions priceSqft currency profile hosting'
    );
  }

  const [items, total, facetsAgg] = await Promise.all([
    queryExec,
    Product.countDocuments(match),
    Product.aggregate([
      { $match: match },
      {
        $facet: {
          categories: [
            { $unwind: '$categories' },
            { $group: { _id: '$categories', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          tags: [
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 },
          ],
          styles: [
            { $match: { style: { $exists: true, $ne: null } } },
            { $group: { _id: '$style', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]),
  ]);

  const facetsDoc = facetsAgg[0] || {};
  const decoratedItems = items.map((item) => attachWeb3Proof(item, kind));
  const proofSummary = summariseProofs(decoratedItems.map((item) => item.web3Proof));

  return {
    items: decoratedItems,
    meta: {
      total,
      page: pageNum,
      pageSize: unlimited ? total : limitNum,
      facets: {
        categories: facetsDoc.categories?.map((c) => ({ name: c._id, count: c.count })) || [],
        tags: facetsDoc.tags?.map((t) => ({ name: t._id, count: t.count })) || [],
        styles: facetsDoc.styles?.map((s) => ({ name: s._id, count: s.count })) || [],
      },
      web3: proofSummary,
    },
  };
}

router.get('/studios', marketplaceCache(), async (req, res) => {
  try {
    const response = await fetchCatalog('studio', req.query, { includeFirm: true, defaultLimit: 16 });
    res.json({ ok: true, ...response });
  } catch (error) {
    logger.error('marketplace_studios_error', { error: error.message });
    res.status(500).json({
      ok: false,
      error: error.message || 'Unable to load studios',
      items: [],
      meta: {
        total: 0,
        page: 1,
        pageSize: 0,
        facets: {},
        web3: summariseProofs(),
      },
    });
  }
});

router.get('/studios/:slug', async (_req, res) => {
  res.status(410).json({ ok: false, error: 'Studio detail by slug is disabled while we rebuild.' });
});

router.get('/design-studio/hosting', async (req, res) => {
  try {
    const { firmId, firmSlug } = req.query;
    const match = {};
    if (firmId) {
      match._id = firmId;
    } else if (firmSlug) {
      match.slug = firmSlug;
    } else {
      match['hosting.enabled'] = true;
    }

    const firm = await Firm.findOne(match)
      .select('name slug hosting updatedAt')
      .lean();

    if (!firm) {
      return res.json({ ok: true, hosting: null, firm: null });
    }

    res.json({
      ok: true,
      hosting: firm.hosting || null,
      firm: { _id: firm._id, name: firm.name, slug: firm.slug },
      meta: { updatedAt: firm.hosting?.updatedAt || firm.updatedAt },
    });
  } catch (error) {
    logger.error('marketplace_hosting_error', {
      error: error.message,
      firmId: req.query.firmId,
      firmSlug: req.query.firmSlug,
    });
    res.status(500).json({
      ok: false,
      error: error.message || 'Unable to load design studio hosting',
      hosting: null,
      firm: null,
      meta: null,
    });
  }
});
router.get('/materials', marketplaceCache(), async (req, res) => {
  try {
    const response = await fetchCatalog('material', req.query, { includeFirm: true, defaultLimit: 24 });
    res.json({ ok: true, ...response });
  } catch (error) {
    logger.error('marketplace_materials_error', { error: error.message });
    res.status(500).json({ ok: false, error: 'Unable to load materials', items: [], meta: { total: 0 } });
  }
});

router.get('/materials/:slug', async (_req, res) => {
  res.status(410).json({ ok: false, error: 'Material detail by slug is disabled while we rebuild.' });
});

router.get('/firms', marketplaceCache(), async (req, res) => {
  try {
    const { search, style, category } = req.query;
    const match = { approved: true };
    if (search) {
      match.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { tagline: { $regex: new RegExp(search, 'i') } },
      ];
    }
    if (style) match.styles = { $regex: new RegExp(style, 'i') };
    if (category) match.category = { $regex: new RegExp(category, 'i') };

    const firms = await Firm.find(match)
      .populate('featuredStudios', 'title slug heroImage pricing priceSqft highlights')
      .lean();

    const decoratedFirms = firms.map((firm) => attachWeb3Proof(firm, 'firm'));
    const web3Summary = summariseProofs(decoratedFirms.map((firm) => firm.web3Proof));

    res.json({ ok: true, items: decoratedFirms, meta: { total: decoratedFirms.length, web3: web3Summary } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/promotions', (req, res) => {
  res.json({ ok: true, items: promotionSummaries });
});

const mapPlanTile = (plan) => ({
  id: plan._id.toString(),
  projectTitle: plan.projectTitle,
  category: plan.category || '',
  primaryStyle: plan.primaryStyle || '',
  tags: Array.isArray(plan.tags) ? plan.tags : [],
  description: plan.description || '',
  status: plan.status || 'draft',
  coverImage:
    plan.coverImage ||
    (Array.isArray(plan.media) && plan.media[0]?.thumbnail) ||
    (Array.isArray(plan.renderImages) && plan.renderImages[0]) ||
    '',
  updatedAt: plan.updatedAt,
});

const mapAssociateProfile = async (profile) => {
  if (!profile) return null;
  const computedName =
    profile.fullName ||
    profile.user?.name ||
    [profile.user?.firstName, profile.user?.lastName].filter(Boolean).join(' ') ||
    profile.title ||
    null;
  const safeToolset = Array.isArray(profile.toolset) ? profile.toolset.filter(Boolean) : profile.softwares || [];
  const membershipFirmIds = Array.isArray(profile.user?.memberships)
    ? profile.user.memberships.map((m) => m?.firm).filter(Boolean)
    : [];

  const ownerIds = [profile._id, profile.user?._id, profile.user, ...membershipFirmIds]
    .filter(Boolean)
    .map((id) => (id && id._id ? id._id : id))
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const services = await ServicePack.find({
    ownerType: { $in: ['associate', 'firm'] },
    ownerId: { $in: ownerIds },
    status: { $in: ['published', 'active', 'available'] },
  })
    .sort({ updatedAt: -1 })
    .limit(12)
    .lean();
  const planUploads = await PlanUpload.find({
    ownerType: { $in: ['associate', 'firm'] },
    ownerId: { $in: ownerIds },
    status: { $in: ['published'] },
  })
    .sort({ updatedAt: -1 })
    .limit(12)
    .populate({
      path: 'media.asset',
      select: 'publicUrl storagePath driveFileId mimeType sizeBytes key secure originalName kind',
    })
    .lean();

  const assembled = {
    ...profile,
    name: computedName,
    firmName: profile.firmName || profile.company || '',
    languages: profile.languages || [],
    toolset: safeToolset,
    services,
    planUploads: planUploads.map(mapPlanTile),
  };
  return attachWeb3Proof(assembled, 'associate');
};

router.get('/associates', marketplaceCache(), async (req, res) => {
  try {
    const { search, skill, software, timezone } = req.query;
    const match = {};
    if (search) {
      match.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { summary: { $regex: new RegExp(search, 'i') } },
        { fullName: { $regex: new RegExp(search, 'i') } },
        { firmName: { $regex: new RegExp(search, 'i') } },
      ];
    }
    if (skill) match.specialisations = { $regex: new RegExp(skill, 'i') };
    if (software) match.softwares = { $regex: new RegExp(software, 'i') };
    if (timezone) match.timezone = timezone;

    const associates = await AssociateProfile.find(match)
      .populate('user', 'email role firstName lastName name memberships')
      .lean();

    const decoratedAssociates = await Promise.all(associates.map((associate) => mapAssociateProfile(associate)));
    const web3Summary = summariseProofs(decoratedAssociates.map((associate) => associate?.web3Proof));

    res.json({ ok: true, items: decoratedAssociates.filter(Boolean), meta: { total: decoratedAssociates.length, web3: web3Summary } });
  } catch (error) {
    logger.error('marketplace_associates_error', { error: error.message });
    res.status(500).json({ ok: false, error: 'Unable to load associates', items: [], meta: { total: 0, web3: summariseProofs() } });
  }
});

router.get('/catalog/dummy', async (_req, res) => {
  try {
    const [designDocs, skillDocs, materialDocs] = await Promise.all([
      DummyCatalogEntry.find({ type: 'design' }).sort({ updatedAt: -1 }).lean(),
      DummyCatalogEntry.find({ type: 'skill' }).sort({ updatedAt: -1 }).lean(),
      DummyCatalogEntry.find({ type: 'material' }).sort({ updatedAt: -1 }).lean(),
    ]);

    res.json({
      ok: true,
      design: designDocs.map(mapCatalogEntry).filter(Boolean),
      skill: skillDocs.map(mapCatalogEntry).filter(Boolean),
      material: materialDocs.map(mapCatalogEntry).filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/associates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ ok: false, error: 'Associate id is required' });
    }
    const match = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { user: id }] }
      : { _id: null }; // ignore slug lookup; only ids

    const associate = await AssociateProfile.findOne(match)
      .populate('user', 'email role firstName lastName name')
      .lean();
    if (!associate) {
      return res.status(404).json({ ok: false, error: 'Associate not found' });
    }
    const decorated = await mapAssociateProfile(associate);
    res.json({ ok: true, item: decorated });
  } catch (error) {
    logger.error('marketplace_associate_detail_error', { error: error.message, id: req.params.id });
    res.status(500).json({ ok: false, error: 'Unable to load associate detail' });
  }
});

router.get('/web3-insights', async (_req, res) => {
  try {
    const [studioDocs, materialDocs, associateDocs] = await Promise.all([
      Product.find({ status: 'published', kind: 'studio' })
        .select('_id slug updatedAt createdAt')
        .lean(),
      Product.find({ status: 'published', kind: 'material' })
        .select('_id slug updatedAt createdAt')
        .lean(),
      AssociateProfile.find({})
        .select('_id updatedAt createdAt')
        .lean(),
    ]);

    const studioProofs = studioDocs.map((doc) => createWeb3Proof(doc, 'studio'));
    const materialProofs = materialDocs.map((doc) => createWeb3Proof(doc, 'material'));
    const associateProofs = associateDocs.map((doc) => createWeb3Proof(doc, 'associate'));

    res.json({
      ok: true,
      data: {
        studios: summariseProofs(studioProofs),
        materials: summariseProofs(materialProofs),
        associates: summariseProofs(associateProofs),
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;



