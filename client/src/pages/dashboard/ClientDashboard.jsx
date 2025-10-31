import { useEffect, useMemo, useState } from "react";
import {
  User,
  ShoppingCart,
  Heart,
  DollarSign,
  Bell,
  CheckCircle,
  Clock,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { fetchCatalog } from "../../services/marketplace.js";

const sidebarItems = [
  { id: "profile", label: "Profile", icon: <User size={18} /> },
  { id: "orders", label: "Orders", icon: <ShoppingCart size={18} /> },
  { id: "wishlist", label: "Wishlist", icon: <Heart size={18} /> },
  { id: "payments", label: "Payments", icon: <DollarSign size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
];

const formatCurrency = (amount, currency = "USD") => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "GÇö";
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

export default function ClientDashboard() {
  const [activeView, setActiveView] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const items = await fetchCatalog();
        if (!isMounted) return;
        setCatalog(items);
        setWishlist(items.slice(0, Math.min(3, items.length)));
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load catalog", err);
        setError(err?.message || "Unable to load marketplace listings");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const catalogCurrency = useMemo(
    () => catalog[0]?.currency || "USD",
    [catalog]
  );
  const totalCatalogValue = useMemo(
    () => catalog.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [catalog]
  );

  const renderContent = () => {
    switch (activeView) {
      case "profile":
        return (
          <ProfileView
            catalog={catalog}
            loading={loading}
            error={error}
            totalValue={totalCatalogValue}
            currency={catalogCurrency}
          />
        );
      case "orders":
        return (
          <OrdersView
            catalog={catalog}
            loading={loading}
            error={error}
            currency={catalogCurrency}
          />
        );
      case "wishlist":
        return (
          <WishlistView
            catalog={catalog}
            wishlist={wishlist}
            setWishlist={setWishlist}
            loading={loading}
            currency={catalogCurrency}
          />
        );
      case "payments":
        return (
          <PaymentsView
            catalog={catalog}
            wishlist={wishlist}
            loading={loading}
            currency={catalogCurrency}
            totalValue={totalCatalogValue}
          />
        );
      case "notifications":
        return <NotificationsView catalog={catalog} loading={loading} />;
      default:
        return (
          <ProfileView
            catalog={catalog}
            loading={loading}
            error={error}
            totalValue={totalCatalogValue}
            currency={catalogCurrency}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Mobile Overlay */}
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
          <h1 className="text-xl font-semibold">Client</h1>
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

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-full">
        {/* Topbar */}
        <header className="flex items-center justify-between p-4 md:p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold capitalize">{activeView}</h2>
          </div>
          <img
            src="https://placehold.co/40x40"
            alt="Profile"
            className="w-10 h-10 rounded-full border border-gray-200"
          />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{renderContent()}</div>
      </main>
    </div>
  );
}

//
// --- Views ---
//
function ProfileView({ catalog, loading, error, totalValue, currency }) {
  const published = catalog.filter((item) => item.status === "published");
  const featured = catalog.slice(0, 3);
  return (
    <>
        <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Welcome back =ƒæï</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<CheckCircle />}
            label="Available Designs"
            value={loading ? "GÇª" : catalog.length}
          />
          <StatCard
            icon={<Clock />}
            label="Published"
            value={loading ? "GÇª" : published.length}
          />
          <StatCard
            icon={<ShoppingCart />}
            label="Wishlist Ready"
            value={loading ? "GÇª" : featured.length}
          />
          <StatCard
            icon={<DollarSign />}
            label="Catalog Value"
            value={loading ? "GÇª" : formatCurrency(totalValue, currency)}
          />
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Featured Marketplace Files</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading designsGÇª</p>
          ) : featured.length === 0 ? (
            <p className="text-sm text-gray-500">
              No designs available yet. Check back after seeding data.
            </p>
          ) : (
            featured.map((item) => (
              <div
                key={item._id || item.slug}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-gray-500">{item.description}</p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700">
                  {formatCurrency(item.price || 0, item.currency || "USD")}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Marketplace Updates</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3 text-sm text-gray-700">
          {loading ? (
            <p>Fetching updatesGÇª</p>
          ) : published.length ? (
            published.map((item) => (
              <p key={item._id || item.slug}>
                =ƒôî <strong>{item.title}</strong> now available for{" "}
                {formatCurrency(item.price || 0, item.currency || "USD")}.
              </p>
            ))
          ) : (
            <p>No published listings yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
function OrdersView({ catalog, loading, error, currency }) {
  const orders = catalog.map((item, index) => ({
    id: item._id || item.slug || index,
    name: item.title,
    status: item.status === "published" ? "Delivered" : "Draft",
    provider: item.firm?.name || "Marketplace",
    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "GÇö",
    price: formatCurrency(item.price || 0, item.currency || currency),
  }));

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">My Orders</h2>
      <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading ordersGÇª</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-500">No purchases yet.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm p-4 rounded-lg bg-gray-50 border"
            >
              <div>
                <p className="font-medium text-base">{order.name}</p>
                <p className="text-gray-500">
                  Provider: {order.provider} GÇó Date: {order.date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800">{order.price}</span>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    order.status === "Delivered"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function WishlistView({ catalog, wishlist, setWishlist, loading, currency }) {
  const removeFromWishlist = (id) =>
    setWishlist((items) =>
      items.filter((item) => (item._id || item.slug) !== id)
    );

  const addToWishlist = (item) =>
    setWishlist((items) => {
      const exists = items.some(
        (existing) => (existing._id || existing.slug) === (item._id || item.slug)
      );
      if (exists) return items;
      return [...items, item];
    });

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">My Wishlist</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading wishlistGÇª</p>
      ) : wishlist.length === 0 ? (
        <div className="text-sm text-gray-500 mb-6">
          Wishlist is empty. Explore designs below and save your favourites.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {wishlist.map((item) => (
            <div
              key={item._id || item.slug}
              className="bg-white border rounded-xl shadow-sm p-4 flex flex-col justify-between"
            >
              <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{item.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatCurrency(item.price || 0, item.currency || currency)}</span>
                <button
                  onClick={() => removeFromWishlist(item._id || item.slug)}
                  className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && catalog.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Explore Designs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalog.map((item) => {
              const id = item._id || item.slug;
              const inWishlist = wishlist.some(
                (existing) => (existing._id || existing.slug) === id
              );
              return (
                <div key={id} className="bg-white border rounded-lg p-4">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                  <p className="text-xs text-gray-400 mb-3">
                    {formatCurrency(item.price || 0, item.currency || currency)}
                  </p>
                  <button
                    className={`text-sm font-semibold ${
                      inWishlist
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:text-blue-700"
                    }`}
                    onClick={() => !inWishlist && addToWishlist(item)}
                    disabled={inWishlist}
                  >
                    {inWishlist ? "Saved" : "Save to wishlist"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function PaymentsView({ catalog, wishlist, loading, currency, totalValue }) {
  const wishlistTotal = wishlist.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );
  const items = wishlist.length > 0 ? wishlist : catalog.slice(0, 3);

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Payments</h2>
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-gray-500">Wishlist Total</p>
            <p className="text-lg font-semibold text-gray-900">
              {loading
                ? "GÇª"
                : formatCurrency(wishlistTotal, wishlist[0]?.currency || currency)}
            </p>
          </div>
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-gray-500">Catalog Value</p>
            <p className="text-lg font-semibold text-gray-900">
              {loading ? "GÇª" : formatCurrency(totalValue, currency)}
            </p>
          </div>
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-gray-500">Designs Selected</p>
            <p className="text-lg font-semibold text-gray-900">
              {loading ? "GÇª" : wishlist.length || catalog.length}
            </p>
          </div>
        </div>

        <h3 className="font-semibold">Ready for Checkout</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Preparing payment summaryGÇª</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">
            Add designs to your wishlist to prepare a payment.
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {items.map((item) => (
              <li
                key={item._id || item.slug}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    {item.status === "published" ? "Available instantly" : "Draft"}
                  </p>
                </div>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(item.price || 0, item.currency || currency)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          disabled={loading || items.length === 0}
          className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition ${
            items.length === 0
              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
              : "border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          Proceed to Payment
        </button>
      </div>
    </section>
  );
}

function NotificationsView({ catalog, loading }) {
  const notifications = (catalog || []).map((item, index) => ({
    id: item._id || item.slug || index,
    text: `${item.title} is now available for download.`,
    time: item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString()
      : "Recently added",
    icon: <ShoppingCart />,
  }));
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      <div className="bg-gray-50 border rounded-xl p-6 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading notificationsà</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-500">
            No notifications yet. Uploads will appear here as they go live.
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 bg-white border rounded-lg p-4"
            >
              <div className="text-gray-600">{n.icon}</div>
              <div>
                <p className="text-gray-800 text-sm">{n.text}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

//
// --- Reusable Components ---
//
function SidebarButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-gray-700 transition-colors ${
        isActive ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center space-x-3 shadow-sm">
      <div className="bg-gray-50 p-2 rounded-full border">{icon}</div>
      <div>
        <h3 className="text-xs text-gray-500">{label}</h3>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}


