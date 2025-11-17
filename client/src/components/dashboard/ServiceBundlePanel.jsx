import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";
import {
  getWorkspaceCollections,
  stringifyList,
  upsertServiceBundle,
  removeServiceBundle,
} from "../../utils/workspaceSync.js";

const defaultBundleForm = () => ({
  id: null,
  bundleName: "",
  typeDuration: "",
  scope: "",
  price: "",
  deliverables: "",
  fileFormat: "",
  revisionsAllowed: "",
  turnaroundTime: "",
  skillLevel: "",
  references: "",
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
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return String(numeric);
};

const formatPrice = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Custom";
  return `$${numeric.toLocaleString()}`;
};

export default function ServiceBundlePanel({ role = "associate", workspaceName = "Skill Studio" }) {
  const [collections, setCollections] = useState(() => getWorkspaceCollections(role));
  const [form, setForm] = useState(() => defaultBundleForm());
  const [saving, setSaving] = useState(false);

  const bundles = useMemo(() => collections.serviceBundles || [], [collections]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setForm(defaultBundleForm());

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.bundleName.trim()) {
      toast.error("Bundle name is required.");
      return;
    }
    if (!form.typeDuration.trim()) {
      toast.error("Add the bundle duration or cadence.");
      return;
    }
    if (!form.scope.trim()) {
      toast.error("Describe the scope of work.");
      return;
    }
    if (!form.price) {
      toast.error("Provide a price.");
      return;
    }
    if (!splitList(form.deliverables).length) {
      toast.error("List at least one deliverable.");
      return;
    }
    setSaving(true);
    try {
      const nextBundles = upsertServiceBundle(role, {
        ...form,
        cadence: form.typeDuration,
        scopeOfWork: form.scope,
        references: form.references,
      });
      setCollections((prev) => ({ ...prev, serviceBundles: nextBundles }));
      toast.success(`Bundle synced to ${workspaceName}`);
      resetForm();
    } catch (error) {
      console.error("bundle_sync_error", error);
      toast.error("Unable to sync bundle. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (bundle) => {
    setForm({
      id: bundle.id,
      bundleName: bundle.bundleName || "",
      typeDuration: bundle.cadence || bundle.durationLabel || "",
      scope: bundle.scope || "",
      price: numericString(bundle.price),
      deliverables: stringifyList(bundle.deliverables),
      fileFormat: bundle.fileFormat || "",
      revisionsAllowed: bundle.revisionsAllowed || "",
      turnaroundTime: bundle.turnaroundTime || "",
      skillLevel: bundle.skillLevel || "",
      references: stringifyList(bundle.references),
    });
  };

  const handleDelete = (bundle) => {
    const nextBundles = removeServiceBundle(role, bundle.id);
    setCollections((prev) => ({ ...prev, serviceBundles: nextBundles }));
    toast.success("Bundle removed");
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Service bundles</p>
          <h2 className="text-lg font-semibold text-slate-900">Hourly / weekly / monthly</h2>
          <p className="text-sm text-slate-500">Define packaged scopes and publish them inside {workspaceName}.</p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Syncs instantly</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Bundle name
            <input
              name="bundleName"
              value={form.bundleName}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Eg. Remote design sprints"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Type & duration
            <input
              name="typeDuration"
              value={form.typeDuration}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Weekly retainer, 40 hrs"
            />
          </label>
        </div>
        <label className="text-sm font-semibold text-slate-700">
          Scope of work
          <textarea
            name="scope"
            value={form.scope}
            onChange={handleChange}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Brief summary of inclusions"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            Price
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="3500"
              inputMode="decimal"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            File format
            <select
              name="fileFormat"
              value={form.fileFormat}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="ZIP">ZIP</option>
              <option value="Encrypted upload">Encrypted upload</option>
              <option value="Link delivery">Link delivery</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Revisions allowed
            <input
              name="revisionsAllowed"
              value={form.revisionsAllowed}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="2 rounds"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Deliverables (one per line)
            <textarea
              name="deliverables"
              value={form.deliverables}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={"BIM model\nFF&E schedule"}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Turnaround time
              <input
                name="turnaroundTime"
                value={form.turnaroundTime}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="5 business days"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Skill level
              <input
                name="skillLevel"
                value={form.skillLevel}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Senior"
              />
            </label>
          </div>
        </div>
        <label className="text-sm font-semibold text-slate-700">
          References (optional)
          <textarea
            name="references"
            value={form.references}
            onChange={handleChange}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Links or internal IDs"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update bundle" : "Save bundle"}
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
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Published bundles</p>
        {bundles.length === 0 ? (
          <p className="text-sm text-slate-500">No bundles synced yet. Capture your first hourly, weekly, or monthly scope.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {bundles.map((bundle) => (
              <article key={bundle.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{bundle.cadence || "Cadence"}</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">{bundle.bundleName || "Unnamed bundle"}</h3>
                    <p className="text-sm text-slate-500">{bundle.scope || "Scope pending"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(bundle)}
                      className="rounded-full border border-slate-200 p-1 text-slate-600 hover:text-slate-900"
                      aria-label="Edit bundle"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(bundle)}
                      className="rounded-full border border-slate-200 p-1 text-rose-500 hover:text-rose-600"
                      aria-label="Delete bundle"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Price</p>
                    <p className="font-semibold text-slate-900">{formatPrice(bundle.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Turnaround</p>
                    <p>{bundle.turnaroundTime || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">File format</p>
                    <p>{bundle.fileFormat || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Skill level</p>
                    <p>{bundle.skillLevel || '-'}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p>Revisions: {bundle.revisionsAllowed || 'N/A'}</p>
                  <p>Deliverables: {bundle.deliverables?.length || 0}</p>
                  {bundle.references?.length ? (
                    <p>References: {bundle.references.join(', ')}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
