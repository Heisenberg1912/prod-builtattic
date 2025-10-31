import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import RegistrStrip from "../components/registrstrip";
import { marketplaceFeatures, fallbackStudios } from "../data/marketplace.js";
import { fetchMarketplaceFirms } from "../services/marketplace.js";
import {
  applyFallback,
  getFirmAvatarFallback,
  getFirmAvatarImage,
  getFirmCoverFallback,
  getFirmCoverImage,
} from "../utils/imageFallbacks.js";

const Firms = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStyle, setSelectedStyle] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [firms, setFirms] = useState([]);
  const [web3Meta, setWeb3Meta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fallbackStudioInsights = useMemo(() => {
    const map = new Map();
    fallbackStudios.forEach((studio) => {
      const keys = [
        studio.firm?._id,
        studio.firm?.slug,
        studio.firmSlug,
        studio.firm?.name,
      ]
        .filter(Boolean)
        .map((key) => String(key).toLowerCase());
      const price = studio.priceSqft ?? studio.pricing?.basePrice ?? null;
      const currency = studio.currency || studio.pricing?.currency || null;
      keys.forEach((key) => {
        if (!map.has(key)) {
          map.set(key, {
            count: 0,
            titles: new Map(),
            prices: [],
            currency: currency || null,
          });
        }
        const bucket = map.get(key);
        bucket.count += 1;
        if (studio.title) bucket.titles.set(studio.title, true);
        if (price != null && Number.isFinite(Number(price))) {
          bucket.prices.push(Number(price));
        }
        if (currency && !bucket.currency) bucket.currency = currency;
      });
    });
    map.forEach((bucket) => {
      bucket.samples = Array.from(bucket.titles.keys()).slice(0, 3);
      delete bucket.titles;
    });
    return map;
  }, []);

  const getFallbackInsight = useCallback(
    (firm) => {
      const candidates = [firm._id, firm.slug, firm.firmSlug, firm.name]
        .filter(Boolean)
        .map((key) => String(key).toLowerCase());
      for (const key of candidates) {
        if (fallbackStudioInsights.has(key)) {
          return fallbackStudioInsights.get(key);
        }
      }
      return null;
    },
    [fallbackStudioInsights]
  );

  const resolveFirmStudioCount = useCallback(
    (firm) => {
      if (Array.isArray(firm.featuredStudios)) return firm.featuredStudios.length;
      const numericCatalogue = firm.cataloguesCount != null ? Number(firm.cataloguesCount) : null;
      if (Number.isFinite(numericCatalogue)) return numericCatalogue;
      const insight = getFallbackInsight(firm);
      return insight?.count || 0;
    },
    [getFallbackInsight]
  );

  const resolveFirmSampleStudios = useCallback(
    (firm) => getFallbackInsight(firm)?.samples || [],
    [getFallbackInsight]
  );

  const resolveFirmStartingPrice = useCallback(
    (firm) => {
      if (firm.priceSqft != null && Number.isFinite(Number(firm.priceSqft))) {
        const currency = firm.currency || firm.pricing?.currency || "USD";
        return { price: Number(firm.priceSqft), currency };
      }
      const insight = getFallbackInsight(firm);
      if (!insight || !insight.prices.length) return null;
      const price = Math.min(...insight.prices);
      const currency = insight.currency || firm.currency || firm.pricing?.currency || "USD";
      return { price, currency };
    },
    [getFallbackInsight]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadFirms() {
      setLoading(true);
      setError(null);
      setWeb3Meta(null);
      try {
        const { items, meta } = await fetchMarketplaceFirms();
        if (!cancelled) {
          setFirms(items);
          setWeb3Meta(meta?.web3 || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load firms right now.");
          setWeb3Meta(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadFirms();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(firms.map((firm) => firm.category).filter(Boolean));
    return ["All", ...unique];
  }, [firms]);

  const styles = useMemo(() => {
    const unique = new Set(
      firms.flatMap((firm) => firm.styles || []).filter(Boolean)
    );
    return ["All", ...unique];
  }, [firms]);

  const filteredFirms = useMemo(() => {
    return firms.filter((firm) => {
      const matchesCategory =
        selectedCategory === "All" || firm.category === selectedCategory;
      const matchesStyle =
        selectedStyle === "All" || (firm.styles || []).includes(selectedStyle);
      const matchesSearch =
        !searchQuery ||
        firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        firm.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        firm.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesStyle && matchesSearch;
    });
  }, [firms, selectedCategory, selectedStyle, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <RegistrStrip />
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <section className="flex flex-col lg:flex-row lg:items-center gap-4">
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <select
              value={selectedStyle}
              onChange={(event) => setSelectedStyle(event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {styles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search firms, services, or cities..."
              className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </section>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Loading firms...
          </div>
        )}

        {!loading && web3Meta && (
          <div className="rounded-2xl border border-sky-200 bg-sky-900/90 px-6 py-5 text-sky-100 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300">
              Marketplace provenance
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <h2 className="text-xl font-semibold">
                {web3Meta.total ?? 0} firm portfolios verified on {web3Meta.chain ?? "Polygon"}
              </h2>
              {Array.isArray(web3Meta.anchors) && web3Meta.anchors.length > 0 ? (
                <p className="text-xs text-sky-200">
                  Latest anchors: {web3Meta.anchors.slice(0, 3).join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            filteredFirms.map((firm) => {
              const studioCount = resolveFirmStudioCount(firm);
              const coverImage = getFirmCoverImage(firm);
              const coverFallback = getFirmCoverFallback(firm);
              const avatarImage = getFirmAvatarImage(firm);
              const avatarFallback = getFirmAvatarFallback(firm);
              const leadTimes = (firm.services || [])
                .map((service) => (service?.leadTimeWeeks != null ? Number(service.leadTimeWeeks) : null))
                .filter((value) => Number.isFinite(value));
              const avgLeadTimeWeeks = firm.avgLeadTimeWeeks != null
                ? Number(firm.avgLeadTimeWeeks)
                : (leadTimes.length ? Math.round(leadTimes.reduce((sum, value) => sum + value, 0) / leadTimes.length) : null);
              const numericTeam = firm.team != null ? Number(firm.team) : null;
              const numericProjects = firm.projectsDelivered != null ? Number(firm.projectsDelivered) : null;
              const numericTeamSize = firm.teamSize != null ? Number(firm.teamSize) : null;
              const derivedHeadcount = Number.isFinite(numericTeam)
                ? numericTeam
                : (Number.isFinite(numericTeamSize)
                    ? numericTeamSize
                    : (leadTimes.length ? Math.max(leadTimes.length * 6, 8) : (studioCount ? Math.max(studioCount * 4, 6) : null)));
              const deliveredProjects = Number.isFinite(numericProjects)
                ? numericProjects
                : (firm.gallery?.length ? firm.gallery.length * 6 : null);
              const ratingValue = typeof firm.rating === "number" ? firm.rating : null;
              const sampleStudios = resolveFirmSampleStudios(firm);
              const startingPrice = resolveFirmStartingPrice(firm);

              return (
                <motion.article
                  key={firm._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <img
                    src={coverImage}
                    alt={firm.name}
                    className="h-48 w-full object-cover"
                    loading="lazy"
                    onError={(event) => applyFallback(event, coverFallback)}
                  />
                  <div className="p-5 space-y-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarImage}
                        alt={`${firm.name} thumbnail`}
                        className="w-12 h-12 rounded-full border border-slate-200 object-cover"
                        loading="lazy"
                        onError={(event) => applyFallback(event, avatarFallback)}
                      />
                      <div>
                        <p className="uppercase tracking-[0.35em] text-xs text-slate-400">
                          {firm.category}
                        </p>
                        <h2 className="text-xl font-semibold text-slate-900">
                          {firm.name}
                        </h2>
                        <p className="text-sm text-slate-500">{firm.tagline}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                          Locations
                        </p>
                        <p>{firm.locations?.length ? firm.locations.join(" / ") : "-"}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                          Styles
                        </p>
                        <p>{firm.styles?.length ? firm.styles.join(", ") : "-"}</p>
                      </div>
                      {startingPrice && (
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                            Starting fee
                          </p>
                          <p>
                            {startingPrice.currency} {startingPrice.price.toFixed(2)} / sq.ft
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                          Studios available
                        </p>
                        <p>{studioCount} catalogues</p>
                      </div>
                    </div>

                    {sampleStudios.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {sampleStudios.map((title) => (
                          <span key={title} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">
                            {title}
                          </span>
                        ))}
                      </div>
                    )}

                    {firm.services?.length ? (
                      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                          Portfolio
                        </p>
                        <ul className="space-y-2">
                          {firm.services.slice(0, 3).map((service) => (
                            <li key={service.title}>
                              <p className="font-medium text-slate-800">
                                {service.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                {service.description}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3 items-center text-sm text-slate-600">
                      {derivedHeadcount != null && (
                        <span>Team {Math.round(derivedHeadcount)}+</span>
                      )}
                      {deliveredProjects != null && (
                        <span>{Math.round(deliveredProjects)}+ projects</span>
                      )}
                      {Number.isFinite(avgLeadTimeWeeks) && (
                        <span>Lead time ~{Math.round(avgLeadTimeWeeks)} weeks</span>
                      )}
                      {ratingValue != null && (
                        <span>Rating {ratingValue.toFixed(1)}/5</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`mailto:${firm.contact?.email || "hello@builtattic.com"}`}
                        className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                      >
                        Request proposal
                      </a>
                      {firm.contact?.website && (
                        <a
                          href={firm.contact.website}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition"
                        >
                          Visit website
                        </a>
                      )}
                      <Link
                        to="/firmportfolio"
                        state={{ firm }}
                        className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition"
                      >
                        View portfolio
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
        </section>

        {!loading && filteredFirms.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No firms match these filters. Try a different style or search term.
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

      <Footer />
    </div>
  );
};

export default Firms;

























