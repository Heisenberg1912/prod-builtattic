import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Plus, Trash2, CloudUpload, RefreshCw, SlidersHorizontal, Search, Eye } from "lucide-react";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import { WorkspaceActions } from "../components/studio/WorkspaceHero.jsx";
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
import useWorkspaceCollectionsSync from "../hooks/useWorkspaceCollections.js";

const FirmProfileEditor = lazy(() => import("../components/studio/FirmProfileEditor.jsx"));
const StudioForm = lazy(() => import("../components/studio/StudioForm.jsx"));

const formatSqft = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return `${numeric.toLocaleString()} sq ft`;
};

const formatRate = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value ?? "-";
  return `$${numeric.toLocaleString()}`;
};

const ChipRow = ({ items = [] }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <span className="text-sm text-slate-500">None yet</span>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.filter(Boolean).map((item) => (
        <span
          key={item.id || item.label || item.name || item}
          className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
        >
          {item.label || item.name || item}
        </span>
      ))}
    </div>
  );
};

const StudioWorkbenchCard = ({
  studio,
  onEditTile,
  onEditListing,
  onPublish,
  onDelete,
}) => {
  const hero = studio?.heroImage || studio?.image || (studio?.gallery || [])[0] || "";
  const price =
    studio?.pricing?.basePrice ||
    studio?.pricing?.total ||
    studio?.price ||
    studio?.priceSqft ||
    null;
  const priceLabel = price != null && Number.isFinite(Number(price))
    ? `$${Number(price).toLocaleString()}`
    : price || "Add pricing";
  const status = (studio?.status || "draft").toUpperCase();
  const lastUpdated = studio?.updatedAt
    ? new Date(studio.updatedAt).toLocaleDateString()
    : "-";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative bg-slate-100">
          {hero ? (
            <img src={hero} alt={studio?.title || "Studio hero"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">Add a hero image</div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow">
            {status}
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">{studio?.title || "Untitled studio"}</h3>
              <p className="text-sm text-slate-600 line-clamp-2">
                {studio?.summary || studio?.description || "Add a short summary to help reviewers."}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {studio?.categories?.slice?.(0, 2)?.map((category) => (
                  <span key={category} className="rounded-full bg-slate-100 px-3 py-1 font-semibold">{category}</span>
                ))}
                {studio?.style ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Style: {studio.style}</span>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-slate-900">{priceLabel}</p>
              <p className="text-xs text-slate-500">Updated {lastUpdated}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {studio?.areaSqft ? <span className="rounded-full bg-slate-50 px-3 py-1">Area: {formatSqft(studio.areaSqft)}</span> : null}
            {studio?.plotAreaSqft ? <span className="rounded-full bg-slate-50 px-3 py-1">Plot: {formatSqft(studio.plotAreaSqft)}</span> : null}
            {studio?.practiceBadges?.length ? (
              studio.practiceBadges.slice(0, 2).map((badge) => (
                <span key={badge} className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{badge}</span>
              ))
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <button
              type="button"
              onClick={() => onEditTile?.(studio)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Edit tile
            </button>
            <button
              type="button"
              onClick={() => onEditListing?.(studio)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Edit detail page
            </button>
            <button
              type="button"
              onClick={() => onPublish?.(studio)}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:border-emerald-300"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(studio)}
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:border-rose-300"
            >
              Delete
            </button>
            {studio?.slug ? (
              <Link
                to={`/studio/${studio.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                <Eye size={14} /> View live
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

const StudioToolbar = ({
  counts,
  status,
  onStatusChange,
  sortBy,
  onSortChange,
  query,
  onQueryChange,
  onRefresh,
  loading,
  onAdd,
}) => {
  const filters = [
    { key: "all", label: "All", count: counts.all },
    { key: "published", label: "Published", count: counts.published },
    { key: "draft", label: "Drafts", count: counts.draft },
  ];
  return (
    <section className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Studio catalog</p>
          <h2 className="text-xl font-semibold text-slate-900">Manage listings and detail pages</h2>
          <p className="text-sm text-slate-500">Filter by status, sort updates, and jump into edit flows faster.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
          >
            <Eye size={14} /> Preview public page
          </Link>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            <Plus size={16} /> Add studio
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const active = status === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => onStatusChange(filter.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>{filter.label}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by title, tag, or style"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:border-slate-300 focus:outline-none"
            >
              <option value="updated">Recently updated</option>
              <option value="title">Name A-Z</option>
              <option value="price">Highest price</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
};

const SyncSummaryCard = ({ planUploads = [], serviceBundles = [], draftCount = 0 }) => {
  const stats = [
    { label: "Plan uploads", value: planUploads.length, helper: "Ready to attach" },
    { label: "Service bundles", value: serviceBundles.length, helper: "Sync to tiles" },
    { label: "Draft tiles", value: draftCount, helper: "Publish to go live" },
  ];
  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Sync status</p>
        <h3 className="text-lg font-semibold text-slate-900">Workspace summary</h3>
        <p className="text-sm text-slate-500">Keep these green to stay featured on the marketplace.</p>
      </div>
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
              <p className="text-[11px] text-slate-500">{stat.helper}</p>
            </div>
            <span className="text-lg font-semibold text-slate-900">{stat.value ?? 0}</span>
          </div>
        ))}
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
  const [collections] = useWorkspaceCollectionsSync("firm");
  const [formIntent, setFormIntent] = useState(null);
  const initialEditSlug = useMemo(() => new URLSearchParams(location.search).get('edit'), [location.search]);
  const [pendingEditSlug, setPendingEditSlug] = useState(initialEditSlug);
  const [studioFilter, setStudioFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [query, setQuery] = useState("");

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

  const studioCounts = useMemo(() => {
    const items = studiosState.items || [];
    let published = 0;
    let draft = 0;
    items.forEach((studio) => {
      const status = String(studio?.status || "").toLowerCase();
      if (status === "published") {
        published += 1;
      } else {
        draft += 1;
      }
    });
    return { all: items.length, published, draft };
  }, [studiosState.items]);

  const filteredStudios = useMemo(() => {
    const items = studiosState.items || [];
    const statusFilter = studioFilter;
    const q = query.trim().toLowerCase();

    const filtered = items.filter((studio) => {
      const status = String(studio?.status || "").toLowerCase();
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && status === "published") ||
        (statusFilter === "draft" && status !== "published");

      const target = [
        studio?.title,
        studio?.summary,
        studio?.style,
        ...(studio?.categories || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || target.includes(q);
      return matchesStatus && matchesQuery;
    });

    const sorter = (() => {
      if (sortBy === "title") {
        return (a, b) => (a?.title || "").localeCompare(b?.title || "");
      }
      if (sortBy === "price") {
        const value = (studio) => {
          const raw =
            studio?.pricing?.basePrice ||
            studio?.pricing?.total ||
            studio?.price ||
            studio?.priceSqft ||
            0;
          return Number(raw) || 0;
        };
        return (a, b) => value(b) - value(a);
      }
      return (a, b) => {
        const aDate = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bDate = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bDate - aDate;
      };
    })();

    return filtered.slice().sort(sorter);
  }, [studiosState.items, studioFilter, sortBy, query]);

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
    const tempUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, heroImage: tempUrl }));
    setUploading((prev) => ({ ...prev, hero: true }));
    try {
      const { url, previewUrl } = await uploadStudioAsset(file, { kind: 'preview', secure: false });
      const resolved = previewUrl || url;
      if (!resolved) throw new Error('Upload did not return a URL');
      setForm((prev) => ({ ...prev, heroImage: resolved }));
      toast.success('Hero image uploaded');
      URL.revokeObjectURL(tempUrl);
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
          const { url, previewUrl } = await uploadStudioAsset(file, { kind: 'preview', secure: false });
          const resolved = previewUrl || url;
          if (resolved) uploaded.push(resolved);
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
    if (!filteredStudios.length) {
      return (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/90 p-8 text-center shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">No results for this view</h3>
          <p className="text-sm text-slate-500">
            Try clearing filters or searching a different keyword.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStudioFilter("all");
                setQuery("");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
            >
              Reset filters
            </button>
            <button
              type="button"
              onClick={() => openCreateForm('create')}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
            >
              <Plus size={14} /> Add studio
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        {filteredStudios.map((studio) => (
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <RegistrStrip />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-screen-2xl space-y-12 px-4 py-14 sm:px-8 lg:px-12">
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
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-10">
                <StudioToolbar
                  counts={studioCounts}
                  status={studioFilter}
                  onStatusChange={setStudioFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  query={query}
                  onQueryChange={setQuery}
                  onRefresh={loadStudios}
                  loading={studiosState.loading}
                  onAdd={() => openCreateForm("create")}
                />
                <div id="firm-profile" className="scroll-mt-32 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Studio profile</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{profile?.name || "Design Studio profile"}</h2>
                    <p className="text-sm text-slate-500">Changes sync to Design Studio once approved.</p>
                  </div>
                  <div className="mt-6 rounded-2xl border border-slate-100/80 bg-slate-50/60 p-4">
                    <Suspense
                      fallback={
                        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
                          Loading firm profile editor...
                        </div>
                      }
                    >
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
                    </Suspense>
                  </div>
                </div>

                <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Plan uploads</p>
                      <h2 className="text-xl font-semibold text-slate-900">Design assets ready for hosting</h2>
                      <p className="text-sm text-slate-500">Review concept packs synced from the studio workspace.</p>
                    </div>
                    <Link to="/portal/studio" className="text-xs font-semibold text-slate-900 underline">
                      Update from workspace
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
                      <p className="text-sm text-slate-500">Hourly, weekly, and monthly scopes from your workspace.</p>
                    </div>
                    <Link to="/portal/studio" className="text-xs font-semibold text-slate-900 underline">
                      Update from workspace
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
                  <Suspense
                    fallback={
                      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
                        Loading studio form…
                      </div>
                    }
                  >
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
                  </Suspense>
                ) : null}
              </div>

              <aside className="space-y-5">
                <WorkspaceActions onCreateStudio={() => openCreateForm("create")} />
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
