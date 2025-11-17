import React from "react";
import { Link } from "react-router-dom";
import { Upload, ExternalLink } from "lucide-react";
import { applyFallback, getStudioFallback } from "../../utils/imageFallbacks.js";

const baseFieldClasses =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200";

const joinClasses = (extra = "") => [baseFieldClasses, extra].filter(Boolean).join(" ");

const Input = (props) => <input {...props} className={joinClasses(props.className)} />;
const TextArea = (props) => <textarea {...props} className={joinClasses(props.className)} />;
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
  const heroImage = form.heroImage?.trim();
  const title = form.title?.trim() || "Untitled studio";
  const summary = form.summary?.trim() || "Add a concise project pitch to see it here.";
  const galleryEntries = (form.gallery || "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="relative h-48 bg-slate-100">
        {heroImage ? (
          <img
            src={heroImage}
            alt="Studio hero preview"
            className="h-full w-full object-cover"
            onError={(event) => applyFallback(event, getStudioFallback({ slug: form.slug }))}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
            Add a hero image URL to preview it here.
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
    onChange((prev) => ({ ...prev, [key]: value }));
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
            <FormField label="Hero image" hint="Paste a URL or upload">
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
            <FormField label="Gallery" hint="One URL per line">
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
