import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, CloudUpload } from "lucide-react";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import VendorProfileEditor from "../components/vendor/VendorProfileEditor.jsx";
import VendorOnboardingChecklist from "../components/vendor/VendorOnboardingChecklist.jsx";
import ServicePackManager from "../components/dashboard/ServicePackManager.jsx";
import MeetingScheduler from "../components/dashboard/MeetingScheduler.jsx";
import PlanUploadPanel from "../components/dashboard/PlanUploadPanel.jsx";
import DownloadCenter from "../components/dashboard/DownloadCenter.jsx";
import ClientChatPanel from "../components/dashboard/ClientChatPanel.jsx";
import {
  fetchVendorMaterials,
  createVendorMaterial,
  updateVendorMaterial,
  publishVendorMaterial,
  deleteVendorMaterial,
  fetchVendorOnboarding,
} from "../services/portal.js";

const EMPTY_MATERIAL_FORM = {
  id: null,
  title: "",
  summary: "",
  price: "",
  currency: "USD",
  categories: "",
  tags: "",
  highlights: "",
  inventory: "",
  minOrderQuantity: "",
  maxOrderQuantity: "",
  leadTimeWeeks: "",
  handoverMethod: "",
};

const splitComma = (value = "") =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const splitLines = (value = "") =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const normaliseMaterialForm = (item = {}) => ({
  id: item._id?.toString?.() || item.id || null,
  title: item.title || "",
  summary: item.summary || item.description || "",
  price: item.price != null ? String(item.price) : "",
  currency: item.currency || "USD",
  categories: (item.categories || []).join(", "),
  tags: (item.tags || []).join(", "),
  highlights: (item.highlights || []).join("\n"),
  inventory: item.inventory != null ? String(item.inventory) : "",
  minOrderQuantity: item.minOrderQuantity != null ? String(item.minOrderQuantity) : "",
  maxOrderQuantity: item.maxOrderQuantity != null ? String(item.maxOrderQuantity) : "",
  leadTimeWeeks: item.delivery?.leadTimeWeeks != null ? String(item.delivery.leadTimeWeeks) : "",
  handoverMethod: item.delivery?.handoverMethod || "",
});

const materialFormToPayload = (form = {}) => ({
  title: form.title || undefined,
  summary: form.summary || undefined,
  price: form.price ? Number(form.price) : undefined,
  currency: form.currency ? form.currency.toUpperCase() : undefined,
  categories: splitComma(form.categories),
  tags: splitComma(form.tags),
  highlights: splitLines(form.highlights),
  inventory: form.inventory ? Number(form.inventory) : undefined,
  minOrderQuantity: form.minOrderQuantity ? Number(form.minOrderQuantity) : undefined,
  maxOrderQuantity: form.maxOrderQuantity ? Number(form.maxOrderQuantity) : undefined,
  delivery:
    form.leadTimeWeeks || form.handoverMethod
      ? {
          leadTimeWeeks: form.leadTimeWeeks ? Number(form.leadTimeWeeks) : undefined,
          handoverMethod: form.handoverMethod || undefined,
        }
      : undefined,
});

const StatCard = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "—"}</p>
    {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
  </div>
);

const formatPriceLabel = (item) => {
  if (item.price == null) return "—";
  const currency = item.currency || "USD";
  const amount = typeof item.price === "number" ? item.price : Number(item.price) || 0;
  return currency + " " + amount.toLocaleString();
};

const MaterialTable = ({ items, loading, error, onEdit, onPublish, onDelete }) => {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading SKUs…</p>;
  }
  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }
  if (!items.length) {
    return <p className="text-sm text-slate-500">No SKUs listed yet. Create your first material to unlock Material Studio visibility.</p>;
  }
  return (
    <div className="overflow-auto rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Inventory</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((item) => (
            <tr key={item._id || item.id}>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{item.summary || item.description}</p>
              </td>
              <td className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">{item.status || "draft"}</td>
              <td className="px-4 py-3">{formatPriceLabel(item)}</td>
              <td className="px-4 py-3">{item.inventory != null ? item.inventory.toLocaleString?.() || item.inventory : "—"}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  {item.status !== "published" ? (
                    <button
                      type="button"
                      onClick={() => onPublish(item)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      <CloudUpload size={14} /> Publish
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MaterialForm = ({ form, onChange, onCancel, onSubmit, saving }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{form.id ? "Edit SKU" : "Add new SKU"}</h2>
        <p className="text-sm text-slate-500">Update marketplace-facing copy, pricing, and logistics.</p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
      >
        Cancel
      </button>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Title</span>
        <input
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Carbon-neutral concrete"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Price</span>
        <div className="flex gap-2">
          <input
            type="number"
            value={form.price}
            onChange={(event) => onChange({ ...form, price: event.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="120"
          />
          <input
            value={form.currency}
            onChange={(event) => onChange({ ...form, currency: event.target.value.toUpperCase() })}
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="USD"
          />
        </div>
      </label>
    </div>

    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">Summary</span>
      <textarea
        value={form.summary}
        onChange={(event) => onChange({ ...form, summary: event.target.value })}
        rows={3}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Describe use cases, sustainability, or finishes."
      />
    </label>

    <div className="grid gap-4 md:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Categories (comma separated)</span>
        <input
          value={form.categories}
          onChange={(event) => onChange({ ...form, categories: event.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Concrete, Structure"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Tags (comma separated)</span>
        <input
          value={form.tags}
          onChange={(event) => onChange({ ...form, tags: event.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Net-zero, Ready-mix"
        />
      </label>
    </div>

    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">Highlights (one per line)</span>
      <textarea
        value={form.highlights}
        onChange={(event) => onChange({ ...form, highlights: event.target.value })}
        rows={3}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Low-carbon binder\nShips worldwide"
      />
    </label>

    <div className="grid gap-4 md:grid-cols-3">
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Inventory</span>
        <input
          type="number"
          value={form.inventory}
          onChange={(event) => onChange({ ...form, inventory: event.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="500"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">MOQ</span>
        <input
          type="number"
          value={form.minOrderQuantity}
          onChange={(event) => onChange({ ...form, minOrderQuantity: event.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="50"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Lead time (weeks)</span>
        <input
          type="number"
          value={form.leadTimeWeeks}
          onChange={(event) => onChange({ ...form, leadTimeWeeks: event.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="4"
        />
      </label>
    </div>

    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">Handover method</span>
      <select
        value={form.handoverMethod}
        onChange={(event) => onChange({ ...form, handoverMethod: event.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">Select method</option>
        <option value="download">Download</option>
        <option value="email">Email</option>
        <option value="courier">Courier</option>
        <option value="onsite">On-site</option>
      </select>
    </label>

    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save SKU"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </button>
    </div>
  </section>
);

export default function VendorPortal() {
  const [profile, setProfile] = useState(null);
  const [materialsState, setMaterialsState] = useState({ loading: true, items: [], meta: {}, error: null });
  const [form, setForm] = useState(EMPTY_MATERIAL_FORM);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [onboardingState, setOnboardingState] = useState({ loading: true, data: null, error: null });
  const [workspaceState, setWorkspaceState] = useState({
    loading: true,
    error: null,
    servicePacks: [],
    meetings: [],
    planUploads: [],
    downloads: [],
    chats: [],
  });

  const refreshOnboarding = useCallback(async () => {
    setOnboardingState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const payload = await fetchVendorOnboarding();
      if (payload?.authRequired && !payload?.fallback) {
        setOnboardingState({
          loading: false,
          data: null,
          error: "Sign in to load onboarding progress",
        });
        return;
      }
      setOnboardingState({
        loading: false,
        data: payload,
        error: payload?.error || null,
      });
    } catch (error) {
      setOnboardingState({
        loading: false,
        data: null,
        error: error?.message || "Unable to load onboarding",
      });
    }
  }, []);

  const loadMaterials = async () => {
    setMaterialsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetchVendorMaterials();
      setMaterialsState({ loading: false, items: response.items || [], meta: response.meta || {}, error: null });
    } catch (error) {
      console.error('vendor_materials_load_error', error);
      setMaterialsState({ loading: false, items: [], meta: {}, error: error?.message || 'Unable to load SKUs' });
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    refreshOnboarding();
  }, [refreshOnboarding]);

  const refreshWorkspace = useCallback(async () => {
    setWorkspaceState({
      loading: false,
      error: "Dashboard workspace features have been removed.",
      servicePacks: [],
      meetings: [],
      planUploads: [],
      downloads: [],
      chats: [],
    });
  }, []);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const metaCards = useMemo(() => {
    const meta = materialsState.meta || {};
    return [
      { label: 'Published SKUs', value: meta.publishedCount ?? '—' },
      { label: 'Drafts', value: meta.draftCount ?? '—' },
      { label: 'Total SKUs', value: meta.total ?? materialsState.items.length },
      { label: 'Inventory units', value: meta.inventoryCount ?? '—' },
    ];
  }, [materialsState.meta, materialsState.items.length]);

  const workspaceServicePacks = workspaceState.servicePacks || [];
  const workspaceMeetings = workspaceState.meetings || [];
  const workspacePlanUploads = workspaceState.planUploads || [];
  const workspaceDownloads = workspaceState.downloads || [];
  const workspaceChats = workspaceState.chats || [];

  const openCreateForm = () => {
    setForm(EMPTY_MATERIAL_FORM);
    setFormVisible(true);
  };

  const handleEdit = (item) => {
    setForm(normaliseMaterialForm(item));
    setFormVisible(true);
  };

  const handlePublish = async (item) => {
    if (!window.confirm('Publish this SKU to Material Studio?')) return;
    try {
      await publishVendorMaterial(item._id || item.id);
      toast.success('SKU published');
      loadMaterials();
      refreshOnboarding();
    } catch (error) {
      console.error('sku_publish_error', error);
      toast.error(error?.message || 'Unable to publish SKU');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this SKU? This cannot be undone.')) return;
    try {
      await deleteVendorMaterial(item._id || item.id);
      toast.success('SKU deleted');
      loadMaterials();
      refreshOnboarding();
    } catch (error) {
      console.error('sku_delete_error', error);
      toast.error(error?.message || 'Unable to delete SKU');
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = materialFormToPayload(form);
      if (form.id) {
        await updateVendorMaterial(form.id, payload);
        toast.success('SKU updated');
      } else {
        await createVendorMaterial(payload);
        toast.success('SKU created');
      }
      setFormVisible(false);
      setForm(EMPTY_MATERIAL_FORM);
      loadMaterials();
      refreshOnboarding();
    } catch (error) {
      console.error('sku_save_error', error);
      toast.error(error?.message || 'Unable to save SKU');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <RegistrStrip />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            Material Studio
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-900">Vendor portal</h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Update your Material Studio profile, sync SKU data, and keep logistics signals fresh so procurement teams can route projects directly to you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
            <span>
              Need help? Email <a href="mailto:vendors@builtattic.com" className="font-semibold text-slate-900">vendors@builtattic.com</a>
            </span>
            <Link to="/warehouse" className="font-semibold text-slate-900 underline">View live Material Studio</Link>
          </div>
        </header>

        <VendorOnboardingChecklist
          data={onboardingState.data}
          loading={onboardingState.loading}
          error={onboardingState.error}
          onRefresh={refreshOnboarding}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metaCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <VendorProfileEditor
          onProfileUpdate={(nextProfile) => {
            setProfile(nextProfile);
            refreshOnboarding();
          }}
          header={(
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Vendor profile</p>
              <h2 className="text-2xl font-semibold text-slate-900">{profile?.companyName || 'Material Ops Collective'}</h2>
              <p className="text-sm text-slate-500">
                Sync your marketplace presence so buyers see the latest logistics signal, catalog highlights, and contact routes.
              </p>
            </div>
          )}
        />

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Workspace</p>
              <h2 className="text-lg font-semibold text-slate-900">Service packs, schedules & WD-W3</h2>
              <p className="text-sm text-slate-500">
                Publish fulfilment packs, coordinate syncs, and share WD-W3 downloads for Builtattic buyers.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
            >
              Dashboard removed
            </button>
          </div>
          {workspaceState.error ? (
            <p className="text-xs text-rose-600">{workspaceState.error}</p>
          ) : null}

          <ServicePackManager
            ownerType="firm"
            initialPacks={workspaceServicePacks}
            heading="Service packs"
            eyebrow="Client-ready bundles"
            description="Describe packaged scopes or onboarding bundles the marketplace team can route instantly."
            emptyMessage="No packs yet. Add at least one pack so ops understands how to engage your team."
          />

          <MeetingScheduler
            ownerType="firm"
            initialMeetings={workspaceMeetings}
            heading="Meeting schedule"
            eyebrow="Buyer syncs"
            description="Track procurement walk-throughs, onboarding calls, and delivery checkpoints."
            emptyMessage="No syncs logged yet �?? add one so ops can see your availability."
          />

          <PlanUploadPanel
            role="firm"
            workspaceName={profile?.companyName || "Vendor workspace"}
            initialPlans={workspacePlanUploads}
          />

          <DownloadCenter
            ownerType="firm"
            initialDownloads={workspaceDownloads}
            heading="Deliverable downloads"
            eyebrow="WD W3"
            description="Drop WD-W3 packets, encrypted zips, and walkthrough links for the marketplace ops team."
            emptyMessage="Publish a WD-W3 handoff so buyers know fulfilment is ready."
          />

          <ClientChatPanel
            ownerType="firm"
            initialChats={workspaceChats}
            heading="Client chat"
            eyebrow="Workspace thread"
            description="Log buyer questions and share updates without leaving the portal."
            emptyMessage="Start a thread the next time a buyer requests assets or scheduling help."
          />
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Catalog</p>
              <h2 className="text-lg font-semibold text-slate-900">Material SKUs</h2>
              <p className="text-sm text-slate-500">Published SKUs are discoverable inside Material Studio; drafts stay private.</p>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
            >
              <Plus size={16} /> Add SKU
            </button>
          </div>
          <MaterialTable
            items={materialsState.items}
            loading={materialsState.loading}
            error={materialsState.error}
            onEdit={handleEdit}
            onPublish={handlePublish}
            onDelete={handleDelete}
          />
        </section>

        {formVisible ? (
          <MaterialForm
            form={form}
            onChange={setForm}
            onCancel={() => {
              setFormVisible(false);
              setForm(EMPTY_MATERIAL_FORM);
            }}
            onSubmit={handleSubmit}
            saving={saving}
          />
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
