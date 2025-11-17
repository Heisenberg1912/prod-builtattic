import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import { fetchMarketplaceAssociateProfile } from "../services/marketplace.js";

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

const detectMediaType = (url = "") => {
  const source = (url || "").toLowerCase();
  if (source.includes("youtube.com") || source.includes("vimeo.com")) return "embed";
  if (source.match(/\.(mp4|mov|webm)$/)) return "video";
  if (source.match(/\.(pdf|ppt|pptx|doc|docx)$/)) return "document";
  if (source.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return "image";
  return "document";
};

const PortfolioCarousel = ({ items }) => {
  const mediaItems = Array.isArray(items) ? items.filter((item) => item?.mediaUrl) : [];
  const [index, setIndex] = useState(0);
  if (!mediaItems.length) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex items-center justify-center bg-gray-50">
        <span className="text-gray-400">Portfolio coming soon.</span>
      </div>
    );
  }
  const current = mediaItems[index];
  const mediaType = detectMediaType(current.mediaUrl);
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-black">
        {mediaType === "embed" ? (
          <iframe
            src={current.mediaUrl}
            title={current.title || `Portfolio media ${index + 1}`}
            className="w-full h-64 md:h-72"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : mediaType === "video" ? (
          <video controls className="w-full h-64 md:h-72 object-cover">
            <source src={current.mediaUrl} />
          </video>
        ) : mediaType === "image" ? (
          <img
            src={current.mediaUrl}
            alt={current.title || `Portfolio media ${index + 1}`}
            className="w-full h-64 md:h-72 object-cover"
          />
        ) : (
          <div className="w-full h-64 md:h-72 flex flex-col items-center justify-center bg-white text-slate-700">
            <p className="text-sm font-semibold">Document preview unavailable</p>
            <a
              href={current.mediaUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
            >
              Open document
            </a>
          </div>
        )}
        {mediaItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-gray-700 shadow hover:bg-white"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-gray-700 shadow hover:bg-white"
            >
              Next
            </button>
          </>
        )}
      </div>
      <div>
        {current.title ? <p className="text-base font-semibold text-gray-900">{current.title}</p> : null}
        {current.description ? <p className="text-sm text-gray-600">{current.description}</p> : null}
      </div>
      {mediaItems.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {mediaItems.map((_, dotIndex) => (
            <button
              key={`media-dot-${dotIndex}`}
              type="button"
              onClick={() => setIndex(dotIndex)}
              className={`h-2 w-2 rounded-full transition ${dotIndex === index ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AssociatePortfolio = () => {
  const routerLocation = useLocation();
  const { id } = useParams();
  const state = routerLocation.state;
  const initialAssociate = useMemo(() => state?.associate ?? state ?? null, [state]);
  const [associate, setAssociate] = useState(initialAssociate);
  const [status, setStatus] = useState(() => ({
    loading: Boolean(id && !initialAssociate),
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
    };
  }, [associate]);

  if (!view) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div
            className={`w-full max-w-xl rounded-2xl border p-8 text-center text-sm font-medium shadow-sm ${
              loading
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

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      <div className="relative w-full h-80 md:h-[420px]">
        <img src={cover} alt={title} className="w-full h-full object-cover rounded-b-xl" />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
          <img
            src={profile}
            alt="Profile"
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white object-cover bg-gray-200 mb-4"
          />
          <h1 className="text-3xl md:text-5xl font-bold text-white text-center">{title}</h1>
        </div>
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        <div className="bg-white shadow-md rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap gap-4">
            {type && (
              <span className="bg-stone-100 text-stone-800 px-4 py-2 rounded-full text-sm font-medium">
                {type}
              </span>
            )}
            {location && (
              <span className="bg-stone-100 text-stone-800 px-4 py-2 rounded-full text-sm font-medium">
                {location}
              </span>
            )}
            {price && (
              <span className="bg-stone-100 text-stone-800 px-4 py-2 rounded-full text-sm font-medium">
                {price}
              </span>
            )}
          </div>
          <p className="text-stone-700 text-base md:text-lg leading-relaxed">
            <span className="font-semibold">Bio: </span>
            {bio}
          </p>
          {serviceBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
              {serviceBadges.map((badge, index) => (
                <span
                  key={`${badge}-${index}`}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center text-sm font-medium text-slate-700 underline decoration-dotted"
            >
              Contact: {contactEmail}
            </a>
          )}
        </div>

        {stats.length > 0 && (
          <section className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Snapshot</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-stone-500">
                    {stat.label}
                  </p>
                  <p className="text-lg font-semibold text-stone-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasCapabilities && (
          <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Capabilities & Toolset
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {renderChipGroup("Specialisations", specialisations)}
              {renderChipGroup("Expertise & Focus", expertise)}
              {renderChipGroup("Design Software", softwares)}
              {renderChipGroup("Languages", languages)}
              {renderChipGroup("Certifications", certifications)}
            </div>
          </section>
        )}

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Portfolio</h2>
          <PortfolioCarousel items={portfolioMedia} />
        </div>

        {deliverables.length > 0 && (
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Key Deliverables
            </h2>
            <ul className="space-y-2 text-stone-700">
              {deliverables.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-stone-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
            Work History
          </h2>
          {workHistory && workHistory.length > 0 ? (
            <ul className="space-y-4">
              {workHistory.map((item, idx) => (
                <li key={idx} className="bg-stone-50 p-4 rounded-xl shadow-sm space-y-1">
                  <div className="font-bold text-stone-800 text-lg">{item.role}</div>
                  <div className="text-stone-700">{item.company}</div>
                  <div className="text-stone-500 text-sm">{item.duration}</div>
                  <div className="mt-1 text-stone-600 text-sm">{item.description}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-stone-500">No work history available.</div>
          )}
        </div>

        {(booking || availabilityWindows.length > 0) && (
          <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Booking Playbook
            </h2>
            {bookingHighlights.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {bookingHighlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
            {timezone && (
              <p className="text-sm text-stone-600">
                Primary timezone: <span className="font-medium">{timezone}</span>
              </p>
            )}
            {booking?.timezones?.length ? (
              <div>
                <p className="text-sm font-semibold text-stone-600 mb-2">Supported timezones</p>
                <div className="flex flex-wrap gap-2">
                  {booking.timezones.map((zone) => (
                    <span
                      key={zone}
                      className="rounded-full bg-stone-100 text-stone-700 px-3 py-1 text-xs font-medium"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {availability && (
              <p className="text-sm text-stone-600">
                Availability: <span className="font-medium">{availability}</span>
              </p>
            )}
            {availabilityWindows.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-stone-600 mb-2">Weekly windows</p>
                <ul className="grid gap-2 sm:grid-cols-2 text-sm text-stone-700">
                  {availabilityWindows.map((availabilityWindow, index) => {
                    const label = formatAvailabilityWindow(availabilityWindow);
                    if (!label) return null;
                    return (
                      <li key={`${availabilityWindow.day}-${index}`} className="rounded-lg bg-stone-50 px-3 py-2">
                        {label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {booking?.slots?.length ? (
              <div>
                <p className="text-sm font-semibold text-stone-600 mb-2">Upcoming slots</p>
                <ul className="space-y-2 text-sm text-stone-700">
                  {booking.slots.map((slot, index) => {
                    const label = formatSlotWindow(slot);
                    if (!label) return null;
                    return (
                      <li key={`${slot.date}-${slot.start}-${index}`} className="rounded-lg border border-stone-200 px-3 py-2">
                        {label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {booking?.etaStages?.length ? (
              <div>
                <p className="text-sm font-semibold text-stone-600 mb-2">Engagement stages</p>
                <ol className="space-y-2 text-sm text-stone-700">
                  {booking.etaStages.map((stage, index) => (
                    <li key={`${stage.label || stage.stage}-${index}`} className="flex gap-3">
                      <span className="text-xs font-semibold text-stone-500">{index + 1}.</span>
                      <span>
                        {stage.label || stage.stage}
                        {stage.minutes ? ` - ${stage.minutes} min` : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {booking?.communications && (
              <div>
                <p className="text-sm font-semibold text-stone-600 mb-2">Supported communication modes</p>
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

        {(addons.length > 0 || prepChecklist.length > 0) && (
          <section className="bg-white p-6 rounded-xl shadow-md grid gap-6 md:grid-cols-2">
            {addons.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Optional add-ons</h3>
                <ul className="space-y-3 text-sm text-stone-700">
                  {addons.map((addon) => (
                    <li key={addon.id} className="rounded-lg border border-stone-200 p-3">
                      <p className="font-semibold text-stone-900">{addon.name}</p>
                      {Number.isFinite(Number(addon.price)) && (
                        <p className="text-xs text-stone-500">
                          {formatAddonPrice(addon, currency)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {prepChecklist.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Prep checklist</h3>
                <ul className="space-y-2 text-sm text-stone-700">
                  {prepChecklist.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-2">
                      <span className="text-emerald-500">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {warranty && (
          <section className="bg-white p-6 rounded-xl shadow-md space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Warranty & Support</h2>
            {warranty.durationDays && (
              <p className="text-sm text-stone-700">
                Coverage duration: <span className="font-medium">{warranty.durationDays} days</span>
              </p>
            )}
            {warranty.coverage && (
              <p className="text-sm text-stone-700">{warranty.coverage}</p>
            )}
            {warranty.contact && (
              <a
                href={`mailto:${warranty.contact}`}
                className="inline-flex items-center text-sm font-medium text-slate-700 underline decoration-dotted"
              >
                Warranty contact: {warranty.contact}
              </a>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AssociatePortfolio;
