import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCcw, ExternalLink, ArrowLeft } from "lucide-react";
import AssociateProfileEditor from "../../components/associate/AssociateProfileEditor.jsx";
import PortfolioMediaPlayer from "../../components/associate/PortfolioMediaPlayer.jsx";
import { fetchAssociatePortalProfile } from "../../services/portal.js";
import { fetchAssociateDashboard } from "../../services/dashboard.js";
import { deriveProfileStats, formatCurrency } from "../../utils/associateProfile.js";
import { getAssociateAvatar, getAssociateFallback } from "../../utils/imageFallbacks.js";

const PROFILE_FIELD_LABELS = {
  title: "Headline",
  summary: "Bio",
  location: "Location",
  availability: "Availability note",
  timezone: "Timezone",
  experienceYears: "Years of experience",
  completedProjects: "Projects delivered",
  "rates.hourly": "Hourly rate",
  "rates.daily": "Daily rate",
  languages: "Languages",
  softwares: "Software stack",
  specialisations: "Specialisations",
  certifications: "Certifications",
  portfolioLinks: "Portfolio links",
  keyProjects: "Key projects",
  contactEmail: "Public contact email",
};

const getValueByPath = (object, path) =>
  path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), object);

const computeCompleteness = (profile) => {
  if (!profile) {
    return {
      percent: 0,
      filled: [],
      missing: Object.values(PROFILE_FIELD_LABELS),
      updatedAt: null,
    };
  }

  const entries = Object.entries(PROFILE_FIELD_LABELS);
  const filled = [];
  const missing = [];

  entries.forEach(([path, label]) => {
    const value = getValueByPath(profile, path);
    const hasValue =
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === "number" && Number.isFinite(value)) ||
      (typeof value === "string" && value.trim().length > 0);
    if (hasValue) filled.push(label);
    else missing.push(label);
  });

  const percent = Math.round((filled.length / entries.length) * 100);
  const updatedAt = profile.updatedAt || profile.createdAt || null;

  return {
    percent: Number.isFinite(percent) ? Math.min(Math.max(percent, 0), 100) : 0,
    filled,
    missing,
    updatedAt,
  };
};

const PreviewSnapshot = ({ profile, stats, featuredPlan }) => {
  const heroImage =
    featuredPlan?.renderImages?.[0] ||
    profile?.heroImage ||
    profile?.coverImage ||
    getAssociateAvatar(profile) ||
    getAssociateFallback(profile);
  const summary =
    featuredPlan?.description || profile?.summary || "Add a short bio to highlight your expertise.";
  const rateLabel = stats.hourly
    ? formatCurrency(stats.hourly, profile?.rates?.currency || "USD")
    : "Set hourly rate";
  const experienceLabel = stats.years ? `${stats.years} yrs` : "Add experience";
  const chips = (featuredPlan?.tags || profile?.specialisations || []).slice(0, 3);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-40 overflow-hidden">
        <img
          src={heroImage}
          alt="Marketplace hero"
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = getAssociateFallback(profile);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Associate</p>
            <h3 className="text-xl font-semibold text-slate-900">{profile?.title || "Add a headline"}</h3>
            <p className="text-xs text-slate-500">
              {profile?.location || "Add location"} - {profile?.availability || "Set availability"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-amber-500">{(profile?.rating || 4.7).toFixed(1)}</p>
            <p className="text-xs text-slate-500">Avg rating</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 line-clamp-4">{summary}</p>
        <div className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Rate</p>
            <p className="text-sm font-semibold text-slate-900">{rateLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Experience</p>
            <p className="text-sm font-semibold text-slate-900">{experienceLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {chips.length ? (
            chips.map((chip) => (
              <span key={chip} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                {chip}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Add tags</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AssociateProfileEdit() {
  const [profileState, setProfileState] = useState({ loading: true, error: null, profile: null });
  const [dashboardState, setDashboardState] = useState({ loading: true, data: null, error: null });

  const refreshProfile = useCallback(async () => {
    setProfileState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetchAssociatePortalProfile({ preferDraft: true });
      setProfileState({ loading: false, error: null, profile: response.profile || null });
    } catch (error) {
      setProfileState({ loading: false, error: error?.message || "Unable to load profile", profile: null });
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    setDashboardState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const payload = await fetchAssociateDashboard();
      setDashboardState({ loading: false, data: payload, error: payload?.error || null });
    } catch (error) {
      setDashboardState({ loading: false, data: null, error: error?.message || "Unable to load dashboard" });
    }
  }, []);

  useEffect(() => {
    refreshProfile();
    refreshDashboard();
  }, [refreshProfile, refreshDashboard]);

  const profile = profileState.profile;
  const stats = useMemo(() => deriveProfileStats(profile || {}), [profile]);
  const completeness = useMemo(() => computeCompleteness(profile), [profile]);
  const planUploads = dashboardState.data?.planUploads || [];
  const featuredPlan = planUploads[0] || null;
  const showcaseState = profile ? { associate: profile, dashboard: dashboardState.data } : undefined;

  const avatar = getAssociateAvatar(profile) || getAssociateFallback(profile);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] space-y-8 px-6 py-10 lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Profile</p>
            <h1 className="text-2xl font-semibold text-slate-900">Update marketplace profile</h1>
            <p className="text-sm text-slate-600">Edit every field and media slot for your Skill Studio presence.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard/associate"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
            >
              <ArrowLeft size={14} /> Back to dashboard
            </Link>
            <button
              type="button"
              onClick={refreshProfile}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
            >
              <RefreshCcw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(460px,1fr)] items-start">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatar}
                        alt="Associate avatar"
                        className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                        onError={(event) => {
                          event.currentTarget.src = getAssociateFallback(profile);
                        }}
                      />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                          {profile?.title || "Associate profile"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {profile?.location || "Add location"} · {profile?.availability || "Set availability"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-semibold text-slate-900">{completeness.percent}% complete</p>
                    <p className="text-xs text-slate-500">
                      {completeness.updatedAt ? `Last synced ${new Date(completeness.updatedAt).toLocaleDateString()}` : "Not synced yet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={refreshProfile}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-slate-400"
                    >
                      <RefreshCcw size={14} /> Sync profile
                    </button>
                    <Link
                      to="/dashboard/associate/listing"
                      state={showcaseState}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      View listing <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/70">
                  <div className="h-2 rounded-full bg-slate-900 transition-all" style={{ width: `${completeness.percent}%` }} />
                </div>
                {completeness.missing.slice(0, 4).length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {completeness.missing.slice(0, 4).map((chip) => (
                      <span key={chip} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">All required fields are filled.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <AssociateProfileEditor onProfileUpdate={refreshProfile} header={null} />
              </div>
            </div>

            <div className="space-y-4 xl:sticky xl:top-6">
              <PreviewSnapshot profile={profile} stats={stats} featuredPlan={featuredPlan} />
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <PortfolioMediaPlayer
                  items={profile?.portfolioMedia}
                  title="Live portfolio tiles"
                  subtitle="Click through the carousel exactly how it appears on Skill Studio."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
