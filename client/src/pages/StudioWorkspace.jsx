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


const HeroStat = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-900 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold">{value ?? "-"}</p>
    {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
  </div>
);

const WorkspaceHero = ({ metaCards, onCreateStudio }) => (
  <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-slate-50 to-indigo-100 px-8 py-10 text-slate-900 shadow-xl ring-1 ring-slate-100">
    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end">
      <div className="flex-1 space-y-4">
        <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-500">
          Studio OS
        </span>
        <h1 className="text-3xl font-semibold sm:text-4xl">Design Studio workspace</h1>
        <p className="max-w-2xl text-base text-slate-600">
          Publish bundles, update your firm voice, and drop new concept packs without leaving the portal. Everything here
          syncs to the public Studio experience instantly after approval.
        </p>
      </div>
      <div className="flex flex-col gap-3 lg:w-[260px]">
        <button
          type="button"
          onClick={onCreateStudio}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          Launch a new studio
        </button>
        <Link
          to="/studio"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-white"
        >
          View public page
        </Link>
        <a
          href="mailto:studios@builtattic.com"
          className="text-center text-sm font-semibold text-slate-600 underline-offset-4 hover:underline"
        >
          Message studios@builtattic.com
        </a>
      </div>
    </div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metaCards.map((card) => (
        <HeroStat key={card.label} {...card} />
      ))}
    </div>
    <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-indigo-200/40 blur-[100px]" />
    <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-[150px]" />
  </section>
);

const QuickActionList = ({ onCreateStudio }) => {
  const actions = [
    {
      type: "button",
      label: "Draft a studio bundle",
      helper: "Spin up a new tile with hero, pricing, and gallery.",
      onClick: onCreateStudio,
    },
    {
      type: "anchor",
      label: "Update firm profile",
      helper: "Sync hero copy + services buyers see first.",
      href: "#firm-profile",
    },
    {
      type: "link",
      label: "Manage plan uploads",
      helper: "Push renders and plan packs from the dashboard.",
      to: "/dashboard/firm",
    },
    {
      type: "link",
      label: "Preview public Studio",
      helper: "Open the live experience buyers browse.",
      to: "/studio",
    },
  ];

  const renderAction = (action) => {
    const content = (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{action.label}</p>
          <p className="text-xs text-slate-500">{action.helper}</p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">Go</span>
      </div>
    );

    if (action.type === "button") {
      return (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-slate-300"
        >
          {content}
        </button>
      );
    }

    if (action.type === "anchor") {
      return (
        <a
          key={action.label}
          href={action.href}
          className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        key={action.label}
        to={action.to}
        className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
      >
        {content}
      </Link>
    );
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Quick actions</p>
      <div className="mt-4 space-y-2">{actions.map(renderAction)}</div>
    </section>
  );
};

const SyncSummaryCard = ({ planUploads = [], serviceBundles = [], draftCount = 0 }) => (
  <section className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5 text-slate-900 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">Workspace sync</p>
    <p className="mt-2 text-sm text-slate-600">Keep assets aligned so your marketplace placement stays fresh for buyers.</p>
    <dl className="mt-4 space-y-3">
      <div>
        <dt className="text-xs uppercase tracking-[0.35em] text-indigo-500">Plan uploads</dt>
        <dd className="text-xl font-semibold text-slate-900">{planUploads.length || 0}</dd>
        <p className="text-xs text-slate-500">Concept packs ready for promotion</p>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-[0.35em] text-indigo-500">Service bundles</dt>
        <dd className="text-xl font-semibold text-slate-900">{serviceBundles.length || 0}</dd>
        <p className="text-xs text-slate-500">Scopes synced to Design Studio</p>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-[0.35em] text-indigo-500">Draft studios</dt>
        <dd className="text-xl font-semibold text-slate-900">{draftCount ?? 0}</dd>
        <p className="text-xs text-slate-500">Publish-ready bundles</p>
      </div>
    </dl>
  </section>
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
          {item || "â€”"}
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
  if (!value) return "ï¿½";
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
      { label: "Total studios", value: meta.total ?? "â€”" },
      { label: "Published", value: meta.publishedCount ?? "â€”" },
      { label: "Drafts", value: meta.draftCount ?? "â€”" },
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
      return (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-500 shadow-sm">
          Loading studios...
        </div>
      );
    }
    if (studiosState.error) {
      return (
        <div className="rounded-3xl border border-rose-100 bg-white/95 p-6 text-sm text-rose-600 shadow-sm">
          {studiosState.error}
        </div>
      );
    }
    if (!studiosState.items.length) {
      return (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/90 p-8 text-center shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">No studio bundles yet</h3>
          <p className="text-sm text-slate-500">
            Launch your first Design Studio listing to unlock marketplace placement and shareable URLs.
          </p>
          <button
            type="button"
            onClick={() => openCreateForm('create')}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            <Plus size={14} /> Add studio
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-5">
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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <RegistrStrip />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
          <WorkspaceHero metaCards={metaCards} onCreateStudio={() => openCreateForm("create")} />

          {authState.required ? (
            <section className="rounded-[32px] border border-dashed border-amber-200 bg-white/95 p-10 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-500">Workspace locked</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Connect the demo workspace to upload designs</h2>
              <p className="mt-3 text-sm text-slate-500">
                Sign in with a demo token so your studios can be saved and rendered on the Design Studio page. No password
                required.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={authState.loading}
                  className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
                >
                  {authState.loading ? "Connecting..." : "Connect demo workspace"}
                </button>
                <button
                  type="button"
                  onClick={() => window.open('https://react.dev/link/react-devtools', '_blank')}
                  className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                >
                  Need help?
                </button>
              </div>
              {authState.error ? <p className="mt-4 text-sm text-rose-600">{authState.error}</p> : null}
            </section>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-8">
                <div id="firm-profile" className="scroll-mt-32 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Studio profile</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{profile?.name || "Design Studio profile"}</h2>
                    <p className="text-sm text-slate-500">Changes sync to Design Studio once approved.</p>
                  </div>
                  <div className="mt-6 rounded-2xl border border-slate-100/80 bg-slate-50/60 p-4">
                    <FirmProfileEditor
                      onProfileUpdate={(next) => setProfile(next)}
                      header={(
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Workspace identity</p>
                          <h3 className="text-xl font-semibold text-slate-900">Share your story</h3>
                          <p className="text-sm text-slate-500">Hero copy, services, and buyer proof update live pages.</p>
                        </div>
                      )}
                    />
                  </div>
                </div>

                <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Plan uploads</p>
                      <h2 className="text-xl font-semibold text-slate-900">Design assets ready for hosting</h2>
                      <p className="text-sm text-slate-500">Review concept packs synced from the Firm dashboard.</p>
                    </div>
                    <Link to="/dashboard/firm" className="text-xs font-semibold text-slate-900 underline">
                      Update from dashboard
                    </Link>
                  </div>

                  {planUploads.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/80 p-6 text-sm text-slate-500">
                      No plans synced yet.
                    </div>
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                      {planUploads.map((plan) => (
                        <article key={plan.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm space-y-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                              {plan.category || 'Category'}{plan.subtype ? ` · ${plan.subtype}` : ''}
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
                          <div className="space-y-1 text-xs text-slate-500">
                            <p>License: {plan.licenseType || 'n/a'} · Delivery: {plan.delivery || 'n/a'}</p>
                            <p>Assets: {plan.renderImages?.length || 0} renders {plan.walkthrough ? '· Walkthrough' : ''}</p>
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

                <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Service bundles</p>
                      <h2 className="text-xl font-semibold text-slate-900">Programs synced to Design Studio</h2>
                      <p className="text-sm text-slate-500">Hourly, weekly, and monthly scopes from your dashboard.</p>
                    </div>
                    <Link to="/dashboard/firm" className="text-xs font-semibold text-slate-900 underline">
                      Update from dashboard
                    </Link>
                  </div>

                  {serviceBundles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/80 p-6 text-sm text-slate-500">
                      No bundles available yet.
                    </div>
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                      {serviceBundles.map((bundle) => (
                        <article key={bundle.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm space-y-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{bundle.cadence || 'Cadence'}</p>
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
                          <div className="space-y-1 text-xs text-slate-500">
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

                <section id="catalog" className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Catalog</p>
                      <h2 className="text-xl font-semibold text-slate-900">Studio bundles</h2>
                      <p className="text-sm text-slate-500">Drafts stay private until you publish.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreateForm('create')}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                    >
                      <Plus size={16} /> Add studio
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Use the controls below to edit tiles and long-form detail pages.</p>
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
              </div>

              <aside className="space-y-5">
                <QuickActionList onCreateStudio={() => openCreateForm("create")} />
                <SyncSummaryCard
                  planUploads={planUploads}
                  serviceBundles={serviceBundles}
                  draftCount={studiosState.meta?.draftCount ?? 0}
                />
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
