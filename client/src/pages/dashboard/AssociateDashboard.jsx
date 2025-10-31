import { useState } from "react";
import {
  User,
  Briefcase,
  DollarSign,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  XCircle,
  Loader,
  Menu,
  X,
} from "lucide-react";

const sidebarItems = [
  { id: "profile", label: "Profile", icon: <User size={18} /> },
  { id: "jobs", label: "Jobs", icon: <Briefcase size={18} /> },
  { id: "earnings", label: "Earnings", icon: <DollarSign size={18} /> },
  { id: "applications", label: "Applications", icon: <FileText size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
];

export default function AssociateDashboard() {
  const [activeView, setActiveView] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case "jobs": return <JobsView />;
      case "earnings": return <EarningsView />;
      case "applications": return <ApplicationsView />;
      case "notifications": return <NotificationsView />;
      default: return <ProfileView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Overlay for mobile sidebar */}
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
          <h1 className="text-xl font-semibold">Associate</h1>
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

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{renderContent()}</div>
      </main>
    </div>
  );
}

//
// --- Views ---
//
function ProfileView() {
  const jobs = [
    { id: 1, title: "Interior Design Project", status: "Ongoing", client: "ABC Constructions" },
    { id: 2, title: "Renovation Job", status: "Completed", client: "HomeStyle Inc" },
  ];
  const isBusy = jobs.some((job) => job.status === "Ongoing");

  return (
    <>
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Welcome back, Alex 👋</h2>
          <span
            className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isBusy ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full mr-2 ${isBusy ? "bg-red-500" : "bg-green-500"}`}
            ></span>
            {isBusy ? "Busy" : "Available"}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<CheckCircle />} label="Completed Jobs" value="18" />
          <StatCard icon={<Clock />} label="Ongoing Jobs" value="1" />
          <StatCard icon={<Briefcase />} label="Pending Jobs" value="3" />
          <StatCard icon={<DollarSign />} label="Total Earnings" value="$2,340" />
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3 text-sm text-gray-700">
          <p>📌 New job request: Plumbing Work from <b>BlueWater Co.</b></p>
          <p>📌 Your application for "Painting Job" has been approved.</p>
          <p>📌 You received a payment of <b>$450</b> from <b>ABC Constructions</b>.</p>
        </div>
      </section>
    </>
  );
}

function JobsView() {
  const jobs = [
    { id: 1, title: "Interior Design Project", status: "Ongoing", client: "ABC Constructions" },
    { id: 2, title: "Electrical Fitting Work", status: "Pending", client: "XYZ Pvt Ltd" },
    { id: 3, title: "Renovation Job", status: "Completed", client: "HomeStyle Inc" },
  ];
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">My Jobs</h2>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex justify-between items-center text-sm p-4 rounded-lg bg-gray-50 border"
            >
              <div>
                <p className="font-medium text-base">{job.title}</p>
                <p className="text-gray-500">Client: {job.client}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                  job.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : job.status === "Ongoing"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {job.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EarningsView() {
  const earnings = [
    { id: 1, from: "ABC Constructions", amount: "+$450.00", date: "2024-08-22" },
    { id: 2, from: "HomeStyle Inc", amount: "+$800.00", date: "2024-08-20" },
  ];
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Earnings</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 text-white p-6 rounded-xl">
          <p className="text-gray-300 text-sm">Total Earnings</p>
          <p className="text-3xl font-bold mt-2">$2,340.00</p>
        </div>
        <div className="lg:col-span-2 bg-gray-50 border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Payouts</h3>
          <ul className="space-y-3">
            {earnings.map((e) => (
              <li key={e.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-gray-800">From {e.from}</p>
                  <p className="text-gray-400 text-xs">{e.date}</p>
                </div>
                <p className="font-medium text-green-600">{e.amount}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ApplicationsView() {
  const applications = [
    { id: 1, title: "Painting Job", status: "Approved", icon: <CheckCircle className="text-green-500" /> },
    { id: 2, title: "Plumbing Work", status: "Pending", icon: <Loader className="text-yellow-500 animate-spin" /> },
    { id: 3, title: "Carpentry Project", status: "Rejected", icon: <XCircle className="text-red-500" /> },
  ];
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Job Applications</h2>
      <div className="bg-gray-50 border rounded-xl p-6 space-y-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border"
          >
            <div className="flex items-center gap-4">
              {app.icon}
              <p className="text-gray-800 font-medium">{app.title}</p>
            </div>
            <p className="text-sm font-semibold">{app.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function NotificationsView() {
  const notifications = [
    { id: 1, text: "New job request: Plumbing Work from BlueWater Co.", time: "1 hour ago", icon: <Briefcase /> },
    { id: 2, text: "Your application for 'Painting Job' has been approved.", time: "3 hours ago", icon: <CheckCircle /> },
  ];
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      <div className="bg-gray-50 border rounded-xl p-6 space-y-4">
        {notifications.map((n) => (
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
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center space-x-3 shadow-sm">
      <div className="bg-gray-50 p-2 rounded-full border">{icon}</div>
      <div>
        <h3 className="text-xs text-gray-500">{label}</h3>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
