import { createElement, useMemo } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  PenTool,
  LineChart,
  History,
  Hammer,
  Video,
  LifeBuoy,
} from "lucide-react";
import { useApi } from "../lib/ctx";

const NAV_STACK = [
  { key: "Dashboard", label: "Overview", icon: LayoutDashboard },
  { key: "Inventory", label: "Inventory", icon: Package },
  { key: "OrderMaterial", label: "Procurement", icon: ShoppingBag },
  { key: "DesignDetails", label: "Design Studio", icon: PenTool },
  { key: "FinanceReport", label: "Finance", icon: LineChart },
  { key: "History", label: "Timeline", icon: History },
  { key: "Support", label: "Supported", icon: LifeBuoy, href: "https://builtattic.streamlit.app/" },
];

const MODE_BADGES = [
  { key: "design",       title: "Design Mode",       icon: PenTool,     description: "Coordinate design deliverables, approvals, and creative assets.", status: "idle" },
  { key: "construction", title: "Construction Mode", icon: Hammer,      description: "Track site logistics, crew readiness, and material delivery windows.", status: "idle" },
  { key: "procurement",  title: "Procurement",       icon: ShoppingBag, description: "Monitor sourcing status, supplier SLAs, and delivery commitments.", status: "idle" },
  { key: "monitoring",   title: "Site Monitoring",   icon: Video,       description: "Tap into drone flyovers and live room scans when feeds go active.", status: "idle" },
];

const buildClassName = (parts) => parts.filter(Boolean).join(" ");
const statusDot = (s) =>
  ({ live: "bg-green-500", warning: "bg-amber-500", error: "bg-red-500", idle: "bg-border" }[s] || "bg-border");

// inline SVGs that ignore inherited transparency
const ModeSVG = ({ k, active }) => {
  const color = active ? "#4F8CFF" : "#0f172a"; // accent or slate-900
  const props = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "block", opacity: 1 } };
  switch (k) {
    case "design":
      return (
        <svg {...props}>
          <path d="M12 19l7-7-5-5-7 7-2 5 5-2z" />
          <path d="M16 7l1.5 1.5" />
        </svg>
      );
    case "construction":
      return (
        <svg {...props}>
          <path d="M14 4l6 6" />
          <path d="M11 7l-8 8v5h5l8-8" />
          <path d="M7 13l4 4" />
        </svg>
      );
    case "procurement":
      return (
        <svg {...props}>
          <path d="M6 6h15l-1.5 9H7.5L6 6z" />
          <circle cx="9" cy="20" r="1.75" />
          <circle cx="17" cy="20" r="1.75" />
        </svg>
      );
    case "monitoring":
      return (
        <svg {...props}>
          <path d="M3 7h14v10H3z" />
          <path d="M17 11l4-2v6l-4-2" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
};

export default function Sidebar({
  collapsed = false,
  mobileOpen = false,
  isDesktop = false,
  onNavigate,
  onToggleCollapse,
}) {
  const { activeSidebar, setActiveSidebar, modes, activeMode, setActiveMode } = useApi() || {};
  const effectiveCollapsed = isDesktop ? collapsed : false;

  const containerClasses = useMemo(
    () =>
      buildClassName([
        "relative z-40 flex flex-col gap-6 rounded-[40px] border border-border/50 bg-surface shadow-card transition-[width,height] duration-300",
        effectiveCollapsed ? "lg:w-[92px] w-[76px] lg:p-4 p-3" : "lg:w-[260px] w-full lg:p-6 p-5",
        isDesktop ? "hidden lg:flex" : mobileOpen ? "fixed top-20 left-4 right-4 flex max-h-[calc(100vh-120px)] overflow-y-auto backdrop-blur" : "hidden",
      ]),
    [effectiveCollapsed, isDesktop, mobileOpen],
  );

  const modesSource = (modes && modes.length ? modes : MODE_BADGES).map((m) => ({
    ...m,
    key: m.key || m.name,
    title: m.title || m.label || m.name,
    iconKey: (m.key || m.name),
    status: m.status || "idle",
    description: m.description || m.summary || "Activate this space to surface contextual data.",
  }));

  const handleNav = (item) => {
    if (item?.href) {
      try {
        window?.open(item.href, "_blank", "noopener,noreferrer");
      } catch {
        window?.open(item.href, "_blank");
      }
      if (!isDesktop) onNavigate?.();
      return;
    }
    setActiveSidebar?.(item?.key);
    if (!isDesktop) onNavigate?.();
  };

  const renderModeBadge = (mode) => {
    const isActive = activeMode ? mode.key === activeMode : false;

    if (effectiveCollapsed) {
      return (
        <button
          key={mode.key}
          type="button"
          onClick={() => setActiveMode?.(mode.key)}
          title={mode.title}
          aria-label={mode.title}
          aria-pressed={isActive}
          className={buildClassName([
            "relative w-full h-12 rounded-2xl border border-border/60 bg-surface-soft transition hover:border-border-strong",
            "flex items-center justify-center",
          ])}
        >
          <ModeSVG k={mode.iconKey} active={isActive} />
          <span
            aria-hidden
            className={buildClassName([
              "absolute bottom-1 right-1 h-2 w-2 rounded-full shadow",
              statusDot(mode.status),
              mode.status === "live" && "animate-pulse",
            ])}
          />
        </button>
      );
    }

    // expanded: keep lucide
    const Icon = MODE_BADGES.find(x => x.key === mode.key)?.icon || PenTool;
    return (
      <button
        key={mode.key}
        type="button"
        onClick={() => setActiveMode?.(mode.key)}
        aria-pressed={isActive}
        className={buildClassName([
          "w-full rounded-2xl border border-border/60 bg-surface px-4 py-3 text-left transition hover:border-border-strong",
          "overflow-hidden",
          isActive && "border-[rgba(79,140,255,0.45)] bg-[rgba(79,140,255,0.16)]",
        ])}
      >
        <div className="flex items-start gap-3">
          {createElement(Icon, {
            className: "mt-0.5 h-4 w-4 flex-none",
            strokeWidth: 2.2,
            stroke: isActive ? "#4F8CFF" : "#64748b",
            fill: "none",
            "aria-hidden": true,
          })}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-textPrimary truncate">{mode.title}</p>
            <p className="mt-1 text-xs text-textMuted leading-snug line-clamp-3">{mode.description}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <aside className={containerClasses}>
      <div className="flex items-center justify-between">
        {!effectiveCollapsed && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-textMuted">Matters</p>
            <h2 className="mt-1 text-lg font-semibold text-textPrimary">Control Center</h2>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface-soft text-textMuted hover:text-textPrimary"
          aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {effectiveCollapsed ? ">" : "<"}
        </button>
      </div>

      <nav className={buildClassName(["flex", effectiveCollapsed ? "flex-col items-center gap-4" : "flex-col gap-3"])}>
        {NAV_STACK.map((item) => {
          const { icon, label, key } = item;
          const active = !item.href && activeSidebar === key;
          const IconColor = active ? "#4F8CFF" : "#64748b";
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleNav(item)}
              className={buildClassName([
                "group inline-flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm transition",
                active ? "bg-[rgba(79,140,255,0.16)] text-[var(--color-accent)]" : "hover:bg-surface-soft text-textMuted",
                effectiveCollapsed ? "justify-center" : "justify-start",
              ])}
              title={label}
            >
              {createElement(icon, { className: "h-4 w-4", strokeWidth: 2.2, stroke: IconColor, fill: "none", "aria-hidden": true })}
              {!effectiveCollapsed && <span className="font-medium">{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={buildClassName(["rounded-[28px] border border-border/60 bg-surface-soft", effectiveCollapsed ? "p-3 space-y-3" : "p-4 space-y-3"])}>
        {!effectiveCollapsed && <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-textMuted">Modes</p>}
        {modesSource.map(renderModeBadge)}
      </div>
    </aside>
  );
}
