import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PlanUploadPanel from "../../components/dashboard/PlanUploadPanel.jsx";
import ServiceBundlePanel from "../../components/dashboard/ServiceBundlePanel.jsx";
import FeedbackPanel from "../../components/dashboard/FeedbackPanel.jsx";
import StudioDashboardCard from "../../components/studio/StudioDashboardCard.jsx";
import { fetchFirmDashboard } from "../../services/dashboard.js";

const InsightStat = ({ label, value, helper, accent = "bg-slate-900/5" }) => (
  <div className={`rounded-2xl border border-slate-200 ${accent} px-4 py-5 shadow-sm`}>
    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "-"}</p>
    {helper ? <p className="text-xs text-slate-500 mt-1">{helper}</p> : null}
  </div>
);

const QuickActionButton = ({ label, helper, to }) => (
  <Link
    to={to}
    className="flex flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300"
  >
    <span className="text-sm font-semibold text-slate-900">{label}</span>
    {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
  </Link>
);

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

const SkeletonRows = ({ rows = 3, heightClass = "h-14" }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className={`w-full rounded-2xl bg-slate-200/60 animate-pulse ${heightClass}`} />
    ))}
  </div>
);

const PipelineSkeleton = () => (
  <>
    <div className="grid gap-3 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
      ))}
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-48 rounded-2xl bg-slate-200/60 animate-pulse" />
      ))}
    </div>
  </>
);

const WorkspaceSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="h-32 rounded-2xl bg-slate-200/60 animate-pulse" />
    ))}
  </div>
);

const formatCurrency = (value, currency = "USD") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value ?? "-";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 100000 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};

const computePercentChange = (current, previous) => {
  const curr = Number(current);
  const prev = Number(previous);
  if (!Number.isFinite(curr) || !Number.isFinite(prev) || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

const formatPercentChange = (delta) => {
  if (!Number.isFinite(delta)) return null;
  if (delta === 0) return "0% vs last cycle";
  const direction = delta > 0 ? "+" : "-";
  return `${direction}${Math.abs(delta).toFixed(1)}% vs last cycle`;
};

const buildStudioEditHref = (studio, section) => {
  const base = studio?.slug ? `/portal/studio?edit=${encodeURIComponent(studio.slug)}` : "/portal/studio";
  if (!section) return base;
  const joinChar = base.includes("?") ? "&" : "?";
  return `${base}${joinChar}section=${encodeURIComponent(section)}`;
};

const editingShortcutsConfig = [
  { label: "Listing details", detail: "Update title, pricing, specs, and availability.", section: "details" },
  { label: "Gallery & hero", detail: "Swap hero imagery or reorder your media stack.", section: "gallery" },
  { label: "Service programs", detail: "Refresh the tiles under \"What this studio sells\".", section: "services" },
  { label: "Products & delivery", detail: "Maintain catalogue SKUs and delivery notes.", section: "products" },
  { label: "Pricing & CTA", detail: "Control the buy, wishlist, and inquiry CTAs.", section: "pricing" },
];

const firmNavSections = [
  { id: "overview", label: "Overview" },
  { id: "actions", label: "Quick actions" },
  { id: "pipeline", label: "Studios" },
  { id: "workspace", label: "Workspace" },
  { id: "workflow", label: "Workflow" },
  { id: "feedback", label: "Feedback" },
];

const StudioEditingPanel = ({ studio }) => {
  const shortcuts = editingShortcutsConfig.map((shortcut) => ({
    ...shortcut,
    href: buildStudioEditHref(studio, shortcut.section),
  }));
  const previewHref = studio?.slug ? `/studio/${studio.slug}` : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Studio page</p>
          <h3 className="text-base font-semibold text-slate-900">{studio?.title || "Untitled studio"}</h3>
          <p className="text-sm text-slate-500">{studio?.summary || studio?.description || "Use the shortcuts below to edit the published view."}</p>
        </div>
        {previewHref ? (
          <Link
            to={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
          >
            View live page
          </Link>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {shortcuts.map((shortcut) => (
          <Link
            key={`${studio?._id || studio?.slug || shortcut.section}-${shortcut.section}`}
            to={shortcut.href}
            className="rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300"
          >
            <p className="text-sm font-semibold text-slate-900">{shortcut.label}</p>
            <p className="text-xs text-slate-500">{shortcut.detail}</p>
          </Link>
        ))}
      </div>
    </article>
  );
};

export default function FirmDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [sectionStatus, setSectionStatus] = useState({});
  const mountedRef = useRef(true);

  const refreshDashboard = useCallback(
    async (sectionId) => {
      if (sectionId) {
        setSectionStatus((prev) => ({
          ...prev,
          [sectionId]: { ...prev[sectionId], loading: true, error: null },
        }));
      } else {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      try {
        const payload = await fetchFirmDashboard();
        if (!mountedRef.current) return payload;
        setState({ loading: false, data: payload, error: payload?.error || null });
        if (sectionId) {
          setSectionStatus((prev) => ({
            ...prev,
            [sectionId]: { loading: false, error: payload?.error || null },
          }));
        }
        return payload;
      } catch (error) {
        if (!mountedRef.current) return null;
        const message = error?.message || "Unable to load dashboard";
        if (sectionId) {
          setState((prev) => ({ ...prev, loading: false, error: prev.error || message }));
          setSectionStatus((prev) => ({
            ...prev,
            [sectionId]: { loading: false, error: message },
          }));
        } else {
          setState({ loading: false, data: null, error: message });
        }
        return null;
      }
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    refreshDashboard();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshDashboard]);

  const { loading, data, error } = state;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const feedback = data?.feedback || { average: null, count: 0, recent: [] };
  const firm = data?.firm || {};
  const metrics = data?.metrics || {};
  const studios = data?.studios || [];
  const nextActions = data?.nextActions || [];

  const currencyCode = metrics.currency || "USD";
  const statCards = useMemo(() => {
    const publishedCount = metrics.studiosPublished ?? studios.filter((s) => s.status === "published").length;
    const draftCount = metrics.draftStudios ?? studios.filter((s) => s.status !== "published").length;
    const publishedValue = metrics.publishedValue;
    const previousValue = metrics.previousPublishedValue ?? metrics.prevPublishedValue ?? null;
    const explicitTrend =
      Number.isFinite(metrics.publishedValueTrend)
        ? metrics.publishedValueTrend
        : Number.isFinite(metrics.publishedValueDeltaPercent)
          ? metrics.publishedValueDeltaPercent
          : null;
    const percentDelta = explicitTrend ?? computePercentChange(publishedValue, previousValue);
    const formattedValue = Number.isFinite(Number(publishedValue))
      ? formatCurrency(publishedValue, currencyCode)
      : "-";
    const helperLabel =
      formatPercentChange(percentDelta) ||
      (Number.isFinite(metrics.recentOrders) && metrics.recentOrders > 0
        ? `${metrics.recentOrders} recent orders`
        : Number.isFinite(metrics.documents) && metrics.documents > 0
          ? `${metrics.documents} synced docs`
          : currencyCode
            ? `in ${currencyCode}`
            : "");
    return [
      { label: "Published", value: publishedCount },
      { label: "Drafts", value: draftCount, helper: draftCount ? "needs review" : undefined },
      { label: "Value", value: formattedValue, helper: helperLabel },
    ];
  }, [currencyCode, metrics, studios]);

  const draftStudios = studios.filter((studio) => studio.status !== "published");
  const publishedStudios = studios.filter((studio) => studio.status === "published");

  const quickActions = useMemo(() => {
    const adaptive = [];
    if (!publishedStudios.length) {
      adaptive.push({
        label: "Publish your first tile",
        helper: "Drafts stay hidden. Launch the marketplace view.",
        to: "/portal/studio",
      });
    } else if (draftStudios.length) {
      adaptive.push({
        label: "Review drafts",
        helper: `${draftStudios.length} waiting for publish approval.`,
        to: "/portal/studio?section=details",
      });
    }
    if (!feedback.count) {
      adaptive.push({
        label: "Collect first review",
        helper: "Share your Design Studio link to gather sentiment.",
        to: "#feedback",
      });
    }
    if (nextActions.length > 0) {
      adaptive.push({
        label: "Triage workflow queue",
        helper: `${nextActions.length} reminders open.`,
        to: "#workflow",
      });
    }
    const base = [
      { label: "Create studio tile", helper: "Launch a new listing in minutes.", to: "/portal/studio" },
      { label: "Share workspace", helper: "Send the Design Studio brief form.", to: "/dashboard/firm#workspace" },
      { label: "Invite collaborator", helper: "Add an associate to your next project.", to: "/associates" },
      { label: "Sync pricing", helper: "Update bundles and payment CTAs.", to: "/portal/studio?section=pricing" },
    ];
    const deduped = [];
    const seen = new Set();
    [...adaptive, ...base].forEach((action) => {
      if (seen.has(action.label)) return;
      seen.add(action.label);
      deduped.push(action);
    });
    return deduped.slice(0, 4);
  }, [draftStudios.length, feedback.count, nextActions.length, publishedStudios.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Loading Design Studio workspace...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-2">
          <p className="text-sm text-rose-600">{error}</p>
          <button
            type="button"
            onClick={() => refreshDashboard()}
            className="text-xs font-semibold text-slate-900 underline"
          >
            Retry loading
          </button>
        </div>
      </div>
    );
  }

  const pipelineBreakdown = [
    { label: "Draft queue", value: draftStudios.length, helper: "needs publish review", href: "/portal/studio" },
    { label: "Live tiles", value: publishedStudios.length, helper: "visible on marketplace", href: "/studio" },
    { label: "To-do items", value: nextActions.length, helper: "workflow reminders", href: "#workflow" },
  ];

  const getSectionStatus = (sectionId) => sectionStatus[sectionId] || {};

  const isSectionRefreshing = (sectionId) => Boolean(getSectionStatus(sectionId).loading);

  const renderRefreshButton = (sectionId, label = "Refresh data") => {
    const status = getSectionStatus(sectionId);
    const refreshing = Boolean(status.loading);
    return (
      <button
        type="button"
        onClick={() => refreshDashboard(sectionId)}
        disabled={refreshing}
        className="text-xs font-semibold text-slate-900 underline disabled:opacity-50 disabled:no-underline"
      >
        {refreshing ? "Refreshing..." : label}
      </button>
    );
  };

  const renderSectionError = (sectionId, helperText) => {
    const message = getSectionStatus(sectionId).error;
    if (!message) return null;
    return (
      <p className="text-xs text-rose-600">{helperText ? `${message} — ${helperText}` : message}</p>
    );
  };

  const feedbackStatus = getSectionStatus("feedback");
  const pipelineRefreshing = isSectionRefreshing("pipeline");
  const workspaceRefreshing = isSectionRefreshing("workspace");
  const workflowRefreshing = isSectionRefreshing("workflow");

  const renderNavLinks = (onItemClick) => (
    <nav className="space-y-1">
      {firmNavSections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          onClick={onItemClick}
          className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          {section.label}
        </a>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-8">
        <aside className="sticky top-6 hidden w-64 shrink-0 self-start rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Navigate</p>
          {renderNavLinks()}
        </aside>
        <div className="flex-1 space-y-8">
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
            >
              {sidebarOpen ? "Hide menu" : "Show menu"}
            </button>
            {sidebarOpen ? (
              <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                {renderNavLinks(() => setSidebarOpen(false))}
              </div>
            ) : null}
          </div>

          <section id="overview" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.4em] text-slate-400 uppercase">Design Studio Control</p>
                <h1 className="text-3xl font-semibold text-slate-900">{firm.name || "Your studio"}</h1>
                <p className="text-sm text-slate-600 max-w-xl">
                  {firm.tagline || "Everything published by your team lives here. Use the quick actions to move faster."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/portal/studio"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open workspace
                </Link>
                <Link
                  to="/studio"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  View public page
                </Link>
              </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {statCards.map((card, index) => (
                <InsightStat key={card.label} {...card} accent={index === 0 ? "bg-emerald-50" : "bg-white"} />
              ))}
            </div>
          </section>

          <SectionShell
            id="actions"
            eyebrow="Action center"
            title="Quick controls"
            description="Use these shortcuts to handle the common publishing and client follow-ups."
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <QuickActionButton key={action.label} {...action} />
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="pipeline"
            eyebrow="Pipeline health"
            title="Studios and deliverables"
            description="A text-first tracker so you can decide what to work on next without scrolling through imagery."
            action={
              <div className="flex flex-wrap items-center gap-2">
                {renderRefreshButton("pipeline")}
                <Link to="/portal/studio" className="text-xs font-semibold text-slate-900 underline">
                  Manage studios
                </Link>
              </div>
            }
          >
            {renderSectionError("pipeline", "Some counts may be stale.")}
            {pipelineRefreshing ? (
              <PipelineSkeleton />
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  {pipelineBreakdown.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.3em]">{item.label}</p>
                      <p className="text-3xl font-semibold text-slate-900 mt-1">{item.value}</p>
                      <p className="text-xs text-slate-500">{item.helper}</p>
                      <Link to={item.href} className="mt-3 inline-flex text-xs font-semibold text-slate-900 underline">
                        Go to section
                      </Link>
                    </div>
                  ))}
                </div>
                {publishedStudios.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {publishedStudios.map((studio) => (
                      <StudioDashboardCard key={studio._id || studio.slug} studio={studio} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No published studios. Draft something new to activate the marketplace view.</p>
                )}
              </>
            )}
          </SectionShell>

          <SectionShell
            id="workspace"
            eyebrow="Workspace shortcuts"
            title="Editing panels"
            description="Jump straight into specific parts of a studio without opening the entire editor."
            action={
              <div className="flex flex-wrap items-center gap-2">
                {renderRefreshButton("workspace", "Refresh shortcuts")}
                <Link to="/portal/studio" className="text-xs font-semibold text-slate-900 underline">
                  Open editor
                </Link>
              </div>
            }
          >
            {renderSectionError("workspace", "Shortcuts may be out of date.")}
            {workspaceRefreshing ? (
              <WorkspaceSkeleton />
            ) : studios.length ? (
              <div className="space-y-4">
                {studios.map((studio) => (
                  <StudioEditingPanel key={`${studio._id || studio.slug || "studio"}-shortcuts`} studio={studio} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Publish a studio bundle to unlock editing shortcuts.</p>
            )}
          </SectionShell>

          <SectionShell
            id="workflow"
            eyebrow="Workflow"
            title="Operational queue"
            description="No gradients, no distractions—just the next things that need your attention."
            action={renderRefreshButton("workflow", "Refresh queue")}
          >
            {renderSectionError("workflow", "Try refreshing again if the queue looks stale.")}
            {workflowRefreshing ? (
              <SkeletonRows rows={3} heightClass="h-20" />
            ) : nextActions.length ? (
              <ul className="space-y-3">
                {nextActions.map((action, index) => (
                  <li key={`${action.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                        <p className="text-sm text-slate-500">{action.detail}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">#{index + 1}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No pending tasks. Keep publishing to unlock more visibility tips.</p>
            )}
          </SectionShell>

          <div id="feedback">
            <FeedbackPanel
              sectionLabel="Design Studio"
              title="Client sentiment"
              subtitle="Monitor how buyers are rating your firm across Builtattic."
              feedback={feedback}
              highlightVariant="light"
              emptyMessage="No client reviews yet. Share your Design Studio listing to collect feedback."
              action={renderRefreshButton("feedback", "Refresh feedback")}
              loading={isSectionRefreshing("feedback")}
              statusMessage={
                feedbackStatus.error
                  ? `${feedbackStatus.error} — pull the latest sentiment if this looks outdated.`
                  : null
              }
            />
          </div>

          <PlanUploadPanel role="firm" workspaceName="Design Studio" />
          <ServiceBundlePanel role="firm" workspaceName="Design Studio" />
        </div>
      </div>
    </div>
  );
}



