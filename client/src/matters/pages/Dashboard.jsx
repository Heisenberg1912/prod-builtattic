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
  ClipboardList,
  HardHat,
  Package,
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
  permits: [
    {
      id: "structural-phase-3",
      title: "Phase 3 structural certificate",
      authority: "Kaduna Development Authority",
      owner: "Aisha Bello",
      due: "2025-01-04",
      status: "watch",
      stage: "Awaiting stamped load calculations",
      deliverables: ["Upload seismic calc addendum", "Confirm egress update"],
      attachments: 4,
      lastTouch: "2024-12-29T09:30:00Z",
    },
    {
      id: "fire-suppression",
      title: "Fire suppression tie-in",
      authority: "Federal Fire Service",
      owner: "Chinedu Ajayi",
      due: "2024-12-28",
      status: "blocked",
      stage: "Hold pending pressure test witness",
      deliverables: ["Schedule joint hydro test", "Share valve schedule"],
      attachments: 6,
      lastTouch: "2024-12-26T16:15:00Z",
    },
    {
      id: "utility-easement",
      title: "Utility easement registration",
      authority: "Gonin Gora Utility Board",
      owner: "Maryam Yusuf",
      due: "2025-01-12",
      status: "cleared",
      stage: "Signed by land registry",
      deliverables: ["Courier wet copy", "Upload stamped plans"],
      attachments: 2,
      lastTouch: "2024-12-27T08:00:00Z",
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
  actions: [
    {
      id: "handover-av",
      title: "Verify AV rough-ins on level 12",
      owner: "QA team",
      status: "pending",
      eta: "2024-12-28T10:30:00Z",
      tags: ["MEP", "Quality"],
      impact: "High",
    },
    {
      id: "louver-repair",
      title: "Replace damaged louvers along facade stack B",
      owner: "Envelope crew",
      status: "in-progress",
      eta: "2024-12-30T08:00:00Z",
      tags: ["Facade"],
      impact: "Medium",
    },
    {
      id: "permit-pack",
      title: "Assemble utility turnout dossier",
      owner: "Design ops",
      status: "blocked",
      eta: "2025-01-02T16:00:00Z",
      tags: ["Permitting", "Docs"],
      impact: "High",
    },
    {
      id: "crew-induction",
      title: "Run safety induction for swing shift",
      owner: "HSE",
      status: "pending",
      eta: "2024-12-29T06:30:00Z",
      tags: ["Safety"],
      impact: "Medium",
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


const FOCUS_SHORTCUTS = [
  { key: "Inventory", title: "Inventory pulse", description: "Balance call-offs vs. site draw.", icon: Package },
  { key: "OrderMaterial", title: "Procurement", description: "Release call-offs and RFQs.", icon: ClipboardList },
  { key: "DesignDetails", title: "Design studio", description: "Review drops & markups.", icon: Sparkles },
  { key: "History", title: "Timeline", description: "Issue & incident log.", icon: CalendarDays },
  { key: "FinanceReport", title: "Finance", description: "Drawdowns and exposure.", icon: HardHat },
];

const ACTION_FILTERS = [
  { key: "pending", label: "Open" },
  { key: "in-progress", label: "Active" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Cleared" },
  { key: "all", label: "All" },
];

const ACTION_STATUS_META = {
  pending: { label: "Pending", tone: "bg-amber-500/15 text-amber-600" },
  "in-progress": { label: "In progress", tone: "bg-sky-500/15 text-sky-600" },
  blocked: { label: "Blocked", tone: "bg-rose-500/15 text-rose-600" },
  done: { label: "Cleared", tone: "bg-emerald-500/15 text-emerald-600" },
  all: { label: "All", tone: "bg-slate-500/10 text-slate-500" },
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

const normalizeActionList = (list = []) =>
  list.map((item, index) => ({
    id: item.id || item.slug || `action-${index}`,
    title: item.title || item.name || item.summary || `Action ${index + 1}`,
    owner: item.owner || item.lead || item.assignee || "Unassigned",
    status: (item.status || item.state || "pending").toLowerCase(),
    eta: item.eta || item.due || item.deadline,
    impact: item.impact || item.priority || "Medium",
    tags: Array.isArray(item.tags)
      ? item.tags
      : item.tag
      ? [item.tag]
      : item.focus
      ? [item.focus]
      : [],
    description: item.description || item.notes || "",
  }));

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

const PERMIT_STATUS_META = {
  cleared: {
    label: "Cleared",
    helper: "Ready to release",
    pillClass: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
  },
  watch: {
    label: "Watch",
    helper: "Needs follow-up",
    pillClass: "bg-amber-500/15 text-amber-600 border border-amber-500/30",
  },
  blocked: {
    label: "Blocked",
    helper: "Escalate today",
    pillClass: "bg-rose-500/15 text-rose-600 border border-rose-500/30",
  },
};

const normalizePermitStatus = (value = "") => {
  const normalized = String(value).toLowerCase();
  if (/clear|approve|sign/.test(normalized)) return "cleared";
  if (/block|hold|stop|risk/.test(normalized)) return "blocked";
  return "watch";
};

const coerceDeliverables = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry) return "";
        if (typeof entry === "string") return entry.trim();
        if (typeof entry === "object") return entry.label || entry.name || entry.title || entry.task || "";
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,•;\n]/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);
  }
  return [];
};

const formatPermitDate = (value) => {
  if (!value) return "TBD";
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) return value;
  return ts.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const permitDaysUntil = (value) => {
  if (!value) return null;
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) return null;
  return Math.ceil((ts.getTime() - Date.now()) / 86400000);
};

const relativeDueLabel = (value) => {
  const diff = permitDaysUntil(value);
  if (diff === null) return "No deadline set";
  if (diff < -1) return `${Math.abs(diff)} days past due`;
  if (diff === -1) return "1 day past due";
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
};

const formatPermitRelative = (value) => {
  if (!value) return "just now";
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) return value;
  const diff = Date.now() - ts.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const dueToneClass = (value) => {
  const diff = permitDaysUntil(value);
  if (diff === null) return "text-textMuted";
  if (diff < 0) return "text-rose-500";
  if (diff <= 2) return "text-amber-500";
  return "text-textPrimary";
};

const formatShortDate = (value) => {
  if (!value) return "";
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) return value;
  return ts.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};


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



function FocusShortcuts({ onSelect }) {
  return (
    <section className="rounded-3xl border border-border bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 sm:px-6 py-3">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-textMuted">Quick focus</p>
          <p className="text-sm text-textPrimary/80">Jump into the workspace you need</p>
        </div>
        <span className="text-[11px] text-textMuted">Tap to pivot the main canvas</span>
      </div>
      <div className="grid gap-3 px-4 sm:px-6 py-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FOCUS_SHORTCUTS.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.key}
              type="button"
              onClick={() => onSelect?.(shortcut.key)}
              className="w-full rounded-2xl border border-border/70 bg-surface-soft px-3 py-3 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:border-border"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-textPrimary truncate">{shortcut.title}</p>
                  <p className="text-[11px] text-textMuted truncate">{shortcut.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ActionBoard({ items = [] }) {
  const [filter, setFilter] = useState("pending");
  const [tasks, setTasks] = useState(() => normalizeActionList(items));

  useEffect(() => {
    setTasks(normalizeActionList(items));
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((task) => task.status === filter);
  }, [tasks, filter]);

  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  const handleToggleStatus = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === "done" ? "pending" : "done" }
          : task,
      ),
    );
  };

  const visibleTasks = filtered.length ? filtered : tasks;

  return (
    <section className="rounded-3xl border border-border bg-surface shadow-card" aria-label="Action board">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 sm:px-6 py-3 sm:py-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-textMuted">Action board</p>
          <p className="text-sm text-textPrimary/80">{total ? `${completed}/${total} cleared` : "No tracked items"}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-textMuted">
          <span className="flex items-center gap-1 rounded-full border border-border px-2 py-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {progress}%
          </span>
          <div className="hidden sm:block h-1.5 w-24 rounded-full bg-border">
            <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4 sm:px-6 py-3">
        {ACTION_FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
              filter === option.key ? "border-[var(--color-accent)] text-[var(--color-accent)]" : "border-border text-textMuted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-5">
        {visibleTasks.length ? (
          visibleTasks.map((task) => {
            const tone = ACTION_STATUS_META[task.status] || ACTION_STATUS_META.pending;
            return (
              <article key={task.id} className="rounded-2xl border border-border/70 bg-surface-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-textPrimary line-clamp-2">{task.title}</p>
                    <p className="text-[11px] text-textMuted">Owner: {task.owner}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${tone.tone}`}>{tone.label || "Pending"}</span>
                </div>

                {task.description && <p className="mt-2 text-sm text-textMuted line-clamp-2">{task.description}</p>}

                {task.tags.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <span key={`${task.id}-tag-${index}`} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-textPrimary/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-textMuted">
                  <span className={dueToneClass(task.eta)}>{relativeDueLabel(task.eta)}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-textMuted">
                      {task.impact}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task.id)}
                      className="rounded-full border border-border px-3 py-1 text-[11px] font-medium text-textPrimary hover:text-[var(--color-accent)]"
                    >
                      {task.status === "done" ? "Reopen" : "Mark cleared"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-border/70 bg-surface-soft p-4 text-sm text-textMuted">
            No tasks match this filter.
          </p>
        )}
      </div>
    </section>
  );
}

function UpcomingDeliveries({ items = [] }) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <section className="rounded-3xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 sm:px-6 py-3">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-textMuted">Upcoming deliveries</p>
          <p className="text-sm text-textPrimary/80">Latest call-offs heading to site</p>
        </div>
        <span className="text-[11px] text-textMuted">{items.length} queued</span>
      </div>
      <div className="divide-y divide-border/60">
        {items.map((item, index) => (
          <div key={`${item.label || 'delivery'}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-textPrimary truncate">{item.label || `Delivery ${index + 1}`}</p>
              <p className="text-xs text-textMuted truncate">{item.note || item.status || 'Awaiting update'}</p>
            </div>
            <span className="text-xs text-textMuted">{item.eta || 'ETA pending'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineBoard({ title = 'Timeline', events = [] }) {
  if (!Array.isArray(events) || !events.length) {
    return <PlaceholderPanel title={title} description="Connect project data to populate this view." />;
  }
  return (
    <section className="rounded-3xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 sm:px-6 py-3">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-textMuted">{title}</p>
          <p className="text-sm text-textPrimary/80">Recent approvals, holds, and releases</p>
        </div>
        <span className="text-[11px] text-textMuted">{events.length} items</span>
      </div>
      <div className="divide-y divide-border/60">
        {events.map((event) => {
          const tone = ACTION_STATUS_META[event.status] || ACTION_STATUS_META.pending;
          return (
            <article key={event.id} className="flex flex-col gap-2 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-wrap items-center justify-between text-[11px] text-textMuted">
                <span>{formatShortDate(event.date)}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone.tone}`}>{tone.label}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-textPrimary">{event.title}</p>
                {event.impact && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-textMuted">{event.impact}</span>
                )}
              </div>
              {event.summary && <p className="text-sm text-textMuted">{event.summary}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HeroCollage({ images = [], weather, projects }) {
  const safeImages = images.length ? images : FALLBACK_DASHBOARD.gallery.slice(0, 3);
  const onSchedule = Math.round((projects?.onSchedule ?? FALLBACK_DASHBOARD.projects.onSchedule) * 100);
  const activeProjects = projects?.active ?? FALLBACK_DASHBOARD.projects.active;
  const backlog = projects?.backlog ?? FALLBACK_DASHBOARD.projects.backlog;
  const location = weather?.location || FALLBACK_DASHBOARD.weather.location;
  const temperature = weather?.temperature ?? FALLBACK_DASHBOARD.weather.temperature;
  const condition = weather?.condition ?? FALLBACK_DASHBOARD.weather.condition;

  return (
    <section className="rounded-[32px] border border-border bg-gradient-to-r from-[rgba(7,12,24,0.95)] via-[rgba(17,24,39,0.92)] to-[rgba(30,41,59,0.9)] text-white shadow-card">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.6fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)]">
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">Field pulse</p>
          <div className="flex flex-wrap items-end gap-3">
            <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">{temperature}°C</h2>
            <span className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.25em]">{condition}</span>
          </div>
          <p className="text-sm text-white/80">{location}</p>
          <div className="grid grid-cols-3 gap-3 text-center text-[11px] uppercase tracking-[0.2em]">
            <div className="rounded-2xl border border-white/15 bg-white/5 px-2 py-3">
              <p className="text-2xl font-semibold tracking-normal">{activeProjects}</p>
              <p className="mt-1 text-[10px] text-white/70">Active</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-2 py-3">
              <p className="text-2xl font-semibold tracking-normal">{backlog}</p>
              <p className="mt-1 text-[10px] text-white/70">Queued</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-2 py-3">
              <p className="text-2xl font-semibold tracking-normal">{onSchedule}%</p>
              <p className="mt-1 text-[10px] text-white/70">On track</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-white/80">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1">
              <Sun className="h-4 w-4 text-amber-200" />
              UV moderate
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1">
              <Droplets className="h-4 w-4 text-sky-200" />
              {weather?.humidity ?? "58"}% humidity
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1">
              <Wind className="h-4 w-4 text-cyan-200" />
              {weather?.wind ?? "11"} km/h winds
            </span>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:p-6 lg:grid-cols-2">
          {safeImages.map((item, index) => (
            <div key={`${item.label}-${index}`} className="relative min-h-[140px] overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="relative flex h-full flex-col justify-between p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">{item.label}</p>
                <p className="text-sm font-semibold text-white">Mood capture</p>
              </div>
            </div>
          ))}
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1024px)").matches;
  });
  const previewCards = cards.slice(0, 4);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(max-width: 1024px)");
    const handler = (event) => setCollapsed(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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

      {/* body shows compact previews on mobile and full grid on desktop */}
      {collapsed ? (
        <div className="px-4 sm:px-6 pb-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {previewCards.map((card) => (
              <div
                key={`${card.id}-preview`}
                className="flex-shrink-0 w-36 sm:w-40 overflow-hidden rounded-2xl border border-border/60 bg-surface-soft"
              >
                <div className="relative h-40">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    sizes="144px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,17,27,0.9)] via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 space-y-1 p-2 text-white">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/70">{card.badge}</span>
                    <p className="text-sm font-semibold leading-snug line-clamp-2">{card.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 sm:px-6 pb-5 sm:pb-6">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 sm:gap-4">
              {cards.map((card) => (
                <article key={card.id} className="group relative overflow-hidden rounded-3xl aspect-[3/4] min-w-0">
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

function PermitPipelinePanel({ items, loading }) {
  const normalizedItems = useMemo(() => {
    const source = Array.isArray(items) && items.length ? items : FALLBACK_DASHBOARD.permits;
    return source.map((raw, index) => {
      const status = normalizePermitStatus(raw.status || raw.state || raw.health);
      return {
        id: raw.id || raw.slug || `permit-${index}`,
        title: raw.title || raw.name || raw.package || `Permit ${index + 1}`,
        authority: raw.authority || raw.agency || raw.jurisdiction || raw.issuer || raw.department || "Local authority",
        owner: raw.owner || raw.assignee || raw.point_of_contact || raw.poc || raw.manager || "Unassigned",
        due: raw.due || raw.deadline || raw.target_date || raw.next_decision,
        status,
        stage: raw.stage || raw.phase || raw.next_step || raw.summary || "",
        deliverables: coerceDeliverables(raw.deliverables || raw.dependencies || raw.requirements || raw.blockers),
        attachments: Number(raw.attachments ?? (Array.isArray(raw.documents) ? raw.documents.length : 0)) || 0,
        lastTouch: raw.lastTouch || raw.updated_at || raw.updatedAt || raw.last_update,
      };
    });
  }, [items]);

  const summary = useMemo(() => {
    const base = { cleared: 0, watch: 0, blocked: 0 };
    normalizedItems.forEach((item) => {
      base[item.status] = (base[item.status] || 0) + 1;
    });
    return base;
  }, [normalizedItems]);

  const timeline = useMemo(() => {
    return normalizedItems
      .slice()
      .sort((a, b) => {
        const aTime = a.due ? new Date(a.due).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.due ? new Date(b.due).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      })
      .slice(0, 3);
  }, [normalizedItems]);

  const showSkeleton = loading && (!items || !items.length);
  if (showSkeleton) return <SectionSkeleton lines={5} minH="min-h-[360px]" />;

  const nextDecision = timeline[0];

  return (
    <section className="rounded-3xl border border-border bg-surface shadow-card" aria-label="Permit readiness">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 sm:px-6 py-3 sm:py-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-textMuted">Compliance</p>
          <h3 className="text-base sm:text-lg font-semibold text-textPrimary">Permit readiness</h3>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] sm:text-xs text-textMuted hover:text-textPrimary"
        >
          View log
          <Eye className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-4 px-4 sm:px-6 py-4 sm:py-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(PERMIT_STATUS_META).map(([key, meta]) => {
            const count = summary[key] ?? 0;
            const percent = normalizedItems.length ? Math.round((count / normalizedItems.length) * 100) : 0;
            return (
              <div key={key} className="rounded-2xl border border-border/60 bg-surface-soft p-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-textMuted">{meta.label}</p>
                <p className="text-2xl font-semibold text-textPrimary">{count}</p>
                <p className="text-[11px] text-textMuted">
                  {meta.helper}
                  {normalizedItems.length ? ` · ${percent}%` : ""}
                </p>
              </div>
            );
          })}
        </div>

        {nextDecision && (
          <div className="rounded-2xl border border-border/60 bg-surface-soft px-4 py-3 sm:px-5 sm:py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-textMuted">Next decision</p>
              <p className="text-sm font-semibold text-textPrimary truncate">{nextDecision.title}</p>
              <p className="text-xs text-textMuted truncate">{nextDecision.authority}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className={`text-sm font-semibold ${dueToneClass(nextDecision.due)}`}>{formatPermitDate(nextDecision.due)}</p>
              <p className="text-[11px] text-textMuted">{relativeDueLabel(nextDecision.due)}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border/70 bg-surface-alt divide-y divide-border/60">
          {timeline.length ? (
            timeline.map((pkg) => {
              const statusMeta = PERMIT_STATUS_META[pkg.status] || PERMIT_STATUS_META.watch;
              return (
                <article key={pkg.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5 sm:py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-textPrimary truncate">{pkg.title}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusMeta.pillClass}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-textMuted truncate">
                      {pkg.authority} · Owner: {pkg.owner}
                    </p>
                    {pkg.stage && <p className="text-xs text-textPrimary/80 line-clamp-2">{pkg.stage}</p>}
                    {pkg.deliverables.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {pkg.deliverables.slice(0, 3).map((item, index) => (
                          <span key={`${pkg.id}-deliverable-${index}`} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-textPrimary">
                            {item}
                          </span>
                        ))}
                        {pkg.deliverables.length > 3 && (
                          <span className="text-[11px] text-textMuted">+{pkg.deliverables.length - 3} more</span>
                        )}
                      </div>
                    ) : null}
                    <p className="text-[11px] text-textMuted">Updated {formatPermitRelative(pkg.lastTouch)}</p>
                  </div>
                  <div className="w-full sm:w-[190px] space-y-2 text-left sm:text-right">
                    <div>
                      <p className={`text-sm font-semibold ${dueToneClass(pkg.due)}`}>{formatPermitDate(pkg.due)}</p>
                      <p className="text-[11px] text-textMuted">{relativeDueLabel(pkg.due)}</p>
                    </div>
                    <div className="text-[11px] text-textMuted">
                      {pkg.attachments ? `${pkg.attachments} doc${pkg.attachments === 1 ? "" : "s"}` : "No docs"}
                    </div>
                    <button
                      type="button"
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-border px-3 py-2 text-xs font-medium text-textPrimary hover:text-[var(--color-accent)]"
                    >
                      Log follow-up
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="px-4 py-6 text-center text-sm text-textMuted">Add permit packages to begin tracking.</p>
          )}
        </div>
      </div>
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
    setActiveSidebar,
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

  const heroImages = useMemo(() => {
    if (galleryCategories && galleryCategories.length) {
      return galleryCategories.slice(0, 3);
    }
    return FALLBACK_DASHBOARD.gallery.slice(0, 3);
  }, [galleryCategories]);

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

  const permitPackages = useMemo(() => {
    const direct = Array.isArray(summary?.permits) ? summary.permits : [];
    if (direct.length) return direct;
    const compliance = Array.isArray(summary?.compliance?.packages) ? summary.compliance.packages : [];
    if (compliance.length) return compliance;
    const regulatory = Array.isArray(summary?.regulatory?.permits) ? summary.regulatory.permits : [];
    if (regulatory.length) return regulatory;
    return FALLBACK_DASHBOARD.permits;
  }, [summary]);

  const priorityActions = useMemo(() => {
    const primary = Array.isArray(summary?.actions) ? summary.actions : [];
    if (primary.length) return normalizeActionList(primary);
    const checklist = Array.isArray(summary?.checklist) ? summary.checklist : [];
    if (checklist.length) return normalizeActionList(checklist);
    const fallbacks = Array.isArray(FALLBACK_DASHBOARD.actions) ? FALLBACK_DASHBOARD.actions : [];
    return normalizeActionList(fallbacks);
  }, [summary]);

  const timelineEvents = useMemo(() => {
    const actions = (priorityActions || []).map((task) => ({
      id: `action-${task.id}`,
      title: task.title,
      summary: task.description || `Owner: ${task.owner}`,
      date: task.eta,
      status: task.status,
      impact: task.impact || '' ,
      type: task.tags?.some((tag) => /doc|permit|procure/i.test(tag || '')) ? 'procurement' : 'action',
    }));
    const permits = (permitPackages || []).map((pkg) => ({
      id: `permit-${pkg.id}`,
      title: pkg.title,
      summary: pkg.stage || pkg.authority,
      date: pkg.due,
      status: pkg.status || 'watch',
      impact: pkg.authority,
      type: 'permit',
    }));
    const all = [...actions, ...permits];
    const valueOf = (entry) => {
      const ts = new Date(entry.date || 0);
      return Number.isNaN(ts.getTime()) ? Infinity : ts.getTime();
    };
    return all.sort((a, b) => valueOf(a) - valueOf(b));
  }, [priorityActions, permitPackages]);

  const procurementTimeline = useMemo(() => timelineEvents.filter((event) => event.type === 'permit' || event.type === 'procurement'), [timelineEvents]);
  const financeTimeline = useMemo(() => timelineEvents.filter((event) => ['blocked', 'watch', 'cleared'].includes(event.status)), [timelineEvents]);
  const inventoryDeliveries = useMemo(() => (Array.isArray(inventoryData?.incoming) ? inventoryData.incoming : []), [inventoryData]);


  const handleSidebarToggle = () => {
    if (isDesktop) setSidebarCollapsed((prev) => !prev);
    else setSidebarMobileOpen((prev) => !prev);
  };

  const handleRefreshDashboard = () => {
    refreshAll?.();
    refreshWeather?.();
  };

  const handleFocusShortcut = useCallback(
    (key) => {
      if (!key) return;
      setActiveSidebar?.(key);
      if (!isDesktop) {
        window?.scrollTo?.({ top: 0, behavior: "smooth" });
      }
    },
    [setActiveSidebar, isDesktop],
  );

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

      <HeroCollage images={heroImages} weather={weatherData} projects={projectSummary} />
      <FocusShortcuts onSelect={handleFocusShortcut} />

      {/* Primary layout */}
      <div className="grid gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-5 lg:space-y-6">
          <div className="grid gap-4 lg:gap-5 lg:grid-cols-2">
            <BudgetOverview data={budgetData} loading={loading?.budget} />
            <InventoryStatus data={inventoryData} loading={loading?.inventory} />
          </div>

          <MilestoneRail stages={milestoneData} loading={loading?.milestones} />

          <div className="grid gap-4 lg:gap-5 lg:grid-cols-2">
            <WeatherCard data={weatherData} loading={loading?.weather} onRefresh={() => refreshWeather?.()} />
            <ActiveProjectsCard data={projectSummary} loading={loading?.projects} />
          </div>

          <ProductShowcase loading={loading?.catalogue} />
          <ActionBoard items={priorityActions} />
        </div>

        <div className="space-y-5 lg:space-y-6">
          <GalleryCategories categories={galleryCategories} loading={loading?.gallery} />
          <PermitPipelinePanel items={permitPackages} loading={loading?.summary} />
          <AssociateChatPanel />
        </div>
      </div>

    </div>
  );

  const InventoryView = (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <InventoryStatus data={inventoryData} loading={loading?.inventory} />
        <PermitPipelinePanel items={permitPackages} loading={loading?.summary} />
      </div>
      <UpcomingDeliveries items={inventoryDeliveries} />
      <GalleryCategories categories={galleryCategories} loading={loading?.gallery} />
    </div>
  );

  const ProcurementView = (
    <div className="space-y-5 lg:space-y-6">
      <ProductShowcase items={FALLBACK_DASHBOARD.catalogue} loading={loading?.catalogue} />
      <TimelineBoard title="Procurement log" events={procurementTimeline} />
    </div>
  );

  const FinanceView = (
    <div className="space-y-5 lg:space-y-6">
      <BudgetOverview data={budgetData} loading={loading?.budget} />
      <TimelineBoard title="Finance timeline" events={financeTimeline} />
    </div>
  );

  const TimelineView = (
    <div className="space-y-5 lg:space-y-6">
      <TimelineBoard events={timelineEvents} />
      <ActionBoard items={priorityActions} />
    </div>
  );

  const DesignView = (
    <div className="space-y-5 lg:space-y-6">
      <ProductShowcase items={FALLBACK_DASHBOARD.catalogue} loading={loading?.catalogue} />
      <GalleryCategories categories={galleryCategories} loading={loading?.gallery} />
    </div>
  );

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
    <div className="relative min-h-[calc(var(--vh,1vh)*100)] overflow-x-hidden bg-base text-textPrimary">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--color-accent)]/20 blur-[120px] opacity-70" />
        <div className="absolute bottom-0 right-6 h-64 w-64 rounded-full bg-surface-alt/70 blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,140,255,0.15),_transparent_60%)]" />
      </div>
      {/* Dim overlay on mobile when sidebar open */}
      {!isDesktop && sidebarMobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarMobileOpen(false)} aria-hidden="true" />
      )}

      <div className="relative mx-auto flex w-full max-w-\[1680px\] flex-col gap-4 sm:gap-6 px-4 sm:px-6 lg:px-10 pt-4 pb-[calc(env(safe-area-inset-bottom,0)+96px)] lg:pb-16 lg:flex-row">
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



