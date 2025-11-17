import axios from "axios";

const fallbackBase = "/api";

const normalizeBase = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }
  if (trimmed.startsWith("/")) {
    return trimmed.replace(/\/+$/, "");
  }
  return `/${trimmed.replace(/\/+$/, "")}`;
};

const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  fallbackBase;

const BASE_URL = normalizeBase(rawBase) || fallbackBase;

const apiTimeout =
  typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_TIMEOUT_MS
    ? Number(import.meta.env.VITE_API_TIMEOUT_MS)
    : null;

const instance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  timeout: Number.isFinite(apiTimeout) && apiTimeout > 0 ? apiTimeout : 12000,
});

instance.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("auth_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const AUTH_STORAGE_KEYS = ["auth_token", "token", "role", "auth", "user", "auth_user", "profile"];
const UNAUTH_PATHS = [/\/auth\//i, /\/register/i, /\/login/i];
let pendingLogout = false;

const shouldSkipUnauthorizedHandling = (config = {}) => {
  const url = config.url || "";
  return UNAUTH_PATHS.some((pattern) => pattern.test(url));
};

const purgeAuthState = () => {
  if (typeof window === "undefined") return;
  try {
    const storage = window.localStorage;
    AUTH_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
  } catch (error) {
    console.warn('auth_purge_error', error);
  }
  try {
    window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'unauthorized' } }));
  } catch (eventError) {
    console.warn('auth_logout_event_error', eventError);
  }
};

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (!pendingLogout && (status === 401 || status === 419) && !shouldSkipUnauthorizedHandling(error?.config)) {
      pendingLogout = true;
      purgeAuthState();
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/login';
      if (typeof window !== 'undefined' && !/\/login$/i.test(currentPath)) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/login?redirect=${redirect}`);
      }
      setTimeout(() => {
        pendingLogout = false;
      }, 500);
    }
    return Promise.reject(error);
  }
);

export default instance;
