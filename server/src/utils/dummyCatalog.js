const PLACEHOLDERS = {
  design: 'https://placehold.co/600x400?text=Design+Studio',
  skill: 'https://placehold.co/200x200?text=Associate',
  material: 'https://placehold.co/600x400?text=Material',
};

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'entry';

const splitList = (value) => {
  if (!value && value !== 0) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry == null ? '' : String(entry).trim()))
      .filter(Boolean);
  }
  return String(value)
    .split(/[\n,;,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const normalizeNumber = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const cleanText = (value, fallback = '') => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim();
  return fallback || '';
};

const cleanUrl = (value, fallback) => {
  const text = cleanText(value, '').replace(/"/g, '');
  if (!text) return fallback || '';
  if (/^https?:\/\//i.test(text)) return text;
  return fallback || '';
};

const ensureGallery = (heroImage, gallery) => {
  const normalized = splitList(gallery);
  if (heroImage && !normalized.length) return [heroImage];
  if (heroImage && normalized[0] !== heroImage) return [heroImage, ...normalized];
  return normalized.length ? normalized : heroImage ? [heroImage] : [];
};

const normalizeDesignItem = (input = {}, options = {}) => {
  const id = options.id || input.id || input._id || slugify(input.title || 'design');
  const title = cleanText(input.title, 'Untitled concept');
  const slug = slugify(input.slug || title || id);
  const heroImage = cleanUrl(input.heroImage, PLACEHOLDERS.design) || PLACEHOLDERS.design;
  const gallery = ensureGallery(heroImage, input.gallery);
  return {
    _id: id,
    id,
    slug,
    title,
    summary: cleanText(input.summary, 'Demo listing generated via Super Admin.'),
    description: cleanText(input.description, input.summary),
    price: normalizeNumber(input.price),
    priceSqft: normalizeNumber(input.priceSqft ?? input.price),
    currency: cleanText(input.currency, 'USD'),
    metrics: {
      areaSqft: normalizeNumber(input.areaSqft),
    },
    style: cleanText(input.primaryStyle || input.style, 'Modern'),
    categories: splitList(input.categories).slice(0, 3),
    tags: splitList(input.tags),
    gallery,
    heroImage,
    status: cleanText(input.status, 'published'),
    firm: {
      name: cleanText(input.firmName, 'Demo Studio'),
      profile: {
        country: cleanText(input.country, 'Global'),
        city: cleanText(input.city, 'Remote'),
        website: cleanText(input.firmWebsite, ''),
      },
    },
    location: {
      country: cleanText(input.country, 'Global'),
      city: cleanText(input.city, 'Remote'),
    },
    galleryAlt: cleanText(input.galleryAlt, ''),
    updatedAt: new Date().toISOString(),
  };
};

const normalizeSkillItem = (input = {}, options = {}) => {
  const id = options.id || input.id || input._id || slugify(input.name || 'associate');
  const name = cleanText(input.name, 'Demo Associate');
  const slug = slugify(input.slug || name || id);
  const avatar = cleanUrl(input.avatar, PLACEHOLDERS.skill) || PLACEHOLDERS.skill;
  const hourly = normalizeNumber(input.hourly);
  return {
    _id: id,
    id,
    slug,
    name,
    title: cleanText(input.title, 'Design Lead'),
    summary: cleanText(input.summary, 'Generated from Super Admin.'),
    avatar,
    location: cleanText(input.location, 'Remote'),
    availability: cleanText(input.availability, 'Accepting projects'),
    experienceYears: normalizeNumber(input.experience) ?? 5,
    rates: {
      hourly,
      currency: cleanText(input.currency, 'USD'),
    },
    hourlyRate: hourly,
    skills: splitList(input.skills),
    languages: splitList(input.languages),
    tools: splitList(input.tools),
    tags: splitList(input.tags),
    status: cleanText(input.status, 'active'),
    updatedAt: new Date().toISOString(),
  };
};

const normalizeMaterialItem = (input = {}, options = {}) => {
  const id = options.id || input.id || input._id || slugify(input.title || 'material');
  const title = cleanText(input.title, 'Demo Material');
  const slug = slugify(input.slug || title || id);
  const heroImage = cleanUrl(input.heroImage, PLACEHOLDERS.material) || PLACEHOLDERS.material;
  const gallery = ensureGallery(heroImage, input.gallery);
  const category = cleanText(input.category, 'Surface');
  return {
    _id: id,
    id,
    slug,
    title,
    description: cleanText(input.description, 'Super Admin generated material.'),
    price: normalizeNumber(input.price) ?? 0,
    currency: cleanText(input.currency, 'USD'),
    unit: cleanText(input.unit, 'sq ft'),
    heroImage,
    gallery,
    category,
    categories: (() => {
      const list = splitList(input.categories);
      if (!list.length) return [category];
      return list;
    })(),
    metafields: {
      vendor: cleanText(input.vendor, 'Demo Vendor'),
      leadTime: cleanText(input.leadTime, '2 weeks'),
      finish: cleanText(input.finish, 'Matte'),
    },
    firm: {
      name: cleanText(input.vendor, 'Demo Vendor'),
      profile: {
        country: cleanText(input.origin, 'Global'),
        website: cleanText(input.website, ''),
      },
    },
    status: cleanText(input.status, 'published'),
    updatedAt: new Date().toISOString(),
  };
};

const NORMALIZERS = {
  design: normalizeDesignItem,
  skill: normalizeSkillItem,
  material: normalizeMaterialItem,
};

export const DUMMY_TYPES = new Set(['design', 'skill', 'material']);

export const normalizeDummyPayload = (type, payload = {}, options = {}) => {
  const normalizer = NORMALIZERS[type];
  if (!normalizer) {
    throw new Error(`Unsupported dummy catalog type: ${type}`);
  }
  return normalizer(payload, options);
};

export const mapCatalogEntry = (doc) => {
  if (!doc) return null;
  const id = doc._id?.toString?.() || doc.id;
  const payload = { ...(doc.payload || {}) };
  if (id && !payload.id) payload.id = id;
  if (payload._id == null && id) payload._id = id;
  return payload;
};

export default {
  PLACEHOLDERS,
  normalizeDummyPayload,
  mapCatalogEntry,
  DUMMY_TYPES,
};
