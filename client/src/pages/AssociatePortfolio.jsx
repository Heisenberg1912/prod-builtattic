import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import Footer from "../components/Footer.jsx";
import PortfolioMediaPlayer from "../components/associate/PortfolioMediaPlayer.jsx";
import { fetchMarketplaceAssociateProfile, requestAssociateConsultation } from "../services/marketplace.js";
import { getAssociateAvatar, getAssociateFallback } from "../utils/imageFallbacks.js";

const Section = ({ title, children, anchorRef }) => (
  <section ref={anchorRef} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    {children}
  </section>
);

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
    {children}
  </span>
);

const Stat = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-2xl font-semibold text-slate-900">{value}</p>
    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
  </div>
);

const formatRate = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Set rate";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

export default function AssociatePortfolio() {
  const { id } = useParams();
  const location = useLocation();
  const consultRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consultForm, setConsultForm] = useState({
    name: "",
    email: "",
    phone: "",
    scheduledFor: "",
    message: "",
  });
  const [consultState, setConsultState] = useState({ submitting: false, success: false });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMarketplaceAssociateProfile(id);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load associate");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const focusConsult = location.state?.focus === "consult" || params.get("consult") === "1";
    if (focusConsult && consultRef.current) {
      setTimeout(() => consultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [location]);

  const contactEmail = profile?.contactEmail || profile?.contact?.email;
  const contactPhone = profile?.contact?.phone;
  const contactWebsite = profile?.contact?.website;
  const languages = Array.isArray(profile?.languages) ? profile.languages : [];
  const tools = Array.isArray(profile?.toolset) ? profile.toolset : [];
  const specialisations = Array.isArray(profile?.specialisations) ? profile.specialisations : [];
  const deliverables = Array.isArray(profile?.deliverables) ? profile.deliverables : [];
  const workHistory = Array.isArray(profile?.workHistory) ? profile.workHistory : [];
  const services = Array.isArray(profile?.services) ? profile.services : [];
  const planTiles = Array.isArray(profile?.planUploads) ? profile.planUploads : [];
  const hourly = profile?.rates?.hourly ?? profile?.hourlyRate ?? null;
  const currency = profile?.rates?.currency || "USD";
  const rateLabel = `${formatRate(hourly, currency)} / hr`;
  const portfolioMedia = useMemo(() => profile?.portfolioMedia || [], [profile]);
  const avatar =
    profile?.profileImage ||
    profile?.avatar ||
    getAssociateAvatar(profile) ||
    getAssociateFallback();
  const cover = profile?.heroImage || profile?.coverImage || portfolioMedia[0]?.mediaUrl;

  const handleConsultSubmit = async () => {
    if (!consultForm.name.trim() || !consultForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setConsultState({ submitting: true, success: false });
    try {
      await requestAssociateConsultation(id, consultForm);
      toast.success("Consultation request sent. The associate and workspace will be notified.");
      setConsultState({ submitting: false, success: true });
      setConsultForm({ name: "", email: "", phone: "", scheduledFor: "", message: "" });
    } catch (err) {
      setConsultState({ submitting: false, success: false });
      toast.error(err?.message || "Unable to book a consultation");
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-slate-600">Loading associate...</p>;
  }
  if (error) {
    return <p className="p-6 text-sm text-rose-600">{error}</p>;
  }
  if (!profile) {
    return <p className="p-6 text-sm text-slate-600">No associate found.</p>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-64 w-full bg-slate-100">
            {cover ? <img src={cover} alt="Cover" className="h-full w-full object-cover" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 flex flex-wrap items-center gap-4">
              <img
                src={avatar}
                alt={profile.name}
                className="h-20 w-20 rounded-full border-4 border-white shadow-lg object-cover bg-white"
              />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Skill Studio</p>
                <h1 className="text-3xl font-bold text-white drop-shadow">{profile.name || profile.title || "Associate"}</h1>
                <p className="text-white/90">
                  {profile.firmName || "Independent"} {profile.location ? ` / ${profile.location}` : ""}
                </p>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => consultRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100"
                >
                  Book consultation
                </button>
                {contactEmail ? (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="rounded-full border border-white/60 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Email
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              {specialisations.slice(0, 4).map((spec) => (
                <Pill key={spec}>{spec}</Pill>
              ))}
              {languages.slice(0, 3).map((lang) => (
                <Pill key={lang}>{lang}</Pill>
              ))}
            </div>
            {profile.summary ? <p className="text-slate-700 text-base">{profile.summary}</p> : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Rate" value={rateLabel} />
              <Stat label="Experience" value={profile.experienceYears ? `${profile.experienceYears} yrs` : "Add years"} />
              <Stat label="Timezone" value={profile.timezone || "Set timezone"} />
            </div>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-10">
            <Section title="Portfolio">
              {portfolioMedia.length ? (
                <PortfolioMediaPlayer items={portfolioMedia} title="" subtitle="" />
              ) : (
                <p className="text-sm text-slate-600">No portfolio items yet.</p>
              )}
            </Section>

            <Section title="Toolset & Software">
              {tools.length ? (
                <div className="flex flex-wrap gap-2">{tools.map((tool) => <Pill key={tool}>{tool}</Pill>)}</div>
              ) : (
                <p className="text-sm text-slate-600">No tools listed.</p>
              )}
            </Section>

            <Section title="Service packs & deliverables">
              {services.length ? (
                <div className="space-y-3">
                  {services.map((svc) => (
                    <div key={svc._id || svc.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{svc.title}</p>
                      {svc.summary ? <p className="text-sm text-slate-600 mt-1">{svc.summary}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                        {svc.deliverables?.map((d) => (
                          <Pill key={d}>{d}</Pill>
                        ))}
                      </div>
                      {svc.price != null ? (
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: svc.currency || "USD",
                            maximumFractionDigits: 0,
                          }).format(Number(svc.price))}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">No published services yet.</p>
                  {deliverables.length ? (
                    <div className="flex flex-wrap gap-2">
                      {deliverables.map((d) => (
                        <Pill key={d}>{d}</Pill>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </Section>

            <Section title="Plan tiles">
              {planTiles.length ? (
                <div className="space-y-3">
                  {planTiles.map((plan) => (
                    <div key={plan.id || plan.projectTitle} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                      <div className="flex items-start gap-3">
                        {plan.coverImage ? (
                          <img src={plan.coverImage} alt={plan.projectTitle} className="h-16 w-20 rounded-lg object-cover border border-slate-200" />
                        ) : null}
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{plan.projectTitle}</p>
                          <p className="text-xs text-slate-600">{plan.category || plan.primaryStyle || "Concept"}</p>
                        </div>
                        <span className="ml-auto rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                          {plan.status || "draft"}
                        </span>
                      </div>
                      {plan.description ? <p className="text-sm text-slate-700">{plan.description}</p> : null}
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        {plan.primaryStyle ? <Pill>{plan.primaryStyle}</Pill> : null}
                        {(plan.tags || []).map((tag) => (
                          <Pill key={tag}>{tag}</Pill>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No plan tiles published yet.</p>
              )}
            </Section>

            <Section title="Work history">
              {workHistory.length ? (
                <div className="space-y-3">
                  {workHistory.map((entry, idx) => (
                    <div key={`${entry.company}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{entry.company}</p>
                      <p className="text-xs text-slate-600">
                        {entry.role || "Contributor"} {entry.duration ? ` / ${entry.duration}` : ""}
                      </p>
                      {entry.summary ? <p className="mt-2 text-sm text-slate-700">{entry.summary}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No work history listed.</p>
              )}
            </Section>
          </div>

          <div className="space-y-8">
            <Section title="Consultation & Contact" anchorRef={consultRef}>
              <div className="space-y-3">
                <div className="space-y-2 text-sm text-slate-700">
                  {contactEmail ? (
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      <a className="text-slate-900 underline" href={`mailto:${contactEmail}`}>
                        {contactEmail}
                      </a>
                    </p>
                  ) : null}
                  {contactPhone ? (
                    <p>
                      <span className="font-semibold">Phone:</span> {contactPhone}
                    </p>
                  ) : null}
                  {contactWebsite ? (
                    <p>
                      <span className="font-semibold">Website:</span>{" "}
                      <a className="text-slate-900 underline" href={contactWebsite}>
                        {contactWebsite}
                      </a>
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-slate-600">
                      Your name
                      <input
                        value={consultForm.name}
                        onChange={(e) => setConsultForm({ ...consultForm, name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                        placeholder="Client name"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      Email
                      <input
                        type="email"
                        value={consultForm.email}
                        onChange={(e) => setConsultForm({ ...consultForm, email: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                        placeholder="you@example.com"
                      />
                    </label>
                  </div>
                  <label className="text-xs text-slate-600">
                    Phone (optional)
                    <input
                      value={consultForm.phone}
                      onChange={(e) => setConsultForm({ ...consultForm, phone: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      placeholder="Include country code"
                    />
                  </label>
                  <label className="text-xs text-slate-600">
                    Preferred date & time
                    <input
                      type="datetime-local"
                      value={consultForm.scheduledFor}
                      onChange={(e) => setConsultForm({ ...consultForm, scheduledFor: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-600">
                    Project summary
                    <textarea
                      value={consultForm.message}
                      onChange={(e) => setConsultForm({ ...consultForm, message: e.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      placeholder="What do you need help with?"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleConsultSubmit}
                    disabled={consultState.submitting}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {consultState.submitting ? "Sending..." : "Book consultation"}
                  </button>
                  {consultState.success ? (
                    <p className="text-xs font-semibold text-emerald-600">
                      Request logged. The associate and studio dashboard will see this instantly.
                    </p>
                  ) : null}
                </div>
              </div>
            </Section>

            <Section title="Deliverables">
              {deliverables.length ? (
                <div className="flex flex-wrap gap-2">{deliverables.map((d) => <Pill key={d}>{d}</Pill>)}</div>
              ) : (
                <p className="text-sm text-slate-600">No deliverables provided.</p>
              )}
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
