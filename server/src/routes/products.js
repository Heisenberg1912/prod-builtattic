import { Router } from 'express';
import Product from '../models/Product.js';
import Firm from '../models/Firm.js';
import { requireAuth, requireFirmRole } from '../rbac/guards.js';

const router = Router();

router.get('/catalog', async (req, res) => {
  try {
    const {
      kind,
      firmId,
      firmSlug,
      search,
      category,
      tag,
      style,
      city,
      country,
      minPrice,
      maxPrice,
      limit = 24,
      page = 1,
      includeFirm = 'true',
    } = req.query;

    const match = { status: 'published' };
    if (kind) match.kind = kind;
    if (firmId) match.firm = firmId;

    if (firmSlug) {
      const firm = await Firm.findOne({ slug: firmSlug }).select('_id').lean();
      if (!firm) {
        return res.json({ ok: true, items: [], meta: { total: 0, facets: {} } });
      }
      match.firm = firm._id;
    }

    if (category) {
      match.categories = { $regex: new RegExp(category, 'i') };
    }

    if (tag) match.tags = { $regex: new RegExp(tag, 'i') };
    if (style) match.style = { $regex: new RegExp(style, 'i') };

    if (city || country) {
      match['location.city'] = city ? { $regex: new RegExp(city, 'i') } : match['location.city'];
      match['location.country'] = country
        ? { $regex: new RegExp(country, 'i') }
        : match['location.country'];
    }

    if (search) {
      match.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      match['pricing.basePrice'] = {};
      if (minPrice) match['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) match['pricing.basePrice'].$lte = Number(maxPrice);
    }

    const limitNum = Math.min(Number(limit) || 24, 100);
    const pageNum = Math.max(Number(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const productQuery = Product.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const shouldPopulateFirm = includeFirm !== 'false';
    if (shouldPopulateFirm) {
      productQuery.populate('firm', 'name slug tagline coverImage rating category styles certifications');
    }

    const [items, total, facetAgg] = await Promise.all([
      productQuery,
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
              { $limit: 20 },
            ],
            priceRange: [
              {
                $group: {
                  _id: null,
                  min: { $min: '$pricing.basePrice' },
                  max: { $max: '$pricing.basePrice' },
                },
              },
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

    const facets = facetAgg[0] || {};
    const meta = {
      total,
      page: pageNum,
      pageSize: limitNum,
      facets: {
        categories: facets.categories?.map((c) => ({ name: c._id, count: c.count })) || [],
        tags: facets.tags?.map((t) => ({ name: t._id, count: t.count })) || [],
        styles: facets.styles?.map((s) => ({ name: s._id, count: s.count })) || [],
        priceRange: facets.priceRange?.[0] || { min: null, max: null },
      },
    };

    res.json({ ok: true, items, meta });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post(
  '/firms/:firmId/products',
  requireAuth,
  requireFirmRole('owner', 'admin'),
  async (req, res) => {
    const doc = await Product.create({
      ...req.body,
      firm: req.params.firmId,
      status: 'draft',
    });
    res.json({ ok: true, product: doc });
  }
);

router.patch(
  '/firms/:firmId/products/:id',
  requireAuth,
  requireFirmRole('owner', 'admin', 'associate'),
  async (req, res) => {
    const doc = await Product.findOneAndUpdate(
      { _id: req.params.id, firm: req.params.firmId },
      req.body,
      { new: true }
    );
    res.json({ ok: true, product: doc });
  }
);

router.post(
  '/firms/:firmId/products/:id/publish',
  requireAuth,
  requireFirmRole('owner', 'admin'),
  async (req, res) => {
    const doc = await Product.findOneAndUpdate(
      { _id: req.params.id, firm: req.params.firmId },
      { status: 'published' },
      { new: true }
    );
    res.json({ ok: true, product: doc });
  }
);

router.get('/catalog/:slug', async (req, res) => {
  try {
    const item = await Product.findOne({
      slug: req.params.slug,
      status: 'published',
    })
      .populate('firm', 'name slug tagline coverImage rating category styles services contact')
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, error: 'Catalog item not found' });
    }

    res.json({ ok: true, item });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
