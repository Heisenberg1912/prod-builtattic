import React from "react";
import { Link } from "react-router-dom";

const SimilarDesignsGrid = ({
  items = [],
  numberFormatter = (value) => value,
  onFallback,
  fallbackResolver,
}) => {
  if (!items.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Similar Designs:</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => {
          const perSqft = item.priceSqft ?? item.pricing?.basePrice ?? item.price ?? null;
          const curr = item.currency || item.pricing?.currency || "USD";
          return (
            <Link
              key={item._id || item.slug}
              to={item.slug ? `/studio/${item.slug}` : "#"}
              className="rounded-lg border border-slate-200 hover:border-slate-300 transition bg-white overflow-hidden"
            >
              {item.heroImage && (
                <img
                  src={item.heroImage}
                  alt={item.title}
                  className="w-full h-28 object-cover"
                  loading="lazy"
                  onError={(event) => onFallback?.(event, fallbackResolver?.(item))}
                />
              )}
              <div className="p-3">
                <div className="text-sm font-medium text-slate-900 line-clamp-1">{item.title}</div>
                <div className="text-xs text-slate-500 line-clamp-1">{item.firm?.name || item.studio || ""}</div>
                <div className="mt-2 text-xs text-slate-600">
                  {perSqft != null ? (
                    <>
                      {curr} {numberFormatter(perSqft)} per sq. ft.
                    </>
                  ) : (
                    "On request"
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default SimilarDesignsGrid;
