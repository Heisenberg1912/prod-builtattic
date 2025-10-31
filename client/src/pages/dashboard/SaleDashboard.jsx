import { useState } from "react";
import {
  DollarSign,
  Package,
  TrendingUp,
  ShoppingCart,
  Bell,
  Plus,
  BarChart2,
  Menu,
  X,
} from "lucide-react";
const sidebarItems = [
  { id: "overview", label: "Overview", icon: <TrendingUp size={18} /> },
  { id: "transactions", label: "Orders", icon: <ShoppingCart size={18} /> },
  { id: "inventory", label: "Portfolio", icon: <Package size={18} /> },
  { id: "revenue", label: "Revenue", icon: <DollarSign size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
];

export default function VendorDashboard() {
  const [activeView, setActiveView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case "overview": return <OverviewView />;
      case "transactions": return <TransactionsView />;
      case "inventory": return <InventoryView />;
      case "revenue": return <RevenueView />;
      case "notifications": return <NotificationsView />;
      default: return <OverviewView />;
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
          <h1 className="text-xl font-semibold">Vendor</h1>
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
function OverviewView() {
  const transactions = [
    { id: "#TXN101", client: "BuildCorp Ltd", material: "Cement", amount: "$1,200", status: "Completed" },
    { id: "#TXN102", client: "Govt Project", material: "Steel Rods", amount: "$2,500", status: "Pending" },
  ];
  const inventoryAlerts = [
    { material: "Bricks", status: "Low Stock" },
    { material: "Tiles", status: "Critical" },
  ];
    return (
      <>
        <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Marketplace Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<DollarSign />} label="Revenue" value="$120,500" />
          <StatCard icon={<ShoppingCart />} label="Total Orders" value="450" />
          <StatCard icon={<TrendingUp />} label="Profit Margin" value="18%" />
          <StatCard icon={<Package />} label="Materials Sold" value="3,700" />
        </div>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="bg-white border rounded-xl p-6">
            <ul className="space-y-3 text-sm">
              {transactions.map((t) => (
                <li key={t.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{t.material}</p>
                    <p className="text-gray-500">{t.client} ù {t.id}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-xl font-semibold ${
                      t.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {t.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-4">Inventory Alerts</h2>
          <div className="bg-white border rounded-xl p-6">
            <ul className="space-y-3 text-sm">
              {inventoryAlerts.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <p>{item.material}</p>
                  <span
                    className={`px-3 py-1 text-xs rounded-xl font-semibold ${
                      item.status === "Critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

function TransactionsView() {
  const transactions = [
    { id: "#TXN101", client: "BuildCorp Ltd", material: "Cement", amount: "$1,200", status: "Completed" },
    { id: "#TXN102", client: "Govt Project", material: "Steel Rods", amount: "$2,500", status: "Pending" },
    { id: "#TXN103", client: "DesignPro", material: "Paint", amount: "$800", status: "Completed" },
    { id: "#TXN104", client: "UrbanBuild Co.", material: "Bricks", amount: "$3,100", status: "Completed" },
  ];
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">All Transactions</h2>
      <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-4">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="flex justify-between items-center text-sm p-4 rounded-lg bg-gray-50 border"
          >
            <div>
              <p className="font-medium text-base">
                {t.material} <span className="text-gray-500">({t.id})</span>
              </p>
              <p className="text-gray-500">Client: {t.client}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-base">{t.amount}</p>
              <p
                className={`text-xs font-semibold ${
                  t.status === "Completed"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {t.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InventoryView() {
  const inventory = [
    { name: "Cement", stock: 500, unit: "bags", status: "In Stock" },
    { name: "Steel Rods", stock: 250, unit: "tons", status: "In Stock" },
    { name: "Bricks", stock: 80, unit: "pallets", status: "Low Stock" },
    { name: "Tiles", stock: 20, unit: "boxes", status: "Critical" },
  ];
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <button className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
          <Plus size={16} /> Add Item
        </button>
      </div>
      <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-4">
        {inventory.map((item) => (
          <div
            key={item.name}
            className="flex justify-between items-center text-sm p-4 rounded-lg bg-gray-50 border"
          >
            <div>
              <p className="font-medium text-base">{item.name}</p>
              <p className="text-gray-500">{item.stock} {item.unit}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                item.status === "In Stock"
                  ? "bg-green-100 text-green-700"
                  : item.status === "Low Stock"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RevenueView() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Revenue Details</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-gray-800 text-white p-6 rounded-xl h-full flex flex-col justify-center">
            <p className="text-gray-300 text-sm">Total Revenue</p>
            <p className="text-4xl font-bold mt-2">$120,500.00</p>
            <p className="text-green-400 text-sm mt-2">+15% from last month</p>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white border rounded-xl p-6 flex items-center justify-center">
          <div className="text-center">
            <BarChart2 className="h-16 w-16 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">Monthly revenue chart coming soon.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotificationsView() {
  const notifications = [
    { id: 1, text: "Payment of $2,500 received from Govt Project.", time: "1 hour ago", icon: <DollarSign /> },
    { id: 2, text: "Low stock alert: Tiles running low.", time: "5 hours ago", icon: <Package /> },
    { id: 3, text: "New purchase order from UrbanBuild Co.", time: "1 day ago", icon: <ShoppingCart /> },
  ];
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      <div className="bg-gray-50 border rounded-xl p-6 space-y-4">
        {notifications.map(n => (
          <div
            key={n.id}
            className="flex items-start gap-4 p-4 bg-white rounded-lg border"
          >
            <div className="text-gray-500 mt-1">{n.icon}</div>
            <div>
              <p className="text-gray-800">{n.text}</p>
              <p className="text-gray-400 text-xs mt-1">{n.time}</p>
            </div>
          </div>
        ))}
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



