import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  Building2,
  Briefcase,
  ShoppingCart,
  UserCog,
  LayoutDashboard,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { fetchAdminUsers, fetchCatalog, fetchFirms } from "../../services/marketplace.js";

// Sidebar config
const sidebarItems = [
  { id: "Dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "Users", label: "Users", icon: <Users size={18} /> },
  { id: "Associates", label: "Associates", icon: <UserCog size={18} /> },
  { id: "Firms", label: "Firms", icon: <Building2 size={18} /> },
  { id: "Clients", label: "Clients", icon: <Briefcase size={18} /> },
  { id: "Marketplace", label: "Marketplace", icon: <ShoppingCart size={18} /> },
];

const formatCurrency = (amount, currency = "USD") => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "G��";
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
  if (!input) return "G��";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "G��";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

export default function SuperAdminDashboard({ onLogout }) {
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataState, setDataState] = useState({
    loading: true,
    products: [],
    firms: [],
    users: [],
    error: null,
  });
  const navigate = useNavigate();

  const normalizedSearch = search.trim().toLowerCase();
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
    return {
      totalUsers: dataState.users.length,
      totalFirms: dataState.firms.length,
      totalProducts: dataState.products.length,
      publishedProducts: publishedProducts.length,
      totalRevenue,
      categories: Array.from(categories),
    };
  }, [dataState]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setDataState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [products, firms, users] = await Promise.all([
          fetchCatalog(),
          fetchFirms(),
          fetchAdminUsers(),
        ]);
        if (!isMounted) return;
        setDataState({
          loading: false,
          products,
          firms,
          users,
          error: null,
        });
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
  }, []);

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
    loading: dataState.loading,
    error: dataState.error,
    stats: dashboardStats,
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      navigate("/login", { replace: true });
    } else {
      // Fallback (should not happen if prop passed)
      localStorage.removeItem("auth_token");
      localStorage.removeItem("role");
      window.location.replace("/login");
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "Users": return <UsersView {...viewProps} />;
      case "Associates": return <AssociatesView {...viewProps} />;
      case "Firms": return <FirmsView {...viewProps} />;
      case "Clients": return <ClientsView {...viewProps} />;
      case "Marketplace": return <MarketplaceView {...viewProps} />;
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
function DashboardView({ stats, products, loading, error }) {
  const cards = [
    {
      key: "users",
      icon: <Users />,
      title: "Users",
      description: loading ? "LoadingGǪ" : `${stats?.totalUsers ?? 0} total users`,
    },
    {
      key: "firms",
      icon: <Building2 />,
      title: "Firms",
      description: loading ? "LoadingGǪ" : `${stats?.totalFirms ?? 0} partner firms`,
    },
    {
      key: "products",
      icon: <ShoppingCart />,
      title: "Published Listings",
      description: loading ? "LoadingGǪ" : `${stats?.publishedProducts ?? 0} live products`,
    },
    {
      key: "revenue",
      icon: <DollarSign />,
      title: "Potential Revenue",
      description: loading
        ? "LoadingGǪ"
        : formatCurrency(stats?.totalRevenue ?? 0, products[0]?.currency || "USD"),
    },
    {
      key: "categories",
      icon: <Briefcase />,
      title: "Categories",
      description: loading
        ? "LoadingGǪ"
        : `${stats?.categories?.length ?? 0} active categories`,
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
            <div className="px-4 py-6 text-sm text-gray-500">Loading listingsGǪ</div>
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
    </>
  );
}

function UsersView({ search, users, loading }) {
  const filtered = (users || []).filter((user) => {
    if (!search) return true;
    const values = [
      user.email,
      resolveUserRole(user),
      user.memberships?.map((m) => m.role).join(", "),
    ].filter(Boolean);
    return values.some((value) =>
      String(value).toLowerCase().includes(search)
    );
  });

  return (
    <Section title="User Management">
      {loading ? (
        <div className="text-sm text-gray-500">Loading user listGǪ</div>
      ) : filtered.length === 0 ? (
        <EmptySearchNotice term={search} />
      ) : (
        <Table
          headers={["Email", "Role", "Joined"]}
          rows={filtered.map((user) => [
            <span>
              {user.email}
              <br />
              <span className="text-gray-400">
                {user.memberships?.length
                  ? `${user.memberships.length} membership${user.memberships.length > 1 ? "s" : ""}`
                  : "No memberships"}
              </span>
            </span>,
            resolveUserRole(user),
            formatDate(user.createdAt),
          ])}
        />
      )}
    </Section>
  );
}

function AssociatesView({ search, users, loading }) {
  const associates = (users || []).filter((user) =>
    user.memberships?.some((m) => m.role === "associate")
  );
  const filtered = associates.filter((associate) => {
    if (!search) return true;
    return associate.email.toLowerCase().includes(search);
  });

  return (
    <Section title="Associates">
      {loading ? (
        <div className="text-sm text-gray-500">Loading associatesGǪ</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-500">
          {associates.length === 0
            ? "No associates onboarded yet."
            : `No associates found for Gǣ${search}Gǥ.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((associate) => (
            <div key={associate._id} className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold">{associate.email}</h3>
              <p className="text-sm text-gray-500">
                {associate.memberships
                  ?.filter((m) => m.role === "associate")
                  .map((m) => `Firm #${m.firm}`)
                  .join(", ") || "Marketplace Associate"}
              </p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function FirmsView({ search, firms, loading }) {
  const filtered = (firms || []).filter((firm) => {
    if (!search) return true;
    return [firm.name, firm.slug, firm.ownerUserId]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  return (
    <Section title="Firms">
      {loading ? (
        <div className="text-sm text-gray-500">Loading firmsGǪ</div>
      ) : filtered.length === 0 ? (
        <EmptySearchNotice term={search} />
      ) : (
        <div className="space-y-3">
          {filtered.map((firm) => (
            <div
              key={firm._id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 bg-gray-50 rounded-lg border"
            >
              <div>
                <h3 className="font-semibold">{firm.name}</h3>
                <p className="text-sm text-gray-500">Slug: {firm.slug}</p>
                <p className="text-xs text-gray-400">
                  Owner: {firm.ownerUserId || "Unassigned"}
                </p>
              </div>
              <StatusBadge status={firm.approved ? "Verified" : "Pending"} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ClientsView({ search, users, loading }) {
  const clients = (users || []).filter((user) => user.isClient !== false);
  const filtered = clients.filter((client) => {
    if (!search) return true;
    return client.email.toLowerCase().includes(search);
  });

  return (
    <Section title="Clients">
      {loading ? (
        <div className="text-sm text-gray-500">Loading clientsGǪ</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-500">
          {clients.length === 0
            ? "No clients have registered yet."
            : `No clients found for Gǣ${search}Gǥ.`}
        </div>
      ) : (
        <Table
          headers={["Email", "Type", "Joined"]}
          rows={filtered.map((client) => [
            client.email,
            resolveUserRole(client),
            formatDate(client.createdAt),
          ])}
        />
      )}
    </Section>
  );
}

function MarketplaceView({ search, products, loading }) {
  const filtered = (products || []).filter((product) => {
    if (!search) return true;
    return [product.title, product.slug, product.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  return (
    <Section title="Marketplace Listings">
      {loading ? (
        <div className="text-sm text-gray-500">Loading listingsGǪ</div>
      ) : filtered.length === 0 ? (
        <EmptySearchNotice term={search} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((product) => (
            <li
              key={product._id || product.slug}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm bg-white p-4 rounded-lg border"
            >
              <div>
                <p className="font-medium text-gray-900">{product.title}</p>
                <p className="text-gray-500">{product.slug}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-800">
                  {formatCurrency(product.price || 0, product.currency || "USD")}
                </span>
                <StatusBadge status={(product.status || "draft").replace(/^\w/, (c) => c.toUpperCase())} />
              </div>
            </li>
          ))}
        </ul>
      )}
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
  const styles = {
    Active: "bg-green-100 text-green-700",
    Completed: "bg-green-100 text-green-700",
    Inactive: "bg-red-100 text-red-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Verified: "bg-blue-100 text-blue-700",
    Published: "bg-green-100 text-green-700",
    Draft: "bg-gray-200 text-gray-700",
  };
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
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

