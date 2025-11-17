import client from "../config/axios.jsx";
import {
  DASHBOARD_FALLBACKS,
  ASSOCIATE_DASHBOARD_FALLBACK,
  FIRM_DASHBOARD_FALLBACK,
  VENDOR_DASHBOARD_FALLBACK,
} from "../data/dashboardFallbacks.js";
import { DEFAULT_STUDIO_TILES } from "../utils/studioTiles.js";
import { DEFAULT_STUDIO_LOOKUP, getStoredLookupConfig, setStoredLookupConfig } from "../utils/studioLookup.js";

const AUTH_ERROR_STATUSES = new Set([401, 403, 419]);
const isAuthError = (error) => AUTH_ERROR_STATUSES.has(error?.response?.status);
const LOOKUP_API_ENABLED =
  typeof import.meta !== "undefined" &&
  import.meta?.env?.VITE_ENABLE_LOOKUP_API === "true";

const createFallback = (fallback, { authRequired = false, error } = {}) => {
  if (!fallback) return { ok: false, authRequired, error };
  return {
    ...fallback,
    ok: false,
    fallback: true,
    authRequired,
    error: error || null,
  };
};

const handleRequest = async (path, fallback) => {
  try {
    const { data } = await client.get(path);
    return { ...data, fallback: false, authRequired: false };
  } catch (error) {
    if (fallback) {
      return createFallback(fallback, {
        authRequired: false,
        error: error?.message,
      });
    }
    throw error;
  }
};

export const fetchAssociateDashboard = () => handleRequest('/dashboard/associate', ASSOCIATE_DASHBOARD_FALLBACK);
export const fetchFirmDashboard = () => handleRequest('/dashboard/firm', FIRM_DASHBOARD_FALLBACK);
export const fetchVendorDashboard = () => handleRequest('/dashboard/vendor', VENDOR_DASHBOARD_FALLBACK);

export const DASHBOARD_FALLBACK_DATA = DASHBOARD_FALLBACKS;

const buildHostingFallback = () => ({
  ok: true,
  hosting: {
    enabled: true,
    serviceSummary: DEFAULT_STUDIO_TILES.summary,
    services: DEFAULT_STUDIO_TILES.services,
    products: DEFAULT_STUDIO_TILES.products,
    updatedAt: new Date().toISOString(),
  },
  fallback: true,
});

const buildLookupFallback = () => ({
  ok: true,
  lookup: DEFAULT_STUDIO_LOOKUP,
  fallback: true,
});

export const fetchFirmHostingConfig = async () => {
  try {
    const { data } = await client.get('/portal/firm/design-studio/hosting');
    return data;
  } catch (error) {
    const fallback = buildHostingFallback();
    fallback.authRequired = isAuthError(error);
    fallback.error = error?.message;
    return fallback;
  }
};

export const updateFirmHostingConfig = async (payload) => {
  try {
    const { data } = await client.put('/portal/firm/design-studio/hosting', payload);
    return data;
  } catch (error) {
    return {
      ok: true,
      hosting: {
        enabled: true,
        serviceSummary: payload?.serviceSummary || DEFAULT_STUDIO_TILES.summary,
        services: payload?.services || DEFAULT_STUDIO_TILES.services,
        products: payload?.products || DEFAULT_STUDIO_TILES.products,
        updatedAt: new Date().toISOString(),
      },
      fallback: true,
      authRequired: isAuthError(error),
      error: error?.message,
    };
  }
};

export const fetchFirmLookupConfig = async () => {
  if (!LOOKUP_API_ENABLED) {
    const stored = getStoredLookupConfig();
    return {
      ok: true,
      lookup: stored || DEFAULT_STUDIO_LOOKUP,
      fallback: !stored,
    };
  }

  try {
    const { data } = await client.get('/portal/firm/design-studio/lookup');
    if (data?.lookup) setStoredLookupConfig(data.lookup);
    return data;
  } catch (error) {
    const stored = getStoredLookupConfig();
    if (stored) {
      return {
        ok: true,
        lookup: stored,
        fallback: true,
        authRequired: isAuthError(error),
        error: error?.message,
      };
    }
    const fallback = buildLookupFallback();
    fallback.authRequired = isAuthError(error);
    fallback.error = error?.message;
    return fallback;
  }
};

export const updateFirmLookupConfig = async (payload) => {
  const nextConfig = payload || DEFAULT_STUDIO_LOOKUP;

  if (!LOOKUP_API_ENABLED) {
    setStoredLookupConfig(nextConfig);
    return {
      ok: true,
      lookup: nextConfig,
      fallback: true,
    };
  }

  try {
    const { data } = await client.put('/portal/firm/design-studio/lookup', nextConfig);
    if (data?.lookup) setStoredLookupConfig(data.lookup);
    return data;
  } catch (error) {
    setStoredLookupConfig(nextConfig);
    return {
      ok: true,
      lookup: nextConfig,
      fallback: true,
      authRequired: isAuthError(error),
      error: error?.message,
    };
  }
};

export const fetchFirmStudioRequests = async (params = {}) => {
  try {
    const { data } = await client.get('/portal/firm/design-studio/requests', { params });
    return data;
  } catch (error) {
    return {
      requests: [],
      fallback: true,
      authRequired: isAuthError(error),
      error: error?.message,
    };
  }
};

export const updateFirmStudioRequest = async (id, payload) => {
  try {
    const { data } = await client.patch(`/portal/firm/design-studio/requests/${id}`, payload);
    return data;
  } catch (error) {
    return {
      ok: true,
      fallback: true,
      authRequired: isAuthError(error),
      error: error?.message,
    };
  }
};
