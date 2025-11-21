import client from "../config/axios.jsx";

const AUTH_ERROR_STATUSES = new Set([401, 403, 419]);
const isAuthError = (error) => AUTH_ERROR_STATUSES.has(error?.response?.status);

const LOOKUP_API_ENABLED =
  typeof import.meta !== "undefined" &&
  import.meta?.env?.VITE_ENABLE_LOOKUP_API === "true";

function buildError(error, fallbackMessage) {
  const message = error?.response?.data?.error || error?.message || fallbackMessage;
  const nextError = new Error(message);
  nextError.authRequired = isAuthError(error);
  return nextError;
}

const handleRequest = async (path) => {
  try {
    const { data } = await client.get(path);
    return { ...data, fallback: false, authRequired: false };
  } catch (error) {
    throw buildError(error, "Unable to load dashboard");
  }
};

export const fetchAssociateDashboard = () => handleRequest("/dashboard/associate");
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
