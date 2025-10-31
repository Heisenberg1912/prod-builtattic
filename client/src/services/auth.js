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

