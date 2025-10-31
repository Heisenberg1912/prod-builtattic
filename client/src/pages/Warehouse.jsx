import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  HiOutlineFilter,
  HiOutlineSearch,
  HiOutlineHeart,
  HiHeart,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { marketplaceFeatures } from "../data/marketplace.js";
import { fetchMaterials } from "../services/marketplace.js";
import { analyzeImage } from "../utils/imageSearch.js";
import {
  applyFallback,
  getMaterialFallback,
  getMaterialImage,
} from "../utils/imageFallbacks.js";
import { resolveMaterialStudioHero } from "../assets/materialStudioImages.js";

const extractWishlistIds = (items) => {
  const set = new Set();
  (items || []).forEach((entry) => {
    const key =
      entry?.productId ??
      entry?.id ??
      entry?._id ??
      entry?.slug;
    if (key != null) set.add(String(key));
  });
  return set;
};

const MATERIAL_FILTER_SECTIONS = {
  family: {
    label: "Material family",
    options: [
      "Concrete",
      "Steel",
      "Timber",
      "Composite",
      "Envelope",
      "Mechanical",
      "Finishes",
      "Modular Kits",
    ],
  },
  grade: {
    label: "Structural grade",
    options: [
      "Grade 60",
      "Grade 50",
      "ASTM A615",
      "EN 1090",
      "GL24",
      "Class A",
    ],
  },
  finish: {
    label: "Finish",
    options: [
      "Galvanized",
      "Epoxy coated",
      "Fire-treated",
      "Polished",
      "UV Sealed",
      "Weathering",
    ],
  },
  certification: {
    label: "Certification",
    options: [
      "FSC",
      "PEFC",
      "LEED",
      "CE Mark",
      "ISO 9001",
      "BIS",
    ],
  },
  leadTime: {
    label: "Lead time",
    options: [
      "<= 14 days",
      "15-30 days",
      "31-45 days",
      "46+ days",
    ],
  },
  moq: {
    label: "MOQ brackets",
    options: [
      "1-10 units",
      "11-50 units",
      "51-100 units",
      "100+ units",
    ],
  },
  supplier: {
    label: "Supplier region",
    options: [
      "North America",
      "Europe",
      "Asia-Pacific",
      "Middle East",
      "Latin America",
      "Africa",
    ],
  },
  logistics: {
    label: "Handling profile",
    options: [
      "Includes cranage",
      "Requires curing",
      "Prefabricated kit",
      "Bulk commodity",
    ],
  },
};

const createMaterialFilterState = () =>
  Object.fromEntries(Object.keys(MATERIAL_FILTER_SECTIONS).map((key) => [key, new Set()]));

const REGION_KEYWORDS = {
  "North America": ["usa", "united states", "canada", "mexico", "portland", "atlanta"],
  "Europe": ["germany", "france", "uk", "london", "spain", "italy", "denmark", "europe"],
  "Asia-Pacific": ["india", "china", "singapore", "australia", "malaysia", "vietnam", "asia"],
  "Middle East": ["dubai", "abu dhabi", "saudi", "riyadh", "doha", "middle east"],
  "Latin America": ["brazil", "colombia", "chile", "peru", "latam", "latin"],
  "Africa": ["nairobi", "south africa", "egypt", "kenya", "lagos", "africa"],
};

const LOGISTICS_KEYWORDS = {
  "Includes cranage": ["cranage", "lifting", "hoisting"],
  "Requires curing": ["curing", "post-tension", "hydration"],
  "Prefabricated kit": ["prefab", "modular", "kit"],
  "Bulk commodity": ["bulk", "aggregate", "commodity"],
};

const categorizeLeadTime = (days) => {
  if (!Number.isFinite(days)) return null;
  if (days <= 14) return "<= 14 days";
  if (days <= 30) return "15-30 days";
  if (days <= 45) return "31-45 days";
  return "46+ days";
};

const categorizeMoq = (qty) => {
  if (!Number.isFinite(qty)) return null;
  if (qty <= 10) return "1-10 units";
  if (qty <= 50) return "11-50 units";
  if (qty <= 100) return "51-100 units";
  return "100+ units";
};



const Warehouse = () => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlistItems = [] } = useWishlist();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [favourites, setFavourites] = useState(() => extractWishlistIds(wishlistItems));
  const [materials, setMaterials] = useState([]);
  const [web3Meta, setWeb3Meta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [materialFilters, setMaterialFilters] = useState(() => createMaterialFilterState());
  const [imageKeywords, setImageKeywords] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageStatus, setImageStatus] = useState("");
  const [imageSearching, setImageSearching] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    setFavourites(extractWishlistIds(wishlistItems));
  }, [wishlistItems]);

  useEffect(() => {
    let cancelled = false;
    async function loadMaterials() {
      setLoading(true);
      setError(null);
      setWeb3Meta(null);
      try {
        const { items, meta } = await fetchMaterials();
        if (!cancelled) {
          setMaterials(items);
          setWeb3Meta(meta?.web3 || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load warehouse catalogue.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadMaterials();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(materials.map((item) => item.category).filter(Boolean));
    return ["All", ...unique];
  }, [materials]);

  const filteredItems = useMemo(() => {
    const activeAdvancedFilters = Object.entries(materialFilters).filter(([, value]) => value?.size);

    return materials.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory ||
        (Array.isArray(item.categories) && item.categories.includes(selectedCategory));

      const matchesQuery = (() => {
        if (!query) return true;
        const needles = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!needles.length) return true;
        const haystack = [
          item.title,
          item.description,
          item.category,
          item.metafields?.vendor,
          item.metafields?.location,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());
        return needles.every((needle) => haystack.some((part) => part.includes(needle)));
      })();

      if (!matchesCategory || !matchesQuery) return false;
      if (!activeAdvancedFilters.length) return true;

      const pricing = item.pricing || {};
      const textSources = [
        item.title,
        item.description,
        item.category,
        ...(item.categories || []),
        ...(item.tags || []),
        ...(item.highlights || []),
        ...((item.specs || []).map((spec) => `${spec.label} ${spec.value}`)),
        item.delivery?.instructions,
        ...(item.delivery?.items || []),
      ];

      const textHaystack = textSources
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const includesText = (option) =>
        textHaystack.some((part) => part.includes(option.toLowerCase()));

      const leadTimeDays = (() => {
        if (Number.isFinite(item.metafields?.leadTimeDays)) return Number(item.metafields.leadTimeDays);
        if (Number.isFinite(item.delivery?.leadTimeWeeks)) return Number(item.delivery.leadTimeWeeks) * 7;
        if (Number.isFinite(pricing.leadTimeDays)) return Number(pricing.leadTimeDays);
        return null;
      })();
      const leadTimeLabel = categorizeLeadTime(leadTimeDays);

      const moqValue = (() => {
        if (Number.isFinite(item.metafields?.moq)) return Number(item.metafields.moq);
        if (Number.isFinite(pricing.minQuantity)) return Number(pricing.minQuantity);
        if (Number.isFinite(item.inventory)) return Number(item.inventory);
        return null;
      })();
      const moqLabel = categorizeMoq(moqValue);

      const location = String(item.metafields?.location || "").toLowerCase();

      const matchesRegion = (option) => {
        const keywords = REGION_KEYWORDS[option] || [];
        if (!keywords.length) return false;
        return keywords.some((keyword) => location.includes(keyword));
      };

      const matchesLogistics = (option) => {
        const keywords = LOGISTICS_KEYWORDS[option] || [];
        if (!keywords.length) return includesText(option);
        return keywords.some((keyword) => includesText(keyword));
      };

      return activeAdvancedFilters.every(([section, selections]) => {
        if (!selections?.size) return true;
        const options = Array.from(selections);
        switch (section) {
          case "family":
          case "grade":
          case "finish":
          case "certification":
            return options.some((option) => includesText(option));
          case "leadTime":
            return leadTimeLabel ? options.includes(leadTimeLabel) : false;
          case "moq":
            return moqLabel ? options.includes(moqLabel) : false;
          case "supplier":
            return options.some((option) => matchesRegion(option));
          case "logistics":
            return options.some((option) => matchesLogistics(option));
          default:
            return true;
        }
      });
    });
  }, [materials, selectedCategory, query, materialFilters]);

  const hasActiveMaterialFilters = useMemo(
    () => Object.values(materialFilters).some((set) => set?.size),
    [materialFilters],
  );

  const displayItems = useMemo(() => {
    if (!imageKeywords.length) return filteredItems;
    const needles = imageKeywords.map((kw) => kw.toLowerCase());
    return filteredItems.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.category,
        item.metafields?.vendor,
        item.metafields?.location,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return needles.some((needle) => haystack.some((part) => part.includes(needle)));
    });
  }, [filteredItems, imageKeywords]);

  const handleAddToCart = async (material) => {
    const key = material?._id ?? material?.id ?? material?.slug;
    if (!key) return;
    const price = Number(material.priceSqft ?? material.pricing?.basePrice ?? material.price ?? 0);
    const heroImage = resolveMaterialStudioHero(material);
    const payload = {
      productId: key,
      title: material.title,
      image: heroImage || getMaterialImage(material),
      price,
      quantity: 1,
      seller: material.metafields?.vendor || "Marketplace vendor",
      source: "Material",
      kind: "material",
      metadata: {
        category: material.category,
        unit: material.pricing?.unit || material.pricing?.unitLabel || material.metafields?.unit,
      },
    };
    try {
      await addToCart(payload);
      toast.success(`${material.title} added to cart`);
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart");
    }
  };

  const toggleFavourite = async (material) => {
    const key = material?._id ?? material?.id ?? material?.slug;
    if (!key) return;
    const stringKey = String(key);
    const isFav = favourites.has(stringKey);
    const heroImage = resolveMaterialStudioHero(material);
    const payload = {
      productId: key,
      title: material.title,
      image: heroImage || getMaterialImage(material),
      price: Number(material.priceSqft ?? material.pricing?.basePrice ?? material.price ?? 0),
      source: "Material",
    };
    try {
      if (isFav) {
        await removeFromWishlist(payload);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(payload);
        toast.success("Added to wishlist");
      }
      setFavourites((prev) => {
        const next = new Set(prev);
        isFav ? next.delete(stringKey) : next.add(stringKey);
        return next;
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not update wishlist");
    }
  };


  const handleMaterialFilterToggle = (section, option) => {
    setMaterialFilters((prev) => {
      const next = { ...prev };
      const nextSet = new Set(next[section] || []);
      if (nextSet.has(option)) {
        nextSet.delete(option);
      } else {
        nextSet.add(option);
      }
      next[section] = nextSet;
      return next;
    });
  };

  const handleClearMaterialFilters = () => {
    setMaterialFilters(createMaterialFilterState());
  };

  const handleReverseSearchClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageSearching(true);
    setImageStatus("Analysing reference image...");
    try {
      const result = await analyzeImage(file);
      setImagePreview(result.dataUrl);
      setImageKeywords(result.keywords);
      setImageStatus(`Matched colour keywords: ${result.keywords.join(", ")}`);
    } catch (err) {
      console.error("Reverse image search failed", err);
      setImagePreview(null);
      setImageKeywords([]);
      setImageStatus(err?.message || "Could not analyse the image.");
    } finally {
      setImageSearching(false);
      if (event.target) event.target.value = "";
    }
  };

  const clearImageSearch = () => {
    setImageKeywords([]);
    setImagePreview(null);
    setImageStatus("");
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  selectedCategory === category
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-slate-300"
          >
            <HiOutlineFilter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search materials, vendors, or specifications"
              className="w-full bg-white border border-slate-200 rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <button
            type="button"
            onClick={handleReverseSearchClick}
            disabled={imageSearching}
            className="whitespace-nowrap px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white hover:border-slate-300 disabled:opacity-60"
          >
            {imageSearching ? "Scanning..." : "Reverse image"}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
          />
        </div>

        {(imageStatus || imagePreview || imageKeywords.length > 0) && (
          <section className="bg-white border border-slate-200 rounded-xl px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-slate-700">Reverse image search</p>
              <p className="text-slate-500">
                {imageStatus || "Upload a reference photo to surface similar inventory."}
              </p>
              {imageKeywords.length > 0 && (
                <p className="text-slate-400 text-xs uppercase tracking-wide">
                  Matched keywords: {imageKeywords.join(", ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Reverse search preview"
                  className="w-16 h-16 rounded-lg border border-slate-200 object-cover"
                />
              )}
              {imageKeywords.length > 0 && (
                <button
                  type="button"
                  onClick={clearImageSearch}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
          </section>
        )}

        {!loading && web3Meta && (

          <div className="rounded-2xl border border-amber-200 bg-amber-900/90 px-6 py-5 text-amber-100 shadow-sm">

            <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300">

              Warehouse provenance

            </p>

            <div className="mt-2 flex flex-wrap items-center gap-4">

              <h2 className="text-xl font-semibold">

                {web3Meta.total ?? 0} inventory proofs anchored on {web3Meta.chain ?? "Polygon"}

              </h2>

              {Array.isArray(web3Meta.anchors) && web3Meta.anchors.length > 0 ? (

                <p className="text-xs text-amber-200">

                  Latest anchors: {web3Meta.anchors.slice(0, 3).join(" · ")}

                </p>

              ) : null}

            </div>

          </div>

        )}



        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">Refine by material attributes</p>
                {hasActiveMaterialFilters && (
                  <button
                    type="button"
                    onClick={handleClearMaterialFilters}
                    className="text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Clear selections
                  </button>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {Object.entries(MATERIAL_FILTER_SECTIONS).map(([section, config]) => (
                  <div key={section} className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {config.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {config.options.map((option) => {
                        const isActive = materialFilters[section]?.has(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleMaterialFilterToggle(section, option)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              isActive
                                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          )}
        </AnimatePresence>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Loading warehouse inventory
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            displayItems.map((item) => {
              const materialKey = item._id ?? item.id ?? item.slug;
              const favourite = materialKey ? favourites.has(String(materialKey)) : false;
              const pricing = item.pricing || {};
              const vendor = item.metafields?.vendor || "Builtattic partner";
              const location = item.metafields?.location || "Global";
              const heroOverride = resolveMaterialStudioHero(item);
              const materialImage = heroOverride || getMaterialImage(item);
              const materialFallback = heroOverride || getMaterialFallback(item);
              const moq =
                item.metafields?.moq ??
                pricing.minQuantity ??
                item.inventory ??
                0;
              const leadTime =
                item.metafields?.leadTimeDays ||
                (item.delivery?.leadTimeWeeks
                  ? `${item.delivery.leadTimeWeeks * 7}`
                  : null);

              const detailPath = item.slug
                ? `/warehouse/${item.slug}`
                : `/warehouse/${item._id}`;

              return (
                <motion.article
                  key={item._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <Link to={detailPath} className="block h-full">
                    <div className="relative">
                      <img
                        src={materialImage}
                        alt={item.title}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                        onError={(event) => applyFallback(event, materialFallback)}
                      />
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleFavourite(item);
                        }}
                        className="absolute top-3 right-3 bg-white/85 rounded-full p-2 shadow-sm"
                        aria-label="Toggle favourite"
                      >
                        {favourite ? (
                          <HiHeart className="text-rose-500 w-5 h-5" />
                        ) : (
                          <HiOutlineHeart className="text-slate-700 w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <p className="uppercase tracking-[0.3em] text-xs text-slate-400 mb-2">
                          {item.category}
                        </p>
                        <h2 className="text-xl font-semibold text-slate-900">
                          {item.title}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {vendor}, {location}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                        <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                          <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-1">
                            Unit price
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {pricing.basePrice
                              ? `${pricing.currency || "USD"} ${pricing.basePrice}`
                              : "On request"}
                          </p>
                          {pricing.unitLabel && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              {pricing.unitLabel}
                            </p>
                          )}
                        </div>
                        <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                          <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-1">
                            MOQ & lead time
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            MOQ {moq.toLocaleString()}
                          </p>
                          {leadTime && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              Lead time {leadTime} days
                            </p>
                          )}
                        </div>
                      </div>

                      {item.highlights?.length ? (
                        <ul className="text-xs text-slate-500 space-y-1">
                          {item.highlights.slice(0, 3).map((highlight) => (
                            <li key={highlight}>• {highlight}</li>
                          ))}
                        </ul>
                      ) : null}

                      {item.delivery?.items?.length ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
                          <p className="text-slate-400 uppercase tracking-widest mb-2">
                            Portfolio deliverables
                          </p>
                          <ul className="space-y-1">
                            {item.delivery.items.slice(0, 3).map((deliverable) => (
                              <li key={deliverable}>• {deliverable}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleAddToCart(item);
                          }}
                          className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                        >
                          Add to cart
                        </button>
                        <button
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleFavourite(item);
                          }}
                          className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition"
                        >
                          {favourite ? "Remove from wishlist" : "Add to wishlist"}
                        </button>
                        <button className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition">
                          Enquire
                        </button>
                        {item.web3Proof?.explorerUrl && (
                          <a
                            href={item.web3Proof.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-medium text-amber-600 hover:text-amber-500"
                          >
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            On-chain proof · {item.web3Proof.anchor}
                          </a>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
        </section>

        {!loading && displayItems.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No materials match the current filters. Adjust your search to explore
            more inventory.
          </div>
        )}

        <section className="">
          <div className="grid md:grid-cols-3 gap-8">
            {marketplaceFeatures.map((feature) => (
              <div key={feature.title}>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Warehouse;
