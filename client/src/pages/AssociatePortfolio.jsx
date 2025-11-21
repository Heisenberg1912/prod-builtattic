import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import PortfolioMediaPlayer from "../components/associate/PortfolioMediaPlayer.jsx";
import { fetchMarketplaceAssociateProfile } from "../services/marketplace.js";
import { fetchAssociateDashboard } from "../services/dashboard.js";
import { fetchAssociatePortalProfile } from "../services/portal.js";

const formatCurrency = (value, currency) => {
  if (!Number.isFinite(Number(value))) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "USD"} ${value}`;
  }
};

const dayLabelMap = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const formatAvailabilityWindow = (availabilityWindow) => {
  if (!availabilityWindow) return null;
  const rawDay = typeof availabilityWindow.day === "string" ? availabilityWindow.day.toLowerCase() : "";
  const label = dayLabelMap[rawDay] || availabilityWindow.day;
  if (!label) return null;
  if (!availabilityWindow.from || !availabilityWindow.to) return label;
  return `${label}: ${availabilityWindow.from} - ${availabilityWindow.to}`;
};

const formatSlotWindow = (slot) => {
  if (!slot?.date || !slot?.start || !slot?.end) return null;
  const type = slot.type ? slot.type.replace(/_/g, " ") : null;
  const typeLabel = type ? ` (${type})` : "";
  return `${slot.date}: ${slot.start} - ${slot.end}${typeLabel}`;
};

const formatAddonPrice = (addon, fallbackCurrency) => {
  if (!Number.isFinite(Number(addon?.price))) return null;
  return (
    formatCurrency(addon.price, addon.currency || fallbackCurrency) ||
    `${addon.currency || fallbackCurrency || "USD"} ${addon.price}`
  );
};

const formatLinkLabel = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname?.replace(/^www\./, "") || parsed.href;
  } catch {
    return url.replace(/^https?:\/\//i, "");
  }
};


const AssociatePortfolio = () => {
  const routerLocation = useLocation();
  const { id } = useParams();
  const state = routerLocation.state;
  const initialAssociate = useMemo(() => state?.associate ?? state?.profile ?? state ?? null, [state]);
  const initialDashboard = useMemo(() => state?.dashboard ?? null, [state]);
  const [associate, setAssociate] = useState(initialAssociate);
  const [dashboardData, setDashboardData] = useState(initialDashboard);
  const [status, setStatus] = useState(() => ({
    loading: !initialAssociate,
    error: null,
  }));

  useEffect(() => {
    if (initialAssociate) {
      setAssociate(initialAssociate);
      setStatus((prev) => (prev.loading ? { loading: false, error: prev.error } : prev));
    }
  }, [initialAssociate]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return undefined;
    setStatus((prev) => ({ ...prev, loading: true, error: null }));
    (async () => {
      try {
        const item = await fetchMarketplaceAssociateProfile(id);
        if (cancelled) return;
        if (item) {
          setAssociate(item);
          setStatus({ loading: false, error: null });
        } else if (!initialAssociate) {
          setAssociate(null);
          setStatus({ loading: false, error: "not_found" });
        } else {
          setStatus({ loading: false, error: null });
        }
      } catch (error) {
        if (cancelled) return;
        const statusCode = error?.response?.status;
        setStatus({
          loading: false,
          error: statusCode === 404 ? "not_found" : error?.message || "Unable to load profile",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, initialAssociate]);

  useEffect(() => {
    let cancelled = false;
    if (id || associate) return undefined;
    setStatus((prev) => ({ ...prev, loading: true, error: null }));
    (async () => {
      try {
        const response = await fetchAssociatePortalProfile({ preferDraft: true });
        if (cancelled) return;
        if (response?.profile) {
          setAssociate(response.profile);
          setStatus({ loading: false, error: null });
        } else {
          setStatus({ loading: false, error: response?.error?.message || response?.error || null });
        }
      } catch (error) {
        if (cancelled) return;
        setStatus({
          loading: false,
          error: error?.message || "Unable to load profile",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, associate]);

  useEffect(() => {
    let cancelled = false;
    if (dashboardData || id) return undefined;
    (async () => {
      try {
        const payload = await fetchAssociateDashboard();
        if (cancelled) return;
        setDashboardData(payload);
        if (!associate && payload?.profile) {
          setAssociate(payload.profile);
          setStatus({ loading: false, error: null });
        } else if (!associate) {
          setStatus((prev) => (prev.loading ? { loading: false, error: prev.error } : prev));
        }
      } catch (error) {
        if (cancelled) return;
        if (!associate) {
          setStatus((prev) => (prev.loading ? { loading: false, error: error?.message || prev.error } : prev));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dashboardData, id, associate]);

  const { loading, error } = status;

  const view = useMemo(() => {
    if (!associate) return null;

    const currency = associate.rates?.currency || associate.currency || "USD";
    const dayRate = associate.rates?.daily;
    const hourlyRate = associate.rates?.hourly;
    const primaryRate = dayRate ?? hourlyRate ?? null;
    const priceLabel =
      associate.priceLabel ||
      (primaryRate != null ? formatCurrency(primaryRate, currency) : null);

    const stats = [
      associate.experienceYears
        ? { label: "Experience", value: `${associate.experienceYears}+ yrs` }
        : null,
      Number.isFinite(associate.completedProjects)
        ? { label: "Projects", value: `${associate.completedProjects}` }
        : null,
      associate.rating
        ? { label: "Rating", value: `${Number(associate.rating).toFixed(1)} / 5` }
        : null,
      primaryRate != null
        ? { label: "Primary rate", value: priceLabel }
        : null,
      associate.availability
        ? { label: "Availability", value: associate.availability }
        : null,
      associate.timezone
        ? { label: "Timezone", value: associate.timezone }
        : null,
    ].filter(Boolean);

    const bookingSummary = associate.booking
      ? {
        leadTimeHours: associate.booking.leadTimeHours || null,
        rescheduleWindowHours: associate.booking.rescheduleWindowHours || null,
        cancelWindowHours: associate.booking.cancelWindowHours || null,
        bufferMinutes: associate.booking.bufferMinutes || null,
        timezones: associate.booking.timezones || [],
        slots: (associate.booking.slots || []).slice(0, 3),
        etaStages: associate.booking.etaStages || [],
        communications: associate.booking.communications || null,
      }
      : null;

    return {
      title: associate.title || "Associate",
      cover:
        associate.heroImage ||
        associate.coverImage ||
        associate.cover ||
        associate.banner ||
        associate.avatar,
      profile: associate.profileImage || associate.profile || associate.avatar,
      type: associate.type || associate.specialisations?.[0] || "Consultant",
      location: associate.location || "",
      price: priceLabel,
      currency,
      bio:
        associate.bio ||
        associate.summary ||
        "This associate delivers specialised support for Builtattic projects across the network.",
      portfolioMedia:
        Array.isArray(associate.portfolioMedia) && associate.portfolioMedia.length
          ? associate.portfolioMedia.filter((item) => item?.mediaUrl)
          : (associate.portfolioImages || associate.gallery || []).map((url) => ({ mediaUrl: url })),
      workHistory:
        associate.workHistory && associate.workHistory.length
          ? associate.workHistory
          : (associate.keyProjects || []).map((project) => ({
            role: project.role || associate.title,
            company: project.title,
            duration: project.year ? String(project.year) : "",
            description: project.scope,
          })),
      stats,
      serviceBadges: associate.serviceBadges || [],
      deliverables: associate.deliverables || [],
      specialisations: associate.specialisations || [],
      expertise: associate.expertise || associate.skills || [],
      softwares: associate.softwares || [],
      languages: associate.languages || [],
      certifications: associate.certifications || [],
      booking: bookingSummary,
      availability: associate.availability || null,
      availabilityWindows: associate.availabilityWindows || [],
      timezone: associate.timezone || null,
      addons: associate.addons || [],
      warranty: associate.warranty || null,
      prepChecklist: associate.prepChecklist || [],
      contactEmail: associate.user?.email || associate.contactEmail || null,
      keyProjects: Array.isArray(associate.keyProjects) ? associate.keyProjects : [],
      portfolioLinks: Array.isArray(associate.portfolioLinks) ? associate.portfolioLinks : [],
      serviceBundle: associate.serviceBundle || null,
      workingDrawings: associate.workingDrawings || null,
      servicePack: associate.servicePack || null,
      schedulingMeeting: associate.schedulingMeeting || null,
    };
  }, [associate]);

  if (!view) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div
            className={`w-full max-w-xl rounded-2xl border p-8 text-center text-sm font-medium shadow-sm ${loading
                ? "border-slate-200 bg-white text-slate-600"
                : error === "not_found"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
          >
            {loading
              ? "Loading associate profile..."
              : error === "not_found"
                ? "We couldn’t find this associate profile."
                : error || "Associate profile is unavailable right now."}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const {
    title,
    cover,
    profile,
    type,
    location,
    price,
    currency,
    bio,
    portfolioMedia,
    workHistory,
    stats,
    serviceBadges,
    deliverables,
    specialisations,
    expertise,
    softwares,
    languages,
    certifications,
    booking,
    availability,
    availabilityWindows,
    timezone,
    addons,
    warranty,
    prepChecklist,
    contactEmail,
    keyProjects,
    portfolioLinks,
    serviceBundle,
    workingDrawings,
    servicePack,
    schedulingMeeting,
  } = view;

  const renderChipGroup = (label, items) => {
    if (!items?.length) return null;
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-stone-600">{label}</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${label}-${item}-${index}`}
              className="rounded-full bg-stone-100 text-stone-700 px-3 py-1 text-xs font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const hasCapabilities = [
    specialisations,
    expertise,
    softwares,
    languages,
    certifications,
  ].some((group) => group && group.length);

  const bookingHighlights = [
    booking?.leadTimeHours ? `${booking.leadTimeHours} hr lead time` : null,
    booking?.rescheduleWindowHours
      ? `${booking.rescheduleWindowHours} hr reschedule window`
      : null,
    booking?.cancelWindowHours
      ? `${booking.cancelWindowHours} hr cancel window`
      : null,
    booking?.bufferMinutes ? `${booking.bufferMinutes} min buffer` : null,
  ].filter(Boolean);
  const projectSpotlights = Array.isArray(keyProjects) ? keyProjects.slice(0, 3) : [];
  const resourceLinks = Array.isArray(portfolioLinks) ? portfolioLinks.filter(Boolean) : [];
  const dashboardPlans = Array.isArray(dashboardData?.planUploads) ? dashboardData.planUploads.slice(0, 3) : [];
  const dashboardPacks = Array.isArray(dashboardData?.servicePacks) ? dashboardData.servicePacks.slice(0, 3) : [];
  const dashboardMeetings = Array.isArray(dashboardData?.meetings) ? dashboardData.meetings.slice(0, 3) : [];
  const dashboardDownloads = Array.isArray(dashboardData?.downloads) ? dashboardData.downloads.slice(0, 3) : [];
  const dashboardChats = Array.isArray(dashboardData?.chats) ? dashboardData.chats.slice(0, 3) : [];
  const hasWorkspaceExtras =
    dashboardPlans.length ||
    dashboardPacks.length ||
    dashboardMeetings.length ||
    dashboardDownloads.length ||
    dashboardChats.length;

  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-white min-h-screen flex flex-col text-slate-900">
      <div className="relative isolate">
        <div className="absolute inset-0">
          <img src={cover} alt={title} className="h-[360px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/80 to-white" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-slate-900 space-y-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
            <img
              src={profile}
              alt={`${title} avatar`}
              className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-2xl md:h-36 md:w-36 bg-white"
            />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Skill Studio associate</p>
                <h1 className="text-3xl font-semibold md:text-5xl text-slate-900">{title}</h1>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {[type, location, price].filter(Boolean).map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide uppercase text-slate-600"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <p className="max-w-3xl text-base text-slate-700 leading-relaxed">{bio}</p>
              {serviceBadges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {serviceBadges.map((badge, index) => (
                    <span
                      key={`${badge}-${index}`}
                      className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-800"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {contactEmail && (
              <div className="flex flex-col gap-2">
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
                >
                  Email {title.split(" ")[0] || "associate"}
                </a>
                <p className="text-xs text-slate-500">Expect a reply within 24 hours.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="relative z-10 -mt-12 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <section className="space-y-6">
              <article className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-4">
                <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {type ? <span>{type}</span> : null}
                  {location ? <span>{location}</span> : null}
                  {price ? <span>{price}</span> : null}
                </div>
                <p className="text-base leading-relaxed text-slate-700">{bio}</p>
                <div className="flex flex-wrap gap-6 text-sm text-slate-500">
                  {availability ? (
                    <div>
                      <p className="font-semibold text-slate-900">Availability</p>
                      <p>{availability}</p>
                    </div>
                  ) : null}
                  {timezone ? (
                    <div>
                      <p className="font-semibold text-slate-900">Timezone</p>
                      <p>{timezone}</p>
                    </div>
                  ) : null}
                  {currency ? (
                    <div>
                      <p className="font-semibold text-slate-900">Currency</p>
                      <p>{currency}</p>
                    </div>
                  ) : null}
                </div>
              </article>

              {stats.length > 0 && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Snapshot</p>
                      <h2 className="text-lg font-semibold text-slate-900">Signals buyers review first</h2>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {hasCapabilities && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Capabilities & Toolset</h2>
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                      Skill Studio
                    </span>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {renderChipGroup("Specialisations", specialisations)}
                    {renderChipGroup("Expertise & Focus", expertise)}
                    {renderChipGroup("Design Software", softwares)}
                    {renderChipGroup("Languages", languages)}
                    {renderChipGroup("Certifications", certifications)}
                  </div>
                </section>
              )}

              <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Portfolio</h2>
                  {portfolioMedia.length > 0 ? (
                    <span className="text-xs font-semibold text-slate-500">{portfolioMedia.length} media</span>
                  ) : null}
                </div>
                <PortfolioMediaPlayer
                  items={portfolioMedia}
                  title={null}
                  subtitle={null}
                  className="p-0 border-none shadow-none bg-transparent"
                  variant="bare"
                />
              </section>

              {deliverables.length > 0 && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Deliverables</h2>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {deliverables.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {projectSpotlights.length > 0 && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Project spotlights</h2>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Case studies
                    </span>
                  </div>
                  <div className="space-y-4">
                    {projectSpotlights.map((project, index) => (
                      <article
                        key={`${project.title || "project"}-${project.year || index}`}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-semibold text-slate-900">{project.title || "Project"}</p>
                          {project.year ? (
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {project.year}
                            </span>
                          ) : null}
                        </div>
                        {project.scope ? <p className="text-sm text-slate-600">{project.scope}</p> : null}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          {project.role ? <span>Role: {project.role}</span> : null}
                          {project.category ? <span>{project.category}</span> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Work History</h2>
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">Experience</span>
                </div>
                {workHistory && workHistory.length > 0 ? (
                  <ul className="space-y-4">
                    {workHistory.map((item, idx) => (
                      <li key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm space-y-1">
                        <div className="text-base font-semibold text-slate-900">{item.role}</div>
                        <div className="text-sm text-slate-600">{item.company}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">{item.duration}</div>
                        {item.description ? <p className="text-sm text-slate-600">{item.description}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No work history available.</p>
                )}
              </section>

              {resourceLinks.length > 0 && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Reference links</h2>
                  <ul className="space-y-3">
                    {resourceLinks.map((link, index) => (
                      <li key={`${link}-${index}`}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:border-slate-200"
                        >
                          <span>{formatLinkLabel(link)}</span>
                          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                            Visit
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </section>

              {(serviceBundle || workingDrawings || servicePack || schedulingMeeting) && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Service Offerings</h2>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Packages & Resources
                    </span>
                  </div>
                  <div className="space-y-4">
                    {serviceBundle && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                          Service Bundle
                        </p>
                        <p className="text-sm text-slate-700">{serviceBundle}</p>
                      </div>
                    )}
                    {workingDrawings && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                          Working Drawings
                        </p>
                        <a
                          href={workingDrawings}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-900 underline hover:text-slate-700"
                        >
                          View Sample Working Drawings
                        </a>
                      </div>
                    )}
                    {servicePack && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                          Service Pack
                        </p>
                        <a
                          href={servicePack}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-900 underline hover:text-slate-700"
                        >
                          View Service Packages & Pricing
                        </a>
                      </div>
                    )}
                    {schedulingMeeting && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 mb-2">
                          Schedule a Meeting
                        </p>
                        <a
                          href={schedulingMeeting}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
                        >
                          Book a Discovery Call
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              )}

            <aside className="space-y-6">
              {(contactEmail || availability || timezone) && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-4">
                  <h3 className="text-base font-semibold text-slate-900">Buyer playbook</h3>
                  <div className="space-y-3 text-sm text-slate-600">
                    {contactEmail ? (
                      <p>
                        Contact:{" "}
                        <a href={`mailto:${contactEmail}`} className="font-semibold text-slate-900 underline">
                          {contactEmail}
                        </a>
                      </p>
                    ) : null}
                    {timezone ? (
                      <p>
                        Primary timezone: <span className="font-semibold text-slate-900">{timezone}</span>
                      </p>
                    ) : null}
                    {availability ? (
                      <p>
                        Availability: <span className="font-semibold text-slate-900">{availability}</span>
                      </p>
                    ) : null}
                  </div>
                </section>
              )}

              {(booking || availabilityWindows.length > 0) && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">Booking Playbook</h3>
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Operations</span>
                  </div>
                  {bookingHighlights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bookingHighlights.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 text-xs font-semibold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  {booking?.timezones?.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                        Supported timezones
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {booking.timezones.map((zone) => (
                          <span
                            key={zone}
                            className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-medium"
                          >
                            {zone}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {availabilityWindows.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                        Weekly windows
                      </p>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {availabilityWindows.map((availabilityWindow, index) => {
                          const label = formatAvailabilityWindow(availabilityWindow);
                          if (!label) return null;
                          return (
                            <li
                              key={`${availabilityWindow.day}-${index}`}
                              className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                            >
                              {label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {booking?.slots?.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                        Upcoming slots
                      </p>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {booking.slots.map((slot, index) => {
                          const label = formatSlotWindow(slot);
                          if (!label) return null;
                          return (
                            <li
                              key={`${slot.date}-${slot.start}-${index}`}
                              className="rounded-2xl border border-slate-100 px-3 py-2"
                            >
                              {label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                  {booking?.etaStages?.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                        Engagement stages
                      </p>
                      <ol className="space-y-2 text-sm text-slate-700">
                        {booking.etaStages.map((stage, index) => (
                          <li key={`${stage.label || stage.stage}-${index}`} className="flex gap-3">
                            <span className="text-xs font-semibold text-slate-400">{index + 1}.</span>
                            <span>
                              {stage.label || stage.stage}
                              {stage.minutes ? ` · ${stage.minutes} min` : null}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  {booking?.communications && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">
                        Communication modes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(booking.communications)
                          .filter(([, enabled]) => enabled)
                          .map(([mode]) => (
                            <span
                              key={mode}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {mode}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {hasWorkspaceExtras && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">Workspace highlights</h3>
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard</span>
                  </div>
                  {dashboardPlans.length ? (
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Plan uploads</p>
                      <ul className="space-y-2">
                        {dashboardPlans.map((plan) => (
                          <li key={plan.id || plan.projectTitle} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="font-semibold text-slate-900">{plan.projectTitle || "Concept"}</p>
                            <p className="text-[11px] text-slate-500">
                              {plan.category || "Concept"}{plan.primaryStyle ? ` · ${plan.primaryStyle}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {dashboardPacks.length ? (
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Service packs</p>
                      <ul className="space-y-2">
                        {dashboardPacks.map((pack) => (
                          <li key={pack.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="font-semibold text-slate-900">{pack.title || "Service pack"}</p>
                            <p className="text-[11px] text-slate-500">{(pack.status || "draft").toUpperCase()}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {dashboardMeetings.length ? (
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Meetings</p>
                      <ul className="space-y-2">
                        {dashboardMeetings.map((meeting) => (
                          <li key={meeting.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="font-semibold text-slate-900">{meeting.title || "Buyer sync"}</p>
                            <p className="text-[11px] text-slate-500">
                              {meeting.scheduledFor
                                ? new Date(meeting.scheduledFor).toLocaleString()
                                : meeting.status || "Draft"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {dashboardDownloads.length ? (
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Downloads</p>
                      <ul className="space-y-2">
                        {dashboardDownloads.map((entry) => (
                          <li key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="font-semibold text-slate-900">{entry.label || "Deliverable"}</p>
                            <p className="text-[11px] text-slate-500">{entry.tag || entry.accessLevel || "WD-W3"}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {dashboardChats.length ? (
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Client chat</p>
                      <ul className="space-y-2">
                        {dashboardChats.map((thread) => (
                          <li key={thread.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="font-semibold text-slate-900">{thread.subject || "Workspace thread"}</p>
                            <p className="text-[11px] text-slate-500">{thread.status || "open"}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>
              )}

              {(addons.length > 0 || prepChecklist.length > 0) && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-6">
                  {addons.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 mb-3">
                        Optional add-ons
                      </h3>
                      <ul className="space-y-3 text-sm text-slate-700">
                        {addons.map((addon) => (
                          <li key={addon.id} className="rounded-2xl border border-slate-100 p-3">
                            <p className="font-semibold text-slate-900">{addon.name}</p>
                            {Number.isFinite(Number(addon.price)) && (
                              <p className="text-xs text-slate-500">{formatAddonPrice(addon, currency)}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {prepChecklist.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 mb-3">
                        Prep checklist
                      </h3>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {prepChecklist.map((item, index) => (
                          <li key={`${item}-${index}`} className="flex gap-2">
                            <span className="text-emerald-500">–</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {warranty && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100 space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Warranty & Support</h3>
                  {warranty.durationDays ? (
                    <p className="text-sm text-slate-700">
                      Coverage duration: <span className="font-semibold text-slate-900">{warranty.durationDays} days</span>
                    </p>
                  ) : null}
                  {warranty.coverage ? <p className="text-sm text-slate-700">{warranty.coverage}</p> : null}
                  {warranty.contact ? (
                    <a
                      href={`mailto:${warranty.contact}`}
                      className="inline-flex text-sm font-semibold text-slate-900 underline decoration-dotted"
                    >
                      Warranty contact: {warranty.contact}
                    </a>
                  ) : null}
                </section>
              )}
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AssociatePortfolio;
