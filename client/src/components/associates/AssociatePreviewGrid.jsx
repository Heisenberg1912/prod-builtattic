import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineHeart, HiHeart } from "react-icons/hi";
import PolygonVerifiedBadge from "../PolygonVerifiedBadge.jsx";

const AssociatePreviewGrid = ({
  associates = [],
  favorites = new Set(),
  onToggleFavorite
}) => {
  if (!Array.isArray(associates) || associates.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No associates found. Check back later for new talent.
      </p>
    );
  }

  const formatRateText = (associate) => {
    const hourly = associate.rates?.hourly ?? associate.rate ?? associate.hourlyRate ?? null;
    const currency = associate.rates?.currency || "USD";
    if (hourly == null) return "On request";
    return `${currency} ${hourly}/hr`;
  };

  const resolveHeroImage = (associate) =>
    associate.heroImage ||
    associate.profileImage ||
    associate.avatar ||
    (Array.isArray(associate.gallery) && associate.gallery.length ? associate.gallery[0] : null) ||
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80";

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {associates.map((associate, index) => {
        const id = associate._id || associate.id;
        const profileHref = `/associates/${id}`;
        const heroImage = resolveHeroImage(associate);
        const specialization = associate.specialisations?.[0] || associate.specialization || null;
        const isFavorite = favorites.has(id);

        return (
          <Link
            to={profileHref}
            key={id || index}
            className="group relative aspect-[3/2] overflow-hidden rounded-lg cursor-pointer block"
          >
            {/* Base image */}
            <img
              src={heroImage}
              alt={associate.name || "Associate"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              loading="lazy"
            />

            {/* Default gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Web3 badge and Favorite button - always visible */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
              <PolygonVerifiedBadge
                tile={associate}
                studioType="skill"
                size="sm"
                showText={false}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleFavorite?.(id);
                }}
                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow transition-all duration-200 hover:scale-110"
              >
                {isFavorite ? (
                  <HiHeart className="w-3.5 h-3.5 text-red-500 fill-current" />
                ) : (
                  <HiOutlineHeart className="w-3.5 h-3.5 text-slate-700" />
                )}
              </button>
            </div>

            {/* Specialization badge */}
            {specialization && (
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-slate-900 shadow">
                  {specialization}
                </span>
              </div>
            )}

            {/* Default state content - bottom */}
            <div className="absolute inset-x-0 bottom-0 p-3 transition-all duration-300 ease-out group-hover:opacity-0 group-hover:translate-y-2">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/60 mb-0.5">
                {associate.firmName || "Independent"}
              </p>
              <h3 className="text-sm font-semibold text-white leading-tight line-clamp-1">
                {associate.name || "Associate"}
              </h3>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/70 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />

            {/* Hover content */}
            <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 translate-y-3 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/50 mb-0.5">
                {associate.firmName || "Independent"}
              </p>
              <h3 className="text-sm font-semibold text-white leading-tight mb-2">
                {associate.name || "Associate"}
              </h3>

              {/* Minimal info row */}
              <div className="flex items-center gap-2 text-[10px] text-white/60 mb-2">
                <span>{associate.location || "Location TBD"}</span>
                {associate.experienceYears && (
                  <>
                    <span className="text-white/30">·</span>
                    <span>{associate.experienceYears}y exp</span>
                  </>
                )}
              </div>

              {/* Rate & CTA */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white">{formatRateText(associate)}</p>

                <span className="inline-flex items-center justify-center rounded bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-900 transition-colors duration-200 hover:bg-white/90">
                  View
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default AssociatePreviewGrid;
