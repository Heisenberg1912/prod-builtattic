import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { fetchFirmPortalProfile, upsertFirmPortalProfile } from "../../services/portal.js";
import {
  EMPTY_FIRM_PROFILE_FORM,
  mapFirmProfileToForm,
  firmFormToProfile,
  deriveFirmProfileStats,
} from "../../utils/firmProfile.js";

const FIRM_CONTEXT_STORAGE_KEY = "firm_portal_active_firm";

const readStoredFirmContext = () => {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(FIRM_CONTEXT_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

const readStoredUserRole = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.role || null;
  } catch {
    return null;
  }
};

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
    {children}
  </section>
);

const Badge = ({ tone = "slate", children }) => {
  const palette = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${palette[tone] || palette.slate}`}>
      {children}
    </span>
  );
};

const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 ${className}`}
  />
);

const TextArea = ({ className = "", ...props }) => (
  <textarea
    {...props}
    className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 ${className}`}
  />
);

const Hint = ({ children }) => <p className="text-xs text-slate-500">{children}</p>;

const PreviewCard = ({ form }) => {
  const stats = useMemo(() => deriveFirmProfileStats(form), [form]);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Marketplace preview</p>
      <h4 className="mt-3 text-2xl font-semibold text-slate-900">{form.name || "Studio name"}</h4>
      <p className="text-sm text-slate-500">{form.tagline || form.summary || "Add a short positioning statement."}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Regions</p>
          <p className="text-base font-semibold text-slate-900">{stats.regions || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Services</p>
          <p className="text-base font-semibold text-slate-900">{stats.services || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Projects</p>
          <p className="text-base font-semibold text-slate-900">{stats.projects || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Partners</p>
          <p className="text-base font-semibold text-slate-900">{stats.partners || 0}</p>
        </div>
      </div>
      {form.heroImage ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Hero media</p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img src={form.heroImage} alt="Hero" className="h-40 w-full object-cover" />
          </div>
        </div>
      ) : null}
      {form.gallery && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Gallery</p>
          <p className="text-sm text-slate-500">{form.gallery.split(/\r?\n/).slice(0, 2).join(" · ")}</p>
        </div>
      )}
    </div>
  );
};

const formatTimestamp = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const now = () => new Date().toISOString();

export default function FirmProfileEditor({ onProfileUpdate, header, showPreview = true }) {
  const [form, setForm] = useState(EMPTY_FIRM_PROFILE_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FIRM_PROFILE_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [firmContext, setFirmContext] = useState(() => readStoredFirmContext());
  const [firmContextInput, setFirmContextInput] = useState(() => readStoredFirmContext());
  const [forceShowFirmContext, setForceShowFirmContext] = useState(false);
  const [viewerRole] = useState(() => readStoredUserRole());

  const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);
  const isGlobalAdmin = useMemo(() => {
    const role = String(viewerRole || "").toLowerCase();
    return role === "admin" || role === "superadmin";
  }, [viewerRole]);
  const shouldShowFirmContextControls = isGlobalAdmin || forceShowFirmContext || Boolean(firmContext);
  const currentFirmId = firmContext || undefined;

  const persistFirmContext = (value) => {
    const trimmed = value?.trim() || "";
    setFirmContext(trimmed);
    setFirmContextInput(trimmed);
    if (typeof window !== "undefined") {
      try {
        if (trimmed) {
          localStorage.setItem(FIRM_CONTEXT_STORAGE_KEY, trimmed);
        } else {
          localStorage.removeItem(FIRM_CONTEXT_STORAGE_KEY);
        }
      } catch (storageError) {
        console.warn("firm_context_store_error", storageError);
      }
    }
    if (!trimmed && !isGlobalAdmin) {
      setForceShowFirmContext(false);
    }
  };

  const applyFirmContext = () => {
    persistFirmContext(firmContextInput);
    if (firmContextInput.trim()) {
      setForceShowFirmContext(true);
    }
  };

  const clearFirmContext = () => {
    persistFirmContext("");
  };

  const applyResponse = (response) => {
    const nextProfile = response?.profile || null;
    if (nextProfile) {
      const nextForm = mapFirmProfileToForm(nextProfile);
      setForm(nextForm);
      setInitialForm(nextForm);
      setLastSynced(nextProfile.updatedAt || nextProfile.createdAt || now());
      setOfflineMode(response?.source && response.source !== "remote");
    } else {
      setForm(EMPTY_FIRM_PROFILE_FORM);
      setInitialForm(EMPTY_FIRM_PROFILE_FORM);
    }
    onProfileUpdate?.(nextProfile);
    setAuthRequired(Boolean(response?.authRequired));
  };

  const mapErrorMessage = (err, fallback = "Unable to load profile") =>
    err?.response?.data?.error || err?.message || fallback;

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchFirmPortalProfile({ preferDraft: true, firmId: currentFirmId });
      if (payload?.profile) {
        applyResponse(payload);
      } else {
        applyResponse({ profile: null });
      }
    } catch (err) {
      const message = mapErrorMessage(err);
      setError(message);
      if (/firmid/i.test(message)) {
        setForceShowFirmContext(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFirmId]);

  const handleInput = (key) => (event) => {
    const value = event?.target?.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = firmFormToProfile(form);
      const response = await upsertFirmPortalProfile(payload, { firmId: currentFirmId });
      applyResponse(response);
      toast.success("Studio profile saved");
    } catch (err) {
      console.error("firm_profile_save_error", err);
      const message = mapErrorMessage(err, "Unable to save profile");
      setError(message);
      toast.error(message);
      if (/firmid/i.test(message)) {
        setForceShowFirmContext(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
  };

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading profile...</div>;
  }

  if (authRequired) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h3 className="text-lg font-semibold">Join a firm workspace</h3>
        <p className="text-sm">Link your account to a design studio to manage its profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {header || (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Design Studio profile</p>
            <h2 className="text-2xl font-semibold text-slate-900">Studio identity</h2>
            <p className="text-sm text-slate-500">Surface credentials buyers need before booking your studio bundles.</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <Badge tone={offlineMode ? "amber" : "emerald"}>{offlineMode ? "Draft" : "Synced"}</Badge>
          {lastSynced ? <span>Last synced {formatTimestamp(lastSynced)}</span> : null}
          {error ? <span className="text-rose-600">{error}</span> : null}
        </div>
      </div>

      {shouldShowFirmContextControls && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Firm context override</p>
              <Input
                value={firmContextInput}
                onChange={(event) => setFirmContextInput(event.target.value)}
                placeholder="Paste firm ObjectId"
              />
              <Hint>
                {isGlobalAdmin
                  ? 'Super admins can target any studio by providing its firm ID.'
                  : 'Switch to another firm workspace by entering its ID.'}
              </Hint>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyFirmContext}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
              >
                Apply
              </button>
              {firmContext && (
                <button
                  type="button"
                  onClick={clearFirmContext}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Section title="Studio identity" description="Tell buyers who you are and what you stand for.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Studio name</span>
                <Input value={form.name} onChange={handleInput("name")} placeholder="Demo Design Collective" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Tagline</span>
                <Input value={form.tagline} onChange={handleInput("tagline")} placeholder="Concepts, specs, and delivery playbooks." />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Hero image URL</span>
                <Input value={form.heroImage} onChange={handleInput("heroImage")} placeholder="https://cdn.example.com/hero.jpg" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Summary</span>
              <TextArea value={form.summary} onChange={handleInput("summary")} rows={4} placeholder="Short description buyers will read on your Design Studio card." />
            </div>
          </Section>

          <Section title="Footprint & team" description="Give context on scale, location, and reach.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-slate-700">Founded year</span>
                <Input value={form.foundedYear} onChange={handleInput("foundedYear")} placeholder="2012" inputMode="numeric" />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700">Team size</span>
                <Input value={form.teamSize} onChange={handleInput("teamSize")} placeholder="24" inputMode="numeric" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Headquarters</span>
              <Input value={form.headquarters} onChange={handleInput("headquarters")} placeholder="Dubai, UAE" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Regions served</span>
                <Hint>One per line: GCC, Europe, APAC...</Hint>
                <TextArea value={form.regions} onChange={handleInput("regions")} rows={3} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Languages</span>
                <Hint>Comma separated</Hint>
                <TextArea value={form.languages} onChange={handleInput("languages")} rows={3} />
              </div>
            </div>
          </Section>

          <Section title="Services & proofs" description="Highlight what you sell and show evidence.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Services</span>
                <Hint>Comma separated</Hint>
                <TextArea value={form.services} onChange={handleInput("services")} rows={3} placeholder="Architecture, Interior, Strategy" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Specialisations</span>
                <TextArea value={form.specialisations} onChange={handleInput("specialisations")} rows={3} placeholder="Hospitality, Modular" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Notable projects</span>
              <Hint>One per line</Hint>
              <TextArea value={form.notableProjects} onChange={handleInput("notableProjects")} rows={4} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Partner network</span>
              <Hint>One partner per line</Hint>
              <TextArea value={form.partnerNetwork} onChange={handleInput("partnerNetwork")} rows={3} />
            </div>
          </Section>

          <Section title="Recognition & sustainability" description="Signal trust and compliance.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Awards</span>
                <TextArea value={form.awards} onChange={handleInput("awards")} rows={3} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Certifications</span>
                <Hint>Comma separated</Hint>
                <TextArea value={form.certifications} onChange={handleInput("certifications")} rows={3} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Sustainability commitments</span>
              <TextArea value={form.sustainability} onChange={handleInput("sustainability")} rows={3} />
            </div>
          </Section>

          <Section title="Commercial & contact" description="Make it easy to start procurement.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-slate-700">Billing currency</span>
                <Input value={form.billingCurrency} onChange={handleInput("billingCurrency")} placeholder="USD" className="uppercase" />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700">Average fee (per sqft)</span>
                <Input value={form.averageFee} onChange={handleInput("averageFee")} placeholder="220" inputMode="decimal" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Contact email</span>
                <Input value={form.contactEmail} onChange={handleInput("contactEmail")} placeholder="studios@builtattic.com" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Contact phone</span>
                <Input value={form.contactPhone} onChange={handleInput("contactPhone")} placeholder="+971 4 555 0193" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Website</span>
              <Input value={form.website} onChange={handleInput("website")} placeholder="https://builtattic.com" />
            </div>
          </Section>

          <Section title="Media & gallery" description="Link inspiration or proof points buyers can explore.">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Gallery URLs</span>
              <Hint>One per line</Hint>
              <TextArea value={form.gallery} onChange={handleInput("gallery")} rows={4} />
            </div>
          </Section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow transition enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? "Saving..." : hasChanges ? "Save profile" : "Saved"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset changes
            </button>
          </div>
        </div>
        {showPreview ? <PreviewCard form={form} /> : null}
      </div>
    </div>
  );
}

