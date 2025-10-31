// StudioDetail.jsx  updated to match the provided reference layout (no backend changes)
// - Left: large hero image
// - Right: clean info stack (Title, Firm, meta list) + compact pricing/CTA card
// - Below: wide section blocks  Description, Features, Amenities, Specifications, About the Designers
// - Bottom: Similar Designs horizontal cards with price per sq ft
// Uses only existing fields returned by fetchStudioBySlug; falls back gracefully.

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import Footer from "../components/Footer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { fallbackStudios } from "../data/marketplace.js";
import { fetchStudioBySlug } from "../services/marketplace.js";

const number = (v, dp = 0) =>
  typeof v === "number" && isFinite(v)
    ? v.toLocaleString(undefined, { maximumFractionDigits: dp })
    : null;

const lc = (s) => String(s || "").toLowerCase();
const startCase = (value = "") =>
  String(value)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getSpecValue = (studio, labels = []) => {
  const inSpecs =
    (studio?.specs || []).find((x) =>
      labels.some((lbl) => lc(x?.label) === lc(lbl))
    )?.value ?? null;

  if (inSpecs != null) return inSpecs;

  const meta = studio?.metadata || {};
  for (const k of Object.keys(meta)) {
    if (labels.some((lbl) => lc(k) === lc(lbl))) return meta[k];
  }
  return null;
};

const resolvePricePerSqft = (s) => {
  const raw =
    s?.priceSqft ??
    s?.pricing?.basePrice ??
    s?.pricing?.total ??
    s?.price ??
    s?.cost ??
    null;
  if (raw == null) return null;
  if (typeof raw === "number") return isFinite(raw) ? raw : null;
  const n = parseFloat(String(raw).replace(/[^0-9.]+/g, ""));
  return isFinite(n) ? n : null;
};

const resolveAreaSqft = (s) =>
  s?.areaSqft ??
  s?.area?.sqft ??
  s?.metrics?.areaSqft ??
  s?.sizeSqft ??
  s?.size ??
  null;

const resolvePlotAreaSqft = (s) =>
  s?.plotAreaSqft ??
  s?.metrics?.plotAreaSqft ??
  s?.metrics?.plotArea ??
  s?.plot?.areaSqft ??
  s?.plot?.area ??
  s?.site?.areaSqft ??
  null;

const resolveStyle = (s) => {
  const arr = [
    s?.style,
    ...(s?.styles || []),
    ...(s?.firm?.styles || []),
  ].filter(Boolean);
  return arr.length ? arr[0] : null;
};

const resolveCategory = (s) =>
  s?.primaryCategory || (Array.isArray(s?.categories) ? s.categories[0] : null);

const currencyOf = (s) => s?.currency || s?.pricing?.currency || "USD";

const StudioDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist } = useWishlist();
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const galleryImages = useMemo(() => {
    if (!studio) return [];
    const sources = [
      studio.heroImage,
      ...(Array.isArray(studio.gallery) ? studio.gallery : []),
      ...(Array.isArray(studio.images) ? studio.images : []),
    ].filter(Boolean);
    return Array.from(new Set(sources));
  }, [studio]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [studio?.slug]);

  const showNextImage = () => {
    if (galleryImages.length < 2) return;
    setActiveImageIndex((index) => (index + 1) % galleryImages.length);
  };

  const showPreviousImage = () => {
    if (galleryImages.length < 2) return;
    setActiveImageIndex((index) => (index - 1 + galleryImages.length) % galleryImages.length);
  };

  const activeGalleryImage = galleryImages.length
    ? galleryImages[Math.min(activeImageIndex, galleryImages.length - 1)]
    : null;


  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await fetchStudioBySlug(id);
        if (!cancelled) setStudio(item || null);
        if (!item && !cancelled) setError("Studio not found.");
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.status === 404
              ? "Studio not found."
              : err?.message || "We could not load this studio right now."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const pricePerSqft = useMemo(() => resolvePricePerSqft(studio), [studio]);
  const areaSqft = useMemo(() => resolveAreaSqft(studio), [studio]);
  const plotAreaSqft = useMemo(() => resolvePlotAreaSqft(studio), [studio]);
  const totalPrice = useMemo(() => {
    const area = plotAreaSqft || areaSqft;
    if (pricePerSqft != null && area != null) return pricePerSqft * Number(area);
    return null;
  }, [pricePerSqft, areaSqft, plotAreaSqft]);

  const currency = currencyOf(studio);

  const bedroomCount =
    getSpecValue(studio, ["bedrooms", "number of bedrooms"]) ??
    studio?.bedrooms ??
    studio?.metadata?.bedrooms ??
    null;

  const bathroomCount =
    getSpecValue(studio, ["bathrooms", "number of bathrooms"]) ??
    studio?.bathrooms ??
    studio?.metadata?.bathrooms ??
    null;

  const roomsCount =
    getSpecValue(studio, ["rooms", "number of rooms"]) ??
    studio?.rooms ??
    studio?.metadata?.rooms ??
    null;

  const floorsCount =
    getSpecValue(studio, ["floors", "number of floors"]) ??
    studio?.floors ??
    studio?.metadata?.floors ??
    null;

  const style = resolveStyle(studio);
  const category = resolveCategory(studio);

  const features = useMemo(() => {
    if (!studio) return [];
    const arr = Array.isArray(studio.features)
      ? studio.features
      : Array.isArray(studio.tags)
      ? studio.tags
      : [];
    // stringify robustly
    return arr
      .map((x) => {
        if (x == null) return null;
        if (typeof x === "string") return x;
        if (typeof x === "object") return x.label || x.name || x.title || null;
        return String(x);
      })
      .filter(Boolean);
  }, [studio]);

  const amenities = useMemo(() => {
    const arr = Array.isArray(studio?.amenities) ? studio.amenities : [];
    return arr.map((x) => (typeof x === "string" ? x : x?.label || x?.name)).filter(Boolean);
  }, [studio]);

  const specifications = useMemo(() => {
    const specsArr = Array.isArray(studio?.specs) ? studio.specs : [];
    if (specsArr.length) return specsArr;

    // Build a few useful derived specs from scattered fields (non-destructive)
    const derived = [];
    const push = (label, value, unit) => {
      if (value == null || value === "") return;
      derived.push({ label, value, unit });
    };
    push("Style", style);
    push("Primary Category", category);
    push("Plot Size", number(plotAreaSqft || areaSqft), "sq ft");
    push("Bedrooms", bedroomCount);
    push("Bathrooms", bathroomCount);
    push("Number of Rooms", roomsCount);
    push("Number of Floors", floorsCount);
    push("Terrain", studio?.terrain || studio?.site?.terrain || studio?.metadata?.terrain);
    push("Climate", studio?.climate || studio?.metadata?.climate || studio?.environment?.climate);
    push("Roof Type", studio?.roofType || studio?.metadata?.roofType);
    push("Interior Layout", studio?.interiorLayout || studio?.metadata?.interiorLayout);
    push("Material", studio?.material || (studio?.materials || [])[0]);
    return derived;
  }, [studio, style, category, plotAreaSqft, areaSqft, bedroomCount, bathroomCount, roomsCount, floorsCount]);

  const recommendations = useMemo(() => {
    const pool = fallbackStudios.filter(
      (item) =>
        item.slug !== studio?.slug &&
        item._id !== studio?._id &&
        item.kind === "studio"
    );
    const preferred = category;
    if (preferred) {
      const matches = pool.filter((it) => (it.categories || []).includes(preferred));
      if (matches.length >= 5) return matches.slice(0, 6);
    }
    return pool.slice(0, 6);
  }, [studio, category]);

  const deliveryDetails = useMemo(() => {
    const info = studio?.delivery;
    if (!info) return { points: [], note: null };
    const { leadTimeWeeks, fulfilmentType, handoverMethod, includesInstallation, items, instructions } = info;
    const points = [];
    if (Number.isFinite(leadTimeWeeks)) {
      points.push(`${leadTimeWeeks} week lead time`);
    }
    if (fulfilmentType) {
      points.push(`${startCase(fulfilmentType)} fulfilment`);
    }
    if (handoverMethod) {
      points.push(`Handover via ${startCase(handoverMethod)}`);
    }
    if (typeof includesInstallation === "boolean") {
      points.push(includesInstallation ? "Installation support included" : "Digital deliverables");
    }
    if (Array.isArray(items)) {
      items.filter(Boolean).forEach((label) => points.push(label));
    }
    return {
      points,
      note: instructions || null,
    };
  }, [studio]);

  const buildCartPayload = () => {
    if (!studio) return null;
    const productId = studio._id ?? studio.slug ?? id;
    const priceValue = Number(totalPrice ?? pricePerSqft ?? 0);
    return {
      productId,
      id: productId,
      title: studio.title,
      image: studio.heroImage || studio.gallery?.[0] || "",
      price: priceValue,
      quantity: 1,
      seller: studio.firm?.name || studio.studio || "Studio partner",
      source: "Studio",
      kind: "studio",
      metadata: {
        category,
        style,
        areaSqft: areaSqft ?? plotAreaSqft,
      },
    };
  };

  const buildWishlistPayload = () => {
    const cartPayload = buildCartPayload();
    if (!cartPayload) return null;
    return {
      productId: cartPayload.productId,
      title: cartPayload.title,
      image: cartPayload.image,
      price: cartPayload.price,
      source: cartPayload.source,
    };
  };

  const handleAddStudioToCart = async () => {
    const payload = buildCartPayload();
    if (!payload) return;
    try {
      await addToCart(payload);
      toast.success("Studio added to cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not add studio to cart");
    }
  };

  const handleBuyNow = async () => {
    const payload = buildCartPayload();
    if (!payload) return;
    try {
      await addToCart(payload);
      toast("This is a demo, we are unable to serve you right now, apologies for the inconvenience caused!", {
        duration: 4000,
        style: { maxWidth: "420px" },
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not start checkout right now");
    }
  };

  const handleAddStudioToWishlist = async () => {
    const payload = buildWishlistPayload();
    if (!payload) return;
    try {
      await addToWishlist(payload);
      toast.success("Added to wishlist");
    } catch (err) {
      console.error(err);
      toast.error("Could not add studio to wishlist");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 text-slate-500 text-sm">
            Loading studio
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 px-4">
        <h2 className="text-2xl font-semibold mb-3">{error || "Studio not found"}</h2>
        <p className="text-sm text-slate-600 mb-6 text-center max-w-md">
          Try returning to the studio marketplace to explore other catalogue-ready systems.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-100"
          >
            Go back
          </button>
          <Link
            to="/studio"
            className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800"
          >
            Studio marketplace
          </Link>
        </div>
      </div>
    );
  }

  const firmName = studio?.firm?.name || studio?.studio || "Studio";
  const firmCountry =
    studio?.firm?.location?.country || studio?.location?.country || "";
  const createdStamp = (() => {
    const dt = studio?.createdAt ? new Date(studio.createdAt) : null;
    if (!dt) return null;
    return dt.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  // Title stack meta rows (right column, under title)
  const rightMetaRows = [
    ["Pricing", pricePerSqft != null ? `${currency} ${number(pricePerSqft)} per sq ft` : "On request"],
    ["Style", style || "-"],
    ["Plot Size", (plotAreaSqft || areaSqft) ? `${number(plotAreaSqft || areaSqft)} sq ft` : "-"],
    ["Bedrooms", bedroomCount ?? "-"],
    ["Bathrooms", bathroomCount ?? "-"],
    ["Number of Rooms", roomsCount ?? "-"],
    ["Number of Floors", floorsCount ?? "-"],
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-10">
        {/* Top two-column layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: gallery with controls */}
          <div className="lg:col-span-7">
            <div className="rounded-xl bg-slate-100 p-2 sm:p-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-200">
                <AnimatePresence mode="wait">
                  {activeGalleryImage ? (
                    <motion.img
                      key={activeGalleryImage}
                      src={activeGalleryImage}
                      alt={studio.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.35 }}
                    />
                  ) : (
                    <motion.div
                      key="placeholder"
                      className="h-full w-full bg-slate-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </AnimatePresence>

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {galleryImages.map((imageUrl, index) => (
                    <button
                      key={`studio-thumb-${studio.slug}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg transition ${
                        index === activeImageIndex
                          ? 'ring-2 ring-black/80'
                          : 'ring-1 ring-white/60 hover:ring-black/40'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${studio.title} preview ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: title/meta and price card */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Title + firm + metadata list */}
            <div className="space-y-2">
              <h1 className="text-[22px] leading-6 font-semibold">{studio.title}</h1>

              <div className="text-sm">
                <Link to="#" className="text-slate-700 hover:text-slate-900 font-medium">
                  {firmName}
                </Link>
              </div>

              <div className="text-xs text-slate-500">{category || "Design"}</div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
                {rightMetaRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-slate-100 py-1">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 text-xs text-slate-500">
                Created in{" "}
                {studio?.location?.city
                  ? `${studio.location.city}, ${studio.location.country || ""}`
                  : firmCountry || ""}
                {createdStamp ? ` | ${createdStamp}` : ""}
              </div>
            </div>

            {/* Price/CTA card */}
            <div className="rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-500">Total price</div>
                  <div className="text-2xl font-semibold">
                    {totalPrice != null ? `${currency} ${number(totalPrice)}` : "On request"}
                  </div>
                  {pricePerSqft != null && (plotAreaSqft || areaSqft) ? (
                    <div className="text-xs text-slate-500 mt-1">
                      Calculated by {currency} {number(pricePerSqft)} {" "}
                      {number(plotAreaSqft || areaSqft)} sq ft
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:flex-1"
                >
                  Buy now
                </button>
                <button
                  type="button"
                  onClick={handleAddStudioToCart}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 sm:flex-1"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={handleAddStudioToWishlist}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 sm:flex-1"
                >
                  Add to wishlist
                </button>
              </div>

              {deliveryDetails.points.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {deliveryDetails.points.map((label, index) => (
                    <li key={`delivery-point-${index}`} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {deliveryDetails.note && (
                <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                  {deliveryDetails.note}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Wide information band */}
        <section className="mt-10 rounded-lg bg-slate-50 border border-slate-200 p-5 lg:p-6">
          <div className="space-y-6 text-sm">
            {/* Description */}
            <div>
              <h2 className="font-semibold text-slate-800 mb-1">Description:</h2>
              <p className="text-slate-700">
                {studio.summary || studio.description || ""}
              </p>
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-800 mb-1">Features:</h2>
                <p className="text-slate-700">
                  {features.join(", ")}
                </p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-800 mb-1">Amenities:</h2>
                <p className="text-slate-700">{amenities.join(", ")}</p>
              </div>
            )}

            {/* Specifications */}
            {specifications.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-800 mb-1">Specifications:</h2>
                <div className="space-y-1 text-slate-700">
                  {specifications.map((s, idx) => (
                    <div key={`${s.label}-${idx}`}>
                      <span className="font-medium">{s.label}:</span>{" "}
                      <span>
                        {typeof s.value === "number" ? number(s.value) : String(s.value)}
                        {s.unit ? ` ${s.unit}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About the Designers */}
            <div>
              <h2 className="font-semibold text-slate-800 mb-1">About the Designers:</h2>
              <p className="text-slate-700">
                {studio?.firm?.bio ||
                  studio?.bio ||
                  "Studio partner providing catalogue-ready systems and bespoke design services."}
              </p>
            </div>
          </div>
        </section>

        {/* Similar Designs */}
        {recommendations.length > 0 && (
          <section className="mt-10">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Similar Designs:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {recommendations.map((item) => {
                const perSqft =
                  item.priceSqft ?? item.pricing?.basePrice ?? item.price ?? null;
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
                      />
                    )}
                    <div className="p-3">
                      <div className="text-sm font-medium text-slate-900 line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {item.firm?.name || item.studio || ""}
                      </div>
                      <div className="mt-2 text-xs text-slate-600">
                        {perSqft != null ? (
                          <>
                            {curr} {number(perSqft)} per sq. ft.
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
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StudioDetail;










