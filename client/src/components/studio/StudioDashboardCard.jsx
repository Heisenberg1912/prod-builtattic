import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Image as ImageIcon, DollarSign, FileText, ExternalLink, PenSquare } from "lucide-react";
import { applyFallback, getStudioFallback, getStudioImageUrl } from "../../utils/imageFallbacks.js";

const formatCurrency = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toLocaleString()}`;
  }
};

const buildEditorLink = (studio, section) => {
  const base = studio?.slug ? `/portal/studio?edit=${encodeURIComponent(studio.slug)}` : "/portal/studio";
  if (!section) return base;
  const joinChar = base.includes("?") ? "&" : "?";
  return `${base}${joinChar}section=${encodeURIComponent(section)}`;
};

const StudioDashboardCard = ({ studio, onEdit }) => {
  const navigate = useNavigate();
  const heroImage = getStudioImageUrl(studio);
  const price = formatCurrency(studio?.price, studio?.currency || "USD");
  const priceSqft =
    studio?.priceSqft && Number.isFinite(Number(studio.priceSqft))
      ? `${Number(studio.priceSqft).toLocaleString()} ${studio.currency || "USD"} / ${studio?.areaUnit || "sq ft"}`
      : null;
  const updatedAt = studio?.updatedAt ? new Date(studio.updatedAt).toLocaleDateString() : "-";
  const status = (studio?.status || "draft").toUpperCase();
  const previewHref = studio?.slug ? `/studio/${studio.slug}` : null;
  const hasSpecs =
    Number.isFinite(Number(studio?.areaSqft)) ||
    Number.isFinite(Number(studio?.bedrooms)) ||
    Number.isFinite(Number(studio?.bathrooms)) ||
    Number.isFinite(Number(studio?.floors));
  const hasPrograms = Array.isArray(studio?.programs) && studio.programs.length > 0;
  const completenessChecks = [
    { label: "Hero image", ok: Boolean(heroImage), helper: "Add a hero image to lift CTR.", href: buildEditorLink(studio, "gallery") },
    { label: "Pricing", ok: Boolean(price || priceSqft), helper: "Share total price or rate card.", href: buildEditorLink(studio, "pricing") },
    { label: "Specs", ok: hasSpecs, helper: "Bedrooms, baths, plot size, floors.", href: buildEditorLink(studio, "details") },
    { label: "Programs", ok: hasPrograms, helper: "List what this studio sells.", href: buildEditorLink(studio, "products") },
  ];
  const incompleteChecks = completenessChecks.filter((entry) => !entry.ok);

  const handleCardClick = (event) => {
    if (!previewHref) return;
    if (event.target.closest("a, button")) return;
    navigate(previewHref);
  };

  const handleCardKeyDown = (event) => {
    if (!previewHref) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(previewHref);
    }
  };


  return (
    <article
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${previewHref ? "cursor-pointer" : ""}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={previewHref ? 0 : undefined}
      role={previewHref ? "button" : undefined}
      aria-label={previewHref ? `Open ${studio?.title || "studio"}` : undefined}
    >
      <div className="grid gap-0 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className="relative bg-slate-100">
          {heroImage ? (
            <img
              src={heroImage}
              alt={studio?.title || "Studio hero"}
              className="h-full w-full object-cover"
              onError={(event) => applyFallback(event, getStudioFallback(studio))}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              Add a hero image
            </div>
          )}
          {typeof onEdit === "function" ? (
            <button
              type="button"
              onClick={() => onEdit(studio)}
              className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow hover:bg-white"
            >
              <PenSquare size={12} /> Edit full page
            </button>
          ) : null}
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{status}</p>
              <h3 className="text-lg font-semibold text-slate-900">{studio?.title || "Untitled studio"}</h3>
              <p className="text-sm text-slate-600 line-clamp-2">{studio?.summary || studio?.description || "Add a short summary to help buyers"}</p>
            </div>
            <div className="text-right">
              {price ? <p className="text-base font-semibold text-slate-900">{price}</p> : null}
              {priceSqft ? <p className="text-xs text-slate-500">{priceSqft}</p> : null}
              <p className="text-xs text-slate-400">Updated {updatedAt}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              ID: {studio?._id?.slice?.(0, 6) || studio?.id || "—"}
            </span>
            {studio?.areaSqft ? (
              <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">Area: {studio.areaSqft.toLocaleString()} sq ft</span>
            ) : null}
            {studio?.plotAreaSqft ? (
              <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">Plot: {studio.plotAreaSqft.toLocaleString()} sq ft</span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {(studio?.categories || []).slice(0, 3).map((category, index) => {
              if (!category) return null;
              const key = `${studio?._id || studio?.slug || 'studio'}-cat-${index}`;
              return (
                <span key={key} className="rounded-full border border-slate-200 px-3 py-1">
                  {category}
                </span>
              );
            })}
            {studio?.style ? (
              <span className="rounded-full border border-slate-200 px-3 py-1">Style: {studio.style}</span>
            ) : null}
          </div>

          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              incompleteChecks.length
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {incompleteChecks.length ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.35em]">Needs attention</p>
                <ul className="mt-2 space-y-1">
                  {incompleteChecks.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-2">
                      <span>{item.label}</span>
                      <Link
                        to={item.href}
                        className="text-xs font-semibold underline underline-offset-2"
                      >
                        Fix
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.35em]">Launch ready</p>
                <p className="mt-1 text-sm">All key details are filled. Keep the gallery fresh to stay featured.</p>
              </>
            )}
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <Link
              to={buildEditorLink(studio, "gallery")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              <ImageIcon size={16} /> Edit hero & gallery
            </Link>
            <Link
              to={buildEditorLink(studio, "pricing")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              <DollarSign size={16} /> Edit pricing & CTA
            </Link>
            <Link
              to={buildEditorLink(studio, "details")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              <FileText size={16} /> Edit specs & copy
            </Link>
            {previewHref ? (
              <Link
                to={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900/20 bg-slate-900/5 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-900/10"
              >
                <ExternalLink size={16} /> Preview listing
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

export default StudioDashboardCard;
