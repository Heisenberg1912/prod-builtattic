import { useMemo } from "react";
import { ShieldCheck, ClipboardList, Users, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const summaryCards = useMemo(
    () => [
      { icon: <ShieldCheck className="h-5 w-5" />, label: "Pending Reviews", value: 4 },
      { icon: <ClipboardList className="h-5 w-5" />, label: "Open Tickets", value: 7 },
      { icon: <Users className="h-5 w-5" />, label: "New Registrations", value: 12 },
      { icon: <AlertTriangle className="h-5 w-5" />, label: "Flags Raised", value: 1 },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white border-b p-6">
        <h1 className="text-2xl font-semibold">Platform Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor submissions and keep the marketplace clean.
        </p>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-10">
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm"
              >
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">{card.icon}</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
                  <p className="text-lg font-semibold">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Awaiting Moderation</h2>
            <p className="text-sm text-gray-500">Latest marketplace submissions that need attention.</p>
          </div>
          <ul className="divide-y text-sm">
            {[
              { title: "Eco Resort Blueprint", type: "Product", submittedBy: "vendor@builtattic.com", age: "2h ago" },
              { title: "Studio Credentials Update", type: "Firm Profile", submittedBy: "firm@builtattic.com", age: "5h ago" },
              { title: "Marketplace Refund Request", type: "Client Ticket", submittedBy: "client@builtattic.com", age: "1d ago" },
            ].map((item) => (
              <li key={item.title} className="flex flex-col md:flex-row md:justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-gray-500">
                    {item.type} • {item.submittedBy}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{item.age}</span>
                  <button className="text-indigo-600 text-sm font-medium hover:underline">
                    Review
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Approve Listings", hint: "Vendor submissions awaiting moderation" },
              { label: "Respond to Tickets", hint: "Client and vendor escalations" },
              { label: "Adjust Payouts", hint: "Manage refunds or manual payouts" },
            ].map((action) => (
              <button
                key={action.label}
                className="bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-6 text-left hover:border-indigo-300 transition-colors"
              >
                <p className="font-semibold text-gray-700">{action.label}</p>
                <p className="text-xs text-gray-500 mt-1">{action.hint}</p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
