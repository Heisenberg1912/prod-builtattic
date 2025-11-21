import client from "../config/axios.jsx";
import { productSearchRecords } from "../data/products.js";

import { fetchVendorPortalProfile } from "./portal.js";

import { decorateFirmWithProfile, decorateFirmsWithProfiles, loadFirmProfile } from "../utils/firmProfile.js";

export const buildStudioSlug = (studio = {}) => {
  const candidate = [
    studio.slug,
    studio.handle,
    studio.permalink,
    studio.alias,
    studio.shortcode,
    studio.workspaceSlug,
    studio.studioSlug,
  ].find((value) => typeof value === 'string' && value.trim().length);
  if (candidate) return candidate.trim();
  if (studio._id || studio.id) return String(studio._id || studio.id);
  return null;
};
const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const nowISO = () => new Date().toISOString();
const ADMIN_AUTH_STATUSES = new Set([401, 403]);

const sanitizeQueryParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});

const resolveAdminDataResource = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    throw new Error('resource_required');
  }
  return encodeURIComponent(normalized);
};

const buildLimitedDbOverview = () => ({
  limited: true,
  fetchedAt: nowISO(),
  db: {
    name: 'Access restricted',
  },
  server: null,
  collections: [],
});

const vendorProfilePromises = { authed: null, guest: null };

const hasAuthSession = () => {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const token =
      window.localStorage.getItem('auth_token') ||
      window.localStorage.getItem('token');
    return Boolean(token && token !== 'null' && token !== 'undefined');
  } catch (error) {
    console.warn('vendor_profile_session_check_failed', error);
    return false;
  }
};

async function getVendorProfileForMarketplace() {
  const sessionKey = hasAuthSession() ? 'authed' : 'guest';
  if (!vendorProfilePromises[sessionKey]) {
    vendorProfilePromises[sessionKey] = (async () => {
      try {
        const response = await fetchVendorPortalProfile({ preferDraft: false, fallbackToDraft: false });
        if (response?.profile && response?.source !== "mock" && !response?.fallback) {
          return response.profile;
        }
      } catch (error) {
        console.warn('vendor_profile_load_failed', error);
      }
      return null;
    })();
  }
  return vendorProfilePromises[sessionKey];
}

function decorateMaterialsWithVendorProfile(items = [], profile) {
  if (!profile) return items;
  const catalog = Array.isArray(profile.catalogSkus) ? profile.catalogSkus : [];
  if (!catalog.length) return items;
  const slugSet = new Set(catalog.map((entry) => entry && String(entry).trim().toLowerCase()).filter(Boolean));
  if (!slugSet.size) return items;

  return items.map((material) => {
    const slugCandidates = [
      material.slug,
      material._id,
      material.id,
      material.handle,
      material.metafields?.slug,
      material.metafields?.sku,
    ]
      .map((value) => (value ? String(value).trim().toLowerCase() : null))
      .filter(Boolean);
    const matched = slugCandidates.some((candidate) => slugSet.has(candidate));
    if (!matched) return material;

    const next = { ...material, vendorProfile: profile };
    next.metafields = { ...(material.metafields || {}) };
    if (profile.companyName) {
      next.metafields.vendor = profile.companyName;
      next.vendor = profile.companyName;
    }
    if (profile.location) {
      next.metafields.location = profile.location;
    }
    if (profile.leadTimeDays && !next.metafields.leadTime) {
      next.metafields.leadTime = `${profile.leadTimeDays} days`;
    }
    if (profile.minOrderQuantity && !next.metafields.moq) {
      next.metafields.moq = profile.minOrderQuantity;
    }
    if (profile.tagline) {
      next.vendorTagline = profile.tagline;
    }
    if (profile.heroImage && !next.heroImage) {
      next.heroImage = profile.heroImage;
    }
    return next;
  });
}

const buildFirmFromStudio = (studio = {}) => {
  if (studio.firm) return { ...studio.firm };
  const firmId =
    studio.firmId ||
    studio.vendorId ||
    studio.ownerId ||
    studio.sellerId ||
    null;
  if (!firmId) return null;
  return {
    _id: firmId,
    name:
      studio.firmName ||
      studio.creator?.name ||
      studio.vendorName ||
      studio.sellerName ||
      '',
  };
};

const decorateStudioWithStoredProfile = (studio = {}) => {
  const firmCandidate = buildFirmFromStudio(studio);
  const profile = firmCandidate ? loadFirmProfile(firmCandidate._id, firmCandidate) : null;
  if (studio.firm) {
    const existingFirm = { ...studio.firm };
    const decorated = profile ? decorateFirmWithProfile(existingFirm, profile) : existingFirm;
    return { ...studio, firm: decorated };
  }
  if (!firmCandidate) {
    return { ...studio };
  }
  const decoratedCandidate = profile ? decorateFirmWithProfile(firmCandidate, profile) : firmCandidate;
  return { ...studio, firm: decoratedCandidate };
};

const decorateStudiosWithProfiles = (studios = []) =>
  studios.map((studio) => decorateStudioWithStoredProfile(studio));

const normalizeHostingConfig = (hosting = {}) => ({
  enabled: hosting.enabled !== false,
  serviceSummary: hosting.serviceSummary || hosting.summary || "",
  services: Array.isArray(hosting.services) ? hosting.services.filter(Boolean) : [],
  products: Array.isArray(hosting.products) ? hosting.products.filter(Boolean) : [],
  updatedAt: hosting.updatedAt || hosting.updated_at || hosting.syncedAt || null,
});

const normalizeStudio = (studio = {}) => {
  const galleryArray = ensureArray(studio.gallery).filter(Boolean);
  const heroCandidate =
    studio.heroImage ||
    studio.hero_image ||
    studio.image ||
    galleryArray[0] ||
    null;
  const slug = buildStudioSlug(studio);
  const gallery = heroCandidate
    ? [heroCandidate, ...galleryArray.filter((img) => img !== heroCandidate)]
    : galleryArray;
  const currency = studio.currency || studio.pricing?.currency || "USD";
  const basePriceRaw = studio.pricing?.basePrice ?? studio.price ?? studio.pricing?.total ?? null;
  const totalPriceRaw = studio.pricing?.total ?? studio.totalPrice ?? null;
  const priceSqftRaw = studio.priceSqft ?? studio.pricing?.priceSqft ?? null;
  const pricing = {
    ...studio.pricing,
    currency,
    basePrice: Number.isFinite(Number(basePriceRaw)) ? Number(basePriceRaw) : basePriceRaw ?? null,
    total: Number.isFinite(Number(totalPriceRaw)) ? Number(totalPriceRaw) : totalPriceRaw ?? null,
    unit: studio.pricing?.unit || studio.pricing?.unitLabel || studio.unit || "sq ft",
    priceSqft: Number.isFinite(Number(priceSqftRaw)) ? Number(priceSqftRaw) : priceSqftRaw ?? null,
  };
  const serviceBadges = Array.isArray(studio.serviceBadges)
    ? studio.serviceBadges.filter(Boolean)
    : Array.isArray(studio.services)
      ? studio.services
          .map((service) =>
            typeof service === "string" ? service : service?.label || service?.name || null,
          )
          .filter(Boolean)
      : [];
  const hostingSource = studio.hosting || studio.firm?.hosting || null;
  const hosting = hostingSource ? normalizeHostingConfig(hostingSource) : null;
  const firm = studio.firm
    ? {
        ...studio.firm,
        hosting: hosting || studio.firm.hosting || null,
      }
    : studio.firm;
  return {
    ...studio,
    slug,
    heroImage: heroCandidate,
    gallery,
    pricing,
    priceSqft: pricing.priceSqft,
    currency,
    serviceBadges,
    hosting,
    firm,
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
  const resolvedHero =
    associate.heroImage ||
    associate.coverImage ||
    (Array.isArray(associate.portfolioMedia) && associate.portfolioMedia[0]?.mediaUrl) ||
    null;
  const resolvedAvatar =
    associate.profileImage ||
    associate.avatar ||
    "/assets/associates/default-consultant.jpg";
  const resolveMediaItems = () => {
    const direct = Array.isArray(associate.portfolioMedia) ? associate.portfolioMedia : [];
    return direct
      .map((item) => ({
        title: item.title || "",
        description: item.description || "",
        mediaUrl: item.mediaUrl || item.url || item.image || "",
        kind: item.kind || "",
      }))
      .filter((item) => item.mediaUrl);
  };
  return {
    ...associate,
    hourlyRate: hourly ?? null,
    rates: mergedRates,
    heroImage: resolvedHero,
    profileImage: associate.profileImage || associate.avatar || null,
    avatar: resolvedAvatar,
    contactEmail: associate.contactEmail || associate.user?.email || null,
    serviceBadges: associate.serviceBadges || [],
    booking: associate.booking || null,
    warranty: associate.warranty || null,
    addons: associate.addons || [],
    prepChecklist: associate.prepChecklist || [],
    deliverables: associate.deliverables || [],
    expertise: associate.expertise || [],
    portfolioMedia: resolveMediaItems(),
  };
};

function matchesSearch(target = "", search = "") {
  if (!search) return true;
  return target.toLowerCase().includes(search.toLowerCase());
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

export async function fetchCatalog(params = {}) {
  if (params.kind === "studio") {
    const { items } = await fetchStudios(params);
    return items;
  }
  if (params.kind === "material") {
    const { items } = await fetchMaterials(params);
    return items;
  }
  const [studios, materials] = await Promise.all([
    fetchStudios(params).then((res) => res.items).catch(() => []),
    fetchMaterials(params).then((res) => res.items).catch(() => []),
  ]);
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
    const items = decorateStudiosWithProfiles((data?.items || []).map(normalizeStudio));
    const meta = data?.meta || {};
    return {
      items,
      meta: {
        total: meta.total ?? items.length,
        facets: meta.facets || buildStudioFacets(items),
        web3: meta.web3 || null,
      },
    };
  } catch (error) {
    const message = error?.response?.data?.error || error?.message || "Unable to load studios";
    throw new Error(message);
  }
}




export async function fetchMaterials(params = {}) {
  const vendorProfile = await getVendorProfileForMarketplace();
  try {
    const { data } = await client.get("/marketplace/materials", { params });
    const items = decorateMaterialsWithVendorProfile((data?.items || []).map(normalizeMaterial), vendorProfile);
    const meta = data?.meta || { total: items.length };
    return {
      items,
      meta: {
        ...meta,
        total: meta.total ?? items.length,
        web3: meta.web3 || null,
      },
    };
  } catch (error) {
    const message = error?.response?.data?.error || error?.message || "Unable to load materials";
    throw new Error(message);
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
  } catch (error) {
    const message = error?.response?.data?.error || error?.message || "Unable to load associates";
    throw new Error(message);
  }
}




export async function fetchDesignStudioHosting(params = {}) {
  const { data } = await client.get('/marketplace/design-studio/hosting', { params });
  if (!data?.hosting) {
    throw new Error("Hosting config not available");
  }
  const hosting = data.hosting || {};
  return {
    ...data,
    fallback: false,
    hosting: {
      enabled: Boolean(hosting.enabled),
      serviceSummary: hosting.serviceSummary || "",
      services: Array.isArray(hosting.services) ? hosting.services : [],
      products: Array.isArray(hosting.products) ? hosting.products : [],
      updatedAt: hosting.updatedAt || hosting.updated_at || nowISO(),
    },
  };
}


export async function fetchMarketplaceFirms(params = {}) {
  try {
    const { data } = await client.get("/marketplace/firms", { params });
    const items = decorateFirmsWithProfiles(data?.items || []);
    return {
      items,
      meta: {
        total: data?.meta?.total ?? items.length,
        web3: data?.meta?.web3 || null,
      },
    };
  } catch (error) {
    const message = error?.response?.data?.error || error?.message || "Unable to load firms";
    throw new Error(message);
  }
}

export async function fetchStudioBySlug(slug, params = {}) {
  if (!slug) return null;
  try {
    const { data } = await client.get(`/marketplace/studios/${slug}`, { params });
    const item = data?.item;
    if (!item) throw new Error('Not found');
    return decorateStudioWithStoredProfile(normalizeStudio(item));
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }
    const message = error?.response?.data?.error || error?.message || "Unable to load studio";
    throw new Error(message);
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

export async function fetchAdminUsers(params = {}) {
  const queryParams = sanitizeQueryParams({
    q:
      typeof params?.query === 'string'
        ? params.query.trim()
        : typeof params?.q === 'string'
          ? params.q.trim()
          : undefined,
    limit:
      Number.isFinite(params?.limit) && params.limit > 0
        ? Math.floor(params.limit)
        : undefined,
  });

  try {
    const { data } = await client.get('/admin/users', { params: queryParams });
    return data?.users || [];
  } catch (err) {
    if (ADMIN_AUTH_STATUSES.has(err?.response?.status)) {
      return [];
    }
    throw err;
  }
}

export async function fetchMarketplaceAssociateProfile(id) {
  if (!id) {
    throw new Error("Associate id is required");
  }
  try {
    const { data } = await client.get(`/marketplace/associates/${id}`);
    if (data?.item) {
      return normalizeAssociate(data.item);
    }
    return null;
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function inviteAdminUser(payload = {}) {
  if (!payload?.email) {
    throw new Error('email_required');
  }
  const body = {
    email: String(payload.email).trim().toLowerCase(),
    role: payload.role || 'user',
  };
  if (payload.password) {
    body.password = payload.password;
  }
  const { data } = await client.post('/admin/users', body);
  return data?.user || null;
}

export async function updateAdminUser(userId, payload = {}) {
  if (!userId) {
    throw new Error('user_id_required');
  }
  const { data } = await client.patch(`/admin/users/${userId}`, payload);
  return data?.user || null;
}

export async function deleteAdminUser(userId) {
  if (!userId) {
    throw new Error('user_id_required');
  }
  const { data } = await client.delete(`/admin/users/${userId}`);
  return data?.user || null;
}

export async function resetAdminUserPassword(userId) {
  if (!userId) {
    throw new Error('user_id_required');
  }
  await client.post(`/admin/users/${userId}/reset-password`);
  return true;
}

export async function fetchDbOverview() {
  try {
    const { data } = await client.get('/admin/db/overview');
    return data?.overview || null;
  } catch (error) {
    if (ADMIN_AUTH_STATUSES.has(error?.response?.status)) {
      return buildLimitedDbOverview();
    }
    throw error;
  }
}

export async function fetchAdminStudioRequests(params = {}) {
  const queryParams = sanitizeQueryParams({
    limit:
      Number.isFinite(params?.limit) && params.limit > 0
        ? Math.floor(params.limit)
        : undefined,
  });
  try {
    const { data } = await client.get('/admin/studio-requests', { params: queryParams });
    return {
      requests: data?.requests || [],
      metrics: data?.metrics || { total: 0, open: 0, byStatus: [], bySource: [] },
    };
  } catch (error) {
    if (ADMIN_AUTH_STATUSES.has(error?.response?.status)) {
      return { requests: [], metrics: { total: 0, open: 0, byStatus: [], bySource: [] } };
    }
    throw error;
  }
}

export async function fetchAdminDataResources() {
  try {
    const { data } = await client.get('/admin/data');
    return data?.resources || [];
  } catch (error) {
    if (ADMIN_AUTH_STATUSES.has(error?.response?.status)) {
      return [];
    }
    throw error;
  }
}

export async function fetchAdminDataItems(resource, params = {}) {
  const resourceKey = resolveAdminDataResource(resource);
  const queryParams = sanitizeQueryParams(params);
  const { data } = await client.get(`/admin/data/${resourceKey}`, { params: queryParams });
  return data?.items ? data : { items: data?.items || [], meta: data?.meta || null };
}

export async function createAdminDataItem(resource, payload = {}) {
  const resourceKey = resolveAdminDataResource(resource);
  const { data } = await client.post(`/admin/data/${resourceKey}`, payload);
  return data?.item || null;
}

export async function updateAdminDataItem(resource, recordId, payload = {}) {
  if (!recordId) {
    throw new Error('record_id_required');
  }
  const resourceKey = resolveAdminDataResource(resource);
  const { data } = await client.patch(`/admin/data/${resourceKey}/${recordId}`, payload);
  return data?.item || null;
}

export async function deleteAdminDataItem(resource, recordId) {
  if (!recordId) {
    throw new Error('record_id_required');
  }
  const resourceKey = resolveAdminDataResource(resource);
  const { data } = await client.delete(`/admin/data/${resourceKey}/${recordId}`);
  return data?.item || null;
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
  const { data } = await client.get("/marketplace/materials", { params });
  if (!Array.isArray(data?.items)) {
    throw new Error("Unexpected response");
  }
  const enriched = data.items.map((item) => ({ ...item, kind: "product" }));
  return {
    items: enriched,
    meta: {
      total: data.meta?.total ?? enriched.length,
      facets: buildProductFacets(enriched),
    },
  };
}

export async function fetchProductBySlug(slug) {
  if (!slug) return null;
  try {
    const { data } = await client.get(`/marketplace/materials/${slug}`);
    const item = data?.item;
    if (!item) throw new Error("Not found");
    return normalizeMaterial(item);
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
export const getProductSearchRecords = () => productSearchRecords;

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

