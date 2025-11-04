import client from "../config/axios.jsx";

const okOrThrow = (response, fallbackMessage) => {
  if (response?.ok === false) {
    throw new Error(response?.error || fallbackMessage);
  }
  return response;
};

const ASSOCIATE_PROFILE_DRAFT_KEY = "associate_portal_profile_draft";

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

export const loadAssociateProfileDraft = () => {
  if (typeof window === "undefined") return null;
  return safeParseJSON(localStorage.getItem(ASSOCIATE_PROFILE_DRAFT_KEY));
};

export const saveAssociateProfileDraft = (profile = {}) => {
  if (typeof window === "undefined") {
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
  } catch (error) {
    console.warn("associate_profile_draft_save_error", error);
  }
  return next;
};

export const clearAssociateProfileDraft = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ASSOCIATE_PROFILE_DRAFT_KEY);
  } catch (error) {
    console.warn("associate_profile_draft_clear_error", error);
  }
};

export const loadVendorProfileDraft = () => {
  if (typeof window === "undefined") return null;
  return safeParseJSON(localStorage.getItem(VENDOR_PROFILE_DRAFT_KEY));
};

export const saveVendorProfileDraft = (profile = {}) => {
  if (typeof window === "undefined") {
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
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(VENDOR_PROFILE_DRAFT_KEY);
  } catch (error) {
    console.warn("vendor_profile_draft_clear_error", error);
  }
};

export async function fetchAssociatePortalProfile(options = {}) {
  const draft = loadAssociateProfileDraft();
  if (options.preferDraft && draft) {
    return { ok: true, profile: draft, source: "draft", stale: false };
  }
  try {
    const { data } = await client.get("/portal/associate/profile");
    const profile = data && typeof data === "object" ? data.profile ?? data : null;
    if (profile) {
      saveAssociateProfileDraft({ ...profile, updatedAt: profile.updatedAt || nowISO() });
    }
    return { ok: true, profile, source: "remote" };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      return {
        ok: false,
        authRequired: true,
        profile: draft || null,
        source: draft ? "draft" : null,
        error: new Error("Sign in to manage your Skill Studio profile"),
      };
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
  try {
    const { data } = await client.put("/portal/associate/profile", payload);
    const profile = data && typeof data === "object" ? data.profile ?? data : null;
    if (profile) {
      saveAssociateProfileDraft({ ...profile, updatedAt: profile.updatedAt || nowISO() });
    }
    return { ok: true, profile, source: "remote" };
  } catch (error) {
    const status = error?.response?.status;
    const mergedDraft = saveAssociateProfileDraft({ ...(loadAssociateProfileDraft() || {}), ...payload, updatedAt: nowISO() });
    if (status === 401 || status === 403) {
      return {
        ok: true,
        profile: mergedDraft,
        source: "draft",
        authRequired: true,
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

export async function fetchVendorPortalProfile(options = {}) {
  const draft = loadVendorProfileDraft();
  if (options.preferDraft && draft) {
    return { ok: true, profile: draft, source: "draft", stale: false };
  }
  try {
    const { data } = await client.get("/portal/vendor/profile");
    const profile = data && typeof data === "object" ? data.profile ?? data : null;
    if (profile) {
      saveVendorProfileDraft({ ...profile, updatedAt: profile.updatedAt || nowISO() });
    }
    return { ok: true, profile, source: "remote" };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      return {
        ok: false,
        authRequired: true,
        profile: draft || null,
        source: draft ? "draft" : null,
        error: new Error("Sign in to manage your Material Studio vendor profile"),
      };
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
  try {
    const { data } = await client.put("/portal/vendor/profile", payload);
    const profile = data && typeof data === "object" ? data.profile ?? data : null;
    if (profile) {
      saveVendorProfileDraft({ ...profile, updatedAt: profile.updatedAt || nowISO() });
    }
    return { ok: true, profile, source: "remote" };
  } catch (error) {
    const status = error?.response?.status;
    const mergedDraft = saveVendorProfileDraft({ ...(loadVendorProfileDraft() || {}), ...payload, updatedAt: nowISO() });
    if (status === 401 || status === 403) {
      return {
        ok: true,
        profile: mergedDraft,
        source: "draft",
        authRequired: true,
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
  const { data } = await client.get("/portal/studio/studios", { params });
  const response = okOrThrow(data, "Unable to load studios");
  return {
    items: response.items || [],
    meta: response.meta || { total: (response.items || []).length },
  };
}

export async function createFirmStudio(payload) {
  const { data } = await client.post("/portal/studio/studios", payload);
  return okOrThrow(data, "Unable to create studio");
}

export async function updateFirmStudio(id, payload) {
  const { data } = await client.put(`/portal/studio/studios/${id}`, payload);
  return okOrThrow(data, "Unable to update studio");
}

export async function publishFirmStudio(id) {
  const { data } = await client.post(`/portal/studio/studios/${id}/publish`);
  return okOrThrow(data, "Unable to publish studio");
}

export async function deleteFirmStudio(id) {
  const { data } = await client.delete(`/portal/studio/studios/${id}`);
  return okOrThrow(data, "Unable to delete studio");
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
  return okOrThrow(data, 'Unable to upload document');
}

export async function uploadStudioAsset(file, options = {}) {
  return uploadAsset(file, options);
}
