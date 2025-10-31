import { useState, useEffect } from "react";
import {
  ShoppingBag,
  User,
  Bell,
  Wallet,
  Brush,
  Plus,
  Trash2,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fallbackStudios } from "../../data/marketplace.js";

// Helpers to read user info from storage/JWT
const safeJSON = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; }
};
const decodeJwtPayload = (t) => {
  try {
    const [, p] = t.split(".");
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
};
const loadUserFromStorage = () => {
  const direct =
    safeJSON("user") ||
    safeJSON("auth_user") ||
    safeJSON("profile");
  if (direct) return direct;
  const tok = localStorage.getItem("auth_token") || localStorage.getItem("token");
  const payload = tok ? decodeJwtPayload(tok) : null;
  if (payload) {
    return {
      id: payload.sub || payload.id,
      name: payload.name || payload.fullName || payload.username || "User",
      email: payload.email || "",
      role: payload.role || "",
      phone: payload.phone || payload.phoneNumber,
      avatar: payload.picture || payload.avatar || payload.avatarUrl,
    };
  }
  return { name: "User", email: "", role: "" };
};

const sidebarItems = [
  { id: "profile", label: "Profile", icon: <User size={18} /> },
  { id: "designs", label: "My Designs", icon: <Brush size={18} /> },
  { id: "purchased", label: "Designs Purchased", icon: <ShoppingBag size={18} /> },
  { id: "wallet", label: "Wallet", icon: <Wallet size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
];

export default function UserDashboard() {
  const [activeView, setActiveView] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchasedDesigns, setPurchasedDesigns] = useState([
    { id: 1, name: "Modern Suburban Villa", style: "Modern", img: "https://placehold.co/300x200?text=Villa" },
    { id: 2, name: "Minimalist City Loft", style: "Minimalist", img: "https://placehold.co/300x200?text=Loft" },
    { id: 3, name: "Cozy Country Home", style: "Rustic", img: "https://placehold.co/300x200?text=Home" },
  ]);
  const navigate = useNavigate();

  // Load real user from storage/JWT
  const [user, setUser] = useState(() => loadUserFromStorage());
  useEffect(() => {
    const update = () => setUser(loadUserFromStorage());
    window.addEventListener("storage", update);
    window.addEventListener("auth:login", update);
    window.addEventListener("profile:updated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("auth:login", update);
      window.removeEventListener("profile:updated", update);
    };
  }, []);

  const removeFromPurchased = (id) => {
    setPurchasedDesigns(purchasedDesigns.filter((item) => item.id !== id));
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      // optionally clear any other auth-related keys here
    } catch {}
    // notify listeners if needed
    try { window.dispatchEvent(new CustomEvent("auth:logout")); } catch {}
    navigate("/login", { replace: true });
  };

  const renderContent = () => {
    switch (activeView) {
      case "profile": return <ProfileView user={user} purchasedDesignsCount={purchasedDesigns.length} />;
      case "designs": return <MyDesignsView />;
      case "purchased": return <PurchasedDesignsView purchasedDesigns={purchasedDesigns} onRemove={removeFromPurchased} />;
      case "wallet": return <WalletView />;
      case "notifications": return <NotificationsView />;
      default: return <ProfileView user={user} purchasedDesignsCount={purchasedDesigns.length} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#1b1f24] text-gray-100">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 w-64 bg-[#1f232c] border-r border-[#2d3340] p-4 text-gray-100 flex-col transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">My Dashboard</h1>
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
      <main className="flex-1 flex flex-col max-w-full bg-[#141820]">
        {/* Topbar */}
        <header className="flex items-center justify-between p-4 md:p-6 border-b border-[#2d3340] bg-[#1d222b]">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[#262c37]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold capitalize">{activeView}</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Optional small identity display */}
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-100">{user?.name || "User"}</div>
              {user?.email ? <div className="text-xs text-gray-400">{user.email}</div> : null}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 text-sm border border-[#2d3340] rounded-lg hover:bg-[#232937]"
            >
              Logout
            </button>
            <img
              src={user?.avatar || "https://placehold.co/40x40"}
              alt={user?.name || "Profile"}
              className="w-10 h-10 rounded-full border border-[#2d3340]"
            />
          </div>
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
function ProfileView({ purchasedDesignsCount, user }) {
  return (
    <>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Welcome back, {user?.name || "User"}</h2>
        {/* Quick account info */}
        <div className="bg-[#1d222b] rounded-xl border border-[#2d3340] p-4 mb-4 text-sm text-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><span className="text-gray-300">Name:</span> <span className="font-medium">{user?.name || "-"}</span></div>
            <div><span className="text-gray-300">Email:</span> <span className="font-medium break-all">{user?.email || "-"}</span></div>
            {user?.phone && <div><span className="text-gray-300">Phone:</span> <span className="font-medium">{user.phone}</span></div>}
            {user?.role && <div><span className="text-gray-300">Role:</span> <span className="font-medium capitalize">{user.role}</span></div>}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Brush />} label="Active Projects" value="3" />
          <StatCard icon={<ShoppingBag />} label="Designs Purchased" value={purchasedDesignsCount} />
          <StatCard icon={<Wallet />} label="Wallet Balance" value="$1,250" />
          <StatCard icon={<Bell />} label="Notifications" value="5" />
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Active Projects</h2>
        <div className="bg-[#1d2129] border border-[#2d3340] rounded-xl p-6 space-y-3 text-sm">
          <ProjectItem title="Downtown Office Redesign" status="In Progress" color="blue" />
          <ProjectItem title="Suburban Home Extension" status="Pending Review" color="yellow" />
          <ProjectItem title="Beach House Concept" status="Completed" color="green" />
        </div>
      </section>
    </>
  );
}

function MyDesignsView() {
  return (
    <div className="text-center flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold mb-4">My Designs</h2>
      <p className="text-gray-300 mb-6 max-w-md">This is your creative space. Start a new project or manage your existing designs.</p>
      <button className="flex items-center gap-2 bg-[#2d3442] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#3b4354] transition-colors">
        <Plus /> Start New Design
      </button>
    </div>
  );
}

function PurchasedDesignsView({ purchasedDesigns, onRemove }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Designs Purchased</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchasedDesigns.length > 0 ? (
          purchasedDesigns.map((item) => (
            <div key={item.id} className="bg-[#242b36] border border-[#2d3340] rounded-xl shadow-sm overflow-hidden group">
              <img src={item.img} alt={item.name} className="w-full h-32 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-300 text-sm">{item.style}</p>
              </div>
              <div className="p-4 border-t border-[#2d3340] opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2"
                >
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-300 col-span-full">You haven&apos;t purchased any designs yet.</p>
        )}
      </div>
    </section>
  );
}

function WalletView() {
  const transactions = [
    { id: 1, desc: "Added funds", amount: "+$500.00", date: "2024-08-23" },
    { id: 2, desc: "Design purchase: 'Modern Villa'", amount: "-$150.00", date: "2024-08-22" },
  ];
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">My Wallet</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#2d3442] text-white p-6 rounded-xl">
          <p className="text-gray-300 text-sm">Current Balance</p>
          <p className="text-3xl font-bold mt-2">$1,250.00</p>
          <div className="flex gap-3 mt-4">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#303747] text-gray-100 px-4 py-2 rounded-lg font-semibold hover:bg-[#3b4354]">
              <Plus size={16} /> Add Funds
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#303747] text-gray-100 px-4 py-2 rounded-lg font-semibold hover:bg-[#3b4354]">
              <ArrowRight size={16} /> Withdraw
            </button>
          </div>
        </div>
        <div className="lg:col-span-2 bg-[#1d2129] border border-[#2d3340] rounded-xl p-6">
          <h3 className="font-semibold mb-4">Transaction History</h3>
          <ul className="space-y-3 text-sm">
            {transactions.map((t) => (
              <li key={t.id} className="flex justify-between">
                <div>
                  <p className="text-gray-100">{t.desc}</p>
                  <p className="text-gray-400 text-xs">{t.date}</p>
                </div>
                <p className={t.amount.startsWith("+") ? "text-green-600" : "text-red-600"}>{t.amount}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function NotificationsView() {
  const notifications = [
    { id: 1, text: "Your design 'Modern Villa' has been approved.", time: "2 hours ago", icon: <Brush /> },
    { id: 2, text: "You have a new message from Studio Mosby.", time: "1 day ago", icon: <User /> },
  ];
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      <div className="bg-[#1d2129] border border-[#2d3340] rounded-xl p-6 space-y-4">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-4 p-4 bg-[#242b36] rounded-lg border border-[#2d3340]">
            <div className="text-gray-300 mt-1">{n.icon}</div>
            <div>
              <p className="text-gray-100">{n.text}</p>
              <p className="text-gray-400 text-xs mt-1">{n.time}</p>
            </div>
          </div>
        ))}
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
      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-gray-200 transition-colors ${
        isActive ? "bg-[#303747] text-white font-semibold" : "hover:bg-[#262c37]"
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-[#242b36] rounded-xl border border-[#2d3340] p-4 flex items-center space-x-3 shadow-sm">
      <div className="bg-[#1d2129] p-2 rounded-full border border-[#2d3340]">{icon}</div>
      <div>
        <h3 className="text-xs text-gray-300">{label}</h3>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

function ProjectItem({ title, status, color }) {
  return (
    <li className="flex justify-between items-center">
      <span>{title}</span>
      <span className={`bg-${color}-100 text-${color}-700 px-2 py-1 rounded-full text-xs font-medium`}>
        {status}
      </span>
    </li>
  );
}
