import { getSettings, updateSettings } from "./settings.js";
import { readStoredAuth } from "./auth.js";

export const USER_PROFILE_KEY = "user_profile";

const DEFAULT_PROFILE = {
  name: "User",
  fullName: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  avatar: "",
  company: "",
  role: "user",
  updatedAt: null,
};

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const cloneProfile = (profile = {}) => ({
  ...DEFAULT_PROFILE,
  ...profile,
  name: profile.name ?? profile.fullName ?? DEFAULT_PROFILE.name,
  fullName: profile.fullName ?? profile.name ?? DEFAULT_PROFILE.fullName,
  role: profile.role || DEFAULT_PROFILE.role,
});

const decodeTokenPayload = (token) => {
  if (!token || typeof atob !== "function") return null;
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

const normalizeDirectUser = (user) => {
  if (!user || typeof user !== "object") return null;
  return cloneProfile({
    name: user.name || user.fullName || user.displayName || DEFAULT_PROFILE.name,
    fullName: user.fullName || user.name || "",
    email: user.email || "",
    phone: user.phone || user.phoneNumber || "",
    location: user.location || "",
    bio: user.bio || "",
    avatar: user.avatar || user.avatarUrl || user.profileImage || "",
    company: user.company || user.organization || "",
    role: user.role || DEFAULT_PROFILE.role,
    updatedAt: user.updatedAt || user.lastUpdated || null,
  });
};

const normalizeTokenUser = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  return cloneProfile({
    name: payload.name || payload.fullName || DEFAULT_PROFILE.name,
    fullName: payload.fullName || payload.name || "",
    email: payload.email || "",
    phone: payload.phone || "",
    location: payload.location || "",
    bio: payload.bio || "",
    avatar: payload.picture || payload.avatar || "",
    company: payload.company || "",
    role: payload.role || DEFAULT_PROFILE.role,
    updatedAt: payload.updatedAt || null,
  });
};

const mapRemoteToLocal = (remote = {}, role = DEFAULT_PROFILE.role) =>
  cloneProfile({
    name: remote.fullName || remote.name || remote.displayName || DEFAULT_PROFILE.name,
    fullName: remote.fullName || remote.name || "",
    email: remote.email || "",
    phone: remote.phone || "",
    location: remote.location || "",
    bio: remote.bio || "",
    avatar: remote.avatar || "",
    company: remote.company || "",
    role: role || DEFAULT_PROFILE.role,
  });

const mapLocalToRemote = (profile = {}, base = {}) => ({
  ...base,
  fullName: profile.name || profile.fullName || base.fullName || "",
  email: profile.email ?? base.email ?? "",
  phone: profile.phone ?? base.phone ?? "",
  location: profile.location ?? base.location ?? "",
  company: profile.company ?? base.company ?? "",
  avatar: profile.avatar ?? base.avatar ?? "",
  bio: profile.bio ?? base.bio ?? "",
});

const hasAccessToken = () => {
  if (typeof window === "undefined") return false;
  try {
    const snapshot = readStoredAuth();
    return Boolean(snapshot.token);
  } catch {
    return false;
  }
};

const readLocalProfile = () => {
  if (typeof window === "undefined") {
    return cloneProfile({ name: "Guest user" });
  }

  const storedProfile = safeParse(localStorage.getItem(USER_PROFILE_KEY));
  if (storedProfile) return cloneProfile(storedProfile);

  const directUser =
    safeParse(localStorage.getItem("user")) ||
    safeParse(localStorage.getItem("auth_user")) ||
    safeParse(localStorage.getItem("profile"));
  const normalizedDirect = normalizeDirectUser(directUser);
  if (normalizedDirect) return normalizedDirect;

  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  const normalizedToken = normalizeTokenUser(decodeTokenPayload(token));
  if (normalizedToken) return normalizedToken;

  return cloneProfile();
};

const persistLocalProfile = (profile) => {
  const snapshot = cloneProfile(profile);
  if (typeof window === "undefined") return snapshot;

  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(snapshot));
    localStorage.setItem("user", JSON.stringify(snapshot));

    const authSnapshot = readStoredAuth();
    const storedAuth = safeParse(localStorage.getItem("auth")) || {};
    const mergedAuth = {
      ...storedAuth,
      token: authSnapshot.token || storedAuth.token || null,
      role: authSnapshot.role || storedAuth.role || snapshot.role || DEFAULT_PROFILE.role,
      user: { ...(storedAuth.user || {}), ...snapshot },
    };
    localStorage.setItem("auth", JSON.stringify(mergedAuth));

    window.dispatchEvent(new CustomEvent("profile:updated", { detail: snapshot }));
  } catch (error) {
    console.warn("user_profile_local_persist_error", error);
  }

  return snapshot;
};

export const loadUserProfile = async (options = {}) => {
  const { forceLocal = false, preferRemote = true } = options;

  const localProfile = readLocalProfile();
  if (typeof window === "undefined" || forceLocal) {
    return cloneProfile(localProfile);
  }

  if (!preferRemote || !hasAccessToken()) {
    return cloneProfile(localProfile);
  }

  try {
    const settings = await getSettings();
    const role = localProfile.role || readStoredAuth().role || DEFAULT_PROFILE.role;
    const mapped = mapRemoteToLocal(settings?.profile || {}, role);
    const nextProfile = {
      ...mapped,
      updatedAt: new Date().toISOString(),
    };
    return persistLocalProfile(nextProfile);
  } catch (error) {
    if (error?.fallback?.profile) {
      const role = localProfile.role || DEFAULT_PROFILE.role;
      const mapped = mapRemoteToLocal(error.fallback.profile, role);
      const nextProfile = {
        ...mapped,
        updatedAt: new Date().toISOString(),
      };
      return persistLocalProfile(nextProfile);
    }
    if (error?.response?.status === 401) {
      return cloneProfile(localProfile);
    }
    console.warn("user_profile_remote_load_error", error);
    return cloneProfile(localProfile);
  }
};

export const saveUserProfile = async (updates = {}, options = {}) => {
  const { currentSettings = null, throwOnError = false, syncRemote = true } = options;

  const baseProfile = cloneProfile(
    typeof window === "undefined"
      ? { name: "Guest user" }
      : await loadUserProfile({ forceLocal: true, preferRemote: false })
  );

  const nextProfile = cloneProfile({
    ...baseProfile,
    ...updates,
    name: updates.name ?? updates.fullName ?? baseProfile.name,
    fullName: updates.fullName ?? updates.name ?? baseProfile.fullName,
    updatedAt: new Date().toISOString(),
  });

  const localSnapshot = persistLocalProfile(nextProfile);

  const shouldSync = syncRemote !== false && hasAccessToken();
  if (!shouldSync) {
    return localSnapshot;
  }

  try {
    const settings = currentSettings || (await getSettings());
    const payload = {
      notifications: settings.notifications,
      privacy: settings.privacy,
      security: settings.security,
      profile: mapLocalToRemote(localSnapshot, settings.profile),
    };
    await updateSettings(payload);
    return localSnapshot;
  } catch (error) {
    if (error?.response?.status === 401) {
      return localSnapshot;
    }
    console.warn("user_profile_remote_save_error", error);
    if (throwOnError) {
      throw error;
    }
    return localSnapshot;
  }
};

export const __private = {
  cloneProfile,
  readLocalProfile,
  persistLocalProfile,
  mapRemoteToLocal,
  mapLocalToRemote,
};
