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
  Laptop,
  Tablet,
  User,
  Briefcase,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Eye,
  EyeOff,
  Zap,
  Lock,
  Palette,
  Moon,
  Sun,
  Monitor,
  Save,
  X,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";

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
    console.warn("settings_timezone_detect_error", error);
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
      return () => {
        isMounted = false;
      };
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, userHydrationKey]);

  const handleSave = useCallback(
    async ({ silent = false } = {}) => {
      const snapshot = settingsRef.current;
      if (!snapshot || !snapshot.hasChanges) {
        return false;
      }
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
        } else {
          console.warn("settings_autosave_failed", err);
        }
        return false;
      } finally {
        if (!silent) {
          setSaving(false);
        }
      }
    },
    [isAuthenticated, navigate],
  );

  const queueAutoSave = useCallback(() => {
    if (!isAuthenticated) return;
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    setAutoSaveStatus("queued");
    autoSaveTimer.current = window.setTimeout(async () => {
      setAutoSaveStatus("saving");
      const ok = await handleSave({ silent: true });
      setAutoSaveStatus(ok ? "saved" : "error");
      if (ok) {
        window.setTimeout(() => setAutoSaveStatus("idle"), 2000);
      }
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
      if (autoSave) {
        queueAutoSave();
      }
    },
    [queueAutoSave],
  );

  const toggleNotification = (id) => {
    setError("");
    setSuccess("");
    applySettingsUpdate(
      (prev) => {
        if (!prev) return prev;
        const current = Boolean(prev.notifications?.[id]);
        return {
          ...prev,
          notifications: { ...(prev.notifications || {}), [id]: !current },
        };
      },
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
      (prev) => {
        if (!prev) return prev;
        const current = Boolean(prev.privacy?.[id]);
        return {
          ...prev,
          privacy: { ...(prev.privacy || {}), [id]: !current },
        };
      },
      { autoSave: true },
    );
  };

  const toggleSecurity = (id, nextValue) => {
    setError("");
    setSuccess("");
    applySettingsUpdate(
      (prev) => {
        if (!prev) return prev;
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
      console.warn('settings_signout_error', err);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="h-12 w-12 mx-auto border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading your settings...</p>
        </motion.div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={24} />
              Settings Unavailable
            </CardTitle>
            <CardDescription>{error || 'Unable to load settings'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              <LogIn size={16} />
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/90 backdrop-blur-sm p-8 shadow-xl ring-1 ring-slate-100"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-slate-100">
                <AvatarFallback className="bg-gradient-to-br from-slate-900 to-slate-700 text-white text-xl">
                  {profileInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{displayName}</h1>
                <p className="text-sm text-slate-600">{displayEmail}</p>
                <div className="flex items-center gap-2 mt-2">
                  {isAuthenticated ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle2 size={12} className="mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-600">
                      Signed out
                    </Badge>
                  )}
                  {autoSaveStatus === "saving" && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      <RefreshCcw size={12} className="mr-1 animate-spin" />
                      Saving...
                    </Badge>
                  )}
                  {autoSaveStatus === "saved" && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle2 size={12} className="mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {settings?.hasChanges && (
                <Button
                  onClick={() => handleSave()}
                  disabled={saving || !isAuthenticated}
                  size="lg"
                  className="bg-gradient-to-r from-slate-900 to-slate-700"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              )}
              {isAuthenticated ? (
                <Button onClick={handleSignOut} variant="outline">
                  <LogOut size={16} />
                  Sign Out
                </Button>
              ) : (
                <Button onClick={() => navigate('/login')}>
                  <LogIn size={16} />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={20} className="text-red-600" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setError("")}>
                      <X size={16} />
                    </Button>
                  </CardContent>
                </Card>
              )}
              {success && (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                      <p className="text-sm text-emerald-700">{success}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSuccess("")}>
                      <X size={16} />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-white shadow-sm">
              <TabsTrigger value="profile" className="gap-2">
                <User size={16} />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield size={16} />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell size={16} />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2">
                <Eye size={16} />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Palette size={16} />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User size={20} />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Update your profile details and public information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={settings.profile?.fullName || ''}
                          onChange={(e) => updateProfileField('fullName', e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={settings.profile?.email || ''}
                          onChange={(e) => updateProfileField('email', e.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={settings.profile?.phone || ''}
                          onChange={(e) => updateProfileField('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={settings.profile?.location || ''}
                          onChange={(e) => updateProfileField('location', e.target.value)}
                          placeholder="New York, USA"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={settings.profile?.company || ''}
                          onChange={(e) => updateProfileField('company', e.target.value)}
                          placeholder="Acme Corp"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={settings.profile?.jobTitle || ''}
                          onChange={(e) => updateProfileField('jobTitle', e.target.value)}
                          placeholder="Senior Designer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pronouns">Pronouns</Label>
                        <Input
                          id="pronouns"
                          value={settings.profile?.pronouns || ''}
                          onChange={(e) => updateProfileField('pronouns', e.target.value)}
                          placeholder="they/them"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <select
                          id="timezone"
                          value={settings.profile?.timezone || ''}
                          onChange={(e) => updateProfileField('timezone', e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                        >
                          <option value="">Select timezone</option>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={settings.profile?.website || ''}
                        onChange={(e) => updateProfileField('website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        value={settings.profile?.bio || ''}
                        onChange={(e) => updateProfileField('bio', e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock size={20} />
                      Security Settings
                    </CardTitle>
                    <CardDescription>Manage your account security and authentication</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-slate-700" />
                          <Label className="text-base font-semibold">Two-Step Verification</Label>
                        </div>
                        <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
                      </div>
                      <Switch
                        checked={settings.security?.twoStep || false}
                        onCheckedChange={(checked) => {
                          toggleSecurity('twoStep', checked);
                          toast.success(checked ? '2FA enabled' : '2FA disabled');
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Bell size={18} className="text-slate-700" />
                          <Label className="text-base font-semibold">Login Alerts</Label>
                        </div>
                        <p className="text-sm text-slate-600">Get notified of new sign-ins to your account</p>
                      </div>
                      <Switch
                        checked={settings.security?.loginAlerts || false}
                        onCheckedChange={(checked) => toggleSecurity('loginAlerts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <MonitorSmartphone size={18} className="text-slate-700" />
                          <Label className="text-base font-semibold">Device Verification</Label>
                        </div>
                        <p className="text-sm text-slate-600">Require verification for new devices</p>
                      </div>
                      <Switch
                        checked={settings.security?.deviceVerification || false}
                        onCheckedChange={(checked) => toggleSecurity('deviceVerification', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Smartphone size={18} className="text-slate-700" />
                          <Label className="text-base font-semibold">Biometric Unlock</Label>
                        </div>
                        <p className="text-sm text-slate-600">Use Touch ID or Face ID where supported</p>
                      </div>
                      <Switch
                        checked={settings.security?.biometricUnlock || false}
                        onCheckedChange={(checked) => toggleSecurity('biometricUnlock', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Password & Recovery</CardTitle>
                    <CardDescription>Manage your password and account recovery options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-between">
                      Change Password
                      <ChevronRight size={16} />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      Update Recovery Email
                      <ChevronRight size={16} />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      View Active Sessions
                      <ChevronRight size={16} />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell size={20} />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>Choose what updates you want to receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Order Updates</Label>
                        <p className="text-sm text-slate-600">Notifications about your orders and deliveries</p>
                      </div>
                      <Switch
                        checked={settings.notifications?.orderUpdates || false}
                        onCheckedChange={() => toggleNotification('orderUpdates')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Partner Announcements</Label>
                        <p className="text-sm text-slate-600">Updates from marketplace partners and vendors</p>
                      </div>
                      <Switch
                        checked={settings.notifications?.partnerAnnouncements || false}
                        onCheckedChange={() => toggleNotification('partnerAnnouncements')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Research Briefs</Label>
                        <p className="text-sm text-slate-600">Industry insights and case studies</p>
                      </div>
                      <Switch
                        checked={settings.notifications?.researchBriefs || false}
                        onCheckedChange={() => toggleNotification('researchBriefs')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Product Tips</Label>
                        <p className="text-sm text-slate-600">Helpful tips and feature announcements</p>
                      </div>
                      <Switch
                        checked={settings.notifications?.productTips || false}
                        onCheckedChange={() => toggleNotification('productTips')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Weekly Digest</Label>
                        <p className="text-sm text-slate-600">Summary of your weekly activity</p>
                      </div>
                      <Switch
                        checked={settings.notifications?.weeklyDigest || false}
                        onCheckedChange={() => toggleNotification('weeklyDigest')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">SMS Alerts</Label>
                        <p className="text-sm text-slate-600">Receive critical alerts via text message</p>
                      </div>
                      <Switch
                        checked={settings.notifications?.smsAlerts || false}
                        onCheckedChange={() => toggleNotification('smsAlerts')}
                      />
                    </div>

                    <Separator className="my-6" />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Digest Frequency</Label>
                        <select
                          value={settings.notifications?.digestFrequency || 'weekly'}
                          onChange={(e) => updateNotificationPreference('digestFrequency', e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Channel</Label>
                        <select
                          value={settings.notifications?.preferredChannel || 'email'}
                          onChange={(e) => updateNotificationPreference('preferredChannel', e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                        >
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="inapp">In-App</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye size={20} />
                      Privacy Controls
                    </CardTitle>
                    <CardDescription>Manage your data and privacy preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Share Profile</Label>
                        <p className="text-sm text-slate-600">Allow partners to view your profile</p>
                      </div>
                      <Switch
                        checked={settings.privacy?.shareProfile || false}
                        onCheckedChange={() => togglePrivacy('shareProfile')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Share Analytics</Label>
                        <p className="text-sm text-slate-600">Help improve the platform with anonymous data</p>
                      </div>
                      <Switch
                        checked={settings.privacy?.shareAnalytics || false}
                        onCheckedChange={() => togglePrivacy('shareAnalytics')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Retain Data</Label>
                        <p className="text-sm text-slate-600">Keep your purchase history for 24 months</p>
                      </div>
                      <Switch
                        checked={settings.privacy?.retainData || false}
                        onCheckedChange={() => togglePrivacy('retainData')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Search Visibility</Label>
                        <p className="text-sm text-slate-600">Appear in partner search results</p>
                      </div>
                      <Switch
                        checked={settings.privacy?.searchVisibility || false}
                        onCheckedChange={() => togglePrivacy('searchVisibility')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Profile Indexing</Label>
                        <p className="text-sm text-slate-600">Allow search engines to index your profile</p>
                      </div>
                      <Switch
                        checked={settings.privacy?.profileIndexing || false}
                        onCheckedChange={() => togglePrivacy('profileIndexing')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <Trash2 size={20} />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible and destructive actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-between text-slate-700">
                      <span className="flex items-center gap-2">
                        <Database size={16} />
                        Download My Data
                      </span>
                      <ChevronRight size={16} />
                    </Button>
                    <Button variant="destructive" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Trash2 size={16} />
                        Delete Account
                      </span>
                      <ChevronRight size={16} />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette size={20} />
                      Appearance Settings
                    </CardTitle>
                    <CardDescription>Customize how the app looks and feels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Theme</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => updateAppearance('theme', 'light')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                            settings.appearance?.theme === 'light'
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Sun size={24} />
                          <span className="text-sm font-semibold">Light</span>
                        </button>
                        <button
                          onClick={() => updateAppearance('theme', 'dark')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                            settings.appearance?.theme === 'dark'
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Moon size={24} />
                          <span className="text-sm font-semibold">Dark</span>
                        </button>
                        <button
                          onClick={() => updateAppearance('theme', 'system')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                            settings.appearance?.theme === 'system'
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Monitor size={24} />
                          <span className="text-sm font-semibold">System</span>
                        </button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Compact Mode</Label>
                        <p className="text-sm text-slate-600">Reduce spacing for a denser layout</p>
                      </div>
                      <Switch
                        checked={settings.appearance?.compactMode || false}
                        onCheckedChange={(checked) => updateAppearance('compactMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Zap size={18} className="text-slate-700" />
                          <Label className="text-base font-semibold">Animations</Label>
                        </div>
                        <p className="text-sm text-slate-600">Enable smooth transitions and animations</p>
                      </div>
                      <Switch
                        checked={settings.appearance?.animationsEnabled !== false}
                        onCheckedChange={(checked) => updateAppearance('animationsEnabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <Link to="/account">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <User size={20} className="text-slate-700" />
                  <span className="font-semibold">Account Overview</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/faqs">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-slate-700" />
                  <span className="font-semibold">Help Center</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-slate-700" />
                  <span className="font-semibold">Back to Home</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
