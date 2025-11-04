import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  fetchVendorPortalProfile,
  upsertVendorPortalProfile,
  loadVendorProfileDraft,
} from "../../services/portal.js";
import {
  EMPTY_VENDOR_PROFILE_FORM,
  mapVendorProfileToForm,
  vendorFormToPayload,
  deriveVendorProfileStats,
} from "../../utils/vendorProfile.js";

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
  const stats = useMemo(() => deriveVendorProfileStats(form), [form]);
  const leadTime = stats.leadTime ? `${stats.leadTime} days` : "Lead time pending";
  const moq = stats.moq ? `${stats.moq.toLocaleString()} MOQ` : "MOQ TBD";
  const regions = stats.regions ? `${stats.regions} regions serviced` : "Add regions";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Marketplace preview</h3>
      <p className="mt-1 text-sm text-slate-500">Shows how your vendor tile appears in Material Studio.</p>
      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{form.location || "LOCATION"}</p>
          <h4 className="text-xl font-semibold text-slate-900">{form.companyName || "Vendor name"}</h4>
          <p className="mt-2 text-sm text-slate-600 line-clamp-3">
            {form.tagline || form.summary || "Add a short value proposition for buyers."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{leadTime}</p>
            <p>Avg. lead</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{moq}</p>
            <p>Minimum order</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{stats.materials || "–"}</p>
            <p>Catalog SKUs</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{regions}</p>
            <p>Distribution</p>
          </div>
        </div>
        {form.catalogHighlights && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Highlights</p>
            <p className="mt-2 text-sm text-slate-600 line-clamp-3">{form.catalogHighlights.split(/\r?\n/).slice(0, 2).join(" · ")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const getLastUpdated = (profile) => profile?.updatedAt || profile?.createdAt || new Date().toISOString();

export default function VendorProfileEditor({ onProfileUpdate, showPreview = true, header }) {
  const [form, setForm] = useState(EMPTY_VENDOR_PROFILE_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_VENDOR_PROFILE_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);
  const applyResponse = useCallback((response) => {
    const mapped = mapVendorProfileToForm(response.profile || {});
    setForm(mapped);
    setInitialForm(mapped);
    setOfflineMode(response.source !== "remote");
    setAuthRequired(Boolean(response.authRequired));
    setLastSynced(getLastUpdated(response.profile || {}));
    setError(response.authRequired ? response.error?.message || "Sign in to sync your profile." : null);
    onProfileUpdate?.(response.profile || {});
  }, [onProfileUpdate]);


  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchVendorPortalProfile({ preferDraft: true });
        if (response.ok || response.profile) {
          applyResponse(response);
        } else if (response.authRequired) {
          setAuthRequired(true);
          const draft = response.profile || loadVendorProfileDraft();
          if (draft) {
            applyResponse({ profile: draft, source: "draft" });
          } else {
            setError(response.error?.message || "Sign in to manage your vendor profile." );
          }
        }
      } catch (err) {
        console.error("vendor_profile_load_error", err);
        const draft = loadVendorProfileDraft();
        if (draft) {
          applyResponse({ profile: draft, source: "draft" });
          toast("Loaded local draft", { icon: "📦" });
        } else {
          setError(err?.message || "Unable to load your vendor profile.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applyResponse]);

  const handleInput = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = vendorFormToPayload(form);
      const response = await upsertVendorPortalProfile(payload);
      if (response.ok) {
        applyResponse({ profile: response.profile, source: response.source, authRequired: response.authRequired });
        toast.success(response.source === "remote" ? "Profile saved" : "Draft saved locally");
      } else if (response.profile) {
        applyResponse({ profile: response.profile, source: response.source, authRequired: response.authRequired });
        toast("Draft saved locally", { icon: "📦" });
      }
    } catch (err) {
      console.error("vendor_profile_save_error", err);
      toast.error(err?.message || "Unable to save your vendor profile");
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
            <Section title="Company overview" description="Introduce your material house to buyers.">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Company name</span>
                    <Input value={form.companyName} onChange={handleInput("companyName")} placeholder="BuildMart Logistics" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Tagline</span>
                    <Input value={form.tagline} onChange={handleInput("tagline")} placeholder="High-performance structural systems, delivered on schedule." />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Summary</span>
                  <TextArea value={form.summary} onChange={handleInput("summary")} rows={4} placeholder="Manufacturing partner for steel, envelope and modular kits across MENA and APAC. Integrated sourcing, QA and logistics." />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Headquartered in</span>
                    <Input value={form.location} onChange={handleInput("location")} placeholder="Dubai, UAE" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Founded</span>
                    <Input value={form.foundedYear} onChange={handleInput("foundedYear")} placeholder="2012" inputMode="numeric" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Team size</span>
                    <Input value={form.teamSize} onChange={handleInput("teamSize")} placeholder="48" inputMode="numeric" />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Contact & channels" description="Make it easy for project teams to reach you.">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <Input value={form.contactEmail} onChange={handleInput("contactEmail")} placeholder="sourcing@buildmart.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Phone</span>
                  <Input value={form.contactPhone} onChange={handleInput("contactPhone")} placeholder="(+971) 55 222 6784" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Website</span>
                  <Input value={form.website} onChange={handleInput("website")} placeholder="https://buildmart.com" />
                </div>
              </div>
            </Section>

            <Section title="Operations" description="Tell buyers about capacity, MOQ, and service levels.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Average lead time (days)</span>
                  <Input value={form.leadTimeDays} onChange={handleInput("leadTimeDays")} placeholder="28" inputMode="numeric" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Minimum order quantity</span>
                  <Input value={form.minOrderQuantity} onChange={handleInput("minOrderQuantity")} placeholder="50" inputMode="numeric" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Production capacity</span>
                  <Input value={form.productionCapacity} onChange={handleInput("productionCapacity")} placeholder="4,500 tonnes / month" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Payment terms</span>
                  <Input value={form.paymentTerms} onChange={handleInput("paymentTerms")} placeholder="30% advance, 70% prior to dispatch" />
                </div>
              </div>
            </Section>

            <Section title="Distribution & compliance" description="Show where you deliver and certifications you carry.">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Shipping regions</span>
                  <Hint>One region or country per line. e.g., GCC, Europe, North America.</Hint>
                  <TextArea value={form.shippingRegions} onChange={handleInput("shippingRegions")} rows={3} placeholder="GCC\nEurope (DTP)\nNorth America" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Logistics & handling</span>
                  <TextArea value={form.logisticsNotes} onChange={handleInput("logisticsNotes")} rows={3} placeholder="Dual temperature-controlled storage in JAFZA. Includes cranage and customs clearance." />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Sustainability commitments</span>
                  <TextArea value={form.sustainability} onChange={handleInput("sustainability")} rows={3} placeholder="EAF steel sourcing, EPD-ready documentation, closed-loop slurry recycling." />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Certifications</span>
                  <Hint>Separate with commas. Example: ISO 9001, ISO 14001, LEED Gold.</Hint>
                  <TextArea value={form.certifications} onChange={handleInput("certifications")} rows={2} placeholder="ISO 9001, ISO 45001, LEED Gold" />
                </div>
              </div>
            </Section>

            <Section title="Catalog" description="Link the SKUs that should inherit this profile in Material Studio.">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Hero image</span>
                  <Input value={form.heroImage} onChange={handleInput("heroImage")} placeholder="https://cdn.buildmart.com/warehouse/hero.jpg" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Categories</span>
                    <Hint>Comma separated. Example: Steel, Envelope, Modular kits.</Hint>
                    <TextArea value={form.catalogCategories} onChange={handleInput("catalogCategories")} rows={2} placeholder="Structural steel, Envelope systems" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Highlights</span>
                    <Hint>One per line. Example: "4-axis robotic welding".</Hint>
                    <TextArea value={form.catalogHighlights} onChange={handleInput("catalogHighlights")} rows={3} placeholder="4-axis robotic welding\n24h QC turnaround" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Catalog SKUs / slugs</span>
                  <Hint>Enter the slugs of the materials you manage. One per line, e.g., "mr-chair-cantilever".</Hint>
                  <TextArea value={form.catalogSkus} onChange={handleInput("catalogSkus")} rows={4} placeholder="mr-chair-furniture-cantilever\nstructural-steel-grade60" />
                </div>
              </div>
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






