import client from "../config/axios.jsx";
import {
  fallbackStudios,
  fallbackMaterials,
  fallbackFirms,
  fallbackAssociates,
} from "../data/marketplace.js";
import {
  productCatalog,
  productSearchRecords,
  productBySlug,
} from "../data/products.js";
import { associateCatalog, associateEnhancements } from "../data/services.js";

const slugify = (value = '') => value.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const normalizeStudio = (studio = {}) => {
  const galleryArray = ensureArray(studio.gallery).filter(Boolean);
  const heroCandidate =
    studio.heroImage ||
    studio.hero_image ||
    studio.image ||
    galleryArray[0] ||
    null;
  const slug = studio.slug || (studio.title ? slugify(studio.title) : studio._id);
  const gallery = heroCandidate
    ? [heroCandidate, ...galleryArray.filter((img) => img !== heroCandidate)]
    : galleryArray;
  return {
    ...studio,
    slug,
    heroImage: heroCandidate,
    gallery,
  };
};

const normalizeMaterial = (material = {}) => {
  const galleryArray = ensureArray(material.gallery).filter(Boolean);
  const heroCandidate =
    material.heroImage ||
    material.image ||
    galleryArray[0] ||
    null;
  const gallery = heroCandidate
    ? [heroCandidate, ...galleryArray.filter((img) => img !== heroCandidate)]
    : galleryArray;
  const category =
    material.category ||
    (Array.isArray(material.categories) && material.categories.length
      ? material.categories[0]
      : null) ||
    material.metafields?.category ||
    null;
  return {
    ...material,
    heroImage: heroCandidate,
    gallery,
    category,
    metafields: material.metafields || {},
  };
};

const normalizeAssociate = (associate = {}) => {
  const extras = (associateEnhancements && (associateEnhancements[associate._id] || associateEnhancements[associate.slug])) || null;
  const baseRates = associate.rates || {};
  const hourly = associate.hourlyRate ?? baseRates.hourly ?? null;
  const mergedRates = {
    currency: baseRates.currency || associate.currency || "USD",
    ...baseRates,
  };
  if (hourly !== null && hourly !== undefined) {
    mergedRates.hourly = hourly;
  }
  if (mergedRates.daily === undefined && hourly !== null && hourly !== undefined) {
    mergedRates.daily = Math.round(Number(hourly) * 8);
  }
  return {
    ...associate,
    hourlyRate: hourly ?? null,
    rates: mergedRates,
    avatar: associate.avatar || (extras && extras.avatar) || "/assets/associates/default-consultant.jpg",
    serviceBadges: (extras && extras.serviceBadges) || associate.serviceBadges || [],
    booking: (extras && extras.booking) || associate.booking || null,
    warranty: (extras && extras.warranty) || associate.warranty || null,
    addons: (extras && extras.addons) || associate.addons || [],
    prepChecklist: (extras && extras.prepChecklist) || associate.prepChecklist || [],
    deliverables: (extras && extras.deliverables) || associate.deliverables || [],
  };
};

const LOCAL_STUDIOS = fallbackStudios.map(normalizeStudio);
const LOCAL_MATERIALS = fallbackMaterials.map(normalizeMaterial);
const LOCAL_ASSOCIATES = associateCatalog.map(normalizeAssociate);

function unwrapItems(data) {
  return {
    items: data?.items || [],
    meta: data?.meta || { total: data?.items?.length ?? 0 },
  };
}

function matchesSearch(target = "", search = "") {
  if (!search) return true;
  return target.toLowerCase().includes(search.toLowerCase());
}

function filterStudios(list, params = {}) {
  const { category, style, search } = params;
  return list.filter((studio) => {
    const categoryOk =
      !category ||
      category === "All" ||
      (studio.categories || []).some((cat) =>
        cat.toLowerCase().includes(category.toLowerCase())
      );
    const styleOk =
      !style ||
      style === "All" ||
      studio.style?.toLowerCase() === style.toLowerCase() ||
      (studio.firm?.styles || []).some(
        (s) => s.toLowerCase() === style.toLowerCase()
      );
    const searchOk =
      !search ||
      matchesSearch(studio.title, search) ||
      matchesSearch(studio.summary, search) ||
      matchesSearch(studio.firm?.name, search);
    return categoryOk && styleOk && searchOk;
  });
}

function filterMaterials(list, params = {}) {
  const { category, search } = params;
  const normalizedCategory =
    category && category !== "All" ? category.toLowerCase() : null;
  return list.filter((item) => {
    const categories = [
      item.category,
      ...(Array.isArray(item.categories) ? item.categories : []),
    ]
      .filter(Boolean)
      .map((entry) => String(entry).toLowerCase());
    const categoryOk =
      !normalizedCategory ||
      categories.includes(normalizedCategory);
    const searchOk =
      !search ||
      matchesSearch(item.title, search) ||
      matchesSearch(item.description, search) ||
      matchesSearch(item.metafields?.vendor, search);
    return categoryOk && searchOk;
  });
}

function filterFirms(list, params = {}) {
  const { category, style, search } = params;
  return list.filter((firm) => {
    const categoryOk =
      !category ||
      category === "All" ||
      firm.category?.toLowerCase() === category.toLowerCase();
    const styleOk =
      !style ||
      style === "All" ||
      (firm.styles || []).some(
        (s) => s.toLowerCase() === style.toLowerCase()
      );
    const searchOk =
      !search ||
      matchesSearch(firm.name, search) ||
      matchesSearch(firm.tagline, search) ||
      matchesSearch(firm.description, search);
    return categoryOk && styleOk && searchOk;
  });
}

function filterAssociates(list, params = {}) {
  const { search, skill, software, timezone } = params;
  return list.filter((associate) => {
    const searchOk =
      !search ||
      matchesSearch(associate.title, search) ||
      matchesSearch(associate.summary, search) ||
      matchesSearch(associate.location, search) ||
      matchesSearch(associate.user?.email, search);
    const skillOk =
      !skill ||
      (associate.specialisations || []).some((spec) =>
        spec.toLowerCase().includes(skill.toLowerCase())
      );
    const softwareOk =
      !software ||
      (associate.softwares || []).some((app) =>
        app.toLowerCase().includes(software.toLowerCase())
      );
    const timezoneOk = !timezone || associate.timezone === timezone;
    return searchOk && skillOk && timezoneOk && softwareOk;
  });
}

async function tryRequest(path, params) {
  const { data } = await client.get(path, { params });
  if (!Array.isArray(data?.items) && !Array.isArray(data?.firms)) {
    throw new Error("Unexpected response");
  }
  return data;
}

export async function fetchCatalog(params = {}) {
  if (params.kind === "studio") {
    return filterStudios(LOCAL_STUDIOS, params);
  }
  if (params.kind === "material") {
    return filterMaterials(LOCAL_MATERIALS, params);
  }
  const studios = filterStudios(LOCAL_STUDIOS, params);
  const materials = filterMaterials(LOCAL_MATERIALS, params);
  return [...studios, ...materials];
}

const buildStudioFacets = (list = []) => {
  const categoryCounts = new Map();
  const styleCounts = new Map();
  const prices = [];
  list.forEach((studio) => {
    (studio.categories || []).forEach((category) => {
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    if (studio.style) {
      styleCounts.set(studio.style, (styleCounts.get(studio.style) || 0) + 1);
    }
    const numeric = Number(studio.priceSqft);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
      prices.push(numeric);
    }
  });
  return {
    categories: Array.from(categoryCounts, ([name, count]) => ({ name, count })),
    styles: Array.from(styleCounts, ([name, count]) => ({ name, count })),
    tags: [],
    priceRange: {
      min: prices.length ? Math.min(...prices) : null,
      max: prices.length ? Math.max(...prices) : null,
    },
  };
};

export async function fetchStudios(params = {}) {
  try {
    const { data } = await client.get("/marketplace/studios", { params });
    const items = (data?.items || []).map(normalizeStudio);
    const meta = data?.meta || {};
    return {
      items,
      meta: {
        total: meta.total ?? items.length,
        facets: meta.facets || buildStudioFacets(items),
        web3: meta.web3 || null,
      },
    };
  } catch {
    const filtered = filterStudios(LOCAL_STUDIOS, params);
    return {
      items: filtered,
      meta: {
        total: filtered.length,
        facets: buildStudioFacets(filtered),
        web3: null,
      },
    };
  }
}

export async function fetchMaterials(params = {}) {
  try {
    const { data } = await client.get("/marketplace/materials", { params });
    const items = (data?.items || []).map(normalizeMaterial);
    const meta = data?.meta || { total: items.length };
    return {
      items,
      meta: {
        ...meta,
        total: meta.total ?? items.length,
        web3: meta.web3 || null,
      },
    };
  } catch {
    const filtered = filterMaterials(LOCAL_MATERIALS, params);
    return {
      items: filtered,
      meta: { total: filtered.length, web3: null },
    };
  }
}

export async function fetchMarketplaceAssociates(params = {}) {
  try {
    const { data } = await client.get("/marketplace/associates", { params });
    const items = (data?.items || []).map(normalizeAssociate);
    return {
      items: filterAssociates(items, params),
      meta: {
        total: data?.meta?.total ?? items.length,
        web3: data?.meta?.web3 || null,
      },
    };
  } catch {
    const filtered = filterAssociates(LOCAL_ASSOCIATES, params);
    return { items: filtered, meta: { total: filtered.length, web3: null } };
  }
}

export async function fetchMarketplaceFirms(params = {}) {
  try {
    const { data } = await client.get("/marketplace/firms", { params });
    const items = data?.items || [];
    return {
      items,
      meta: {
        total: data?.meta?.total ?? items.length,
        web3: data?.meta?.web3 || null,
      },
    };
  } catch {
    const filtered = filterFirms(fallbackFirms, params);
    return { items: filtered, meta: { total: filtered.length, web3: null } };
  }
}

export async function fetchStudioBySlug(slug, params = {}) {
  if (!slug) return null;
  try {
    const { data } = await client.get(`/marketplace/studios/${slug}`, { params });
    const item = data?.item;
    if (!item) throw new Error('Not found');
    return normalizeStudio(item);
  } catch {
    return LOCAL_STUDIOS.find((studio) => studio.slug === slug) || null;
  }
}

export async function fetchFirms() {
  try {
    const { data } = await client.get("/admin/vendors");
    return data?.firms || [];
  } catch (err) {
    if (err?.response?.status === 403 || err?.response?.status === 401) {
      return [];
    }
    throw err;
  }
}

export async function fetchFirmProducts(firmId) {
  if (!firmId) return [];
  return fetchCatalog({ firmId });
}

export async function fetchAdminUsers() {
  try {
    const { data } = await client.get("/admin/users");
    return data?.users || [];
  } catch (err) {
    if (err?.response?.status === 403 || err?.response?.status === 401) {
      return [];
    }
    throw err;
  }
}

export async function fetchFirmById(firmId) {
  if (!firmId) return null;
  try {
    const { data } = await client.get(`/firms/${firmId}`);
    return data?.firm || null;
  } catch (err) {
    if (err?.response?.status === 403 || err?.response?.status === 401) {
      return null;
    }
    throw err;
  }
}

export async function fetchProductCatalog(params = {}) {
  try {
    const { data } = await client.get("/marketplace/materials", { params });
    if (!Array.isArray(data?.items)) throw new Error("Unexpected response");
    const enriched = data.items.map(
      (item) => productBySlug(item.slug) || { ...item, kind: "product" },
    );
    return {
      items: enriched,
      meta: {
        total: data.meta?.total ?? enriched.length,
        facets: buildProductFacets(enriched),
      },
    };
  } catch {
    const filtered = filterProducts(productCatalog, params);
    return {
      items: filtered,
      meta: {
        total: filtered.length,
        facets: buildProductFacets(filtered),
      },
    };
  }
}

export async function fetchProductBySlug(slug) {
  if (!slug) return null;
  try {
    const { data } = await client.get(`/marketplace/materials/${slug}`);
    const item = data?.item;
    if (!item) throw new Error("Not found");
    const normalised = normalizeMaterial(item);
    return productBySlug(item.slug) || normalised;
  } catch {
    return productBySlug(slug);
  }
}
export const getProductSearchRecords = () => productSearchRecords;

export const getAssociateCatalog = () => associateCatalog;

function normalize(value) {
  return String(value || "").toLowerCase();
}

function getProductPriceBounds(product) {
  const values = [];
  const pushPrice = (price) => {
    if (Number.isFinite(price)) values.push(price);
  };
  (product.variations || []).forEach((variation) =>
    pushPrice(Number(variation?.price)),
  );
  (product.offers || []).forEach((offer) => {
    Object.values(offer?.pricingByVariation || {}).forEach((pricing) =>
      pushPrice(Number(pricing?.price)),
    );
  });
  pushPrice(Number(product?.pricing?.basePrice));
  if (!values.length) return { min: 0, max: 0 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function filterProducts(list, params = {}) {
  const {
    category,
    search,
    seller,
    priceMin,
    priceMax,
    tags = [],
    attributes = {},
  } = params;
  const sellerLc = seller ? normalize(seller) : null;
  const tagFilters = Array.isArray(tags)
    ? tags.filter(Boolean).map(normalize)
    : [];
  const attributeFilters = attributes || {};
  const minPrice = Number(priceMin);
  const maxPrice = Number(priceMax);

  return list.filter((product) => {
    const categoryOk =
      !category ||
      category === "All" ||
      (product.categories || []).some(
        (cat) => normalize(cat) === normalize(category),
      );

    const searchOk =
      !search ||
      matchesSearch(product.title, search) ||
      matchesSearch(product.description, search) ||
      matchesSearch(product.metafields?.vendor, search) ||
      (product.searchKeywords || []).some((keyword) =>
        matchesSearch(keyword, search),
      );

    const sellerOk =
      !sellerLc ||
      (product.offers || []).some(
        (offer) =>
          normalize(offer?.sellerName) === sellerLc ||
          normalize(offer?.sellerId) === sellerLc,
      );

    const tagOk =
      !tagFilters.length ||
      tagFilters.every((tag) =>
        (product.tags || []).some((productTag) => normalize(productTag) === tag),
      );

    const priceBounds = getProductPriceBounds(product);
    const priceOk =
      (!Number.isFinite(minPrice) || priceBounds.max >= minPrice) &&
      (!Number.isFinite(maxPrice) || priceBounds.min <= maxPrice);

    const attributesOk = Object.entries(attributeFilters).every(
      ([code, values]) => {
        if (!values || !values.length) return true;
        const dimension = (product.variationDimensions || []).find(
          (entry) => entry.code === code,
        );
        if (!dimension) return false;
        const optionSet = new Set(
          (dimension.values || []).map((option) =>
            normalize(option?.value || option),
          ),
        );
        return values
          .map(normalize)
          .every((value) => optionSet.has(value));
      },
    );

    return categoryOk && searchOk && sellerOk && tagOk && priceOk && attributesOk;
  });
}

function buildProductFacets(items = []) {
  const categories = new Map();
  const tags = new Map();
  const sellers = new Map();
  const attributes = new Map();
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = Number.NEGATIVE_INFINITY;

  items.forEach((item) => {
    (item.categories || []).forEach((category) => {
      if (!category) return;
      categories.set(category, (categories.get(category) || 0) + 1);
    });
    (item.tags || []).forEach((tag) => {
      if (!tag) return;
      tags.set(tag, (tags.get(tag) || 0) + 1);
    });
    (item.offers || []).forEach((offer) => {
      if (offer?.sellerName) {
        sellers.set(offer.sellerName, (sellers.get(offer.sellerName) || 0) + 1);
      }
      Object.values(offer?.pricingByVariation || {}).forEach((pricing) => {
        const price = Number(pricing?.price);
        if (!Number.isFinite(price)) return;
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      });
    });
    (item.variations || []).forEach((variation) => {
      const price = Number(variation?.price);
      if (Number.isFinite(price)) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    });
    (item.variationDimensions || []).forEach((dimension) => {
      if (!dimension?.code) return;
      const entry =
        attributes.get(dimension.code) || {
          code: dimension.code,
          label: dimension.label || dimension.code,
          values: new Map(),
        };
      (dimension.values || []).forEach((option) => {
        const value = option?.value || option;
        if (!value) return;
        entry.values.set(value, (entry.values.get(value) || 0) + 1);
      });
      attributes.set(dimension.code, entry);
    });
  });

  const priceRange =
    Number.isFinite(minPrice) && Number.isFinite(maxPrice)
      ? { min: minPrice, max: maxPrice }
      : { min: 0, max: 0 };

  return {
    categories: Array.from(categories, ([name, count]) => ({ name, count })),
    tags: Array.from(tags, ([name, count]) => ({ name, count })),
    sellers: Array.from(sellers, ([name, count]) => ({ name, count })),
    attributes: Array.from(attributes.values()).map((attribute) => ({
      code: attribute.code,
      label: attribute.label,
      values: Array.from(attribute.values, ([value, count]) => ({
        value,
        count,
      })),
    })),
    priceRange,
    currency: items?.[0]?.pricing?.currency || "INR",
  };
}

