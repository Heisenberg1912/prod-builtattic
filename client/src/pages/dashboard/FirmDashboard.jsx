import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Users,
  Briefcase,
  DollarSign,
  Bell,
  UserCheck,
  UserX,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { fetchCatalog, fetchFirmById } from "../../services/marketplace.js";

const sidebarItems = [
  { id: "overview", label: "Overview", icon: <Building2 size={18} /> },
  { id: "employees", label: "Employees", icon: <Users size={18} /> },
  { id: "projects", label: "Projects", icon: <Briefcase size={18} /> },
  { id: "earnings", label: "Earnings", icon: <DollarSign size={18} /> },
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

const formatDate = (input) => {
  if (!input) return "GÇö";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "GÇö";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function FirmDashboard() {
  const [activeView, setActiveView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firm, setFirm] = useState(null);
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const storedUser =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user") || "null")
            : null;
        if (isMounted) setOwner(storedUser);
        const firmId = storedUser?.memberships?.[0]?.firm;
        const [catalogItems, firmDetails] = await Promise.all([
          fetchCatalog(firmId ? { firmId } : {}),
          fetchFirmById(firmId),
        ]);
        if (!isMounted) return;
        setProducts(catalogItems);
        setFirm(
          firmDetails ||
            (firmId
              ? { _id: firmId, name: "Your Firm", approved: false }
              : null)
        );
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load firm dashboard data", err);
        setError(err?.message || "Unable to load firm data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const currency = useMemo(
    () => products[0]?.currency || "USD",
    [products]
  );
  const totals = useMemo(() => {
    const published = products.filter((item) => item.status === "published");
    const totalValue = products.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );
    return {
      publishedCount: published.length,
      totalProducts: products.length,
      totalValue,
    };
  }, [products]);

  const viewProps = {
    products,
    firm,
    owner,
    loading,
    error,
    currency,
    totals,
  };

  const renderContent = () => {
    switch (activeView) {
      case "overview": return <OverviewView {...viewProps} />;
      case "employees": return <EmployeesView {...viewProps} />;
      case "projects": return <ProjectsView {...viewProps} />;
      case "earnings": return <EarningsView {...viewProps} />;
      case "notifications": return <NotificationsView {...viewProps} />;
      default: return <OverviewView {...viewProps} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Overlay for mobile */}
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
          <h1 className="text-xl font-semibold">Firm</h1>
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
function OverviewView({ firm, products, loading, error, totals, currency }) {
  const latestProducts = products.slice(0, 4);
  const draftCount = totals.totalProducts - totals.publishedCount;

    return (
      <>
        <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {firm?.name ? `Welcome, ${firm.name} =ƒæï` : "Welcome back =ƒæï"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Briefcase />}
            label="Published Designs"
            value={loading ? "GÇª" : totals.publishedCount}
          />
          <StatCard
            icon={<UserCheck />}
            label="Drafts"
            value={loading ? "GÇª" : Math.max(draftCount, 0)}
          />
          <StatCard
            icon={<DollarSign />}
            label="Catalog Value"
            value={loading ? "GÇª" : formatCurrency(totals.totalValue, currency)}
          />
          <StatCard
            icon={<ShoppingCart />}
            label="Listings"
            value={loading ? "GÇª" : totals.totalProducts}
          />
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Listings</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading listingsGÇª</p>
          ) : latestProducts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No designs published yet. Upload your first design to get started.
            </p>
          ) : (
            latestProducts.map((product) => (
              <div
                key={product._id || product.slug}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-gray-500">{product.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(product.price || 0, product.currency || currency)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                      product.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {product.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Latest Activity</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3 text-sm text-gray-700">
          {loading ? (
            <p>Checking for recent activityGÇª</p>
          ) : latestProducts.length ? (
            latestProducts.map((product) => (
              <p key={product._id || product.slug}>
                =ƒÜÇ <strong>{product.title}</strong> updated{" "}
                {formatDate(product.updatedAt || product.createdAt)}.
              </p>
            ))
          ) : (
            <p>No activity recorded yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

function EmployeesView({ owner, firm }) {
  const memberships = owner?.memberships || [];
  const team = memberships.map((membership, index) => ({
    id: `${membership.firm}-${membership.role}-${index}`,
    name: owner?.email || "Firm Owner",
    role: membership.role,
    firm: firm?.name || membership.firm,
    status: "Active",
  }));

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Team</h2>
        <button className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
          <Plus size={16} /> Invite Member
        </button>
      </div>
      <div className="bg-white border rounded-2xl shadow-sm p-6">
        {team.length === 0 ? (
          <p className="text-sm text-gray-500">
            No team members yet. As soon as you add associates to the firm, they
            will appear here.
          </p>
        ) : (
          <ul className="space-y-4">
            {team.map((member) => (
              <li
                key={member.id}
                className="flex justify-between items-center text-sm p-4 rounded-lg bg-gray-50 border"
              >
                <div>
                  <p className="font-medium text-base">{member.name}</p>
                  <p className="text-gray-500 capitalize">
                    {member.role} GÇó {member.firm}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-green-100 text-green-700">
                  {member.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProjectsView({ products, loading, currency }) {
  const items = products.map((product) => ({
    id: product._id || product.slug,
    name: product.title,
    status: product.status === "published" ? "Live" : "Draft",
    description: product.description,
    price: formatCurrency(product.price || 0, product.currency || currency),
    createdAt: formatDate(product.createdAt),
  }));

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Marketplace Projects</h2>
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading projectsà</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">
            No projects yet. Upload designs to populate your marketplace catalogue.
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-gray-50 border rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Listed {item.createdAt}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    item.status === "Live"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>Catalog Price</span>
                <span className="font-semibold text-gray-900">{item.price}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function EarningsView({ products, loading, currency, totals }) {
  const published = products.filter((product) => product.status === "published");
  const transactions = published.map((product) => ({
    id: product._id || product.slug,
    title: product.title,
    amount: formatCurrency(product.price || 0, product.currency || currency),
    date: formatDate(product.updatedAt || product.createdAt),
  }));

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Earnings</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 text-white p-6 rounded-xl">
          <p className="text-gray-300 text-sm">Total Catalog Value</p>
          <p className="text-3xl font-bold mt-2">
            {loading ? "à" : formatCurrency(totals.totalValue, currency)}
          </p>
        </div>
        <div className="lg:col-span-2 bg-gray-50 border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Published Listings</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading transactionsà</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Publish a design to start tracking earnings.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {transactions.map((txn) => (
                <li key={txn.id} className="flex justify-between">
                  <div>
                    <p className="text-gray-800">{txn.title}</p>
                    <p className="text-gray-400 text-xs">{txn.date}</p>
                  </div>
                  <p className="font-medium text-green-600">{txn.amount}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function NotificationsView({ products, loading }) {
  const updates = products.map((product, index) => ({
    id: product._id || product.slug || index,
    message: `${product.title} ${product.status === "published" ? "went live" : "saved as draft"}.`,
    time: formatDate(product.updatedAt || product.createdAt),
    icon: product.status === "published" ? <DollarSign /> : <Briefcase />,
  }));

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      <div className="bg-gray-50 border rounded-xl p-6 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Checking activityà</p>
        ) : updates.length === 0 ? (
          <p className="text-sm text-gray-500">
            No notifications yet. Publish a design to see updates here.
          </p>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="flex items-start gap-4 p-4 bg-white rounded-lg border"
            >
              <div className="text-gray-600">{update.icon}</div>
              <div>
                <p className="text-gray-800 text-sm">{update.message}</p>
                <p className="text-xs text-gray-400 mt-1">{update.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

//
// --- Reusable ---
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







