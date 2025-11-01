import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { AiFillStar } from "react-icons/ai";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import { createEmptyFilterState, FILTER_SETS } from "../constants/designFilters.js";
import { fetchMarketplaceAssociates } from "../services/marketplace.js";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
  getAssociateAvatar,
  getAssociateFallback,
} from "../utils/imageFallbacks.js";

const ASSOCIATE_FILTER_SECTIONS = [
  "Category",
  "Typology",
  "Style",
  "Material Used",
  "Additional Features",
  "Sustainability",
];

const SLIDER_CSS = `
.dual-range{position:relative;height:32px}
.dual-range__track{
  position:absolute;left:4px;right:4px;top:50%;
  transform:translateY(-50%);height:6px;border-radius:9999px;
  background:#e2e8f0;
}
.dual-range__range{
  position:absolute;top:50%;transform:translateY(-50%);
  height:6px;border-radius:9999px;background:#0f172a;z-index:1;
}
.dual-range__input{
  position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);
  width:100%;height:32px;background:transparent;border:0;outline:0;
  pointer-events:none;-webkit-appearance:none;appearance:none;z-index:2;
}
.dual-range__input::-webkit-slider-runnable-track{height:6px;background:transparent;border:none}
.dual-range__input::-webkit-slider-thumb{
  -webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:9999px;
  background:#0f172a;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.15);
  pointer-events:auto;
}
.dual-range__input::-moz-range-track{height:6px;background:transparent;border:none}
.dual-range__input::-moz-range-thumb{
  width:18px;height:18px;border-radius:9999px;background:#0f172a;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.15);
  pointer-events:auto;
}
.dual-range__input::-ms-track{height:6px;background:transparent;border-color:transparent;color:transparent}
.dual-range__input::-ms-thumb{width:18px;height:18px;border-radius:9999px;background:#0f172a;border:2px solid #fff}
`;

const DEFAULT_RANGES = {
  rate: [0, 200],
  experience: [0, 20],
  projects: [0, 120],
  rating: [0, 5],
};

const withinRange = (value, [min, max]) => {
  if (!Number.isFinite(value)) return true;
  return value >= min && value <= max;
};

const clampSelection = ([lo, hi], [min, max]) => {
  const nextLo = Math.max(min, Math.min(lo, max));
  const nextHi = Math.max(nextLo, Math.min(hi, max));
  return [nextLo, nextHi];
};

const formatMoney = (value, currency = "USD") => {
  if (!Number.isFinite(value)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `${currency} ${value}`;
  }
};

const formatRangeValue = (value, digits = 0) => {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(digits);
};

const extractRate = (associate) => {
  const raw = associate?.rates?.hourly ?? associate?.hourlyRate;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const extractExperience = (associate) => {
  const raw = associate?.experienceYears ?? associate?.experience?.years;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const extractProjects = (associate) => {
  const raw = associate?.completedProjects ?? associate?.projectsCount;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const extractRating = (associate) => {
  const value = Number(associate?.rating);
  return Number.isFinite(value) ? value : null;
};

const ensureRange = (values, fallback, step = 1, hardMin = 0, hardMax = Infinity) => {
  if (!values.length) return fallback;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const normalizedMin = Math.max(hardMin, Math.floor(minimum / step) * step);
  const normalizedMax = Math.min(hardMax, Math.ceil(maximum / step) * step);
  if (normalizedMin === normalizedMax) {
    return [normalizedMin, normalizedMax + step];
  }
  return [normalizedMin, normalizedMax];
};

const Associates = () => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [query, setQuery] = useState("");
  const [selectedSpecialisation, setSelectedSpecialisation] = useState("All");
  const [associates, setAssociates] = useState([]);
  const [web3Meta, setWeb3Meta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(() => createEmptyFilterState());
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [collapsed, setCollapsed] = useState({});

  const [rateRange, setRateRange] = useState(DEFAULT_RANGES.rate);
  const [rateSel, setRateSel] = useState(DEFAULT_RANGES.rate);
  const [experienceRange, setExperienceRange] = useState(DEFAULT_RANGES.experience);
  const [experienceSel, setExperienceSel] = useState(DEFAULT_RANGES.experience);
  const [projectsRange, setProjectsRange] = useState(DEFAULT_RANGES.projects);
  const [projectsSel, setProjectsSel] = useState(DEFAULT_RANGES.projects);
  const [ratingRange, setRatingRange] = useState(DEFAULT_RANGES.rating);
  const [ratingSel, setRatingSel] = useState(DEFAULT_RANGES.rating);

  useEffect(() => {
    let cancelled = false;
    async function loadAssociates() {
      setLoading(true);
      setError(null);
      setWeb3Meta(null);
      try {
        const { items, meta } = await fetchMarketplaceAssociates();
        if (!cancelled) {
          setAssociates(items);
          setWeb3Meta(meta?.web3 || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load associates right now.");
          setWeb3Meta(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadAssociates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const rateValues = associates.map(extractRate).filter(Number.isFinite);
    const experienceValues = associates.map(extractExperience).filter(Number.isFinite);
    const projectValues = associates.map(extractProjects).filter(Number.isFinite);
    const ratingValues = associates.map(extractRating).filter(Number.isFinite);

    const nextRateRange = ensureRange(rateValues, DEFAULT_RANGES.rate, 1, 0);
    const nextExperienceRange = ensureRange(experienceValues, DEFAULT_RANGES.experience, 1, 0);
    const nextProjectsRange = ensureRange(projectValues, DEFAULT_RANGES.projects, 1, 0);
    const nextRatingRange = ensureRange(ratingValues, DEFAULT_RANGES.rating, 0.1, 0, 5).map((value) => Number(value.toFixed(1)));

    setRateRange(nextRateRange);
    setRateSel(nextRateRange);
    setExperienceRange(nextExperienceRange);
    setExperienceSel(nextExperienceRange);
    setProjectsRange(nextProjectsRange);
    setProjectsSel(nextProjectsRange);
    setRatingRange(nextRatingRange);
    setRatingSel(nextRatingRange);
  }, [associates]);

  const specialisations = useMemo(() => {
    const all = associates.flatMap((associate) => associate.specialisations || []);
    return ["All", ...new Set(all)];
  }, [associates]);

  const toggleSection = (section) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev?.[section] }));
  };

  const renderProofLink = (associate) => {
    const proof = associate?.web3Proof;
    if (!proof?.explorerUrl) return null;
    return (
      <a
        href={proof.explorerUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-500"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        On-chain proof · {proof.anchor}
      </a>
    );
  };

  const isAssociateWishlisted = (associate) => Boolean(isInWishlist(associate?._id ?? associate));

  const handleAddAssociateToCart = (associate) => {
    const rate = extractRate(associate) ?? 0;
    addToCart({
      productId: associate._id,
      title: `${associate.title} engagement`,
      image: getAssociateAvatar(associate) || getAssociateFallback(associate),
      price: rate,
      quantity: 1,
      seller: associate.user?.email || "Associate network",
      kind: "service",
      serviceId: associate._id,
      schedule: null,
      addons: [],
      giftMessage: "",
      metadata: {
        timezone: associate.timezone || associate.booking?.timezones?.[0],
        availability: associate.availability,
      },
      source: "Associate",
    });
    toast.success(`${associate.title} added to cart`);
  };

  const handleBookCall = (associate) => {
    const slot = associate.booking?.slots?.[0] || null;
    addToCart({
      productId: associate._id,
      title: `${associate.title} discovery session`,
      price: extractRate(associate) ?? 0,
      quantity: 1,
      seller: associate.user?.email || "Associate network",
      kind: "service",
      serviceId: associate._id,
      schedule: slot,
      addons: [],
      giftMessage: "",
      metadata: {
        timezone: associate.booking?.timezones?.[0] || associate.timezone,
        availability: associate.availability,
      },
      source: "Service",
    });
    toast.success(`Discovery call with ${associate.user?.email || associate.title} added to cart`);
  };

  const handleToggleWishlist = async (associate) => {
    const payload = {
      productId: associate._id,
      title: associate.title,
      image: associate.avatar || associate.photos?.[0] || "",
      price: Number(associate.rates?.hourly || associate.rates?.daily || 0),
      source: "Associate",
    };
    try {
      if (isAssociateWishlisted(associate)) {
        await removeFromWishlist(payload);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(payload);
        toast.success("Saved to wishlist");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not update wishlist");
    }
  };

  const handleFilterToggle = (section, option) => {
    setFilters((prev) => {
      const nextSet = new Set(prev[section] || []);
      if (nextSet.has(option)) {
        nextSet.delete(option);
      } else {
        nextSet.add(option);
      }
      return { ...prev, [section]: nextSet };
    });
  };

  const handleClearFilters = () => {
    setFilters(createEmptyFilterState());
    setRateSel(rateRange);
    setExperienceSel(experienceRange);
    setProjectsSel(projectsRange);
    setRatingSel(ratingRange);
  };

  const numericFiltersActive = useMemo(() => {
    return (
      rateSel[0] > rateRange[0] ||
      rateSel[1] < rateRange[1] ||
      experienceSel[0] > experienceRange[0] ||
      experienceSel[1] < experienceRange[1] ||
      projectsSel[0] > projectsRange[0] ||
      projectsSel[1] < projectsRange[1] ||
      ratingSel[0] > ratingRange[0] ||
      ratingSel[1] < ratingRange[1]
    );
  }, [
    rateSel,
    rateRange,
    experienceSel,
    experienceRange,
    projectsSel,
    projectsRange,
    ratingSel,
    ratingRange,
  ]);

  const filteredAssociates = useMemo(() => {
    const baseList = associates.filter((associate) => {
      const matchesQuery =
        !query ||
        associate.title?.toLowerCase().includes(query.toLowerCase()) ||
        associate.summary?.toLowerCase().includes(query.toLowerCase()) ||
        associate.location?.toLowerCase().includes(query.toLowerCase()) ||
        associate.user?.email?.toLowerCase().includes(query.toLowerCase());
      const matchesSpecialisation =
        selectedSpecialisation === "All" ||
        (associate.specialisations || []).includes(selectedSpecialisation);
      if (!matchesQuery || !matchesSpecialisation) return false;

      const rate = extractRate(associate);
      const experience = extractExperience(associate);
      const projects = extractProjects(associate);
      const rating = extractRating(associate);

      return (
        withinRange(rate, rateSel) &&
        withinRange(experience, experienceSel) &&
        withinRange(projects, projectsSel) &&
        withinRange(rating, ratingSel)
      );
    });

    const activeSections = ASSOCIATE_FILTER_SECTIONS.filter((key) => filters[key]?.size);
    if (!activeSections.length) {
      return baseList;
    }

    return baseList.filter((associate) => {
      const haystackParts = [
        associate.title,
        associate.summary,
        associate.location,
        associate.bio,
        associate.focus,
        associate.practice,
        associate.user?.email,
        (associate.specialisations || []).join(" "),
        (associate.skills || []).join(" "),
        (associate.expertise || []).join(" "),
        (associate.tags || []).join(" "),
        (associate.pastProjects || []).join(" "),
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      if (!haystackParts.length) return false;
      return activeSections.every((section) => {
        const set = filters[section];
        if (!set || set.size === 0) return true;
        return Array.from(set).some((option) => {
          const needle = option.toLowerCase();
          return haystackParts.some((part) => part.includes(needle));
        });
      });
    });
  }, [
    associates,
    query,
    selectedSpecialisation,
    filters,
    rateSel,
    experienceSel,
    projectsSel,
    ratingSel,
  ]);

  const hasActiveFilters = useMemo(() => {
    const chipFiltersActive = ASSOCIATE_FILTER_SECTIONS.some((key) => filters[key]?.size);
    return chipFiltersActive || numericFiltersActive;
  }, [filters, numericFiltersActive]);

  const listingContainerClass = useMemo(
    () => (filtersOpen ? 'mx-auto w-full max-w-5xl' : 'mx-auto w-full max-w-6xl'),
    [filtersOpen]
  );

  const DualRange = ({ id, label, domain, value, onChange, format = (n) => n, step = 1 }) => {
    const [min, max] = domain;
    const [lo, hi] = value;
    const span = Math.max(max - min, step);
    const toPercent = (val) => {
      if (!Number.isFinite(val)) return 0;
      const raw = ((val - min) / span) * 100;
      return Math.max(0, Math.min(100, raw));
    };
    const lowerPercent = toPercent(lo);
    const upperPercent = toPercent(hi);

    const updateRange = (nextLo, nextHi) => {
      onChange(clampSelection([nextLo, nextHi], [min, max]));
    };

    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="text-left text-sm font-semibold text-slate-700 mb-2 w-full flex items-center gap-2"
        >
          <span className={`inline-block transition-transform ${collapsed[id] ? "rotate-0" : "rotate-90"}`}>
            {">"}
          </span>
          {label}
        </button>
        <div className={collapsed[id] ? "hidden" : "space-y-3"}>
          <div className="px-1">
            <div className="dual-range">
              <div className="dual-range__track" />
              <div
                className="dual-range__range"
                style={{ left: `${lowerPercent}%`, right: `${100 - upperPercent}%` }}
              />
              <input
                aria-label={`${label} minimum`}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={lo}
                type="range"
                min={min}
                max={max}
                step={step}
                value={lo}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  updateRange(next, hi);
                }}
                className="dual-range__input"
              />
              <input
                aria-label={`${label} maximum`}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={hi}
                type="range"
                min={min}
                max={max}
                step={step}
                value={hi}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  updateRange(lo, next);
                }}
                className="dual-range__input"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateRange(lo - step, hi)}
                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-300"
              >
                -{step}
              </button>
              <button
                type="button"
                onClick={() => updateRange(lo, hi + step)}
                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-300"
              >
                +{step}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                {format(lo)}
              </span>
              <span className="text-slate-400">to</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                {format(hi)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: SLIDER_CSS }} />
      <RegistrStrip />
      <main className="flex-1 max-w-screen-2xl mx-auto px-3 md:px-4 lg:px-6 py-8 w-full">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">
          <aside
            className={`order-1 lg:order-none transition-[width] duration-300 ease-out flex-shrink-0 w-full lg:sticky lg:top-24 ${
              filtersOpen ? "lg:w-72 xl:w-80" : "lg:w-0"
            } overflow-hidden`}
          >
            {filtersOpen && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="text-xs text-slate-600 hover:text-slate-800"
                    >
                      Hide
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs text-slate-600 hover:text-slate-800"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3 border-b border-slate-100">
                  <DualRange
                    id="rate"
                    label="Hourly rate"
                    domain={rateRange}
                    value={rateSel}
                    onChange={setRateSel}
                    format={(value) => {
                      const formatted = formatMoney(value, "USD");
                      return formatted || `${value}`;
                    }}
                    step={1}
                  />
                </div>
                <div className="px-4 py-3 border-b border-slate-100">
                  <DualRange
                    id="experience"
                    label="Experience (years)"
                    domain={experienceRange}
                    value={experienceSel}
                    onChange={setExperienceSel}
                    format={(value) => `${formatRangeValue(value)} yrs`}
                    step={1}
                  />
                </div>
                <div className="px-4 py-3 border-b border-slate-100">
                  <DualRange
                    id="projects"
                    label="Completed projects"
                    domain={projectsRange}
                    value={projectsSel}
                    onChange={setProjectsSel}
                    format={(value) => formatRangeValue(value)}
                    step={1}
                  />
                </div>
                <div className="px-4 py-3 border-b border-slate-100">
                  <DualRange
                    id="rating"
                    label="Rating"
                    domain={ratingRange}
                    value={ratingSel}
                    onChange={setRatingSel}
                    format={(value) => formatRangeValue(value, 1)}
                    step={0.1}
                  />
                </div>

                {ASSOCIATE_FILTER_SECTIONS.map((section) => {
                  const options = FILTER_SETS[section] || [];
                  if (!options.length) return null;
                  return (
                    <div key={section} className="px-4 py-3 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => toggleSection(section)}
                        className="text-left text-sm font-semibold text-slate-700 mb-2 w-full flex items-center gap-2"
                      >
                        <span
                          className={`inline-block transition-transform ${collapsed[section] ? "rotate-0" : "rotate-90"}`}
                        >
                          {">"}
                        </span>
                        {section}
                      </button>
                      <div className={collapsed[section] ? "hidden" : "space-y-1 max-h-48 overflow-auto pr-1"}>
                        {options.map((option) => {
                          const isActive = filters?.[section]?.has(option);
                          return (
                            <label
                              key={option}
                              className="flex items-center gap-2 text-sm text-slate-700"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-slate-800"
                                checked={!!isActive}
                                onChange={() => handleFilterToggle(section, option)}
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>

          <div className="flex-1 space-y-8 order-2 lg:order-none">
            {!filtersOpen && (
              <div className="hidden lg:flex justify-start">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-slate-800"
                >
                  Filters
                </button>
              </div>
            )}

            <section className={`${listingContainerClass} flex flex-col md:flex-row gap-3 md:items-center`}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search associates, tools, or locations..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <select
                value={selectedSpecialisation}
                onChange={(event) => setSelectedSpecialisation(event.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {specialisations.map((specialisation) => (
                  <option key={specialisation} value={specialisation}>
                    {specialisation}
                  </option>
                ))}
              </select>
            </section>

            {!loading && web3Meta && (
              <div className={`${listingContainerClass} rounded-2xl border border-emerald-200 bg-emerald-900/90 px-6 py-5 text-emerald-100 shadow-sm`}>
                <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-300">
                  Blockchain confidence
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    {web3Meta.total ?? 0} verifications anchored on {web3Meta.chain ?? "Polygon"}
                  </h2>
                  {Array.isArray(web3Meta.anchors) && web3Meta.anchors.length > 0 ? (
                    <p className="text-xs text-emerald-200">
                      Latest anchors: {web3Meta.anchors.slice(0, 3).join(" · ")}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {error && (
              <div className={`${listingContainerClass} bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm`}>
                {error}
              </div>
            )}

            {loading && (
              <div className={`${listingContainerClass} bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500`}>
                Loading associates.
              </div>
            )}

            <section className={`${listingContainerClass} grid gap-6 sm:grid-cols-2 xl:grid-cols-3`}>
              {!loading &&
                filteredAssociates.map((associate) => {
                  const hourlyRate = extractRate(associate);
                  const formattedRate = formatMoney(hourlyRate, associate.rates?.currency || "USD");
                  const dailyRate = Number(associate.rates?.daily);
                  const ratingValue = extractRating(associate);
                  const avatarImage = getAssociateAvatar(associate) || getAssociateFallback(associate);
                  const specializationChips = (associate.specialisations || []).slice(0, 3);
                  const softwareChips = (associate.softwares || []).slice(0, 3);
                  const languageChips = (associate.languages || []).slice(0, 2);
                  const metaChips = [...specializationChips, ...softwareChips, ...languageChips].slice(0, 4);
                  const wishlistActive = isAssociateWishlisted(associate);

                  return (
                    <motion.article
                      key={associate._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="group h-full"
                    >
                      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                        <Link
                          to={`/associateportfolio/${associate._id}`}
                          state={{ associate }}
                          className="flex h-full flex-col"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img
                              src={avatarImage}
                              alt={associate.title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.src = getAssociateFallback(associate);
                              }}
                            />
                            {metaChips.length > 0 && (
                              <div className="absolute bottom-3 left-3 flex max-w-[90%] flex-wrap gap-2">
                                {metaChips.map((chip) => (
                                  <span
                                    key={`${associate._id}-${chip}`}
                                    className="rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                                  >
                                    {chip}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col gap-4 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                                  Associate
                                </p>
                                <h2 className="text-lg font-semibold text-slate-900 leading-tight">
                                  {associate.title}
                                </h2>
                                {associate.location && (
                                  <p className="text-xs text-slate-500">{associate.location}</p>
                                )}
                              </div>
                              {Number.isFinite(ratingValue) && (
                                <div className="flex flex-col items-end gap-1 text-amber-500">
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                      <AiFillStar
                                        key={index}
                                        className={`h-4 w-4 ${
                                          index < Math.round(ratingValue ?? 0)
                                            ? "text-amber-500"
                                            : "text-slate-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-medium text-slate-500">
                                    {ratingValue.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                              {associate.summary || "Specialist ready to deploy on remote and hybrid engagements."}
                            </p>

                            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-1">
                                  Rate
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {formattedRate || "On request"}
                                  {associate.rates?.currency && formattedRate && (
                                    <span className="ml-1 text-xs font-normal text-slate-500">
                                      / {associate.rates?.currency || "hr"}
                                    </span>
                                  )}
                                </p>
                                {Number.isFinite(dailyRate) && (
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    Daily {formatMoney(dailyRate, associate.rates?.currency || "USD")}
                                  </p>
                                )}
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-1">
                                  Experience
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {extractExperience(associate) ?? "-"} yrs
                                </p>
                                {associate.availability && (
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    {associate.availability}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                              {(associate.languages || []).slice(0, 4).map((language) => (
                                <span
                                  key={`${associate._id}-lang-${language}`}
                                  className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50"
                                >
                                  {language}
                                </span>
                              ))}
                              {(associate.softwares || []).slice(0, 4).map((software) => (
                                <span
                                  key={`${associate._id}-soft-${software}`}
                                  className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50"
                                >
                                  {software}
                                </span>
                              ))}
                            </div>

                            {associate.keyProjects?.length ? (
                              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                                  Portfolio highlights
                                </p>
                                <ul className="space-y-1">
                                  {associate.keyProjects.slice(0, 2).map((project) => (
                                    <li key={`${project.title}-${project.year}`}>
                                      <span className="text-slate-700 font-semibold">
                                        {project.title}
                                      </span>{" "}
                                      {project.scope} ({project.year})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}

                            <div className="mt-auto flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleAddAssociateToCart(associate);
                                }}
                                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                              >
                                Add to cart
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleBookCall(associate);
                                }}
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                              >
                                Book discovery call
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleToggleWishlist(associate);
                                }}
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                              >
                                {wishlistActive ? "Remove from wishlist" : "Save to wishlist"}
                              </button>
                              {renderProofLink(associate)}
                            </div>
                          </div>
                        </Link>
                      </div>
                    </motion.article>
                  );
                })}
            </section>

            {!loading && filteredAssociates.length === 0 && (
              <div className={`${listingContainerClass} bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500`}>
                No associates found. Try a different role or keyword.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Associates;
