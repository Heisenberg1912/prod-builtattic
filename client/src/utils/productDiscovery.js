import Fuse from "fuse.js";

const SAVED_SEARCH_KEY = "builtattic_product_saved_searches_v1";
const RECENT_VIEWS_KEY = "builtattic_product_recent_views_v1";
const MAX_RECENT = 10;

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const persist = (key, payload) => {
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}
};

const read = (key, fallback) => {
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
};

const fingerprintSearch = ({ query, filters }) => {
  return JSON.stringify({
    query: (query || "").trim().toLowerCase(),
    filters: filters || {},
  });
};

export const listSavedSearches = () => {
  const items = read(SAVED_SEARCH_KEY, []);
  return Array.isArray(items)
    ? [...items].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0),
      )
    : [];
};

export const upsertSavedSearch = ({ label, query, filters = {} }) => {
  const now = new Date().toISOString();
  const existing = read(SAVED_SEARCH_KEY, []);
  const fp = fingerprintSearch({ query, filters });
  const idx = existing.findIndex((item) => item.fingerprint === fp);

  if (idx >= 0) {
    const updated = {
      ...existing[idx],
      label: label || existing[idx].label,
      updatedAt: now,
    };
    existing[idx] = updated;
    persist(SAVED_SEARCH_KEY, existing);
    return updated;
  }

  const entry = {
    id: `saved-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    label: label || (query ? `Search "${query}"` : "Untitled search"),
    query: query || "",
    filters,
    fingerprint: fp,
    createdAt: now,
    updatedAt: now,
  };

  persist(SAVED_SEARCH_KEY, [...existing, entry]);
  return entry;
};

export const removeSavedSearch = (id) => {
  const existing = read(SAVED_SEARCH_KEY, []);
  const next = existing.filter((item) => item.id !== id);
  persist(SAVED_SEARCH_KEY, next);
  return next;
};

export const clearSavedSearches = () => {
  persist(SAVED_SEARCH_KEY, []);
};

const buildRecentRecord = (product) => {
  if (!product) return null;
  return {
    slug: product.slug,
    title: product.title,
    heroImage: product.heroImage || product.gallery?.[0] || "",
    price: product.pricing?.basePrice || product.price || null,
    currency: product.pricing?.currency || product.currency || "INR",
    seenAt: new Date().toISOString(),
  };
};

export const recordRecentView = (product) => {
  const record = buildRecentRecord(product);
  if (!record) return;
  const existing = read(RECENT_VIEWS_KEY, []);
  const filtered = existing.filter((item) => item.slug !== record.slug);
  filtered.unshift(record);
  persist(RECENT_VIEWS_KEY, filtered.slice(0, MAX_RECENT));
};

export const listRecentViews = () => {
  return read(RECENT_VIEWS_KEY, []);
};

export const clearRecentViews = () => {
  persist(RECENT_VIEWS_KEY, []);
};

const fuseOptions = {
  keys: ["title", "keywords", "category"],
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
};

export const createProductSearchEngine = (records) => {
  return new Fuse(records || [], fuseOptions);
};

export const getSearchSuggestions = (engine, query, limit = 6) => {
  if (!engine || !query) return [];
  return engine
    .search(query)
    .slice(0, limit)
    .map(({ item, score }) => ({
      ...item,
      score,
    }));
};

