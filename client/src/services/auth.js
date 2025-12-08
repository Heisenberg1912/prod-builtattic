import client from "../config/axios.jsx";

// Keep only essential auth functions for existing authenticated sessions
// Login/registration functionality removed - to be reworked

const AUTH_STORAGE_KEYS = ["auth_token", "token", "role", "auth", "user", "auth_user", "profile"];

const hasStoredAuthToken = () => {
  if (typeof window === 'undefined') return false;
  try {
    const token = window.localStorage.getItem('auth_token');
    return Boolean(token && token !== 'undefined' && token !== 'null');
  } catch {
    return false;
  }
};

export async function fetchCurrentUser() {
  try {
    const { data } = await client.get("/auth/me");
    return data?.user || null;
  } catch (err) {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch (cacheError) {
      console.warn("auth_cached_user_parse_error", cacheError);
    }
    if (err?.code === "ERR_NETWORK" || !err?.response) return null;
    throw err;
  }
}

export function readStoredAuth() {
  if (typeof window === "undefined") {
    return { token: null, role: "user" };
  }
  try {
    const storage = window.localStorage;
    const rawToken = storage.getItem("auth_token") || storage.getItem("token");
    const token = rawToken && rawToken !== "undefined" && rawToken !== "null" ? rawToken : null;
    const role = storage.getItem("role") || "user";
    return { token, role: role || "user" };
  } catch (error) {
    console.warn('auth_read_snapshot_error', error);
    return { token: null, role: "user" };
  }
}

export function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }
  const fromJSON = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };
  try {
    const storage = window.localStorage;
    const directUser = fromJSON(storage.getItem("user")) || fromJSON(storage.getItem("auth_user")) || fromJSON(storage.getItem("profile"));
    if (directUser && typeof directUser === "object") {
      return directUser;
    }
    const auth = fromJSON(storage.getItem("auth"));
    if (auth?.user && typeof auth.user === "object") {
      return auth.user;
    }
  } catch (error) {
    console.warn('auth_read_user_error', error);
  }
  return null;
}

export async function logout(options = {}) {
  const { silent = false } = options;
  let apiError = null;
  const shouldCallApi = hasStoredAuthToken();
  if (shouldCallApi) {
    try {
      await client.post("/auth/logout");
    } catch (error) {
      const status = error?.response?.status;
      if (status !== 401 && status !== 403) {
        apiError = error;
        if (!silent && status && status >= 500) {
          console.warn("logout_request_error", error);
        }
      }
    }
  }
  if (typeof window !== "undefined") {
    try {
      const storage = window.localStorage;
      AUTH_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
    } catch (storageError) {
      console.warn('logout_storage_error', storageError);
    }
    try {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    } catch (eventError) {
      if (!silent) {
        console.warn('logout_event_error', eventError);
      }
    }
  }
  return apiError == null;
}
