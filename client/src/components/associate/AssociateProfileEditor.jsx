import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  fetchAssociatePortalProfile,
  upsertAssociatePortalProfile,
  loadAssociateProfileDraft,
} from "../../services/portal.js";
import {
  EMPTY_PROFILE_FORM,
  mapProfileToForm,
  formToPayload,
  deriveProfileStats,
  formatCurrency,
} from "../../utils/associateProfile.js";

const Badge = ({ tone = "slate", children }) => {
  const palette = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${palette[tone] || palette.slate}`}>
      {children}
    </span>
  );
};

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
    {children}
  </section>
);

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

const Hint = ({ children, className = "" }) => (
  <p className={`text-xs text-slate-500 ${className}`}>{children}</p>
);

const PreviewCard = ({ form }) => {
  const stats = useMemo(() => deriveProfileStats(form), [form]);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Marketplace preview</h3>
      <p className="mt-1 text-sm text-slate-500">This mirrors your Skill Studio card.</p>
      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{form.location || "LOCATION"}</p>
          <h4 className="text-xl font-semibold text-slate-900">{form.title || "Associate headline"}</h4>
          <p className="mt-2 text-sm text-slate-600 line-clamp-3">
            {form.summary || "Add a concise bio to stand out to buyers."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{stats.years || "-"}</p>
            <p>Years experience</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{stats.projects || "-"}</p>
            <p>Projects delivered</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{stats.hourly ? formatCurrency(stats.hourly, form.currency || "USD") : "-"}</p>
            <p>Hourly rate</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{stats.languages.slice(0, 2).join(', ') || "Languages"}</p>
            <p>Languages</p>
          </div>
        </div>
        {stats.specialisations.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Specialisations</p>
            <p className="mt-2 text-sm text-slate-600">{stats.specialisations.slice(0, 3).join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const getLastUpdated = (profile) => profile?.updatedAt || profile?.createdAt || new Date().toISOString();

export default function AssociateProfileEditor({ onProfileUpdate, showPreview = true, header }) {
  const [form, setForm] = useState(EMPTY_PROFILE_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_PROFILE_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchAssociatePortalProfile({ preferDraft: true });
        if (response.ok || response.profile) {
          applyResponse(response);
        } else if (response.authRequired) {
          setAuthRequired(true);
          const draft = response.profile || loadAssociateProfileDraft();
          if (draft) {
            applyResponse({ profile: draft, source: "draft" });
          } else {
            setError(response.error?.message || "Sign in to manage your Skill Studio profile.");
          }
        }
      } catch (err) {
        console.error("associate_profile_load_error", err);
        const draft = loadAssociateProfileDraft();
        if (draft) {
          applyResponse({ profile: draft, source: "draft" });
          toast("Loaded local draft", { icon: "💾" });
        } else {
          setError(err?.message || "Unable to load your Skill Studio profile.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const applyResponse = (response) => {
    const mapped = mapProfileToForm(response.profile || {});
    setForm(mapped);
    setInitialForm(mapped);
    setOfflineMode(response.source !== "remote");
    setAuthRequired(Boolean(response.authRequired));
    setLastSynced(getLastUpdated(response.profile || {}));
    setError(response.authRequired ? response.error?.message || "Sign in to sync your profile." : null);
    onProfileUpdate?.(response.profile || {});
  };

  const handleInput = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(form);
      const response = await upsertAssociatePortalProfile(payload);
      if (response.ok) {
        applyResponse({ profile: response.profile, source: response.source, authRequired: response.authRequired });
        toast.success(response.source === "remote" ? "Profile saved" : "Draft saved locally");
      } else if (response.profile) {
        applyResponse({ profile: response.profile, source: response.source, authRequired: response.authRequired });
        toast("Draft saved locally", { icon: "💾" });
      }
    } catch (err) {
      console.error("associate_profile_save_error", err);
      toast.error(err?.message || "Unable to save your Skill Studio profile");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
      <div className="space-y-8">
        <div className="space-y-3">
          {header}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {offlineMode ? <Badge tone="amber">Offline draft</Badge> : <Badge tone="emerald">Synced</Badge>}
            {authRequired ? <Badge tone="rose">Sign in to sync</Badge> : null}
            {lastSynced ? <span>Last updated {new Date(lastSynced).toLocaleString()}</span> : null}
          </div>
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((key) => (
              <div key={key} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-5 w-1/3 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-full rounded bg-slate-200" />
                <div className="mt-2 h-4 w-2/3 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <Section title="Basics" description="Headline, intro, and location information that appears on your card.">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Professional headline</span>
                  <Input value={form.title} onChange={handleInput("title")} placeholder="FF&E Specialist, Hospitality" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Short bio</span>
                  <TextArea value={form.summary} onChange={handleInput("summary")} rows={4} placeholder="Led FF&E and procurement for boutique hospitality across APAC." />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Location</span>
                    <Input value={form.location} onChange={handleInput("location")} placeholder="Bengaluru, India" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Timezone</span>
                    <Input value={form.timezone} onChange={handleInput("timezone")} placeholder="IST / GMT +5:30" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Years of experience</span>
                    <Input value={form.experienceYears} onChange={handleInput("experienceYears")} placeholder="6" inputMode="numeric" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Completed projects</span>
                    <Input value={form.completedProjects} onChange={handleInput("completedProjects")} placeholder="48" inputMode="numeric" />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Availability & rates" description="Let the marketplace know how and when you work.">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Availability note</span>
                  <TextArea value={form.availability} onChange={handleInput("availability")} rows={3} placeholder="Open for part-time collaborations from May; discovery calls Tue-Thu." />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Hourly rate</span>
                    <Input value={form.hourlyRate} onChange={handleInput("hourlyRate")} placeholder="75" inputMode="decimal" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Daily rate</span>
                    <Input value={form.dailyRate} onChange={handleInput("dailyRate")} placeholder="520" inputMode="decimal" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Currency</span>
                    <Input value={form.currency} onChange={handleInput("currency")} placeholder="USD" className="uppercase" />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Expertise & credentials" description="Separate values with commas or line breaks. We surface the top entries.">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Languages</span>
                  <TextArea value={form.languages} onChange={handleInput("languages")} rows={2} placeholder="English, Kannada, Hindi" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Softwares</span>
                  <TextArea value={form.softwares} onChange={handleInput("softwares")} rows={2} placeholder="Revit, AutoCAD, Rhino" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Specialisations</span>
                  <TextArea value={form.specialisations} onChange={handleInput("specialisations")} rows={2} placeholder="Hospitality interiors, FF&E strategy, Site coordination" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Certifications</span>
                  <TextArea value={form.certifications} onChange={handleInput("certifications")} rows={2} placeholder="LEED AP, WELL AP" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Portfolio links</span>
                  <Hint>One URL per line – case studies, socials, or booking links.</Hint>
                  <TextArea value={form.portfolioLinks} onChange={handleInput("portfolioLinks")} rows={3} placeholder="https://example.com/case-study" />
                </div>
              </div>
            </Section>

            <Section title="Portfolio highlights" description="One project per line using ‘Title | Scope | Year | Role’.">
              <TextArea
                value={form.keyProjects}
                onChange={handleInput("keyProjects")}
                rows={4}
                placeholder="The Gilded Acorn | Hospitality refresh | 2023 | FF&E lead"
              />
            </Section>

            <div className="flex flex-wrap items-center gap-3">
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
          </>
        )}
      </div>
      {showPreview ? <PreviewCard form={form} /> : null}
    </div>
  );
}
