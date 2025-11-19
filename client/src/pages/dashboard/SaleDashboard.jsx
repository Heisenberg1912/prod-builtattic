import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchVendorDashboard } from "../../services/dashboard.js";
import VendorOnboardingChecklist from "../../components/vendor/VendorOnboardingChecklist.jsx";
import { fetchVendorOnboarding } from "../../services/portal.js";

const StatCard = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "—"}</p>
    {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
  </div>
);

const List = ({ title, items, empty }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Material Studio</p>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
    </div>
    {items?.length ? (
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{item.title}</p>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {item.status || item.stage || item.kind || ""}
              </span>
            </div>
            {item.detail ? <p className="text-sm text-slate-600">{item.detail}</p> : null}
            <p className="text-xs text-slate-500">
              {new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-slate-500">{empty}</p>
    )}
  </section>
);

export default function SaleDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: null, authRequired: false, fallback: false });
  const [onboardingState, setOnboardingState] = useState({ loading: true, data: null, error: null });

  const refreshOnboarding = useCallback(async () => {
    setOnboardingState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const payload = await fetchVendorOnboarding();
      if (payload?.authRequired && !payload?.fallback) {
        setOnboardingState({
          loading: false,
          data: null,
          error: "Sign in to view onboarding status",
        });
        return;
      }
      setOnboardingState({
        loading: false,
        data: payload,
        error: payload?.error || null,
      });
    } catch (error) {
      setOnboardingState({
        loading: false,
        data: null,
        error: error?.message || "Unable to load onboarding",
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const payload = await fetchVendorDashboard();
        if (!active) return;
        const fallback = Boolean(payload?.fallback);
        const requiresAuth = Boolean(payload?.authRequired && !fallback);
        if (requiresAuth) {
          setState({ loading: false, data: null, error: null, authRequired: true, fallback: false });
        } else {
          setState({
            loading: false,
            data: payload,
            error: fallback ? null : payload?.error || null,
            authRequired: false,
            fallback,
          });
        }
      } catch (error) {
        if (!active) return;
        setState({
          loading: false,
          data: null,
          error: error.message || "Unable to load dashboard",
          authRequired: false,
          fallback: false,
        });
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    refreshOnboarding();
  }, [refreshOnboarding]);

  const { loading, data, error, authRequired, fallback } = state;
  const metrics = data?.metrics || {};

  const statCards = useMemo(
    () => [
      { label: "Listed SKUs", value: metrics.listedSkus },
      { label: "Inventory", value: metrics.inventoryCount },
      { label: "Open orders", value: metrics.openOrders },
      { label: "Pipeline leads", value: metrics.pipelineLeads },
    ],
    [metrics],
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Material Studio</p>
          <h1 className="text-2xl font-semibold text-slate-900">Vendor dashboard</h1>
          <p className="text-sm text-slate-500">Track SKU health, marketplace requests, and logistics readiness.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/warehouse" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            View Material Studio
          </Link>
          <Link to="/portal/vendor" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow">
            Open Vendor portal
          </Link>
        </div>
      </header>

      {fallback && !loading && !error && !authRequired ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Demo Material Studio metrics are displayed. Link your vendor firm to sync live SKUs, orders, and pipeline data.
        </div>
      ) : null}

      {!authRequired ? (
        <VendorOnboardingChecklist
          data={onboardingState.data}
          loading={onboardingState.loading}
          error={onboardingState.error}
          onRefresh={refreshOnboarding}
          variant="compact"
        />
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      ) : authRequired ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <h2 className="text-lg font-semibold">Link your vendor firm</h2>
          <p className="mt-2 text-sm">Add your firm membership to access Material Studio tools.</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <List
            title="Material catalogue"
            items={data?.materials?.map((material) => ({
              id: material.id,
              title: material.title,
              status: material.status,
              detail: material.price ? `$${material.price} ${material.currency || ''}`.trim() : null,
              updatedAt: material.updatedAt,
            }))}
            empty="No materials listed yet."
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <List
              title="Orders"
              items={data?.orders?.map((order) => ({
                id: order.id,
                title: `${order.items?.[0]?.title || 'Order'} • ${order.status}`,
                status: order.status,
                detail: order.total ? `$${order.total}` : null,
                updatedAt: order.createdAt,
              }))}
              empty="No orders yet."
            />
            <List
              title="Pipeline leads"
              items={data?.leads?.map((lead) => ({
                id: lead.id,
                title: lead.title,
                status: lead.status,
                detail: lead.contact || null,
                updatedAt: lead.updatedAt,
              }))}
              empty="No leads assigned."
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Next best actions</h2>
            <p className="text-sm text-slate-500">Sync logistics data, MOQ, and catalog highlights to stay visible across Material Studio searches.</p>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {(data?.nextActions || []).map((action) => (
                <li key={action.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{action.title}</p>
                  <p className="text-sm text-slate-600">{action.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
