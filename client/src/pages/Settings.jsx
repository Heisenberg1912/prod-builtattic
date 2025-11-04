import React, { useEffect, useState } from "react";
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
} from "lucide-react";

const SETTINGS_DEFAULTS = {
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
};

const mergeSettingsWithDefaults = (incoming = {}) => ({
  notifications: { ...SETTINGS_DEFAULTS.notifications, ...(incoming.notifications || {}) },
  privacy: { ...SETTINGS_DEFAULTS.privacy, ...(incoming.privacy || {}) },
  security: { ...SETTINGS_DEFAULTS.security, ...(incoming.security || {}) },
});

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
  { id: "orderUpdates", label: "Order & build milestone updates", icon: Bell },
  { id: "partnerAnnouncements", label: "Partner launches & marketplace news", icon: Mail },
  { id: "researchBriefs", label: "Design research briefs & case studies", icon: Mail },
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
    title: "Showcase profile to vendors & firms",
    description: "Allow curated partners to view your professional profile.",
  },
  {
    id: "shareAnalytics",
    title: "Contribute anonymised analytics",
    description: "Help improve Builtattic recommendations. Opt-out anytime.",
  },
  {
    id: "retainData",
    title: "Retain procurement data for 24 months",
    description: "Extend history to match archive timelines.",
  },
];

const SESSION_ICON_MAP = {
  desktop: MonitorSmartphone,
  laptop: Laptop,
  tablet: Tablet,
  mobile: Smartphone,
};

const INITIAL_SESSIONS = [
  {
    id: "current",
    device: "Windows · Chrome",
    browser: "Chrome 121",
    location: "Bengaluru, IN",
    lastActive: "Just now",
    ip: "103.24.56.18",
    current: true,
    icon: "desktop",
  },
  {
    id: "laptop",
    device: "MacBook Pro",
    browser: "Safari 17",
    location: "Mumbai, IN",
    lastActive: "2 days ago",
    ip: "43.89.14.22",
    current: false,
    icon: "laptop",
  },
  {
    id: "tablet",
    device: "iPad Air",
    browser: "Safari iOS",
    location: "Pune, IN",
    lastActive: "Last week",
    ip: "122.178.64.11",
    current: false,
    icon: "tablet",
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authState, setAuthState] = useState(() => readStoredAuth());
  const [userProfile, setUserProfile] = useState(() => readStoredUser());
  const [sessions, setSessions] = useState(() => INITIAL_SESSIONS);
  const [resetSending, setResetSending] = useState(false);
  const [lastResetRequest, setLastResetRequest] = useState(null);

  const isAuthenticated = Boolean(authState?.token);
  const normalizedRole = normalizeRole(authState?.role);
  const dashboardPath = resolveDashboardPath(normalizedRole);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const data = await getSettings();
        if (!isMounted) return;
        setSettings({ ...mergeSettingsWithDefaults(data), hasChanges: false });
        setError("");
      } catch (err) {
        if (!isMounted) return;
        if (err?.fallback) {
          setSettings({ ...mergeSettingsWithDefaults(err.fallback), hasChanges: false });
          setError(err.message);
        } else {
          setError(err?.message || "Unable to load settings");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const clearSuccess = () => setSuccess("");

  const toggleNotification = (id) => {
    clearSuccess();
    setError("");
    setSettings((prev) => {
      if (!prev) return prev;
      const current = Boolean(prev.notifications?.[id]);
      return {
        ...prev,
        notifications: { ...(prev.notifications || {}), [id]: !current },
        hasChanges: true,
      };
    });
  };

  const togglePrivacy = (id) => {
    clearSuccess();
    setError("");
    setSettings((prev) => {
      if (!prev) return prev;
      const current = Boolean(prev.privacy?.[id]);
      return {
        ...prev,
        privacy: { ...(prev.privacy || {}), [id]: !current },
        hasChanges: true,
      };
    });
  };

  const toggleSecurity = (id, nextValue) => {
    clearSuccess();
    setError("");
    setSettings((prev) => {
      if (!prev) return prev;
      const current = Boolean(prev.security?.[id]);
      const resolved = typeof nextValue === "boolean" ? nextValue : !current;
      if (current === resolved) return prev;
      return {
        ...prev,
        security: { ...(prev.security || {}), [id]: resolved },
        hasChanges: true,
      };
    });
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
      const email = userProfile?.email;
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
      'Are you sure you want to request account closure? This exits you from the demo session.',
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

  const handleSave = async () => {
    if (!settings || !settings.hasChanges) {
      return;
    }
    if (!isAuthenticated) {
      toast.error('Sign in to save your settings');
      navigate('/login', { state: { from: '/settings' } });
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    const { notifications, privacy, security } = settings;
    const payload = { notifications, privacy, security };
    try {
      await updateSettings(payload);
      setSettings((prev) => (prev ? { ...prev, hasChanges: false } : prev));
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError(err?.message || 'Unable to update settings');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timeout);
  }, [success]);

  const authError = typeof error === 'string' && error.toLowerCase().includes('sign in');
  const showAuthNotice = !isAuthenticated || authError;

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

  const otherSessions = sessions.filter((session) => !session.current);
  const displayName = userProfile?.name || userProfile?.fullName || 'Guest user';
  const displayEmail = userProfile?.email || 'Not provided';
  const sessionStatus = isAuthenticated ? 'Active session' : 'Signed out';
  const sessionBadgeClass = isAuthenticated
    ? 'inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
    : 'inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col gap-3">
          <p className="uppercase tracking-[0.35em] text-xs text-slate-400">Settings</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Account & privacy controls</h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                Tailor your Builtattic experience with security, notification, and personalization controls.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !settings?.hasChanges || !isAuthenticated}
                title={!isAuthenticated ? 'Sign in to save changes' : undefined}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Settings2 size={16} />
                {saving ? 'Saving.' : 'Save changes'}
              </button>
              {!isAuthenticated && (
                <span className="text-[11px] font-medium text-amber-600">Sign in to sync these updates</span>
              )}
            </div>
          </div>
        </header>

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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{session.device}</p>
                        <p className="text-xs text-slate-500">{session.browser} · {session.ip}</p>
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
                  <div>
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            {notificationChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <label
                  key={channel.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <span className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Icon size={18} />
                    </span>
                    {channel.label}
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
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
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
  );
};

export default Settings;
