import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart } from "react-icons/hi";
import { getMaterialImage, getMaterialFallback, applyFallback } from "../../utils/imageFallbacks.js";
import PolygonVerifiedBadge from "../PolygonVerifiedBadge.jsx";

const WarehousePreviewGrid = ({
  materials = [],
  wishlistIds = new Set(),
  onToggleWishlist,
  onAddToCart
}) => {
  if (!Array.isArray(materials) || materials.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No materials found. Check back later for new products.
      </p>
    );
  }

  const formatPriceText = (material) => {
    if (!material.price) return "On request";
    return `$${material.price}/unit`;
  };

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {materials.map((material, index) => {
        const id = material._id || material.id || material.slug;
        const detailHref = `/warehouse/${id}`;
        const materialImage = getMaterialImage(material);
        const fallbackImage = getMaterialFallback();
        const isWishlisted = wishlistIds.has(material._id || material.id);

        return (
          <Link
            to={detailHref}
            key={id || index}
            className="group relative aspect-[3/2] overflow-hidden rounded-lg cursor-pointer block"
          >
            {/* Base image */}
            <img
              src={materialImage}
              alt={material.name || "Material"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              loading="lazy"
              onError={(e) => applyFallback(e, fallbackImage)}
            />

            {/* Default gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Web3 badge and wishlist button - always visible */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
              <PolygonVerifiedBadge
                tile={material}
                studioType="material"
                size="md"
                showText={true}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleWishlist?.(material);
                }}
                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow transition-all duration-200 hover:scale-110"
              >
                {isWishlisted ? (
                  <HiHeart className="w-3.5 h-3.5 text-red-500 fill-current" />
                ) : (
                  <HiOutlineHeart className="w-3.5 h-3.5 text-slate-700" />
                )}
              </button>
            </div>

            {/* Material family badge */}
            {material.family && (
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-slate-900 shadow">
                  {material.family}
                </span>
              </div>
            )}

            {/* Default state content - bottom */}
            <div className="absolute inset-x-0 bottom-0 p-3 transition-all duration-300 ease-out group-hover:opacity-0 group-hover:translate-y-2">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/60 mb-0.5">
                {material.vendorName || "Verified Supplier"}
              </p>
              <h3 className="text-sm font-semibold text-white leading-tight line-clamp-1">
                {material.name || "Material"}
              </h3>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/70 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />

            {/* Hover content */}
            <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 translate-y-3 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/50 mb-0.5">
                {material.vendorName || "Verified Supplier"}
              </p>
              <h3 className="text-sm font-semibold text-white leading-tight mb-2">
                {material.name || "Material"}
              </h3>

              {/* Minimal info row */}
              <div className="flex items-center gap-2 text-[10px] text-white/60 mb-2">
                {material.leadTime && (
                  <span>{material.leadTime}d delivery</span>
                )}
                {material.moq && (
                  <>
                    <span className="text-white/30">·</span>
                    <span>MOQ: {material.moq}</span>
                  </>
                )}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white">{formatPriceText(material)}</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onAddToCart?.(material);
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-900 transition-colors duration-200 hover:bg-white/90"
                >
                  <HiOutlineShoppingCart className="w-3 h-3" />
                  Add
                </button>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default WarehousePreviewGrid;
