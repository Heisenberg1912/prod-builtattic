import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getSettings, updateSettings } from "../services/settings.js";
import {
  readStoredAuth,
  readStoredUser,
  logout as performLogout,
} from "../services/auth.js";
import {
  Shield,
  ShieldCheck,
  Smartphone,
  Bell,
  Mail,
  Database,
  Trash2,
  Settings2,
  LogIn,
  LogOut,
  MonitorSmartphone,
  User,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Eye,
  EyeOff,
  Lock,
  Palette,
  Moon,
  Sun,
  Monitor,
  Save,
  X,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const SETTINGS_DEFAULTS = {
  notifications: {
    orderUpdates: true,
    partnerAnnouncements: true,
    researchBriefs: false,
    productTips: true,
    weeklyDigest: true,
    smsAlerts: false,
    preferredChannel: "email",
    digestFrequency: "weekly",
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
  appearance: {
    theme: "light",
    compactMode: false,
    animationsEnabled: true,
  },
  profile: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    company: "",
    jobTitle: "",
    pronouns: "",
    timezone: "",
    website: "",
    avatar: "",
    bio: "",
  },
};

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
  "America/Sao_Paulo",
  "Africa/Johannesburg",
];

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "appearance", label: "Appearance", icon: Palette },
];

const mergeSettingsWithDefaults = (incoming = {}) => ({
  notifications: { ...SETTINGS_DEFAULTS.notifications, ...(incoming.notifications || {}) },
  privacy: { ...SETTINGS_DEFAULTS.privacy, ...(incoming.privacy || {}) },
  security: { ...SETTINGS_DEFAULTS.security, ...(incoming.security || {}) },
  appearance: { ...SETTINGS_DEFAULTS.appearance, ...(incoming.appearance || {}) },
  profile: { ...SETTINGS_DEFAULTS.profile, ...(incoming.profile || {}) },
});

const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (error) {
    return "UTC";
  }
};

const hydrateProfileWithUser = (profile = {}, user) => {
  if (!user) return profile;
  const nextProfile = { ...profile };
  const applyIfEmpty = (key, value) => {
    if (nextProfile[key]) return;
    if (!value) return;
    nextProfile[key] = value;
  };
  applyIfEmpty("fullName", user.name || user.fullName);
  applyIfEmpty("email", user.email);
  applyIfEmpty("company", user.company || user.organization || user.orgName);
  applyIfEmpty("jobTitle", user.title || user.role);
  applyIfEmpty("phone", user.phone);
  if (!nextProfile.timezone) {
    nextProfile.timezone = detectTimezone();
  }
  return nextProfile;
};

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authState, setAuthState] = useState(() => readStoredAuth());
  const [userProfile, setUserProfile] = useState(() => readStoredUser());
  const [activeTab, setActiveTab] = useState("profile");
  const settingsRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const userHydrationKey = `${userProfile?.email || ""}|${userProfile?.name || ""}`;

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
  }, []);

  const isAuthenticated = Boolean(authState?.token);

  useEffect(() => {
    let isMounted = true;
    const hydrateFromFallback = (nextSettings, message = "") => {
      const merged = mergeSettingsWithDefaults(nextSettings);
      const resolvedProfile = hydrateProfileWithUser(merged.profile, userProfile);
      if (isMounted) {
        setSettings({ ...merged, profile: resolvedProfile, hasChanges: false });
        if (message) setError(message);
      }
    };
    async function loadSettings() {
      setLoading(true);
      try {
        const data = await getSettings();
        if (!isMounted) return;
        hydrateFromFallback(data, "");
      } catch (err) {
        if (!isMounted) return;
        if (err?.fallback) {
          hydrateFromFallback(err.fallback, err.message);
        } else {
          setError(err?.message || "Unable to load settings");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (!isAuthenticated) {
      hydrateFromFallback({}, "Sign in to sync your settings");
      setLoading(false);
      return () => { isMounted = false; };
    }
    loadSettings();
    return () => { isMounted = false; };
  }, [isAuthenticated, userHydrationKey]);

  const handleSave = useCallback(
    async ({ silent = false } = {}) => {
      const snapshot = settingsRef.current;
      if (!snapshot || !snapshot.hasChanges) return false;
      if (!isAuthenticated) {
        if (!silent) {
          toast.error("Sign in to save your settings");
          navigate("/login", { state: { from: "/settings" } });
        }
        return false;
      }
      if (!silent) {
        setSaving(true);
        setError("");
        setSuccess("");
      }
      const payload = {
        notifications: snapshot.notifications,
        privacy: snapshot.privacy,
        security: snapshot.security,
        appearance: snapshot.appearance,
        profile: snapshot.profile,
      };
      try {
        await updateSettings(payload);
        setSettings((prev) => (prev ? { ...prev, hasChanges: false } : prev));
        if (!silent) {
          setSuccess("Settings updated successfully");
          toast.success("Settings saved");
        }
        return true;
      } catch (err) {
        if (!silent) {
          setError(err?.message || "Unable to update settings");
          toast.error("Failed to save settings");
        }
        return false;
      } finally {
        if (!silent) setSaving(false);
      }
    },
    [isAuthenticated, navigate],
  );

  const queueAutoSave = useCallback(() => {
    if (!isAuthenticated) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus("queued");
    autoSaveTimer.current = window.setTimeout(async () => {
      setAutoSaveStatus("saving");
      const ok = await handleSave({ silent: true });
      setAutoSaveStatus(ok ? "saved" : "error");
      if (ok) window.setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 900);
  }, [handleSave, isAuthenticated]);

  const applySettingsUpdate = useCallback(
    (updater, { autoSave = false } = {}) => {
      setSettings((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        if (!next || next === prev) return prev;
        return { ...next, hasChanges: true };
      });
      if (autoSave) queueAutoSave();
    },
    [queueAutoSave],
  );

  const toggleNotification = (id) => {
    setError("");
    setSuccess("");
    applySettingsUpdate(
      (prev) => ({
        ...prev,
        notifications: { ...(prev.notifications || {}), [id]: !Boolean(prev.notifications?.[id]) },
      }),
      { autoSave: true },
    );
  };

  const updateNotificationPreference = (key, value) => {
    setError("");
    setSuccess("");
    applySettingsUpdate(
      (prev) => ({
        ...prev,
        notifications: { ...(prev.notifications || {}), [key]: value },
      }),
      { autoSave: true },
    );
  };

  const togglePrivacy = (id) => {
    setError("");
    setSuccess("");
    applySettingsUpdate(
      (prev) => ({
        ...prev,
        privacy: { ...(prev.privacy || {}), [id]: !Boolean(prev.privacy?.[id]) },
      }),
      { autoSave: true },
    );
  };

  const toggleSecurity = (id, nextValue) => {
    setError("");
    setSuccess("");
    applySettingsUpdate(
      (prev) => {
        const current = Boolean(prev.security?.[id]);
        const resolved = typeof nextValue === "boolean" ? nextValue : !current;
        if (current === resolved) return prev;
        return {
          ...prev,
          security: { ...(prev.security || {}), [id]: resolved },
        };
      },
      { autoSave: true },
    );
  };

  const updateProfileField = (field, value) => {
    setError("");
    setSuccess("");
    applySettingsUpdate((prev) => ({
      ...prev,
      profile: { ...(prev.profile || {}), [field]: value },
    }));
  };

  const updateAppearance = (key, value) => {
    setError("");
    setSuccess("");
    applySettingsUpdate(
      (prev) => ({
        ...prev,
        appearance: { ...(prev.appearance || {}), [key]: value },
      }),
      { autoSave: true },
    );
  };

  const handleSignOut = async () => {
    try {
      await performLogout({ silent: true });
      toast.success('Signed out');
      navigate('/login');
    } catch (err) {
      toast.error('Unable to sign out completely');
    }
  };

  const displayName = settings?.profile?.fullName || userProfile?.name || 'Guest user';
  const displayEmail = settings?.profile?.email || userProfile?.email || 'Not provided';
  const profileInitials = useMemo(() => {
    const source = settings?.profile?.fullName || displayName || 'Builtattic';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'BA';
  }, [settings?.profile?.fullName, displayName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50/50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          <p className="text-sm text-stone-500 font-medium">Loading settings...</p>
        </motion.div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-stone-50/50 flex items-center justify-center p-4">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm max-w-md w-full text-center"
        >
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-5 h-5 text-stone-500" />
          </div>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">Settings Unavailable</h2>
          <p className="text-sm text-stone-500 mb-6">{error || 'Unable to load settings'}</p>
          <Button onClick={() => navigate('/login')} className="bg-stone-900 hover:bg-stone-800">
            <LogIn className="w-4 h-4 mr-2" />
            Sign in
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <motion.header
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center text-white text-lg font-semibold"
              >
                {profileInitials}
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl font-semibold text-stone-900 tracking-tight"
                >
                  {displayName}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-stone-500 text-sm"
                >
                  {displayEmail}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-2 mt-2"
                >
                  {isAuthenticated ? (
                    <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-600 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-500 rounded-full">
                      Signed out
                    </span>
                  )}
                  {autoSaveStatus === "saving" && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-500 rounded-full flex items-center gap-1">
                      <RefreshCcw className="w-3 h-3 animate-spin" />
                      Saving
                    </span>
                  )}
                  {autoSaveStatus === "saved" && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-stone-900 text-white rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Saved
                    </span>
                  )}
                </motion.div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              {settings?.hasChanges && (
                <Button
                  onClick={() => handleSave()}
                  disabled={saving || !isAuthenticated}
                  className="bg-stone-900 hover:bg-stone-800"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              )}
              {isAuthenticated ? (
                <Button onClick={handleSignOut} variant="outline" className="border-stone-200 hover:bg-stone-100">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Button onClick={() => navigate('/login')} className="bg-stone-900 hover:bg-stone-800">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </motion.div>
          </div>
        </motion.header>

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {(error || success) && (
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-6"
            >
              {error && (
                <div className="flex items-center justify-between px-4 py-3 bg-stone-100 border border-stone-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-stone-500" />
                    <p className="text-sm text-stone-600">{error}</p>
                  </div>
                  <button onClick={() => setError("")} className="p-1 hover:bg-stone-200 rounded transition-colors">
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
              )}
              {success && (
                <div className="flex items-center justify-between px-4 py-3 bg-stone-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <p className="text-sm text-white">{success}</p>
                  </div>
                  <button onClick={() => setSuccess("")} className="p-1 hover:bg-stone-800 rounded transition-colors">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white border border-stone-200 rounded-xl p-1.5 shadow-sm">
            <div className="flex flex-wrap gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900">Personal Information</h3>
                    <p className="text-xs text-stone-500">Update your profile details</p>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-stone-700">Full Name</Label>
                      <Input
                        id="fullName"
                        value={settings.profile?.fullName || ''}
                        onChange={(e) => updateProfileField('fullName', e.target.value)}
                        placeholder="John Doe"
                        className="border-stone-200 focus:border-stone-400 focus:ring-stone-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-stone-700">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.profile?.email || ''}
                        onChange={(e) => updateProfileField('email', e.target.value)}
                        placeholder="you@example.com"
                        className="border-stone-200 focus:border-stone-400 focus:ring-stone-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-stone-700">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={settings.profile?.phone || ''}
                        onChange={(e) => updateProfileField('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="border-stone-200 focus:border-stone-400 focus:ring-stone-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-stone-700">Location</Label>
                      <Input
                        id="location"
                        value={settings.profile?.location || ''}
                        onChange={(e) => updateProfileField('location', e.target.value)}
                        placeholder="New York, USA"
                        className="border-stone-200 focus:border-stone-400 focus:ring-stone-200"
                      />
                    </div>
                  </div>

                  <div className="border-t border-stone-100 pt-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-stone-700">Company</Label>
                        <Input
                          id="company"
                          value={settings.profile?.company || ''}
                          onChange={(e) => updateProfileField('company', e.target.value)}
                          placeholder="Acme Corp"
                          className="border-stone-200 focus:border-stone-400 focus:ring-stone-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle" className="text-stone-700">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={settings.profile?.jobTitle || ''}
                          onChange={(e) => updateProfileField('jobTitle', e.target.value)}
                          placeholder="Senior Designer"
                          className="border-stone-200 focus:border-stone-400 focus:ring-stone-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-stone-700">Timezone</Label>
                        <select
                          id="timezone"
                          value={settings.profile?.timezone || ''}
                          onChange={(e) => updateProfileField('timezone', e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-colors"
                        >
                          <option value="">Select timezone</option>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-stone-700">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={settings.profile?.website || ''}
                          onChange={(e) => updateProfileField('website', e.target.value)}
                          placeholder="https://yoursite.com"
                          className="border-stone-200 focus:border-stone-400 focus:ring-stone-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-stone-100 pt-5">
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-stone-700">Bio</Label>
                      <textarea
                        id="bio"
                        value={settings.profile?.bio || ''}
                        onChange={(e) => updateProfileField('bio', e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="flex w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 resize-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              key="security"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900">Security Settings</h3>
                    <p className="text-xs text-stone-500">Manage account security</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <SettingToggle
                    icon={ShieldCheck}
                    title="Two-Step Verification"
                    description="Add extra security to your account"
                    checked={settings.security?.twoStep || false}
                    onChange={(checked) => {
                      toggleSecurity('twoStep', checked);
                      toast.success(checked ? '2FA enabled' : '2FA disabled');
                    }}
                  />
                  <SettingToggle
                    icon={Bell}
                    title="Login Alerts"
                    description="Get notified of new sign-ins"
                    checked={settings.security?.loginAlerts || false}
                    onChange={(checked) => toggleSecurity('loginAlerts', checked)}
                  />
                  <SettingToggle
                    icon={MonitorSmartphone}
                    title="Device Verification"
                    description="Require verification for new devices"
                    checked={settings.security?.deviceVerification || false}
                    onChange={(checked) => toggleSecurity('deviceVerification', checked)}
                  />
                  <SettingToggle
                    icon={Smartphone}
                    title="Biometric Unlock"
                    description="Use Touch ID or Face ID"
                    checked={settings.security?.biometricUnlock || false}
                    onChange={(checked) => toggleSecurity('biometricUnlock', checked)}
                  />
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h3 className="font-medium text-stone-900">Password & Recovery</h3>
                </div>
                <div className="p-3 space-y-1">
                  <ActionButton label="Change Password" />
                  <ActionButton label="Update Recovery Email" />
                  <ActionButton label="View Active Sessions" />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900">Notification Preferences</h3>
                    <p className="text-xs text-stone-500">Choose what updates you receive</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <SettingToggle
                    title="Order Updates"
                    description="Notifications about orders and deliveries"
                    checked={settings.notifications?.orderUpdates || false}
                    onChange={() => toggleNotification('orderUpdates')}
                  />
                  <SettingToggle
                    title="Partner Announcements"
                    description="Updates from marketplace partners"
                    checked={settings.notifications?.partnerAnnouncements || false}
                    onChange={() => toggleNotification('partnerAnnouncements')}
                  />
                  <SettingToggle
                    title="Research Briefs"
                    description="Industry insights and case studies"
                    checked={settings.notifications?.researchBriefs || false}
                    onChange={() => toggleNotification('researchBriefs')}
                  />
                  <SettingToggle
                    title="Product Tips"
                    description="Helpful tips and feature announcements"
                    checked={settings.notifications?.productTips || false}
                    onChange={() => toggleNotification('productTips')}
                  />
                  <SettingToggle
                    title="Weekly Digest"
                    description="Summary of your weekly activity"
                    checked={settings.notifications?.weeklyDigest || false}
                    onChange={() => toggleNotification('weeklyDigest')}
                  />
                  <SettingToggle
                    title="SMS Alerts"
                    description="Receive critical alerts via text"
                    checked={settings.notifications?.smsAlerts || false}
                    onChange={() => toggleNotification('smsAlerts')}
                  />

                  <div className="border-t border-stone-100 pt-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-stone-700">Digest Frequency</Label>
                        <select
                          value={settings.notifications?.digestFrequency || 'weekly'}
                          onChange={(e) => updateNotificationPreference('digestFrequency', e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-colors"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-stone-700">Preferred Channel</Label>
                        <select
                          value={settings.notifications?.preferredChannel || 'email'}
                          onChange={(e) => updateNotificationPreference('preferredChannel', e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-colors"
                        >
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="inapp">In-App</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "privacy" && (
            <motion.div
              key="privacy"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900">Privacy Controls</h3>
                    <p className="text-xs text-stone-500">Manage your data and privacy</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <SettingToggle
                    title="Share Profile"
                    description="Allow partners to view your profile"
                    checked={settings.privacy?.shareProfile || false}
                    onChange={() => togglePrivacy('shareProfile')}
                  />
                  <SettingToggle
                    title="Share Analytics"
                    description="Help improve the platform with anonymous data"
                    checked={settings.privacy?.shareAnalytics || false}
                    onChange={() => togglePrivacy('shareAnalytics')}
                  />
                  <SettingToggle
                    title="Retain Data"
                    description="Keep your purchase history for 24 months"
                    checked={settings.privacy?.retainData || false}
                    onChange={() => togglePrivacy('retainData')}
                  />
                  <SettingToggle
                    title="Search Visibility"
                    description="Appear in partner search results"
                    checked={settings.privacy?.searchVisibility || false}
                    onChange={() => togglePrivacy('searchVisibility')}
                  />
                  <SettingToggle
                    title="Profile Indexing"
                    description="Allow search engines to index your profile"
                    checked={settings.privacy?.profileIndexing || false}
                    onChange={() => togglePrivacy('profileIndexing')}
                  />
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h3 className="font-medium text-stone-900">Data Management</h3>
                </div>
                <div className="p-3 space-y-1">
                  <ActionButton icon={Database} label="Download My Data" />
                  <ActionButton icon={Trash2} label="Delete Account" danger />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div
              key="appearance"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Palette className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900">Appearance Settings</h3>
                    <p className="text-xs text-stone-500">Customize how the app looks</p>
                  </div>
                </div>
                <div className="p-5 space-y-6">
                  <div>
                    <Label className="text-stone-700 mb-3 block">Theme</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                      ].map((theme) => {
                        const Icon = theme.icon;
                        const isActive = settings.appearance?.theme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => updateAppearance('theme', theme.id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-300 ${
                              isActive
                                ? 'border-stone-900 bg-stone-50'
                                : 'border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-stone-900' : 'text-stone-500'}`} />
                            <span className={`text-sm font-medium ${isActive ? 'text-stone-900' : 'text-stone-600'}`}>
                              {theme.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-stone-100 pt-5 space-y-4">
                    <SettingToggle
                      title="Compact Mode"
                      description="Reduce spacing for a denser layout"
                      checked={settings.appearance?.compactMode || false}
                      onChange={(checked) => updateAppearance('compactMode', checked)}
                    />
                    <SettingToggle
                      title="Animations"
                      description="Enable smooth transitions and animations"
                      checked={settings.appearance?.animationsEnabled !== false}
                      onChange={(checked) => updateAppearance('animationsEnabled', checked)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Links */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="mt-8 grid gap-3 sm:grid-cols-3"
        >
          <Link to="/account">
            <div className="group flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:shadow-sm transition-all duration-300">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-stone-500" />
                <span className="font-medium text-stone-900">Account Overview</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
            </div>
          </Link>
          <Link to="/faqs">
            <div className="group flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:shadow-sm transition-all duration-300">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-stone-500" />
                <span className="font-medium text-stone-900">Help Center</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
            </div>
          </Link>
          <Link to="/">
            <div className="group flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:shadow-sm transition-all duration-300">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-stone-500" />
                <span className="font-medium text-stone-900">Back to Home</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

function SettingToggle({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-100 hover:border-stone-200 transition-colors">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center">
            <Icon className="w-4 h-4 text-stone-600" />
          </div>
        )}
        <div>
          <p className="font-medium text-stone-900 text-sm">{title}</p>
          <p className="text-xs text-stone-500">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ActionButton({ icon: Icon, label, danger }) {
  return (
    <button className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 transition-colors ${danger ? 'text-stone-600 hover:bg-stone-100' : 'text-stone-700'}`}>
      <span className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-sm font-medium">{label}</span>
      </span>
      <ChevronRight className="w-4 h-4 text-stone-400" />
    </button>
  );
}

export default Settings;
