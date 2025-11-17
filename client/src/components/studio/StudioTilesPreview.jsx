import React from "react";
import { DEFAULT_SERVICE_SUMMARY } from "../../utils/studioTiles.js";

const TileBadge = ({ status, label }) => {
  const resolved = status === "on-request" ? "On request" : "Available";
  const badgeLabel = label || resolved;
  const badgeClass =
    status === "on-request"
      ? "border-slate-200 bg-white text-slate-500"
      : "border-emerald-100 bg-emerald-50 text-emerald-700";
  const badgeClasses = `inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${badgeClass}`;
  return (
    <span className={badgeClasses}>
      {badgeLabel}
    </span>
  );
};

const StudioTilesPreview = ({ summary, services = [], products = [] }) => {
  const resolvedSummary = summary?.trim() || DEFAULT_SERVICE_SUMMARY;
  const hasServices = services.length > 0;
  const hasProducts = products.length > 0;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Service programs</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">What this studio sells</h3>
        <p className="mt-2 text-sm text-slate-600">{resolvedSummary}</p>
        <div className="mt-5 space-y-4">
          {hasServices ? (
            services.map((tile) => {
              const status = tile.status === "on-request" ? "on-request" : "available";
              return (
                <div key={tile.id || tile.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{tile.label || "Untitled"}</p>
                      <p className="text-sm text-slate-500">{tile.description || "Describe this service to buyers."}</p>
                    </div>
                    <TileBadge status={status} label={tile.statusLabel} />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">Add at least one service tile to explain your studio offer.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Products & delivery</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">How they package the work</h3>
        <p className="mt-2 text-sm text-slate-600">
          Some studios ship ready-to-license plan sets, others wrap the entire project into bundled programmes.
        </p>
        <div className="mt-5 space-y-4">
          {hasProducts ? (
            products.map((tile) => {
              const status = tile.status === "on-request" ? "on-request" : "available";
              return (
                <div key={tile.id || tile.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{tile.label || "Bundled offer"}</p>
                      <p className="text-sm text-slate-500">{tile.description || "Outline what the buyer receives."}</p>
                      {tile.extra ? (
                        <p className="mt-1 text-xs font-semibold text-slate-700">{tile.extra}</p>
                      ) : null}
                    </div>
                    <TileBadge status={status} label={tile.statusLabel} />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">List your productized deliverables or plan catalogues.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default StudioTilesPreview;
