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
    <div className="grid gap-6 lg:grid-cols-2">
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
          <Link
            to={href}
            key={studio._id || studio.id}
            className="group relative aspect-[16/10] overflow-hidden rounded-2xl cursor-pointer block"
          >
            {/* Base image */}
            <img
              src={heroImage}
              alt={studio.title || "Studio hero"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              loading="lazy"
            />

            {/* Default gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Default state content - bottom */}
            <div className="absolute inset-x-0 bottom-0 p-5 transition-all duration-300 ease-out group-hover:opacity-0 group-hover:translate-y-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/60 mb-1">
                {studio.firm?.name || "Studio listing"}
              </p>
              <h3 className="text-lg font-semibold text-white leading-tight line-clamp-1">
                {studio.title || "Untitled studio"}
              </h3>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/70 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />

            {/* Hover content */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 translate-y-3 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/50 mb-1">
                {studio.firm?.name || "Studio listing"}
              </p>
              <h3 className="text-lg font-semibold text-white leading-tight mb-3">
                {studio.title || "Untitled studio"}
              </h3>

              {/* Minimal info row */}
              <div className="flex items-center gap-3 text-[11px] text-white/60 mb-4">
                <span>{studio.location?.city || studio.firm?.location?.city || "Location TBD"}</span>
                {style !== "Unspecified" && (
                  <>
                    <span className="text-white/30">·</span>
                    <span>{style}</span>
                  </>
                )}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-semibold text-white">{formatPriceText(studio)}</p>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-colors duration-200 hover:bg-white/90">
                    View
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default StudioPreviewGrid;
