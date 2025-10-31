import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";

import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Hammer,
  LayoutGrid,
  Paintbrush,
  RefreshCcw,
  Shovel,
  Sparkles,
  Sun,
  Wind,
  Eye,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import { useApi } from "../lib/ctx";
import { api } from "../lib/api";

/* -----------------------------------------------------------------------------
   Dynamic Mobile-Optimized Dashboard (v2 - fixes from screenshot analysis)
   • Reserve bottom safe-area so floating FAB/chat doesn’t cover content
   • Safe FAB offsets with iOS/Android safe areas
   • Tighter xs spacing + fluid fonts to prevent header/metric truncation
   • “Inventory 518/600 units” line: no-wrap + tabular numbers to avoid split “1/1”
   • Smaller, wrap-safe sticky header on tiny phones
   • Defensive line-clamp and whitespace handling on tight cards
-------------------------------------------------------------------------------- */

/* ------------------------------- Mobile helpers ------------------------------ */
// Set a CSS variable --vh that equals 1% of the viewport height
function useMobileViewportUnit() {
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", setVh);
    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
    };
  }, []);
}

const FALLBACK_DASHBOARD = {
  budget: {
    total: 2600000,
    used: 1800000,
    currency: "USD",
    breakdown: [
      { label: "Material", percent: 45 },
      { label: "Labor", percent: 40 },
      { label: "Misc", percent: 15 },
    ],
  },
  inventory: {
    capacity: 600,
    available: 518,
    units: [
      { label: "Steel Beams", value: "125 tons" },
      { label: "Concrete", value: "340 m³" },
      { label: "Equipment", value: "8 units" },
      { label: "Safety Gear", value: "45 sets" },
    ],
    incoming: [
      { label: "Floor finish batch A2", note: "Arrives in ~4 hrs" },
      { label: "Lighting pod fixtures", note: "3 units queued" },
    ],
  },
  milestones: [
    { key: "excavation", label: "Excavation", status: "complete" },
    { key: "foundation", label: "Foundation", status: "complete" },
    { key: "structure", label: "Structure", status: "active" },
    { key: "interiors", label: "Interiors", status: "upcoming" },
    { key: "finishing", label: "Finishing", status: "upcoming" },
  ],
  weather: {
    temperature: 27,
    condition: "Clear sky",
    location: "Gonin Gora, Kaduna",
    date: "2025-12-23T09:30:00+01:00",
    humidity: 58,
    wind: 11,
    precipitation: 0,
  },
  projects: {
    active: 5,
    onSchedule: 0.85,
    owner: {
      name: "Mike Chen",
      role: "Project Owner",
      avatar:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
    },
    backlog: 3,
    nextInspection: "2025-02-10",
  },
  gallery: [
    {
      label: "Animals",
      image:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Art",
      image:
        "https://images.unsplash.com/photo-1465311440653-ba9b1d9b0f5b?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Cars",
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Nature",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Sports",
      image:
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Religion",
      image:
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "People",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Sky",
      image:
        "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Architecture",
      image:
        "https://images.unsplash.com/photo-1529429617124-aee7887287b1?auto=format&fit=crop&w=400&q=80",
    },
  ],
  catalogue: [
    {
      id: "aurora",
      badge: "Live",
      title: "Aurora Ridge Villa",
      description:
        "Modular hillside villa kit with passive cooling decks and panoramic glazing.",
      image:
        "https://images.unsplash.com/photo-1529429617124-aee7887287b1?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "drift",
      badge: "New",
      title: "Driftwood Boardwalk",
      description:
        "Prefab timber promenade with integrated retail pods and shade sails.",
      image:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "nebula",
      badge: "Live",
      title: "Nebula Workspace",
      description:
        "Biophilic co-working floors with acoustic clouds and wellness loops.",
      image:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "solstice",
      badge: "Beta",
      title: "Solstice Resort Pods",
      description:
        "Beachfront hospitality pods with tidal pools and storytelling decks.",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    },
  ],
};

const ICON_MAP = {
  excavation: Shovel,
  foundation: Hammer,
  structure: LayoutGrid,
  interiors: Paintbrush,
  finishing: Sparkles,
};

/* --------------------------------- Utilities -------------------------------- */
const SCOPE_KEYWORDS = [
  "civil",
  "structur",
  "architect",
  "architecture",
  "beam",
  "column",
  "foundation",
  "footing",
  "slab",
  "roof",
  "floor",
  "envelope",
  "facade",
  "layout",
  "plan",
  "drawing",
  "code",
  "spec",
  "concrete",
  "steel",
  "load",
  "site",
  "construction",
  "inspection",
  "schedule",
  "mep",
  "detailing",
  "zoning",
];

const matchesScope = (text) => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return SCOPE_KEYWORDS.some((term) => normalized.includes(term));
};

const SCOPE_REMINDER =
  "I'm here for civil engineering and architectural guidance. Ask about structural sequencing, detailing, code compliance, materials, or spatial planning.";

const enforceScopedAnswer = (text) => {
  if (text && matchesScope(text)) return text.trim();
  return SCOPE_REMINDER;
};

const formatCurrency = (value, currency = "USD") => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "--";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
};

const formatNumber = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "--";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value));
};

const resolveImage = (entry, index = 0) =>
  entry?.preview_url ||
  entry?.thumbnail_url ||
  entry?.image_url ||
  entry?.hero_image ||
  entry?.url ||
  `${FALLBACK_DASHBOARD.catalogue[0].image}&sig=${index}`;

/* --------------------------------- Skeletons -------------------------------- */

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-[rgba(146,170,200,0.22)] ${className}`} />
);

function SectionSkeleton({ lines = 3, minH = "min-h-[220px]" }) {
  return (
    <section className={`rounded-3xl border border-border bg-surface shadow-card ${minH}`}>
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <Skeleton className="h-4 w-28 sm:w-32 rounded" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-[88%] sm:w-[90%] rounded" />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Components -------------------------------- */

function BudgetOverview({ data, loading }) {
  if (loading) return <SectionSkeleton lines={5} minH="min-h-[300px]" />;

  const total = Number(data?.total || 0);
  const used = Number(data?.used || 0);
  const currency = data?.currency || "USD";
  const usedPercent = total > 0 ? Math.round(Math.min((used / total) * 100, 100)) : 0;

  const breakdown = Array.isArray(data?.breakdown) ? data.breakdown : [];

  return (
    <section
      aria-label="Budget overview"
      className="relative overflow-hidden rounded-3xl border border-border bg-surface-alt text-white shadow-card"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(79,140,255,0.45), transparent 55%), linear-gradient(160deg, rgba(28,38,56,0.95) 0%, rgba(17,25,38,0.94) 60%, rgba(13,20,32,0.98) 100%)",
        }}
      />
      <div className="relative flex flex-col gap-5 sm:gap-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
              Budget overview
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white leading-tight">
              {formatCurrency(used || total, currency)}
            </h2>
            <p className="text-[11px] sm:text-xs text-white/80 truncate">
              Used of {formatCurrency(total || FALLBACK_DASHBOARD.budget.total, currency)}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-white/85 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            {usedPercent}% utilised
          </span>
        </div>

        <div className="grid gap-5 sm:gap-6 md:grid-cols-[minmax(0,220px)_1fr] md:items-center">
          <div className="flex justify-center">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32">
              <div
                className="absolute inset-0 rounded-full border border-white/10"
                style={{
                  background: `conic-gradient(var(--color-accent) ${
                    usedPercent * 3.6
                  }deg, rgba(255,255,255,0.08) 0deg)`,
                }}
              />
              <div className="absolute inset-4 sm:inset-5 flex flex-col items-center justify-center gap-1.5 rounded-full bg-[rgba(15,20,32,0.92)] px-3 text-center">
                <span className="text-[22px] sm:text-[26px] font-semibold leading-tight">{usedPercent}%</span>
                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                  Complete
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {breakdown.map((item) => {
              const amount = total
                ? item.amount ?? (item.percent ? (item.percent / 100) * total : 0)
                : item.amount;

              const percent = item.percent ?? (total ? Math.round((amount / total) * 100) : 0);
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-3 text-sm backdrop-blur"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white/85 truncate">{item.label}</span>
                    <span className="text-white/80 whitespace-nowrap">{percent}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/80">{formatCurrency(amount || 0, currency)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function InventoryStatus({ data, loading }) {
  if (loading) return <SectionSkeleton lines={6} minH="min-h-[340px]" />;

  const capacity = Number(data?.capacity || FALLBACK_DASHBOARD.inventory.capacity);
  const available = Number(data?.available || FALLBACK_DASHBOARD.inventory.available);
  const percent = capacity > 0 ? Math.round((available / capacity) * 100) : 0;

  const units =
    Array.isArray(data?.units) && data.units.length
      ? data.units
      : FALLBACK_DASHBOARD.inventory.units;

  const incoming =
    Array.isArray(data?.incoming) && data.incoming.length
      ? data.incoming
      : FALLBACK_DASHBOARD.inventory.incoming;

  return (
    <section
      aria-label="Inventory status"
      className="rounded-3xl border border-border bg-surface shadow-card min-h-[300px] sm:min-h-[340px] flex flex-col"
    >
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-textMuted">
          Inventory
        </p>
        <h3 className="text-base sm:text-lg font-semibold text-textPrimary">Materials available</h3>
      </div>

      <div className="space-y-4 sm:space-y-5 px-4 sm:px-6 py-4 sm:py-5 flex-1 flex flex-col">
        {/* stock level bar */}
        <div>
          <div className="flex items-center justify-between text-xs sm:text-sm text-textMuted">
            <span className="whitespace-nowrap tabular-nums">
              {available}/{capacity} units
            </span>
            <span className="whitespace-nowrap tabular-nums">{percent}% stocked</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[rgba(146,170,200,0.18)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>

        {/* on-site materials */}
        <div className="flex-1">
          <ul className="space-y-2 text-sm text-textPrimary">
            {units.map((item, idx) => (
              <li
                key={`${item.label}-${idx}`}
                className="flex items-center justify-between rounded-2xl bg-surface-soft px-3 sm:px-4 py-2"
              >
                <span className="truncate pr-2">{item.label}</span>
                <span className="font-semibold text-textMuted whitespace-nowrap tabular-nums">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* incoming deliveries */}
        <div className="rounded-2xl border border-border bg-surface-soft px-3 sm:px-4 py-3">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.25em] text-textMuted mb-2">
            Next deliveries
          </p>
          <ul className="space-y-2 text-[12px] sm:text-xs text-textPrimary">
            {incoming.map((drop, i) => (
              <li key={i} className="flex items-start justify-between gap-3">
                <span className="font-medium text-textPrimary truncate pr-2">{drop.label}</span>
                <span className="text-textMuted whitespace-nowrap">{drop.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function MilestoneRail({ stages, loading }) {
  if (loading) return <SectionSkeleton lines={4} minH="min-h-[220px]" />;

  const total = stages.length || 1;
  const completeCount = stages.filter((stage) => stage.status === "complete").length;
  const activeCount = stages.filter((stage) => stage.status === "active").length;
  const progress = Math.round(((completeCount + activeCount * 0.5) / total) * 100);

  return (
    <section aria-label="Project milestones" className="rounded-3xl border border-border bg-surface shadow-card">
      <div className="flex flex-col gap-4 px-4 sm:px-6 py-4 sm:py-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-textMuted">
              Project milestones
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-textPrimary">{progress}% complete</h3>
          </div>
        </header>

        <div className="flex items-stretch justify-between gap-2 overflow-x-auto snap-x">
          {stages.map((stage) => {
            const Icon = ICON_MAP[stage.key] || CheckCircle2;
            const status = stage.status;
            const statusClasses =
              status === "complete"
                ? "bg-[rgba(46,197,110,0.18)] text-[rgba(46,197,110,1)]"
                : status === "active"
                ? "bg-[rgba(79,140,255,0.18)] text-[var(--color-accent)]"
                : "bg-surface-soft text-textMuted";
            return (
              <div
                key={stage.key}
                className="flex min-w-[88px] sm:min-w-[104px] snap-start flex-col items-center gap-3 text-center"
              >
                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${statusClasses}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-textPrimary line-clamp-1">{stage.label}</p>
              </div>
            );
          })}
        </div>

        <div className="h-2 rounded-full bg-[rgba(146,170,200,0.18)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function WeatherCard({ data, loading, onRefresh }) {
  if (loading) return <SectionSkeleton lines={5} minH="min-h-[220px]" />;

  const date = data?.date ? new Date(data.date) : null;
  const formattedDate = date
    ? date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })
    : "Tuesday, 23 December";
  const time = date ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "09:30";
  const temperature = Math.round(data?.temperature ?? FALLBACK_DASHBOARD.weather.temperature);
  const humidity = Math.round(data?.humidity ?? FALLBACK_DASHBOARD.weather.humidity);
  const wind = Math.round(data?.wind ?? FALLBACK_DASHBOARD.weather.wind);
  const nextCheck = data?.nextCheck || "4 hrs";

  const weatherHighlights = [
    { label: "", value: `${humidity}%`, icon: Droplets },
    { label: "", value: `${wind} km/h`, icon: Wind },
    { label: "", value: nextCheck, icon: CalendarDays },
  ];

  return (
    <section
      aria-label="Weather"
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-white via-[#eef3ff] to-[#dde7ff] shadow-card text-textPrimary"
    >
      <div className="flex flex-col gap-5 sm:gap-6 p-4 sm:p-6">
        <header className="flex items-center justify-between text-xs sm:text-sm text-textMuted">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-textMuted">
              Weather
            </p>
            <p className="text-xs sm:text-sm text-textMuted truncate">
              {data?.location || FALLBACK_DASHBOARD.weather.location}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh weather"
            aria-label="Refresh weather"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-textPrimary transition hover:bg-slate-100 disabled:opacity-60 touch-manipulation"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-end gap-2 sm:gap-3">
            <span className="text-4xl sm:text-5xl font-semibold flex items-start gap-1 tabular-nums">
              <span>{temperature}</span>
              <span className="text-xl sm:text-2xl font-semibold mt-1">°C</span>
            </span>
            <Sun className="mb-1 h-7 w-7 sm:h-8 sm:w-8 text-[var(--color-accent)]" aria-hidden="true" />
          </div>
          <p className="text-sm text-textPrimary/80">{data?.condition || FALLBACK_DASHBOARD.weather.condition}</p>
          <p className="text-xs text-textMuted">{formattedDate} • {time}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {weatherHighlights.map(({ label, value, icon: Icon }, idx) => (
            <div
              key={`${label}-${value}-${idx}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white px-2.5 sm:px-3 py-3 sm:py-4 text-center shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-textMuted">
                {label}
              </p>
              <p className="text-sm sm:text-base font-semibold leading-tight text-textPrimary tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActiveProjectsCard({ data, loading }) {
  if (loading) return <SectionSkeleton lines={5} minH="min-h-[220px]" />;

  const onSchedule = Number(data?.onSchedule ?? FALLBACK_DASHBOARD.projects.onSchedule);
  const owner = data?.owner || FALLBACK_DASHBOARD.projects.owner;

  return (
    <section aria-label="Portfolio" className="rounded-3xl border border-border bg-surface shadow-card">
      <div className="space-y-4 px-4 sm:px-6 py-4 sm:py-5">
        <header className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-textMuted">
              Portfolio
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-textPrimary">
              {data?.active ?? FALLBACK_DASHBOARD.projects.active} active projects
            </h3>
          </div>
          <span className="badge text-[11px] sm:text-xs whitespace-nowrap tabular-nums">
            {Math.round(onSchedule * 100)}% on schedule
          </span>
        </header>

        <div className="space-y-4">
          <div className="h-2 rounded-full bg-[rgba(146,170,200,0.18)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${Math.min(onSchedule * 100, 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-surface-soft p-3">
            <img
              src={owner.avatar}
              alt={owner.name}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover"
              loading="lazy"
              sizes="(max-width: 640px) 36px, 40px"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-textPrimary truncate">{owner.name}</p>
              <p className="text-xs text-textMuted">{owner.role}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-textMuted">
            <span className="whitespace-nowrap">{data?.backlog ?? FALLBACK_DASHBOARD.projects.backlog} queued</span>
            <span className="whitespace-nowrap">
              Next inspection: {data?.nextInspection ?? FALLBACK_DASHBOARD.projects.nextInspection}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function GalleryCategories({ categories, loading }) {
  if (loading) return <SectionSkeleton lines={6} minH="min-h-[260px]" />;

  const items = categories && categories.length ? categories.slice(0, 9) : FALLBACK_DASHBOARD.gallery;

  return (
    <section
      aria-label="Photo gallery"
      className="relative overflow-hidden rounded-3xl border border-border bg-surface-alt text-white shadow-card"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(24, 34, 51, 0.92) 0%, rgba(15, 23, 36, 0.88) 70%, rgba(13, 20, 30, 0.95) 100%)",
        }}
      />
      <div className="relative flex flex-col gap-4 p-4 sm:p-6">
        <header className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/70">
              Photo Gallery
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-white">Site inspiration</h3>
          </div>
          <button
            type="button"
            aria-label="View all photos"
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs text-white/80 transition hover:bg-white/20 touch-manipulation"
          >
            View all <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </header>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(94px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="group relative aspect-square overflow-hidden rounded-2xl">
              <img
                src={item.image}
                alt={item.label}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none"
                loading="lazy"
                sizes="(max-width: 640px) 33vw, 200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <span className="absolute bottom-2 left-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-white">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** PRODUCT SHOWCASE — collapsible, starts collapsed */
function ProductShowcase({ items, loading }) {
  if (loading) return <SectionSkeleton lines={6} minH="min-h-[320px]" />;

  const cards = items && items.length ? items : FALLBACK_DASHBOARD.catalogue;
  const [browserOpen, setBrowserOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  return (
    <section aria-label="Systems catalogue" className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
      {/* header row with collapse toggle */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-start gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-textMuted">
              Systems
            </p>
            {!collapsed && (
              <h3 className="text-[clamp(1rem,0.8rem+0.8vw,1.25rem)] font-semibold text-textPrimary">
                Featured catalogue drops
              </h3>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label={collapsed ? "Expand systems panel" : "Collapse systems panel"}
          title={collapsed ? "Expand" : "Collapse"}
          onClick={() => setCollapsed((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface-soft text-textMuted hover:text-textPrimary touch-manipulation"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" aria-hidden="true" /> : <ChevronDown className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* body only when expanded */}
      {!collapsed && (
        <>
          <div className="px-4 sm:px-6 pb-5 sm:pb-6">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 sm:gap-4">
              {cards.map((card) => (
                <article key={card.id} className="group relative overflow-hidden rounded-3xl aspect-[4/5] min-w-0">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none"
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,17,27,0.95)] via-[rgba(12,17,27,0.55)] to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 space-y-3 p-3 sm:p-4 text-white">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="badge">{card.badge}</span>
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <h4 className="min-w-0 text-[clamp(1rem,0.9rem+0.6vw,1.375rem)] font-semibold leading-tight">
                      {card.title}
                    </h4>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        aria-label={`View ${card.title}`}
                        title={`View ${card.title}`}
                        onClick={() => (window.location.href = `/systems/${card.id}`)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] shadow-sm transition-transform hover:scale-105 active:scale-95 touch-manipulation"
                      >
                        <Eye className="h-5 w-5 text-white" strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {browserOpen && (
            <div className="absolute bottom-6 right-6 z-20 w-[min(320px,calc(100%-3rem))] rounded-3xl border border-border bg-surface-soft shadow-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-textMuted">Catalogue</p>
                  <h4 className="text-sm font-semibold text-textPrimary">Full drops</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setBrowserOpen(false)}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-textMuted transition hover:text-textPrimary"
                >
                  Close
                </button>
              </div>
              <div className="max-h-80 space-y-3 overflow-y-auto px-5 py-4">
                {cards.map((card) => (
                  <div key={`${card.id}-full`} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surface px-3 py-3">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-12 w-12 flex-shrink-0 rounded-2xl object-cover"
                      loading="lazy"
                      sizes="48px"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs text-textMuted">
                        <span className="font-semibold text-textPrimary truncate pr-2">{card.title}</span>
                        <span className="badge-muted">{card.badge}</span>
                      </div>
                      <p className="text-xs text-textMuted line-clamp-2">{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AssociateChatPanel() {
  const { activeMode, chatConfig } = useApi() || {};

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      persona: "ai assistant",
      content:
        "Demo civil & architectural associate online. Share structural sequencing, detailing, code compliance, or spatial planning questions and I'll respond with discipline-specific guidance.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const endRef = useRef(null);

  const scrollToBottom = (behavior = "auto") => endRef.current?.scrollIntoView({ behavior, block: "end" });

  useLayoutEffect(() => {
    scrollToBottom("auto");
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length, sending]);

  const modelLabel = useMemo(() => {
    const rawModel =
      (typeof chatConfig?.model === "string" && chatConfig.model) ||
      (typeof chatConfig?.provider === "string" && chatConfig.provider) ||
      "";
    if (rawModel.toLowerCase().includes("gemini")) return rawModel.replace(/_/g, " ");
    return "";
  }, [chatConfig]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage = { role: "user", content: trimmed, timestamp: new Date().toISOString() };
    setInput("");

    if (!matchesScope(trimmed)) {
      setMessages((prev) => [
        ...prev,
        userMessage,
        { role: "assistant", persona: "ai assistant", content: SCOPE_REMINDER, timestamp: new Date().toISOString() },
      ]);
      return;
    }

    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setSending(true);
    setError("");

    try {
      const payload = { mode: activeMode, messages: conversation.map(({ role, content }) => ({ role, content })) };
      const { reply, persona } = await api.postAssistant(payload);
      const filteredReply = enforceScopedAnswer(reply);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", persona: persona || "ai assistant", content: filteredReply, timestamp: new Date().toISOString() },
      ]);
    } catch (err) {
      const fallback =
        err?.message && err.message.toLowerCase().includes("gemini")
          ? "The Demo civil/architecture assistant is temporarily unavailable. Let's try again in a moment."
          : SCOPE_REMINDER;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", persona: "ai assistant", content: fallback, timestamp: new Date().toISOString() },
      ]);

      setError(err?.message || "Assistant temporarily unavailable");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex min-h-0 flex-col rounded-3xl border border-border bg-surface-soft shadow-card md:sticky md:top-6 max-h-[min(80vh,calc(var(--vh,1vh)*80))] overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-textMuted">
            Associate Chat
          </p>
          <h3 className="text-base sm:text-lg font-semibold text-textPrimary">Demo Civil & Architectural Associate</h3>
        </div>
        <span className="badge-muted text-[11px] sm:text-xs">{modelLabel}</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={listRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto overscroll-contain scroll-smooth px-4 sm:px-6 py-3 sm:py-4">
          {messages.map((message, index) => {
            const isAssistant = message.role !== "user";
            return (
              <div key={`${message.role}-${index}`} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                <div
                  className={
                    isAssistant
                      ? "max-w-[92%] sm:max-w-[90%] rounded-2xl border border-border bg-surface px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-textPrimary"
                      : "max-w-[92%] sm:max-w-[90%] rounded-2xl bg-[var(--color-accent)] px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white shadow-sm"
                  }
                >
                  {isAssistant && message.persona && (
                    <p className="mb-1 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.22em] sm:tracking-[0.25em] text-textMuted">
                      {message.persona.replace(/(^|\s)([a-z])/g, (match) => match.toUpperCase())}
                    </p>
                  )}
                  <p className={`whitespace-pre-line ${isAssistant ? "text-textPrimary" : "text-white"}`}>{message.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 border-t border-border px-4 sm:px-6 py-3 sm:py-4">
          {error && error.trim() && <p className="text-xs text-rose-500">{error}</p>}
          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
              placeholder="Queries related to ongoing construction"
              className="flex-1 resize-y rounded-2xl border border-border bg-surface px-3 sm:px-4 py-2.5 text-sm text-textPrimary outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={sending}
              className="h-10 sm:h-11 min-w-[72px] rounded-2xl bg-[var(--color-accent)] px-3 sm:px-4 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60 touch-manipulation"
            >
              {sending ? "Sending" : "Send"}
            </button>
          </div>
          <p className="text-[10px] sm:text-[11px] text-textMuted">
            Note: This is a demo assistant. Responses are generated based on provided data and may not reflect real-world accuracy.
          </p>
        </form>
      </div>
    </section>
  );
}

function PlaceholderPanel({ title, description }) {
  return (
    <section className="grid place-items-center rounded-3xl border border-dashed border-border bg-surface-soft p-10 sm:p-12 text-center text-sm text-textMuted">
      <div className="w-full max-w-sm space-y-3">
        <h3 className="text-base sm:text-lg font-semibold text-textPrimary">{title}</h3>
        <p className="text-[13px] sm:text-sm">{description}</p>
      </div>
    </section>
  );
}

/* ------------------------------ Main Dashboard ------------------------------ */

export default function Dashboard() {
  useMobileViewportUnit();

  const {
    summary,
    inventory,
    weather,
    gallery,
    kpis,
    chatConfig,
    refreshAll,
    refreshWeather,
    loading,
    activeSidebar,
  } = useApi() || {};

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  // Body scroll lock when mobile sidebar open + ESC/Backdrop close
  useEffect(() => {
    if (!sidebarMobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") setSidebarMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarMobileOpen]);

  // Media query sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsDesktop(media.matches);
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setSidebarMobileOpen(false);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isDesktop]);

  // Passive refresh on visibility gain / online
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshAll?.();
        refreshWeather?.();
      }
    };
    const onOnline = () => {
      refreshAll?.();
      refreshWeather?.();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [refreshAll, refreshWeather]);

  /* ---------------------------- Derived data (defensive) ---------------------------- */
  const budgetData = useMemo(() => {
    const fallback = FALLBACK_DASHBOARD.budget;
    const raw = summary?.budget || summary?.financials || {};
    const total = Number(raw.total ?? raw.overall ?? fallback.total);
    const used = Number(raw.used ?? raw.spent ?? fallback.used);
    const breakdownSource = Array.isArray(raw.breakdown) ? raw.breakdown : fallback.breakdown;
    const breakdown = breakdownSource.map((item) => ({
      label: item.label || item.name || item.category || "Category",
      percent: item.percent ?? (item.amount && total ? Math.round((item.amount / total) * 100) : 0),
      amount: item.amount,
    }));
    return { total, used, currency: raw.currency || fallback.currency, breakdown };
  }, [summary]);

  const inventoryData = useMemo(() => {
    if (Array.isArray(inventory) && inventory.length) {
      const capacity = inventory.reduce(
        (acc, item) => acc + Number(item.capacity ?? item.max ?? item.quantity ?? 0),
        0,
      );
      const available = inventory.reduce(
        (acc, item) => acc + Number(item.available ?? item.quantity ?? 0),
        0,
      );
      const units = inventory.slice(0, 4).map((item) => ({
        label: item.label || item.name || item.category || "Item",
        value:
          item.display_value ||
          (item.quantity && item.unit ? `${item.quantity} ${item.unit}` : formatNumber(item.available ?? item.capacity ?? 0)),
      }));
      const incoming =
        Array.isArray(inventory.incoming) && inventory.incoming.length
          ? inventory.incoming.map((d) => ({ label: d.label || d.name || "Incoming", note: d.note || d.eta || "Queued" }))
          : FALLBACK_DASHBOARD.inventory.incoming;
      return { capacity: capacity || FALLBACK_DASHBOARD.inventory.capacity, available: available || FALLBACK_DASHBOARD.inventory.available, units, incoming };
    }
    return FALLBACK_DASHBOARD.inventory;
  }, [inventory]);

  const milestoneData = useMemo(() => {
    if (Array.isArray(summary?.milestones) && summary.milestones.length) {
      return summary.milestones.slice(0, 5).map((item, index) => ({
        key: item.key || item.slug || `milestone-${index}`,
        label: item.label || item.title || item.name || `Stage ${index + 1}`,
        status: item.status || (item.completed ? "complete" : item.active ? "active" : "upcoming"),
      }));
    }
    if (kpis?.milestones && Array.isArray(kpis.milestones)) {
      return kpis.milestones.slice(0, 5).map((item, index) => ({
        key: item.key || `kpi-${index}`,
        label: item.label || item.name || `Stage ${index + 1}`,
        status: item.value >= 1 ? "complete" : item.value > 0 ? "active" : "upcoming",
      }));
    }
    return FALLBACK_DASHBOARD.milestones;
  }, [summary, kpis]);

  const weatherData = useMemo(() => {
    if (weather?.current) {
      return {
        temperature: weather.current.temperature ?? weather.current.temp,
        condition: weather.current.summary || weather.current.description,
        location: weather.location?.name || weather.location?.city,
        date: weather.current.observed_at,
        humidity: weather.current.humidity,
        wind: weather.current.wind_speed,
        precipitation: weather.current.precipitation,
      };
    }
    return weather || FALLBACK_DASHBOARD.weather;
  }, [weather]);

  const galleryCategories = useMemo(() => {
    if (Array.isArray(gallery) && gallery.length) {
      return gallery.slice(0, 9).map((item, index) => ({
        label: item.category || item.mode || item.tag || `Capture ${index + 1}`,
        image: resolveImage(item, index),
      }));
    }
    return FALLBACK_DASHBOARD.gallery;
  }, [gallery]);

  const projectSummary = useMemo(() => {
    if (summary?.projects) {
      return {
        active: summary.projects.active ?? summary.projects.live ?? FALLBACK_DASHBOARD.projects.active,
        onSchedule: summary.projects.on_schedule ?? summary.projects.health ?? FALLBACK_DASHBOARD.projects.onSchedule,
        owner: summary.projects.owner || FALLBACK_DASHBOARD.projects.owner,
        backlog: summary.projects.backlog ?? FALLBACK_DASHBOARD.projects.backlog,
        nextInspection: summary.projects.next_inspection ?? FALLBACK_DASHBOARD.projects.nextInspection,
      };
    }
    return FALLBACK_DASHBOARD.projects;
  }, [summary]);

  const handleSidebarToggle = () => {
    if (isDesktop) setSidebarCollapsed((prev) => !prev);
    else setSidebarMobileOpen((prev) => !prev);
  };

  const handleRefreshDashboard = () => {
    refreshAll?.();
    refreshWeather?.();
  };

  /* ---------------------------- Views bound to sidebar ---------------------------- */

  const DashboardView = (
    <div className="space-y-6 sm:space-y-8">
      {/* Header row with sticky mobile top bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 -mt-2 mb-2 bg-base/85 backdrop-blur supports-[backdrop-filter]:bg-base/60 px-4 sm:px-6 py-2.5 sm:py-3 rounded-b-2xl sm:static sm:m-0 sm:p-0 sm:bg-transparent sm:backdrop-blur-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={sidebarMobileOpen ? "Close menu" : "Open menu"}
            onClick={handleSidebarToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-textPrimary lg:hidden touch-manipulation"
          >
            {sidebarMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface-soft text-textPrimary">
              <LayoutGrid className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="text-right sm:text-left">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] sm:tracking-[0.3em] text-textPrimary">
                Matters Control Center
              </p>
              <p className="text-[11px] sm:text-xs text-textMuted">Realtime snapshot of site delivery</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefreshDashboard}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium text-textMuted hover:text-textPrimary touch-manipulation"
          >
            <RefreshCcw className={`h-4 w-4 ${loading?.weather || loading?.all ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
            Sync
          </button>
        </div>
      </div>

      {/* Main adaptive grid: collapses to single column on small screens */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1fr)]">
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px] 2xl:grid-cols-[340px_minmax(0,1fr)_340px]">
          <div className="space-y-4 sm:space-y-6">
            <BudgetOverview data={budgetData} loading={loading?.budget} />
            <InventoryStatus data={inventoryData} loading={loading?.inventory} />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <MilestoneRail stages={milestoneData} loading={loading?.milestones} />
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <WeatherCard data={weatherData} loading={loading?.weather} onRefresh={() => refreshWeather?.()} />
              <ActiveProjectsCard data={projectSummary} loading={loading?.projects} />
            </div>
            <ProductShowcase loading={loading?.catalogue} />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <GalleryCategories categories={galleryCategories} loading={loading?.gallery} />
            <PlaceholderPanel title="Site broadcasts" description="Live camera feeds and drone flyovers will stream here once activated." />
            <AssociateChatPanel />
          </div>
        </div>
      </div>
    </div>
  );

  const InventoryView = (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      <InventoryStatus data={inventoryData} loading={loading?.inventory} />
      <GalleryCategories categories={galleryCategories} loading={loading?.gallery} />
    </div>
  );

  const ProcurementView = (
    <PlaceholderPanel title="Procurement workspace" description="Create call-offs, compare vendor quotes, and release purchase orders directly from this panel." />
  );

  const FinanceView = (
    <PlaceholderPanel title="Finance dashboard" description="Track drawdowns, incoming invoices, and cashflow forecasts once the finance API is connected." />
  );

  const TimelineView = (
    <PlaceholderPanel title="Timeline" description="Issue logs and milestone journals will appear here once captured from the field teams." />
  );

  const DesignView = <ProductShowcase items={FALLBACK_DASHBOARD.catalogue} loading={loading?.catalogue} />;

  const contentBySidebar = {
    Dashboard: DashboardView,
    Inventory: InventoryView,
    OrderMaterial: ProcurementView,
    DesignDetails: DesignView,
    FinanceReport: FinanceView,
    History: TimelineView,
    MyDesign: DesignView,
  };

  const mainContent = contentBySidebar[activeSidebar || "Dashboard"] || DashboardView;

  return (
    <div className="min-h-[calc(var(--vh,1vh)*100)] overflow-x-hidden bg-base text-textPrimary">
      {/* Dim overlay on mobile when sidebar open */}
      {!isDesktop && sidebarMobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarMobileOpen(false)} aria-hidden="true" />
      )}

      <div className="relative mx-auto flex w-full max-w-[1680px] flex-col gap-4 sm:gap-6 px-4 sm:px-6 lg:px-10 pt-4 pb-[calc(env(safe-area-inset-bottom,0)+96px)] lg:pb-16 lg:flex-row">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={sidebarMobileOpen}
          isDesktop={isDesktop}
          onNavigate={() => setSidebarMobileOpen(false)}
          onToggleCollapse={handleSidebarToggle}
        />

        <main className="flex-1 space-y-4 sm:space-y-6">{mainContent}</main>

        {/* Mobile floating quick-actions button to reopen sidebar.
            Safe-area aware so it doesn't overlap content or chat widget. */}
        {!isDesktop && !sidebarMobileOpen && (
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarMobileOpen(true)}
            className="fixed z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg touch-manipulation
                       right-[calc(env(safe-area-inset-right,0)+1rem)]
                       bottom-[calc(env(safe-area-inset-bottom,0)+1rem)]"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}


