import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import { HiOutlineHeart, HiHeart } from "react-icons/hi2";
import { FiExternalLink, FiGlobe, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useWishlist } from "../context/WishlistContext";
import { fetchMarketplaceFirms } from "../services/marketplace.js";
import {
  applyFallback,
  getFirmAvatarFallback,
  getFirmAvatarImage,
  getFirmCoverFallback,
  getFirmCoverImage,
} from "../utils/imageFallbacks.js";
import { readStoredUser } from "../services/auth.js";
import { inferRoleFromUser } from "../constants/roles.js";

const ensureArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
};

const uniqueList = (value) => {
  const flattened = ensureArray(value)
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry && typeof entry === "object") {
        return entry.title || entry.name || entry.value || entry.label || null;
      }
      return entry ?? null;
    })
    .filter(Boolean);
  return Array.from(new Set(flattened));
};

const normaliseString = (value) => (typeof value === "string" ? value.trim() : "");
const normaliseId = (value) => normaliseString(value).toLowerCase();
const normaliseSlug = (value) => normaliseString(value).toLowerCase();
const slugify = (value) => {
  const text = normaliseString(value).toLowerCase();
  if (!text) return "";
  return text.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
};

const parsePrice = (value) => {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCurrency = (value, currency = "USD") => {
  if (value == null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: numeric >= 100000 ? 0 : 2,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toLocaleString()}`;
  }
};

const formatNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : "—";
};

const formatTimestamp = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return value;
  }
};

const parseLegacyFirmFromQuery = (params) => {
  if (!params) return null;
  const title = normaliseString(params.get("title"));
  if (!title) return null;
  const cover = params.get("cover");
  const gallery = [
    cover,
    params.get("gallery"),
    ...params.getAll("gallery[]"),
  ]
    .map(normaliseString)
    .filter(Boolean);
  const services = (params.get("services") || params.get("features") || "")
    .split(/[,\\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const regions = (params.get("regions") || params.get("location") || "")
    .split(/[/,|]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const partners = (params.get("partners") || "").split(/[,\\n]/).map((entry) => entry.trim()).filter(Boolean);
  const idParam = params.get("id") || params.get("firmId");

  return {
    _id: idParam || slugify(title),
    slug: slugify(title),
    name: title,
    tagline: params.get("tagline") || params.get("description") || "",
    summary: params.get("description") || "",
    coverImage: cover,
    gallery,
    services,
    styles: params.get("style") ? [params.get("style")] : [],
    operatingRegions: regions,
    partners,
    contact: {
      email: params.get("sellerContact") || params.get("contact"),
      phone: params.get("sellerPhone"),
      website: params.get("website"),
    },
    priceSqft: parsePrice(params.get("price")),
    currency: params.get("currency") || "USD",
  };
};

const findFirmMatch = (items, { slug, id, name }) => {
  const targetSlug = normaliseSlug(slug || name);
  const targetId = normaliseId(id);
  return (
    items.find((candidate) => {
      const candidateId = normaliseId(candidate?._id || candidate?.id);
      const candidateSlug = normaliseSlug(candidate?.slug || candidate?.handle || candidate?.name);
      if (targetId && candidateId === targetId) return true;
      if (targetSlug && candidateSlug === targetSlug) return true;
      return false;
    }) || null
  );
};

const resolveLocationLabel = (firm) => {
  if (!firm) return "";
  if (typeof firm.location === "string" && firm.location.trim()) return firm.location.trim();
  const parts = [];
  if (firm.location?.city) parts.push(firm.location.city);
  if (firm.location?.state) parts.push(firm.location.state);
  if (firm.location?.country) parts.push(firm.location.country);
  if (!parts.length && firm.headquarters) return firm.headquarters;
  if (!parts.length && firm.profile?.headquarters) return firm.profile.headquarters;
  return parts.join(", ");
};

const resolveStudioCount = (firm) => {
  if (!firm) return null;
  if (Number.isFinite(firm.studioCount)) return Number(firm.studioCount);
  if (Number.isFinite(firm.catalogCount)) return Number(firm.catalogCount);
  if (Array.isArray(firm.studios)) return firm.studios.length;
  if (Array.isArray(firm.catalog)) return firm.catalog.length;
  if (Array.isArray(firm.publishedStudios)) return firm.publishedStudios.length;
  if (firm.metrics?.studiosPublished != null) return Number(firm.metrics.studiosPublished);
  return null;
};

const resolveSampleStudios = (firm) => {
  if (!firm) return [];
  const samples = [
    ...(firm.sampleStudios || []),
    ...(firm.catalog || []).map((item) => item?.title),
    ...(firm.studios || []).map((item) => item?.title),
    ...(firm.programs || []),
  ];
  return uniqueList(samples).slice(0, 6);
};

const resolveAverageFee = (firm) => {
  const candidates = [
    firm?.priceSqft,
    firm?.averageFee,
    firm?.pricing?.priceSqft,
    firm?.pricing?.averageFee,
    firm?.profile?.averageFee,
  ];
  for (const candidate of candidates) {
    const numeric = parsePrice(candidate);
    if (numeric != null) return numeric;
  }
  return null;
};

const uniqueImages = (firm) => {
  if (!firm) return [];
  const images = [
    firm.heroImage,
    firm.coverImage,
    firm.profile?.heroImage,
    ...(Array.isArray(firm.gallery) ? firm.gallery : []),
    ...(Array.isArray(firm.profile?.gallery) ? firm.profile.gallery : []),
  ];
  return uniqueList(images).filter((src) => typeof src === "string" && src.trim());
};

const buildWishlistItem = (firm, image) => {
  if (!firm) return null;
  const identifier = firm._id || firm.id || firm.slug || `firm-${slugify(firm.name)}`;
  if (!identifier) return null;
  return {
    id: identifier,
    productId: identifier,
    title: firm.name || "Design Studio",
    image: image || firm.coverImage || "",
    price: resolveAverageFee(firm) || 0,
    source: "Firm",
  };
};

const heroActions = [
  { label: "Manage studios", href: "/portal/studio" },
  { label: "Open dashboard", href: "/dashboard/firm" },
];

const FirmPortfolio = () => {
  const location = useLocation();
  const routerFirm = location.state?.firm || null;
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const slugParam = params.get("slug") || params.get("firm");
  const idParam = params.get("id") || params.get("firmId");
  const sharedFirm = useMemo(() => parseLegacyFirmFromQuery(params), [params]);
  const requiresLookup = Boolean(slugParam || idParam);
  const [firm, setFirm] = useState(routerFirm || sharedFirm || null);
  const [loading, setLoading] = useState(!routerFirm && requiresLookup);
  const [error, setError] = useState(null);
  const [viewer] = useState(() => readStoredUser());
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    if (routerFirm) {
      setFirm(routerFirm);
      setError(null);
      setLoading(false);
    }
  }, [routerFirm]);

  useEffect(() => {
    if (routerFirm || (!requiresLookup && sharedFirm)) {
      setLoading(false);
      if (!firm && sharedFirm) {
        setFirm(sharedFirm);
        setError("This preview was shared via link. Sign in to sync live data.");
      }
      return;
    }
    if (!requiresLookup) {
      setLoading(false);
      if (!firm) {
        setError("Firm not specified.");
      }
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query = slugParam ? { slug: slugParam } : idParam ? { id: idParam } : {};
        const { items } = await fetchMarketplaceFirms(query);
        if (cancelled) return;
        const match = findFirmMatch(items || [], { slug: slugParam, id: idParam, name: params.get("title") });
        if (match) {
          setFirm(match);
          setError(null);
        } else if (sharedFirm) {
          setFirm(sharedFirm);
          setError("Loaded shared snapshot; live sync unavailable.");
        } else {
          setFirm(null);
          setError("Firm not found.");
        }
      } catch (err) {
        if (cancelled) return;
        if (sharedFirm) {
          setFirm(sharedFirm);
          setError("Showing shared snapshot (network unavailable).");
        } else {
          setError(err?.message || "Unable to load firm profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routerFirm, requiresLookup, sharedFirm, slugParam, idParam, params]);

  const heroImage = getFirmCoverImage(firm);
  const heroFallback = getFirmCoverFallback(firm);
  const avatarImage = getFirmAvatarImage(firm);
  const avatarFallback = getFirmAvatarFallback(firm);
  const locationLabel = resolveLocationLabel(firm);
  const studioCount = resolveStudioCount(firm);
  const sampleStudios = resolveSampleStudios(firm);
  const averageFee = resolveAverageFee(firm);
  const billingCurrency = firm?.currency || firm?.profile?.billingCurrency || "USD";
  const regions = uniqueList([...(firm?.operatingRegions || []), ...(firm?.regions || []), ...(firm?.profile?.regions || [])]);
  const languages = uniqueList(firm?.languages || firm?.profile?.languages || []);
  const services = uniqueList([...(firm?.services || []), ...(firm?.profile?.services || [])]);
  const specialisations = uniqueList([...(firm?.styles || []), ...(firm?.profile?.specialisations || [])]);
  const partners = uniqueList(firm?.partners || firm?.profile?.partnerNetwork || []);
  const awards = uniqueList([...(firm?.awards || []), ...(firm?.profile?.awards || []), ...(firm?.certifications || [])]);
  const projects = uniqueList(firm?.notableProjects || firm?.profile?.notableProjects || []);
  const gallery = uniqueImages(firm);
  const contactEmail =
    firm?.contact?.email || firm?.email || firm?.profile?.contactEmail || firm?.registration?.email || "hello@builtattic.com";
  const contactPhone = firm?.contact?.phone || firm?.profile?.contactPhone || firm?.registration?.phone || null;
  const website = firm?.contact?.website || firm?.profile?.website || firm?.website || null;
  const lastUpdated = formatTimestamp(firm?.profileUpdatedAt || firm?.profile?.updatedAt || firm?.updatedAt);
  const foundedYear = firm?.foundedYear || firm?.profile?.foundedYear || null;
  const portfolioLink = firm?.slug ? `/firmportfolio?slug=${encodeURIComponent(firm.slug)}` : "/firmportfolio";

  const wishlistItem = useMemo(() => buildWishlistItem(firm, heroImage), [firm, heroImage]);
  const isSaved = wishlistItem ? isInWishlist(wishlistItem) : false;

  const viewerRole = useMemo(() => inferRoleFromUser(viewer), [viewer]);
  const viewerFirmIds = useMemo(
    () =>
      ensureArray(viewer?.memberships)
        .map((membership) => normaliseId(membership?.firm?._id || membership?.firm?.id || membership?.firm))
        .filter(Boolean),
    [viewer],
  );
  const viewerFirmSlugs = useMemo(
    () =>
      ensureArray(viewer?.memberships)
        .map((membership) => normaliseSlug(membership?.firm?.slug || membership?.firmSlug || membership?.slug))
        .filter(Boolean),
    [viewer],
  );
  const canEditFirm = useMemo(() => {
    if (!viewer || !firm) return false;
    if (viewerRole === "admin" || viewerRole === "superadmin") return true;
    const firmId = normaliseId(firm._id || firm.id || firm.firmId);
    const firmSlug = normaliseSlug(firm.slug);
    const idMatch = firmId && viewerFirmIds.includes(firmId);
    const slugMatch = firmSlug && viewerFirmSlugs.includes(firmSlug);
    return Boolean(idMatch || slugMatch);
  }, [firm, viewer, viewerRole, viewerFirmIds, viewerFirmSlugs]);

  const handleWishlistToggle = async () => {
    if (!wishlistItem) return;
    try {
      if (isSaved) {
        await removeFromWishlist(wishlistItem);
        toast.success("Removed from shortlist");
      } else {
        await addToWishlist(wishlistItem);
        toast.success("Firm saved to shortlist");
      }
    } catch (err) {
      toast.error(err?.message || "Unable to update shortlist");
    }
  };

  const statCards = useMemo(() => {
    const averageFeeLabel = averageFee != null ? `${formatCurrency(averageFee, billingCurrency)} / sq ft` : "Set pricing";
    return [
      { label: "Studios in catalog", value: studioCount != null ? studioCount : "—", helper: "Live on Design Studio" },
      { label: "Average fee", value: averageFeeLabel || "—", helper: averageFee != null ? "Promoted on CTA" : "Update in workspace" },
      { label: "Regions", value: regions.length || "—", helper: regions.slice(0, 3).join(" • ") || "Add delivery coverage" },
      { label: "Team size", value: formatNumber(firm?.teamSize ?? firm?.team ?? firm?.members), helper: "Core delivery team" },
    ];
  }, [averageFee, billingCurrency, firm?.members, firm?.team, firm?.teamSize, regions.length, regions, studioCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Loading firm page...
      </div>
    );
  }

  if (!firm) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 text-center px-4">
        <h1 className="text-2xl font-semibold text-slate-900">Firm not found</h1>
        <p className="text-sm text-slate-500">The shared link may be invalid or this studio has been unpublished.</p>
        <Link to="/firms" className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Browse all firms
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16 space-y-10">
        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-[360px] w-full">
            <img
              src={heroImage}
              alt={firm.name}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => applyFallback(event, heroFallback)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end gap-4 p-6 lg:p-10">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200 uppercase tracking-[0.35em]">
                <span>Design Studio</span>
                {firm.category ? <span>{firm.category}</span> : null}
                {firm.verificationStatus ? <span>{firm.verificationStatus}</span> : null}
              </div>
              <div className="flex flex-wrap gap-5">
                <img
                  src={avatarImage}
                  alt={`${firm.name} logo`}
                  className="h-20 w-20 rounded-2xl border border-white/40 bg-white/80 object-cover"
                  onError={(event) => applyFallback(event, avatarFallback)}
                />
                <div className="flex-1 space-y-1 text-white">
                  <h1 className="text-4xl font-semibold">{firm.name}</h1>
                  <p className="text-lg text-slate-200">{firm.tagline || firm.summary || firm.bio}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                    {locationLabel ? (
                      <span className="inline-flex items-center gap-1">
                        <FiMapPin size={14} /> {locationLabel}
                      </span>
                    ) : null}
                    {foundedYear ? <span>Est. {foundedYear}</span> : null}
                    {lastUpdated ? <span>Updated {lastUpdated}</span> : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Proposal request - ${firm.name}`)}`}
                  className="inline-flex items-center rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                >
                  Request proposal
                </a>
                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/50 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <FiGlobe size={16} /> Visit website
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className="inline-flex items-center gap-2 rounded-full border border-white/50 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  {isSaved ? <HiHeart className="text-rose-300" /> : <HiOutlineHeart />}
                  {isSaved ? "Saved to shortlist" : "Save firm"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {canEditFirm ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Owner view</p>
                <h2 className="text-xl font-semibold text-emerald-900">Manage this published page</h2>
                <p className="text-sm text-emerald-800">Use the Design Studio workspace to update hero, services, and CTA copy.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm font-semibold text-emerald-900">
                {heroActions.map((action) => (
                  <Link
                    key={action.href}
                    to={action.href}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white/80 px-4 py-2 hover:bg-white"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: "Firm profile", detail: "Tagline, summary, hero media.", href: "/portal/studio#firm-profile" },
                { label: "Publishes & bundles", detail: "Studios, pricing, CTA copy.", href: "/portal/studio" },
                { label: "Dashboard", detail: "Metrics, workflow queue.", href: "/dashboard/firm" },
              ].map((shortcut) => (
                <Link
                  key={shortcut.href}
                  to={shortcut.href}
                  className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm font-semibold text-emerald-900 hover:bg-white"
                >
                  <p>{shortcut.label}</p>
                  <p className="text-xs font-normal text-emerald-700">{shortcut.detail}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-500">{card.helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">About</p>
              <h3 className="text-2xl font-semibold text-slate-900">Studio overview</h3>
              <p className="mt-3 text-sm text-slate-600">
                {firm.summary ||
                  firm.description ||
                  "Refresh your firm profile in Design Studio so buyers understand your positioning, services, and delivery approach."}
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Focus areas</dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {specialisations.length ? specialisations.join(" • ") : "Update styles & expertise"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Services</dt>
                <dd className="text-sm font-semibold text-slate-900">{services.length ? services.join(", ") : "Add service programs"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Regions</dt>
                <dd className="text-sm font-semibold text-slate-900">{regions.length ? regions.join(" / ") : "Add delivery regions"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Languages</dt>
                <dd className="text-sm font-semibold text-slate-900">{languages.length ? languages.join(", ") : "Add languages"}</dd>
              </div>
            </dl>
          </article>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Contact & response</p>
              <div className="space-y-2 text-sm text-slate-600">
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-slate-900">
                  <FiMail size={16} /> {contactEmail}
                </a>
                {contactPhone ? (
                  <a href={`tel:${contactPhone}`} className="flex items-center gap-2 hover:text-slate-900">
                    <FiPhone size={16} /> {contactPhone}
                  </a>
                ) : null}
                {website ? (
                  <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-slate-900">
                    <FiExternalLink size={16} /> {website.replace(/^https?:\/\//, "")}
                  </a>
                ) : null}
              </div>
            </div>
            {partners.length || awards.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Partners & credentials</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    {partners.length ? (
                      <p>
                        <span className="font-semibold text-slate-900">Partners:</span> {partners.join(", ")}
                      </p>
                    ) : null}
                    {awards.length ? (
                      <p>
                        <span className="font-semibold text-slate-900">Awards:</span> {awards.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </section>

        {sampleStudios.length ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Signature programmes</p>
                <h3 className="text-xl font-semibold text-slate-900">Studio bundles available</h3>
              </div>
              <Link
                to="/studio"
                className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Explore Design Studio
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sampleStudios.map((title) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                  {title}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {projects.length ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Selected work</p>
              <h3 className="text-xl font-semibold text-slate-900">Notable projects</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              {projects.map((project) => (
                <li key={project} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                  {project}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {gallery.length ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Gallery</p>
                <h3 className="text-xl font-semibold text-slate-900">Recent visuals</h3>
              </div>
              <a
                href={portfolioLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                <FiExternalLink size={16} /> Share public link
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {gallery.slice(0, 4).map((image) => (
                <div key={image} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <img src={image} alt="Firm gallery" className="h-60 w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <Footer />
    </div>
  );
};

export default FirmPortfolio;
