import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import { fetchMarketplaceAssociates } from "../services/marketplace.js";
import { getAssociateAvatar, getAssociateFallback } from "../utils/imageFallbacks.js";

const formatRate = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Set rate";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

const formatDateLabel = (value) => {
  if (!value) return "";
  try {
    return `Updated ${new Date(value).toLocaleDateString()}`;
  } catch {
    return "";
  }
};

const Pill = ({ children, tone = "slate" }) => {
  const palette = {
    slate: "bg-slate-100 text-slate-700",
    primary: "bg-slate-900 text-white",
    outline: "border border-slate-200 text-slate-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${palette[tone] || palette.slate}`}>
      {children}
    </span>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
    <p className="text-sm font-semibold text-slate-900">{value}</p>
    <p className="uppercase tracking-[0.2em]">{label}</p>
  </div>
);

const Tile = ({ associate }) => {
  const navigate = useNavigate();
  const avatar = associate.heroImage || associate.profileImage || getAssociateAvatar(associate) || getAssociateFallback();
  const languages = Array.isArray(associate.languages) ? associate.languages : [];
  const tools = Array.isArray(associate.toolset) ? associate.toolset : [];
   const planTiles = Array.isArray(associate.planUploads) ? associate.planUploads : [];
  const specialisations = Array.isArray(associate.specialisations) ? associate.specialisations : [];
  const badges = (associate.serviceBadges || []).slice(0, 3);
  const hourly = associate.rates?.hourly ?? associate.hourlyRate ?? null;
  const currency = associate.rates?.currency || "USD";
  const experience = associate.experienceYears;
  const rateLabel = `${formatRate(hourly, currency)} / hr`;
  const profileHref = `/associateportfolio/${associate._id || associate.id || associate.user?._id || ""}`;
  const updatedLabel = formatDateLabel(associate.updatedAt);

  const heroBadges = useMemo(() => {
    const tags = [...specialisations.slice(0, 2), ...languages.slice(0, 2)].filter(Boolean);
    if (tags.length === 0) return ["Skill Studio"];
    return tags;
  }, [specialisations, languages]);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-52 w-full bg-slate-100">
        <img src={avatar} alt={associate.name || associate.title || "Associate"} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {heroBadges.slice(0, 3).map((tag) => (
            <Pill key={tag} tone="primary">
              {tag}
            </Pill>
          ))}
        </div>
        {associate.rating ? (
          <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-amber-600 shadow">
            ★ {Number(associate.rating).toFixed(1)}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Skill Studio</p>
          <h3 className="text-xl font-semibold text-slate-900">{associate.name || associate.title || "Associate"}</h3>
          <p className="text-sm text-slate-600">
            {associate.firmName || "Independent"}
            {associate.location ? ` / ${associate.location}` : ""}
          </p>
          {associate.summary ? <p className="text-sm text-slate-600 line-clamp-3">{associate.summary}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Rate" value={rateLabel} />
          <Stat label="Experience" value={experience ? `${experience} yrs` : "Add years"} />
          <Stat label="Languages" value={languages.slice(0, 2).join(", ") || "Set languages"} />
          <Stat label="Availability" value={associate.availability || "Sync availability"} />
          <Stat label="Plan tiles" value={planTiles.length ? `${planTiles.length} live` : "Add tiles"} />
          <Stat label="Services" value={associate.services?.length ? `${associate.services.length} live` : "Add packs"} />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {badges.map((badge) => (
            <Pill key={badge}>{badge}</Pill>
          ))}
          {tools.slice(0, 3).map((tool) => (
            <Pill key={tool}>{tool}</Pill>
          ))}
          {planTiles.slice(0, 1).map((plan) => (
            <Pill key={plan.id || plan.projectTitle || "plan"}>{plan.projectTitle}</Pill>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">{updatedLabel}</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(profileHref, { state: { focus: "consult" } })}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 hover:border-slate-300"
            >
              Book discovery call
            </button>
            <Link
              to={profileHref}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View profile
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default function Associates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { items: data } = await fetchMarketplaceAssociates();
        if (!cancelled) {
          setItems(data || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load associates");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <RegistrStrip />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Skill Studio Marketplace</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Hire vetted associates</h1>
          <p className="text-slate-600 text-base">
            Each tile is published straight from the Studio workspace. Tap a card to view the live profile, portfolio, service packs, and
            book a consultation call.
          </p>
        </header>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {loading && <p className="text-sm text-slate-600">Loading associates...</p>}

        {!loading && !error && (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Tile key={item._id || item.id} associate={item} />
            ))}
            {items.length === 0 && <p className="text-sm text-slate-600">No associates published yet.</p>}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
