import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, ExternalLink } from "lucide-react";
import { normaliseAssetUrl } from "../../utils/studioForm.js";

const baseFieldClasses =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200";

const joinClasses = (extra = "") => [baseFieldClasses, extra].filter(Boolean).join(" ");

const Input = ({ className = "", ...props }) => <input {...props} className={joinClasses(className)} />;
const TextArea = ({ className = "", ...props }) => <textarea {...props} className={joinClasses(className)} />;
const Select = ({ className = "", children, ...props }) => (
  <select {...props} className={joinClasses(className)}>
    {children}
  </select>
);
const Hint = ({ children }) => <p className="text-xs text-slate-500">{children}</p>;

const SectionCard = ({ title, description, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const FormField = ({ label, hint, children }) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {children}
    {hint ? <Hint>{hint}</Hint> : null}
  </label>
);

const StudioPreviewCard = ({ form }) => {
  const heroImage = normaliseAssetUrl(form.heroImage);
  const title = form.title?.trim() || "Untitled studio";
  const summary = form.summary?.trim() || "Add a concise project pitch to see it here.";
  const galleryEntries = useMemo(
    () =>
      (form.gallery || "")
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map(normaliseAssetUrl),
    [form.gallery]
  );
  const [heroError, setHeroError] = useState(false);

  useEffect(() => {
    setHeroError(false);
  }, [heroImage]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="relative h-48 bg-slate-100">
        {heroImage && !heroError ? (
          <img
            src={heroImage}
            alt="Studio hero preview"
            className="h-full w-full object-cover"
            onError={() => setHeroError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
            Upload a hero image to preview it here.
          </div>
        )}
        {galleryEntries.length ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow">
            {galleryEntries.length} gallery {galleryEntries.length === 1 ? "asset" : "assets"}
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Preview</p>
        <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-600">{summary}</p>
        {galleryEntries.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gallery preview</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {galleryEntries.slice(0, 5).map((asset, index) => (
                <div key={`${asset}-${index}`} className="relative aspect-video overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={asset}
                    alt={`Gallery asset ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.classList.add("hidden");
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
                </div>
              ))}
              {galleryEntries.length > 5 ? (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  +{galleryEntries.length - 5} more
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const INTENT_COPY = {
  create: {
    label: "New studio",
    badge: "Fresh listing",
    helper: "Draft a new tile and detail page before you publish.",
  },
  tile: {
    label: "Listing tile",
    badge: "Tile update",
    helper: "Tune the hero image, summary, and gallery buyers see first.",
  },
  detail: {
    label: "Detail page",
    badge: "Listing page",
    helper: "Refresh long-form copy, gallery assets, and storytelling.",
  },
};

const StudioForm = ({
  form,
  onChange,
  onCancel,
  onSubmit,
  saving,
  onHeroUpload,
  onGalleryUpload,
  uploading,
  heroFileInputRef,
  galleryFileInputRef,
  intent,
}) => {
  const handleChange = (key) => (event) => {
    const value = event?.target?.value;
    const nextValue = key === "heroImage" ? normaliseAssetUrl(value) : value;
    onChange((prev) => ({ ...prev, [key]: nextValue }));
  };
  const handleCheckboxChange = (key) => (event) => {
    const { checked } = event?.target || {};
    onChange((prev) => ({ ...prev, [key]: checked }));
  };

  const previewHref = form.slug ? `/studio/${form.slug}` : null;
  const intentMeta = intent ? INTENT_COPY[intent] : null;
  const headerLabel = intentMeta?.label || (form.id ? "Update studio" : "New studio");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{headerLabel}</p>
          <h3 className="text-xl font-semibold text-slate-900">{form.title || "Untitled studio"}</h3>
        </div>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
          Close
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
        {intentMeta ? (
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-slate-900">
            {intentMeta.badge}
          </span>
        ) : null}
        <Link
          to={previewHref || "#"}
          target={previewHref ? "_blank" : undefined}
          rel={previewHref ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5"
        >
          <ExternalLink size={12} /> {previewHref ? "View public page" : "Preview after publish"}
        </Link>
      </div>
      {intentMeta ? (
        <p className="mt-2 text-xs text-slate-500">{intentMeta.helper}</p>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)] items-start">
        <div className="space-y-6">
          <SectionCard title="Story" description="Hero copy and gallery assets">
            <FormField label="Title">
              <Input value={form.title} onChange={handleChange("title")} placeholder="Cascadia courtyard" />
            </FormField>
            <FormField label="Summary" hint="Quick pitch buyers see first.">
              <TextArea value={form.summary} onChange={handleChange("summary")} rows={3} />
            </FormField>
            <FormField label="Description" hint="Longer copy for the detail page">
              <TextArea value={form.description} onChange={handleChange("description")} rows={4} />
            </FormField>
            <FormField label="Hero image" hint="Upload an image or paste a link. Uploads populate the field automatically.">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input value={form.heroImage} onChange={handleChange("heroImage")} placeholder="https://cdn..." />
                <button
                  type="button"
                  onClick={() => heroFileInputRef?.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                  disabled={uploading?.hero}
                >
                  <Upload size={14} /> {uploading?.hero ? "Uploading" : "Upload"}
                </button>
                <input ref={heroFileInputRef} type="file" accept="image/*" className="hidden" onChange={onHeroUpload} />
              </div>
            </FormField>
            <FormField
              label="Gallery"
              hint="Upload images for the fastest preview. Pasting links still works (one per line)."
            >
              <TextArea value={form.gallery} onChange={handleChange("gallery")} rows={4} />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => galleryFileInputRef?.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                  disabled={uploading?.gallery}
                >
                  <Upload size={14} /> {uploading?.gallery ? "Uploading" : "Upload images"}
                </button>
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onGalleryUpload}
                />
              </div>
            </FormField>
          </SectionCard>

          <SectionCard title="Commercials & taxonomy" description="Pricing, style, and marketplace filters">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Pricing (total)">
                <Input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={handleChange("price")}
                  placeholder="180000"
                />
              </FormField>
              <FormField label="Currency">
                <Input value={form.currency} onChange={handleChange("currency")} placeholder="USD" />
              </FormField>
              <FormField label="Price per sq ft" hint="Shown on the detail card if provided">
                <Input
                  type="number"
                  min="0"
                  value={form.priceSqft}
                  onChange={handleChange("priceSqft")}
                  placeholder="220"
                />
              </FormField>
              <FormField label="Style" hint="Eg. Tropical modern, Brutalist">
                <Input value={form.style} onChange={handleChange("style")} placeholder="Low-carbon contemporary" />
              </FormField>
            </div>
            <FormField label="Categories" hint="Comma separated tags buyers can filter on">
              <Input
                value={form.categories}
                onChange={handleChange("categories")}
                placeholder="Residential, Prototype"
              />
            </FormField>
            <FormField label="Tags" hint="Comma separated micro attributes like prefab, BIM ready">
              <Input value={form.tags} onChange={handleChange("tags")} placeholder="Prefab, BIM ready" />
            </FormField>
            <FormField label="Highlights" hint="One bullet per line">
              <TextArea value={form.highlights} onChange={handleChange("highlights")} rows={3} />
            </FormField>
          </SectionCard>

          <SectionCard title="Specifications" description="Sizing and room mix showcased on the listing page">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Built area">
                <Input
                  type="number"
                  min="0"
                  value={form.areaSqft}
                  onChange={handleChange("areaSqft")}
                  placeholder="2400"
                />
              </FormField>
              <FormField label="Plot size">
                <Input
                  type="number"
                  min="0"
                  value={form.plotAreaSqft}
                  onChange={handleChange("plotAreaSqft")}
                  placeholder="3200"
                />
              </FormField>
            </div>
            <FormField label="Area unit">
              <Select value={form.areaUnit} onChange={handleChange("areaUnit")}>
                <option value="sq ft">sq ft</option>
                <option value="m2">m²</option>
              </Select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Bedrooms">
                <Input
                  type="number"
                  min="0"
                  value={form.bedrooms}
                  onChange={handleChange("bedrooms")}
                  placeholder="3"
                />
              </FormField>
              <FormField label="Bathrooms">
                <Input
                  type="number"
                  min="0"
                  value={form.bathrooms}
                  onChange={handleChange("bathrooms")}
                  placeholder="2"
                />
              </FormField>
              <FormField label="Floors">
                <Input
                  type="number"
                  min="0"
                  value={form.floors}
                  onChange={handleChange("floors")}
                  placeholder="2"
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Location & logistics" description="Help buyers understand where you deliver from">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="City">
                <Input value={form.city} onChange={handleChange("city")} placeholder="Bengaluru" />
              </FormField>
              <FormField label="Country">
                <Input value={form.country} onChange={handleChange("country")} placeholder="India" />
              </FormField>
              <FormField label="Timezone">
                <Input value={form.timezone} onChange={handleChange("timezone")} placeholder="UTC+05:30" />
              </FormField>
            </div>
            <FormField label="Delivery notes" hint="Describe what the buyer receives after purchase">
              <TextArea value={form.deliveryNotes} onChange={handleChange("deliveryNotes")} rows={3} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Fulfilment type">
                <Input value={form.fulfilmentType} onChange={handleChange("fulfilmentType")} placeholder="Digital kit" />
              </FormField>
              <FormField label="Handover method">
                <Input value={form.handoverMethod} onChange={handleChange("handoverMethod")} placeholder="Virtual walkthrough" />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Lead time (weeks)">
                <Input
                  type="number"
                  min="0"
                  value={form.leadTimeWeeks}
                  onChange={handleChange("leadTimeWeeks")}
                  placeholder="6"
                />
              </FormField>
              <FormField label="Includes installation?">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form.includesInstallation)}
                    onChange={handleCheckboxChange("includesInstallation")}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                  On-site partner install available
                </label>
              </FormField>
            </div>
            <FormField label="Delivery checklist" hint="One line per deliverable (spec set, BIM, 3D, etc.)">
              <TextArea value={form.deliveryItems} onChange={handleChange("deliveryItems")} rows={3} />
            </FormField>
          </SectionCard>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6">
          <StudioPreviewCard form={form} />
          {previewHref ? (
            <Link
              to={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700"
            >
              <ExternalLink size={14} /> Open live detail page
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          disabled={saving}
        >
          {saving ? "Saving…" : form.id ? "Update studio" : "Create studio"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-600 hover:text-slate-900">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StudioForm;
