import client from "../config/axios.jsx";

const OFFLINE_ACCOUNTS = {
  "superadmin@builtattic.com": {
    password: "Super#123",
    role: "superadmin",
    name: "Super Admin",
    rolesGlobal: ["superadmin"],
  },
  "admin@builtattic.com": {
    password: "Admin#123",
    role: "admin",
    name: "Platform Admin",
    rolesGlobal: ["admin"],
  },
  "vendor@builtattic.com": {
    password: "Vendor#123",
    role: "vendor",
    name: "Marketplace Vendor",
    company: "Vendor Works",
  },
  "firm@builtattic.com": {
    password: "Firm#123",
    role: "firm",
    name: "Architecture Firm Admin",
    company: "BuiltAttic Studio",
  },
  "associate@builtattic.com": {
    password: "Associate#123",
    role: "associate",
    name: "Design Associate",
  },
  "client@builtattic.com": {
    password: "Client#123",
    role: "client",
    name: "Client (Business)",
    clientType: "business",
  },
  "user@builtattic.com": {
    password: "User#123",
    role: "user",
    name: "BuiltAttic User",
  },
};

const pickTokenPayload = (payload = {}) => ({
  ok: payload.ok ?? true,
  token: payload.token || payload.accessToken || null,
  user: payload.user || null,
  rolesGlobal: payload.user?.rolesGlobal || payload.rolesGlobal || [],
});

const normaliseEmail = (email) => String(email || "").trim().toLowerCase();

const buildOfflineUser = (email, account) => {
  const base = {
    email: normaliseEmail(email),
    role: account.role,
    name: account.name || account.role,
  };
  if (Array.isArray(account.rolesGlobal)) {
    base.rolesGlobal = account.rolesGlobal;
  }
  if (account.company) {
    base.company = account.company;
  }
  if (account.clientType) {
    base.clientType = account.clientType;
  }
  return base;
};

const tryOfflineLogin = (email, password, err) => {
  const account = OFFLINE_ACCOUNTS[normaliseEmail(email)];
  const isNetworkError = err?.code === "ERR_NETWORK" || !err?.response;
  if (!account || password !== account.password || !isNetworkError) return null;
  const user = buildOfflineUser(email, account);
  return pickTokenPayload({
    token: `offline-${account.role}-${Date.now()}`,
    user,
    rolesGlobal: user.rolesGlobal || [],
  });
};

export async function register({ email, password, role, profile }) {
  try {
    const payload = { email, password, role };
    if (profile && Object.keys(profile).length > 0) {
      payload.profile = profile;
    }
    const { data } = await client.post("/auth/register", payload);
    return pickTokenPayload(data);
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Registration failed";
    throw new Error(message);
  }
}

export async function login(email, password) {
  try {
    const { data } = await client.post("/auth/login", { email, password });
    return pickTokenPayload(data);
  } catch (err) {
    const offline = tryOfflineLogin(email, password, err);
    if (offline) return offline;
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Login failed";
    throw new Error(message);
  }
}

export async function fetchCurrentUser() {
  try {
    const { data } = await client.get("/auth/me");
    return data?.user || null;
  } catch (err) {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {}
    if (err?.code === "ERR_NETWORK" || !err?.response) return null;
    throw err;
  }
}

export async function loginWithGoogle(idToken) {
  try {
    const { data } = await client.post("/auth/google", { idToken });
    return pickTokenPayload(data);
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Google sign-in failed";
    throw new Error(message);
  }
}


export async function requestPasswordReset(email) {
  try {
    const { data } = await client.post("/auth/forgot-password", { email });
    return data || { ok: true };
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Unable to start password reset";
    throw new Error(message);
  }
}

export async function resetPassword({ token, password }) {
  try {
    const { data } = await client.post("/auth/reset-password", { token, password });
    return data || { ok: true };
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Unable to reset password";
    throw new Error(message);
  }
}


const AUTH_STORAGE_KEYS = ["auth_token", "token", "role", "auth", "user", "auth_user", "profile"];

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
  try {
    await client.post("/auth/logout");
  } catch (error) {
    apiError = error;
    const status = error?.response?.status;
    if (!silent && status && status >= 500) {
      console.warn("logout_request_error", error);
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
