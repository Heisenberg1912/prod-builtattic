import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { Range } from "react-range";
import { toast } from "react-hot-toast";
import { HiOutlineSearch } from "react-icons/hi";
import {
  HiOutlineSparkles,
  HiOutlineHeart,
  HiHeart,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineXMark,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
  fetchProductCatalog,
  getProductSearchRecords,
} from "../services/marketplace.js";
import {
  createProductSearchEngine,
  getSearchSuggestions,
  listSavedSearches,
  upsertSavedSearch,
  removeSavedSearch,
  listRecentViews,
  recordRecentView,
} from "../utils/productDiscovery.js";
import { analyzeImage } from "../utils/imageSearch.js";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Rating" },
  { value: "newest", label: "Latest updates" },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getBestOffer = (product) => {
  if (!product?.offers?.length) return null;
  const defaultVariation =
    product.variations?.find((variation) => variation.isDefault) ||
    product.variations?.[0];
  const defaultId = defaultVariation?.id;
  const withPrimary = product.offers.reduce(
    (acc, offer) => {
      const record = { ...offer };
      const pricing =
        offer.pricingByVariation?.[defaultId] ||
        Object.values(offer.pricingByVariation || {})[0];
      record.bestPrice = pricing?.price ?? product.pricing?.basePrice ?? null;
      return acc.concat(record);
    },
    [],
  );
  return withPrimary
    .filter((offer) => Number.isFinite(offer.bestPrice))
    .sort((a, b) => a.bestPrice - b.bestPrice)[0] || withPrimary[0];
};

const getPriceBounds = (product) => {
  const values = [];
  const pushPrice = (price) => {
    if (Number.isFinite(price)) values.push(price);
  };
  (product.variations || []).forEach((variation) =>
    pushPrice(Number(variation?.price)),
  );
  (product.offers || []).forEach((offer) => {
    Object.values(offer?.pricingByVariation || {}).forEach((pricing) =>
      pushPrice(Number(pricing?.price)),
    );
  });
  pushPrice(Number(product?.pricing?.basePrice));
  if (!values.length) return { min: 0, max: 0 };
  return { min: Math.min(...values), max: Math.max(...values) };
};

const getAverageRating = (product) => {
  if (product?.reviews?.length) {
    const total = product.reviews.reduce(
      (acc, review) => acc + Number(review.rating || 0),
      0,
    );
    return total / product.reviews.length;
  }
  const offerRatings = (product?.offers || [])
    .map((offer) => Number(offer.rating || 0))
    .filter((rating) => Number.isFinite(rating));
  if (!offerRatings.length) return null;
  return (
    offerRatings.reduce((acc, rating) => acc + rating, 0) / offerRatings.length
  );
};

const formatCurrency = (value, currency = "INR") => {
  if (!Number.isFinite(value)) return "On request";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const ProductList = () => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlistItems } = useWishlist();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSeller, setSelectedSeller] = useState("All");
  const [selectedTags, setSelectedTags] = useState([]);
  const [attributeFilters, setAttributeFilters] = useState({});
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [sortOption, setSortOption] = useState("relevance");

  const [savedSearches, setSavedSearches] = useState(listSavedSearches());
  const [recentViews, setRecentViews] = useState(listRecentViews());

  const [searchEngine, setSearchEngine] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [reverseImageStatus, setReverseImageStatus] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const { items, meta } = await fetchProductCatalog();
        if (cancelled) return;
        setProducts(items);
        setFacets(meta?.facets || null);
        if (meta?.facets?.priceRange) {
          const { min, max } = meta.facets.priceRange;
          setPriceRange([min ?? 0, max ?? 0]);
        }
        const engine = createProductSearchEngine(getProductSearchRecords());
        setSearchEngine(engine);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Unable to load products right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!searchEngine || !debouncedQuery) {
      setSuggestions([]);
      return;
    }
    const nextSuggestions = getSearchSuggestions(
      searchEngine,
      debouncedQuery,
      6
    );
    setSuggestions(nextSuggestions);
  }, [debouncedQuery, searchEngine]);

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((entry) => entry !== tag)
        : [...prev, tag]
    );
  };

  const handleToggleAttribute = (code, value) => {
    setAttributeFilters((prev) => {
      const current = prev[code] || [];
      const exists = current.includes(value);
      const nextValues = exists
        ? current.filter((entry) => entry !== value)
        : [...current, value];
      const next = { ...prev, [code]: nextValues };
      if (!nextValues.length) {
        delete next[code];
      }
      return next;
    });
  };

  const currentFilters = useMemo(
    () => ({
      category: selectedCategory !== "All" ? selectedCategory : null,
      seller: selectedSeller !== "All" ? selectedSeller : null,
      tags: selectedTags,
      attributes: attributeFilters,
      price: { min: priceRange[0], max: priceRange[1] }
    }),
    [selectedCategory, selectedSeller, selectedTags, attributeFilters, priceRange]
  );

  const filteredProducts = useMemo(() => {
    const queryLc = debouncedQuery.trim().toLowerCase();
    return products
      .filter((product) => {
        const categoryOk =
          selectedCategory === "All" ||
          (product.categories || []).includes(selectedCategory);
        if (!categoryOk) return false;

        const sellerOk =
          selectedSeller === "All" ||
          (product.offers || []).some(
            (offer) =>
              offer.sellerName === selectedSeller ||
              offer.sellerId === selectedSeller
          );
        if (!sellerOk) return false;

        const tagOk =
          !selectedTags.length ||
          selectedTags.every((tag) => (product.tags || []).includes(tag));
        if (!tagOk) return false;

        const attributesOk = Object.entries(attributeFilters).every(
          ([code, values]) => {
            if (!values.length) return true;
            const dimension = (product.variationDimensions || []).find(
              (option) => option.code === code
            );
            if (!dimension) return false;
            const available = new Set(
              (dimension.values || []).map((entry) => entry?.value || entry)
            );
            return values.every((value) => available.has(value));
          }
        );
        if (!attributesOk) return false;

        const { min, max } = getPriceBounds(product);
        const priceOk =
          min <= priceRange[1] && max >= priceRange[0] && min <= max;
        if (!priceOk) return false;

        if (!queryLc) return true;
        const inBasics =
          product.title.toLowerCase().includes(queryLc) ||
          product.description?.toLowerCase().includes(queryLc) ||
          product.metafields?.vendor?.toLowerCase().includes(queryLc);
        if (inBasics) return true;
        return (product.searchKeywords || []).some((keyword) =>
          keyword.toLowerCase().includes(queryLc)
        );
      })
      .sort((a, b) => {
        if (sortOption === "price-asc") {
          return getPriceBounds(a).min - getPriceBounds(b).min;
        }
        if (sortOption === "price-desc") {
          return getPriceBounds(b).min - getPriceBounds(a).min;
        }
        if (sortOption === "rating-desc") {
          const ratingA = getAverageRating(a) ?? 0;
          const ratingB = getAverageRating(b) ?? 0;
          return ratingB - ratingA;
        }
        if (sortOption === "newest") {
          const updatedA =
            new Date(a.offers?.[0]?.lastUpdated || 0).getTime() || 0;
          const updatedB =
            new Date(b.offers?.[0]?.lastUpdated || 0).getTime() || 0;
          return updatedB - updatedA;
        }
        return 0;
      });
  }, [
    products,
    debouncedQuery,
    selectedCategory,
    selectedSeller,
    selectedTags,
    attributeFilters,
    priceRange,
    sortOption
  ]);
  const isInWishlist = useCallback(
    (productId) =>
      wishlistItems.some((item) => String(item.productId) === String(productId)),
    [wishlistItems]
  );

  const handleToggleWishlist = (product) => {
    const exists = isInWishlist(product._id);
    if (exists) {
      removeFromWishlist({ productId: product._id });
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        productId: product._id,
        title: product.title,
        image: product.heroImage,
        price: getPriceBounds(product).min
      });
      toast.success("Added to wishlist");
    }
  };

  const handleAddToCart = (product) => {
    const bestOffer = getBestOffer(product);
    const defaultVariation =
      product.variations?.find((variation) => variation.isDefault) ||
      product.variations?.[0];
    const price =
      bestOffer?.pricingByVariation?.[defaultVariation?.id]?.price ??
      defaultVariation?.price ??
      product.pricing?.basePrice ??
      0;
    addToCart({
      productId: product._id,
      title: product.title,
      image: product.heroImage,
      price,
      quantity: defaultVariation?.minQty || 1,
      seller: bestOffer?.sellerName || "Marketplace seller",
      variation: defaultVariation?.label || "",
      source: "Marketplace"
    });
    toast.success(`${product.title} added to cart`);
  };

  const handleSaveSearch = () => {
    const saved = upsertSavedSearch({
      label: debouncedQuery || selectedCategory || "Marketplace search",
      query: debouncedQuery,
      filters: currentFilters
    });
    setSavedSearches(listSavedSearches());
    toast.success(`Saved search "${saved.label}"`);
  };

  const handleApplySavedSearch = (entry) => {
    setQuery(entry.query || "");
    setSelectedCategory(entry.filters?.category || "All");
    setSelectedSeller(entry.filters?.seller || "All");
    setSelectedTags(entry.filters?.tags || []);
    setAttributeFilters(entry.filters?.attributes || {});
    const price = entry.filters?.price;
    if (price?.min != null && price?.max != null) {
      setPriceRange([price.min, price.max]);
    }
  };

  const handleRemoveSavedSearch = (id) => {
    removeSavedSearch(id);
    setSavedSearches(listSavedSearches());
  };

  const handleClearFilters = () => {
    setSelectedCategory("All");
    setSelectedSeller("All");
    setSelectedTags([]);
    setAttributeFilters({});
    if (facets?.priceRange) {
      setPriceRange([
        facets.priceRange.min ?? 0,
        facets.priceRange.max ?? 0
      ]);
    }
  };
  const handleReverseImageSearch = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setReverseImageStatus("Analyzing reference image...\u2026");
    try {
      const result = await analyzeImage(file);
      const keywords = (result.keywords || []).join(" ");
      setQuery(keywords);
      setReverseImageStatus(`Matched palette: ${keywords}`);
    } catch (err) {
      setReverseImageStatus(err?.message || "Could not analyze the image.");
    } finally {
      event.target.value = "";
    }
  };

  const handleProductClick = (product) => {
    recordRecentView(product);
    setRecentViews(listRecentViews());
  };

  const categories = useMemo(
    () =>
      ["All"].concat(
        (facets?.categories || []).map((entry) => entry.name).filter(Boolean)
      ),
    [facets]
  );

  const sellers = useMemo(
    () =>
      ["All"].concat(
        (facets?.sellers || []).map((entry) => entry.name).filter(Boolean)
      ),
    [facets]
  );

  const availableTags = useMemo(
    () => (facets?.tags || []).map((entry) => entry.name),
    [facets]
  );

  const attributeOptions = useMemo(
    () => facets?.attributes || [],
    [facets]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="uppercase tracking-[0.35em] text-xs text-slate-400">
                materials marketplace
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold mt-2">
                Source materials with buy-box clarity
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
                Compare fulfilment-ready offers, shipping SLAs, and QA collateral
                across verified suppliers. Save searches, pin preferred filters, and
                re-order with Subscribe &amp; Save.
              </p>
            </div>
            <button
              onClick={handleSaveSearch}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition"
            >
              <HiOutlineSparkles className="w-5 h-5 text-slate-500" />
              Save search
            </button>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                  placeholder="Search by material, supplier, spec..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.slug}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setQuery(suggestion.title);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        {suggestion.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSeller}
                  onChange={(event) => setSelectedSeller(event.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {sellers.map((seller) => (
                    <option key={seller} value={seller}>
                      {seller}
                    </option>
                  ))}
                </select>

                <select
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <button
                onClick={handleReverseImageSearch}
                className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 transition text-sm font-medium"
              >
                <HiOutlinePhoto className="w-4 h-4 text-slate-500" />
                Reverse image search
              </button>
              {reverseImageStatus && (
                <span className="text-slate-500">{reverseImageStatus}</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelected}
              />
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700"
              >
                <HiOutlineAdjustmentsHorizontal className="w-4 h-4" />
                Clear filters
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {savedSearches.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Saved searches
                </h2>
                <p className="text-xs text-slate-500">
                  Quickly re-run procurement views you rely on.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((entry) => (
                <div
                  key={entry.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 border border-slate-200"
                >
                  <button
                    onClick={() => handleApplySavedSearch(entry)}
                    className="text-xs font-medium text-slate-700"
                  >
                    {entry.label}
                  </button>
                  <button
                    onClick={() => handleRemoveSavedSearch(entry.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <HiOutlineXMark className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.3em]">
                Price range
              </h2>
              <Range
                step={10}
                min={facets?.priceRange?.min ?? 0}
                max={facets?.priceRange?.max ?? 1000}
                values={priceRange}
                onChange={(values) =>
                  setPriceRange([
                    clamp(
                      values[0],
                      facets?.priceRange?.min ?? 0,
                      facets?.priceRange?.max ?? 0
                    ),
                    clamp(
                      values[1],
                      facets?.priceRange?.min ?? 0,
                      facets?.priceRange?.max ?? 0
                    )
                  ])
                }
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    className="h-2 rounded-full bg-slate-200"
                  >
                    <div className="h-2 bg-slate-900 rounded-full" style={{ width: "100%" }}>
                      {children}
                    </div>
                  </div>
                )}
                renderThumb={({ props }) => (
                  <div
                    {...props}
                    className="w-4 h-4 bg-white border border-slate-300 rounded-full shadow"
                  />
                )}
              />
              <div className="flex justify-between text-xs text-slate-600">
                <span>{formatCurrency(priceRange[0])}</span>
                <span>{formatCurrency(priceRange[1])}</span>
              </div>
            </div>

            {availableTags.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 uppercase tracking-[0.3em]">
                  <HiOutlineTag className="w-4 h-4" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full border text-xs ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {attributeOptions.map((attribute) => (
              <div
                key={attribute.code}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
              >
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.3em]">
                  {attribute.label}
                </h3>
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  {attribute.values.map((entry) => {
                    const active =
                      (attributeFilters[attribute.code] || []).includes(
                        entry.value
                      );
                    return (
                      <button
                        key={entry.value}
                        onClick={() =>
                          handleToggleAttribute(attribute.code, entry.value)
                        }
                        className={`px-3 py-1.5 rounded-full border ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {entry.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>

          <section className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {loading && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                Loading marketplace inventory...
              </div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                No products match these filters. Try widening the price band or
                removing an attribute.
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {filteredProducts.map((product) => {
                const bestOffer = getBestOffer(product);
                const priceBounds = getPriceBounds(product);
                const averageRating = getAverageRating(product);
                const inWishlist = isInWishlist(product._id);
                return (
                  <article
                    key={product._id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    <Link
                      to={`/products/${product.slug || product._id}`}
                      onClick={() => handleProductClick(product)}
                      className="block"
                    >
                      <div className="relative aspect-[4/3] bg-slate-100">
                        <img
                          src={product.heroImage}
                          alt={product.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <button
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleToggleWishlist(product);
                          }}
                          className="absolute top-3 right-3 bg-white/85 rounded-full p-2 shadow-sm"
                          aria-label="Toggle wishlist"
                        >
                          {inWishlist ? (
                            <HiHeart className="w-5 h-5 text-rose-500" />
                          ) : (
                            <HiOutlineHeart className="w-5 h-5 text-slate-700" />
                          )}
                        </button>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="uppercase tracking-[0.3em] text-xs text-slate-400 mb-1">
                              {(product.categories || []).join(" | ")}
                            </p>
                            <h2 className="text-lg font-semibold text-slate-900 line-clamp-2">
                              {product.title}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                              {(product.metafields?.vendor && product.metafields.vendor + "  -  ") ||
                                ""}
                              {product.bestFor?.[0] || product.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Starting at
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              {formatCurrency(
                                priceBounds.min,
                                product.pricing?.currency
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              {product.variations?.[0]?.priceUnit || product.pricing?.unitLabel || ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          {(product.shippingBadges || []).slice(0, 3).map((badge) => (
                            <span
                              key={badge.id || badge.label}
                              className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200"
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                          <div>
                            <p className="text-slate-400 uppercase tracking-widest mb-1">
                              Sellers
                            </p>
                            <p>
                              {(product.offers || []).length}{" "}
                              {product.offers?.length === 1 ? "offer" : "offers"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 uppercase tracking-widest mb-1">
                              Rating
                            </p>
                            <p>
                              {averageRating
                                ? `${averageRating.toFixed(1)}  -  ${
                                    product.reviews?.length ||
                                    bestOffer?.reviewCount ||
                                    0
                                  } reviews`
                                : "Awaiting reviews"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
                          >
                            Add to cart
                          </button>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleToggleWishlist(product);
                            }}
                            className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition"
                          >
                            {isInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                          </button>
                          <Link
                            to={`/products/${product.slug || product._id}`}
                            onClick={() => handleProductClick(product)}
                            className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition"
                          >
                            View details
                          </Link>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        {recentViews.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Recently viewed
                </h2>
                <p className="text-xs text-slate-500">
                  Shortcuts to the materials you were evaluating.
                </p>
              </div>
              <HiOutlineClock className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentViews.map((entry) => (
                <Link
                  key={`${entry.slug}-${entry.seenAt}`}
                  to={`/products/${entry.slug}`}
                  className="min-w-[220px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition flex-shrink-0"
                >
                  <img
                    src={entry.heroImage}
                    alt={entry.title}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                  />
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                      {entry.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(entry.price, entry.currency)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProductList;

