import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, CloudUpload } from "lucide-react";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import FirmProfileEditor from "../components/studio/FirmProfileEditor.jsx";
import StudioForm from "../components/studio/StudioForm.jsx";
import {
  fetchFirmStudios,
  createFirmStudio,
  updateFirmStudio,
  publishFirmStudio,
  deleteFirmStudio,
} from "../services/portal.js";
import { EMPTY_STUDIO_FORM, mapStudioToForm, studioFormToPayload } from "../utils/studioForm.js";
import { uploadStudioAsset } from "../services/uploads.js";
import { loginAsDemo } from "../services/auth.js";
import {
  getWorkspaceCollections,
  subscribeToWorkspaceRole,
  WORKSPACE_SYNC_STORAGE_KEY,
} from "../utils/workspaceSync.js";


const StatCard = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "—"}</p>
    {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
  </div>
);

const formatCurrency = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toLocaleString()}`;
  }
};

const formatSqft = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return `${numeric.toLocaleString()} sq ft`;
};

const formatRate = (value, currency = "USD", unit = "sq ft") => {
  const formatted = formatCurrency(value, currency);
  if (!formatted) return null;
  return unit ? `${formatted} / ${unit}` : formatted;
};

const ChipRow = ({ items, placeholder = "Add details from dashboard" }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <span className="text-xs text-slate-400">{placeholder}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, index) => (
        <span
          key={`${item || "item"}-${index}`}
          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
        >
          {item || "—"}
        </span>
      ))}
    </div>
  );
};


const resolveHeroImage = (studio) => {
  if (studio?.heroImage) return studio.heroImage;
  if (Array.isArray(studio?.gallery) && studio.gallery.length) return studio.gallery[0];
  if (typeof studio?.gallery === "string" && studio.gallery.trim()) {
    const first = studio.gallery
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find(Boolean);
    if (first) return first;
  }
  if (Array.isArray(studio?.images) && studio.images.length) return studio.images[0];
  return null;
};

const formatUpdatedAt = (value) => {
  if (!value) return "�";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const GuideCard = ({ title, body, helper, actionLabel, onAction }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Workflow</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
    </div>
    <p className="text-sm text-slate-600">{body}</p>
    {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    {onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
      >
        {actionLabel || "Start"}
      </button>
    ) : null}
  </article>
);

const WorkspaceGuide = ({ onCreateStudio }) => (
  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <GuideCard
      title="Listing tile"
      body="Hero image, summary, and quick stats surface in every marketplace tile."
      helper='Use the "Edit listing tile" button on any studio below to refresh it.'
    />
    <GuideCard
      title="Detail page"
      body="Long-form copy, gallery assets, and delivery notes convince buyers to reach out."
      helper='Open "Edit listing page" to update programs, specs, and CTA copy.'
    />
    <GuideCard
      title="New bundle"
      body="Create a fresh studio bundle when you want a brand-new tile + detail page."
      actionLabel="Add studio"
      onAction={onCreateStudio}
    />
  </section>
);

const StudioWorkbenchCard = ({ studio, onEditTile, onEditListing, onPublish, onDelete }) => {
  const heroImage = resolveHeroImage(studio);
  const previewHref = studio?.slug ? `/studio/${studio.slug}` : null;
  const priceLabel =
    studio?.price != null
      ? formatCurrency(studio.price, studio.currency || studio.pricing?.currency || "USD")
      : null;
  const statusLabel = (studio?.status || "draft").toUpperCase();
  const updatedLabel = formatUpdatedAt(studio?.updatedAt);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{statusLabel}</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{studio?.title || "Untitled studio"}</h3>
          <p className="text-sm text-slate-600">{studio?.summary || studio?.description || "Add a short summary to help buyers"}</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          {priceLabel ? <p className="text-base font-semibold text-slate-900">{priceLabel}</p> : <p className="text-base text-slate-400">Set pricing</p>}
          <p className="text-xs">Updated {updatedLabel}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Listing tile</p>
            <p className="text-sm text-slate-600">Controls the card buyers see in search, recommendations, and dashboards.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEditTile(studio)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-800"
            >
              <Pencil size={14} /> Edit listing tile
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Listing page</p>
            <p className="text-sm text-slate-600">Update gallery, story, service programs, and CTA copy on the public detail page.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEditListing(studio)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-900 hover:border-slate-300"
            >
              <Pencil size={14} /> Edit listing page
            </button>
            {previewHref ? (
              <Link
                to={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
              >
                View live page
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onPublish(studio)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-slate-400"
        >
          <CloudUpload size={14} /> Publish updates
        </button>
        <button
          type="button"
          onClick={() => onDelete(studio)}
          className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-rose-600 hover:border-rose-300"
        >
          <Trash2 size={14} /> Delete draft
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] items-start">
        <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Notes</p>
          <p className="mt-1 text-sm text-slate-600">
            {studio?.notes || 'Keep programs, delivery notes, and catalogue pricing aligned with your buyer messaging.'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
          {heroImage ? (
            <img src={heroImage} alt={studio?.title || 'Studio hero'} className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-slate-500">
              Upload a hero image to preview your tile
            </div>
          )}
        </div>
      </div>
    </article>
  );
};


export default function StudioWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [studiosState, setStudiosState] = useState({ loading: true, items: [], meta: {}, error: null });
  const [form, setForm] = useState(EMPTY_STUDIO_FORM);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const heroFileInputRef = useRef(null);
  const galleryFileInputRef = useRef(null);
  const [uploading, setUploading] = useState({ hero: false, gallery: false });
  const [authState, setAuthState] = useState({ required: false, loading: false, error: null });
  const [collections, setCollections] = useState(() => getWorkspaceCollections('firm'));
  const [formIntent, setFormIntent] = useState(null);
  const initialEditSlug = useMemo(() => new URLSearchParams(location.search).get('edit'), [location.search]);
  const [pendingEditSlug, setPendingEditSlug] = useState(initialEditSlug);

  const loadStudios = async () => {
    setStudiosState((prev) => ({ ...prev, loading: true }));
    setAuthState((prev) => ({ ...prev, required: false, error: null }));
    try {
      const response = await fetchFirmStudios();
      setStudiosState({ loading: false, items: response.items || [], meta: response.meta || {}, error: null });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setAuthState({ required: true, loading: false, error: null });
        setStudiosState((prev) => ({ ...prev, loading: false, error: null }));
        return;
      }
      setStudiosState((prev) => ({ ...prev, loading: false, error: error?.message || "Unable to load studios" }));
    }
  };

  useEffect(() => {
    loadStudios();
  }, []);

  useEffect(() => {
    setPendingEditSlug(initialEditSlug);
  }, [initialEditSlug]);

  useEffect(() => {
    if (!pendingEditSlug || studiosState.loading || !studiosState.items.length) return;
    const match = studiosState.items.find((studio) => {
      const slug = studio.slug || studio._id || studio.id;
      return slug === pendingEditSlug;
    });
    if (match) {
      setForm(mapStudioToForm(match));
      setFormIntent(null);
      setFormVisible(true);
      setPendingEditSlug(null);
      navigate(location.pathname, { replace: true });
    } else if (!studiosState.loading) {
      toast.error('Studio not found in this workspace');
      setPendingEditSlug(null);
      navigate(location.pathname, { replace: true });
    }
  }, [pendingEditSlug, studiosState.loading, studiosState.items, navigate, location.pathname]);

  const metaCards = useMemo(() => {
    const meta = studiosState.meta || {};
    return [
      { label: "Total studios", value: meta.total ?? "—" },
      { label: "Published", value: meta.publishedCount ?? "—" },
      { label: "Drafts", value: meta.draftCount ?? "—" },
    ];
  }, [studiosState.meta]);

  const openCreateForm = (intent = 'create') => {
    setFormIntent(intent);
    setForm(EMPTY_STUDIO_FORM);
    setFormVisible(true);
  };

  const handleEdit = (studio, intent = null) => {
    setFormIntent(intent);
    setForm(mapStudioToForm(studio));
    setFormVisible(true);
  };

  const handleEditTile = (studio) => handleEdit(studio, 'tile');
  const handleEditListing = (studio) => handleEdit(studio, 'detail');

  const handlePublish = async (studio) => {
    if (!window.confirm("Publish this studio?")) return;
    try {
      await publishFirmStudio(studio._id || studio.id);
      toast.success("Studio published");
      loadStudios();
    } catch (error) {
      toast.error(error?.message || "Unable to publish studio");
    }
  };

  const handleDelete = async (studio) => {
    if (!window.confirm("Delete this studio?")) return;
    try {
      await deleteFirmStudio(studio._id || studio.id);
      toast.success("Studio deleted");
      loadStudios();
    } catch (error) {
      toast.error(error?.message || "Unable to delete studio");
    }
  };

  const handleHeroUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, hero: true }));
    try {
      const { url } = await uploadStudioAsset(file, { kind: 'preview', secure: false });
      if (!url) throw new Error('Upload did not return a URL');
      setForm((prev) => ({ ...prev, heroImage: url }));
      toast.success('Hero image uploaded');
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Unable to upload hero image');
    } finally {
      setUploading((prev) => ({ ...prev, hero: false }));
      if (event?.target) event.target.value = '';
    }
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading((prev) => ({ ...prev, gallery: true }));
    try {
      const uploaded = [];
      for (const file of files) {
        const { url } = await uploadStudioAsset(file, { kind: 'preview', secure: false });
        if (url) uploaded.push(url);
      }
      if (uploaded.length) {
        setForm((prev) => ({
          ...prev,
          gallery: [prev.gallery, uploaded.join('\n')].filter(Boolean).join('\n'),
        }));
        toast.success(
          `Added ${uploaded.length} gallery ${uploaded.length === 1 ? 'image' : 'images'}`
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Unable to upload gallery images');
    } finally {
      setUploading((prev) => ({ ...prev, gallery: false }));
      if (event?.target) event.target.value = '';
    }
  };

  const handleDemoLogin = async () => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { token, user } = await loginAsDemo();
      localStorage.setItem('auth_token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      toast.success('Demo workspace connected');
      setAuthState({ required: false, loading: false, error: null });
      loadStudios();
    } catch (error) {
      const message = error?.message || 'Unable to start demo session';
      toast.error(message);
      setAuthState({ required: true, loading: false, error: message });
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = studioFormToPayload(form);
      if (form.id) {
        await updateFirmStudio(form.id, payload);
        toast.success("Studio updated");
      } else {
        await createFirmStudio(payload);
        toast.success("Studio created");
      }
      setFormVisible(false);
      setFormIntent(null);
      setForm(EMPTY_STUDIO_FORM);
      loadStudios();
    } catch (error) {
      toast.error(error?.message || "Unable to save studio");
    } finally {
      setSaving(false);
    }
  };

  const renderStudios = () => {
    if (studiosState.loading) {
      return <p className="text-sm text-slate-500">Loading studios...</p>;
    }
    if (studiosState.error) {
      return <p className="text-sm text-rose-600">{studiosState.error}</p>;
    }
    if (!studiosState.items.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 space-y-3">
          <p>No studios yet. Publish your first Design Studio bundle to unlock marketplace placement.</p>
          <button
            type="button"
            onClick={() => openCreateForm('create')}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
          >
            <Plus size={14} /> Add studio
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {studiosState.items.map((studio) => (
          <StudioWorkbenchCard
            key={studio._id || studio.id || studio.slug}
            studio={studio}
            onEditTile={handleEditTile}
            onEditListing={handleEditListing}
            onPublish={handlePublish}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  const planUploads = collections.planUploads || [];
  const serviceBundles = collections.serviceBundles || [];

  useEffect(() => {
    const unsubscribe = subscribeToWorkspaceRole('firm', setCollections);
    const handleStorage = (event) => {
      if (event.key === WORKSPACE_SYNC_STORAGE_KEY) {
        setCollections(getWorkspaceCollections('firm'));
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }
    return () => {
      unsubscribe?.();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <RegistrStrip />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            Design Studio
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-900">Studio workspace</h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Manage your Design Studio profile, publish studio bundles, and keep marketplace signals fresh for buyers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
            <span>
              Need help? Email <a href="mailto:studios@builtattic.com" className="font-semibold text-slate-900">studios@builtattic.com</a>
            </span>
            <Link to="/studio" className="font-semibold text-slate-900 underline">
              View live Design Studio
            </Link>
          </div>
        </header>

        {authState.required ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Workspace locked</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Connect the demo workspace to upload designs</h2>
            <p className="mt-3 text-sm text-slate-500">
              Sign in with a demo token so your studios can be saved to the Mongo cluster and rendered on the Design Studio
              page. No password required.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={authState.loading}
                className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {authState.loading ? "Connecting..." : "Connect demo workspace"}
              </button>
              <button
                type="button"
                onClick={() => window.open('https://react.dev/link/react-devtools', '_blank')}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Need help?
              </button>
            </div>
            {authState.error ? <p className="mt-3 text-sm text-rose-600">{authState.error}</p> : null}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metaCards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>

            <FirmProfileEditor
              onProfileUpdate={(next) => setProfile(next)}
              header={(
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Studio profile</p>
                  <h2 className="text-2xl font-semibold text-slate-900">{profile?.name || "Design Studio profile"}</h2>
                  <p className="text-sm text-slate-500">Changes sync to Design Studio once approved.</p>
                </div>
              )}
            />


            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Plan upload</p>
                  <h2 className="text-lg font-semibold text-slate-900">Design assets ready for hosting</h2>
                  <p className="text-sm text-slate-500">Review concept packs synced from the Firm dashboard.</p>
                </div>
                <Link to="/dashboard/firm" className="text-xs font-semibold text-slate-900 underline">
                  Update from dashboard
                </Link>
              </div>
              {planUploads.length === 0 ? (
                <p className="text-sm text-slate-500">No plans synced yet.</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {planUploads.map((plan) => (
                    <article key={plan.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                          {plan.category || 'Category'}{plan.subtype ? ` � ${plan.subtype}` : ''}
                        </p>
                        <h3 className="text-base font-semibold text-slate-900">{plan.projectTitle || "Untitled plan"}</h3>
                        <p className="text-sm text-slate-500">{plan.primaryStyle || "Add a primary style"}</p>
                      </div>
                      <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Area</dt>
                          <dd>{formatSqft(plan.areaSqft)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Floors</dt>
                          <dd>{Number(plan.floors) || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Design rate</dt>
                          <dd>{formatRate(plan.designRate)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Construction</dt>
                          <dd>{formatRate(plan.constructionCost)}</dd>
                        </div>
                      </dl>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p>License: {plan.licenseType || 'n/a'} � Delivery: {plan.delivery || 'n/a'}</p>
                        <p>Assets: {plan.renderImages?.length || 0} renders {plan.walkthrough ? '� Walkthrough' : ''}</p>
                        {plan.conceptPlan ? (
                          <a href={plan.conceptPlan} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                            Open concept plan
                          </a>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Materials</p>
                        <ChipRow items={plan.materials} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Service bundles</p>
                  <h2 className="text-lg font-semibold text-slate-900">Programs synced to Design Studio</h2>
                  <p className="text-sm text-slate-500">Hourly, weekly, and monthly scopes from your dashboard.</p>
                </div>
                <Link to="/dashboard/firm" className="text-xs font-semibold text-slate-900 underline">
                  Update from dashboard
                </Link>
              </div>
              {serviceBundles.length === 0 ? (
                <p className="text-sm text-slate-500">No bundles available yet.</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {serviceBundles.map((bundle) => (
                    <article key={bundle.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{bundle.cadence || 'Cadence'}</p>
                        <h3 className="text-base font-semibold text-slate-900">{bundle.bundleName || 'Unnamed bundle'}</h3>
                        <p className="text-sm text-slate-500">{bundle.scope || 'Scope pending'}</p>
                      </div>
                      <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Price</dt>
                          <dd>{bundle.price && Number.isFinite(Number(bundle.price)) ? `$${Number(bundle.price).toLocaleString()}` : bundle.price || 'Custom'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Turnaround</dt>
                          <dd>{bundle.turnaroundTime || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">File format</dt>
                          <dd>{bundle.fileFormat || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Skill level</dt>
                          <dd>{bundle.skillLevel || '-'}</dd>
                        </div>
                      </dl>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p>Revisions: {bundle.revisionsAllowed || 'n/a'}</p>
                        <p>Deliverables: {bundle.deliverables?.length || 0}</p>
                        {bundle.references?.length ? <p>References: {bundle.references.join(', ')}</p> : null}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Deliverables</p>
                        <ChipRow items={bundle.deliverables} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Catalog</p>
                  <h2 className="text-lg font-semibold text-slate-900">Studio bundles</h2>
                  <p className="text-sm text-slate-500">Drafts stay private until you publish.</p>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateForm('create')}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                >
                  <Plus size={16} /> Add studio
                </button>
              </div>

              <WorkspaceGuide onCreateStudio={() => openCreateForm('create')} />

              {renderStudios()}
            </section>

            {formVisible ? (
              <StudioForm
                form={form}
                onChange={setForm}
                onCancel={() => {
                  setFormVisible(false);
                  setFormIntent(null);
                  setForm(EMPTY_STUDIO_FORM);
                }}
                onSubmit={handleSubmit}
                saving={saving}
                onHeroUpload={handleHeroUpload}
                onGalleryUpload={handleGalleryUpload}
                uploading={uploading}
                heroFileInputRef={heroFileInputRef}
                galleryFileInputRef={galleryFileInputRef}
                intent={formIntent}
              />
            ) : null}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

