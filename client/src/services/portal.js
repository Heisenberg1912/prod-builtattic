import client from "../config/axios.jsx";
import { ASSOCIATE_PORTAL_FALLBACK, VENDOR_PORTAL_FALLBACK, FIRM_PORTAL_FALLBACK } from "../data/portalFallbacks.js";
import { VENDOR_DASHBOARD_FALLBACK, FIRM_DASHBOARD_FALLBACK } from "../data/dashboardFallbacks.js";
import { normaliseAssetUrl, buildDriveImageUrl } from "../utils/studioForm.js";

export const ASSOCIATE_PROFILE_DRAFT_KEY = "associate_portal_profile_draft";

const ASSOCIATE_PROFILE_DRAFT_EVENT = "associate-profile-draft";
const ASSOCIATE_PROFILE_CHANNEL = "associate_profile_draft";
const FIRM_PROFILE_DRAFT_KEY = "firm_portal_profile_draft";
const FIRM_STUDIOS_STORAGE_KEY = "firm_portal_studios_mock";

const okOrThrow = (response, fallbackMessage) => {
  if (response?.ok === false) {
    throw new Error(response?.error || fallbackMessage);
  }
  return response;
};

const VENDOR_PROFILE_DRAFT_KEY = "vendor_portal_profile_draft";

const safeParseJSON = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const nowISO = () => new Date().toISOString();

const portalApiEnabled = (import.meta?.env?.VITE_ENABLE_PORTAL_API || "true").toLowerCase() !== "false";
let portalMockMode = portalApiEnabled ? false : true;
const shouldMockPortalApi = () => portalMockMode;
const draftsEnabled = () => shouldMockPortalApi();

const isPortalNetworkError = (error) => !error?.response;
const AUTH_ERROR_STATUSES = new Set([401, 403, 419]);
const isPortalAuthError = (error) => AUTH_ERROR_STATUSES.has(error?.response?.status);

const activatePortalMockMode = (reason) => {
  if (portalMockMode) {
    return;
  }
  portalMockMode = true;
  if (import.meta?.env?.DEV) {
    const message = reason?.message || reason?.code || String(reason || 'Portal API offline');
    console.warn('[portal] Switching to offline workspace mode', message);
  }
};

const handlePortalNetworkFailure = (error) => {
  const networkFailure = isPortalNetworkError(error);
  const authFailure = isPortalAuthError(error);
  if (!portalApiEnabled && !networkFailure) {
    return false;
  }
  if (networkFailure || !portalApiEnabled) {
    activatePortalMockMode(error);
    return true;
  }
  if (authFailure) {
    // authentication/authorization issues should bubble up to the caller
    // so we can show the proper sign-in message instead of forcing offline mode
    return false;
  }
  return false;
};

const VENDOR_ONBOARDING_DEFAULT_STEPS = [
  { id: "profile", label: "Vendor profile", detail: "Share company & contact details", complete: false },
  { id: "catalog", label: "Material catalogue", detail: "Publish your first SKU", complete: false },
  { id: "logistics", label: "Logistics data", detail: "Set lead time + MOQ", complete: false },
  { id: "compliance", label: "Compliance", detail: "Submit approvals", complete: false },
];

const buildVendorOnboardingFallback = () => {
  const fallback = VENDOR_DASHBOARD_FALLBACK || {};
  const fallbackMaterials = Array.isArray(fallback.materials) ? fallback.materials : [];
  const fallbackLeads = Array.isArray(fallback.leads) ? fallback.leads : [];
  const fallbackOrders = Array.isArray(fallback.orders) ? fallback.orders : [];
  const steps = VENDOR_ONBOARDING_DEFAULT_STEPS.map((step, index) => ({
    ...step,
    complete: index < 2,
  }));
  return {
    ok: true,
    fallback: true,
    firm: fallback.firm || { name: "Material Ops Collective" },
    onboarding: {
      progress: Math.round((steps.filter((step) => step.complete).length / steps.length) * 100),
      steps,
      profileCompleteness: 50,
    },
    metrics: fallback.metrics || {
      totalSkus: fallbackMaterials.length,
      publishedSkus: fallbackMaterials.length,
      draftSkus: 0,
      inventoryCount: fallback.metrics?.inventoryCount || 0,
      leads: fallbackLeads.length,
      openOrders: fallbackOrders.filter((order) => order.status !== "fulfilled").length,
    },
    preview: {
      materials: fallbackMaterials,
      leads: fallbackLeads,
    },
  };
};

const createDraftChannel = () => {
  if (!draftsEnabled() || typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(ASSOCIATE_PROFILE_CHANNEL);
  } catch (error) {
    console.warn("associate_profile_channel_error", error);
    return null;
  }
};

let cachedAssociateDraftChannel = null;

const emitAssociateProfileDraftEvent = (detail) => {
  if (!draftsEnabled()) return;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ASSOCIATE_PROFILE_DRAFT_EVENT, { detail }));
  }
  if (!cachedAssociateDraftChannel) {
    cachedAssociateDraftChannel = createDraftChannel();
  }
  if (cachedAssociateDraftChannel) {
    try {
      cachedAssociateDraftChannel.postMessage({ ...detail, source: "broadcast" });
    } catch (error) {
      console.warn("associate_profile_channel_post_error", error);
    }
  }
};

export const subscribeToAssociateProfileDraft = (handler) => {
  if (!draftsEnabled() || typeof window === "undefined") return () => {};

  const customListener = (event) => handler(event.detail);
  window.addEventListener(ASSOCIATE_PROFILE_DRAFT_EVENT, customListener);

  const storageListener = (event) => {
    if (event.key !== ASSOCIATE_PROFILE_DRAFT_KEY) return;
    handler({
      profile: safeParseJSON(event.newValue),
      action: event.newValue ? "update" : "clear",
      source: "storage",
      timestamp: nowISO(),
    });
  };
  window.addEventListener("storage", storageListener);

  const channel = createDraftChannel();
  const channelListener = channel
    ? (event) => {
        handler(event.data);
      }
    : null;
  if (channel && channelListener) {
    channel.addEventListener("message", channelListener);
  }

  return () => {
    window.removeEventListener(ASSOCIATE_PROFILE_DRAFT_EVENT, customListener);
    window.removeEventListener("storage", storageListener);
    if (channel && channelListener) {
      channel.removeEventListener("message", channelListener);
      channel.close();
    }
  };
};

export const loadAssociateProfileDraft = () => {
  if (!draftsEnabled() || typeof window === "undefined") return null;
  return safeParseJSON(localStorage.getItem(ASSOCIATE_PROFILE_DRAFT_KEY));
};

export const saveAssociateProfileDraft = (profile = {}, meta = {}) => {
  if (!draftsEnabled() || typeof window === "undefined") {
    return { ...profile };
  }
  const current = loadAssociateProfileDraft() || {};
  const next = {
    ...current,
    ...profile,
    updatedAt: profile?.updatedAt || nowISO(),
  };
  try {
    localStorage.setItem(ASSOCIATE_PROFILE_DRAFT_KEY, JSON.stringify(next));
    emitAssociateProfileDraftEvent({
      profile: next,
      action: "update",
      source: meta.source || "local",
      timestamp: nowISO(),
    });
  } catch (error) {
    console.warn("associate_profile_draft_save_error", error);
  }
  return next;
};

export const clearAssociateProfileDraft = () => {
  if (!draftsEnabled() || typeof window === "undefined") return;
  try {
    localStorage.removeItem(ASSOCIATE_PROFILE_DRAFT_KEY);
    emitAssociateProfileDraftEvent({ profile: null, action: "clear", source: "local", timestamp: nowISO() });
  } catch (error) {
    console.warn("associate_profile_draft_clear_error", error);
  }
};

const createAssociateFallbackProfile = () => ({
  ...ASSOCIATE_PORTAL_FALLBACK,
  updatedAt: nowISO(),
});

const getLocalAssociateProfile = (sourceForNew = "fallback") => {
  if (!draftsEnabled()) {
    return { profile: ASSOCIATE_PORTAL_FALLBACK, source: 'fallback' };
  }
  const draft = loadAssociateProfileDraft();
  if (draft) {
    return { profile: draft, source: "draft" };
  }
  const fallback = saveAssociateProfileDraft(createAssociateFallbackProfile(), { source: sourceForNew });
  return { profile: fallback, source: sourceForNew };
};

export const loadVendorProfileDraft = () => {
  if (!draftsEnabled() || typeof window === "undefined") return null;
  return safeParseJSON(localStorage.getItem(VENDOR_PROFILE_DRAFT_KEY));
};

export const saveVendorProfileDraft = (profile = {}) => {
  if (!draftsEnabled() || typeof window === "undefined") {
    return { ...profile };
  }
  const current = loadVendorProfileDraft() || {};
  const next = {
    ...current,
    ...profile,
    updatedAt: profile?.updatedAt || nowISO(),
  };
  try {
    localStorage.setItem(VENDOR_PROFILE_DRAFT_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("vendor_profile_draft_save_error", error);
  }
  return next;
};

export const clearVendorProfileDraft = () => {
  if (!draftsEnabled() || typeof window === "undefined") return;
  try {
    localStorage.removeItem(VENDOR_PROFILE_DRAFT_KEY);
  } catch (error) {
    console.warn("vendor_profile_draft_clear_error", error);
  }
};

const createVendorFallbackProfile = () => ({
  ...VENDOR_PORTAL_FALLBACK,
  updatedAt: nowISO(),
});

const getLocalVendorProfile = (sourceForNew = "fallback") => {
  if (!draftsEnabled()) {
    return { profile: VENDOR_PORTAL_FALLBACK, source: 'fallback' };
  }
  const draft = loadVendorProfileDraft();
  if (draft) {
    return { profile: draft, source: "draft" };
  }
  const fallback = saveVendorProfileDraft(createVendorFallbackProfile());
  return { profile: fallback, source: sourceForNew };
};


const firmDraftStorageKey = (firmId) =>
  firmId ? `${FIRM_PROFILE_DRAFT_KEY}::${firmId}` : FIRM_PROFILE_DRAFT_KEY;

const loadFirmProfileDraft = (firmId) => {
  if (!draftsEnabled() || typeof window === "undefined") return null;
  return safeParseJSON(localStorage.getItem(firmDraftStorageKey(firmId)));
};

const saveFirmProfileDraft = (profile = {}, firmId) => {
  if (!draftsEnabled() || typeof window === "undefined") {
    return { ...profile };
  }
  const current = loadFirmProfileDraft(firmId) || {};
  const next = {
    ...current,
    ...profile,
    updatedAt: profile?.updatedAt || nowISO(),
  };
  try {
    localStorage.setItem(firmDraftStorageKey(firmId), JSON.stringify(next));
  } catch (error) {
    console.warn("firm_profile_draft_save_error", error);
  }
  return next;
};

const getLocalFirmProfile = (sourceForNew = "fallback", firmId) => {
  if (!draftsEnabled()) {
    return { profile: FIRM_PORTAL_FALLBACK, source: 'fallback' };
  }
  const draft = loadFirmProfileDraft(firmId);
  if (draft) {
    return { profile: draft, source: "draft" };
  }
  const fallback = saveFirmProfileDraft({ ...FIRM_PORTAL_FALLBACK, updatedAt: nowISO() }, { source: sourceForNew }, firmId);
  return { profile: fallback, source: sourceForNew };
};

let cachedMockFirmStudios = null;

const loadMockFirmStudios = () => {
  if (cachedMockFirmStudios) return [...cachedMockFirmStudios];
  if (!draftsEnabled() || typeof window === "undefined") return cachedMockFirmStudios;
  try {
    const parsed = safeParseJSON(localStorage.getItem(FIRM_STUDIOS_STORAGE_KEY), []);
    cachedMockFirmStudios = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("firm_studios_mock_load_error", error);
    cachedMockFirmStudios = [];
  }
  return [...cachedMockFirmStudios];
};

const persistMockFirmStudios = (items = []) => {
  cachedMockFirmStudios = Array.isArray(items) ? [...items] : [];
  if (draftsEnabled() && typeof window !== "undefined") {
    try {
      localStorage.setItem(FIRM_STUDIOS_STORAGE_KEY, JSON.stringify(cachedMockFirmStudios));
    } catch (error) {
      console.warn("firm_studios_mock_save_error", error);
    }
  }
  return [...cachedMockFirmStudios];
};

const ensureMockFirmStudios = () => {
  const existing = loadMockFirmStudios();
  if (existing && existing.length) {
    return existing;
  }
  const seeded = (FIRM_DASHBOARD_FALLBACK?.studios || []).map((studio, index) => {
    const id = studio._id || studio.id || ("demo-studio-" + (index + 1));
    return {
      ...studio,
      _id: id,
      id,
      status: studio.status || (index % 2 === 0 ? "published" : "draft"),
      updatedAt: studio.updatedAt || nowISO(),
    };
  });
  return persistMockFirmStudios(seeded);
};

const getMockFirmStudiosPayload = () => {
  const items = ensureMockFirmStudios();
  return {
    items,
    meta: buildFirmStudiosMeta(items),
  };
};

const buildFirmStudiosMeta = (items = []) => {
  const meta = items.reduce(
    (acc, item) => {
      const status = (item?.status || "draft").toLowerCase();
      if (status === "published") {
        acc.publishedCount += 1;
      } else {
        acc.draftCount += 1;
      }
      return acc;
    },
    { draftCount: 0, publishedCount: 0 }
  );
  return { total: items.length, ...meta };
};

const findStudioIndex = (items = [], id) => {
  if (!id) return -1;
  return items.findIndex((studio) => studio._id === id || studio.id === id);
};

const touchStudioRecord = (studio = {}, updates = {}) => {
  const identifier = studio._id || studio.id || ("studio-" + Date.now());
  return {
    ...studio,
    ...updates,
    _id: identifier,
    id: identifier,
    updatedAt: nowISO(),
  };
};
export async function fetchAssociatePortalProfile(options = {}) {
  const draft = loadAssociateProfileDraft();
  if (options.preferDraft && draft) {
    return { ok: true, profile: draft, source: "draft", stale: false };
  }
  if (shouldMockPortalApi()) {
    const local = getLocalAssociateProfile("mock");
    return { ok: true, profile: local.profile, source: local.source, stale: local.source !== "remote" };
  }
  try {
    const { data } = await client.get("/portal/associate/profile");
    const profile = data && typeof data === "object" ? data.profile ?? data : null;
    if (profile) {
      saveAssociateProfileDraft(
        { ...profile, updatedAt: profile.updatedAt || nowISO() },
        { source: options.source || "remote" }
      );
    }
    return { ok: true, profile, source: "remote" };
  } catch (error) {
    if (handlePortalNetworkFailure(error)) {
      const local = draft ? { profile: draft, source: "draft" } : getLocalAssociateProfile("fallback");
      return {
        ok: true,
        profile: local.profile,
        source: local.source,
        stale: true,
        fallback: true,
        authRequired: isPortalAuthError(error),
        error,
      };
    }
    const status = error?.response?.status;
    if (status === 404) {
      const local = getLocalAssociateProfile("fallback");
      return { ok: true, profile: local.profile, source: local.source, stale: true, error };
    }
    if (draft && options.fallbackToDraft !== false) {
      return {
        ok: true,
        profile: draft,
        source: "draft",
        stale: true,
        error,
      };
    }
    throw error;
  }
}

export async function upsertAssociatePortalProfile(payload = {}, options = {}) {
  if (shouldMockPortalApi()) {
    const mergedDraft = saveAssociateProfileDraft(
      { ...(loadAssociateProfileDraft() || {}), ...payload, updatedAt: nowISO() },
      { source: "mock" }
    );
    return { ok: true, profile: mergedDraft, source: "mock" };
  }
  try {
    const { data } = await client.put("/portal/associate/profile", payload);
    const profile = data && typeof data === "object" ? data.profile ?? data : null;
    if (profile) {
      saveAssociateProfileDraft(
        { ...profile, updatedAt: profile.updatedAt || nowISO() },
        { source: options.source || "remote" }
      );
    }
    return { ok: true, profile, source: "remote" };
  } catch (error) {
    const mergedDraft = saveAssociateProfileDraft(
      { ...(loadAssociateProfileDraft() || {}), ...payload, updatedAt: nowISO() },
      { source: options.source || "draft" }
    );
    if (handlePortalNetworkFailure(error)) {
      return {
        ok: true,
        profile: mergedDraft,
        source: "mock",
        fallback: true,
        authRequired: isPortalAuthError(error),
        offlineSaved: true,
        error,
      };
    }
    if (options.saveDraftOnError !== false) {
      return {
        ok: false,
        profile: mergedDraft,
        source: "draft",
        error,
      };
    }
    throw error;
  }
}

export async function fetchFirmPortalProfile(options = {}) {
  const firmId = options.firmId || '';
  const draft = loadFirmProfileDraft(firmId);
  if (options.preferDraft && draft) {
    return { ok: true, profile: draft, source: "draft", stale: false };
  }
  if (shouldMockPortalApi()) {
    const local = getLocalFirmProfile("mock", firmId);
    return {
      ok: true,
      profile: local.profile,
      firm: local.profile ? { name: local.profile.name, tagline: local.profile.tagline } : null,
      source: local.source,
      stale: local.source !== "remote",
    };
  }
  const config = firmId ? { params: { firmId } } : undefined;
  try {
    const { data } = await client.get("/portal/firm/profile", config);
    const profile = data?.profile || null;
    if (profile) {
      saveFirmProfileDraft({ ...profile, updatedAt: profile.updatedAt || nowISO() }, firmId);
    }
    return {
      ok: true,
      profile,
      firm: data?.firm || null,
      source: "remote",
      meta: data?.meta || null,
    };
  } catch (error) {
    if (handlePortalNetworkFailure(error)) {
      const local = draft ? { profile: draft, source: "draft" } : getLocalFirmProfile("fallback", firmId);
      return {
        ok: true,
        profile: local.profile,
        firm: local.profile ? { name: local.profile.name, tagline: local.profile.tagline } : null,
        source: local.source,
        fallback: true,
        authRequired: isPortalAuthError(error),
        error,
      };
    }
    throw error;
  }
}

export async function upsertFirmPortalProfile(payload = {}, options = {}) {
  const firmId = options.firmId || '';
  if (shouldMockPortalApi()) {
    const merged = saveFirmProfileDraft(
      { ...(loadFirmProfileDraft(firmId) || {}), ...payload, updatedAt: nowISO() },
      firmId
    );
    return {
      ok: true,
      profile: merged,
      firm: merged ? { name: merged.name, tagline: merged.tagline } : null,
      source: "mock",
    };
  }
  const config = firmId ? { params: { firmId } } : undefined;
  try {
    const { data } = await client.put("/portal/firm/profile", payload, config);
    const profile = data?.profile || null;
    if (profile) {
      saveFirmProfileDraft({ ...profile, updatedAt: profile.updatedAt || nowISO() }, firmId);
    }
    return {
      ok: true,
      profile,
      firm: data?.firm || null,
      source: "remote",
      meta: data?.meta || null,
    };
  } catch (error) {
    if (handlePortalNetworkFailure(error)) {
      const merged = saveFirmProfileDraft(
        { ...(loadFirmProfileDraft(firmId) || {}), ...payload, updatedAt: nowISO() },
        firmId
      );
      return {
        ok: true,
        profile: merged,
        firm: merged ? { name: merged.name, tagline: merged.tagline } : null,
        source: "mock",
        fallback: true,
        authRequired: isPortalAuthError(error),
        error,
      };
    }
    throw error;
  }
}

export async function fetchVendorPortalProfile(options = {}) {
  const draft = loadVendorProfileDraft();
  if (options.preferDraft && draft) {
    return { ok: true, profile: draft, source: "draft", stale: false };
  }
  if (shouldMockPortalApi()) {
    const local = getLocalVendorProfile("mock");
    return { ok: true, profile: local.profile, source: local.source, stale: local.source !== "remote" };
  }
  try {
    const { data } = await client.get("/portal/vendor/profile");
    const profile = data && typeof data === "object" ? data.profile ?? data : null;
    if (profile) {
      saveVendorProfileDraft({ ...profile, updatedAt: profile.updatedAt || nowISO() });
    }
    return { ok: true, profile, source: "remote" };
  } catch (error) {
    if (handlePortalNetworkFailure(error)) {
      return {
        ok: true,
        profile: draft || loadVendorProfileDraft() || VENDOR_PORTAL_FALLBACK,
        source: draft ? "draft" : "mock",
        stale: true,
        fallback: true,
        authRequired: isPortalAuthError(error),
        error,
      };
    }
    const status = error?.response?.status;
    if (status === 404) {
      const local = getLocalVendorProfile("fallback");
      return { ok: true, profile: local.profile, source: local.source, stale: true, error };
    }
    if (draft && options.fallbackToDraft !== false) {
      return {
        ok: true,
        profile: draft,
        source: "draft",
        stale: true,
        error,
      };
    }
    throw error;
  }
}

export async function upsertVendorPortalProfile(payload = {}, options = {}) {
  if (shouldMockPortalApi()) {
    const merged = saveVendorProfileDraft({ ...(loadVendorProfileDraft() || {}), ...payload, updatedAt: nowISO() });
    return { ok: true, profile: merged, source: "mock" };
  }
  try {
    const { data } = await client.put("/portal/vendor/profile", payload);
    const profile = data && typeof data === "object" ? data.profile ?? data : null;
    if (profile) {
      saveVendorProfileDraft({ ...profile, updatedAt: profile.updatedAt || nowISO() });
    }
    return { ok: true, profile, source: "remote" };
  } catch (error) {
    const mergedDraft = saveVendorProfileDraft({ ...(loadVendorProfileDraft() || {}), ...payload, updatedAt: nowISO() });
    if (handlePortalNetworkFailure(error)) {
      return {
        ok: true,
        profile: mergedDraft,
        source: "mock",
        fallback: true,
        authRequired: isPortalAuthError(error),
        offlineSaved: true,
        error,
      };
    }
    if (options.saveDraftOnError !== false) {
      return {
        ok: false,
        profile: mergedDraft,
        source: "draft",
        error,
      };
    }
    throw error;
  }
}

export async function fetchFirmStudios(params = {}) {
  if (shouldMockPortalApi()) {
    return getMockFirmStudiosPayload();
  }
  try {
    const { data } = await client.get("/portal/studio/studios", { params });
    const response = okOrThrow(data, "Unable to load studios");
    return {
      items: response.items || [],
      meta: response.meta || { total: (response.items || []).length },
    };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 400) {
      activatePortalMockMode(error);
      return getMockFirmStudiosPayload();
    }
    if (handlePortalNetworkFailure(error)) {
      return getMockFirmStudiosPayload();
    }
    throw error;
  }
}

export async function createFirmStudio(payload) {
  const runMock = () => {
    const items = ensureMockFirmStudios();
    const studio = touchStudioRecord({ ...payload, status: payload?.status || "draft" });
    const updated = persistMockFirmStudios([studio, ...items]);
    return { ok: true, studio, meta: buildFirmStudiosMeta(updated) };
  };
  if (shouldMockPortalApi()) {
    return runMock();
  }
  try {
    const { data } = await client.post("/portal/studio/studios", payload);
    return okOrThrow(data, "Unable to create studio");
  } catch (error) {
    if (handlePortalNetworkFailure(error)) {
      return runMock();
    }
    throw error;
  }
}

export async function updateFirmStudio(id, payload) {
  const runMock = () => {
    const items = ensureMockFirmStudios();
    const index = findStudioIndex(items, id);
    if (index === -1) {
      return { ok: false, error: new Error("Studio not found") };
    }
    const studio = touchStudioRecord(items[index], { ...payload });
    const next = [...items];
    next[index] = studio;
    persistMockFirmStudios(next);
    return { ok: true, studio, meta: buildFirmStudiosMeta(next) };
  };
  if (shouldMockPortalApi()) {
    return runMock();
  }
  try {
    const { data } = await client.put("/portal/studio/studios/" + id, payload);
    return okOrThrow(data, "Unable to update studio");
  } catch (error) {
    if (handlePortalNetworkFailure(error)) {
      return runMock();
    }
    throw error;
  }
}

export async function publishFirmStudio(id) {
  const runMock = () => {
    const items = ensureMockFirmStudios();
    const index = findStudioIndex(items, id);
    if (index === -1) {
      return { ok: false, error: new Error("Studio not found") };
    }
    const studio = touchStudioRecord(items[index], { status: "published" });
    const next = [...items];
    next[index] = studio;
    persistMockFirmStudios(next);
    return { ok: true, studio, meta: buildFirmStudiosMeta(next) };
  };
  if (shouldMockPortalApi()) {
    return runMock();
  }
  try {
    const { data } = await client.post("/portal/studio/studios/" + id + "/publish");
    return okOrThrow(data, "Unable to publish studio");
  } catch (error) {
    if (handlePortalNetworkFailure(error)) {
      return runMock();
    }
    throw error;
  }
}

export async function deleteFirmStudio(id) {
  const runMock = () => {
    const items = ensureMockFirmStudios();
    const index = findStudioIndex(items, id);
    if (index === -1) {
      return { ok: false, error: new Error("Studio not found") };
    }
    const next = [...items];
    next.splice(index, 1);
    persistMockFirmStudios(next);
    return { ok: true, meta: buildFirmStudiosMeta(next) };
  };
  if (shouldMockPortalApi()) {
    return runMock();
  }
  try {
    const { data } = await client.delete("/portal/studio/studios/" + id);
    return okOrThrow(data, "Unable to delete studio");
  } catch (error) {
    if (handlePortalNetworkFailure(error)) {
      return runMock();
    }
    throw error;
  }
}

export async function fetchVendorOnboarding() {
  if (shouldMockPortalApi()) {
    return buildVendorOnboardingFallback();
  }
  try {
    const { data } = await client.get('/portal/vendor/onboarding');
    return okOrThrow(data, 'Unable to load vendor onboarding');
  } catch (error) {
    if (handlePortalNetworkFailure(error)) {
      const fallback = buildVendorOnboardingFallback();
      fallback.authRequired = isPortalAuthError(error);
      fallback.error = error?.message;
      return fallback;
    }
    if (isPortalAuthError(error)) {
      return {
        ok: false,
        authRequired: true,
        error: error?.response?.data?.error || error.message || 'Sign in to continue',
      };
    }
    throw error;
  }
}

export async function fetchVendorMaterials(params = {}) {
  if (shouldMockPortalApi()) {
    const fallback = VENDOR_DASHBOARD_FALLBACK;
    return {
      items: fallback?.materials || [],
      meta: fallback?.metrics || { total: fallback?.materials?.length || 0 },
    };
  }
  const { data } = await client.get('/portal/vendor/materials', { params });
  const response = okOrThrow(data, 'Unable to load SKUs');
  return {
    items: response.items || [],
    meta: response.meta || { total: (response.items || []).length },
  };
}

export async function createVendorMaterial(payload) {
  if (shouldMockPortalApi()) {
    return { ok: true, material: { ...payload, _id: `demo-${Date.now()}` } };
  }
  const { data } = await client.post('/portal/vendor/materials', payload);
  return okOrThrow(data, 'Unable to create SKU');
}

export async function updateVendorMaterial(id, payload) {
  if (shouldMockPortalApi()) {
    return { ok: true, material: { ...payload, _id: id } };
  }
  const { data } = await client.put(`/portal/vendor/materials/${id}`, payload);
  return okOrThrow(data, 'Unable to update SKU');
}

export async function publishVendorMaterial(id) {
  if (shouldMockPortalApi()) {
    return { ok: true };
  }
  const { data } = await client.post(`/portal/vendor/materials/${id}/publish`);
  return okOrThrow(data, 'Unable to publish SKU');
}

export async function deleteVendorMaterial(id) {
  if (shouldMockPortalApi()) {
    return { ok: true };
  }
  const { data } = await client.delete(`/portal/vendor/materials/${id}`);
  return okOrThrow(data, 'Unable to delete SKU');
}

export async function uploadAsset(file, { studioId, kind = "marketing", secure = true } = {}) {
  const FileCtor = typeof File !== 'undefined' ? File : null;
  if (!FileCtor || !(file instanceof FileCtor)) {
    throw new Error('A file must be provided');
  }
  const formData = new FormData();
  formData.append('file', file);
  if (studioId) formData.append('productId', studioId);
  if (kind) formData.append('kind', kind);
  formData.append('secure', secure ? 'true' : 'false');
  const { data } = await client.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const response = okOrThrow(data, 'Unable to upload document') || data || {};
  const asset = response.asset || {};
  const drivePreview = asset.driveFileId ? buildDriveImageUrl(asset.driveFileId) : null;
  const candidate =
    normaliseAssetUrl(
      asset.publicUrl ||
        asset.url ||
        asset.storagePath ||
        response.downloadUrl ||
        drivePreview ||
        asset.key
    ) || drivePreview;
  const url = candidate || response.downloadUrl || asset.storagePath || asset.url || null;
  return { ...response, asset, url, previewUrl: candidate || null };
}

export async function uploadStudioAsset(file, options = {}) {
  return uploadAsset(file, options);
}

