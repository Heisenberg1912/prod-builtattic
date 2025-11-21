
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LayoutDashboard,
  User,
  Briefcase,
  DollarSign,
  FileText,
  Bell,
  Loader,
  Menu,
  X,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  ExternalLink,
  RefreshCcw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import PlanUploadPanel from "../../components/dashboard/PlanUploadPanel.jsx";
import ServicePackManager from "../../components/dashboard/ServicePackManager.jsx";
import MeetingScheduler from "../../components/dashboard/MeetingScheduler.jsx";
import DownloadCenter from "../../components/dashboard/DownloadCenter.jsx";
import ClientChatPanel from "../../components/dashboard/ClientChatPanel.jsx";
import AssociateProfileEditor from "../../components/associate/AssociateProfileEditor.jsx";
import PortfolioMediaPlayer from "../../components/associate/PortfolioMediaPlayer.jsx";
import { fetchAssociatePortalProfile } from "../../services/portal.js";
import { fetchAssociateDashboard } from "../../services/dashboard.js";
import { deriveProfileStats, formatCurrency } from "../../utils/associateProfile.js";
import { getAssociateAvatar, getAssociateFallback } from "../../utils/imageFallbacks.js";

const STORAGE_KEYS = {
  activity: "associate_dashboard_activity_log_v1",
  applications: "associate_dashboard_applications_v1",
};

const APPLICATION_STATUSES = ["Draft", "Submitted", "Interview", "Won", "Closed"];
const normalizeApplicationStatus = (status) => {
  if (!status) return "Submitted";
  const lookup = APPLICATION_STATUSES.find(
    (entry) => entry.toLowerCase() === String(status).toLowerCase()
  );
  return lookup || "Submitted";
};

const DAY_LABELS = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

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
};

const SectionShell = ({ id, eyebrow, title, description, action, children }) => (
  <section id={id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">{eyebrow}</p>
        ) : null}
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {action || null}
    </div>
    {children}
  </section>
);

const InsightStat = ({ label, value, helper, accent = "bg-slate-900/5" }) => (
  <div className={`rounded-2xl border border-slate-200 ${accent} px-4 py-5 shadow-sm`}>
    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "-"}</p>
    {helper ? <p className="text-xs text-slate-500 mt-1">{helper}</p> : null}
  </div>
);

const QuickActionButton = ({ label, helper, to, state, onClick }) => (
  <Link
    to={to}
    state={state}
    onClick={onClick}
    className="flex flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300"
  >
    <span className="text-sm font-semibold text-slate-900">{label}</span>
    {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
  </Link>
);

const OPPORTUNITY_BOARD = [
  {
    id: "opp-bim-coordination",
    title: "BIM coordination sprint",
    company: "Orbit Build Co.",
    description: "Coordinate clash detection for a 32-bed inpatient tower deliverable set.",
    tags: ["Revit", "Healthcare", "BIM"],
    timezone: "Asia/Kolkata",
    budgetHourly: 45,
    responseBy: "2025-03-27",
    languages: ["English"],
    format: "Remote",
  },
  {
    id: "opp-parametric-facade",
    title: "Parametric facade detailing",
    company: "Flux Studios",
    description: "Support the facade lead with Grasshopper scripts and IFC packaging.",
    tags: ["Grasshopper", "Facade", "Parametric"],
    timezone: "Europe/Berlin",
    budgetHourly: 60,
    responseBy: "2025-04-02",
    languages: ["English", "German"],
    format: "Hybrid",
  },
  {
    id: "opp-visualisation-hospitality",
    title: "Hospitality visualisation burst",
    company: "Velvet Render Lab",
    description: "Produce five hero renders and three dusk shots for a boutique resort pitch.",
    tags: ["Lumion", "Visualization", "Hospitality"],
    timezone: "Asia/Kolkata",
    budgetHourly: 55,
    responseBy: "2025-03-24",
    languages: ["English"],
    format: "Remote",
  },
  {
    id: "opp-site-coordination",
    title: "On-site coordination coverage",
    company: "Northbeam Projects",
    description: "Coordinate site walks, vendor alignments, and punch-list tracking for a retrofit.",
    tags: ["Site coordination", "Retrofit", "Reporting"],
    timezone: "Asia/Dubai",
    budgetHourly: 50,
    responseBy: "2025-03-30",
    languages: ["English"],
    format: "On-site",
  },
];

const NAV_SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: User },
  { id: "pipeline", label: "Pipeline", icon: Briefcase },
  { id: "workspace", label: "Workspace", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
];
const isBrowser = typeof window !== "undefined";

const AssociateSidebar = ({
  profile,
  meta,
  stats = [],
  sections = NAV_SECTIONS,
  onNavigate,
  previewLink,
  className = "",
}) => {
  const avatar = getAssociateAvatar(profile) || getAssociateFallback(profile);
  const summary =
    profile?.availability ||
    profile?.summary ||
    "Keep your Skill Studio presence synced with the marketplace.";

  return (
    <aside className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-6 ${className}`}>
      <div className="flex items-start gap-3">
        <img
          src={avatar}
          alt="Associate avatar"
          className="h-12 w-12 rounded-2xl border border-slate-200 object-cover"
          onError={(event) => {
            event.currentTarget.src = getAssociateFallback(profile);
          }}
        />
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Skill Studio</p>
          <h2 className="text-xl font-semibold text-slate-900">{profile?.title || "Associate workspace"}</h2>
          <p className="text-sm text-slate-600">{summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
            <p className="text-lg font-semibold text-slate-900">{stat.value ?? "-"}</p>
            {stat.helper ? <p className="text-[11px] text-slate-500">{stat.helper}</p> : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Link
          to={previewLink?.to || "/associateportfolio"}
          state={previewLink?.state}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-300"
          onClick={onNavigate}
        >
          Preview associate profile
        </Link>
        <Link
          to="/dashboard/associate/edit"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={onNavigate}
        >
          Update profile
        </Link>
      </div>

      <nav className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Navigate</p>
        <div className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {Icon ? <Icon size={16} className="text-slate-500" /> : null}
                <span>{section.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <Link
        to="/dashboard/associate/listing"
        onClick={onNavigate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Marketplace listing <ExternalLink size={14} />
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Completeness</p>
        <p className="text-lg font-semibold text-slate-900">{meta?.completeness ?? 0}%</p>
        <p className="text-[11px] text-slate-500">
          {meta?.updatedAt ? `Updated ${formatRelativeTime(meta.updatedAt)}` : "Not synced yet"}
        </p>
      </div>
    </aside>
  );
};

const loadStoredList = (key) => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistList = (key, value) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore persistence errors */
  }
};

const sanitizeApplications = (items) =>
  Array.isArray(items) ? items.filter((item) => item && item.id) : [];

const sanitizeActivity = (items) =>
  Array.isArray(items)
    ? items
        .filter((item) => item && item.id)
        .map((item) => ({
          id: item.id,
          timestamp: item.timestamp || new Date().toISOString(),
          kind: item.kind || "log",
          title: item.title || "Update",
          description: item.description || "",
          read: Boolean(item.read),
        }))
    : [];

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normaliseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).toLowerCase());
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

const getValueByPath = (object, path) => {
  if (!object || typeof object !== "object") return undefined;
  return path.split(".").reduce((accumulator, key) => {
    if (accumulator && Object.prototype.hasOwnProperty.call(accumulator, key)) {
      return accumulator[key];
    }
    return undefined;
  }, object);
};

const valuesEqual = (a, b) => {
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a || []) === JSON.stringify(b || []);
  }
  return (a ?? null) === (b ?? null);
};

const summariseProfileChanges = (previousProfile = {}, nextProfile = {}) => {
  const diff = [];
  Object.entries(PROFILE_FIELD_LABELS).forEach(([path, label]) => {
    if (!valuesEqual(getValueByPath(previousProfile, path), getValueByPath(nextProfile, path))) {
      diff.push(label);
    }
  });
  return diff;
};

const isFilled = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value);
};

const computeProfileMeta = (profile) => {
  if (!profile) {
    return {
      stats: deriveProfileStats({}),
      completeness: 0,
      filledFields: [],
      pendingFields: Object.values(PROFILE_FIELD_LABELS),
      updatedAt: null,
      availabilityWindows: [],
    };
  }

  const stats = deriveProfileStats(profile);
  const entries = Object.entries(PROFILE_FIELD_LABELS);
  const filledFields = [];
  const pendingFields = [];

  entries.forEach(([path, label]) => {
    const value = getValueByPath(profile, path);
    if (isFilled(value)) {
      filledFields.push(label);
    } else {
      pendingFields.push(label);
    }
  });

  const completeness = Math.round((filledFields.length / entries.length) * 100);
  const updatedAt = profile.updatedAt || profile.createdAt || null;
  const availabilityWindows = Array.isArray(profile.availabilityWindows)
    ? [...profile.availabilityWindows]
    : [];

  return {
    stats,
    completeness: Number.isFinite(completeness)
      ? Math.min(Math.max(completeness, 0), 100)
      : 0,
    filledFields,
    pendingFields,
    updatedAt,
    availabilityWindows,
  };
};

const formatRelativeTime = (iso) => {
  if (!iso) return "Never";
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return "Unknown";
  const diffMs = target.getTime() - Date.now();
  const units = [
    { unit: "day", ms: 86_400_000 },
    { unit: "hour", ms: 3_600_000 },
    { unit: "minute", ms: 60_000 },
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const { unit, ms } of units) {
    if (Math.abs(diffMs) >= ms || unit === "minute") {
      return formatter.format(Math.round(diffMs / ms), unit);
    }
  }
  return target.toLocaleString();
};

const buildOpportunityMatches = (profile) => {
  const enriched = OPPORTUNITY_BOARD.map((opportunity) => {
    const tags = normaliseList(opportunity.tags);
    const opportunityLanguages = normaliseList(opportunity.languages);
    let score = 0;
    const reasons = [];

    if (profile) {
      const softwareSet = new Set(normaliseList(profile.softwares));
      const specialitySet = new Set(normaliseList(profile.specialisations));
      const languageSet = new Set(normaliseList(profile.languages));
      const timezone = profile.timezone?.toLowerCase();

      tags.forEach((tag) => {
        if (softwareSet.has(tag)) {
          score += 2;
          reasons.push(`Software match: ${tag}`);
        } else if (specialitySet.has(tag)) {
          score += 1;
          reasons.push(`Focus area: ${tag}`);
        }
      });

      if (opportunityLanguages.length) {
        const matchedLanguage = opportunityLanguages.find((language) => languageSet.has(language));
        if (matchedLanguage) {
          score += 1;
          reasons.push(`Language match: ${matchedLanguage}`);
        }
      }

      if (opportunity.timezone && timezone && opportunity.timezone.toLowerCase() === timezone) {
        score += 1;
        reasons.push("Timezone alignment");
      }
    }

    return { ...opportunity, score, reasons };
  });

  const matches = enriched
    .filter((opportunity) => opportunity.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length) {
    return matches;
  }

  return enriched
    .sort((a, b) => new Date(a.responseBy).getTime() - new Date(b.responseBy).getTime())
    .slice(0, 3)
    .map((opportunity) => ({
      ...opportunity,
      score: opportunity.score || 1,
      reasons: opportunity.reasons?.length ? opportunity.reasons : ["New marketplace lead"],
    }));
};

const formatList = (items) => {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  const copy = [...items];
  const last = copy.pop();
  return `${copy.join(", ")}, and ${last}`;
};

const formatAvailabilityWindow = (window) => {
  const dayLabel = DAY_LABELS[window.day] || window.day;
  if (!window.from || !window.to) return dayLabel || "";
  return `${dayLabel}: ${window.from} - ${window.to}`;
};

const formatPlanHighlights = (plan) => {
  if (!plan) return [];
  const highlights = [];
  const category = [plan.category, plan.subtype].filter(Boolean).join(" · ");
  if (category) highlights.push(category);
  if (plan.primaryStyle) highlights.push(plan.primaryStyle);
  if (plan.areaSqft && Number(plan.areaSqft)) {
    highlights.push(`${Number(plan.areaSqft).toLocaleString()} sqft`);
  }
  if (Array.isArray(plan.renderImages) && plan.renderImages.length) {
    highlights.push(`${plan.renderImages.length} render${plan.renderImages.length === 1 ? "" : "s"}`);
  }
  if (plan.walkthrough) {
    highlights.push("Walkthrough ready");
  }
  return highlights;
};
function AssociateDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileState, setProfileState] = useState({ loading: true, error: null, profile: null });
  const [dashboardState, setDashboardState] = useState({ loading: true, data: null, error: null });
  const [sectionStatus, setSectionStatus] = useState({});
  const mountedRef = useRef(true);
  const [applications, setApplications] = useState(() =>
    sanitizeApplications(loadStoredList(STORAGE_KEYS.applications))
  );
  const [activityLog, setActivityLog] = useState(() =>
    sanitizeActivity(loadStoredList(STORAGE_KEYS.activity))
  );

  const refreshProfile = useCallback(async (options = {}) => {
    setProfileState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetchAssociatePortalProfile({ preferDraft: true });
      if (response.authRequired) {
        setProfileState({
          loading: false,
          error: response.error?.message || "Sign in to manage your Skill Studio profile.",
          profile: response.profile || null,
        });
        if (!options.silent) {
          toast.error("Sign in to sync your profile");
        }
        return;
      }

      setProfileState({ loading: false, error: null, profile: response.profile || null });
      if (!options.silent) {
        toast.success(response.source === "draft" ? "Loaded profile draft" : "Profile synced");
      }
    } catch (error) {
      setProfileState({
        loading: false,
        error: error?.message || "Unable to load profile",
        profile: null,
      });
      if (!options.silent) {
        toast.error("Unable to load profile");
      }
    }
  }, []);

  useEffect(() => {
    refreshProfile({ silent: true });
  }, [refreshProfile]);

  const refreshDashboard = useCallback(
    async (sectionId = null, options = {}) => {
      if (sectionId) {
        setSectionStatus((prev) => ({
          ...prev,
          [sectionId]: { ...prev[sectionId], loading: true, error: null },
        }));
      } else {
        setDashboardState((prev) => ({ ...prev, loading: true, error: null }));
      }
      try {
        const payload = await fetchAssociateDashboard();
        if (!mountedRef.current) return payload;
        setDashboardState({ loading: false, data: payload, error: payload?.error || null });
        if (sectionId) {
          setSectionStatus((prev) => ({
            ...prev,
            [sectionId]: { loading: false, error: payload?.error || null },
          }));
        }
        if (!options.silent && payload?.fallback) {
          toast("Showing cached marketplace data", { icon: "ℹ️" });
        }
        return payload;
      } catch (error) {
        if (!mountedRef.current) return null;
        const message = error?.message || "Unable to load dashboard";
        if (sectionId) {
          setDashboardState((prev) => ({ ...prev, error: prev.error || message }));
          setSectionStatus((prev) => ({
            ...prev,
            [sectionId]: { loading: false, error: message },
          }));
        } else {
          setDashboardState({ loading: false, data: null, error: message });
        }
        if (!options.silent) {
          toast.error(message);
        }
        return null;
      }
    },
    []
  );

  useEffect(() => {
    refreshDashboard(null, { silent: true });
    return () => {
      mountedRef.current = false;
    };
  }, [refreshDashboard]);

  const profileMeta = useMemo(
    () => computeProfileMeta(profileState.profile),
    [profileState.profile]
  );

  const recommendedMatches = useMemo(
    () => buildOpportunityMatches(profileState.profile),
    [profileState.profile]
  );

  const dashboardData = dashboardState.data || {};
  const dashboardMetrics = dashboardData.metrics || {};
  const dashboardLeads = dashboardData.leads || [];
  const dashboardApplications = dashboardData.applications || [];
  const dashboardNextActions = dashboardData.nextActions || [];
  const dashboardServicePacks = dashboardData.servicePacks || [];
  const dashboardMeetings = dashboardData.meetings || [];
  const planUploads = dashboardData.planUploads || [];
  const downloads = dashboardData.downloads || [];
  const chats = dashboardData.chats || [];
  const featuredPlan = planUploads[0] || null;

  const pipelineMatches = useMemo(() => {
    if (recommendedMatches.length) return recommendedMatches;
    if (!dashboardLeads.length) return [];
    return dashboardLeads.map((lead, index) => {
      const fallbackRate =
        profileMeta.stats.hourly ||
        profileState.profile?.rates?.hourly ||
        profileState.profile?.rates?.min ||
        35;
      const updatedAt = lead.updatedAt || new Date().toISOString();
      return {
        id: lead.id || lead.title || `lead-${index}`,
        title: lead.title || "Marketplace lead",
        company: lead.contact || dashboardData?.firm?.name || "Skill Studio buyer",
        description: lead.detail || "Follow up to move this lead forward.",
        tags: lead.tags && lead.tags.length ? lead.tags : [lead.status || "Lead"],
        timezone: lead.timezone || profileState.profile?.timezone || "Flexible",
        budgetHourly: lead.budgetHourly || fallbackRate,
        responseBy: updatedAt,
        languages: lead.languages && lead.languages.length ? lead.languages : profileState.profile?.languages || ["English"],
        format: lead.format || "Remote",
        score: 1,
        reasons: [lead.status ? `Status: ${lead.status}` : "Imported from dashboard"],
      };
    });
  }, [recommendedMatches, dashboardLeads, profileMeta.stats.hourly, profileState.profile, dashboardData?.firm?.name]);

  const unreadNotifications = useMemo(
    () => activityLog.filter((entry) => !entry.read).length,
    [activityLog]
  );

  const getSectionStatus = (sectionId) => sectionStatus[sectionId] || {};
  const isSectionRefreshing = (sectionId) => Boolean(getSectionStatus(sectionId).loading);

  const renderRefreshButton = (sectionId, label = "Refresh data") => {
    const refreshing = isSectionRefreshing(sectionId);
    return (
      <button
        type="button"
        onClick={() => refreshDashboard(sectionId)}
        disabled={refreshing}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {refreshing ? (
          <>
            <Loader className="h-3.5 w-3.5 animate-spin" /> Refreshing
          </>
        ) : (
          <>
            <RefreshCcw size={14} /> {label}
          </>
        )}
      </button>
    );
  };

  const renderSectionError = (sectionId, helperText) => {
    const message = getSectionStatus(sectionId).error;
    if (!message) return null;
    return (
      <p className="text-xs text-rose-600">
        {helperText ? `${message} — ${helperText}` : message}
      </p>
    );
  };

  const fallbackApplications = dashboardApplications.map((application, index) => ({
    id: application.id || `remote-app-${index}`,
    title: application.items?.[0]?.title || "Marketplace opportunity",
    company: application.company || application.contact || "Marketplace lead",
    status: normalizeApplicationStatus(application.status),
    trackedAt: application.createdAt || application.updatedAt,
    readOnly: true,
  }));
  const hasLocalApplications = applications.length > 0;
  const displayApplications = hasLocalApplications ? applications : fallbackApplications;

  const fallbackActivityEntries = dashboardNextActions.map((action, index) => ({
    id: action.id || `next-action-${index}`,
    title: action.title,
    description: action.detail,
    timestamp: action.updatedAt || new Date().toISOString(),
    read: false,
    readOnly: true,
  }));
  const hasLocalActivity = activityLog.length > 0;
  const displayActivity = hasLocalActivity ? activityLog : fallbackActivityEntries;

  const pushActivity = useCallback((entry) => {
    setActivityLog((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      persistList(STORAGE_KEYS.activity, next);
      return next;
    });
  }, []);

  const handleProfileUpdated = useCallback(
    (nextProfile, meta = {}) => {
      if (!nextProfile) return;
      const previousProfile = profileState.profile;
      setProfileState((prev) => ({ ...prev, profile: nextProfile, loading: false, error: null }));
      const changes = summariseProfileChanges(previousProfile, nextProfile);
      if (meta?.origin === "save" && meta?.source === "remote" && !meta?.authRequired) {
        pushActivity({
          id: createId(),
          timestamp: new Date().toISOString(),
          kind: "profile.updated",
          title: "Profile synced to marketplace",
          description: changes.length
            ? `Updated ${formatList(changes.slice(0, 4))}`
            : "Saved without field changes",
          read: false,
        });
        toast.success("Profile saved");
      }
    },
    [profileState.profile, pushActivity]
  );

  const handleTrackOpportunity = useCallback(
    (opportunity) => {
      if (!opportunity) return;
      let tracked = false;
      setApplications((prev) => {
        if (prev.some((item) => item.id === opportunity.id)) {
          tracked = true;
          return prev;
        }
        const entry = {
          id: opportunity.id,
          title: opportunity.title,
          company: opportunity.company,
          status: "Draft",
          trackedAt: new Date().toISOString(),
          responseBy: opportunity.responseBy,
          matchScore: opportunity.score,
          tags: opportunity.tags,
          format: opportunity.format,
        };
        const next = [entry, ...prev].slice(0, 40);
        persistList(STORAGE_KEYS.applications, next);
        pushActivity({
          id: createId(),
          timestamp: entry.trackedAt,
          kind: "application.tracked",
          title: `Tracking ${opportunity.title}`,
          description: `Added ${opportunity.company} to your pipeline.`,
          read: false,
        });
        return next;
      });
      if (!tracked) {
        toast.success("Opportunity added to pipeline");
      } else {
        toast("Already in your pipeline", { icon: "ℹ️" });
      }
    },
    [pushActivity]
  );

  const handleApplicationStatusChange = useCallback(
    (id, status) => {
      let updated = null;
      setApplications((prev) => {
        const next = prev.map((item) => {
          if (item.id !== id) return item;
          updated = { ...item, status, updatedAt: new Date().toISOString() };
          return updated;
        });
        if (!updated) return prev;
        persistList(STORAGE_KEYS.applications, next);
        return next;
      });
      if (updated) {
        pushActivity({
          id: createId(),
          timestamp: updated.updatedAt,
          kind: "application.status",
          title: `${updated.title} moved to ${status}`,
          description: `Status for ${updated.company} updated to ${status}.`,
          read: false,
        });
        toast.success("Status updated");
      }
    },
    [pushActivity]
  );

  const handleRemoveApplication = useCallback(
    (id) => {
      let removed = null;
      setApplications((prev) => {
        const next = prev.filter((item) => {
          if (item.id === id) {
            removed = item;
            return false;
          }
          return true;
        });
        if (removed) {
          persistList(STORAGE_KEYS.applications, next);
        }
        return next;
      });
      if (removed) {
        pushActivity({
          id: createId(),
          timestamp: new Date().toISOString(),
          kind: "application.removed",
          title: `Removed ${removed.title}`,
          description: `Stopped tracking ${removed.company} opportunity.`,
          read: false,
        });
        toast("Removed from pipeline", { icon: "✔️" });
      }
    },
    [pushActivity]
  );

  const handleMarkActivityRead = useCallback((id) => {
    setActivityLog((prev) => {
      const next = prev.map((entry) =>
        entry.id === id ? { ...entry, read: true } : entry
      );
      persistList(STORAGE_KEYS.activity, next);
      return next;
    });
  }, []);

  const handleDismissActivity = useCallback((id) => {
    setActivityLog((prev) => {
      const next = prev.filter((entry) => entry.id !== id);
      persistList(STORAGE_KEYS.activity, next);
      return next;
    });
  }, []);

  const handleClearActivity = useCallback(() => {
    setActivityLog([]);
    persistList(STORAGE_KEYS.activity, []);
  }, []);

  const completenessValue = Number.isFinite(dashboardMetrics.profileCompleteness)
    ? dashboardMetrics.profileCompleteness
    : profileMeta.completeness;
  const listingStatus = completenessValue >= 80
    ? { label: "Marketplace ready", accent: "bg-emerald-50" }
    : completenessValue >= 50
      ? { label: "Needs polish", accent: "bg-amber-50" }
      : { label: "Draft", accent: "bg-slate-100" };
  const currencyCode = profileState.profile?.rates?.currency || profileState.profile?.currency || "USD";
  const hourlyRateValue = Number.isFinite(dashboardMetrics.hourlyRate)
    ? dashboardMetrics.hourlyRate
    : profileMeta.stats.hourly;
  const dailyRateValue = profileMeta.stats.daily || (hourlyRateValue ? hourlyRateValue * 8 : null);
  const hourlyRateLabel = hourlyRateValue ? formatCurrency(hourlyRateValue, currencyCode) : "Add hourly rate";
  const dailyRateLabel = dailyRateValue ? formatCurrency(dailyRateValue, currencyCode) : null;
  const leadsCount = Number.isFinite(dashboardMetrics.activeLeads) ? dashboardMetrics.activeLeads : pipelineMatches.length;
  const applicationsCount = Number.isFinite(dashboardMetrics.applicationsTracked)
    ? dashboardMetrics.applicationsTracked
    : displayApplications.length;
  const alertsCount = Number.isFinite(dashboardMetrics.alerts) ? dashboardMetrics.alerts : unreadNotifications;
  const planStats = {
    total: planUploads.length,
    renders: planUploads.reduce(
      (sum, plan) => sum + (Array.isArray(plan.renderImages) ? plan.renderImages.length : 0),
      0
    ),
    walkthroughs: planUploads.filter((plan) => Boolean(plan.walkthrough)).length,
  };
  const publishedServicePacks = dashboardServicePacks.filter(
    (pack) => (pack.status || "").toLowerCase() === "published",
  );
  const nextActionsPreview = dashboardNextActions.slice(0, 3);
  const pipelinePreview = pipelineMatches.slice(0, 3);
  const meetingPreviews = [...dashboardMeetings]
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
    .slice(0, 3);
  const showcaseState = { associate: profileState.profile, dashboard: dashboardData };
  const sidebarStats = [
    { label: "Profile", value: `${completenessValue}%`, helper: listingStatus.label },
    { label: "Leads", value: leadsCount, helper: "Active matches" },
    { label: "Apps", value: applicationsCount, helper: "Tracked" },
    { label: "Alerts", value: alertsCount, helper: "Unread" },
  ];
  const profileProgress = Math.min(Math.max(Number(profileMeta.completeness) || 0, 0), 100);
  const profileLastSynced = profileMeta.updatedAt ? formatRelativeTime(profileMeta.updatedAt) : "Never";
  const profileMissingPreview = (profileMeta.pendingFields || []).slice(0, 3);
  const profileFieldsTotal =
    (profileMeta.pendingFields?.length || 0) + (profileMeta.filledFields?.length || 0);
  const profileStatTiles = [
    { label: "Hourly rate", value: profileMeta.stats.hourly ? formatCurrency(profileMeta.stats.hourly, currencyCode) : "Add rate" },
    { label: "Daily rate", value: profileMeta.stats.daily ? formatCurrency(profileMeta.stats.daily, currencyCode) : "Add rate" },
    { label: "Experience", value: profileMeta.stats.years ? `${profileMeta.stats.years} yrs` : "Add experience" },
    { label: "Projects", value: profileMeta.stats.projects ? `${profileMeta.stats.projects}` : "Add count" },
  ];

  const formatDateTime = (value, options = { dateStyle: "medium", timeStyle: "short" }) => {
    if (!value) return "Schedule TBA";
    try {
      return new Date(value).toLocaleString(undefined, options);
    } catch {
      return "Schedule TBA";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1800px] space-y-14 px-8 py-12 lg:px-14 xl:px-18">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Builtattic</p>
            <h1 className="text-2xl font-semibold text-slate-900">Associate dashboard</h1>
            <p className="text-sm text-slate-600">
              Same workspace polish as the firm dashboard, tuned for Skill Studio associates.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {renderRefreshButton("overview", "Refresh dashboard")}
            <button
              type="button"
              onClick={() => refreshProfile()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
            >
              <RefreshCcw size={14} /> Sync profile
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 lg:hidden"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? <X size={14} /> : <Menu size={14} />} Menu
            </button>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
          <div className={sidebarOpen ? "" : "hidden lg:block"}>
            <AssociateSidebar
              profile={profileState.profile}
              meta={profileMeta}
              stats={sidebarStats}
              sections={NAV_SECTIONS}
              previewLink={{ to: "/associateportfolio", state: showcaseState }}
              onNavigate={() => setSidebarOpen(false)}
              className="lg:sticky lg:top-8"
            />
          </div>

          <div className="space-y-6">
            <SectionShell
              id="overview"
              eyebrow="Skill Studio overview"
              title="Workspace pulse"
              description="High-signal cards from your marketplace presence, routed leads, and buyer-facing assets."
              action={renderRefreshButton("overview", "Refresh insights")}
            >
              {renderSectionError("overview", "Some insights might be cached.")}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InsightStat label="Profile completeness" value={`${completenessValue}%`} helper={listingStatus.label} accent={listingStatus.accent} />
                <InsightStat label="Hourly rate" value={hourlyRateLabel} helper={dailyRateLabel ? `Day rate ${dailyRateLabel}` : "Set your preferred rates"} />
                <InsightStat label="Active leads" value={leadsCount} helper="Routed matches" />
                <InsightStat label="Applications" value={applicationsCount} helper={`${alertsCount} alerts`} />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Pipeline</p>
                      <h3 className="text-lg font-semibold text-slate-900">Next up</h3>
                    </div>
                    <Link to="#pipeline" className="text-xs font-semibold text-slate-900 underline">
                      View pipeline
                    </Link>
                  </div>
                  {pipelinePreview.length ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {pipelinePreview.map((opportunity) => (
                        <li key={opportunity.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <p className="font-semibold text-slate-900">{opportunity.title}</p>
                          <p className="text-xs text-slate-500">{opportunity.company}</p>
                          <p className="text-[11px] text-slate-500">
                            {opportunity.responseBy
                              ? `Respond by ${formatDateTime(opportunity.responseBy, { dateStyle: "medium" })}`
                              : "Flexible timeline"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No matches yet. Polish your profile to unlock routed leads.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Workspace</p>
                      <h3 className="text-lg font-semibold text-slate-900">What buyers see</h3>
                    </div>
                    <Link to="#workspace" className="text-xs font-semibold text-slate-900 underline">
                      Manage assets
                    </Link>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <span>Plan uploads</span>
                      <span className="font-semibold text-slate-900">{planStats.total}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <span>Service packs</span>
                      <span className="font-semibold text-slate-900">{publishedServicePacks.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <span>Meetings</span>
                      <span className="font-semibold text-slate-900">{meetingPreviews.length}</span>
                    </div>
                    {downloads.length ? (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                        Latest WD-W3: {downloads[0].label || downloads[0].tag || "Deliverable"}{downloads[0].updatedAt ? ` • ${formatRelativeTime(downloads[0].updatedAt)}` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <QuickActionButton label="Upload a plan" helper="Renders, walkthroughs, specs" to="#workspace" onClick={() => setSidebarOpen(false)} />
                <QuickActionButton
                  label="Preview profile"
                  helper="Open the associate profile page"
                  to="/associateportfolio"
                  state={showcaseState}
                />
              </div>
            </SectionShell>

            <div id="profile" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Profile</p>
                  <h3 className="text-lg font-semibold text-slate-900">Marketplace profile</h3>
                  <p className="text-sm text-slate-600">
                    Edit your listing on the dedicated profile page. This dashboard stays focused on signals and workflow.
                  </p>
                  <p className="text-xs text-slate-500">Last synced {profileLastSynced}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/dashboard/associate/edit"
                    state={showcaseState}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Update profile
                  </Link>
                  <Link
                    to="/dashboard/associate/listing"
                    state={showcaseState}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
                  >
                    View listing
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)] items-start">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">Status</p>
                      <p className="text-xl font-semibold text-slate-900">{profileProgress}% complete</p>
                      <p className="text-xs text-slate-500">
                        {profileMeta.filledFields?.length || 0} / {profileFieldsTotal || profileMeta.filledFields?.length || 0} fields filled
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/dashboard/associate/edit"
                        state={showcaseState}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Keep polishing
                      </Link>
                      <Link
                        to="/associateportfolio"
                        state={showcaseState}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
                      >
                        Preview public card
                      </Link>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white">
                    <div
                      className="h-2 rounded-full bg-slate-900 transition-all"
                      style={{ width: `${profileProgress}%` }}
                    />
                  </div>
                  {profileMissingPreview.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profileMissingPreview.map((field) => (
                        <span
                          key={field}
                          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">All required fields are filled. Add media and links to stay fresh.</p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {profileStatTiles.map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <MarketplacePreview
                  profile={profileState.profile}
                  meta={profileMeta}
                  featuredPlan={profileState.profile?.featuredPlan || null}
                  loading={profileState.loading}
                  previewState={showcaseState}
                  previewPath="/associateportfolio"
                />
              </div>
            </div>

            <SectionShell
              id="pipeline"
              eyebrow="Pipeline"
              title="Jobs and applications"
              description="Track routed opportunities and move applications forward."
              action={renderRefreshButton("jobs", "Refresh leads")}
            >
              {renderSectionError("jobs", "Lead recommendations may be cached.")}
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)]">
                <JobsView
                  profile={profileState.profile}
                  matches={pipelineMatches}
                  applications={displayApplications}
                  meta={profileMeta}
                  onTrackOpportunity={handleTrackOpportunity}
                  refreshButton={null}
                  sectionError={null}
                  loading={(dashboardState.loading && !dashboardState.data) || isSectionRefreshing("jobs")}
                  compact
                />
                <div className="space-y-6">
                  <ApplicationsView
                    applications={displayApplications}
                    onUpdateStatus={handleApplicationStatusChange}
                    onRemove={handleRemoveApplication}
                    readOnly={!hasLocalApplications}
                    refreshButton={renderRefreshButton("applications", "Refresh applications")}
                    sectionError={renderSectionError("applications", "Pipeline sync may be outdated.")}
                    compact
                  />
                  <EarningsView profile={profileState.profile} meta={profileMeta} applications={displayApplications} compact />
                </div>
              </div>
            </SectionShell>

            <SectionShell
              id="workspace"
              eyebrow="Workspace"
              title="Marketplace assets"
              description="Upload concepts, publish service packs, schedule syncs, and drop WD-W3 files."
              action={renderRefreshButton("workspace", "Refresh workspace")}
            >
              <div className="space-y-6">
                <PlanUploadPanel
                  role="associate"
                  workspaceName="Skill Studio"
                  initialPlans={planUploads}
                  onPlanChange={() => refreshDashboard(null, { silent: true })}
                />

                <ServicePackManager
                  ownerType="associate"
                  initialPacks={dashboardServicePacks}
                  heading="Service packs"
                  eyebrow="Skill Studio services"
                  description="Package your go-to scope so ops can drop you into buyer pipelines instantly."
                  emptyMessage="No packs published yet. Add at least one pack so the marketplace team can route work."
                />

                <MeetingScheduler
                  ownerType="associate"
                  initialMeetings={dashboardMeetings}
                  heading="Meeting schedule"
                  eyebrow="Syncs"
                  description="Track onboarding, review, and offboarding calls tied to each client."
                  emptyMessage="No syncs scheduled. Log your next touchpoints so everyone stays aligned."
                />

                <DownloadCenter
                  ownerType="associate"
                  initialDownloads={downloads}
                  heading="Deliverable downloads"
                  eyebrow="WD W3"
                  description="Publish WD-W3 packs, walkthrough links, and plan zips buyers can pull from instantly."
                  emptyMessage="No WD-W3 drops yet. Upload a deliverable handoff to unlock routing."
                />

                <ClientChatPanel
                  ownerType="associate"
                  initialChats={chats}
                  heading="Client chat"
                  eyebrow="Workspace thread"
                  description="Keep notes and buyer conversations visible to the ops team."
                  emptyMessage="Start logging context when a buyer pings you for changes."
                />
              </div>
            </SectionShell>

            <SectionShell
              id="notifications"
              eyebrow="Workflow"
              title="Notifications & next actions"
              description="Mark alerts as read, clear old activity, and keep moving forward."
              action={renderRefreshButton("notifications", "Refresh alerts")}
            >
              {renderSectionError("notifications", "Sync alerts if this looks off.")}
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
                <NotificationsView
                  activity={displayActivity}
                  onMarkRead={handleMarkActivityRead}
                  onDismiss={handleDismissActivity}
                  onClear={handleClearActivity}
                  readOnly={!hasLocalActivity}
                  refreshButton={null}
                  sectionError={null}
                  compact
                />

                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Next actions</p>
                      <h3 className="text-lg font-semibold text-slate-900">Stay visible</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{nextActionsPreview.length} tasks</span>
                  </div>
                  {nextActionsPreview.length ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {nextActionsPreview.map((action) => (
                        <li key={action.id || action.title} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <p className="font-semibold text-slate-900">{action.title}</p>
                          <p className="text-xs text-slate-500">{action.detail}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No reminders right now. Publish a bundle or refresh your profile to trigger new tasks.</p>
                  )}
                </div>
              </div>
            </SectionShell>
          </div>
        </div>
      </div>
    </div>
  );
}
function OverviewView({
  loading,
  error,
  profile,
  meta,
  featuredPlan,
  planUploads = [],
  opportunityMatches,
  applications,
  activity,
  onRefreshProfile,
  dashboardLoading,
  metrics,
  nextActions,
  refreshButton,
  sectionError,
  servicePacks = [],
  meetings = [],
  downloads = [],
  chats = [],
  onPlanRefresh = () => {},
}) {
  const completenessValue = Number.isFinite(metrics?.profileCompleteness)
    ? metrics.profileCompleteness
    : meta.completeness;
  const listingStatus = completenessValue >= 80
    ? { label: "Marketplace ready", tone: "positive" }
    : completenessValue >= 50
      ? { label: "Needs polish", tone: "warning" }
      : { label: "Draft", tone: "neutral" };

  const currencyCode = profile?.rates?.currency || profile?.currency || "USD";
  const derivedHourly = Number.isFinite(metrics?.hourlyRate) ? metrics.hourlyRate : meta.stats.hourly;
  const derivedDaily = meta.stats.daily || (derivedHourly ? derivedHourly * 8 : null);
  const hourlyRate = derivedHourly ? formatCurrency(derivedHourly, currencyCode) : "Add hourly rate";
  const dailyRate = derivedDaily ? formatCurrency(derivedDaily, currencyCode) : null;

  const nextOpportunity = opportunityMatches
    .map((opportunity) => ({
      ...opportunity,
      due: new Date(opportunity.responseBy),
    }))
    .filter((entry) => !Number.isNaN(entry.due.getTime()))
    .sort((a, b) => a.due.getTime() - b.due.getTime())[0];
  const leadsCount = Number.isFinite(metrics?.activeLeads) ? metrics.activeLeads : opportunityMatches.length;
  const applicationsCount = Number.isFinite(metrics?.applicationsTracked)
    ? metrics.applicationsTracked
    : applications.length;
  const alertsCount = Number.isFinite(metrics?.alerts)
    ? metrics.alerts
    : activity.filter((entry) => !entry.read).length;
  const derivedActions = Array.isArray(nextActions) && nextActions.length
    ? nextActions.slice(0, 5).map((action, index) => ({
        id: action.id || action.title || `next-action-${index}`,
        title: action.title || "Marketplace reminder",
        detail: action.detail || "Complete this task to stay visible.",
      }))
    : [];

  const planPreviewEntries = planUploads.slice(0, 3);
  const planRenderAssets = planUploads.reduce(
    (sum, plan) => sum + (Array.isArray(plan.renderImages) ? plan.renderImages.length : 0),
    0,
  );
  const planWalkthroughCount = planUploads.filter((plan) => Boolean(plan.walkthrough)).length;
  const planStats = {
    total: planUploads.length,
    renders: planRenderAssets,
    walkthroughs: planWalkthroughCount,
  };
  const publishedServicePacks = servicePacks.filter(
    (pack) => (pack.status || "").toLowerCase() === "published",
  );
  const draftServicePackCount = Math.max(servicePacks.length - publishedServicePacks.length, 0);
  const getTimeValue = (value) => {
    const timestamp = value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
    return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
  };
  const pipelinePreview = opportunityMatches.slice(0, 3);
  const activityPreview = activity.slice(0, 4);
  const meetingPreviews = [...meetings]
    .sort((a, b) => getTimeValue(a.scheduledFor) - getTimeValue(b.scheduledFor))
    .slice(0, 3);
  const downloadPreviews = downloads.slice(0, 3);
  const chatPreviews = chats.slice(0, 3);
  const formatDateTime = (value, options = { dateStyle: "medium", timeStyle: "short" }) => {
    if (!value) return "Schedule TBA";
    try {
      return new Date(value).toLocaleString(undefined, options);
    } catch {
      return "Schedule TBA";
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Skill Studio overview</p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {profile?.title || "Associate dashboard"}
            </h2>
            <p className="text-sm text-slate-600">
              Keep availability, plan uploads, and buyer-ready packs synced to the marketplace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {refreshButton}
            <button
              type="button"
              onClick={onRefreshProfile}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Reload profile
            </button>
          </div>
        </div>
        {dashboardLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ShieldCheck}
              label="Profile completeness"
              value={`${completenessValue}%`}
              helper={listingStatus.label}
              tone={listingStatus.tone}
            />
            <StatCard
              icon={DollarSign}
              label="Hourly rate"
              value={hourlyRate}
              helper={dailyRate ? `Day rate ${dailyRate}` : "Set your preferred rates"}
            />
            <StatCard
              icon={Sparkles}
              label="Plan uploads"
              value={`${planStats.total || 0} concepts`}
              helper={`${planStats.renders} renders · ${planStats.walkthroughs} walkthroughs`}
            />
            <StatCard
              icon={Briefcase}
              label="Service packs"
              value={`${publishedServicePacks.length} live`}
              helper={`${draftServicePackCount} drafts waiting`}
            />
          </div>
        )}
      </section>

      {sectionError}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 2xl:grid-cols-[3fr,2fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Concept hosting</p>
                <h3 className="text-lg font-semibold text-slate-900">Plan catalogue</h3>
                <p className="text-sm text-slate-600">
                  Surface the renders, walkthroughs, and specs you want ops to send buyers instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={onPlanRefresh}
                className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
              >
                Sync plan uploads
              </button>
            </div>
            {dashboardLoading ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-2xl bg-slate-200/60 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Concepts</p>
                    <p className="text-2xl font-semibold text-slate-900">{planStats.total || 0}</p>
                    <p className="text-xs text-slate-500">Live in Skill Studio</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Renders</p>
                    <p className="text-2xl font-semibold text-slate-900">{planStats.renders}</p>
                    <p className="text-xs text-slate-500">Hero visuals ready for buyers</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Walkthroughs</p>
                    <p className="text-2xl font-semibold text-slate-900">{planStats.walkthroughs}</p>
                    <p className="text-xs text-slate-500">Video or interactive tours</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {planPreviewEntries.length ? (
                    planPreviewEntries.map((plan) => (
                      <article
                        key={plan.id || plan.projectTitle}
                        className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              {plan.category || "Concept"}{plan.subtype ? ` · ${plan.subtype}` : ""}
                            </p>
                            <h4 className="text-base font-semibold text-slate-900">
                              {plan.projectTitle || "Untitled plan"}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {plan.primaryStyle || "Add a primary style"}
                            </p>
                          </div>
                          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {plan.renderImages?.length || 0} renders
                          </span>
                        </div>
                        <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <div>
                            <dt className="uppercase tracking-[0.3em] text-slate-400">Area</dt>
                            <dd>{plan.areaSqft ? `${number(plan.areaSqft)} sqft` : "Add sqft"}</dd>
                          </div>
                          <div>
                            <dt className="uppercase tracking-[0.3em] text-slate-400">Design rate</dt>
                            <dd>
                              {Number.isFinite(plan.designRate)
                                ? `$${number(plan.designRate)} / sqft`
                                : "Share rate"}
                            </dd>
                          </div>
                        </dl>
                        {plan.description ? (
                          <p className="mt-3 text-sm text-slate-600 line-clamp-3">{plan.description}</p>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                      Use the panel below to upload your first concept plan, renders, and walkthrough links.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Pipeline & activity</p>
                <h3 className="text-lg font-semibold text-slate-900">Who needs attention</h3>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Leads</p>
                <p className="text-base font-semibold text-slate-900">{leadsCount || 0}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Opportunity board</h4>
                  {nextOpportunity ? (
                    <span className="text-xs text-slate-500">
                      Next response {formatDateTime(nextOpportunity.responseBy, { dateStyle: "medium" })}
                    </span>
                  ) : null}
                </div>
                {pipelinePreview.length ? (
                  <ul className="mt-3 space-y-3 text-sm text-slate-600">
                    {pipelinePreview.map((opportunity) => (
                      <li key={opportunity.id || opportunity.title} className="rounded-2xl border border-slate-200 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {opportunity.title || "Untitled opportunity"}
                        </p>
                        <p className="text-xs text-slate-500">{opportunity.company || "Marketplace buyer"}</p>
                        <p className="text-xs text-slate-500">
                          {opportunity.responseBy
                            ? `Respond by ${formatDateTime(opportunity.responseBy, { dateStyle: "medium" })}`
                            : "Flexible timeline"}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No matches yet. Keep your profile polished and publish packs to unlock routed leads.
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Recent activity</h4>
                {activityPreview.length ? (
                  <ul className="mt-3 space-y-3 text-sm text-slate-600">
                    {activityPreview.map((entry) => (
                      <li key={entry.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                        <p className="text-xs text-slate-500">{entry.description}</p>
                        <p className="text-[11px] text-slate-400">{formatRelativeTime(entry.timestamp)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Activity will appear here as you apply to roles or update your profile.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Next actions</p>
                <h3 className="text-lg font-semibold text-slate-900">Stay visible</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {derivedActions.length} task{derivedActions.length === 1 ? "" : "s"}
              </span>
            </div>
            {derivedActions.length ? (
              <ul className="mt-4 space-y-3">
                {derivedActions.map((action) => (
                  <li key={action.id} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{action.title}</p>
                    <p className="text-xs text-slate-500">{action.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No reminders right now. Publish a bundle or refresh your profile to trigger new tasks.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Buyer syncs</p>
                <h3 className="text-lg font-semibold text-slate-900">Upcoming meetings</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">{meetingPreviews.length} scheduled</span>
            </div>
            {meetingPreviews.length ? (
              <ul className="mt-4 space-y-3">
                {meetingPreviews.map((meeting) => (
                  <li key={meeting.id} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{meeting.title || "Buyer sync"}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(meeting.scheduledFor)}</p>
                    <p className="text-xs text-slate-500">
                      {meeting.meetingLink ? (
                        <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                          Meeting link
                        </a>
                      ) : (
                        meeting.status || "Draft"
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No syncs logged. Schedule onboarding or review calls to keep ops looped in.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Deliverables & chat</p>
                <h3 className="text-lg font-semibold text-slate-900">Workspace drops</h3>
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Downloads</p>
                {downloadPreviews.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {downloadPreviews.map((entry) => (
                      <li key={entry.id} className="rounded-2xl border border-slate-200 px-4 py-2">
                        <p className="font-semibold text-slate-900">{entry.label || "Deliverable"}</p>
                        <p className="text-xs text-slate-500">{entry.tag || entry.accessLevel}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Publish WD-W3 drops to give buyers instant access.</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Client chat</p>
                {chatPreviews.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {chatPreviews.map((thread) => (
                      <li key={thread.id} className="rounded-2xl border border-slate-200 px-4 py-2">
                        <p className="font-semibold text-slate-900">{thread.subject || "Workspace thread"}</p>
                        <p className="text-xs text-slate-500">{thread.status || "open"}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Log buyer notes so ops can support conversations.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="space-y-6">
        <PlanUploadPanel
          role="associate"
          workspaceName="Skill Studio"
          initialPlans={planUploads}
          onPlanChange={onPlanRefresh}
        />

        <ServicePackManager
          ownerType="associate"
          initialPacks={servicePacks}
          heading="Service packs"
          eyebrow="Skill Studio services"
          description="Package your go-to scope so ops can drop you into buyer pipelines instantly."
          emptyMessage="No packs published yet. Add at least one pack so the marketplace team can route work."
        />

        <MeetingScheduler
          ownerType="associate"
          initialMeetings={meetings}
          heading="Meeting schedule"
          eyebrow="Syncs"
          description="Track onboarding, review, and offboarding calls tied to each client."
          emptyMessage="No syncs scheduled. Log your next touchpoints so everyone stays aligned."
        />

        <DownloadCenter
          ownerType="associate"
          initialDownloads={downloads}
          heading="Deliverable downloads"
          eyebrow="WD W3"
          description="Publish WD-W3 packs, walkthrough links, and plan zips buyers can pull from instantly."
          emptyMessage="No WD-W3 drops yet. Upload a deliverable handoff to unlock routing."
        />

        <ClientChatPanel
          ownerType="associate"
          initialChats={chats}
          heading="Client chat"
          eyebrow="Workspace thread"
          description="Keep notes and buyer conversations visible to the ops team."
          emptyMessage="Start logging context when a buyer pings you for changes."
        />

        <MarketplacePreview
          profile={profile}
          meta={meta}
          featuredPlan={featuredPlan}
          loading={dashboardLoading}
          previewState={profile ? { associate: profile } : undefined}
        />
      </div>
    </div>
  );
}

function MarketplacePreview({ profile, meta, loading, featuredPlan, previewState, previewPath = "/associateportfolio" }) {
  const loadingLabel = loading ? "Loading profile." : meta.updatedAt ? `Last synced ${formatRelativeTime(meta.updatedAt)}` : "Not synced yet";
  const avatar = getAssociateAvatar(profile) || getAssociateFallback(profile);
  const planHighlights = formatPlanHighlights(featuredPlan);
  const planRenderImages = Array.isArray(featuredPlan?.renderImages)
    ? featuredPlan.renderImages.filter((url) => typeof url === "string" && /^https?:\/\//i.test(url))
    : [];
  const heroImage = planRenderImages[0] || avatar;
  const heroBadge = featuredPlan ? "Concept hosting preview" : "Associate";
  const heroTitle = featuredPlan?.projectTitle || profile?.title || "Add a headline";
  const heroMeta = featuredPlan
    ? [featuredPlan.category, featuredPlan.primaryStyle].filter(Boolean).join(" · ") ||
      `${profile?.location || "Location"} · ${profile?.availability || "Availability note"}`
    : `${profile?.location || "Location"} · ${profile?.availability || "Availability note"}`;
  const summary =
    featuredPlan?.description ||
    profile?.summary ||
    "Add a short bio to highlight your expertise.";
  const chips = (featuredPlan && planHighlights.length
    ? planHighlights
    : [
        ...(profile?.specialisations || []).slice(0, 2),
        ...(profile?.softwares || []).slice(0, 2),
      ]) || [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-40 overflow-hidden rounded-t-3xl bg-slate-900/5">
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
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              {heroBadge}
            </p>
            <h3 className="text-xl font-semibold text-slate-900">{heroTitle}</h3>
            <p className="text-xs text-slate-500">{heroMeta}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-amber-500">
              {meta.stats?.rating ? meta.stats.rating.toFixed(1) : "4.7"}
            </p>
            <p className="text-xs text-slate-500">Avg rating</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 line-clamp-4">{summary}</p>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Rate
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {meta.stats?.hourly
                ? formatCurrency(meta.stats.hourly, profile?.rates?.currency || "USD")
                : "Set hourly rate"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Experience
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {meta.stats?.years || "-"} yrs
            </p>
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
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Add specialisations & software
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to={previewPath}
            state={previewState || (profile ? { associate: profile } : undefined)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
          >
            Preview listing <ExternalLink size={14} />
          </Link>
          <span className="text-xs text-slate-400">{loadingLabel}</span>
        </div>
      </div>
    </div>
  );
}

function ProfileView({
  profile,
  meta,
  onProfileUpdate,
  onRefresh,
  showHeader = true,
  previewState,
  previewPath = "/associateportfolio",
}) {
  const lastUpdated = meta.updatedAt ? formatRelativeTime(meta.updatedAt) : "Never";
  const previewPayload = previewState || (profile ? { associate: profile } : undefined);
  const missingFields = (meta.pendingFields || []).slice(0, 4);
  const filledCount = meta.filledFields?.length || 0;
  const totalFields = filledCount + (meta.pendingFields?.length || 0);
  const progressPercent = Math.min(Math.max(Number(meta.completeness) || 0, 0), 100);
  const profileStats = [
    { label: "Hourly rate", value: meta.stats?.hourly ? formatCurrency(meta.stats.hourly, profile?.rates?.currency || "USD") : "Add rate" },
    { label: "Daily rate", value: meta.stats?.daily ? formatCurrency(meta.stats.daily, profile?.rates?.currency || "USD") : "Add rate" },
    { label: "Experience", value: meta.stats?.years ? `${meta.stats.years} yrs` : "Add experience" },
    { label: "Projects", value: meta.stats?.projects ? `${meta.stats.projects}` : "Add count" },
  ];

  return (
    <div className="space-y-6">
      {showHeader ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Marketplace profile</h2>
            <p className="text-sm text-slate-600">
              Everything you publish here flows directly to your Skill Studio card and associate listing.
            </p>
            <p className="mt-1 text-xs text-slate-500">Last synced {lastUpdated}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={previewPath}
              state={previewPayload}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              Preview public card <ExternalLink size={14} />
            </Link>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Sync now <RefreshCcw size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Profile</p>
            <h3 className="text-lg font-semibold text-slate-900">Marketplace profile</h3>
            <p className="text-xs text-slate-500">Last synced {lastUpdated}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
            >
              <RefreshCcw size={14} /> Sync profile
            </button>
            <Link
              to={previewPath}
              state={previewPayload}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Preview <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(460px,1fr)] items-start">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">Status</p>
                  <p className="text-xl font-semibold text-slate-900">{progressPercent}% complete</p>
                  <p className="text-xs text-slate-500">
                    {filledCount} / {totalFields || filledCount} fields filled · Last synced {lastUpdated}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-slate-400"
                  >
                    <RefreshCcw size={14} /> Sync profile
                  </button>
                  <Link
                    to={previewPath}
                    state={previewPayload}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Preview <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-white/70">
                <div
                  className="h-2 rounded-full bg-slate-900 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {missingFields.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {missingFields.map((field) => (
                    <span
                      key={field}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">All required fields are filled. Keep your media fresh.</p>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {profileStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <AssociateProfileEditor onProfileUpdate={onProfileUpdate} header={null} />
            </div>
          </div>

          <div className="space-y-4 xl:sticky xl:top-4">
            <MarketplacePreview
              profile={profile}
              meta={meta}
              featuredPlan={profile?.featuredPlan || null}
              loading={false}
              previewState={previewPayload}
              previewPath={previewPath}
            />
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
  );
}

function JobsView({
  profile,
  matches,
  applications,
  meta,
  onTrackOpportunity,
  refreshButton,
  sectionError,
  loading,
  compact = false,
}) {
  const trackedIds = new Set(applications.map((item) => item.id));
  const availability = meta.availabilityWindows?.length ? meta.availabilityWindows : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        {compact ? (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Pipeline</p>
              <h3 className="text-lg font-semibold text-slate-900">Pipeline planner</h3>
            </div>
            <div className="flex flex-wrap gap-2">{refreshButton}</div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-slate-900">Pipeline planner</h2>
            <p className="text-sm text-slate-600">
              Leads that align with your skills, software stack, and timezone appear here. Add them to your pipeline to start tracking progress.
            </p>
            <div className="flex flex-wrap gap-2">{refreshButton}</div>
          </>
        )}
      </div>

      {sectionError}

      {!profile && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Add your marketplace profile details to unlock personalised lead recommendations.
        </div>
      )}

      {loading && !matches.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-72 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {matches.map((opportunity) => {
            const applied = trackedIds.has(opportunity.id);
            const strength = opportunity.score >= 4 ? "High match" : opportunity.score >= 2 ? "Solid match" : "Emerging";
            return (
              <div
                key={opportunity.id}
                className="min-w-0 flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                      {opportunity.title}
                    </h3>
                    <p className="text-sm text-slate-500">{opportunity.company} · {opportunity.format}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    strength === "High match"
                      ? "bg-emerald-100 text-emerald-700"
                      : strength === "Solid match"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-600"
                  }`}>
                    {strength}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 line-clamp-4">{opportunity.description}</p>
                <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-1">
                      Response by
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(opportunity.responseBy).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-1">
                      Budget
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(opportunity.budgetHourly, "USD")} / hr
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-1">
                      Timezone
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {opportunity.timezone || "Flexible"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {opportunity.tags.map((tag) => (
                    <span key={`${opportunity.id}-${tag}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
                <ul className="space-y-1 text-xs text-slate-500">
                  {opportunity.reasons.map((reason, index) => (
                    <li key={`${opportunity.id}-reason-${index}`} className="flex items-start gap-2">
                      <CheckCircle size={12} className="mt-[2px] text-emerald-500" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onTrackOpportunity(opportunity)}
                    disabled={applied}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {applied ? "In pipeline" : "Add to pipeline"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                    onClick={() => onTrackOpportunity(opportunity)}
                  >
                    {applied ? "Update status in Applications tab" : "Log interest"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Availability signal</h3>
        {availability.length ? (
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {availability.slice(0, 7).map((window, index) => (
              <li key={`${window.day}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                {formatAvailabilityWindow(window)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Add availability windows to let buyers know when you can start.
          </p>
        )}
      </div>
    </div>
  );
}
function EarningsView({ profile, meta, applications, compact = false }) {
  const hourly = meta.stats.hourly || 0;
  const projectedMonthly = hourly ? hourly * 8 * 18 : 0;
  const projectedQuarter = projectedMonthly * 3;
  const currency = profile?.rates?.currency || profile?.currency || "USD";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        {compact ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Earnings</p>
            <h3 className="text-lg font-semibold text-slate-900">Earnings outlook</h3>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-slate-900">Earnings outlook</h2>
            <p className="text-sm text-slate-600">
              Projected revenue based on your published rates and the momentum of your pipeline.
            </p>
          </>
        )}
      </div>

      {!hourly && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Set your hourly and daily rates in the profile tab to unlock projections.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm text-slate-300">Projected monthly</p>
          <p className="mt-2 text-3xl font-semibold">
            {projectedMonthly ? formatCurrency(projectedMonthly, currency) : "Set rates"}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Based on an 18-day sprint with your current hourly rate.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Quarterly outlook</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {projectedQuarter ? formatCurrency(projectedQuarter, currency) : "Complete rate card"}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Assumes steady pipeline with current conversion ratios.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Pipeline impact</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{applications.length}</p>
          <p className="mt-3 text-xs text-slate-500">
            Opportunities tracked in Applications tab.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Payout checklist</h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500" /> Publish hourly and daily rates
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500" /> Add at least one portfolio link
          </li>
          <li className="flex items-center gap-2">
            <Clock size={14} className="text-slate-500" /> Configure payout preferences in Settings
          </li>
        </ul>
      </div>
    </div>
  );
}

function ApplicationsView({
  applications,
  onUpdateStatus,
  onRemove,
  readOnly,
  refreshButton,
  sectionError,
  compact = false,
}) {
  const statusIcon = {
    Draft: Clock,
    Submitted: Loader,
    Interview: Sparkles,
    Won: CheckCircle,
    Closed: XCircle,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        {compact ? (
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Applications</h3>
            <div className="flex flex-wrap gap-2">{refreshButton}</div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-slate-900">Applications</h2>
            <p className="text-sm text-slate-600">
              Track responses and progression across every opportunity you have added to your pipeline.
            </p>
            <div className="flex flex-wrap gap-2">{refreshButton}</div>
          </>
        )}
      </div>

      {sectionError}

      {!applications.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No applications tracked yet. Add opportunities from the Jobs tab to start logging progress.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Opportunity</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Company</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Tracked</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application) => {
                  const Icon = statusIcon[application.status] || Clock;
                  return (
                    <tr key={application.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {application.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{application.company}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="text-slate-500" />
                          <select
                            value={application.status}
                            onChange={(event) => onUpdateStatus(application.id, event.target.value)}
                            disabled={readOnly}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            {APPLICATION_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(application.trackedAt || application.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemove(application.id)}
                        disabled={readOnly}
                        className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:bg-transparent"
                      >
                        {readOnly ? "Sync to edit" : "Remove"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
function NotificationsView({
  activity,
  onMarkRead,
  onDismiss,
  onClear,
  readOnly,
  refreshButton,
  sectionError,
  compact = false,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          {compact ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Notifications</p>
              <h3 className="text-lg font-semibold text-slate-900">Alerts</h3>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-slate-900">Notifications</h2>
              <p className="text-sm text-slate-600">
                Sync events, pipeline updates, and reminders land here. Mark them as read or clear once actioned.
              </p>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {refreshButton}
          {activity.length ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={readOnly}
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      {sectionError}

      {!activity.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          You are all caught up. Updates from profile saves and pipeline changes will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {readOnly ? (
            <p className="text-xs text-slate-500">
              These are synced reminders from the dashboard. Refresh your workspace to manage real-time alerts.
            </p>
          ) : null}
          {activity.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-2xl border p-4 ${
                entry.read
                  ? "border-slate-200 bg-white"
                  : "border-indigo-200 bg-indigo-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                  {entry.description ? (
                    <p className="text-xs text-slate-600 mt-1">{entry.description}</p>
                  ) : null}
                  <p className="text-xs text-slate-400 mt-2">
                    {formatRelativeTime(entry.timestamp)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!entry.read && !readOnly && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(entry.id)}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDismiss(entry.id)}
                    disabled={readOnly}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarButton({ icon: Icon, label, isActive, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {Icon ? (
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${
          isActive ? "bg-white/15" : "bg-slate-100 text-slate-600"
        }`}>
          <Icon size={18} />
        </span>
      ) : null}
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, helper, tone = "neutral" }) {
  const palette = {
    neutral: {
      card: "bg-white border border-slate-200",
      label: "text-slate-500",
      helper: "text-slate-500",
      icon: "bg-slate-100 text-slate-600",
    },
    positive: {
      card: "bg-emerald-50 border border-emerald-200",
      label: "text-emerald-600",
      helper: "text-emerald-600",
      icon: "bg-white text-emerald-600",
    },
    warning: {
      card: "bg-amber-50 border border-amber-200",
      label: "text-amber-600",
      helper: "text-amber-600",
      icon: "bg-white text-amber-600",
    },
  };
  const colors = palette[tone] || palette.neutral;

  return (
    <div className={`rounded-xl p-4 shadow-sm ${colors.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${colors.label}`}>{label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
          {helper ? <p className={`mt-1 text-xs ${colors.helper}`}>{helper}</p> : null}
        </div>
        {Icon ? (
          <span className={`inline-flex rounded-full p-2 ${colors.icon}`}>
            <Icon size={18} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default AssociateDashboard;

