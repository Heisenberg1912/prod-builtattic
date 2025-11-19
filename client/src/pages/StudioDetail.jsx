// StudioDetail.jsx  updated to match the provided reference layout (no backend changes)
// - Left: large hero image
// - Right: clean info stack (Title, Firm, meta list) + compact pricing/CTA card
// - Below: wide section blocks  Description, Features, Amenities, Specifications, About the Designers
// - Bottom: Similar Designs horizontal cards with price per sq ft
// Uses only existing fields returned by fetchStudioBySlug; falls back gracefully.

import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, PenSquare } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { fetchStudioBySlug } from "../services/marketplace.js";
import { submitStudioRequest } from "../services/studioRequests.js";
import { formatRequestError } from "../utils/httpErrors.js";
import { applyFallback, getStudioFallback } from "../utils/imageFallbacks.js";
import { readStoredUser } from "../services/auth.js";
import { inferRoleFromUser } from "../constants/roles.js";
import { getWorkspaceCollections, subscribeToWorkspaceRole } from "../utils/workspaceSync.js";
import SimilarDesignsGrid from "../components/studio/SimilarDesignsGrid.jsx";

const Footer = lazy(() => import("../components/Footer"));

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

const formatAreaUnit = (unit) =>
  typeof unit === "string" && unit.trim().toLowerCase() === "m2" ? "m²" : "sq ft";


const formatCurrency = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toLocaleString()}`;
  }
};

const bundleToServiceTile = (bundle) => {
  if (!bundle) return null;
  const details = [];
  if (bundle.scope) details.push(bundle.scope);
  if (bundle.turnaroundTime) details.push(`Turnaround ${bundle.turnaroundTime}`);
  if (bundle.fileFormat) details.push(bundle.fileFormat);
  if (bundle.skillLevel) details.push(`Skill: ${startCase(bundle.skillLevel)}`);
  if (Array.isArray(bundle.deliverables) && bundle.deliverables.length) {
    details.push(
      `${bundle.deliverables.length} deliverable${bundle.deliverables.length === 1 ? "" : "s"}`
    );
  }
  if (bundle.revisionsAllowed) {
    details.push(`Revisions: ${bundle.revisionsAllowed}`);
  }
  const priceLabel = formatCurrency(bundle.price, bundle.currency || "USD");
  const statusLabel =
    bundle.cadence || bundle.durationLabel || priceLabel || bundle.notes || undefined;
  return {
    id: bundle.id || `bundle-${Math.random().toString(36).slice(2, 8)}`,
    label: bundle.bundleName || "Service bundle",
    description: details.join(" \u00b7 ") || bundle.notes || "Custom engagement available.",
    status: "available",
    statusLabel,
  };
};

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

const SERVICE_KEYWORDS = {
  architectural: ["architectural", "architecture", "blueprint", "plan set", "concept design", "ifc", "bim"],
  interior: ["interior", "space planning", "ff&e", "finishes", "furniture"],
  urban: ["urban", "infrastructure", "masterplan", "transit", "civic", "sceneography", "broadcast"],
  sustainable: ["sustainable", "net zero", "passive", "low carbon", "green building", "energy model"],
  planCatalogue: ["catalogue", "plan set", "pre-designed", "builder set", "kit of parts"],
  designBuild: ["design-build", "turnkey", "build partner", "construction", "delivery"],
};

const gatherServiceText = (studio) =>
  [
    studio?.title,
    studio?.summary,
    studio?.description,
    studio?.bio,
    studio?.story,
    studio?.programType,
    studio?.studioType,
    studio?.offerType,
    ...(studio?.programs || []),
    ...(studio?.features || []),
    ...(studio?.tags || []),
    ...(studio?.services || []),
    ...(studio?.metadata?.keywords || []),
    studio?.firm?.bio,
    ...(studio?.firm?.services || []).map((service) =>
      typeof service === "string" ? service : service?.title || service?.description
    ),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .join(" ");

const deriveServiceProfile = (studio) => {
  if (!studio) {
    return {
      architectural: false,
      interior: false,
      urban: false,
      sustainable: false,
      planCatalogue: false,
      designBuild: false,
    };
  }
  const text = gatherServiceText(studio);
  const tokens = new Set(
    [
      ...(studio.programs || []),
      ...(studio.services || []),
      ...(studio.tags || []),
      ...(studio.features || []),
      studio.programType,
      studio.offerType,
      studio.catalogType,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
  );
  const hasKeyword = (bucket) =>
    SERVICE_KEYWORDS[bucket].some((needle) => text.includes(needle) || tokens.has(needle));

  return {
    architectural: hasKeyword("architectural"),
    interior: hasKeyword("interior"),
    urban: hasKeyword("urban"),
    sustainable: hasKeyword("sustainable"),
    planCatalogue: hasKeyword("planCatalogue") || studio.catalogType === "plan",
    designBuild: hasKeyword("designBuild") || /turnkey|build partner|construction/.test(text),
  };
};

const resolveCategory = (s) =>
  s?.primaryCategory || s?.category || (Array.isArray(s?.categories) ? s.categories[0] : null);

const currencyOf = (s) => s?.currency || s?.pricing?.currency || "USD";

const normaliseId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    if (typeof value.toString === "function") {
      const text = value.toString();
      if (text && text !== "[object Object]") {
        return text;
      }
    }
  }
  return null;
};

const normaliseSlug = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const buildEditorLink = (slug, section) => {
  const base = slug ? `/portal/studio?edit=${encodeURIComponent(slug)}` : "/portal/studio";
  if (!section) return base;
  const joinChar = base.includes("?") ? "&" : "?";
  return `${base}${joinChar}section=${encodeURIComponent(section)}`;
};

const StudioDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist } = useWishlist();
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [requestForm, setRequestForm] = useState({ name: '', email: '', company: '', message: '' });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [viewer] = useState(() => readStoredUser());

  const galleryImages = useMemo(() => {
    if (!studio) return [];
    const sources = [
      studio.heroImage,
      ...(Array.isArray(studio.gallery) ? studio.gallery : []),
      ...(Array.isArray(studio.images) ? studio.images : []),
    ].filter(Boolean);
    return Array.from(new Set(sources));
  }, [studio]);

  const viewerRole = useMemo(() => inferRoleFromUser(viewer), [viewer]);

  const viewerFirmIds = useMemo(() => {
    if (!viewer?.memberships) return [];
    return viewer.memberships
      .map((membership) => normaliseId(membership?.firm))
      .filter(Boolean);
  }, [viewer]);

  const viewerFirmSlugs = useMemo(() => {
    if (!viewer?.memberships) return [];
    return viewer.memberships
      .map((membership) => normaliseSlug(membership?.firm?.slug || membership?.firmSlug || membership?.slug))
      .filter(Boolean);
  }, [viewer]);

  const canEditStudio = useMemo(() => {
    if (!viewer || !studio) return false;
    if (viewerRole === "superadmin" || viewerRole === "admin") return true;
    const firmId = normaliseId(studio?.firm?._id ?? studio?.firm?.id ?? studio?.firm);
    const firmSlug = normaliseSlug(studio?.firm?.slug);
    const idMatch = firmId && viewerFirmIds.includes(firmId);
    const slugMatch = firmSlug && viewerFirmSlugs.includes(firmSlug);
    return Boolean(idMatch || slugMatch);
  }, [studio, viewer, viewerRole, viewerFirmIds, viewerFirmSlugs]);

  const editorShortcuts = useMemo(() => {
    const base = buildEditorLink(studio?.slug);
    return [
      { label: "Open workspace", href: base, primary: true },
      { label: "Hero & gallery", href: buildEditorLink(studio?.slug, "gallery") },
      { label: "Details & specs", href: buildEditorLink(studio?.slug, "details") },
      { label: "Pricing & CTA", href: buildEditorLink(studio?.slug, "pricing") },
    ];
  }, [studio?.slug]);

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
        if (cancelled) return;
        if (item) {
          setStudio(item);
        } else {
          setStudio(null);
          setError("Studio not found.");
        }
      } catch (err) {
        if (cancelled) return;
        setStudio(null);
        setError(
          err?.response?.status === 404
            ? "Studio not found."
            : err?.message || "We could not load this studio right now."
        );
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
  const areaUnitValue = studio?.areaUnit || studio?.metrics?.areaUnit || 'sq ft';
  const areaUnitLabel = formatAreaUnit(areaUnitValue);

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
    push("Plot Size", number(plotAreaSqft || areaSqft), areaUnitLabel);
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
  }, [studio, style, category, plotAreaSqft, areaSqft, bedroomCount, bathroomCount, roomsCount, floorsCount, areaUnitLabel]);

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
  const serviceProfile = useMemo(() => deriveServiceProfile(studio), [studio]);
  const heroFallback = useMemo(() => getStudioFallback(studio), [studio]);

  const buildCartPayload = (entry = studio) => {
    if (!entry) return null;
    const entryGallery = Array.isArray(entry.gallery)
      ? entry.gallery
      : Array.isArray(entry.images)
      ? entry.images
      : [];
    const primaryImage = entryGallery[0] || entry.heroImage || galleryImages[0] || "";
    const entryCurrency = currencyOf(entry);
    const entryPricePerSqft = resolvePricePerSqft(entry);
    const entryAreaSqft = resolveAreaSqft(entry);
    const entryPlotAreaSqft = resolvePlotAreaSqft(entry);
    const entryTotalPrice = (() => {
      const area = entryPlotAreaSqft || entryAreaSqft;
      if (entryPricePerSqft != null && area != null) return entryPricePerSqft * Number(area);
      return entry.price ?? entry.pricing?.total ?? null;
    })();
    const productId = entry._id ?? entry.slug ?? id;
    return {
      productId,
      id: productId,
      title: entry.title,
      image: primaryImage,
      price: Number(entryTotalPrice ?? entryPricePerSqft ?? 0),
      quantity: 1,
      seller: entry.firm?.name || entry.studio || "Studio partner",
      source: "Studio",
      kind: "studio",
      currency: entryCurrency,
      metadata: {
        category: resolveCategory(entry),
        style: resolveStyle(entry),
        areaSqft: entryAreaSqft ?? entryPlotAreaSqft,
        pricePerSqft: entryPricePerSqft,
      },
    };
  };

  const buildWishlistPayload = (entry = studio) => {
    const cartPayload = buildCartPayload(entry);
    if (!cartPayload) return null;
    return {
      productId: cartPayload.productId,
      title: cartPayload.title,
      image: cartPayload.image,
      price: cartPayload.price,
      currency: cartPayload.currency,
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

  const handleAddStudioToWishlist = async (entry = studio) => {
    const payload = buildWishlistPayload(entry);
    if (!payload) return;
    try {
      await addToWishlist(payload);
      toast.success("Added to wishlist");
    } catch (err) {
      console.error(err);
      toast.error("Could not add studio to wishlist");
    }
  };
  const recommendedStudios = useMemo(() => [], [studio]);

  const [workspaceCollections, setWorkspaceCollections] = useState(() => getWorkspaceCollections("firm"));
  useEffect(() => {
    const unsubscribe = subscribeToWorkspaceRole("firm", (state) => setWorkspaceCollections(state));
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);
  const workspaceServiceBundles = workspaceCollections?.serviceBundles || [];

  const handleAddRecommendedToCart = async (entry) => {
    const payload = buildCartPayload(entry);
    if (!payload) return;
    try {
      await addToCart(payload);
      toast.success(entry.title + ' added to cart');
    } catch (err) {
      console.error(err);
      toast.error("Could not add studio to cart");
    }
  };
  const hostingConfig = studio?.firm?.hosting;
  const tileConfig = useMemo(() => {
    const summary = hostingConfig?.serviceSummary?.trim() || "";
    const services = Array.isArray(hostingConfig?.services) ? hostingConfig.services : [];
    const products = Array.isArray(hostingConfig?.products) ? hostingConfig.products : [];
    if (summary || services.length || products.length) {
      return { summary, services, products };
    }
    if (workspaceServiceBundles.length) {
      const bundlesAsTiles = workspaceServiceBundles
        .map((bundle) => bundleToServiceTile(bundle))
        .filter(Boolean);
      if (bundlesAsTiles.length) {
        const fallbackSummary =
          workspaceServiceBundles.length === 1
            ? `Program ready: ${workspaceServiceBundles[0].bundleName || workspaceServiceBundles[0].scope || "Custom engagement"}`
            : "Programs drafted in your workspace are shown below.";
        return {
          summary: fallbackSummary,
          services: bundlesAsTiles,
          products: [],
        };
      }
    }
    return null;
  }, [hostingConfig, workspaceServiceBundles]);
  const serviceTiles = tileConfig?.services || [];
  const productTiles = tileConfig?.products || [];
  const serviceSummary = tileConfig?.summary || "";
  const hasServiceSummary = Boolean(serviceSummary && serviceSummary.trim());
  const hasServiceTiles = serviceTiles.length > 0;
  const hasProductTiles = productTiles.length > 0;
  const ownerChecklist = useMemo(() => {
    if (!studio) return [];
    const slug = studio.slug;
    return [
      {
        key: "gallery",
        label: "Hero & gallery",
        ok: galleryImages.length > 0,
        detail: galleryImages.length ? `${galleryImages.length} media asset${galleryImages.length === 1 ? "" : "s"}` : "Upload at least one hero image.",
        href: slug ? buildEditorLink(slug, "gallery") : "/portal/studio",
      },
      {
        key: "pricing",
        label: "Pricing & CTA",
        ok: pricePerSqft != null || totalPrice != null,
        detail:
          pricePerSqft != null
            ? `${currency} ${number(pricePerSqft)} per ${areaUnitLabel}`
            : totalPrice != null
              ? `${currency} ${number(totalPrice)} total`
              : "Share transparent pricing or keep it on-request.",
        href: slug ? buildEditorLink(slug, "pricing") : "/portal/studio",
      },
      {
        key: "specs",
        label: "Specs & layout",
        ok:
          Boolean(areaSqft || plotAreaSqft) ||
          bedroomCount != null ||
          bathroomCount != null ||
          floorsCount != null,
        detail: areaSqft ? `${number(areaSqft)} ${areaUnitLabel}` : "Add bedrooms, baths, floors, or sqft.",
        href: slug ? buildEditorLink(slug, "details") : "/portal/studio",
      },
      {
        key: "programs",
        label: "Service programs",
        ok: hasServiceTiles || hasServiceSummary,
        detail: hasServiceTiles ? `${serviceTiles.length} tile${serviceTiles.length === 1 ? "" : "s"}` : "Describe what this studio sells.",
        href: "/portal/studio#firm-profile",
      },
    ];
  }, [
    studio,
    galleryImages.length,
    pricePerSqft,
    totalPrice,
    currency,
    areaSqft,
    plotAreaSqft,
    areaUnitLabel,
    bedroomCount,
    bathroomCount,
    floorsCount,
    hasServiceTiles,
    hasServiceSummary,
    serviceTiles.length,
  ]);
  const ownerChecklistComplete = ownerChecklist.length > 0 && ownerChecklist.every((item) => item.ok);
  const ownerUpdatedStamp = useMemo(() => {
    if (!studio?.updatedAt) return null;
    try {
      return new Date(studio.updatedAt).toLocaleString();
    } catch {
      return studio.updatedAt;
    }
  }, [studio?.updatedAt]);
  const contactEmail =
    studio?.firm?.contact?.email ||
    studio?.contactEmail ||
    studio?.inquiriesEmail ||
    studio?.pointOfContact?.email ||
    null;


  const handleRequestFieldChange = (field) => (event) => {
    const value = event.target.value;
    setRequestForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitStudioRequest = async (event) => {
    event.preventDefault();
    if (!studio) return;
    const trimmed = {
      name: (requestForm.name || '').trim(),
      email: (requestForm.email || '').trim(),
      company: (requestForm.company || '').trim(),
      message: (requestForm.message || '').trim(),
    };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmed.name.length < 2) {
      setRequestError('Please share your name (at least 2 characters).');
      return;
    }
    if (!emailPattern.test(trimmed.email)) {
      setRequestError('Enter a valid email address.');
      return;
    }
    if (trimmed.message.length < 20) {
      setRequestError('Project overview must be at least 20 characters.');
      return;
    }
    setRequestSubmitting(true);
    setRequestSuccess(false);
    setRequestError(null);
    try {
      await submitStudioRequest({
        studioId: studio._id,
        studioSlug: studio.slug,
        firmId: studio.firm?._id || studio.firm?.id || studio.firm,
        name: trimmed.name,
        email: trimmed.email,
        company: trimmed.company || undefined,
        message: trimmed.message,
      });
      setRequestSubmitting(false);
      setRequestSuccess(true);
      setRequestForm({ name: '', email: '', company: '', message: '' });
    } catch (err) {
      setRequestSubmitting(false);
      setRequestError(formatRequestError(err, 'Unable to send request right now'));
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
    const troubleshooting = [
      {
        title: "The link is stale",
        detail: "Studios evolve quickly. A partner may have archived or renamed this slug.",
      },
      {
        title: "Private catalog item",
        detail: "Some enterprise programmes stay invitation-only. Ask your Builtattic rep to unlock access.",
      },
      {
        title: "Typo in the URL",
        detail: "Double-check the slug or jump into the marketplace search to pick a live listing.",
      },
    ];
    const supportEmail = "studios@builtattic.com";
    const quickShortcuts = [
      { label: "Residential kits", href: "/studio?category=Residential" },
      { label: "Design-build partners", href: "/studio?focus=designBuild" },
      { label: "Plan catalogues", href: "/studio?focus=plans" },
    ];

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10">
          <section className="mx-auto max-w-6xl">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-10 lg:px-10 lg:py-12 shadow-xl">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                      Studio lookup
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-semibold">
                      {error || "Studio not found."}
                    </h1>
                    <p className="text-base text-white/80">
                      We couldn't find the system you requested. Re-run your search or open a fresh marketplace session—your recommendations below update instantly.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      Go back
                    </button>
                    <Link
                      to="/studio"
                      className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
                    >
                      Open studio marketplace
                    </Link>
                    <a
                      href={`mailto:${supportEmail}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
                    >
                      Contact concierge
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickShortcuts.map((shortcut) => (
                      <Link
                        key={shortcut.label}
                        to={shortcut.href}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                        {shortcut.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                      Why this happens
                    </p>
                    <p className="mt-2 text-sm text-white/80">
                      It's usually a quick fix. Check these common reasons and retry.
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {troubleshooting.map((item) => (
                      <li key={item.title} className="rounded-2xl bg-white/5 px-4 py-3">
                        <p className="text-sm font-semibold text-white/95">{item.title}</p>
                        <p className="text-xs text-white/70">{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-xs text-white/80">
                    Need personalised help? Share the slug or screenshot with <a href={`mailto:${supportEmail}`} className="font-semibold text-white">{supportEmail}</a> and we'll surface the closest catalogue-ready pairings.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {recommendedStudios.length > 0 && (
            <section className="mt-12">
              <div className="mx-auto max-w-6xl space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                      You might like
                    </p>
                    <h2 className="text-xl font-semibold text-slate-900">Catalogue-ready alternatives</h2>
                    <p className="text-sm text-slate-500">Pulled from the same category or most active studios this week.</p>
                  </div>
                  <Link
                    to="/studio"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Browse all <span aria-hidden="true">→</span>
                  </Link>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  {recommendedStudios.map((item) => {
                    const image =
                      item.heroImage || (Array.isArray(item.gallery) ? item.gallery[0] : null) ||
                      "/assets/studio-fallback.jpg";
                    const recPricePerSqft = resolvePricePerSqft(item);
                    const recArea = resolveAreaSqft(item) || resolvePlotAreaSqft(item);
                    const recCurrency = currencyOf(item);
                    const recAreaUnitLabel = formatAreaUnit(item.areaUnit || item.metrics?.areaUnit);
                    const studioHref = '/studio/' + (item.slug || item._id || '');

                    return (
                      <article
                        key={item.slug || item._id}
                        className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                      >
                        <Link to={studioHref} className="block">
                          <div className="aspect-[4/3] overflow-hidden bg-slate-200">
                          <img
                            src={image}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-300 hover:scale-105"
                            loading="lazy"
                            onError={(event) => applyFallback(event, getStudioFallback(item))}
                          />
                          </div>
                        </Link>
                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                              {item.firm?.name || "Studio"}
                            </p>
                            <Link
                              to={studioHref}
                              className="mt-1 text-lg font-semibold text-slate-900 line-clamp-2 hover:text-slate-700"
                            >
                              {item.title}
                            </Link>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {item.summary ||
                              "Minimalist, catalogue-ready system optimised for fast deployment with modular services."}
                          </p>
                          <div className="text-xs text-slate-500 space-y-1">
                            {recPricePerSqft != null && (
                              <p>
                                {recCurrency} {number(recPricePerSqft)} / {recAreaUnitLabel}
                              </p>
                            )}
                            {recArea && <p>{number(recArea)} {recAreaUnitLabel} build area</p>}
                          </div>
                          <div className="mt-auto flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddRecommendedToCart(item)}
                              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                            >
                              Add to cart
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddStudioToWishlist(item)}
                              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
                            >
                              Wishlist
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </main>
        <Footer />
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
    ["Pricing", pricePerSqft != null ? `${currency} ${number(pricePerSqft)} per ${areaUnitLabel}` : "On request"],
    ["Style", style || "-"],
    ["Plot Size", (plotAreaSqft || areaSqft) ? `${number(plotAreaSqft || areaSqft)} ${areaUnitLabel}` : "-"],
    ["Bedrooms", bedroomCount ?? "-"],
    ["Bathrooms", bathroomCount ?? "-"],
    ["Number of Rooms", roomsCount ?? "-"],
    ["Number of Floors", floorsCount ?? "-"],
  ];
  const conciergeEmail = studio?.conciergeEmail || "studios@builtattic.com";

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {canEditStudio && studio ? (
        <div className="border-b border-amber-100 bg-amber-50">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <div>
              <p className="font-semibold">You&rsquo;re viewing your live Design Studio tile.</p>
              <p className="text-amber-900/80">
                Use the workspace shortcuts to adjust the gallery, copy, or pricing without hunting through menus.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {editorShortcuts
                .filter((shortcut) => Boolean(shortcut?.href))
                .map((shortcut) => (
                  <Link
                    key={shortcut.label}
                    to={shortcut.href}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold transition ${
                      shortcut.primary
                        ? "bg-amber-900 text-white shadow-sm hover:bg-amber-800"
                        : "border border-amber-200 bg-white text-amber-900 hover:border-amber-300"
                    }`}
                  >
                    {shortcut.primary ? <PenSquare size={14} /> : null}
                    <span>{shortcut.label}</span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      ) : null}
      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-10">
        {canEditStudio && ownerChecklist.length ? (
          <section className="mb-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Owner view</p>
                <h2 className="text-xl font-semibold text-slate-900">Publishing readiness</h2>
                <p className="text-sm text-slate-600">
                  Keep these rows green and your tile stays featured at the top of Design Studio.
                </p>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p>
                  Studio ID:{" "}
                  <span className="font-semibold text-slate-800">{studio?._id || studio?.id || "?"}</span>
                </p>
                {studio?.slug ? (
                  <p>Slug: <span className="font-semibold text-slate-800">/studio/{studio.slug}</span></p>
                ) : null}
                {ownerUpdatedStamp ? <p>Updated {ownerUpdatedStamp}</p> : null}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {ownerChecklist.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                    item.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300"
                  }`}
                >
                  {item.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs">{item.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
            {ownerChecklistComplete ? (
              <div className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-800">
                Everything looks dialed in. Drop new media periodically to keep the recommendation engine warm.
              </div>
            ) : null}
          </section>
        ) : null}
        {/* Top two-column layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: gallery with controls */}
          <div className="lg:col-span-7 space-y-4">
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
                      onError={(event) => applyFallback(event, heroFallback)}
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
                        onError={(event) => applyFallback(event, heroFallback)}
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
                      Calculated by {currency} {number(pricePerSqft)} per {areaUnitLabel} ·
                      {" "}
                      {number(plotAreaSqft || areaSqft)} {areaUnitLabel}
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

        {/* Service & product profile */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Service programs
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">What this studio sells</h2>
                  <p className="text-sm text-slate-600">
                    {hasServiceSummary
                      ? serviceSummary
                      : 'Service programs have not been published yet.'}
                  </p>
                </div>
              </div>
            <div className="mt-5 space-y-4">
              {hasServiceTiles ? (
                serviceTiles.map((tile) => {
                  const tileKey = tile.id || tile.label;
                  const inferredActive = tile.id ? serviceProfile[tile.id] : true;
                  const status = tile.status || (inferredActive ? 'available' : 'on-request');
                  const badgeLabel = tile.statusLabel || (status === 'available' ? 'Available' : 'On request');
                  const badgeClass =
                    status === 'available'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500';
                  return (
                    <div key={tileKey} className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{tile.label}</p>
                          <p className="text-xs text-slate-600">{tile.description}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                  Service programs will appear here once the studio publishes them.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Products & delivery
              </p>
              <h2 className="text-lg font-semibold text-slate-900">How they package the work</h2>
              <p className="text-sm text-slate-600">
                {hasProductTiles
                  ? 'Some studios ship ready-to-license plan sets, others run end-to-end design-build programmes.'
                  : 'Catalogue details have not been shared yet.'}
              </p>
            </div>

            <div className="space-y-4">
              {hasProductTiles ? (
                productTiles.map((tile) => {
                  const tileKey = tile.id || tile.label;
                  const inferredActive = tile.id ? serviceProfile[tile.id] : true;
                  const status = tile.status || (inferredActive ? 'available' : 'on-request');
                  const badgeLabel = tile.statusLabel || (status === 'available' ? 'In catalogue' : 'Available on request');
                  const badgeClass =
                    status === 'available'
                      ? 'text-indigo-700 bg-indigo-50'
                      : 'text-slate-500 bg-slate-100';
                  const defaultExtra = (() => {
                    if (tile.id === 'planCatalogue') {
                      if (serviceProfile.planCatalogue) {
                        if (pricePerSqft != null) return `${currency} ${number(pricePerSqft)} per ${areaUnitLabel}`;
                        return 'Catalogue pricing shared on brief';
                      }
                      return 'Ask for catalogue access';
                    }
                    if (tile.id === 'designBuild') {
                      if (serviceProfile.designBuild) {
                        if (studio?.delivery?.leadTimeWeeks)
                          return `${studio.delivery.leadTimeWeeks} week lead time`;
                        return deliveryDetails.points[0] || 'Active design-build pipeline';
                      }
                      return 'Introduce a build partner to activate';
                    }
                    return inferredActive ? 'Active programme' : 'Enable via Studio portal';
                  })();
                  const extraCopy = tile.extra || defaultExtra;
                  return (
                    <div key={tileKey} className="rounded-2xl border border-slate-100 px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{tile.label}</p>
                          <p className="text-xs text-slate-600">{tile.description}</p>
                          <p className="text-xs font-semibold text-slate-900">{extraCopy}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                  The seller has not published catalogue bundles yet.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleAddStudioToWishlist()}
                className="inline-flex flex-1 min-w-[140px] items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                Save studio
              </button>
              {(contactEmail || conciergeEmail) && (
                <a
                  href={`mailto:${contactEmail || conciergeEmail}`}
                  className="inline-flex flex-1 min-w-[140px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Share project brief
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Studio inquiries</p>
              <h3 className="text-lg font-semibold text-slate-900">Share your project brief</h3>
              <p className="text-sm text-slate-600">
                Send a short note directly to the {firmName} team. Each submission is tracked on their dashboard so they can follow up with you.
              </p>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleSubmitStudioRequest}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-500">
                  Full name
                  <input
                    required
                    value={requestForm.name}
                    onChange={handleRequestFieldChange('name')}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    placeholder="Jane Doe"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-500">
                  Email
                  <input
                    required
                    type="email"
                    value={requestForm.email}
                    onChange={handleRequestFieldChange('email')}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    placeholder="you@company.com"
                  />
                </label>
              </div>
              <label className="text-xs font-semibold text-slate-500">
                Company or organisation
                <input
                  value={requestForm.company}
                  onChange={handleRequestFieldChange('company')}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  placeholder="Optional"
                />
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Project overview
                <textarea
                  required
                  minLength={20}
                  value={requestForm.message}
                  onChange={handleRequestFieldChange('message')}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  rows={4}
                  placeholder="Tell us about the site, budget, and delivery goals."
                />
              </label>
              {requestError && <p className="text-xs font-semibold text-rose-600">{requestError}</p>}
              {requestSuccess && !requestError && (
                <p className="text-xs font-semibold text-emerald-600">Thanks! The studio has received your request.</p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {requestSubmitting ? 'Sending…' : 'Send request'}
                </button>
                <button
                  type="button"
                  disabled={requestSubmitting}
                  onClick={() => setRequestForm({ name: '', email: '', company: '', message: '' })}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear form
                </button>
              </div>
            </form>
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

        <SimilarDesignsGrid
          items={recommendedStudios}
          numberFormatter={number}
          onFallback={applyFallback}
          fallbackResolver={getStudioFallback}
        />
      </main>

      <Suspense fallback={<div className="py-10 text-center text-sm text-slate-500">Loading footer…</div>}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default StudioDetail;



