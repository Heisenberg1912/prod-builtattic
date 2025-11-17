import client from "../config/axios.jsx";
import { hasStoredAuthToken, isPortalApiEnabled } from "../utils/portalApi.js";

const defaultSettings = {
  notifications: {
    orderUpdates: true,
    partnerAnnouncements: true,
    researchBriefs: false,
    productTips: true,
    weeklyDigest: true,
    smsAlerts: false,
    preferredChannel: 'email',
    digestFrequency: 'weekly',
  },
  privacy: {
    shareProfile: true,
    shareAnalytics: true,
    retainData: true,
    searchVisibility: true,
    profileIndexing: false,
  },
  security: {
    twoStep: false,
    loginAlerts: true,
    deviceVerification: true,
    biometricUnlock: false,
  },
  profile: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    company: '',
    jobTitle: '',
    avatar: '',
    pronouns: '',
    timezone: '',
    website: '',
    bio: '',
  },
};

const cloneDefaults = () => JSON.parse(JSON.stringify(defaultSettings));

const mergeWithDefaults = (settings = {}) => {
  const base = cloneDefaults();
  return {
    notifications: { ...base.notifications, ...(settings.notifications || {}) },
    privacy: { ...base.privacy, ...(settings.privacy || {}) },
    security: { ...base.security, ...(settings.security || {}) },
    profile: { ...base.profile, ...(settings.profile || {}) },
  };
};

const buildSettingsFallbackError = (message) => {
  const fallback = cloneDefaults();
  const error = new Error(message);
  error.fallback = fallback;
  return error;
};

export async function getSettings() {
  if (!isPortalApiEnabled()) {
    throw buildSettingsFallbackError("Workspace API offline; showing saved defaults");
  }
  if (!hasStoredAuthToken()) {
    throw buildSettingsFallbackError("Please sign in to view your settings");
  }
  try {
    const { data } = await client.get("/settings");
    if (data?.settings) {
      return mergeWithDefaults(data.settings);
    }
    return cloneDefaults();
  } catch (error) {
    if (error?.response?.status === 401) {
      throw buildSettingsFallbackError("Please sign in to view your settings");
    }
    if (!error?.response) {
      throw buildSettingsFallbackError("Settings API unavailable; showing cached defaults");
    }
    throw error;
  }
}

export async function updateSettings(payload) {
  if (!isPortalApiEnabled()) {
    throw new Error("Workspace API offline; unable to update settings");
  }
  if (!hasStoredAuthToken()) {
    throw new Error("Please sign in to update your settings");
  }
  try {
    const { data } = await client.put("/settings", payload);
    if (data?.ok === false) {
      throw new Error(data?.error || "Unable to update settings");
    }
    return data;
  } catch (error) {
    if (error?.response?.status === 401) {
      throw new Error("Please sign in to update your settings");
    }
    throw error;
  }
}
