import React from "react";
import { Link } from "react-router-dom";

const StudioPreviewGrid = ({ studios = [], hostingTiles }) => {
  if (!Array.isArray(studios) || studios.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No studios yet. Create your first listing in the Studio portal.
      </p>
    );
  }

  const formatPriceText = (studio) => {
    const value =
      studio.priceSqft ??
      studio.pricing?.basePrice ??
      studio.pricing?.total ??
      studio.price ??
      null;
    if (value == null) return "On request";
    try {
      const formatted = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: studio.currency || studio.pricing?.currency || "USD",
        maximumFractionDigits: 0,
      }).format(Number(value));
      return `${formatted} / sq ft`;
    } catch {
      return `${value} ${studio.currency || ""}`.trim();
    }
  };

  const resolveHeroImage = (studio) =>
    studio.heroImage ||
    (Array.isArray(studio.gallery) && studio.gallery.length ? studio.gallery[0] : null) ||
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80";

  const resolveOverlayTokens = (studio) => {
    if (Array.isArray(studio.highlights) && studio.highlights.length) {
      return studio.highlights;
    }
    if (studio.products?.length) {
      return studio.products.map((product) => product?.label || product?.title).filter(Boolean);
    }
    if (hostingTiles?.products?.length) {
      return hostingTiles.products.map((tile) => tile.label).filter(Boolean);
    }
    return [];
  };

  const resolveBodyChips = (studio) => {
    const chips = [];
    if (studio.programs?.length) chips.push(...studio.programs);
    if (studio.services?.length) chips.push(...studio.services.map((service) => service?.title || service));
    if (!chips.length && hostingTiles?.services?.length) {
      chips.push(...hostingTiles.services.map((tile) => tile.label));
    }
    return chips.filter(Boolean).slice(0, 4);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {studios.map((studio) => {
        const slug = studio._id || studio.id || null;
        const href = slug ? `/studio/${slug}` : "/studio";
        const editHref = slug ? `/portal/studio?edit=${encodeURIComponent(slug)}` : '/portal/studio';
        const overlays = resolveOverlayTokens(studio).slice(0, 3);
        const chips = resolveBodyChips(studio);
        const heroImage = resolveHeroImage(studio);
        const summary =
          studio.summary ||
          studio.description ||
          "Keep this studio listing up to date so buyers know how you package your services.";
        const category = studio.primaryCategory || studio.category || studio.categories?.[0] || "Unspecified";
        const style = studio.style || studio.styles?.[0] || "Unspecified";
        const statusTone = studio.status === "published" ? "text-emerald-600" : "text-amber-600";

        return (
          <article
            key={studio._id || studio.id}
            className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <img
                src={heroImage}
                alt={studio.title || "Studio hero"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {overlays.length > 0 && (
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {overlays.map((label, index) => (
                    <span
                      key={`overlay-${slug || 'studio'}-${index}`}
                      className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white shadow"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                    {studio.firm?.name || "Studio listing"}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900">{studio.title || "Untitled studio"}</h3>
                  <p className="text-xs text-slate-500">
                    {studio.location?.city || studio.firm?.location?.city || "Location TBD"},{" "}
                    {studio.location?.country || studio.firm?.location?.country || "Global"}
                  </p>
                </div>
                <span className={`text-xs font-semibold uppercase tracking-[0.3em] ${statusTone}`}>
                  {studio.status || "draft"}
                </span>
              </div>

              {chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip, index) => (
                    <span
                      key={`chip-${slug || 'studio'}-${index}`}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Category</p>
                  <p className="text-sm font-semibold text-slate-900">{category}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Style</p>
                  <p className="text-sm font-semibold text-slate-900">{style}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 line-clamp-3">{summary}</p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pricing</p>
                  <p className="text-sm font-semibold text-slate-900">{formatPriceText(studio)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={href}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                  >
                    View studio
                  </Link>
                  <Link
                    to={`${href}#brief`}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                  >
                    Share brief
                  </Link>
                  <Link
                    to={editHref}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                  >
                    Edit listing
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default StudioPreviewGrid;
