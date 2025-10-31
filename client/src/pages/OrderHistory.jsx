import React, { useEffect, useMemo, useState } from "react";
import { HiOutlineTruck, HiOutlineClipboardDocumentCheck, HiOutlinePhone, HiOutlineChatBubbleOvalLeftEllipsis } from "react-icons/hi2";
import { fetchOrders } from "../services/orders.js";

const STATIC_ORDERS = [
  {
    id: "MAT-2025-014",
    type: "Materials",
    title: "UltraTech OPC 53 Grade Cement",
    seller: "BuildMart Logistics",
    placedOn: "2025-02-04",
    status: "In transit",
    amount: 3890,
    currency: "INR",
    packages: [
      {
        packageId: "PKG-01",
        eta: "2025-02-07",
        checkpoints: [
          { label: "Picked at Navi Mumbai hub", timestamp: "2025-02-04 09:20", completed: true },
          { label: "Line haul to Pune", timestamp: "2025-02-05 22:10", completed: true },
          { label: "Out for delivery", timestamp: "2025-02-06 07:30", completed: true },
          { label: "Site delivery", timestamp: "2025-02-06 13:00", completed: false },
        ],
      },
      {
        packageId: "PKG-02",
        eta: "2025-02-08",
        checkpoints: [
          { label: "Picked at Vizag mill", timestamp: "2025-02-05 11:00", completed: true },
          { label: "Rail line haul", timestamp: "2025-02-06 18:00", completed: true },
          { label: "Hub arrival", timestamp: "2025-02-07 02:15", completed: false },
        ],
      },
    ],
    actions: { reorder: true, subscribe: true, support: true },
  },
  {
    id: "STU-2025-001",
    type: "Studio",
    title: "Skyline Loft Residences",
    seller: "Lumen Atelier",
    placedOn: "2025-01-12",
    status: "Delivered",
    amount: 14500,
    currency: "USD",
    tracking: [
      { label: "Kick-off & requirements", timestamp: "2025-01-13", completed: true },
      { label: "Concept package delivered", timestamp: "2025-01-25", completed: true },
      { label: "IFC set under review", timestamp: "2025-02-02", completed: true },
      { label: "As-built dossier shared", timestamp: "2025-02-05", completed: true },
    ],
    actions: { download: true, review: true, rebook: true },
  },
  {
    id: "ASC-2025-006",
    type: "Service",
    title: "BIM Coordination Sprint",
    seller: "Rahul Iyer",
    placedOn: "2025-02-18",
    status: "In-flight",
    amount: 1260,
    currency: "USD",
    service: {
      slot: "2025-02-20 09:00 - 11:00 IST",
      otp: "A5D6",
      chatRoom: "ops://builtattic/service/asc-2025-006",
    },
    tracking: [
      { label: "Pro assigned", timestamp: "2025-02-18 14:20", completed: true },
      { label: "Pre-session worksheets shared", timestamp: "2025-02-19 09:00", completed: true },
      { label: "Session underway", timestamp: null, completed: false },
      { label: "Report delivery", timestamp: null, completed: false },
    ],
    actions: { reschedule: true, support: true, review: true },
  },
];

const formatCurrency = (value, currency = "INR") => {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const Timeline = ({ entries }) => (
  <ol className="space-y-2">
    {entries.map((entry, index) => (
      <li key={`${entry.label}-${index}`} className="flex items-start gap-3 text-xs text-slate-600">
        <span
          className={`mt-0.5 w-2 h-2 rounded-full ${entry.completed ? "bg-emerald-500" : "bg-slate-300"}`}
        />
        <div>
          <p className="font-medium text-slate-800">{entry.label}</p>
          {entry.timestamp && <p className="text-slate-500">{entry.timestamp}</p>}
        </div>
      </li>
    ))}
  </ol>
);

const convertBackendOrder = (order) => {
  if (!order) return null;
  const primaryItem = order?.items?.[0] || {};
  const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
  const placedOn = createdAt ? createdAt.toISOString().split('T')[0] : '—';
  const amountRaw = Number(order?.amounts?.grand ?? order?.amounts?.subtotal ?? 0);
  const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
  const currency = primaryItem?.currency || order?.amounts?.currency || 'INR';
  const typeLabel = (primaryItem?.source || 'Order').replace(/^([a-z])/, (c) => c.toUpperCase());

  return {
    id: order?._id || order?.id || `ORD-${Math.random().toString(36).slice(2, 8)}`,
    type: typeLabel,
    title: primaryItem?.title || `Marketplace order ${order?._id?.slice(-6) || ''}`.trim(),
    seller: primaryItem?.seller || 'Builtattic marketplace',
    placedOn,
    status: (order?.status || 'Created').replace(/_/g, ' '),
    amount,
    currency,
    tracking: [
      {
        label: 'Order created',
        timestamp: createdAt ? createdAt.toLocaleString() : null,
        completed: true,
      },
    ],
    actions: { reorder: true, support: true },
  };
};

const OrderHistory = () => {
  const [orders, setOrders] = useState(STATIC_ORDERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const remote = await fetchOrders();
        if (!active) return;
        if (Array.isArray(remote) && remote.length) {
          const converted = remote
            .map(convertBackendOrder)
            .filter(Boolean);
          if (converted.length) {
            setOrders([...converted, ...STATIC_ORDERS]);
            return;
          }
        }
        setOrders(STATIC_ORDERS);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Unable to fetch latest orders.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const materialOrders = useMemo(
    () => orders.filter((order) => order.type === 'Materials'),
    [orders]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <p className="uppercase tracking-[0.35em] text-xs text-slate-400 mb-3">
            account
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-3">
            Order history & tracking
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Trace deliverables, rebook engagements, and download documentation across materials, studios, and associate sprints.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs text-slate-600">
            Syncing latest marketplace orders…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
            {error}
          </div>
        )}

        {orders.map((order) => (
          <article key={order.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{order.type}</p>
                <h2 className="text-lg font-semibold text-slate-900">{order.title}</h2>
                <p className="text-xs text-slate-500">
                  Seller: {order.seller}  -  Placed {order.placedOn}
                </p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{formatCurrency(order.amount, order.currency)}</p>
                <p className="text-xs text-slate-500">Status: {order.status}</p>
              </div>
            </header>

            <div className="grid md:grid-cols-2 gap-4">
              <section className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Progress
                </p>
                {order.packages ? (
                  <div className="space-y-3">
                    {order.packages.map((pkg) => (
                      <div key={pkg.packageId} className="border border-slate-200 rounded-xl px-3 py-2">
                        <p className="text-xs font-medium text-slate-800 mb-2">
                          Package {pkg.packageId}  -  ETA {pkg.eta}
                        </p>
                        <Timeline entries={pkg.checkpoints} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Timeline entries={order.tracking || []} />
                )}
              </section>

              <section className="space-y-3 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Next steps
                </p>
                {order.service && (
                  <div className="border border-slate-200 rounded-xl px-3 py-2 space-y-1 text-xs">
                    <p>Scheduled slot: {order.service.slot}</p>
                    <p>Session OTP: {order.service.otp}</p>
                    <a href={order.service.chatRoom} className="text-slate-700 hover:text-slate-900 flex items-center gap-1">
                      <HiOutlineChatBubbleOvalLeftEllipsis className="w-4 h-4" /> Join workspace chat
                    </a>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {order.actions?.reorder && (
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs hover:border-slate-300">
                      Reorder
                    </button>
                  )}
                  {order.actions?.subscribe && (
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs hover:border-slate-300">
                      Subscribe & Save
                    </button>
                  )}
                  {order.actions?.reschedule && (
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs hover:border-slate-300">
                      Reschedule
                    </button>
                  )}
                  {order.actions?.download && (
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs hover:border-slate-300">
                      Download deliverables
                    </button>
                  )}
                  {order.actions?.review && (
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs hover:border-slate-300">
                      Leave a review
                    </button>
                  )}
                </div>
              </section>
            </div>
          </article>
        ))}

        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <HiOutlineTruck className="w-5 h-5 text-slate-500" />
            Last-mile visibility
          </h2>
          <p className="text-sm text-slate-600">
            Live package telemetry is available for {materialOrders.length} material consignment(s). Share dock access windows early so we can align the freight partner.
          </p>
          <div className="grid md:grid-cols-3 gap-3 text-xs text-slate-600">
            {materialOrders.map((order) => (
              <div key={order.id} className="border border-slate-200 rounded-xl px-3 py-2">
                <p className="font-medium text-slate-800">{order.title}</p>
                <p className="text-slate-500">{order.packages?.length} package(s) in flight</p>
                <p className="text-slate-500">Next checkpoint: {order.packages?.[0]?.checkpoints?.find((c) => !c.completed)?.label || "Complete"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <HiOutlineClipboardDocumentCheck className="w-5 h-5 text-slate-500" />
            Support & escalation
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-slate-600">
            <div className="border border-slate-200 rounded-xl px-3 py-2 space-y-1">
              <p className="font-medium text-slate-800 flex items-center gap-2">
                <HiOutlineClipboardDocumentCheck className="w-4 h-4 text-slate-500" />
                Guided flows
              </p>
              <p className="text-xs">Raise refund, reschedule, or onboarding issues via curated forms.</p>
            </div>
            <div className="border border-slate-200 rounded-xl px-3 py-2 space-y-1">
              <p className="font-medium text-slate-800 flex items-center gap-2">
                <HiOutlinePhone className="w-4 h-4 text-slate-500" />
                Hotline
              </p>
              <p className="text-xs">+91 80471 55555 - ops@builtattic.com</p>
            </div>
            <div className="border border-slate-200 rounded-xl px-3 py-2 space-y-1">
              <p className="font-medium text-slate-800 flex items-center gap-2">
                <HiOutlineChatBubbleOvalLeftEllipsis className="w-4 h-4 text-slate-500" />
                24/7 concierge
              </p>
              <p className="text-xs">Chat escalation available within the workspace chat widget.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OrderHistory;


