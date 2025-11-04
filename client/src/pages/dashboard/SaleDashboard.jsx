
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  DollarSign,
  Bell,
  ClipboardList,
  TrendingUp,
  Menu,
  X,
  Truck,
  ArrowRight,
  RefreshCcw,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import VendorProfileEditor from "../../components/vendor/VendorProfileEditor.jsx";
import { fetchVendorPortalProfile } from "../../services/portal.js";
import { deriveVendorProfileStats, formatCurrency } from "../../utils/vendorProfile.js";

const formatRelativeTime = (iso) => {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - Date.now();
  const units = [
    { unit: "day", ms: 86_400_000 },
    { unit: "hour", ms: 3_600_000 },
    { unit: "minute", ms: 60_000 },
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const { unit, ms } of units) {
    if (Math.abs(diffMs) >= ms || unit === "minute") {
      return formatter.format(Math.round(diffMs / ms), unit);
    }
  }
  return target.toLocaleString();
};

const STORAGE_KEYS = {
  inventory: "vendor_dashboard_inventory_v1",
  orders: "vendor_dashboard_orders_v1",
  activity: "vendor_dashboard_activity_v1",
};

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: ClipboardList },
  { id: "catalogue", label: "Catalogue", icon: Warehouse },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const DEFAULT_INVENTORY = [
  {
    id: "mr-chair-furniture-cantilever",
    name: '"MR" Chair - Cantilever',
    category: "Furniture",
    stock: 240,
    unit: "units",
    status: "In stock",
    moq: 2,
    leadTimeDays: 70,
    price: 1850,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "steel-grade60-bar",
    name: "Grade 60 Rebar",
    category: "Structural steel",
    stock: 520,
    unit: "tons",
    status: "Production",
    moq: 25,
    leadTimeDays: 28,
    price: 980,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "unitised-façade",
    name: "Unitised Façade Panel",
    category: "Envelope",
    stock: 60,
    unit: "kits",
    status: "Low stock",
    moq: 10,
    leadTimeDays: 45,
    price: 12800,
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_ORDERS = [
  {
    id: "PO-1042",
    client: "Skybridge Developments",
    sku: "steel-grade60-bar",
    quantity: 40,
    value: 39200,
    status: "Production",
    placedAt: "2025-03-04T06:15:00Z",
  },
  {
    id: "PO-1043",
    client: "Vanguard Studios",
    sku: "mr-chair-furniture-cantilever",
    quantity: 18,
    value: 33300,
    status: "Ready to ship",
    placedAt: "2025-03-06T09:30:00Z",
  },
  {
    id: "PO-1044",
    client: "Urban Build Co",
    sku: "unitised-façade",
    quantity: 8,
    value: 102400,
    status: "Invoiced",
    placedAt: "2025-03-09T11:05:00Z",
  },
];

const MARKET_LEADS = [
  {
    id: "lead-giga-01",
    title: "Giga-mall atrium balustrades",
    company: "Aurora Retail Systems",
    value: 180000,
    region: "Europe",
    due: "2025-03-28",
    tags: ["Glass & steel", "EN 1090"],
  },
  {
    id: "lead-hospital-02",
    title: "Healthcare tower envelope",
    company: "Medicon Build",
    value: 520000,
    region: "GCC",
    due: "2025-04-05",
    tags: ["Unitised façade", "Fire-rated"],
  },
  {
    id: "lead-campus-03",
    title: "Campus furniture refresh",
    company: "Northbeam Estates",
    value: 92000,
    region: "North America",
    due: "2025-03-22",
    tags: ["Furniture", "Quick ship"],
  },
];

const isBrowser = typeof window !== "undefined";

const loadStoredList = (key, fallback) => {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const persistList = (key, value) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("vendor_dashboard_storage_error", error);
  }
};

const createId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `vendor-${Date.now()}-${Math.random().toString(16).slice(2)}`);

function VendorDashboard() {
  const [activeView, setActiveView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileState, setProfileState] = useState({ loading: true, error: null, profile: null });
  const [inventory, setInventory] = useState(() => loadStoredList(STORAGE_KEYS.inventory, DEFAULT_INVENTORY));
  const [orders, setOrders] = useState(() => loadStoredList(STORAGE_KEYS.orders, DEFAULT_ORDERS));
  const [activityLog, setActivityLog] = useState(() => loadStoredList(STORAGE_KEYS.activity, []));

  useEffect(() => {
    persistList(STORAGE_KEYS.inventory, inventory);
  }, [inventory]);

  useEffect(() => {
    persistList(STORAGE_KEYS.orders, orders);
  }, [orders]);

  useEffect(() => {
    persistList(STORAGE_KEYS.activity, activityLog.slice(0, 60));
  }, [activityLog]);

  const refreshProfile = useCallback(async (options = {}) => {
    setProfileState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetchVendorPortalProfile({ preferDraft: true });
      if (response.authRequired) {
        setProfileState({
          loading: false,
          error: response.error?.message || "Sign in to sync your vendor profile.",
          profile: response.profile || null,
        });
        if (!options.silent) {
          toast.error("Sign in to sync your vendor profile");
        }
        return;
      }
      setProfileState({ loading: false, error: null, profile: response.profile || null });
      if (!options.silent) {
        toast.success(response.source === "draft" ? "Loaded profile draft" : "Profile synced");
      }
    } catch (error) {
      setProfileState({ loading: false, error: error?.message || "Unable to load profile", profile: null });
      if (!options.silent) {
        toast.error("Unable to load profile");
      }
    }
  }, []);

  useEffect(() => {
    refreshProfile({ silent: true });
  }, [refreshProfile]);

  const profileMeta = useMemo(() => deriveVendorProfileStats(profileState.profile || {}), [profileState.profile]);

  const revenueStats = useMemo(() => {
    const total = orders.reduce((sum, order) => sum + (Number(order.value) || 0), 0);
    const openOrders = orders.filter((order) => order.status !== "Invoiced" && order.status !== "Closed").length;
    const readyToShip = orders.filter((order) => order.status === "Ready to ship").length;
    return { total, openOrders, readyToShip };
  }, [orders]);

  const lowInventory = useMemo(() => inventory.filter((item) => item.status?.toLowerCase().includes("low")), [inventory]);

  const unreadNotifications = activityLog.filter((entry) => !entry.read).length;

  const pushActivity = useCallback((entry) => {
    setActivityLog((prev) => {
      const next = [entry, ...prev].slice(0, 60);
      return next;
    });
  }, []);

  const handleProfileUpdated = useCallback(
    (nextProfile) => {
      if (!nextProfile) return;
      setProfileState({ loading: false, error: null, profile: nextProfile });
      pushActivity({
        id: createId(),
        timestamp: new Date().toISOString(),
        kind: "profile.updated",
        title: "Vendor profile synced",
        description: nextProfile.companyName
          ? `Live for ${nextProfile.companyName}`
          : "Profile changes saved.",
        read: false,
      });
      toast.success("Profile saved");
    },
    [pushActivity]
  );

  const handleInventoryStatusChange = useCallback((id, nextStatus) => {
    setInventory((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() }
          : item
      );
      return next;
    });
    pushActivity({
      id: createId(),
      timestamp: new Date().toISOString(),
      kind: "inventory.status",
      title: "Inventory status updated",
      description: `${id} marked as ${nextStatus}`,
      read: false,
    });
  }, [pushActivity]);

  const handleOrderStatusChange = useCallback((id, status) => {
    setOrders((prev) => {
      const next = prev.map((order) =>
        order.id === id
          ? { ...order, status, updatedAt: new Date().toISOString() }
          : order
      );
      return next;
    });
    pushActivity({
      id: createId(),
      timestamp: new Date().toISOString(),
      kind: "order.status",
      title: `${id} → ${status}`,
      description: `Order status moved to ${status}.`,
      read: false,
    });
  }, [pushActivity]);

  const handleMarkActivityRead = useCallback((id) => {
    setActivityLog((prev) => prev.map((entry) => (entry.id === id ? { ...entry, read: true } : entry)));
  }, []);

  const handleDismissActivity = useCallback((id) => {
    setActivityLog((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const handleClearActivity = useCallback(() => {
    setActivityLog([]);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return (
          <OverviewView
            profile={profileState.profile}
            profileMeta={profileMeta}
            orders={orders}
            inventory={inventory}
            revenueStats={revenueStats}
            leads={MARKET_LEADS}
            onNavigateProfile={() => setActiveView("profile")}
            onRefresh={() => refreshProfile()}
            lowInventory={lowInventory}
            activity={activityLog}
          />
        );
      case "profile":
        return (
          <ProfileView
            profile={profileState.profile}
            profileMeta={profileMeta}
            onProfileUpdate={handleProfileUpdated}
            onRefresh={() => refreshProfile()}
          />
        );
      case "catalogue":
        return (
          <CatalogueView
            inventory={inventory}
            onStatusChange={handleInventoryStatusChange}
            profileMeta={profileMeta}
          />
        );
      case "orders":
        return (
          <OrdersView
            orders={orders}
            onUpdateStatus={handleOrderStatusChange}
          />
        );
      case "revenue":
        return (
          <RevenueView
            orders={orders}
            inventory={inventory}
            profile={profileState.profile}
            revenueStats={revenueStats}
          />
        );
      case "notifications":
        return (
          <NotificationsView
            activity={activityLog}
            onMarkRead={handleMarkActivityRead}
            onDismiss={handleDismissActivity}
            onClear={handleClearActivity}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static z-30 w-64 bg-white border-r border-slate-200 p-4 flex-col transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Vendor</h1>
          <button
            className="md:hidden rounded-lg p-1.5 hover:bg-slate-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const badge =
              item.id === "notifications"
                ? unreadNotifications || null
                : item.id === "orders"
                  ? orders.length
                  : null;
            return (
              <SidebarButton
                key={item.id}
                icon={Icon}
                label={item.label}
                isActive={activeView === item.id}
                badge={badge}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
              />
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col max-w-full">
        <header className="flex items-center justify-between p-4 md:p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-semibold capitalize">{SIDEBAR_ITEMS.find((item) => item.id === activeView)?.label || "Overview"}</h2>
              <p className="text-xs text-slate-500">
                {profileState.profile?.companyName
                  ? `${profileState.profile.companyName} · ${profileState.profile.location || "Location TBA"}`
                  : "Keep your Material Studio listing in sync"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {profileState.profile?.contactEmail || "vendor@builtattic.com"}
              </p>
              <p className="text-xs text-slate-500">
                {profileState.profile?.updatedAt
                  ? `Last updated ${formatRelativeTime(profileState.profile.updatedAt)}`
                  : "Not synced yet"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 font-semibold">
              {profileState.profile?.companyName?.slice(0, 2).toUpperCase() || "VD"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
function OverviewView({ profileMeta, orders, revenueStats, leads, onNavigateProfile, onRefresh, lowInventory, activity }) {
  const readyToShip = orders.filter((order) => order.status === "Ready to ship").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Marketplace performance</h2>
          <p className="text-sm text-slate-600">Track orders, inventory health, and inbound leads for your vendor listing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            <RefreshCcw size={16} /> Refresh data
          </button>
          <button
            type="button"
            onClick={onNavigateProfile}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Update profile <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard icon={TrendingUp} label="Open orders" value={orders.length} helper={`${readyToShip} ready to ship`} tone="neutral" />
        <StatCard icon={Package} label="Catalog SKUs" value={profileMeta.materials || 0} helper={`MOQ ${profileMeta.moq || "–"}`} tone="neutral" />
        <StatCard icon={Truck} label="Lead time" value={profileMeta.leadTime ? `${profileMeta.leadTime} days` : "Add lead time"} helper={`${profileMeta.regions || 0} regions`} tone="neutral" />
        <StatCard icon={DollarSign} label="Revenue pipeline" value={formatCurrency(revenueStats.total) || "$0"} helper={`${revenueStats.openOrders} active orders`} tone="positive" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Order pipeline</h3>
            <Link to="#" onClick={(event) => event.preventDefault()} className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              manage catalogue
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{order.id}</td>
                    <td className="px-4 py-3 text-slate-600">{order.client}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(order.value) || "$0"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === "Invoiced"
                          ? "bg-emerald-100 text-emerald-700"
                          : order.status === "Ready to ship"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Inventory signals</h3>
            <p className="mt-1 text-sm text-slate-500">Maintain safety stock to stay visible in Material Studio filters.</p>
            <ul className="mt-4 space-y-3 text-sm">
              {lowInventory.length ? (
                lowInventory.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-amber-700">
                    <span>{item.name}</span>
                    <span className="text-xs font-semibold">{item.status}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">All SKUs stocked above thresholds.</li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Activity log</h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              {activity.slice(0, 5).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between">
                  <span>{entry.title}</span>
                  <span>{formatRelativeTime(entry.timestamp)}</span>
                </li>
              ))}
              {activity.length === 0 && <li>No activity yet. Changes will appear here.</li>}
            </ul>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Inbound leads</h3>
            <p className="text-sm text-slate-500">Opportunities surfaced from Material Studio requests.</p>
          </div>
          <Link to="#" onClick={(event) => event.preventDefault()} className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            view crm
          </Link>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {leads.map((lead) => (
            <div key={lead.id} className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{lead.region}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{lead.title}</p>
                <p className="text-xs text-slate-500">{lead.company}</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(lead.value) || "$0"}</p>
              <p className="text-xs text-slate-500">Response due {new Date(lead.due).toLocaleDateString()}</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {lead.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-300 bg-white px-3 py-1">{tag}</span>
                ))}
              </div>
              <button
                type="button"
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Review brief <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function ProfileView({ profile, onProfileUpdate, onRefresh }) {
  const lastUpdated = profile?.updatedAt ? formatRelativeTime(profile.updatedAt) : "Never";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Vendor profile</h2>
          <p className="text-sm text-slate-600">Update the information buyers see on your material listings.</p>
          <p className="mt-1 text-xs text-slate-500">Last synced {lastUpdated}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={profile?.catalogSkus?.[0] ? `/warehouse/${profile.catalogSkus[0]}` : "/warehouse"}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            Preview listing <ExternalLink size={14} />
          </Link>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Sync now <RefreshCcw size={14} />
          </button>
        </div>
      </div>

      <VendorProfileEditor onProfileUpdate={onProfileUpdate} />
    </div>
  );
}

function CatalogueView({ inventory, onStatusChange, profileMeta }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Catalogue</h2>
        <p className="text-sm text-slate-600">Keep SKU availability and production windows updated for buyers.</p>
        <p className="text-xs text-slate-500">{profileMeta.materials || 0} SKUs linked to your vendor profile.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">SKU</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Stock</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Lead time</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.id}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{item.category}</td>
                <td className="px-4 py-3 text-slate-600">{item.stock?.toLocaleString()} {item.unit}</td>
                <td className="px-4 py-3 text-slate-600">{item.leadTimeDays} days</td>
                <td className="px-4 py-3">
                  <select
                    value={item.status}
                    onChange={(event) => onStatusChange(item.id, event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-slate-500 focus:outline-none"
                  >
                    <option value="In stock">In stock</option>
                    <option value="Production">Production</option>
                    <option value="Low stock">Low stock</option>
                    <option value="Critical">Critical</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersView({ orders, onUpdateStatus }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Orders</h2>
        <p className="text-sm text-slate-600">Update fulfilment progress, invoice status, and shipment readiness.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Order</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Client</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Quantity</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Value</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{order.id}</td>
                <td className="px-4 py-3 text-slate-600">{order.client}</td>
                <td className="px-4 py-3 text-slate-600">{order.quantity?.toLocaleString()} units</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(order.value) || "$0"}</td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(event) => onUpdateStatus(order.id, event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-slate-500 focus:outline-none"
                  >
                    <option value="Production">Production</option>
                    <option value="Ready to ship">Ready to ship</option>
                    <option value="Invoiced">Invoiced</option>
                    <option value="Closed">Closed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenueView({ orders, inventory, profile, revenueStats }) {
  const invoiced = orders.filter((order) => order.status === "Invoiced" || order.status === "Closed").reduce((sum, order) => sum + (Number(order.value) || 0), 0);
  const avgLead = inventory.reduce((sum, item) => sum + (Number(item.leadTimeDays) || 0), 0) / (inventory.length || 1);
  const catalogValue = inventory.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Revenue momentum</h2>
        <p className="text-sm text-slate-600">Track pipeline value, invoiced revenue, and catalogue potential.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm text-slate-300">Total pipeline</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(revenueStats.total) || "$0"}</p>
          <p className="mt-3 text-xs text-slate-300">{revenueStats.openOrders} active orders, {revenueStats.readyToShip} ready to ship.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Invoiced to date</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(invoiced) || "$0"}</p>
          <p className="mt-3 text-xs text-slate-500">Closed + invoiced orders this quarter.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Catalogue value (headline)</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(catalogValue) || "$0"}</p>
          <p className="mt-3 text-xs text-slate-500">Average lead {Math.round(avgLead)} days · MOQ {profile?.minOrderQuantity || "–"}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Revenue notes</h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Keep lead time below 30 days to stay in fast-track catalogue lanes.</li>
          <li className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Renew ISO certificates before end of quarter for procurement compliance.</li>
          <li className="flex items-center gap-2"><Truck size={14} className="text-blue-500" /> Add logistics add-ons (cranage, customs) as optional services.</li>
        </ul>
      </div>
    </div>
  );
}

function NotificationsView({ activity, onMarkRead, onDismiss, onClear }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-600">Profile sync events, order status changes, and catalogue updates appear here.</p>
        </div>
        {activity.length ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {!activity.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          You are all caught up. Updates from orders, inventory, and profile changes will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {activity.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-2xl border p-4 ${
                entry.read ? "border-slate-200 bg-white" : "border-indigo-200 bg-indigo-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                  {entry.description ? (
                    <p className="text-xs text-slate-600 mt-1">{entry.description}</p>
                  ) : null}
                  <p className="text-xs text-slate-400 mt-2">{formatRelativeTime(entry.timestamp)}</p>
                </div>
                <div className="flex gap-2">
                  {!entry.read && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(entry.id)}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDismiss(entry.id)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarButton({ icon: Icon, label, isActive, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {Icon ? (
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${
          isActive ? "bg-white/15" : "bg-slate-100 text-slate-600"
        }`}>
          <Icon size={18} />
        </span>
      ) : null}
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, helper, tone = "neutral" }) {
  const palette = {
    neutral: {
      card: "bg-white border border-slate-200",
      label: "text-slate-500",
      helper: "text-slate-500",
      icon: "bg-slate-100 text-slate-600",
    },
    positive: {
      card: "bg-emerald-50 border border-emerald-200",
      label: "text-emerald-600",
      helper: "text-emerald-600",
      icon: "bg-white text-emerald-600",
    },
    warning: {
      card: "bg-amber-50 border border-amber-200",
      label: "text-amber-600",
      helper: "text-amber-600",
      icon: "bg-white text-amber-600",
    },
  };
  const colors = palette[tone] || palette.neutral;

  return (
    <div className={`rounded-xl p-4 shadow-sm ${colors.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${colors.label}`}>{label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
          {helper ? <p className={`mt-1 text-xs ${colors.helper}`}>{helper}</p> : null}
        </div>
        {Icon ? (
          <span className={`inline-flex rounded-full p-2 ${colors.icon}`}>
            <Icon size={18} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default VendorDashboard;




