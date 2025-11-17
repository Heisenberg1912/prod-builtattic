import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";
import {
  getWorkspaceCollections,
  stringifyList,
  upsertPlanUpload,
  removePlanUpload,
} from "../../utils/workspaceSync.js";

const defaultPlanForm = () => ({
  id: null,
  projectTitle: "",
  category: "",
  subtype: "",
  primaryStyle: "",
  conceptPlan: "",
  renderImages: "",
  walkthrough: "",
  areaSqft: "",
  floors: "",
  materials: "",
  climate: "",
  designRate: "",
  constructionCost: "",
  licenseType: "",
  delivery: "",
  description: "",
  tags: "",
});

const splitList = (value) => {
  if (!value) return [];
  return value
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const numericString = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return String(value);
  return String(asNumber);
};

const formatMeasure = (value, suffix = "") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  const numberLabel = numeric.toLocaleString();
  return suffix ? `${numberLabel} ${suffix}` : numberLabel;
};

const formatRate = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `$${numeric}/sqft` : "-";
};

export default function PlanUploadPanel({ role = "associate", workspaceName = "Skill Studio" }) {
  const [collections, setCollections] = useState(() => getWorkspaceCollections(role));
  const [form, setForm] = useState(() => defaultPlanForm());
  const [saving, setSaving] = useState(false);

  const planUploads = useMemo(() => collections.planUploads || [], [collections]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(defaultPlanForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.projectTitle.trim()) {
      toast.error("Add a project title before syncing.");
      return;
    }
    if (!splitList(form.renderImages).length) {
      toast.error("Render images are required before publishing.");
      return;
    }
    setSaving(true);
    try {
      const nextPlans = upsertPlanUpload(role, {
        ...form,
        renderImages: form.renderImages,
        materials: form.materials,
        tags: form.tags,
        climateSuitability: form.climate,
      });
      setCollections((prev) => ({ ...prev, planUploads: nextPlans }));
      toast.success(`Plan synced to ${workspaceName}`);
      resetForm();
    } catch (error) {
      console.error("plan_sync_error", error);
      toast.error("Unable to sync plan. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plan) => {
    setForm({
      id: plan.id,
      projectTitle: plan.projectTitle || "",
      category: plan.category || "",
      subtype: plan.subtype || "",
      primaryStyle: plan.primaryStyle || "",
      conceptPlan: plan.conceptPlan || "",
      renderImages: stringifyList(plan.renderImages),
      walkthrough: plan.walkthrough || "",
      areaSqft: numericString(plan.areaSqft),
      floors: numericString(plan.floors),
      materials: stringifyList(plan.materials),
      climate: plan.climate || "",
      designRate: numericString(plan.designRate),
      constructionCost: numericString(plan.constructionCost),
      licenseType: plan.licenseType || "",
      delivery: plan.delivery || "",
      description: plan.description || "",
      tags: stringifyList(plan.tags),
    });
  };

  const handleDelete = (plan) => {
    const nextPlans = removePlanUpload(role, plan.id);
    setCollections((prev) => ({ ...prev, planUploads: nextPlans }));
    toast.success("Plan removed");
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Plan upload</p>
          <h2 className="text-lg font-semibold text-slate-900">Concept hosting</h2>
          <p className="text-sm text-slate-500">Capture plan specs once and reuse them inside {workspaceName}.</p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Syncs instantly</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Project title
            <input
              name="projectTitle"
              value={form.projectTitle}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Eg. Canyon Residence"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Category & subtype
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              <input
                name="category"
                value={form.category}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Residential"
              />
              <input
                name="subtype"
                value={form.subtype}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Villa"
              />
            </div>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Primary style
            <input
              name="primaryStyle"
              value={form.primaryStyle}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Tropical modern"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Concept plan (PDF / DWG link)
            <input
              name="conceptPlan"
              value={form.conceptPlan}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="https://files..."
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Render images (one per line)
            <textarea
              name="renderImages"
              value={form.renderImages}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={"https://example.com/render-1\nhttps://example.com/render-2"}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Walkthrough (optional)
            <input
              name="walkthrough"
              value={form.walkthrough}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Video or twin link"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">
            Area (sqft)
            <input
              name="areaSqft"
              value={form.areaSqft}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="4200"
              inputMode="numeric"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Floors
            <input
              name="floors"
              value={form.floors}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="2"
              inputMode="numeric"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Design rate $/sqft
            <input
              name="designRate"
              value={form.designRate}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="12"
              inputMode="decimal"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Construction $/sqft
            <input
              name="constructionCost"
              value={form.constructionCost}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="140"
              inputMode="decimal"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Materials used
            <textarea
              name="materials"
              value={form.materials}
              onChange={handleInputChange}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={"Laterite stone\nEngineered timber"}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Climate & terrain suitability
            <textarea
              name="climate"
              value={form.climate}
              onChange={handleInputChange}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Warm-humid | Coastal belt"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            License type
            <select
              name="licenseType"
              value={form.licenseType}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="Exclusive">Exclusive</option>
              <option value="Non-exclusive">Non-exclusive</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Delivery method
            <select
              name="delivery"
              value={form.delivery}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="ZIP">ZIP</option>
              <option value="Encrypted multi-file">Encrypted multi-file</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Tags
            <input
              name="tags"
              value={form.tags}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Passive, Off-grid"
            />
          </label>
        </div>
        <label className="text-sm font-semibold text-slate-700">
          Description / notes
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Concept narrative, delivery notes, etc."
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update plan" : "Save plan"}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Hosted plans</p>
        {planUploads.length === 0 ? (
          <p className="text-sm text-slate-500">No plans synced yet. Add your first concept to expose it inside {workspaceName}.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {planUploads.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {plan.category || "Category"}
                      {plan.subtype ? ` • ${plan.subtype}` : ""}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">{plan.projectTitle || "Untitled plan"}</h3>
                    <p className="text-sm text-slate-500">{plan.primaryStyle || "Add a primary style"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(plan)}
                      className="rounded-full border border-slate-200 p-1 text-slate-600 hover:text-slate-900"
                      aria-label="Edit plan"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(plan)}
                      className="rounded-full border border-slate-200 p-1 text-rose-500 hover:text-rose-600"
                      aria-label="Delete plan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Area</dt>
                    <dd>{formatMeasure(plan.areaSqft, 'sqft')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Floors</dt>
                    <dd>{formatMeasure(plan.floors)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Design rate</dt>
                    <dd>{formatRate(plan.designRate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Construction</dt>
                    <dd>{formatRate(plan.constructionCost)}</dd>
                  </div>
                </dl>
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p>
                    Lic. {plan.licenseType || 'n/a'} · Delivery {plan.delivery || 'n/a'}
                  </p>
                  <p>Assets: {plan.renderImages?.length || 0} renders {plan.walkthrough ? '• Walkthrough' : ''}</p>
                  {plan.description ? <p className="text-slate-500/80">{plan.description}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
