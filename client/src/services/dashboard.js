import client from "../config/axios.jsx";

const AUTH_ERROR_STATUSES = new Set([401, 403, 419]);
const isAuthError = (error) => AUTH_ERROR_STATUSES.has(error?.response?.status);

const LOOKUP_API_ENABLED =
  typeof import.meta !== "undefined" &&
  import.meta?.env?.VITE_ENABLE_LOOKUP_API === "true";

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallback;
};

const ASSOCIATE_DASHBOARD_DRIVE_URL =
  typeof import.meta !== "undefined" ? import.meta?.env?.VITE_ASSOCIATE_DASHBOARD_DRIVE_URL : null;
const PREFER_ASSOCIATE_DASHBOARD_DRIVE =
  typeof import.meta !== "undefined"
    ? normalizeBoolean(import.meta?.env?.VITE_ASSOCIATE_DASHBOARD_FROM_DRIVE, false)
    : false;

const hasAuthToken = () => {
  if (typeof window === "undefined") return true;
  try {
    return Boolean(window.localStorage.getItem("auth_token"));
  } catch {
    return true;
  }
};

function buildError(error, fallbackMessage) {
  const message = error?.response?.data?.error || error?.message || fallbackMessage;
  const nextError = new Error(message);
  nextError.authRequired = isAuthError(error);
  return nextError;
}

const fetchDriveDashboard = async () => {
  if (!ASSOCIATE_DASHBOARD_DRIVE_URL) return null;
  try {
    const response = await fetch(ASSOCIATE_DASHBOARD_DRIVE_URL, { credentials: "omit" });
    if (!response.ok) throw new Error(`associate_dashboard_drive_http_${response.status}`);
    const data = await response.json();
    const normalized = data && typeof data === "object" ? data : { payload: data };
    return { ...normalized, fallback: true, source: "drive", authRequired: false };
  } catch (error) {
    console.warn("associate_dashboard_drive_fallback_error", error);
    return null;
  }
};

const handleRequest = async (path) => {
  try {
    const { data } = await client.get(path);
    return { ...data, fallback: false, authRequired: false };
  } catch (error) {
    throw buildError(error, "Unable to load dashboard");
  }
};

export const fetchAssociateDashboard = async () => {
  if (PREFER_ASSOCIATE_DASHBOARD_DRIVE) {
    const drivePayload = await fetchDriveDashboard();
    if (drivePayload) return drivePayload;
  }

  if (!hasAuthToken() && ASSOCIATE_DASHBOARD_DRIVE_URL) {
    const drivePayload = await fetchDriveDashboard();
    if (drivePayload) return drivePayload;
  }

  try {
    return await handleRequest("/dashboard/associate");
  } catch (error) {
    const drivePayload = await fetchDriveDashboard();
    if (drivePayload) return drivePayload;
    throw error;
  }
};
export const fetchFirmDashboard = () => handleRequest("/dashboard/firm");
export const fetchVendorDashboard = () => handleRequest("/dashboard/vendor");

export const fetchFirmHostingConfig = async () => {
  try {
    const { data } = await client.get("/portal/firm/design-studio/hosting");
    return { ...data, fallback: false };
  } catch (error) {
    throw buildError(error, "Unable to load hosting config");
  }
};

export const updateFirmHostingConfig = async (payload) => {
  try {
    const { data } = await client.put("/portal/firm/design-studio/hosting", payload);
    return { ...data, fallback: false };
  } catch (error) {
    throw buildError(error, "Unable to update hosting config");
  }
};

export const fetchFirmLookupConfig = async () => {
  if (!LOOKUP_API_ENABLED) {
    throw new Error("Lookup API is disabled");
  }

  try {
    const { data } = await client.get("/portal/firm/design-studio/lookup");
    return { ...data, fallback: false };
  } catch (error) {
    throw buildError(error, "Unable to load lookup config");
  }
};

export const updateFirmLookupConfig = async (payload) => {
  if (!LOOKUP_API_ENABLED) {
    throw new Error("Lookup API is disabled");
  }

  try {
    const { data } = await client.put("/portal/firm/design-studio/lookup", payload || {});
    return { ...data, fallback: false };
  } catch (error) {
    throw buildError(error, "Unable to update lookup config");
  }
};

export const fetchFirmStudioRequests = async (params = {}) => {
  try {
    const { data } = await client.get("/portal/firm/design-studio/requests", { params });
    return { ...data, fallback: false };
  } catch (error) {
    throw buildError(error, "Unable to load studio requests");
  }
};

export const updateFirmStudioRequest = async (id, payload) => {
  if (!id) {
    throw new Error("request_id_required");
  }
  try {
    const { data } = await client.patch(`/portal/firm/design-studio/requests/${id}`, payload);
    return { ...data, fallback: false };
  } catch (error) {
    throw buildError(error, "Unable to update studio request");
  }
};
