import { Router } from 'express';
import Product from '../models/Product.js';
import Firm from '../models/Firm.js';
import AssociateProfile from '../models/AssociateProfile.js';
import { attachWeb3Proof, createWeb3Proof, summariseProofs } from '../services/web3ProofService.js';

const router = Router();

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
          pageSize: Number(limit) || defaultLimit,
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

  const limitNum = Math.min(Number(limit) || defaultLimit, 60);
  const pageNum = Math.max(Number(page) || 1, 1);
  const skip = (pageNum - 1) * limitNum;

  const queryExec = Product.find(match)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  if (includeFirm) {
    queryExec.populate('firm', 'name slug tagline coverImage rating category styles services');
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
      pageSize: limitNum,
      facets: {
        categories: facetsDoc.categories?.map((c) => ({ name: c._id, count: c.count })) || [],
        tags: facetsDoc.tags?.map((t) => ({ name: t._id, count: t.count })) || [],
        styles: facetsDoc.styles?.map((s) => ({ name: s._id, count: s.count })) || [],
      },
      web3: proofSummary,
    },
  };
}

router.get('/studios', async (req, res) => {
  try {
    const response = await fetchCatalog('studio', req.query, { includeFirm: true, defaultLimit: 16 });
    res.json({ ok: true, ...response });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/studios/:slug', async (req, res) => {
  try {
    const item = await Product.findOne({
      slug: req.params.slug,
      status: 'published',
      kind: 'studio',
    })
      .populate('firm', 'name slug tagline coverImage rating category styles services contact')
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, error: 'Studio not found' });
    }

    attachWeb3Proof(item, 'studio');
    res.json({ ok: true, item });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/materials', async (req, res) => {
  try {
    const response = await fetchCatalog('material', req.query, { includeFirm: true, defaultLimit: 24 });
    res.json({ ok: true, ...response });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/materials/:slug', async (req, res) => {
  try {
    const item = await Product.findOne({
      slug: req.params.slug,
      status: 'published',
      kind: 'material',
    })
      .populate('firm', 'name slug tagline coverImage rating category styles services contact')
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, error: 'Material not found' });
    }

    attachWeb3Proof(item, 'material');
    res.json({ ok: true, item });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/firms', async (req, res) => {
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

router.get('/associates', async (req, res) => {
  try {
    const { search, skill, software, timezone } = req.query;
    const match = {};
    if (search) {
      match.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { summary: { $regex: new RegExp(search, 'i') } },
      ];
    }
    if (skill) match.specialisations = { $regex: new RegExp(skill, 'i') };
    if (software) match.softwares = { $regex: new RegExp(software, 'i') };
    if (timezone) match.timezone = timezone;

    const associates = await AssociateProfile.find(match)
      .populate('user', 'email role')
      .lean();

    const decoratedAssociates = associates.map((associate) => attachWeb3Proof(associate, 'associate'));
    const web3Summary = summariseProofs(decoratedAssociates.map((associate) => associate.web3Proof));

    res.json({ ok: true, items: decoratedAssociates, meta: { total: decoratedAssociates.length, web3: web3Summary } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
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