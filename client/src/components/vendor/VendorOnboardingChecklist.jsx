import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, Circle, RefreshCw } from "lucide-react";

const DEFAULT_STEPS = [
  { id: "profile", label: "Vendor profile", detail: "Share company + contact info", complete: false },
  { id: "catalog", label: "Material catalogue", detail: "Publish your first SKU", complete: false },
  { id: "logistics", label: "Logistics data", detail: "Set lead time and MOQ", complete: false },
  { id: "compliance", label: "Compliance", detail: "Submit approvals", complete: false },
];

const StepRow = ({ step }) => {
  const Icon = step.complete ? CheckCircle : Circle;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-3">
      <Icon className={`mt-1 h-4 w-4 ${step.complete ? "text-emerald-600" : "text-slate-300"}`} />
      <div>
        <p className="text-sm font-semibold text-slate-900">{step.label}</p>
        <p className="text-xs text-slate-500">{step.detail}</p>
        {Array.isArray(step.requirements) && step.requirements.length > 0 ? (
          <p className="mt-1 text-[11px] text-slate-400">Next: {step.requirements.join(", ")}</p>
        ) : null}
      </div>
    </div>
  );
};

const StatChip = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "-"}</p>
    {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
  </div>
);

const MaterialPreviewCard = ({ material }) => (
  <article className="rounded-2xl border border-slate-100 bg-white shadow-sm">
    {material.heroImage ? (
      <div className="h-32 w-full overflow-hidden rounded-t-2xl bg-slate-200">
        <img src={material.heroImage} alt={material.title} className="h-full w-full object-cover" loading="lazy" />
      </div>
    ) : null}
    <div className="p-4 space-y-1">
      <p className="text-sm font-semibold text-slate-900">{material.title}</p>
      {material.price ? (
        <p className="text-xs text-slate-500">
          {material.currency || "USD"} {material.price}
        </p>
      ) : null}
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        <span>{material.status}</span>
        {material.inventory != null ? <span>Inv. {material.inventory}</span> : null}
      </div>
    </div>
  </article>
);

export default function VendorOnboardingChecklist({
  data,
  loading,
  error,
  onRefresh,
  variant = "full",
}) {
  const steps = data?.onboarding?.steps?.length ? data.onboarding.steps : DEFAULT_STEPS;
  const computedProgress = Math.round((steps.filter((step) => step.complete).length / steps.length) * 100);
  const progress = data?.onboarding?.progress ?? computedProgress;
  const stats = [
    { label: "Published SKUs", value: data?.metrics?.publishedSkus },
    { label: "Drafts", value: data?.metrics?.draftSkus },
    { label: "Inventory", value: data?.metrics?.inventoryCount },
    { label: "Pipeline leads", value: data?.metrics?.leads },
  ];
  const materials = data?.preview?.materials || [];
  const heading = data?.firm?.name ? `${data.firm.name} onboarding` : "Material Studio onboarding";

  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 p-6 shadow-sm ${
        variant === "compact" ? "space-y-4" : "space-y-6"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            {heading}
          </p>
          <p className="text-2xl font-semibold text-slate-900">{progress}% ready</p>
          <p className="text-sm text-slate-500">
            Complete the checklist to enable Material Studio visibility and routing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link to="/portal/vendor" className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">
            Open portal
          </Link>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className={`grid gap-6 ${variant === "compact" ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        <div className="space-y-3">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </div>
        <div className="space-y-3">
          {stats.map((stat) => (
            <StatChip key={stat.label} {...stat} />
          ))}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Material Studio</p>
              <p className="text-sm font-semibold text-slate-900">Live preview</p>
            </div>
            <Link to="/warehouse" className="text-xs font-semibold text-slate-900 underline">
              View marketplace
            </Link>
          </div>
          {materials.length === 0 ? (
            <p className="text-sm text-slate-500">
              Publish your first SKU to unlock Material Studio visibility.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {materials.slice(0, variant === "compact" ? 2 : 4).map((material) => (
                <MaterialPreviewCard key={material.id} material={material} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
