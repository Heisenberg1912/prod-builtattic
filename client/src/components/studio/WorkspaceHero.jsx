import React from "react";
import { Link } from "react-router-dom";
import { STUDIO_TABS } from "../../constants/studioTabs.js";

const DESIGN_TAB =
  STUDIO_TABS.find((tab) => tab.id === "design") || STUDIO_TABS[0] || { to: "/studio" };
const DESIGN_TAB_PATH = DESIGN_TAB.to || "/studio";

const HeroStat = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-900 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold">{value ?? "-"}</p>
    {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
  </div>
);

export const WorkspaceHero = ({ metaCards = [], onCreateStudio }) => (
  <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-slate-50 to-indigo-100 px-8 py-10 text-slate-900 shadow-xl ring-1 ring-slate-100">
    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end">
      <div className="flex-1 space-y-4">
        <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-500">
          Studio OS
        </span>
        <h1 className="text-3xl font-semibold sm:text-4xl">Design Studio workspace</h1>
        <p className="max-w-2xl text-base text-slate-600">
          Publish bundles, update your firm voice, and drop new concept packs without leaving the portal. Everything
          here syncs to the public Studio experience instantly after approval.
        </p>
      </div>
      <div className="flex flex-col gap-3 lg:w-[260px]">
        <button
          type="button"
          onClick={onCreateStudio}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          Launch a new studio
        </button>
        <Link
          to={DESIGN_TAB_PATH}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-white"
        >
          View public page
        </Link>
        <a
          href="mailto:studios@builtattic.com"
          className="text-center text-sm font-semibold text-slate-600 underline-offset-4 hover:underline"
        >
          Message studios@builtattic.com
        </a>
      </div>
    </div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metaCards.map((card) => (
        <HeroStat key={card.label} {...card} />
      ))}
    </div>
    <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-indigo-200/40 blur-[100px]" />
    <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-[150px]" />
  </section>
);

const QuickActionList = ({ onCreateStudio }) => {
  const actions = [
    {
      type: "button",
      label: "Draft a studio bundle",
      helper: "Spin up a new tile with hero, pricing, and gallery.",
      onClick: onCreateStudio,
    },
    {
      type: "anchor",
      label: "Update firm profile",
      helper: "Sync hero copy + services buyers see first.",
      href: "#firm-profile",
    },
    {
      type: "link",
      label: "Manage plan uploads",
      helper: "Push renders and plan packs from the workspace.",
      to: "/portal/studio",
    },
    {
      type: "link",
      label: "Preview public Studio",
      helper: "Open the live experience buyers browse.",
      to: DESIGN_TAB_PATH,
    },
  ];

  const renderAction = (action) => {
    const content = (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{action.label}</p>
          <p className="text-xs text-slate-500">{action.helper}</p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">Go</span>
      </div>
    );

    if (action.type === "button") {
      return (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
        >
          {content}
        </button>
      );
    }
    if (action.type === "anchor") {
      return (
        <a
          key={action.label}
          href={action.href}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        key={action.label}
        to={action.to}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
      >
        {content}
      </Link>
    );
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white/90 px-6 py-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Workspace Actions</p>
          <p className="text-sm font-semibold text-slate-900">Keep things in sync</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{actions.map((action) => renderAction(action))}</div>
    </section>
  );
};

export const WorkspaceActions = React.memo(QuickActionList);

export default WorkspaceHero;
