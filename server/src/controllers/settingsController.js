import User from "../models/User.js";

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

const mapToObject = (value, fallback) => {
  if (!value) return { ...fallback };
  if (value instanceof Map) {
    return { ...fallback, ...Object.fromEntries(value.entries()) };
  }
  if (typeof value === "object") {
    return { ...fallback, ...value };
  }
  return { ...fallback };
};

const toClientSettings = (user) => ({
  notifications: mapToObject(user?.settings?.notifications, defaultSettings.notifications),
  privacy: mapToObject(user?.settings?.privacy, defaultSettings.privacy),
  security: mapToObject(user?.settings?.security, defaultSettings.security),
  profile: mapToObject(user?.settings?.profile, defaultSettings.profile),
});

export const getSettings = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const user = await User.findById(userId).select("settings");
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    res.json({ ok: true, settings: toClientSettings(user) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const payload = req.body || {};
    const nextSettings = {
      notifications: mapToObject(payload.notifications, defaultSettings.notifications),
      privacy: mapToObject(payload.privacy, defaultSettings.privacy),
      security: mapToObject(payload.security, defaultSettings.security),
      profile: mapToObject(payload.profile, defaultSettings.profile),
    };
    await User.findByIdAndUpdate(userId, { settings: nextSettings });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
