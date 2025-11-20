import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { createServicePack, updateServicePack, deleteServicePack } from "../../services/collaboration.js";
import {
  replaceServiceBundles,
  upsertServiceBundle as upsertWorkspaceServiceBundle,
  removeServiceBundle as removeWorkspaceServiceBundle,
} from "../../utils/workspaceSync.js";

const defaultFormState = {
  id: null,
  title: "",
  summary: "",
  price: "",
  currency: "USD",
  deliverables: "",
  duration: "",
  availability: "",
  meetingPrep: "",
  status: "draft",
};

const formatCurrency = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Custom pricing";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: numeric >= 100000 ? 0 : 2,
    }).format(numeric);
  } catch {
    return `${numeric.toLocaleString()} ${currency}`;
  }
};

const splitList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export default function ServicePackManager({
  ownerType = "associate",
  initialPacks = [],
  heading = "Service packs",
  eyebrow = "Programs",
  description = "Bundle your offerings so ops teams know exactly what to book.",
  emptyMessage = "No service packs yet. Create one to show what buyers can activate instantly.",
}) {
  const [packs, setPacks] = useState(() => (Array.isArray(initialPacks) ? initialPacks : []));
  const [form, setForm] = useState(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [busyPackId, setBusyPackId] = useState(null);

  useEffect(() => {
    const nextPacks = Array.isArray(initialPacks) ? [...initialPacks] : [];
    setPacks(nextPacks);
    replaceServiceBundles(ownerType, nextPacks);
  }, [initialPacks, ownerType]);

  const sortedPacks = useMemo(
    () => [...packs].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)),
    [packs]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setForm(defaultFormState);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Give your service pack a title");
      return;
    }
    setSaving(true);
    try {
      const numericPrice = Number(form.price);
      const payload = {
        ownerType,
        title: form.title.trim(),
        summary: form.summary.trim(),
        price: form.price === "" ? null : Number.isFinite(numericPrice) ? numericPrice : null,
        currency: form.currency || "USD",
        deliverables: splitList(form.deliverables),
        duration: form.duration.trim(),
        availability: form.availability.trim(),
        meetingPrep: form.meetingPrep.trim(),
        status: form.status,
      };
      let response;
      if (form.id) {
        response = await updateServicePack(form.id, payload);
      } else {
        response = await createServicePack(payload);
      }
      const updatedPack = response?.servicePack;
      if (!updatedPack) throw new Error("Service pack response missing");
      setPacks((prev) => {
        const filtered = prev.filter((pack) => pack.id !== updatedPack.id);
        return [updatedPack, ...filtered];
      });
      upsertWorkspaceServiceBundle(ownerType, updatedPack);
      toast.success(form.id ? "Service pack updated" : "Service pack published");
      resetForm();
    } catch (error) {
      toast.error(error?.message || "Unable to save service pack");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pack) => {
    setForm({
      id: pack.id,
      title: pack.title || "",
      summary: pack.summary || "",
      price: Number.isFinite(pack.price) ? String(pack.price) : "",
      currency: pack.currency || "USD",
      deliverables: Array.isArray(pack.deliverables) ? pack.deliverables.join("\n") : "",
      duration: pack.duration || "",
      availability: pack.availability || "",
      meetingPrep: pack.meetingPrep || "",
      status: pack.status || "draft",
    });
  };

  const handleStatusToggle = async (pack) => {
    setBusyPackId(pack.id);
    try {
      const nextStatus = pack.status === "published" ? "draft" : "published";
      const { servicePack } = await updateServicePack(pack.id, { ownerType, status: nextStatus });
      setPacks((prev) => prev.map((entry) => (entry.id === servicePack.id ? servicePack : entry)));
      upsertWorkspaceServiceBundle(ownerType, servicePack);
      toast.success(`Marked as ${nextStatus}`);
    } catch (error) {
      toast.error(error?.message || "Unable to update pack");
    } finally {
      setBusyPackId(null);
    }
  };

  const handleDelete = async (pack) => {
    if (!window.confirm(`Delete ${pack.title}?`)) return;
    setBusyPackId(pack.id);
    try {
      await deleteServicePack(pack.id, { ownerType });
      setPacks((prev) => prev.filter((entry) => entry.id !== pack.id));
      removeWorkspaceServiceBundle(ownerType, pack.id);
      toast.success("Service pack removed");
      if (form.id === pack.id) {
        resetForm();
      }
    } catch (error) {
      toast.error(error?.message || "Unable to delete pack");
    } finally {
      setBusyPackId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">{eyebrow}</p>
          <h2 className="text-xl font-semibold text-slate-900">{heading}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        {form.id ? (
          <button
            type="button"
            onClick={resetForm}
            className="text-sm font-semibold text-slate-700 underline"
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="space-y-4">
          {!sortedPacks.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
              {emptyMessage}
            </div>
          ) : (
            sortedPacks.map((pack) => (
              <article
                key={pack.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {pack.status === "published" ? "Published" : "Draft"}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">{pack.title}</h3>
                    {pack.summary ? (
                      <p className="text-sm text-slate-600 mt-1">{pack.summary}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(pack.price, pack.currency)}</p>
                    {pack.duration ? (
                      <p className="text-xs text-slate-500">{pack.duration}</p>
                    ) : null}
                  </div>
                </div>
                {pack.deliverables?.length ? (
                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-600 space-y-1">
                    {pack.deliverables.slice(0, 4).map((item, index) => (
                      <li key={`${pack.id}-deliverable-${index}`}>{item}</li>
                    ))}
                    {pack.deliverables.length > 4 ? (
                      <li className="list-none text-xs text-slate-500">
                        +{pack.deliverables.length - 4} more deliverables
                      </li>
                    ) : null}
                  </ul>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {pack.availability ? <span className="rounded-full bg-white/80 px-3 py-1">{pack.availability}</span> : null}
                  {pack.meetingPrep ? <span className="rounded-full bg-white/80 px-3 py-1">Prep: {pack.meetingPrep}</span> : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(pack)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusToggle(pack)}
                    disabled={busyPackId === pack.id}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-60"
                  >
                    {pack.status === "published" ? "Mark draft" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(pack)}
                    disabled={busyPackId === pack.id}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:border-rose-300 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Pack title
              <input
                name="title"
                value={form.title}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Weekly BIM support"
              />
            </label>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Summary
              <textarea
                name="summary"
                rows={3}
                value={form.summary}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Share what this pack covers in plain English."
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Price (USD)
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="3200"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Duration / cadence
              <input
                name="duration"
                value={form.duration}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="2 week sprint"
              />
            </label>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Deliverables
              <textarea
                name="deliverables"
                rows={3}
                value={form.deliverables}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={"Issue tracker\nModel mark-ups\nWeekly report"}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Availability
              <input
                name="availability"
                value={form.availability}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Starts in 3 days"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Meeting prep
              <input
                name="meetingPrep"
                value={form.meetingPrep}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Send latest Revit model"
              />
            </label>
          </div>
          <label className="text-sm font-semibold text-slate-700">
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {form.id ? "Update pack" : "Create pack"}
          </button>
        </form>
      </div>
    </section>
  );
}
