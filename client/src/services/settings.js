import client from "../config/axios.jsx";

const defaultSettings = {
  notifications: {
    orderUpdates: true,
    partnerAnnouncements: true,
    researchBriefs: false,
  },
  privacy: {
    shareProfile: true,
    shareAnalytics: true,
    retainData: true,
  },
  security: {
    twoStep: false,
    loginAlerts: true,
  },
  profile: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    company: '',
    avatar: '',
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

export async function getSettings() {
  try {
    const { data } = await client.get("/settings");
    if (data?.settings) {
      return mergeWithDefaults(data.settings);
    }
    return cloneDefaults();
  } catch (error) {
    if (error?.response?.status === 401) {
      const fallback = cloneDefaults();
      const authError = new Error("Please sign in to view your settings");
      authError.fallback = fallback;
      throw authError;
    }
    throw error;
  }
}

export async function updateSettings(payload) {
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
