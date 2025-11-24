import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { logout as performLogout, readStoredUser } from "../../services/auth.js";
import {
  Search,
  Users,
  Building2,
  Briefcase,
  ShoppingCart,
  UserCog,
  LayoutDashboard,
  DollarSign,
  Plus,
  Menu,
  X,
  RefreshCw,
  Database,
  Inbox,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import {
  fetchAdminUsers,
  fetchCatalog,
  fetchFirms,
  fetchDbOverview,
  fetchAdminDataResources,
  fetchAdminDataItems,
  createAdminDataItem,
  updateAdminDataItem,
  deleteAdminDataItem,
  inviteAdminUser,
  resetAdminUserPassword,
  updateAdminUser,
  deleteAdminUser,
  fetchAdminStudioRequests,
  clearMarketplaceCache,
} from "../../services/marketplace.js";
import {
  createDummyEntry,
  deleteDummyEntry,
  fetchAdminDummyCatalog,
  invalidateDummyCatalogCache,
  DUMMY_TYPES,
} from "../../services/dummyCatalog.js";

// Sidebar config
const sidebarItems = [
  { id: "Dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "Users", label: "Users", icon: <Users size={18} /> },
  { id: "Associates", label: "Associates", icon: <UserCog size={18} /> },
  { id: "Firms", label: "Firms", icon: <Building2 size={18} /> },
  { id: "Clients", label: "Clients", icon: <Briefcase size={18} /> },
  { id: "Marketplace", label: "Marketplace", icon: <ShoppingCart size={18} /> },
  { id: "Control", label: "Control Center", icon: <SlidersHorizontal size={18} /> },
  { id: "Data", label: "Data Explorer", icon: <Database size={18} /> },
];

const formatCurrency = (amount, currency = "USD") => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "--";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
};

const formatBytes = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "--";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const sized = value / 1024 ** index;
  return `${sized.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDuration = (seconds) => {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return "--";
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.round(value)}s`;
};

const formatDate = (input) => {
  if (!input) return "--";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatRelativeTime = (input) => {
  if (!input) return "Not synced";
  const timestamp = typeof input === "number" ? input : new Date(input).getTime();
  if (Number.isNaN(timestamp)) return "Not synced";
  const diff = Date.now() - timestamp;
  if (diff < 0) return "Just now";
  if (diff < 15_000) return "Just now";
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return new Date(timestamp).toLocaleString();
};

const resolveUserRole = (user) => {
  if (!user) return "User";
  const globals = user.rolesGlobal || [];
  if (globals.includes("superadmin")) return "Super Admin";
  if (globals.includes("admin")) return "Admin";
  const membershipRole = user.memberships?.[0]?.role;
  if (membershipRole === "owner" || membershipRole === "admin") return "Vendor";
  if (membershipRole === "associate") return "Associate";
  return user.isClient === false ? "User" : "Client";
};

const dummyTypeLabels = {
  [DUMMY_TYPES.DESIGN]: 'Design Studio',
  [DUMMY_TYPES.SKILL]: 'Skill Studio',
  [DUMMY_TYPES.MATERIAL]: 'Material Studio',
};

const DUMMY_SEED_PRESETS = {
  [DUMMY_TYPES.DESIGN]: [
    {
      title: 'Savanna Courtyard Lab',
      summary: 'Indoor-outdoor residential lab that bridges vernacular courtyards with modular timber labs.',
      price: '420000',
      priceSqft: '18',
      firmName: 'Field Atlas',
      country: 'Kenya',
      style: 'Tropical modern',
      tags: 'Passive,Prefabricated,Hospitality',
      heroImage: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Cascading Cliff Studio',
      summary: 'Split-level live/work terraces perched on basalt outcrops with wraparound winter gardens.',
      price: '690000',
      priceSqft: '26',
      firmName: 'Northwind Works',
      country: 'Norway',
      style: 'Scandinavian minimal',
      tags: 'Modular,Low carbon,Wellness',
      heroImage: 'https://images.unsplash.com/photo-1505692794400-1c77e24b84f9?auto=format&fit=crop&w=1000&q=80',
    },
    {
      title: 'Desert Lantern Habitat',
      summary: 'Earthen vault cluster glowing at dusk; kit-of-parts for boutique hospitality pods.',
      price: '310000',
      priceSqft: '15',
      firmName: 'Atelier Meridian',
      country: 'UAE',
      style: 'Neo desert',
      tags: 'Earthen,Hospitality,Modular',
      heroImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
    },
  ],
  [DUMMY_TYPES.SKILL]: [
    {
      name: 'Maya Srinivasan',
      title: 'Computational Designer',
      hourly: '85',
      skills: 'Grasshopper,Rhino.Inside,ESRI,Python',
      languages: 'English,Hindi',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      location: 'Bengaluru / Remote',
      availability: '2 BIM sprints open',
    },
    {
      name: 'Leo Martinez',
      title: 'Fabrication Lead',
      hourly: '95',
      skills: 'Revit,Inventor,CNC programming,Shopbot',
      languages: 'English,Spanish',
      avatar: 'https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?auto=format&fit=crop&w=400&q=80',
      location: 'Austin, TX',
      availability: 'Night-shift workshop',
    },
    {
      name: 'Hana Kobayashi',
      title: 'Material Researcher',
      hourly: '70',
      skills: 'LCA,Sourcing,Material passports,Storytelling',
      languages: 'English,Japanese',
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80',
      location: 'Tokyo / Hybrid',
      availability: 'Research retainer slots',
    },
  ],
  [DUMMY_TYPES.MATERIAL]: [
    {
      title: 'Charred cedar siding kit',
      category: 'Cladding',
      price: '32',
      unit: 'sq ft',
      vendor: 'Studio Tanso',
      heroImage: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Recycled terrazzo slab',
      category: 'Surfaces',
      price: '54',
      unit: 'sq ft',
      vendor: 'Loop Materials',
      heroImage: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Acoustic felt fins',
      category: 'Ceiling systems',
      price: '120',
      unit: 'linear ft',
      vendor: 'Quiet Layers',
      heroImage: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80',
    },
  ],
};

const pickRandomSeed = (type) => {
  const pool = DUMMY_SEED_PRESETS[type] || [];
  if (!pool.length) return null;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
};

const CONTROL_RESOURCE_CONFIG = [
  { key: 'products', resource: 'products', label: 'Marketplace listings', statusField: 'status', statusOptions: ['published', 'draft'] },
  { key: 'servicepacks', resource: 'servicepacks', label: 'Service packs', statusField: 'status', statusOptions: ['published', 'draft'] },
  { key: 'workspacedownloads', resource: 'workspacedownloads', label: 'Workspace downloads', statusField: 'status', statusOptions: ['released', 'processing', 'draft', 'failed'] },
  { key: 'workspacechats', resource: 'workspacechats', label: 'Workspace chats', statusField: 'status', statusOptions: ['open', 'resolved'] },
  { key: 'meetingschedules', resource: 'meetingschedules', label: 'Meetings', statusField: 'status', statusOptions: ['scheduled', 'completed', 'cancelled'] },
  { key: 'leads', resource: 'leads', label: 'Leads', statusField: 'status', statusOptions: ['new', 'contacted', 'proposal', 'won', 'lost'] },
  { key: 'studiorequests', resource: 'studiorequests', label: 'Studio requests', statusField: 'status', statusOptions: ['new', 'in-progress', 'responded', 'archived'] },
  { key: 'planuploads', resource: 'planuploads', label: 'Plan uploads', deletable: true },
  { key: 'accessrequests', resource: 'accessrequests', label: 'Access requests', deletable: true },
  { key: 'ratings', resource: 'ratings', label: 'Ratings', deletable: true },
  { key: 'vitruviusages', resource: 'vitruviusages', label: 'Vitruvi usage', deletable: false },
];

const CONTROL_RESOURCE_INDEX = CONTROL_RESOURCE_CONFIG.reduce((acc, cfg) => {
  acc[cfg.key] = cfg;
  return acc;
}, {});

const resolveRecordId = (record) => record?._id || record?.id;

const humanizeLabel = (value, fallback = 'Unknown') => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return fallback;
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

export default function SuperAdminDashboard({ onLogout }) {
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataState, setDataState] = useState({
    loading: true,
    products: [],
    firms: [],
    users: [],
    dbOverview: null,
    error: null,
  });
  const [usersRefreshing, setUsersRefreshing] = useState(false);
  const [userOps, setUserOps] = useState({ updatingId: null, resettingId: null, suspendingId: null, deletingId: null, inviting: false });
  const [userMeta, setUserMeta] = useState({ lastFetchedAt: null });
  const [listingOps, setListingOps] = useState({ creating: false, error: '', refreshing: false });
  const [studioRequestsState, setStudioRequestsState] = useState({ loading: true, data: [], metrics: null, error: null, fetchedAt: null });
  const [currentUser] = useState(() => readStoredUser());
  const [dummyCatalog, setDummyCatalog] = useState({
    [DUMMY_TYPES.DESIGN]: [],
    [DUMMY_TYPES.SKILL]: [],
    [DUMMY_TYPES.MATERIAL]: [],
  });
  const [dummyLoading, setDummyLoading] = useState(true);
  const [controlState, setControlState] = useState({
    loading: true,
    resources: {},
    error: null,
    busy: {},
    lastFetchedAt: null,
    cacheClearing: false,
  });
  const userQueryRef = useRef("");
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncToken = () => {
      try {
        setAuthToken(localStorage.getItem('auth_token'));
      } catch (error) {
        console.warn('superadmin_token_sync_error', error);
      }
    };
    window.addEventListener('storage', syncToken);
    window.addEventListener('auth:login', syncToken);
    window.addEventListener('auth:logout', syncToken);
    return () => {
      window.removeEventListener('storage', syncToken);
      window.removeEventListener('auth:login', syncToken);
      window.removeEventListener('auth:logout', syncToken);
    };
  }, []);

  const refreshDummyCatalog = useCallback(async () => {
    setDummyLoading(true);
    try {
      const snapshot = await fetchAdminDummyCatalog();
      setDummyCatalog(snapshot);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to load dummy catalog');
    } finally {
      setDummyLoading(false);
    }
  }, []);

  const refreshStudioRequests = useCallback(async ({ silent = false, token } = {}) => {
    if (!authToken) {
      setStudioRequestsState({ loading: false, data: [], metrics: null, error: null, fetchedAt: null });
      return;
    }
    if (!silent) {
      setStudioRequestsState((prev) => ({ ...prev, loading: true, error: null }));
    }
    try {
      const { requests, metrics } = await fetchAdminStudioRequests({ limit: 80 });
      if (token?.cancelled) return;
      setStudioRequestsState({
        loading: false,
        data: requests,
        metrics,
        error: null,
        fetchedAt: Date.now(),
      });
    } catch (error) {
      if (token?.cancelled) return;
      setStudioRequestsState((prev) => ({
        ...prev,
        loading: false,
        error: error?.response?.data?.error || error?.message || 'Unable to load studio requests',
      }));
    }
  }, [authToken]);

  const refreshControlResources = useCallback(async ({ silent = false } = {}) => {
    if (!authToken) {
      setControlState((prev) => ({ ...prev, loading: false, resources: {}, lastFetchedAt: null }));
      return;
    }
    if (!silent) {
      setControlState((prev) => ({ ...prev, loading: true, error: null }));
    }
    try {
      const entries = await Promise.all(
        CONTROL_RESOURCE_CONFIG.map(async (cfg) => {
          const response = await fetchAdminDataItems(cfg.resource, { limit: cfg.limit || 80 });
          const items = response?.items || response || [];
          return [cfg.key, items];
        }),
      );
      setControlState((prev) => ({
        ...prev,
        loading: false,
        error: null,
        resources: Object.fromEntries(entries),
        busy: {},
        lastFetchedAt: Date.now(),
      }));
    } catch (error) {
      setControlState((prev) => ({
        ...prev,
        loading: false,
        error: error?.response?.data?.error || error?.message || 'Unable to load control resources',
      }));
    }
  }, [authToken]);

  const loadProducts = useCallback(async () => {
    try {
      if (!authToken) {
        return await fetchCatalog();
      }
      const response = await fetchAdminDataItems('products', { limit: 200 });
      const items = response?.items || response || [];
      return Array.isArray(items) ? items : [];
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        try {
          return await fetchCatalog();
        } catch {
          return [];
        }
      }
      throw error;
    }
  }, [authToken]);

  const refreshListings = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setListingOps((prev) => ({ ...prev, refreshing: true, error: '' }));
    }
    try {
      const products = await loadProducts();
      setDataState((prev) => ({ ...prev, products }));
      if (!silent) {
        toast.success('Listings synced');
      }
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Unable to load listings';
      setListingOps((prev) => ({ ...prev, error: message }));
      if (!silent) {
        toast.error(message);
      }
    } finally {
      if (!silent) {
        setListingOps((prev) => ({ ...prev, refreshing: false }));
      }
    }
  }, [loadProducts]);

  useEffect(() => {
    refreshDummyCatalog();
  }, [refreshDummyCatalog]);

  useEffect(() => {
    if (!authToken) {
      setStudioRequestsState({ loading: false, data: [], metrics: null, error: null, fetchedAt: null });
      return undefined;
    }
    const token = { cancelled: false };
    refreshStudioRequests({ token });
    const interval = setInterval(() => {
      refreshStudioRequests({ silent: true, token });
    }, 120_000);
    return () => {
      token.cancelled = true;
      clearInterval(interval);
    };
  }, [authToken, refreshStudioRequests]);

  useEffect(() => {
    refreshControlResources({ silent: true });
  }, [authToken, refreshControlResources]);

  useEffect(() => {
    if (activeView !== 'Control') return undefined;
    const timer = setTimeout(() => refreshControlResources({ silent: true }), 200);
    return () => clearTimeout(timer);
  }, [activeView, refreshControlResources]);

  useEffect(() => {
    if (activeView !== 'Marketplace') return undefined;
    const timer = setTimeout(() => refreshListings({ silent: true }), 200);
    return () => clearTimeout(timer);
  }, [activeView, refreshListings]);

  const normalizedSearch = search.trim().toLowerCase();
  const handleCreateDummy = useCallback(async (type, payload) => {
    const normalizedType = String(type || '').toLowerCase();
    try {
      const created = await createDummyEntry(normalizedType, payload);
      invalidateDummyCatalogCache();
      const label = dummyTypeLabels[normalizedType] || 'catalog';
      const name = created?.title || created?.name || created?.slug || 'Entry';
      setDummyCatalog((prev) => ({
        ...prev,
        [normalizedType]: [created, ...(prev[normalizedType] || []).filter((entry) => entry.id !== created.id)],
      }));
      toast.success(`${name} added to ${label}`);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to create dummy entry');
    }
  }, []);

  const handleRemoveDummy = useCallback(async (type, id) => {
    const normalizedType = String(type || '').toLowerCase();
    try {
      await deleteDummyEntry(normalizedType, id);
      invalidateDummyCatalogCache();
      setDummyCatalog((prev) => ({
        ...prev,
        [normalizedType]: (prev[normalizedType] || []).filter((entry) => entry.id !== id),
      }));
      toast.success('Dummy entry removed');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Unable to remove entry');
    }
  }, []);

  const handleControlStatusChange = useCallback(async (resourceKey, record, nextStatus) => {
    const cfg = CONTROL_RESOURCE_INDEX[resourceKey];
    const recordId = resolveRecordId(record);
    if (!cfg || !cfg.statusField || !recordId) return;
    setControlState((prev) => ({
      ...prev,
      busy: { ...prev.busy, [recordId]: 'saving' },
    }));
    try {
      const updated = await updateAdminDataItem(cfg.resource, recordId, { [cfg.statusField]: nextStatus });
      setControlState((prev) => {
        const list = prev.resources[resourceKey] || [];
        const nextList = list.map((item) =>
          resolveRecordId(item) === recordId ? { ...item, ...updated, [cfg.statusField]: nextStatus } : item
        );
        const nextBusy = { ...prev.busy };
        delete nextBusy[recordId];
        return {
          ...prev,
          resources: { ...prev.resources, [resourceKey]: nextList },
          busy: nextBusy,
        };
      });
      toast.success(`${cfg.label} status set to ${humanizeLabel(nextStatus)}`);
    } catch (error) {
      setControlState((prev) => {
        const nextBusy = { ...prev.busy };
        delete nextBusy[recordId];
        return { ...prev, busy: nextBusy };
      });
      toast.error(error?.response?.data?.error || error?.message || 'Unable to update status');
    }
  }, []);

  const handleControlDelete = useCallback(async (resourceKey, record) => {
    const cfg = CONTROL_RESOURCE_INDEX[resourceKey];
    const recordId = resolveRecordId(record);
    if (!cfg?.deletable || !recordId) return;
    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(`Delete this record from ${cfg.label}? This cannot be undone.`);
    if (!confirmed) return;
    setControlState((prev) => ({
      ...prev,
      busy: { ...prev.busy, [recordId]: 'deleting' },
    }));
    try {
      await deleteAdminDataItem(cfg.resource, recordId);
      setControlState((prev) => {
        const list = prev.resources[resourceKey] || [];
        const nextList = list.filter((item) => resolveRecordId(item) !== recordId);
        const nextBusy = { ...prev.busy };
        delete nextBusy[recordId];
        return {
          ...prev,
          resources: { ...prev.resources, [resourceKey]: nextList },
          busy: nextBusy,
        };
      });
      toast.success('Record removed');
    } catch (error) {
      setControlState((prev) => {
        const nextBusy = { ...prev.busy };
        delete nextBusy[recordId];
        return { ...prev, busy: nextBusy };
      });
      toast.error(error?.response?.data?.error || error?.message || 'Unable to delete record');
    }
  }, []);

  const handleClearMarketplaceCache = useCallback(async () => {
    setControlState((prev) => ({ ...prev, cacheClearing: true }));
    try {
      const ok = await clearMarketplaceCache();
      toast.success(ok ? 'Marketplace cache cleared' : 'Cache clear requested');
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Unable to clear cache');
    } finally {
      setControlState((prev) => ({ ...prev, cacheClearing: false }));
    }
  }, []);

  const handleCreateListing = useCallback(async (formValues = {}) => {
    const normalizedTitle = (formValues.title || '').trim();
    if (!normalizedTitle) {
      const message = 'Title is required to create a listing';
      setListingOps((prev) => ({ ...prev, error: message }));
      toast.error(message);
      return { ok: false, error: message };
    }

    const ensuredSlug =
      (formValues.slug || '').trim().toLowerCase() ||
      slugify(normalizedTitle) ||
      `listing-${Date.now().toString(36)}`;
    const currency = (formValues.currency || 'USD').toUpperCase();
    const kind = ['studio', 'material', 'service'].includes((formValues.kind || '').toLowerCase())
      ? formValues.kind.toLowerCase()
      : 'studio';
    const status = (formValues.status || 'published').toLowerCase();

    const payload = {
      title: normalizedTitle,
      slug: ensuredSlug,
      kind,
      status,
      currency,
      pricing: { currency },
    };

    if (formValues.firmId) payload.firm = formValues.firmId;
    if (formValues.summary?.trim()) payload.summary = formValues.summary.trim();
    if (formValues.description?.trim()) payload.description = formValues.description.trim();
    if (formValues.heroImage?.trim()) payload.heroImage = formValues.heroImage.trim();

    const numPrice = Number(formValues.price);
    if (Number.isFinite(numPrice)) {
      payload.price = numPrice;
      payload.pricing.basePrice = numPrice;
    }
    const numPriceSqft = Number(formValues.priceSqft);
    if (Number.isFinite(numPriceSqft)) {
      payload.priceSqft = numPriceSqft;
      payload.pricing.priceSqft = numPriceSqft;
    }

    const categories = Array.isArray(formValues.categories)
      ? formValues.categories
      : typeof formValues.category === 'string' && formValues.category.trim()
        ? formValues.category.split(',').map((entry) => entry.trim()).filter(Boolean)
        : [];
    if (categories.length) payload.categories = categories;

    const tags = Array.isArray(formValues.tags)
      ? formValues.tags
      : typeof formValues.tags === 'string' && formValues.tags.trim()
        ? formValues.tags.split(',').map((entry) => entry.trim()).filter(Boolean)
        : [];
    if (tags.length) payload.tags = tags;

    setListingOps((prev) => ({ ...prev, creating: true, error: '' }));
    try {
      const created = await createAdminDataItem('products', payload);
      setDataState((prev) => ({ ...prev, products: [created, ...(prev.products || [])] }));
      toast.success('Listing created');
      refreshControlResources({ silent: true });
      await refreshListings({ silent: true });
      setListingOps((prev) => ({ ...prev, creating: false, error: '' }));
      return { ok: true, listing: created };
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Unable to create listing';
      setListingOps((prev) => ({ ...prev, creating: false, error: message }));
      toast.error(message);
      return { ok: false, error: message };
    }
  }, [refreshControlResources, refreshListings]);

  const dashboardStats = useMemo(() => {
    const totalRevenue = dataState.products.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );
    const publishedProducts = dataState.products.filter(
      (item) => item.status === "published"
    );
    const categories = new Set(
      dataState.products.flatMap((p) => p.categories || [])
    );
    const hostedFirms = dataState.firms.filter((firm) => firm.hosting?.enabled).length;
    const totalRequests = studioRequestsState.metrics?.total ?? 0;
    const openRequests = studioRequestsState.metrics?.open ?? 0;
    return {
      totalUsers: dataState.users.length,
      totalFirms: dataState.firms.length,
      totalProducts: dataState.products.length,
      publishedProducts: publishedProducts.length,
      totalRevenue,
      categories: Array.from(categories),
      hostedFirms,
      totalRequests,
      openRequests,
    };
  }, [dataState, studioRequestsState.metrics]);

  useEffect(() => {
    userQueryRef.current = normalizedSearch;
  }, [normalizedSearch]);

  const refreshUsers = useCallback(async ({ query, silent } = {}) => {
    const searchQuery = typeof query === "string" ? query : userQueryRef.current;
    setUsersRefreshing(true);
    try {
      const nextUsers = await fetchAdminUsers({ query: searchQuery || undefined });
      setDataState((prev) => ({ ...prev, users: nextUsers }));
      userQueryRef.current = searchQuery || "";
      setUserMeta({ lastFetchedAt: Date.now(), query: searchQuery || "" });
      if (!silent) {
        toast.success("User list synced");
      }
    } catch (error) {
      if (!silent) {
        toast.error(error?.message || "Unable to refresh users");
      }
    } finally {
      setUsersRefreshing(false);
    }
  }, [userQueryRef]);

  const handleInviteUser = useCallback(async ({ email, role }) => {
    setUserOps((prev) => ({ ...prev, inviting: true }));
    try {
      await inviteAdminUser({ email, role });
      toast.success('Invitation sent');
      await refreshUsers({ silent: true });
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Unable to invite user');
    } finally {
      setUserOps((prev) => ({ ...prev, inviting: false }));
    }
  }, [refreshUsers]);

  const handleChangeRole = useCallback(async (user, nextRole) => {
    if (!user || !nextRole || user.role === nextRole) return;
    setUserOps((prev) => ({ ...prev, updatingId: user._id }));
    try {
      await updateAdminUser(user._id, { role: nextRole });
      toast.success('Role updated');
      await refreshUsers({ silent: true });
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Unable to update role');
    } finally {
      setUserOps((prev) => ({ ...prev, updatingId: null }));
    }
  }, [refreshUsers]);

  const handleResetPassword = useCallback(async (user) => {
    if (!user) return;
    setUserOps((prev) => ({ ...prev, resettingId: user._id }));
    try {
      await resetAdminUserPassword(user._id);
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Unable to reset password');
    } finally {
      setUserOps((prev) => ({ ...prev, resettingId: null }));
    }
  }, []);

  const handleToggleSuspend = useCallback(async (user, nextState) => {
    if (!user) return;
    setUserOps((prev) => ({ ...prev, suspendingId: user._id }));
    try {
      await updateAdminUser(user._id, { isSuspended: nextState });
      toast.success(nextState ? 'User suspended' : 'User reactivated');
      await refreshUsers({ silent: true });
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Unable to update status');
    } finally {
      setUserOps((prev) => ({ ...prev, suspendingId: null }));
    }
  }, [refreshUsers]);

  const handleDeleteUser = useCallback(async (user) => {
    if (!user) return;
    const message = `Delete ${user.email}? This action cannot be undone.`;
    const confirmed = typeof window !== 'undefined' ? window.confirm(message) : true;
    if (!confirmed) return;
    setUserOps((prev) => ({ ...prev, deletingId: user._id }));
    try {
      await deleteAdminUser(user._id);
      toast.success('User deleted');
      await refreshUsers({ silent: true });
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Unable to delete user');
    } finally {
      setUserOps((prev) => ({ ...prev, deletingId: null }));
    }
  }, [refreshUsers]);


  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setDataState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [products, firms, users, dbOverview] = await Promise.all([
          loadProducts(),
          fetchFirms(),
          fetchAdminUsers(),
          fetchDbOverview(),
        ]);
        if (!isMounted) return;
        setDataState({
          loading: false,
          products,
          firms,
          users,
          dbOverview,
          error: null,
        });
        setUserMeta({ lastFetchedAt: Date.now(), query: userQueryRef.current || '' });
      } catch (err) {
        console.error("Failed to load admin dashboard data", err);
        if (!isMounted) return;
        setDataState((prev) => ({
          ...prev,
          loading: false,
          error: err?.message || "Unable to load dashboard data",
        }));
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [authToken, loadProducts]);

  useEffect(() => {
    if (activeView !== 'Users') return undefined;
    const timer = setTimeout(() => {
      refreshUsers({ query: normalizedSearch || undefined, silent: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [activeView, normalizedSearch, refreshUsers]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeView !== 'Users') return;
      refreshUsers({ silent: true });
    }, 60_000);
    return () => clearInterval(interval);
  }, [activeView, refreshUsers]);

  const handleSearchKey = (e) => {
    if (e.key === "Enter" && normalizedSearch) {
      const match = sidebarItems.find(it =>
        it.id.toLowerCase().startsWith(normalizedSearch) ||
        it.label.toLowerCase().startsWith(normalizedSearch)
      );
      if (match) {
        setActiveView(match.id);
        // optional: keep search text so lists remain filtered
      }
    }
  };

  const viewProps = {
    search: normalizedSearch,
    products: dataState.products,
    firms: dataState.firms,
    users: dataState.users,
    dbOverview: dataState.dbOverview,
    loading: dataState.loading,
    error: dataState.error,
    stats: dashboardStats,
    usersLoading: usersRefreshing,
    onInviteUser: handleInviteUser,
    onChangeRole: handleChangeRole,
    onResetPassword: handleResetPassword,
    onToggleSuspend: handleToggleSuspend,
    onDeleteUser: handleDeleteUser,
    onRefreshUsers: refreshUsers,
    userOps,
    currentUserId: currentUser?._id || null,
    lastRefreshedAt: userMeta.lastFetchedAt,
    authToken,
    dummyCatalog,
    dummyLoading,
    studioRequests: studioRequestsState,
    onCreateDummy: handleCreateDummy,
    onRemoveDummy: handleRemoveDummy,
    onRefreshStudioRequests: refreshStudioRequests,
    onSyncDummyCatalog: refreshDummyCatalog,
    onCreateListing: handleCreateListing,
    onRefreshListings: refreshListings,
    listingOps,
    control: controlState,
    onRefreshControl: refreshControlResources,
    onControlStatusChange: handleControlStatusChange,
    onControlDelete: handleControlDelete,
    onClearMarketplaceCache: handleClearMarketplaceCache,
  };

  const handleLogout = async () => {
    try {
      await performLogout({ silent: true });
    } catch (error) {
      console.warn('super_admin_logout_error', error);
    } finally {
      if (onLogout) {
        onLogout();
      }
      navigate('/login', { replace: true });
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "Users": return <UsersView {...viewProps} />;
      case "Associates": return <AssociatesView {...viewProps} />;
      case "Firms": return <FirmsView {...viewProps} />;
      case "Clients": return <ClientsView {...viewProps} />;
      case "Marketplace": return <MarketplaceView {...viewProps} />;
      case "Control": return <ControlCenterView {...viewProps} />;
      case "Data": return <DataExplorerView authToken={authToken} />;
      default: return <DashboardView {...viewProps} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar (mobile overlay) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 w-64 bg-white border-r border-gray-200 p-4 flex-col transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Super Admin</h1>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <SidebarButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.id}
              onClick={() => {
                setActiveView(item.id);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-full">
        {/* Topbar */}
        <header className="flex items-center justify-between p-4 md:p-6 border-b bg-white">
          <div className="flex items-center gap-3 w-2/3 md:w-1/3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search users, associates, firms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {normalizedSearch && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-xs md:text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Logout
            </button>
            <span className="text-sm text-gray-600 hidden sm:block">Super Admin</span>
            <img
              src="https://placehold.co/40x40"
              alt="Profile"
              className="w-10 h-10 rounded-full border border-gray-200"
            />
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{renderContent()}</div>
      </main>
    </div>
  );
}

//
// --- Views ---
//
function DashboardView({
  stats,
  products,
  loading,
  error,
  dbOverview,
  dummyCatalog,
  dummyLoading,
  studioRequests,
  onCreateDummy,
  onRemoveDummy,
  onSyncDummyCatalog,
  onRefreshStudioRequests,
}) {

    const clusterDescription = useMemo(() => {
      if (!dbOverview) return 'Connecting.';
      if (dbOverview.limited) {
        return dbOverview?.db?.name || 'Status available';
      }
      return `${dbOverview?.db?.name || 'Cluster'} | ${formatBytes(dbOverview?.db?.dataSize)}`;
    }, [dbOverview]);

    const dummyTotals = useMemo(() => {
      const design = dummyCatalog?.[DUMMY_TYPES.DESIGN]?.length || 0;
      const skill = dummyCatalog?.[DUMMY_TYPES.SKILL]?.length || 0;
      const material = dummyCatalog?.[DUMMY_TYPES.MATERIAL]?.length || 0;
      return {
        design,
        skill,
        material,
        total: design + skill + material,
      };
    }, [dummyCatalog]);

    const cards = [
      {
        key: "users",
        icon: <Users />,
        title: "Users",
        description: loading ? "Loading..." : `${stats?.totalUsers ?? 0} total users`,
      },
    {
      key: "firms",
      icon: <Building2 />,
      title: "Firms",
      description: loading ? "Loading..." : `${stats?.totalFirms ?? 0} partner firms`,
    },
    {
      key: "products",
      icon: <ShoppingCart />,
      title: "Published Listings",
      description: loading ? "Loading..." : `${stats?.publishedProducts ?? 0} live products`,
    },
    {
      key: "revenue",
      icon: <DollarSign />,
      title: "Potential Revenue",
      description: loading
        ? "Loading..."
        : formatCurrency(stats?.totalRevenue ?? 0, products[0]?.currency || "USD"),
    },
      {
        key: "categories",
        icon: <Briefcase />,
        title: "Categories",
        description: loading
          ? "Loading..."
          : `${stats?.categories?.length ?? 0} active categories`,
      },
      {
        key: "studioRequests",
        icon: <Inbox />,
        title: "Studio Requests",
        description: studioRequests?.loading
          ? "Syncing..."
          : `${stats?.openRequests ?? 0} open / ${stats?.totalRequests ?? 0} total`,
      },
      {
        key: "dummyTiles",
        icon: <Sparkles />,
        title: "Studio Tiles",
        description: dummyLoading
          ? "Syncing catalog..."
          : `${dummyTotals.total} tiles (D${dummyTotals.design} / S${dummyTotals.skill} / M${dummyTotals.material})`,
      },
      {
        key: "database",
        icon: <Database />,
        title: "Mongo cluster",
        description: clusterDescription,
      },
    ];

  const latestProducts = products.slice(0, 5);

    return (
      <>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <DashboardCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Latest Marketplace Listings</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y">
            {loading ? (
              <div className="px-4 py-6 text-sm text-gray-500">Loading listings...</div>
          ) : latestProducts.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">
              No listings available yet. Seed data to see products here.
            </div>
          ) : (
            latestProducts.map((product) => (
              <div key={product._id || product.slug} className="px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{product.title}</p>
                  <p className="text-sm text-gray-500">{product.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(product.price || 0, product.currency || "USD")}
                  </span>
                  <StatusBadge status={(product.status || "draft").replace(/^\w/, (c) => c.toUpperCase())} />
                </div>
              </div>
            ))
          )}
          </div>
        </section>

        {dbOverview && <DatabaseOverview overview={dbOverview} />}

        <StudioRequestPipeline state={studioRequests} onRefresh={onRefreshStudioRequests} />

        {onCreateDummy && onRemoveDummy && dummyCatalog ? (
          <DummyDataManager
            catalog={dummyCatalog}
            loading={dummyLoading}
            onCreate={onCreateDummy}
            onDelete={onRemoveDummy}
            onSync={onSyncDummyCatalog}
          />
        ) : null}
      </>
    );
}

const makeDesignForm = () => ({
  title: '',
  summary: '',
  price: '',
  priceSqft: '',
  firmName: '',
  country: '',
  style: '',
  tags: '',
  heroImage: '',
  gallery: '',
});

const makeSkillForm = () => ({
  name: '',
  title: '',
  hourly: '',
  skills: '',
  languages: '',
  avatar: '',
  location: '',
  availability: '',
});

const makeMaterialForm = () => ({
  title: '',
  category: '',
  price: '',
  unit: '',
  vendor: '',
  heroImage: '',
  gallery: '',
});

function StudioRequestPipeline({ state, onRefresh }) {
  if (!state) return null;
  const { loading, error, data = [], metrics = {}, fetchedAt } = state;
  const statusOrder = ['new', 'in-progress', 'responded', 'archived'];
  const byStatus = metrics?.byStatus || [];
  const bySource = metrics?.bySource || [];

  const humanize = (value, fallback = 'Unknown') => {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return fallback;
    return text
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const statusCards = statusOrder.map((status) => ({
    status,
    label: humanize(status),
    count: byStatus.find((entry) => entry.status === status)?.count || 0,
  }));

  const sourceSummary = bySource.map((entry) => ({
    source: entry.source || 'guest',
    label: humanize(entry.source || 'guest'),
    count: entry.count || 0,
  }));

  const recent = data.slice(0, 5);
  const headerHint = loading
    ? 'Syncing...'
    : fetchedAt
      ? `Synced ${formatRelativeTime(fetchedAt)}`
      : 'Awaiting sync';

  const trimMessage = (value) => {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return 'No brief shared yet.';
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  };

  return (
    <section className="mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Studio Request Pipeline</h2>
          <p className="text-xs text-gray-500">{headerHint}</p>
        </div>
        <button
          type="button"
          onClick={() => onRefresh?.({})}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh pipeline
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        {statusCards.map((entry) => (
          <div key={entry.status} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{entry.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{entry.count}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-900">Source mix</p>
          <p className="text-xs text-gray-500 mb-3">Where these requests are coming from</p>
          {sourceSummary.length === 0 ? (
            <p className="text-xs text-gray-500">No inbound activity logged yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sourceSummary.map((entry) => (
                <li key={entry.source} className="flex items-center justify-between">
                  <span className="text-gray-700">{entry.label}</span>
                  <span className="font-semibold text-gray-900">{entry.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-2">
          <p className="text-sm font-semibold text-gray-900">Latest submissions</p>
          <p className="text-xs text-gray-500 mb-3">
            Snapshot of the most recent five inbound briefs across studios
          </p>
          {recent.length === 0 ? (
            <p className="text-xs text-gray-500">No studio requests recorded.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((request) => (
                <li key={request._id || request.id} className="py-3 space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {request.contactName || 'Unnamed contact'}
                      </p>
                      <p className="text-xs text-gray-500">{request.contactEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={humanize(request.status || 'New')} />
                      <span className="text-[11px] text-gray-400">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                  </div>
                  {request.studioTitle && (
                    <p className="text-xs text-gray-500">Studio: {request.studioTitle}</p>
                  )}
                  <p className="text-xs text-gray-600">{trimMessage(request.message)}</p>
                  <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
                    {request.firm?.name && <span>Firm | {request.firm.name}</span>}
                    <span>Source | {humanize(request.source)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function DummyDataManager({ catalog, loading, onCreate, onDelete, onSync }) {
  const [designForm, setDesignForm] = useState(makeDesignForm);
  const [skillForm, setSkillForm] = useState(makeSkillForm);
  const [materialForm, setMaterialForm] = useState(makeMaterialForm);
  const [tileFilter, setTileFilter] = useState('all');
  const [seedingType, setSeedingType] = useState(null);

  const handleSubmit = (event, type) => {
    event.preventDefault();
    const formMap = {
      [DUMMY_TYPES.DESIGN]: { data: designForm, reset: () => setDesignForm(makeDesignForm()) },
      [DUMMY_TYPES.SKILL]: { data: skillForm, reset: () => setSkillForm(makeSkillForm()) },
      [DUMMY_TYPES.MATERIAL]: { data: materialForm, reset: () => setMaterialForm(makeMaterialForm()) },
    };
    const entry = formMap[type];
    if (!entry) return;
    onCreate?.(type, entry.data);
    entry.reset();
  };

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutofill = (type) => {
    const sample = pickRandomSeed(type);
    if (!sample) return;
    const setterMap = {
      [DUMMY_TYPES.DESIGN]: setDesignForm,
      [DUMMY_TYPES.SKILL]: setSkillForm,
      [DUMMY_TYPES.MATERIAL]: setMaterialForm,
    };
    setterMap[type]?.((prev) => ({ ...prev, ...sample }));
  };

  const handleSeedCurated = async () => {
    if (!onCreate) return;
    const targets = tileFilter === 'all' ? Object.values(DUMMY_TYPES) : [tileFilter];
    setSeedingType(targets.length > 1 ? 'all' : targets[0]);
    try {
      for (const target of targets) {
        const presets = DUMMY_SEED_PRESETS[target] || [];
        for (const payload of presets) {
          // eslint-disable-next-line no-await-in-loop
          await onCreate(target, payload);
        }
      }
    } finally {
      setSeedingType(null);
    }
  };

  const catalogs = {
    [DUMMY_TYPES.DESIGN]: catalog?.[DUMMY_TYPES.DESIGN] || [],
    [DUMMY_TYPES.SKILL]: catalog?.[DUMMY_TYPES.SKILL] || [],
    [DUMMY_TYPES.MATERIAL]: catalog?.[DUMMY_TYPES.MATERIAL] || [],
  };

  const totalEntries = catalogs[DUMMY_TYPES.DESIGN].length + catalogs[DUMMY_TYPES.SKILL].length + catalogs[DUMMY_TYPES.MATERIAL].length;
  const filterOptions = [
    { key: 'all', label: 'All tiles', count: totalEntries },
    { key: DUMMY_TYPES.DESIGN, label: dummyTypeLabels[DUMMY_TYPES.DESIGN], count: catalogs[DUMMY_TYPES.DESIGN].length },
    { key: DUMMY_TYPES.SKILL, label: dummyTypeLabels[DUMMY_TYPES.SKILL], count: catalogs[DUMMY_TYPES.SKILL].length },
    { key: DUMMY_TYPES.MATERIAL, label: dummyTypeLabels[DUMMY_TYPES.MATERIAL], count: catalogs[DUMMY_TYPES.MATERIAL].length },
  ];
  const visibleTypes = tileFilter === 'all' ? Object.values(DUMMY_TYPES) : [tileFilter];
  const seedLabel = tileFilter === 'all'
    ? 'Generate trio per studio'
    : `Generate ${dummyTypeLabels[tileFilter] || 'tiles'}`;

  return (
    <Section title="Dummy Data Generator">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              type="button"
              key={option.key}
              onClick={() => setTileFilter(option.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${tileFilter === option.key ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-600'}`}
            >
              {option.label}
              <span className="ml-2 text-[11px] text-gray-400">{option.count}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSync?.()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Sync catalog'}
          </button>
          <button
            type="button"
            onClick={handleSeedCurated}
            disabled={seedingType !== null}
            className="inline-flex items-center gap-2 rounded bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {seedingType ? 'Generating...' : seedLabel}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4" onSubmit={(e) => handleSubmit(e, DUMMY_TYPES.DESIGN)}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Design Studio listing</h3>
            <button
              type="button"
              onClick={() => handleAutofill(DUMMY_TYPES.DESIGN)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              Autofill sample
            </button>
          </div>
          <label className="text-xs font-semibold text-gray-600">
            Title
            <input
              required
              name="title"
              value={designForm.title}
              onChange={handleChange(setDesignForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Rainforest Villa"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Firm name
            <input
              name="firmName"
              value={designForm.firmName}
              onChange={handleChange(setDesignForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Atelier Q"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Country
            <input
              name="country"
              value={designForm.country}
              onChange={handleChange(setDesignForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Global"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600">
              Price $/sqft
              <input
                name="priceSqft"
                value={designForm.priceSqft}
                onChange={handleChange(setDesignForm)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="15"
                inputMode="decimal"
              />
            </label>
            <label className="text-xs font-semibold text-gray-600">
              Total price (USD)
              <input
                name="price"
                value={designForm.price}
                onChange={handleChange(setDesignForm)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="450000"
                inputMode="decimal"
              />
            </label>
          </div>
          <label className="text-xs font-semibold text-gray-600">
            Style
            <input
              name="style"
              value={designForm.style}
              onChange={handleChange(setDesignForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Tropical modern"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Summary
            <textarea
              name="summary"
              value={designForm.summary}
              onChange={handleChange(setDesignForm)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="One-liner about the concept"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Hero image URL
            <input
              name="heroImage"
              value={designForm.heroImage}
              onChange={handleChange(setDesignForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Tags (comma separated)
            <input
              name="tags"
              value={designForm.tags}
              onChange={handleChange(setDesignForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Passive, Off-grid"
            />
          </label>
          <button type="submit" className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            Save design listing
          </button>
        </form>

        <form className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4" onSubmit={(e) => handleSubmit(e, DUMMY_TYPES.SKILL)}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Skill Studio profile</h3>
            <button
              type="button"
              onClick={() => handleAutofill(DUMMY_TYPES.SKILL)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              Autofill sample
            </button>
          </div>
          <label className="text-xs font-semibold text-gray-600">
            Name
            <input
              required
              name="name"
              value={skillForm.name}
              onChange={handleChange(setSkillForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Ananya Rao"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Role / Title
            <input
              name="title"
              value={skillForm.title}
              onChange={handleChange(setSkillForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="BIM Lead"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600">
              Hourly rate
              <input
                name="hourly"
                value={skillForm.hourly}
                onChange={handleChange(setSkillForm)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="65"
                inputMode="decimal"
              />
            </label>
            <label className="text-xs font-semibold text-gray-600">
              Location
              <input
                name="location"
                value={skillForm.location}
                onChange={handleChange(setSkillForm)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Remote"
              />
            </label>
          </div>
          <label className="text-xs font-semibold text-gray-600">
            Skills (comma or new lines)
            <textarea
              name="skills"
              value={skillForm.skills}
              onChange={handleChange(setSkillForm)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Rhino, Parametric"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Languages
            <input
              name="languages"
              value={skillForm.languages}
              onChange={handleChange(setSkillForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="English, Spanish"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Availability window
            <input
              name="availability"
              value={skillForm.availability}
              onChange={handleChange(setSkillForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="2 sprints open"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Avatar URL
            <input
              name="avatar"
              value={skillForm.avatar}
              onChange={handleChange(setSkillForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>
          <button type="submit" className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            Save associate profile
          </button>
        </form>

        <form className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4" onSubmit={(e) => handleSubmit(e, DUMMY_TYPES.MATERIAL)}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Material Studio SKU</h3>
            <button
              type="button"
              onClick={() => handleAutofill(DUMMY_TYPES.MATERIAL)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              Autofill sample
            </button>
          </div>
          <label className="text-xs font-semibold text-gray-600">
            Title
            <input
              required
              name="title"
              value={materialForm.title}
              onChange={handleChange(setMaterialForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Reclaimed teak cladding"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600">
              Category
              <input
                name="category"
                value={materialForm.category}
                onChange={handleChange(setMaterialForm)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Cladding"
              />
            </label>
            <label className="text-xs font-semibold text-gray-600">
              Unit
              <input
                name="unit"
                value={materialForm.unit}
                onChange={handleChange(setMaterialForm)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="sq ft"
              />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600">
              Price
              <input
                name="price"
                value={materialForm.price}
                onChange={handleChange(setMaterialForm)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="48"
                inputMode="decimal"
              />
            </label>
            <label className="text-xs font-semibold text-gray-600">
              Vendor
              <input
                name="vendor"
                value={materialForm.vendor}
                onChange={handleChange(setMaterialForm)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Material Ops"
              />
            </label>
          </div>
          <label className="text-xs font-semibold text-gray-600">
            Hero image URL
            <input
              name="heroImage"
              value={materialForm.heroImage}
              onChange={handleChange(setMaterialForm)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>
          <button type="submit" className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            Save material SKU
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {visibleTypes.map((type) => (
          <DummyTileColumn key={type} type={type} entries={catalogs[type]} onDelete={onDelete} />
        ))}
      </div>
    </Section>
  );
}

function DummyTileColumn({ type, entries, onDelete }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{dummyTypeLabels[type]}</p>
        <p className="text-sm text-gray-500">{entries.length} tiles</p>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No entries added yet.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <DummyTileCard key={entry.id || entry._id || entry.slug} type={type} entry={entry} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function DummyTileCard({ type, entry, onDelete }) {
  const entryId = entry.id || entry._id || entry.slug;
  const hero = entry.heroImage || entry.avatar || 'https://placehold.co/600x400?text=Studio';
  const title = entry.title || entry.name || 'Untitled tile';
  const description =
    (entry.summary || entry.description || (Array.isArray(entry.tags) ? entry.tags.join(', ') : '')) || '';
  const currency = entry.currency || entry.rates?.currency || 'USD';

  let detail = '';
  let meta = '';

  if (type === DUMMY_TYPES.DESIGN) {
    if (entry.priceSqft) {
      detail = `$${entry.priceSqft}/sqft`;
    } else if (entry.price) {
      detail = formatCurrency(entry.price, currency);
    }
    const locality = entry.location?.country || entry.country || '';
    meta = [entry.firm?.name, locality].filter(Boolean).join(' | ');
  } else if (type === DUMMY_TYPES.SKILL) {
    const hourly = entry.hourlyRate || entry.hourly || entry.rates?.hourly;
    if (hourly) {
      detail = `${formatCurrency(hourly, currency)}/hr`;
    }
    meta = entry.location || entry.availability || entry.languages?.join?.(', ') || '';
  } else if (type === DUMMY_TYPES.MATERIAL) {
    if (entry.price) {
      const unit = entry.unit || entry.metafields?.unit;
      detail = `${formatCurrency(entry.price, currency)}${unit ? ` / ${unit}` : ''}`;
    }
    meta = entry.vendor || entry.metafields?.vendor || '';
  }

  const summary =
    description && description.length > 140 ? `${description.slice(0, 137)}...` : description;

  return (
    <article className="rounded-xl border border-gray-100 p-3 text-sm text-gray-700 shadow-sm">
      <div className="h-32 w-full overflow-hidden rounded-lg bg-gray-100">
        <img src={hero} alt={title} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="mt-2 space-y-1">
        <p className="font-semibold text-gray-900 truncate">{title}</p>
        {detail && <p className="text-xs text-gray-600">{detail}</p>}
        {summary && <p className="text-xs text-gray-500">{summary}</p>}
        {meta && <p className="text-[11px] uppercase tracking-wide text-gray-400">{meta}</p>}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span className="truncate pr-2">{entry.slug || entryId}</span>
        <button
          type="button"
          onClick={() => onDelete?.(type, entryId)}
          className="text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

function DatabaseOverview({ overview }) {
  if (!overview) return null;
  const { db, server, collections = [], fetchedAt, limited } = overview;

  if (limited) {
    return (
      <section className="mt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Database Overview</h2>
            {fetchedAt && (
              <p className="text-xs text-gray-500">Updated {formatRelativeTime(fetchedAt)}</p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">{db?.name || 'Cluster status unavailable'}</p>
          <p className="mt-1">
            Detailed metrics require a super admin session. Sign in with elevated access to see collection and storage
            details.
          </p>
        </div>
      </section>
    );
  }

  const summaryMetrics = [
    { label: 'Collections', value: db?.collections != null ? db.collections.toLocaleString() : '--' },
    { label: 'Documents', value: db?.objects != null ? db.objects.toLocaleString() : '--' },
    { label: 'Data size', value: formatBytes(db?.dataSize) },
    { label: 'Storage size', value: formatBytes(db?.storageSize) },
    { label: 'Index size', value: formatBytes(db?.indexSize) },
    { label: 'Avg document', value: formatBytes(db?.avgObjSize) },
  ];
  const topCollections = collections.slice(0, 6);

  return (
    <section className="mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Database Overview</h2>
          {fetchedAt && (
            <p className="text-xs text-gray-500">Updated {formatRelativeTime(fetchedAt)}</p>
          )}
        </div>
        {db?.host && (
          <code className="text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded px-2 py-1">
            {db.host}
          </code>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {summaryMetrics.map((metric) => (
          <div key={metric.label} className="bg-white border rounded-lg px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</p>
            <p className="text-lg font-semibold text-gray-900">{metric.value || '--'}</p>
          </div>
        ))}
      </div>

      {server && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="bg-white border rounded-lg px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Mongo Version</p>
            <p className="text-lg font-semibold text-gray-900">{server.version || '—'}</p>
          </div>
          <div className="bg-white border rounded-lg px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Uptime</p>
            <p className="text-lg font-semibold text-gray-900">{formatDuration(server.uptimeSeconds)}</p>
          </div>
          <div className="bg-white border rounded-lg px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Connections</p>
            <p className="text-lg font-semibold text-gray-900">{server.connections ?? '—'}</p>
          </div>
        </div>
      )}

      {topCollections.length > 0 && (
        <div className="mt-6 bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Collection</th>
                <th className="px-4 py-2 text-left">Documents</th>
                <th className="px-4 py-2 text-left">Storage</th>
                <th className="px-4 py-2 text-left">Avg doc</th>
              </tr>
            </thead>
            <tbody>
              {topCollections.map((collection) => (
                <tr key={collection.name} className="border-t">
                  <td className="px-4 py-2 font-medium text-gray-900">{collection.name}</td>
                  <td className="px-4 py-2">{(collection.documents ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2">{formatBytes(collection.storageSize)}</td>
                  <td className="px-4 py-2">{formatBytes(collection.avgObjSize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DataExplorerView({ authToken }) {
  const [resources, setResources] = useState([]);
  const [resourceLoading, setResourceLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState('');
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');
  const [limit, setLimit] = useState(50);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [editorState, setEditorState] = useState(null);

  useEffect(() => {
    let active = true;
    if (!authToken) {
      setResources([]);
      setResourceLoading(false);
      return () => {
        active = false;
      };
    }
    setResourceLoading(true);
    const loadResources = async () => {
      try {
        const list = await fetchAdminDataResources();
        if (!active) return;
        setResources(list);
      } catch (error) {
        if (!active) return;
        console.error('admin_data_resources_failed', error);
      } finally {
        if (active) setResourceLoading(false);
      }
    };
    loadResources();
    return () => {
      active = false;
    };
  }, [authToken]);

  useEffect(() => {
    if (!selectedResource && resources.length) {
      setSelectedResource(resources[0].key);
    }
  }, [resources, selectedResource]);

  useEffect(() => {
    if (!authToken) {
      setRecords([]);
      setRecordsLoading(false);
      return undefined;
    }
    let active = true;
    if (!selectedResource) {
      setRecords([]);
      setRecordsLoading(false);
      return;
    }
    setRecordsLoading(true);
    setRecordsError('');
    (async () => {
      try {
        const response = await fetchAdminDataItems(selectedResource, {
          limit,
          q: searchTerm || undefined,
        });
        if (!active) return;
        setRecords(response?.items || []);
      } catch (error) {
        if (!active) return;
        setRecordsError(error?.response?.data?.error || error.message || 'Unable to load records');
      } finally {
        if (active) setRecordsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedResource, limit, searchTerm, refreshCounter, authToken]);

  const handleApplySearch = () => setSearchTerm(searchInput.trim());

  const handleResourceChange = (value) => {
    setSelectedResource(value);
    setSearchInput('');
    setSearchTerm('');
    setEditorState(null);
  };

  const handleRefresh = () => setRefreshCounter((value) => value + 1);

  const openEditor = (mode, record = null) => {
    const baseValue = record ? JSON.stringify(record, null, 2) : '{\n  \n}';
    setEditorState({
      mode,
      resource: selectedResource,
      recordId: record?._id || null,
      value: baseValue,
      saving: false,
      error: '',
    });
  };

  const closeEditor = () => setEditorState(null);

  const handleDeleteRecord = async (record) => {
    if (!record?._id || !selectedResource) return;
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Delete record ${record._id}? This cannot be undone.`)
      : true;
    if (!confirmed) return;
    try {
      await deleteAdminDataItem(selectedResource, record._id);
      toast.success('Record deleted');
      handleRefresh();
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message || 'Unable to delete record');
    }
  };

  const saveEditor = async () => {
    if (!editorState || !selectedResource) return;
    let payload;
    try {
      payload = JSON.parse(editorState.value);
    } catch (error) {
      setEditorState((prev) => ({ ...prev, error: 'Invalid JSON: ' + error.message }));
      return;
    }
    setEditorState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      if (editorState.mode === 'edit' && editorState.recordId) {
        await updateAdminDataItem(selectedResource, editorState.recordId, payload);
        toast.success('Record updated');
      } else {
        await createAdminDataItem(selectedResource, payload);
        toast.success('Record created');
      }
      setEditorState(null);
      handleRefresh();
    } catch (error) {
      setEditorState((prev) => ({
        ...prev,
        saving: false,
        error: error?.response?.data?.error || error.message || 'Unable to save record',
      }));
    }
  };

  if (!authToken) {
    return (
      <Section title="Data Explorer">
        <p className="text-sm text-gray-500">Sign in to view and edit database records.</p>
      </Section>
    );
  }

  return (
    <Section title="Data Explorer">
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <select
          value={selectedResource}
          onChange={(event) => handleResourceChange(event.target.value)}
          className="rounded border border-gray-200 px-3 py-2 text-sm"
          disabled={resourceLoading || resources.length === 0}
        >
          {resources.map((resource) => (
            <option key={resource.key} value={resource.key}>
              {resource.label || resource.key}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleApplySearch();
          }}
          placeholder="Search documents"
          className="flex-1 min-w-[160px] rounded border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value))}
          className="rounded border border-gray-200 px-3 py-2 text-sm"
        >
          {[25, 50, 100, 250].map((value) => (
            <option key={value} value={value}>{value} rows</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleApplySearch}
          className="rounded border border-gray-200 px-3 py-2 text-sm hover:border-gray-300"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded border border-gray-200 px-3 py-2 text-sm hover:border-gray-300"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => openEditor('create')}
          className="rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          disabled={!selectedResource}
        >
          Add record
        </button>
      </div>

      {recordsError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {recordsError}
        </div>
      )}

      {recordsLoading ? (
        <div className="text-sm text-gray-500">Loading documents…</div>
      ) : records.length === 0 ? (
        <div className="text-sm text-gray-500">No documents found for this collection.</div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record._id || JSON.stringify(record)} className="bg-white border rounded-lg p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{record._id || 'Document'}</p>
                  <p className="text-xs text-gray-500">Resource: {selectedResource || 'n/a'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditor('edit', record)}
                    className="text-xs px-3 py-1 rounded border border-gray-200 hover:border-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRecord(record)}
                    className="text-xs px-3 py-1 rounded border border-gray-200 text-red-600 hover:border-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <pre className="mt-3 max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-800">
                {JSON.stringify(record, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {editorState && (
        <div className="mt-6 border rounded-lg bg-white">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {editorState.mode === 'edit' ? 'Edit record' : 'Create record'}
              </p>
              <p className="text-xs text-gray-500">Collection: {selectedResource}</p>
            </div>
            <button className="text-xs text-gray-500 hover:text-gray-800" onClick={closeEditor}>
              Close
            </button>
          </div>
          <textarea
            rows={14}
            className="w-full border-0 p-4 font-mono text-xs text-gray-900 focus:outline-none"
            value={editorState.value}
            onChange={(event) => setEditorState((prev) => ({ ...prev, value: event.target.value }))}
          />
          {editorState.error && (
            <p className="px-4 pb-2 text-xs text-red-600">{editorState.error}</p>
          )}
          <div className="flex justify-end gap-2 border-t px-4 py-3">
            <button
              type="button"
              className="text-xs px-3 py-1 rounded border border-gray-200 hover:border-gray-300"
              onClick={closeEditor}
              disabled={editorState.saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
              onClick={saveEditor}
              disabled={editorState.saving}
            >
              {editorState.saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

function UsersView({
  search,
  users = [],
  loading,
  usersLoading,
  onInviteUser,
  onChangeRole,
  onResetPassword,
  onToggleSuspend,
  onDeleteUser,
  onRefreshUsers,
  userOps = {},
  currentUserId,
  lastRefreshedAt,
}) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    if (!inviteEmail) return;
    await onInviteUser?.({ email: inviteEmail.trim(), role: inviteRole });
    setInviteEmail('');
  };

  const filtered = users.filter((user) => {
    if (!search) return true;
    const values = [
      user.email,
      resolveUserRole(user),
      user.memberships?.map((m) => m.role).join(', '),
    ].filter(Boolean);
    return values.some((value) => String(value).toLowerCase().includes(search));
  });

  const busy = {
    updating: userOps.updatingId,
    resetting: userOps.resettingId,
    suspending: userOps.suspendingId,
    deleting: userOps.deletingId,
    inviting: userOps.inviting,
  };

  const roleOptions = ['user', 'client', 'vendor', 'firm', 'associate', 'admin', 'superadmin'];

  const renderStatus = (user) => (
    <StatusBadge status={user.isSuspended ? 'Suspended' : 'Active'} />
  );

  const renderRows = () =>
    filtered.map((user) => {
      const isSelf = currentUserId && String(currentUserId) === String(user._id);
      const roleControlDisabled = busy.updating === user._id || busy.suspending === user._id || isSelf;
      const suspendDisabled = busy.suspending === user._id || isSelf;
      const deleteDisabled = busy.deleting === user._id || isSelf;
      const resetDisabled = busy.resetting === user._id;
      const membershipSummary = user.memberships?.length
        ? user.memberships.map((m) => m.role).join(', ')
        : 'No memberships';

      return [
        <div>
          <p className="font-medium text-gray-900">{user.email}</p>
          <p className="text-xs text-gray-500">{membershipSummary}</p>
        </div>,
        <div>
          <select
            className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm"
            value={user.role}
            onChange={(event) => onChangeRole?.(user, event.target.value)}
            disabled={roleControlDisabled}
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Primary: {resolveUserRole(user)}
          </p>
          {user.rolesGlobal?.length ? (
            <p className="text-xs text-gray-400">Global: {user.rolesGlobal.join(', ')}</p>
          ) : null}
        </div>,
        <span className="text-sm text-gray-700">{formatDate(user.createdAt)}</span>,
        <div className="space-y-1">
          {renderStatus(user)}
          <p className="text-xs text-gray-400">
            Last login: {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
          </p>
        </div>,
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onResetPassword?.(user)}
            disabled={resetDisabled}
            className="text-xs px-3 py-1 rounded border border-gray-200 hover:border-gray-300 disabled:opacity-60"
          >
            {resetDisabled ? 'Sending...' : 'Reset password'}
          </button>
          <button
            type="button"
            onClick={() => onToggleSuspend?.(user, !user.isSuspended)}
            disabled={suspendDisabled}
            className={`text-xs px-3 py-1 rounded border disabled:opacity-60 ${
              user.isSuspended
                ? 'border-green-200 text-green-700 hover:border-green-300'
                : 'border-red-200 text-red-700 hover:border-red-300'
            }`}
          >
            {user.isSuspended ? 'Re-activate' : 'Suspend'}
          </button>
          <button
            type="button"
            onClick={() => onDeleteUser?.(user)}
            disabled={deleteDisabled}
            className="text-xs px-3 py-1 rounded border border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-60"
          >
            {busy.deleting === user._id ? 'Deleting...' : 'Delete'}
          </button>
        </div>,
      ];
    });

  return (
    <Section title="User Management">
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="font-semibold mb-2 text-gray-800">Invite a new teammate</h3>
        <p className="text-xs text-gray-500 mb-3">
          Invitations send login instructions via email and automatically notify the ops inbox.
        </p>
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleInviteSubmit}>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="person@company.com"
            className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value)}
            className="rounded border border-gray-200 px-3 py-2 text-sm"
          >
            {roleOptions.map((option) => (
              <option key={'invite-' + option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy.inviting}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {busy.inviting ? 'Sending...' : 'Invite user'}
          </button>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <p>
          Showing {filtered.length} of {users.length} users
        </p>
        <div className="flex items-center gap-3">
          <span>Last synced {formatRelativeTime(lastRefreshedAt)}</span>
          <button
            type="button"
            onClick={() => onRefreshUsers?.({})}
            disabled={usersLoading}
            className="inline-flex items-center gap-1 rounded border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading || usersLoading ? (
        <div className="text-sm text-gray-500">Loading user list...</div>
      ) : filtered.length === 0 ? (
        <EmptySearchNotice term={search} />
      ) : (
        <Table
          headers={["Email", "Role", "Joined", "Status", "Actions"]}
          rows={renderRows()}
        />
      )}
    </Section>
  );
}

function AssociatesView() {
  return (
    <Section title="Associates">
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
        Associate performance widgets will land here once the contributor APIs are wired up.
      </div>
    </Section>
  );
}

function FirmsView({ search, firms = [], loading }) {
  const filtered = firms.filter((firm) => {
    if (!search) return true;
    return [firm.name, firm.location]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  return (
    <Section title="Firms">
      {loading ? (
        <div className="text-sm text-gray-500">Loading firms...</div>
      ) : filtered.length === 0 ? (
        <EmptySearchNotice term={search} />
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 25).map((firm) => (
            <div key={firm._id || firm.name} className="rounded-lg border bg-white px-4 py-3 text-sm text-gray-700">
              <p className="font-medium text-gray-900">{firm.name || 'Unnamed firm'}</p>
              <p className="text-xs text-gray-500">{firm.location || 'Location pending'}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ClientsView({ search, users = [], loading }) {
  const clients = users.filter((user) => user.isClient !== false);
  const filtered = clients.filter((user) => {
    if (!search) return true;
    return user.email?.toLowerCase().includes(search);
  });

  return (
    <Section title="Clients">
      {loading ? (
        <div className="text-sm text-gray-500">Loading clients...</div>
      ) : filtered.length === 0 ? (
        <EmptySearchNotice term={search} />
      ) : (
        <Table
          headers={["Email", "Status", "Joined"]}
          rows={filtered.slice(0, 25).map((client) => [
            <span className="font-medium text-gray-900">{client.email}</span>,
            <StatusBadge status={client.isSuspended ? 'Suspended' : 'Active'} />,
            <span>{formatDate(client.createdAt)}</span>,
          ])}
        />
      )}
    </Section>
  );
}

const makeListingForm = () => ({
  title: '',
  slug: '',
  firmId: '',
  kind: 'studio',
  status: 'published',
  price: '',
  priceSqft: '',
  currency: 'USD',
  summary: '',
  tags: '',
  category: '',
  heroImage: '',
});

function MarketplaceView({ search, products, firms = [], loading, onCreateListing, onRefreshListings, listingOps }) {
  const [listingForm, setListingForm] = useState(makeListingForm);
  const [localError, setLocalError] = useState('');

  const sortedProducts = useMemo(() => {
    const list = Array.isArray(products) ? [...products] : [];
    return list.sort((a, b) => {
      const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime() || 0;
      const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime() || 0;
      return bTime - aTime;
    });
  }, [products]);

  const filtered = useMemo(
    () =>
      sortedProducts.filter((product) => {
        if (!search) return true;
        return [product.title, product.slug, product.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      }),
    [sortedProducts, search],
  );

  const handleListingChange = (event) => {
    const { name, value } = event.target;
    setListingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateSlug = () => {
    setListingForm((prev) => {
      const source = prev.slug?.trim() || prev.title || `listing-${Date.now().toString(36)}`;
      return { ...prev, slug: slugify(source) };
    });
  };

  const handleSubmitListing = async (event) => {
    event.preventDefault();
    setLocalError('');
    if (!onCreateListing) return;
    const result = await onCreateListing(listingForm);
    if (result?.ok) {
      setListingForm(makeListingForm());
    } else if (result?.error) {
      setLocalError(result.error);
    }
  };

  const creationError = localError || listingOps?.error || '';
  const creating = Boolean(listingOps?.creating);
  const refreshing = Boolean(listingOps?.refreshing);

  return (
    <Section title="Marketplace Listings">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <p>Publish listings directly from the super admin panel.</p>
        <button
          type="button"
          onClick={() => onRefreshListings?.()}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:border-gray-300 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Syncing...' : 'Refresh listings'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
        <form className="space-y-3 rounded-xl border border-gray-200 bg-white p-4" onSubmit={handleSubmitListing}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Create a listing</h3>
              <p className="text-xs text-gray-500">Super admins can create and publish tiles for any firm.</p>
            </div>
            <span className="text-[11px] rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-600">Admin-only</span>
          </div>

          <label className="text-xs font-semibold text-gray-600">
            Title
            <input
              required
              name="title"
              value={listingForm.title}
              onChange={handleListingChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Canyon House prefab"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-[1fr,auto]">
            <label className="text-xs font-semibold text-gray-600">
              Slug
              <input
                name="slug"
                value={listingForm.slug}
                onChange={handleListingChange}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="canyon-house-prefab"
              />
            </label>
            <button
              type="button"
              onClick={handleGenerateSlug}
              className="self-end rounded border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300"
            >
              Generate
            </button>
          </div>

          <label className="text-xs font-semibold text-gray-600">
            Firm (optional)
            <select
              name="firmId"
              value={listingForm.firmId}
              onChange={handleListingChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {firms.map((firm) => (
                <option key={firm._id || firm.slug || firm.name} value={firm._id}>
                  {firm.name || firm.slug || 'Firm'}{firm.slug ? ` (${firm.slug})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600">
              Kind
              <select
                name="kind"
                value={listingForm.kind}
                onChange={handleListingChange}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="studio">Design studio</option>
                <option value="material">Material</option>
                <option value="service">Service</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600">
              Status
              <select
                name="status"
                value={listingForm.status}
                onChange={handleListingChange}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600">
              Price
              <input
                name="price"
                inputMode="decimal"
                value={listingForm.price}
                onChange={handleListingChange}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="450000"
              />
            </label>
            <label className="text-xs font-semibold text-gray-600">
              Currency
              <input
                name="currency"
                value={listingForm.currency}
                onChange={handleListingChange}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase"
                placeholder="USD"
              />
            </label>
          </div>

          <label className="text-xs font-semibold text-gray-600">
            Price per sqft (optional)
            <input
              name="priceSqft"
              inputMode="decimal"
              value={listingForm.priceSqft}
              onChange={handleListingChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="18"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600">
              Category
              <input
                name="category"
                value={listingForm.category}
                onChange={handleListingChange}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Residential, Hospitality"
              />
            </label>
            <label className="text-xs font-semibold text-gray-600">
              Tags
              <input
                name="tags"
                value={listingForm.tags}
                onChange={handleListingChange}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Prefab,Low carbon"
              />
            </label>
          </div>

          <label className="text-xs font-semibold text-gray-600">
            Hero image URL
            <input
              name="heroImage"
              value={listingForm.heroImage}
              onChange={handleListingChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>

          <label className="text-xs font-semibold text-gray-600">
            Summary
            <textarea
              name="summary"
              value={listingForm.summary}
              onChange={handleListingChange}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Short blurb for the marketplace card"
            />
          </label>

          {creationError && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {creationError}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create listing'}
          </button>
          <p className="text-[11px] text-gray-500">
            New listings are saved instantly via the admin API. Use the Control Center to toggle statuses later.
          </p>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          {loading ? (
            <div className="text-sm text-gray-500">Loading listings...</div>
          ) : filtered.length === 0 ? (
            <EmptySearchNotice term={search} />
          ) : (
            <ul className="space-y-3">
              {filtered.map((product) => (
                <li
                  key={product._id || product.slug}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-gray-900">{product.title}</p>
                    <p className="text-xs text-gray-500">{product.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(product.price || product.pricing?.basePrice || 0, product.currency || product.pricing?.currency || "USD")}
                    </span>
                    <StatusBadge status={(product.status || "draft").replace(/^\w/, (c) => c.toUpperCase())} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}

function ControlCenterView({
  control,
  onRefreshControl,
  onControlStatusChange,
  onControlDelete,
  onClearMarketplaceCache,
}) {
  const { loading, error, resources = {}, lastFetchedAt, busy = {}, cacheClearing } = control || {};
  const summary = CONTROL_RESOURCE_CONFIG.map((cfg) => ({
    key: cfg.key,
    label: cfg.label,
    count: (resources[cfg.key] || []).length,
  }));

  const resolvePrimaryLabel = (record) =>
    record.title ||
    record.projectTitle ||
    record.subject ||
    record.label ||
    record.name ||
    record.contact ||
    record.email ||
    record.ownerId ||
    record._id ||
    'Record';

  const resolveSecondaryLabel = (record) => {
    const bits = [];
    if (record.ownerType) bits.push(humanizeLabel(record.ownerType));
    if (record.ownerId) bits.push(String(record.ownerId).slice(-6));
    if (record.tag) bits.push(record.tag);
    return bits.join(' • ');
  };

  return (
    <Section title="Control Center">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
        <div>
          <p className="text-sm text-gray-600">
            Live controls for marketplace, workspace, and ops data. Use quick status edits here; open the Data Explorer for schema-level changes.
          </p>
          <p className="text-xs text-gray-500">
            Last sync {lastFetchedAt ? formatRelativeTime(lastFetchedAt) : 'never'}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onRefreshControl?.({})}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:border-gray-400 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh control data
          </button>
          <button
            type="button"
            onClick={onClearMarketplaceCache}
            disabled={cacheClearing}
            className="inline-flex items-center gap-2 rounded border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm text-orange-800 hover:border-orange-300 disabled:opacity-60"
          >
            {cacheClearing ? 'Clearing cache...' : 'Clear marketplace cache'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {summary.map((entry) => (
          <div key={entry.key} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{entry.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{entry.count}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {CONTROL_RESOURCE_CONFIG.map((cfg) => {
          const records = (resources[cfg.key] || []).slice(0, 6);
          return (
            <div key={cfg.key} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{cfg.label}</h3>
                  <p className="text-xs text-gray-500">
                    Showing {records.length} of {(resources[cfg.key] || []).length} records
                  </p>
                </div>
                {cfg.statusField && (
                  <p className="text-xs text-gray-400">
                    Status values: {(cfg.statusOptions || []).map(humanizeLabel).join(' / ')}
                  </p>
                )}
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">Syncing...</p>
              ) : records.length === 0 ? (
                <p className="text-sm text-gray-500">No records found. Try the Data Explorer to create entries.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {records.map((record) => {
                    const recordId = resolveRecordId(record);
                    const statusValue = cfg.statusField ? record[cfg.statusField] : null;
                    const busyState = busy[recordId];
                    return (
                      <li
                        key={recordId}
                        className="py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">{resolvePrimaryLabel(record)}</p>
                          <p className="text-xs text-gray-500">
                            {resolveSecondaryLabel(record) || humanizeLabel(statusValue || '')}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Updated {formatRelativeTime(record.updatedAt || record.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {statusValue && <StatusBadge status={humanizeLabel(statusValue)} />}
                          {cfg.statusField && (cfg.statusOptions || []).length ? (
                            <select
                              value={statusValue || cfg.statusOptions?.[0] || ''}
                              onChange={(event) =>
                                onControlStatusChange?.(cfg.key, record, event.target.value)
                              }
                              disabled={busyState === 'saving'}
                              className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-700 disabled:opacity-60"
                            >
                              {(cfg.statusOptions || []).map((option) => (
                                <option key={option} value={option}>
                                  {humanizeLabel(option)}
                                </option>
                              ))}
                            </select>
                          ) : null}
                          {cfg.deletable && (
                            <button
                              type="button"
                              onClick={() => onControlDelete?.(cfg.key, record)}
                              disabled={busyState === 'deleting'}
                              className="text-xs px-3 py-1 rounded border border-red-200 text-red-700 hover:border-red-300 disabled:opacity-60"
                            >
                              {busyState === 'deleting' ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

//
// --- Reusable Components ---
//
function SidebarButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition ${
        isActive ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
}

function DashboardCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg border p-4 flex items-center space-x-3 shadow-sm">
      <div className="p-2 bg-gray-50 rounded-full border">{icon}</div>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function Section({ title, children, actionLabel }) {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {actionLabel && (
          <button className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-700">
            <Plus size={14} /> {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="bg-white border rounded-lg overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-gray-500 bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const label = humanizeLabel(status || '');
  const styles = {
    Active: "bg-green-100 text-green-700",
    Completed: "bg-green-100 text-green-700",
    Inactive: "bg-red-100 text-red-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Verified: "bg-blue-100 text-blue-700",
    Published: "bg-green-100 text-green-700",
    Draft: "bg-gray-200 text-gray-700",
    Suspended: "bg-red-100 text-red-700",
    Processing: "bg-yellow-100 text-yellow-700",
    Released: "bg-green-100 text-green-700",
    Failed: "bg-red-100 text-red-700",
    Scheduled: "bg-blue-50 text-blue-700",
    Resolved: "bg-green-50 text-green-700",
    Open: "bg-indigo-50 text-indigo-700",
    Cancelled: "bg-red-50 text-red-700",
    "In Progress": "bg-yellow-50 text-yellow-800",
    Contacted: "bg-blue-50 text-blue-700",
    Proposal: "bg-purple-50 text-purple-700",
    Won: "bg-green-100 text-green-700",
    Lost: "bg-gray-200 text-gray-700",
  };
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[label] || "bg-gray-100 text-gray-700"}`}>
      {label || '—'}
    </span>
  );
}

// Helper component for empty search results
function EmptySearchNotice({ term }) {
  return (
    <div className="mt-6 text-center text-sm text-gray-500">
      No results found for "<span className="font-medium">{term}</span>"
    </div>
  );
}





