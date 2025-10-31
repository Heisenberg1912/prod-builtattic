import React, { useState } from "react";
import {
  Lock,
  Smartphone,
  Shield,
  Bell,
  Mail,
  Globe,
  Palette,
  Languages,
  Database,
  Trash2,
  Settings2,
} from "lucide-react";

const securityItems = [
  {
    title: "Two-step verification",
    description: "Protect sign-ins with OTP or authenticator apps.",
    icon: Shield,
    action: "Manage",
  },
  {
    title: "Login alerts",
    description: "Receive notifications when a new device signs in.",
    icon: Smartphone,
    action: "Configure",
  },
  {
    title: "Password manager",
    description: "Review saved credentials synced across devices.",
    icon: Lock,
    action: "Update",
  },
];

const notificationChannels = [
  { id: "orderUpdates", label: "Order & build milestone updates", icon: Bell },
  { id: "partnerAnnouncements", label: "Partner launches & marketplace news", icon: Mail },
  { id: "researchBriefs", label: "Design research briefs & case studies", icon: Mail },
];

const regionalPreferences = [
  {
    title: "Default marketplace region",
    description: "Region impacts currency, codes, and recommended firms.",
    icon: Globe,
    value: "India (IN)",
  },
  {
    title: "Preferred language",
    description: "Switch content language across dashboards.",
    icon: Languages,
    value: "English",
  },
  {
    title: "Theme & density",
    description: "Align interface density with your workflow pace.",
    icon: Palette,
    value: "Adaptive dashboard",
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

const Settings = () => {
  const [notificationPrefs, setNotificationPrefs] = useState(() =>
    notificationChannels.reduce((acc, channel) => {
      acc[channel.id] = true;
      return acc;
    }, {}),
  );
  const [privacyPrefs, setPrivacyPrefs] = useState(() =>
    privacyControls.reduce((acc, item) => {
      acc[item.id] = true;
      return acc;
    }, {}),
  );

  const toggleNotification = (id) => {
    setNotificationPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePrivacy = (id) => {
    setPrivacyPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col gap-3">
          <p className="uppercase tracking-[0.35em] text-xs text-slate-400">Settings</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Account & privacy controls</h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                Tailor your Builtattic experience with security, notification, and
                personalization controls designed for design studios and procurement.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 transition"
            >
              <Settings2 size={16} />
              Restore defaults
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Sign-in & security</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {securityItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="self-start rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    {item.action}
                  </button>
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
                    checked={notificationPrefs[channel.id]}
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
            <h2 className="text-lg font-semibold text-slate-900">Regional preferences</h2>
            <p className="text-sm text-slate-600">
              Align storefronts, catalogues, and billing with your geography.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {regionalPreferences.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="self-start rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    {item.value}
                  </button>
                </div>
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
                  checked={privacyPrefs[item.id]}
                  onChange={() => togglePrivacy(item.id)}
                  className="mt-2 h-5 w-5 accent-slate-900"
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
            >
              <Trash2 size={14} />
              Close account
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
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
