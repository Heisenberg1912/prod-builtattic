import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
.dual-range{position:relative;height:36px}
.dual-range__track{
  position:absolute;left:4px;right:4px;top:50%;
  transform:translateY(-50%);height:6px;border-radius:9999px;
  background:#e2e8f0;cursor:pointer;transition:background .15s ease;
}
.dual-range__track:hover{background:#d6e3ff;}
.dual-range__range{
  position:absolute;top:50%;transform:translateY(-50%);
  height:6px;border-radius:9999px;background:#0f172a;z-index:1;
  pointer-events:none;transition:left .12s ease,right .12s ease;
}
.dual-range__input{
  position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);
  width:100%;height:36px;background:transparent;border:0;outline:0;
  pointer-events:none;-webkit-appearance:none;appearance:none;z-index:2;
}
.dual-range__input::-webkit-slider-runnable-track{height:6px;background:transparent;border:none}
.dual-range__input::-webkit-slider-thumb{
  -webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:9999px;
  background:#0f172a;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.15);
  pointer-events:auto;cursor:grab;transition:transform .12s ease;
}
.dual-range__input::-webkit-slider-thumb:active{transform:scale(1.1);cursor:grabbing}
.dual-range__input::-moz-range-track{height:6px;background:transparent;border:none}
.dual-range__input::-moz-range-thumb{
  width:18px;height:18px;border-radius:9999px;background:#0f172a;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.15);
  pointer-events:auto;cursor:grab;transition:transform .12s ease;
}
.dual-range__input::-moz-range-thumb:active{transform:scale(1.1);cursor:grabbing}
.dual-range__input::-ms-track{height:6px;background:transparent;border-color:transparent;color:transparent}
.dual-range__input::-ms-thumb{width:18px;height:18px;border-radius:9999px;background:#0f172a;border:2px solid #fff;cursor:grab}
`;

const DEFAULT_RANGES = {
  rate: [0, 200],
  experience: [0, 20],
  projects: [0, 120],
  rating: [0, 5],
};

const VISIBLE_OPTION_LIMIT = 6;
const QUICK_FILTER_LIMIT = 6;

const buildAssociateHaystack = (associate) =>
  [
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

const getHaystackString = (parts) => (Array.isArray(parts) ? parts.join(" ") : "");

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

const MARKETPLACE_DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const formatAvailabilityWindow = (window) => {
  if (!window || typeof window !== "object") return null;
  const day = MARKETPLACE_DAY_LABELS[window.day] || window.day;
  if (window.from && window.to) {
    return `${day} ${window.from}-${window.to}`;
  }
  return day;
};

const formatRelativeTime = (iso) => {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - Date.now();
  const units = [
    { unit: "day", ms: 86_400_000 },
    { unit: "hour", ms: 3_600_000 },
    { unit: "minute", ms: 60_000 },
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const { unit, ms } of units) {
    if (Math.abs(diffMs) >= ms || unit === "minute") {
      return formatter.format(Math.round(diffMs / ms), unit);
    }
  }
  return target.toLocaleDateString();
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
  const [filterSearchTerms, setFilterSearchTerms] = useState({});
  const [showAllOptions, setShowAllOptions] = useState({});

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

  const associateHaystacks = useMemo(() => associates.map((associate) => buildAssociateHaystack(associate)), [associates]);

  const optionStats = useMemo(() => {
    const stats = {};
    ASSOCIATE_FILTER_SECTIONS.forEach((section) => {
      stats[section] = {};
    });

    associateHaystacks.forEach((parts) => {
      if (!parts || !parts.length) return;
      const haystack = getHaystackString(parts);
      if (!haystack) return;
      ASSOCIATE_FILTER_SECTIONS.forEach((section) => {
        const options = FILTER_SETS[section] || [];
        options.forEach((option) => {
          const needle = option.toLowerCase();
          if (needle && haystack.includes(needle)) {
            stats[section][option] = (stats[section][option] || 0) + 1;
          }
        });
      });
    });

    return stats;
  }, [associateHaystacks]);

  const quickFilterSuggestions = useMemo(() => {
    const entries = [];
    ASSOCIATE_FILTER_SECTIONS.forEach((section) => {
      const sectionStats = optionStats[section];
      if (!sectionStats) return;
      Object.entries(sectionStats).forEach(([option, count]) => {
        if (!count) return;
        const alreadySelected = filters?.[section]?.has(option);
        if (alreadySelected) return;
        entries.push({ section, option, count });
      });
    });

    return entries
      .sort((a, b) => {
        if (b.count === a.count) {
          return a.option.localeCompare(b.option);
        }
        return b.count - a.count;
      })
      .slice(0, QUICK_FILTER_LIMIT);
  }, [filters, optionStats]);

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

  const handleFilterToggle = useCallback(
    (section, option) => {
      setFilters((prev) => {
        const nextSet = new Set(prev[section] || []);
        if (nextSet.has(option)) {
          nextSet.delete(option);
        } else {
          nextSet.add(option);
        }
        return { ...prev, [section]: nextSet };
      });
    },
    [setFilters],
  );

  const handleClearSection = useCallback(
    (section) => {
      setFilters((prev) => {
        if (!prev[section]?.size) {
          return prev;
        }
        return { ...prev, [section]: new Set() };
      });
      setFilterSearchTerms((prev) => ({ ...prev, [section]: "" }));
    },
    [setFilters],
  );

  const handleFilterSearchChange = useCallback((section, value) => {
    setFilterSearchTerms((prev) => ({ ...prev, [section]: value }));
  }, []);

  const toggleShowAllForSection = useCallback((section) => {
    setShowAllOptions((prev) => ({ ...prev, [section]: !prev?.[section] }));
  }, []);

  const handleQuickFilterSelect = useCallback(
    (section, option) => {
      setCollapsed((prev) => ({ ...prev, [section]: false }));
      handleFilterToggle(section, option);
    },
    [handleFilterToggle],
  );

  const resetRateFilter = useCallback(() => {
    setRateSel([rateRange[0], rateRange[1]]);
  }, [rateRange, setRateSel]);

  const resetExperienceFilter = useCallback(() => {
    setExperienceSel([experienceRange[0], experienceRange[1]]);
  }, [experienceRange, setExperienceSel]);

  const resetProjectsFilter = useCallback(() => {
    setProjectsSel([projectsRange[0], projectsRange[1]]);
  }, [projectsRange, setProjectsSel]);

  const resetRatingFilter = useCallback(() => {
    setRatingSel([ratingRange[0], ratingRange[1]]);
  }, [ratingRange, setRatingSel]);

  const handleClearFilters = useCallback(() => {
    setFilters(createEmptyFilterState());
    resetRateFilter();
    resetExperienceFilter();
    resetProjectsFilter();
    resetRatingFilter();
    setFilterSearchTerms({});
    setShowAllOptions({});
  }, [resetExperienceFilter, resetProjectsFilter, resetRateFilter, resetRatingFilter, setFilters]);

  const filteredAssociates = useMemo(() => {
    const baseIndexes = [];
    associates.forEach((associate, index) => {
      const matchesQuery =
        !query ||
        associate.title?.toLowerCase().includes(query.toLowerCase()) ||
        associate.summary?.toLowerCase().includes(query.toLowerCase()) ||
        associate.location?.toLowerCase().includes(query.toLowerCase()) ||
        associate.user?.email?.toLowerCase().includes(query.toLowerCase());
      const matchesSpecialisation =
        selectedSpecialisation === "All" ||
        (associate.specialisations || []).includes(selectedSpecialisation);
      if (!matchesQuery || !matchesSpecialisation) {
        return;
      }

      const rate = extractRate(associate);
      const experience = extractExperience(associate);
      const projects = extractProjects(associate);
      const rating = extractRating(associate);

      const matchesRanges =
        withinRange(rate, rateSel) &&
        withinRange(experience, experienceSel) &&
        withinRange(projects, projectsSel) &&
        withinRange(rating, ratingSel);

      if (matchesRanges) {
        baseIndexes.push(index);
      }
    });

    const activeSections = ASSOCIATE_FILTER_SECTIONS.filter((key) => filters[key]?.size);
    if (!activeSections.length) {
      return baseIndexes.map((index) => associates[index]);
    }

    return baseIndexes
      .filter((index) => {
        const haystackParts = associateHaystacks[index];
        if (!haystackParts || haystackParts.length === 0) return false;
        return activeSections.every((section) => {
          const set = filters[section];
          if (!set || set.size === 0) return true;
          return Array.from(set).some((option) => {
            const needle = option.toLowerCase();
            return haystackParts.some((part) => part.includes(needle));
          });
        });
      })
      .map((index) => associates[index]);
  }, [
    associates,
    associateHaystacks,
    query,
    selectedSpecialisation,
    filters,
    rateSel,
    experienceSel,
    projectsSel,
    ratingSel,
  ]);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    const addRangeChip = (key, label, selection, domain, formatValue, onReset) => {
      if (!Array.isArray(selection) || !Array.isArray(domain)) {
        return;
      }
      const [selMin, selMax] = selection;
      const [domMin, domMax] = domain;
      if (!Number.isFinite(selMin) || !Number.isFinite(selMax)) {
        return;
      }
      if (selMin <= domMin && selMax >= domMax) {
        return;
      }
      chips.push({
        key,
        label: `${label}: ${formatValue(selMin)} - ${formatValue(selMax)}`,
        onRemove: onReset,
      });
    };

    addRangeChip(
      "rate",
      "Hourly rate",
      rateSel,
      rateRange,
      (value) => formatMoney(value, "USD") || `$${formatRangeValue(value)}`,
      resetRateFilter,
    );

    addRangeChip(
      "experience",
      "Experience",
      experienceSel,
      experienceRange,
      (value) => `${formatRangeValue(value)} yrs`,
      resetExperienceFilter,
    );

    addRangeChip(
      "projects",
      "Completed projects",
      projectsSel,
      projectsRange,
      (value) => formatRangeValue(value),
      resetProjectsFilter,
    );

    addRangeChip(
      "rating",
      "Rating",
      ratingSel,
      ratingRange,
      (value) => formatRangeValue(value, 1),
      resetRatingFilter,
    );

    ASSOCIATE_FILTER_SECTIONS.forEach((section) => {
      const selection = filters[section];
      if (!selection || selection.size === 0) return;
      selection.forEach((option) => {
        chips.push({
          key: `${section}-${option}`,
          label: `${section}: ${option}`,
          onRemove: () => handleFilterToggle(section, option),
        });
      });
    });

    return chips;
  }, [
    experienceRange,
    experienceSel,
    filters,
    handleFilterToggle,
    projectsRange,
    projectsSel,
    rateRange,
    rateSel,
    ratingRange,
    ratingSel,
    resetExperienceFilter,
    resetProjectsFilter,
    resetRateFilter,
    resetRatingFilter,
  ]);

  const hasActiveFilters = activeFilterChips.length > 0;

  const listingContainerClass = useMemo(
    () => (filtersOpen ? 'mx-auto w-full max-w-5xl' : 'mx-auto w-full max-w-6xl'),
    [filtersOpen]
  );

  const DualRange = ({ id, label, domain, value, onChange, format = (n) => n, step = 1 }) => {
    const [min, max] = domain;
    const [lo, hi] = value;
    const trackRef = useRef(null);
    const span = Math.max(max - min, step);
    const stepString = `${step}`;
    const decimalIndex = stepString.indexOf('.');
    const stepDecimals = decimalIndex >= 0 ? stepString.length - decimalIndex - 1 : 0;
    const epsilon = 1 / Math.pow(10, stepDecimals + 2);

    const toPercent = (val) => {
      if (!Number.isFinite(val)) return 0;
      const raw = ((val - min) / span) * 100;
      return Math.max(0, Math.min(100, raw));
    };

    const snapValue = (val) => {
      const clamped = Math.min(Math.max(val, min), max);
      const steps = Math.round((clamped - min) / step);
      const snapped = min + steps * step;
      const factor = 10 ** stepDecimals;
      const normalized = Math.round(snapped * factor) / factor;
      return Math.min(max, Math.max(min, normalized));
    };

    const updateRange = (nextLo, nextHi) => {
      onChange(clampSelection([nextLo, nextHi], [min, max]));
    };

    const handleTrackPointerMove = (clientX) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const relative = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const rawValue = min + relative * (max - min);
      const snapped = snapValue(rawValue);
      if (Math.abs(snapped - lo) <= Math.abs(snapped - hi)) {
        updateRange(snapped, hi);
      } else {
        updateRange(lo, snapped);
      }
    };

    const handleTrackPointerDown = (event) => {
      event.preventDefault();
      const pointerId = event.pointerId;
      const target = event.currentTarget;
      target.setPointerCapture?.(pointerId);

      const moveListener = (moveEvent) => {
        handleTrackPointerMove(moveEvent.clientX);
      };

      const upListener = () => {
        target.releasePointerCapture?.(pointerId);
        if (typeof window !== 'undefined') {
          window.removeEventListener('pointermove', moveListener);
          window.removeEventListener('pointerup', upListener);
        }
      };

      handleTrackPointerMove(event.clientX);
      if (typeof window !== 'undefined') {
        window.addEventListener('pointermove', moveListener);
        window.addEventListener('pointerup', upListener);
      }
    };

    const handleDecrease = () => {
      updateRange(snapValue(lo - step), hi);
    };

    const handleIncrease = () => {
      updateRange(lo, snapValue(hi + step));
    };

    const lowerPercent = toPercent(lo);
    const upperPercent = toPercent(hi);
    const isCollapsed = collapsed[id];
    const isDirty = lo - min > epsilon || max - hi > epsilon;
    const canStepDown = lo - min > epsilon;
    const canStepUp = max - hi > epsilon;

    const buttonBaseClass =
      'rounded-full border px-2 py-1 text-[11px] font-medium transition';
    const buttonEnabledClass =
      'border-slate-200 bg-white text-slate-600 hover:border-slate-300';
    const buttonDisabledClass =
      'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed';

    return (
      <div className="space-y-3">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSection(id)}
            className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-700"
          >
            <span className={`inline-block transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}>
              {">"}
            </span>
            <span className="flex-1">{label}</span>
            {isDirty ? (
              <span className="text-[11px] font-medium text-slate-500">
                {format(lo)} - {format(hi)}
              </span>
            ) : null}
          </button>
          {isDirty ? (
            <button
              type="button"
              onClick={() => updateRange(min, max)}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
            >
              Reset
            </button>
          ) : null}
        </div>
        <div className={isCollapsed ? 'hidden' : 'space-y-3'}>
          <div className="px-1">
            <div className="dual-range">
              <div
                ref={trackRef}
                className="dual-range__track"
                onPointerDown={handleTrackPointerDown}
              />
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
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={!canStepDown}
                className={`${buttonBaseClass} ${canStepDown ? buttonEnabledClass : buttonDisabledClass}`}
              >
                -{step}
              </button>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={!canStepUp}
                className={`${buttonBaseClass} ${canStepUp ? buttonEnabledClass : buttonDisabledClass}`}
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
                  <h3 className="text-sm font-semibold text-slate-900">
                    Filters
                    {hasActiveFilters ? (
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        {activeFilterChips.length} active
                      </span>
                    ) : null}
                  </h3>
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
                      disabled={!hasActiveFilters}
                      className={`text-xs font-medium transition ${
                        hasActiveFilters
                          ? "text-slate-600 hover:text-slate-800"
                          : "cursor-not-allowed text-slate-300"
                      }`}
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Active filters
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeFilterChips.map((chip) => (
                        <button
                          key={`sidebar-${chip.key}`}
                          type="button"
                          onClick={chip.onRemove}
                          className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        >
                          <span>{chip.label}</span>
                          <span className="text-slate-400 group-hover:text-slate-600">x</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quickFilterSuggestions.length ? (
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Popular quick filters
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {quickFilterSuggestions.map(({ section, option, count }) => (
                        <motion.button
                          key={`${section}-${option}`}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleQuickFilterSelect(section, option)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <span>{option}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                            {count}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : null}

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
                  const activeCount = filters?.[section]?.size ?? 0;
                  const isCollapsed = collapsed[section];
                  const stats = optionStats[section] || {};
                  const searchTerm = (filterSearchTerms[section] || "").trim();
                  const normalizedTerm = searchTerm.toLowerCase();
                  const sortedOptions = [...options].sort((a, b) => {
                    const aCount = stats[a] || 0;
                    const bCount = stats[b] || 0;
                    if (aCount === bCount) {
                      return a.localeCompare(b);
                    }
                    return bCount - aCount;
                  });
                  const filteredOptions = normalizedTerm
                    ? sortedOptions.filter((option) => option.toLowerCase().includes(normalizedTerm))
                    : sortedOptions;
                  const showAll = showAllOptions[section];
                  const visibleOptions = showAll ? filteredOptions : filteredOptions.slice(0, VISIBLE_OPTION_LIMIT);
                  const hiddenCount = Math.max(filteredOptions.length - visibleOptions.length, 0);
                  const emptyState = !filteredOptions.length;

                  return (
                    <div key={section} className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSection(section)}
                          className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-700"
                        >
                          <span
                            aria-hidden
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-[11px] transition-transform ${
                              isCollapsed ? "rotate-0" : "rotate-90"
                            }`}
                          >
                            ▸
                          </span>
                          <span className="flex-1">{section}</span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {filteredOptions.length || 0} options
                          </span>
                          {activeCount ? (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              {activeCount}
                            </span>
                          ) : null}
                        </button>
                        {activeCount ? (
                          <button
                            type="button"
                            onClick={() => handleClearSection(section)}
                            className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>

                      {!isCollapsed && (
                        <div className="mt-3 space-y-3">
                          <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => handleFilterSearchChange(section, event.target.value)}
                            placeholder={`Search ${options.length} options...`}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />

                          {emptyState ? (
                            <p className="text-xs text-slate-500">
                              No matches yet. Try a different keyword.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {visibleOptions.map((option) => {
                                const isActive = filters?.[section]?.has(option);
                                const count = stats[option] || 0;
                                return (
                                  <motion.button
                                    key={option}
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleFilterToggle(section, option)}
                                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                                      isActive
                                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                  >
                                    <span className="flex-1 text-left">{option}</span>
                                    <span
                                      className={`ml-3 rounded-full px-2 py-0.5 text-[11px] ${
                                        isActive ? "bg-slate-800 text-white/80" : "bg-slate-100 text-slate-500"
                                      }`}
                                    >
                                      {count}
                                    </span>
                                  </motion.button>
                                );
                              })}
                              {hiddenCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleShowAllForSection(section)}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                >
                                  Show {hiddenCount} more
                                </button>
                              ) : null}
                              {showAll && filteredOptions.length > VISIBLE_OPTION_LIMIT ? (
                                <button
                                  type="button"
                                  onClick={() => toggleShowAllForSection(section)}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                >
                                  Show less
                                </button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
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

            {activeFilterChips.length > 0 && (
              <div
                className={`${listingContainerClass} rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs ${
                  filtersOpen ? "lg:hidden" : ""
                }`}
              >
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Active filters
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeFilterChips.map((chip) => (
                      <button
                        key={`summary-${chip.key}`}
                        type="button"
                        onClick={chip.onRemove}
                        className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                      >
                        <span>{chip.label}</span>
                        <span className="text-slate-400 group-hover:text-slate-600">x</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
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
              <div className={`${listingContainerClass} rounded-2xl border border-slate-800 bg-black px-6 py-5 text-slate-100 shadow-sm`}>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
                  Blockchain confidence
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    {web3Meta.total ?? 0} verifications anchored on {web3Meta.chain ?? "Polygon"}
                  </h2>
                  {Array.isArray(web3Meta.anchors) && web3Meta.anchors.length > 0 ? (
                    <p className="text-xs text-slate-300">
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
                  const updatedLabel = formatRelativeTime(associate.updatedAt || associate.createdAt);
                  const primaryPortfolio = Array.isArray(associate.portfolioLinks)
                    ? associate.portfolioLinks.find((link) => link)
                    : null;
                  const availabilityWindow = Array.isArray(associate.availabilityWindows)
                    ? associate.availabilityWindows.find((window) => window && window.day)
                    : null;
                  const availabilityLabel = availabilityWindow
                    ? formatAvailabilityWindow(availabilityWindow)
                    : null;

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
                          state={{ associate, from: "marketplace" }}
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
                                {updatedLabel && (
                                  <p className="text-[11px] text-slate-400">Updated {updatedLabel}</p>
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
                                {availabilityLabel && (
                                  <p className="text-[11px] text-slate-400">Next window: {availabilityLabel}</p>
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
                              {primaryPortfolio ? (
                                <a
                                  href={primaryPortfolio}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                                >
                                  View portfolio
                                </a>
                              ) : null}
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










