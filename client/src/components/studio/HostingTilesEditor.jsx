import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import StudioTilesPreview from "./StudioTilesPreview.jsx";
import { DEFAULT_STUDIO_TILES } from "../../utils/studioTiles.js";

const MAX_TILES = 12;

const normalizeTile = (tile = {}, type) => ({
  id: tile.id || `${type}-${Math.random().toString(36).slice(2, 10)}`,
  label: tile.label || "",
  description: tile.description || "",
  status: tile.status === "on-request" ? "on-request" : "available",
  statusLabel: tile.statusLabel || "",
  extra: tile.extra || "",
});

const normalizeHosting = (hosting) => {
  const summary = hosting?.serviceSummary?.trim() || DEFAULT_STUDIO_TILES.summary;
  const servicesSource = hosting?.services?.length ? hosting.services : DEFAULT_STUDIO_TILES.services;
  const productsSource = hosting?.products?.length ? hosting.products : DEFAULT_STUDIO_TILES.products;
  return {
    summary,
    services: servicesSource.map((tile) => normalizeTile(tile, "service")),
    products: productsSource.map((tile) => normalizeTile(tile, "product")),
  };
};

const createTile = (type) =>
  normalizeTile(
    {
      label: "",
      description: "",
      status: "available",
    },
    type,
  );

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "on-request", label: "On request" },
];

const TileEditor = ({
  type,
  index,
  tile,
  onFieldChange,
  onRemove,
  disableRemove,
}) => {
  const typeLabel = type === "services" ? "Service" : "Product";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">
          {typeLabel} {index + 1}
        </p>
        <button
          type="button"
          onClick={onRemove}
          disabled={disableRemove}
          className="rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
          title={disableRemove ? "Keep at least one tile" : `Remove ${typeLabel.toLowerCase()}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Title</label>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={tile.label}
            onChange={(event) => onFieldChange("label", event.target.value)}
            placeholder={`e.g. ${typeLabel === "Service" ? "Architectural design" : "Pre-designed plans"}`}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Description</label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={tile.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
            placeholder="Explain the outcome a buyer receives."
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Status</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={tile.status}
              onChange={(event) => onFieldChange("status", event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Badge label</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={tile.statusLabel || ""}
              onChange={(event) => onFieldChange("statusLabel", event.target.value)}
              placeholder="Optional – e.g. Only 3 slots"
            />
          </div>
        </div>
        {type === "products" ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Callout</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={tile.extra || ""}
              onChange={(event) => onFieldChange("extra", event.target.value)}
              placeholder="Optional – e.g. USD 125 per sq ft"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default function HostingTilesEditor({ hosting, saving = false, onSave }) {
  const [form, setForm] = useState(() => normalizeHosting(hosting));
  const [dirty, setDirty] = useState(false);
  const [localError, setLocalError] = useState(null);

  const hostingSignature = useMemo(() => JSON.stringify(hosting || {}), [hosting]);
  useEffect(() => {
    setForm(normalizeHosting(hosting));
    setDirty(false);
    setLocalError(null);
  }, [hostingSignature]);

  const handleSummaryChange = (event) => {
    setForm((prev) => ({ ...prev, summary: event.target.value }));
    setDirty(true);
  };

  const handleTileChange = (collection, index, field, value) => {
    setForm((prev) => {
      const next = prev[collection].map((tile, idx) => (idx === index ? { ...tile, [field]: value } : tile));
      return { ...prev, [collection]: next };
    });
    setDirty(true);
  };

  const handleRemoveTile = (collection, index) => {
    setForm((prev) => {
      if (prev[collection].length === 1) return prev;
      const next = prev[collection].filter((_, idx) => idx !== index);
      return { ...prev, [collection]: next };
    });
    setDirty(true);
  };

  const handleAddTile = (collection) => {
    setForm((prev) => {
      if (prev[collection].length >= MAX_TILES) return prev;
      return { ...prev, [collection]: [...prev[collection], createTile(collection === "services" ? "service" : "product")] };
    });
    setDirty(true);
  };

  const buildPayload = () => {
    const services = form.services.map((tile) => ({
      id: tile.id,
      label: tile.label.trim(),
      description: tile.description.trim(),
      status: tile.status,
      statusLabel: tile.statusLabel.trim() || undefined,
    }));
    const products = form.products.map((tile) => ({
      id: tile.id,
      label: tile.label.trim(),
      description: tile.description.trim(),
      status: tile.status,
      statusLabel: tile.statusLabel.trim() || undefined,
      extra: tile.extra.trim() || undefined,
    }));

    if (services.some((tile) => tile.label.length < 2)) {
      setLocalError("Give every service tile a clear title (at least 2 characters).");
      return null;
    }
    if (products.some((tile) => tile.label.length < 2)) {
      setLocalError("Give every product tile a clear title (at least 2 characters).");
      return null;
    }

    const summary = form.summary.trim();
    return {
      summary,
      serviceSummary: summary,
      services,
      products,
    };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError(null);
    const payload = buildPayload();
    if (!payload || typeof onSave !== "function") return;
    onSave(payload);
  };

  const previewConfig = useMemo(
    () => ({
      summary: form.summary,
      services: form.services,
      products: form.products,
    }),
    [form.summary, form.services, form.products]
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Story</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Describe what you sell</h3>
          <textarea
            rows={4}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={form.summary}
            onChange={handleSummaryChange}
            placeholder="Tell buyers what your studio delivers."
          />
          <p className="mt-2 text-xs text-slate-500">This copy appears above your service tiles on the public listing.</p>
        </div>

        {["services", "products"].map((collection) => {
          const isService = collection === "services";
          const heading = isService ? "Service tiles" : "Product tiles";
          const helper = isService
            ? "Explain the professional services you offer."
            : "Outline your packaged deliverables or plan catalogues.";
          const tiles = form[collection];
          return (
            <section key={collection} className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{heading}</p>
                  <p className="text-sm text-slate-500">{helper}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTile(collection)}
                  disabled={tiles.length >= MAX_TILES}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <Plus size={14} /> Add {isService ? "service" : "product"}
                </button>
              </div>
              <div className="space-y-4">
                {tiles.map((tile, index) => (
                  <TileEditor
                    key={tile.id}
                    type={collection}
                    index={index}
                    tile={tile}
                    onFieldChange={(field, value) => handleTileChange(collection, index, field, value)}
                    onRemove={() => handleRemoveTile(collection, index)}
                    disableRemove={tiles.length === 1}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving || !dirty}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? "Saving…" : "Save studio programs"}
          </button>
          {dirty ? <p className="text-xs font-semibold text-amber-600">You have unsaved edits.</p> : null}
          {localError ? <p className="text-xs text-rose-600">{localError}</p> : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 shadow-inner">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Live preview</p>
        <p className="mt-1 text-sm text-slate-500">Updates as you type so you can see the marketplace layout.</p>
        <div className="mt-4 overflow-auto pr-1">
          <StudioTilesPreview
            summary={previewConfig.summary}
            services={previewConfig.services}
            products={previewConfig.products}
          />
        </div>
      </div>
    </form>
  );
}
