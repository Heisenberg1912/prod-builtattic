import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getSettings, updateSettings } from "../services/settings.js";
import {
  readStoredAuth,
  readStoredUser,
  logout as performLogout,
  requestPasswordReset,
} from "../services/auth.js";
import { normalizeRole, resolveDashboardPath } from "../constants/roles.js";
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
} from "lucide-react";

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

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile & identity" },
  { id: "sessions", label: "Sessions" },
  { id: "workspace", label: "Contributor workspaces" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "shortcuts", label: "Workspace shortcuts" },
  { id: "privacy", label: "Privacy & data" },
];

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

const PROFILE_CONTACT_FIELDS = [
  { id: "fullName", label: "Full name", placeholder: "Aanya Sharma", autoComplete: "name" },
  { id: "email", label: "Contact email", placeholder: "you@builtattic.com", autoComplete: "email" },
  { id: "phone", label: "Mobile number", placeholder: "+91 98765 43210", autoComplete: "tel" },
  { id: "location", label: "City / Region", placeholder: "Bengaluru, India", autoComplete: "address-level2" },
];

const PROFILE_WORK_FIELDS = [
  { id: "company", label: "Studio / Company", placeholder: "Builtattic Studio" },
  { id: "jobTitle", label: "Role", placeholder: "Design Lead" },
  { id: "pronouns", label: "Pronouns", placeholder: "She / Her" },
  { id: "timezone", label: "Timezone", type: "select" },
];

const PROFILE_PUBLIC_FIELDS = [
  { id: "website", label: "Portfolio link", placeholder: "https://builtattic.com/yourstudio" },
  { id: "bio", label: "Public bio", type: "textarea", placeholder: "Describe your focus areas, specialties, or workstyle." },
];

const mergeSettingsWithDefaults = (incoming = {}) => ({
  notifications: { ...SETTINGS_DEFAULTS.notifications, ...(incoming.notifications || {}) },
  privacy: { ...SETTINGS_DEFAULTS.privacy, ...(incoming.privacy || {}) },
  security: { ...SETTINGS_DEFAULTS.security, ...(incoming.security || {}) },
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

const TRUSTED_SESSIONS_KEY = "builtattic_trusted_sessions";

const readTrustedSessions = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRUSTED_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn("trusted_session_storage_error", error);
    return {};
  }
};

const detectCurrentSession = () => {
  if (typeof window === "undefined") return null;
  try {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const isTablet = /iPad|Tablet/i.test(ua);
    const isMobile = /Mobi|Android/i.test(ua) && !isTablet;
    let icon = "desktop";
    if (isTablet) icon = "tablet";
    else if (isMobile) icon = "mobile";
    else if (/Mac|Win|Linux/i.test(platform)) icon = "laptop";
    const browserMatch = ua.match(/(Chrome|Safari|Firefox|Edge)\/([0-9.]+)/i);
    const browser = browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : "Current browser";
    const location = detectTimezone().replace("_", " ");
    return {
      id: "current",
      device: isMobile ? "Mobile device" : isTablet ? "Tablet" : "This browser",
      browser,
      location,
      lastActive: "Just now",
      ip: "Private network",
      current: true,
      icon,
      trusted: true,
    };
  } catch (error) {
    console.warn("settings_session_detect_error", error);
    return null;
  }
};

const buildInitialSessions = () => {
  const trustMap = readTrustedSessions();
  const current = detectCurrentSession();
  const seeded = INITIAL_SESSIONS.map((session) => ({
    ...session,
    trusted: trustMap[session.id] ?? session.trusted ?? false,
  }));
  if (current) {
    const existingIndex = seeded.findIndex((session) => session.id === "current");
    if (existingIndex >= 0) {
      seeded[existingIndex] = { ...seeded[existingIndex], ...current };
    } else {
      seeded.unshift(current);
    }
  }
  return seeded;
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

const SECURITY_CONTROLS = [
  {
    id: "twoStep",
    title: "Two-step verification",
    description: "Protect sign-ins with OTP or authenticator apps.",
    icon: Shield,
    type: "toggle",
    enabledLabel: "Enabled",
    disabledLabel: "Disabled",
    successMessage: (enabled) =>
      enabled ? "Two-step verification enabled." : "Two-step verification disabled.",
  },
  {
    id: "deviceVerification",
    title: "Device verification",
    description: "Ask for a confirmation link the first time a device signs in.",
    icon: ShieldCheck,
    type: "toggle",
    enabledLabel: "Required",
    disabledLabel: "Off",
    successMessage: (enabled) =>
      enabled ? "New devices will require verification." : "Device verification paused.",
  },
  {
    id: "biometricUnlock",
    title: "Biometric unlock",
    description: "Allow Touch ID / Face ID where supported.",
    icon: Smartphone,
    type: "toggle",
    enabledLabel: "Allowed",
    disabledLabel: "Off",
    successMessage: (enabled) =>
      enabled ? "Biometric prompts enabled." : "Biometric prompts disabled.",
  },
  {
    id: "loginAlerts",
    title: "Login alerts",
    description: "Receive notifications when a new device signs in.",
    icon: Smartphone,
    type: "toggle",
    enabledLabel: "Active",
    disabledLabel: "Muted",
    successMessage: (enabled) =>
      enabled ? "Login alerts activated." : "Login alerts paused.",
  },
  {
    id: "passwordReset",
    title: "Forgot password",
    description: "Send yourself a reset link without leaving settings.",
    icon: Mail,
    type: "action",
    actionLabel: "Send reset link",
  },
];

const notificationChannels = [
  {
    id: "orderUpdates",
    label: "Order & project milestones",
    description: "Approvals, deliveries, and build blockers.",
    icon: Bell,
  },
  {
    id: "partnerAnnouncements",
    label: "Marketplace news",
    description: "Launches, price changes, and curated drops.",
    icon: Mail,
  },
  {
    id: "researchBriefs",
    label: "Research briefs",
    description: "Case studies and benchmarks.",
    icon: Mail,
  },
  {
    id: "productTips",
    label: "Workflow tips",
    description: "Feature walkthroughs sent monthly.",
    icon: Mail,
  },
  {
    id: "smsAlerts",
    label: "Critical SMS alerts",
    description: "Escalations for active jobs.",
    icon: Smartphone,
  },
];

const digestOptions = [
  { value: "daily", label: "Daily summary", helper: "Great for active builds" },
  { value: "weekly", label: "Weekly recap", helper: "Default" },
  { value: "monthly", label: "Monthly digest", helper: "For occasional check-ins" },
];

const preferredChannelOptions = [
  { value: "email", label: "Email", helper: "Detailed updates" },
  { value: "sms", label: "SMS", helper: "Only critical alerts" },
  { value: "inapp", label: "In-app", helper: "Inbox inside dashboard" },
];

const workspaceCards = [
  {
    title: "Associate workspace access",
    description:
      "Update your associate profile, availability, and portfolio documents through the secure workspace.",
    primary: { label: "Open associate portal", to: "/associates/portal" },
    secondary: { label: "Request access", to: "/register?role=associate" },
  },
  {
    title: "Studio workspace access",
    description:
      "Submit new studios, refresh imagery, and manage your catalogue before it goes live.",
    primary: { label: "Open studio portal", to: "/studio/portal" },
    secondary: { label: "Request access", to: "/register?role=firm" },
  },
];

const privacyControls = [
  {
    id: "shareProfile",
    title: "Showcase profile to vendors & studios",
    description: "Allow curated partners to view your profile when you collaborate.",
  },
  {
    id: "shareAnalytics",
    title: "Contribute anonymised analytics",
    description: "Help refine marketplace recommendations. Opt-out anytime.",
  },
  {
    id: "retainData",
    title: "Retain procurement data for 24 months",
    description: "Extend export history to match audit requirements.",
  },
  {
    id: "searchVisibility",
    title: "Enable search visibility",
    description: "Allow your public card to appear in partner search results.",
  },
  {
    id: "profileIndexing",
    title: "Index profile on web",
    description: "Permit Builtattic landing pages to reference your workspace.",
  },
];

const SESSION_ICON_MAP = {
  desktop: MonitorSmartphone,
  laptop: Laptop,
  tablet: Tablet,
  mobile: Smartphone,
};

const INITIAL_SESSIONS = [];

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authState, setAuthState] = useState(() => readStoredAuth());
  const [userProfile, setUserProfile] = useState(() => readStoredUser());
  const [sessions, setSessions] = useState(() => buildInitialSessions());
  const [resetSending, setResetSending] = useState(false);
  const [lastResetRequest, setLastResetRequest] = useState(null);
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
  const normalizedRole = normalizeRole(authState?.role);
  const dashboardPath = resolveDashboardPath(normalizedRole);

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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const refreshAuth = () => {
      const snapshot = readStoredAuth();
      setAuthState(snapshot);
      setUserProfile(readStoredUser());
      if (snapshot.token) {
        setError((prev) => {
          if (typeof prev === "string" && prev.toLowerCase().includes("sign in")) {
            return "";
          }
          return prev;
        });
      }
    };
    window.addEventListener("storage", refreshAuth);
    window.addEventListener("auth:login", refreshAuth);
    window.addEventListener("auth:logout", refreshAuth);
    refreshAuth();
    return () => {
      window.removeEventListener("storage", refreshAuth);
      window.removeEventListener("auth:login", refreshAuth);
      window.removeEventListener("auth:logout", refreshAuth);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const trustPayload = sessions.reduce((acc, session) => {
        acc[session.id] = Boolean(session.trusted);
        return acc;
      }, {});
      window.localStorage.setItem(TRUSTED_SESSIONS_KEY, JSON.stringify(trustPayload));
    } catch (storageError) {
      console.warn("trusted_session_persist_error", storageError);
    }
  }, [sessions]);

  const clearSuccess = () => setSuccess("");

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
        profile: snapshot.profile,
      };
      try {
        await updateSettings(payload);
        setSettings((prev) => (prev ? { ...prev, hasChanges: false } : prev));
        if (!silent) {
          setSuccess("Settings updated successfully");
        }
        return true;
      } catch (err) {
        if (!silent) {
          setError(err?.message || "Unable to update settings");
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
    clearSuccess();
    setError("");
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
    clearSuccess();
    setError("");
    applySettingsUpdate(
      (prev) => ({
        ...prev,
        notifications: { ...(prev.notifications || {}), [key]: value },
      }),
      { autoSave: true },
    );
  };

  const togglePrivacy = (id) => {
    clearSuccess();
    setError("");
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
    clearSuccess();
    setError("");
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
    clearSuccess();
    setError("");
    applySettingsUpdate((prev) => ({
      ...prev,
      profile: { ...(prev.profile || {}), [field]: value },
    }));
  };

  const handleSecurityAction = async (control) => {
    if (!control || !settings) return;
    clearSuccess();
    setError("");

    if (control.type === "toggle") {
      if (!isAuthenticated) {
        toast.error("Sign in to update security settings");
        return;
      }
      const current = Boolean(settings.security?.[control.id]);
      const nextValue = !current;
      toggleSecurity(control.id, nextValue);
      if (typeof control.successMessage === "function") {
        toast.success(control.successMessage(nextValue));
      }
      return;
    }

    if (control.type === "action") {
      if (!isAuthenticated) {
        toast.error("Sign in to manage password recovery");
        return;
      }
      if (resetSending) return;
      const email = settings.profile?.email || userProfile?.email;
      if (!email) {
        toast.error("Add an email address in your profile to receive reset links");
        return;
      }
      try {
        setResetSending(true);
        await requestPasswordReset(email);
        const timestamp = new Date().toISOString();
        setLastResetRequest(timestamp);
        toast.success(`Reset link sent to ${email}`);
      } catch (err) {
        toast.error(err?.message || "Unable to send reset link");
      } finally {
        setResetSending(false);
      }
    }
  };

  const handleSignIn = () => {
    navigate('/login', { state: { from: '/settings' } });
  };

  const handleSignOut = async () => {
    try {
      await performLogout({ silent: true });
      toast.success('Signed out');
    } catch (err) {
      console.warn('settings_signout_error', err);
      toast.error('Unable to sign out completely, please try again.');
    } finally {
      const snapshot = readStoredAuth();
      setAuthState(snapshot);
      setUserProfile(readStoredUser());
      setError('You are signed out. Sign in to sync your settings.');
      setSuccess('');
      setSettings((prev) => (prev ? { ...prev, hasChanges: false } : prev));
    }
  };

  const handleSessionRevoke = (sessionId) => {
    setSessions((prev) => prev.filter((session) => session.id === 'current' || session.id !== sessionId));
    toast.success('Session signed out');
  };

  const handleSessionTrustToggle = (sessionId) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              trusted: !session.trusted,
            }
          : session,
      ),
    );
  };

  const handleSignOutAllSessions = () => {
    const otherSessions = sessions.filter((session) => !session.current);
    if (!otherSessions.length) return;
    setSessions((prev) => prev.filter((session) => session.current));
    toast.success('Signed out of other sessions');
  };

  const handleDownloadArchive = () => {
    if (!settings) return;
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        settings: {
          notifications: settings.notifications,
          privacy: settings.privacy,
          security: settings.security,
          profile: settings.profile,
        },
        sessions,
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `builtattic-settings-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Settings archive downloaded');
    } catch (downloadError) {
      console.error('settings_archive_error', downloadError);
      toast.error('Unable to download archive right now');
    }
  };

  const handleAccountClosure = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to manage account closure');
      return;
    }
    const confirmed = window.confirm(
      'Are you sure you want to request account closure? This signs you out across devices.',
    );
    if (!confirmed) return;
    try {
      await performLogout({ silent: true });
    } catch (error) {
      console.warn('account_closure_logout_error', error);
    } finally {
      toast.success('Account closure request noted. Our team will follow up.');
      navigate('/login', { replace: true });
    }
  };

  const handleProfileSync = () => {
    if (!settings || !userProfile) return;
    const mapping = {
      fullName: userProfile.name || userProfile.fullName,
      email: userProfile.email,
      phone: userProfile.phone,
      company: userProfile.company || userProfile.organization || userProfile.orgName,
      jobTitle: userProfile.title || userProfile.role,
    };
    const nextProfile = { ...(settings.profile || {}) };
    let mutated = false;
    Object.entries(mapping).forEach(([key, value]) => {
      if (!value) return;
      if (nextProfile[key] === value) return;
      nextProfile[key] = value;
      mutated = true;
    });
    if (!nextProfile.timezone) {
      nextProfile.timezone = detectTimezone();
      mutated = true;
    }
    if (!mutated) {
      toast('Profile details already synced');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      profile: nextProfile,
      hasChanges: true,
    }));
    toast.success('Profile details synced from your account');
  };

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timeout);
  }, [success]);

  const profileCompletion = useMemo(() => {
    const source = settings?.profile;
    if (!source) return 0;
    const fields = ['fullName', 'company', 'location', 'phone', 'website', 'bio'];
    const filled = fields.filter((field) => {
      const value = source[field];
      return typeof value === 'string' && value.trim().length > 0;
    }).length;
    return Math.round((filled / fields.length) * 100);
  }, [settings?.profile]);

  const displayName = settings?.profile?.fullName || userProfile?.name || 'Guest user';
  const profileInitials = useMemo(() => {
    const source = settings?.profile?.fullName || displayName || 'Builtattic';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'BA';
  }, [settings?.profile?.fullName, displayName]);

  const workspaceShortcuts = useMemo(
    () => [
      {
        title: 'Open my dashboard',
        description: `Jump back into your ${normalizedRole} workspace`,
        to: dashboardPath,
      },
      {
        title: 'Switch portal',
        description: 'Choose a different dashboard or role',
        to: '/login',
      },
      {
        title: 'Contact support',
        description: 'Escalate billing, compliance, or access issues',
        href: 'mailto:support@builtattic.com',
      },
    ],
    [dashboardPath, normalizedRole],
  );

  const authError = typeof error === 'string' && error.toLowerCase().includes('sign in');
  const showAuthNotice = !isAuthenticated || authError;

  const otherSessions = sessions.filter((session) => !session.current);
  const emailDisplay = settings?.profile?.email || userProfile?.email || 'Not provided';
  const autoSaveMessageMap = {
    queued: 'Auto-save queued',
    saving: 'Saving changes...',
    saved: 'All changes synced',
    error: 'Auto-save unavailable',
  };
  const autoSaveMessage = autoSaveMessageMap[autoSaveStatus] || 'Auto-save idle';

  const handleSectionNav = useCallback((sectionId) => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  const insightCards = useMemo(
    () => [
      {
        id: 'profile',
        title: 'Profile quality',
        value: `${profileCompletion}%`,
        helper: emailDisplay,
        tone: profileCompletion >= 80 ? 'good' : profileCompletion >= 40 ? 'warn' : 'neutral',
        target: 'profile',
      },
      {
        id: 'security',
        title: 'Security posture',
        value: settings?.security?.twoStep ? '2-step on' : '2-step off',
        helper: isAuthenticated ? 'Protect your sign-ins' : 'Sign in to secure',
        tone: settings?.security?.twoStep ? 'good' : 'warn',
        target: 'security',
      },
      {
        id: 'sync',
        title: 'Sync & backup',
        value: autoSaveMessage,
        helper: settings?.hasChanges ? 'Unsaved edits present' : 'Everything is synced',
        tone: settings?.hasChanges ? 'warn' : 'good',
        target: 'notifications',
      },
    ],
    [autoSaveMessage, emailDisplay, isAuthenticated, profileCompletion, settings?.hasChanges, settings?.profile?.email, settings?.security?.twoStep],
  );
  const quickActionChips = useMemo(
    () => [
      {
        id: 'save',
        label: 'Save changes',
        helper: settings?.hasChanges ? 'Apply updates now' : 'Everything is synced',
        icon: Settings2,
        onClick: () => handleSave(),
        disabled: saving || !settings?.hasChanges || !isAuthenticated,
        tone: 'primary',
      },
      {
        id: 'sync',
        label: 'Sync profile',
        helper: 'Pull latest account data',
        icon: RefreshCcw,
        onClick: handleProfileSync,
        disabled: saving,
      },
      {
        id: 'download',
        label: 'Download archive',
        helper: 'Export your preferences',
        icon: Database,
        onClick: handleDownloadArchive,
      },
      {
        id: 'privacy',
        label: 'Privacy review',
        helper: 'Jump to privacy controls',
        icon: Shield,
        onClick: () => handleSectionNav('privacy'),
      },
      isAuthenticated
        ? {
            id: 'signout',
            label: 'Sign out',
            helper: 'End this session',
            icon: LogOut,
            onClick: handleSignOut,
          }
        : {
            id: 'signin',
            label: 'Sign in',
            helper: 'Sync changes across devices',
            icon: LogIn,
            onClick: handleSignIn,
          },
    ],
    [handleProfileSync, handleSectionNav, handleSignIn, handleSignOut, handleSave, isAuthenticated, saving, settings?.hasChanges],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading your settings.
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700 space-y-3 text-center max-w-sm">
          <p>{error || 'Settings unavailable'}</p>
          {showAuthNotice && (
            <button
              type="button"
              onClick={handleSignIn}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-slate-800"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayEmail = emailDisplay;
  const sessionStatus = isAuthenticated ? 'Active session' : 'Signed out';
  const sessionBadgeClass = isAuthenticated
    ? 'inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
    : 'inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-10 lg:px-12 space-y-8">
        <section className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-100 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Account control</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Design your workspace</h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                Tailor Builtattic notifications, privacy, and security to match how your studio operates.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Go to {normalizedRole} dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleProfileSync}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Sync profile
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Sign in to sync
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Profile completeness</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Public signals</span>
                <span className="font-semibold">{profileCompletion}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white">
                <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{displayEmail}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Session health</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{sessions.length} devices</p>
              <p className="text-xs text-slate-500">
                {otherSessions.length
                  ? `${otherSessions.length} other device${otherSessions.length === 1 ? "" : "s"} signed in`
                  : "Only this browser is active"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sync status</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{autoSaveMessage}</p>
              <p className="text-xs text-slate-500">
                {settings.hasChanges ? "Unsaved edits detected" : "All sections synced"}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {quickActionChips.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`group flex h-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
                    action.tone === 'primary'
                      ? 'border-slate-900/80 bg-slate-900 text-white hover:bg-slate-800'
                      : 'border-slate-100 bg-slate-50/70 hover:border-slate-200'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        action.tone === 'primary' ? 'bg-white/10 text-white' : 'bg-slate-900 text-white'
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 group-disabled:opacity-70">
                      {action.disabled ? 'Waiting' : 'Ready'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p
                      className={`text-sm font-semibold ${
                        action.tone === 'primary' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {action.label}
                    </p>
                    <p
                      className={`text-xs leading-relaxed ${
                        action.tone === 'primary' ? 'text-white/80' : 'text-slate-600'
                      }`}
                    >
                      {action.helper}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {insightCards.map((card) => {
              const tone =
                card.tone === 'good'
                  ? { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' }
                  : card.tone === 'warn'
                  ? { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' }
                  : { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleSectionNav(card.target)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                  <div className="flex w-full items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.badge}`}>{card.value}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.helper}</p>
                </button>
              );
            })}
          </div>
        </section>
        <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-72 lg:flex-none">
          <div className="sticky top-4 space-y-6 rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-md backdrop-blur">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Control center</p>
              <p className="mt-1 text-sm text-slate-500">
                Jump between sections or use the shortcuts to keep your account healthy.
              </p>
            </div>
            <nav className="space-y-1">
              {SETTINGS_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionNav(section.id)}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  {section.label}
                </button>
              ))}
            </nav>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving || !settings?.hasChanges || !isAuthenticated}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Settings2 size={16} />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              {autoSaveStatus !== 'idle' && (
                <p className="text-center text-[11px] font-medium text-slate-500">{autoSaveMessage}</p>
              )}
              {!isAuthenticated && (
                <p className="text-center text-[11px] font-medium text-amber-600">Sign in to sync updates</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-900">Need help?</p>
              <p className="text-xs text-slate-600">Review FAQs or drop a note to the concierge team.</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/faqs"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  View FAQs
                </Link>
                <a
                  href="mailto:support@builtattic.com"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Email support
                </a>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Navigate</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SETTINGS_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionNav(section.id)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {(error || success) && (
            <div className="space-y-3">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
              )}
            </div>
          )}

        <section id="profile" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-semibold">
                {profileInitials}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
                <p className="text-sm text-slate-600">{displayEmail}</p>
                <span className={`${sessionBadgeClass} mt-2 inline-flex`}>
                  <Shield size={14} />
                  {sessionStatus}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm w-full max-w-sm">
              <div className="flex items-center justify-between gap-8">
                <span className="text-slate-500">Profile completeness</span>
                <span className="font-semibold">{profileCompletion}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${profileCompletion}%` }} />
              </div>
              <button
                type="button"
                onClick={handleProfileSync}
                className="self-end text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Sync from account
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                <User size={16} />
                Contact details
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {PROFILE_CONTACT_FIELDS.map((field) => (
                  <label key={field.id} className="text-xs font-medium text-slate-600 space-y-1">
                    {field.label}
                    <input
                      type="text"
                      value={settings.profile?.[field.id] || ''}
                      onChange={(event) => updateProfileField(field.id, event.target.value)}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                <Briefcase size={16} />
                Workspace identity
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {PROFILE_WORK_FIELDS.map((field) => (
                  <label key={field.id} className="text-xs font-medium text-slate-600 space-y-1">
                    {field.label}
                    {field.type === 'select' ? (
                      <select
                        value={settings.profile?.timezone || ''}
                        onChange={(event) => updateProfileField('timezone', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      >
                        <option value="">Select timezone</option>
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={settings.profile?.[field.id] || ''}
                        onChange={(event) => updateProfileField(field.id, event.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {PROFILE_PUBLIC_FIELDS.map((field) => (
              <label key={field.id} className="text-xs font-medium text-slate-600 space-y-1">
                {field.label}
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={settings.profile?.[field.id] || ''}
                    onChange={(event) => updateProfileField(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={settings.profile?.[field.id] || ''}
                    onChange={(event) => updateProfileField(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                )}
              </label>
            ))}
          </div>
        </section>

        <section id="sessions" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Account session</h2>
              <p className="text-sm text-slate-600">Manage how you access Builtattic across devices.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Open dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
                >
                  <LogIn size={16} />
                  Sign in
                </button>
              )}
            </div>
          </div>
          <dl className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Status</dt>
              <dd><span className={sessionBadgeClass}>{sessionStatus}</span></dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Signed in as</dt>
              <dd className="font-semibold text-slate-900">{displayName}</dd>
              <dd className="text-xs text-slate-600">{displayEmail}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sessions</dt>
              <dd className="font-semibold text-slate-900">{sessions.length} active</dd>
              {otherSessions.length > 0 && (
                <dd className="text-xs text-slate-500">{otherSessions.length} other device(s) signed in</dd>
              )}
            </div>
          </dl>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Keep an eye on unusual logins and sign out instantly from devices you no longer use.
            </p>
            <button
              type="button"
              onClick={handleSignOutAllSessions}
              disabled={!otherSessions.length}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign out other sessions
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sessions.map((session) => {
              const Icon = SESSION_ICON_MAP[session.icon] || MonitorSmartphone;
              return (
                <div
                  key={session.id}
                  className={`rounded-xl border p-4 space-y-3 ${
                    session.current ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{session.device}</p>
                        <p className="text-xs text-slate-500">{session.browser} · {session.ip || 'Private'}</p>
                      </div>
                    </div>
                    {session.current && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                        This device
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
                    <span>Last active: {session.lastActive}</span>
                    <span>{session.location}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!session.current && (
                      <button
                        type="button"
                        onClick={() => handleSessionTrustToggle(session.id)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          session.trusted ? 'border-emerald-200 text-emerald-700' : 'border-slate-300 text-slate-700'
                        }`}
                      >
                        {session.trusted ? 'Trusted device' : 'Trust this device'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSessionRevoke(session.id)}
                      disabled={session.current}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {session.current ? 'Current session' : 'Sign out'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="workspace" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Contributor workspaces</h2>
            <p className="text-sm text-slate-600">
              Manage your marketplace presence through the dedicated associate and studio portals.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {workspaceCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{card.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={card.primary.to}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    {card.primary.label}
                  </Link>
                  <Link
                    to={card.secondary.to}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {card.secondary.label}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Sign-in & security</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {SECURITY_CONTROLS.map((control) => {
              const Icon = control.icon;
              const isToggle = control.type === 'toggle';
              const isAction = control.type === 'action';
              const isEnabled = isToggle ? Boolean(settings.security?.[control.id]) : false;

              const statusLabel = isAction
                ? lastResetRequest
                  ? `Last sent ${new Date(lastResetRequest).toLocaleString()}`
                  : 'No reset requested'
                : isEnabled
                ? control.enabledLabel || 'Enabled'
                : control.disabledLabel || 'Disabled';

              const statusClass = isAction
                ? lastResetRequest
                  ? 'inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700'
                  : 'inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600'
                : isEnabled
                ? 'inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700'
                : 'inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600';

              const buttonDisabled = isAction
                ? resetSending || !isAuthenticated
                : !isAuthenticated;

              const buttonLabel = isAction
                ? resetSending
                  ? 'Sending...'
                  : control.actionLabel || 'Send reset link'
                : isEnabled
                ? 'Disable'
                : 'Enable';

              return (
                <div
                  key={control.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{control.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{control.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={statusClass}>{statusLabel}</span>
                    <button
                      type="button"
                      onClick={() => handleSecurityAction(control)}
                      disabled={buttonDisabled}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {buttonLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="notifications" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-600">Decide what you hear about and set your cadence.</p>
          </div>
          <div className="space-y-3">
            {notificationChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <label
                  key={channel.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <span className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="block font-semibold text-slate-900">{channel.label}</span>
                      <span className="text-xs text-slate-500">{channel.description}</span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean((settings.notifications || {})[channel.id])}
                    onChange={() => toggleNotification(channel.id)}
                    className="h-5 w-5 accent-slate-900"
                  />
                </label>
              );
            })}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Digest frequency</p>
              <p className="text-xs text-slate-500 mb-3">Bundle non-critical updates into a single email.</p>
              <select
                value={settings.notifications?.digestFrequency || 'weekly'}
                onChange={(event) => updateNotificationPreference('digestFrequency', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                {digestOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                {digestOptions.find((option) => option.value === settings.notifications?.digestFrequency)?.helper}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Preferred channel</p>
              <p className="text-xs text-slate-500 mb-3">We prioritise this channel for urgent sends.</p>
              <div className="space-y-2">
                {preferredChannelOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="preferredChannel"
                      value={option.value}
                      checked={(settings.notifications?.preferredChannel || 'email') === option.value}
                      onChange={() => updateNotificationPreference('preferredChannel', option.value)}
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">{option.label}</span>
                      <span className="text-xs text-slate-500">{option.helper}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="shortcuts" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Workspace shortcuts</h2>
            <p className="text-sm text-slate-600">Quickly jump into the right dashboard or get help.</p>
          </div>
          <div className="space-y-3">
            {workspaceShortcuts.map((shortcut) => (
              <div
                key={shortcut.title}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{shortcut.title}</p>
                  <p className="text-xs text-slate-500">{shortcut.description}</p>
                </div>
                {shortcut.href ? (
                  <a href={shortcut.href} className="text-xs font-semibold text-slate-900 underline-offset-2 hover:underline">
                    Open
                  </a>
                ) : (
                  <Link to={shortcut.to} className="text-xs font-semibold text-slate-900 underline-offset-2 hover:underline">
                    Open
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="privacy" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Data & privacy</h2>
          </div>
          <div className="space-y-3">
            {privacyControls.map((item) => (
              <label
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"
              >
                <span className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900 block">{item.title}</span>
                  <span className="text-xs text-slate-600 leading-relaxed">{item.description}</span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean((settings.privacy || {})[item.id])}
                  onChange={() => togglePrivacy(item.id)}
                  className="mt-2 h-5 w-5 accent-slate-900"
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleAccountClosure}
              disabled={!isAuthenticated}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={14} />
              Close account
            </button>
            <button
              type="button"
              onClick={handleDownloadArchive}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Database size={14} />
              Download data archive
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</div>
  );
};

export default Settings;
