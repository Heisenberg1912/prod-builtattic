import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { loadUserProfile, saveUserProfile } from '../../services/userProfile.js';
import CartPanel from '../../components/dashboard/CartPanel.jsx';
import RoleOnboardingGuide from '../../components/onboarding/RoleOnboardingGuide.jsx';
import { getSettings } from '../../services/settings.js';
import { fetchOrders } from '../../services/orders.js';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

const EMPTY_PROFILE = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  company: '',
  jobTitle: '',
  pronouns: '',
  timezone: '',
  website: '',
  bio: '',
};

const PROFILE_FIELDS = Object.keys(EMPTY_PROFILE);

const DASHBOARD_TIMEZONE_OPTIONS = [
  'UTC',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
];

const detectBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch (error) {
    console.warn('user_dashboard_timezone_error', error);
    return '';
  }
};

const STATUS_LABELS = {
  created: 'Pending',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  delivered: 'Delivered',
  processing: 'Processing',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  created: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  fulfilled: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-indigo-100 text-indigo-700',
  refunded: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const toCurrency = (value, currency = 'USD') => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `${currency} 0`;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(numeric);
  } catch {
    return `${currency} ${numeric.toFixed(0)}`;
  }
};

const toDate = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const timeAgo = (value) => {
  if (!value) return null;
  try {
    const now = Date.now();
    const past = new Date(value).getTime();
    if (!Number.isFinite(past)) return null;
    const delta = Math.floor((past - now) / 1000);
    const abs = Math.abs(delta);
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    if (abs < 60) return formatter.format(Math.round(delta), 'second');
    if (abs < 3600) return formatter.format(Math.round(delta / 60), 'minute');
    if (abs < 86400) return formatter.format(Math.round(delta / 3600), 'hour');
    if (abs < 604800) return formatter.format(Math.round(delta / 86400), 'day');
    if (abs < 2629800) return formatter.format(Math.round(delta / 604800), 'week');
    if (abs < 31557600) return formatter.format(Math.round(delta / 2629800), 'month');
    return formatter.format(Math.round(delta / 31557600), 'year');
  } catch {
    return null;
  }
};

const normalizeProfileForForm = (profile = {}) => {
  const timezone = profile.timezone || detectBrowserTimezone() || EMPTY_PROFILE.timezone;
  return {
    fullName: profile.fullName || profile.name || EMPTY_PROFILE.fullName,
    email: profile.email || EMPTY_PROFILE.email,
    phone: profile.phone || EMPTY_PROFILE.phone,
    location: profile.location || EMPTY_PROFILE.location,
    company: profile.company || EMPTY_PROFILE.company,
    jobTitle: profile.jobTitle || profile.title || EMPTY_PROFILE.jobTitle,
    pronouns: profile.pronouns || EMPTY_PROFILE.pronouns,
    timezone,
    website: profile.website || profile.portfolio || EMPTY_PROFILE.website,
    bio: profile.bio || EMPTY_PROFILE.bio,
  };
};

const profilePayloadFromForm = (form = {}) => ({
  name: form.fullName || '',
  fullName: form.fullName || '',
  email: form.email || '',
  phone: form.phone || '',
  location: form.location || '',
  company: form.company || '',
  jobTitle: form.jobTitle || '',
  pronouns: form.pronouns || '',
  timezone: form.timezone || '',
  website: form.website || '',
  bio: form.bio || '',
});

const profilesEqual = (a, b) =>
  PROFILE_FIELDS.every((key) => (a?.[key] || '') === (b?.[key] || ''));

const normalizeOrder = (order) => {
  if (!order) return null;
  const items = Array.isArray(order.items) ? order.items : [];
  const fallbackTotal = items.reduce((sum, item) => {
    const unit = Number(item?.lineTotal ?? item?.unitPrice ?? 0);
    const qty = Number(item?.qty ?? 1);
    return sum + unit * (Number.isFinite(qty) ? qty : 1);
  }, 0);
  const total = Number(
    order?.amounts?.grand ?? order?.amounts?.total ?? order?.total ?? fallbackTotal ?? 0,
  );
  const currency =
    order?.amounts?.currency ||
    items.find((item) => item?.currency)?.currency ||
    order?.currency ||
    'USD';
  const reference =
    order?.metadata?.reference ||
    order?.orderNumber ||
    order?.code ||
    (order?._id ? `BA-${String(order._id).slice(-6).toUpperCase()}` : order?.id || 'Order');
  return {
    id: order?._id || order?.id || reference,
    reference,
    status: order?.status || 'created',
    placedAt: order?.createdAt || order?.updatedAt || null,
    total,
    currency,
    itemCount: items.length,
  };
};

const statusLabel = (status) => STATUS_LABELS[status] || status?.charAt(0).toUpperCase() + status?.slice(1) || 'Pending';

const statusTone = (status) => STATUS_STYLES[status] || STATUS_STYLES.pending;

export default function UserDashboard() {
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [initialProfile, setInitialProfile] = useState(EMPTY_PROFILE);
  const [profileMeta, setProfileMeta] = useState({ loading: true, saving: false, error: null, lastSync: null });
  const [settingsSnapshot, setSettingsSnapshot] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const { wishlistItems, fetchWishlist } = useWishlist();
  const { cartItems, removeFromCart } = useCart();

  const profileRequestRef = useRef(0);
  const ordersRequestRef = useRef(0);

  const refreshProfile = useCallback(async (options = {}) => {
    const requestId = ++profileRequestRef.current;
    const { silent = false } = options;

    if (!silent) {
      setProfileMeta((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      const local = await loadUserProfile({ forceLocal: true, preferRemote: false });
      if (profileRequestRef.current !== requestId) return;
      const normalizedLocal = normalizeProfileForForm(local);
      setProfileForm(normalizedLocal);
      setInitialProfile(normalizedLocal);
      setProfileMeta((prev) => ({ ...prev, lastSync: local?.updatedAt || prev.lastSync }));
    } catch (error) {
      if (profileRequestRef.current !== requestId) return;
      console.warn('dashboard_profile_local_error', error);
    }

    try {
      const remoteSettings = await getSettings();
      if (profileRequestRef.current !== requestId) return;
      setSettingsSnapshot(remoteSettings);
      const remoteProfile = normalizeProfileForForm(remoteSettings.profile);
      setProfileForm(remoteProfile);
      setInitialProfile(remoteProfile);
      setProfileMeta((prev) => ({ ...prev, loading: false, lastSync: new Date().toISOString(), error: null }));
      if (!silent) toast.success('Profile synced');
    } catch (error) {
      if (profileRequestRef.current !== requestId) return;
      if (error?.fallback) {
        setSettingsSnapshot(error.fallback);
        const fallbackProfile = normalizeProfileForForm(error.fallback.profile);
        setProfileForm(fallbackProfile);
        setInitialProfile(fallbackProfile);
        setProfileMeta((prev) => ({ ...prev, loading: false, lastSync: new Date().toISOString(), error: null }));
        if (!silent) toast('Using local profile snapshot', { icon: '🗂️' });
        return;
      }
      console.warn('dashboard_profile_remote_error', error);
      setProfileMeta((prev) => ({ ...prev, loading: false, error: error?.message || 'Unable to load your profile' }));
      if (!silent) toast.error(error?.message || 'Unable to load your profile');
    }
  }, []);

  const refreshOrders = useCallback(async (options = {}) => {
    const requestId = ++ordersRequestRef.current;
    const { silent = false } = options;

    if (!silent) {
      setOrdersLoading(true);
      setOrdersError(null);
    }

    try {
      const payload = await fetchOrders({}, { allowDemo: true });
      if (ordersRequestRef.current !== requestId) return;
      const normalized = (Array.isArray(payload) ? payload : [])
        .map(normalizeOrder)
        .filter(Boolean);
      setOrders(normalized);
      setOrdersLoading(false);
      setOrdersError(null);
      if (!silent) {
        toast.success('Orders updated');
      }
    } catch (error) {
      if (ordersRequestRef.current !== requestId) return;
      console.warn('dashboard_orders_error', error);
      setOrdersError(error?.message || 'Unable to load orders');
      setOrdersLoading(false);
      if (!silent) {
        toast.error(error?.message || 'Unable to load orders');
      }
    }
  }, []);

  const fetchWishlistRef = useRef(fetchWishlist);

  useEffect(() => {
    fetchWishlistRef.current = fetchWishlist;
  }, [fetchWishlist]);

  useEffect(() => {
    refreshProfile({ silent: true });
    refreshOrders({ silent: true });
    fetchWishlistRef.current?.();
  }, [refreshProfile, refreshOrders]);


  const handleField = useCallback((field) => (event) => {
    const value = event.target.value;
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const hasUnsavedChanges = useMemo(() => !profilesEqual(profileForm, initialProfile), [profileForm, initialProfile]);

  const ordersStats = useMemo(() => {
    if (!orders.length) {
      return { total: 0, open: 0, lifetimeValue: 0, currency: 'USD', lastOrder: null };
    }
    const openStatuses = new Set(['created', 'pending', 'processing']);
    const total = orders.length;
    const open = orders.filter((order) => openStatuses.has(order.status)).length;
    const lifetimeValue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const currency = orders.find((order) => order.currency)?.currency || 'USD';
    const lastOrder = orders[0]?.placedAt || null;
    return { total, open, lifetimeValue, currency, lastOrder };
  }, [orders]);

  const savedStudios = useMemo(() => (wishlistItems || []).slice(0, 4), [wishlistItems]);
  const readyCartItems = useMemo(() => (Array.isArray(cartItems) ? cartItems : []), [cartItems]);
  const cartItemCount = readyCartItems.length;

  const handleSave = async () => {
    setProfileMeta((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const payload = profilePayloadFromForm(profileForm);
      const options = settingsSnapshot ? { currentSettings: settingsSnapshot } : {};
      const snapshot = await saveUserProfile(payload, options);
      const normalized = normalizeProfileForForm(snapshot);
      setInitialProfile(normalized);
      setProfileForm(normalized);
      setProfileMeta((prev) => ({ ...prev, saving: false, lastSync: snapshot?.updatedAt || new Date().toISOString() }));
      setSettingsSnapshot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: {
            ...(prev.profile || {}),
            ...payload,
          },
        };
      });
      toast.success('Profile saved');
    } catch (error) {
      console.error('dashboard_profile_save_error', error);
      setProfileMeta((prev) => ({ ...prev, saving: false, error: error?.message || 'Unable to save profile' }));
      toast.error(error?.message || 'Unable to save profile');
    }
  };

  const handleRefreshAll = () => {
    refreshProfile();
    refreshOrders();
    fetchWishlistRef.current?.();
  };

  const handleRemoveCartItem = useCallback(async (item) => {
    try {
      await removeFromCart?.(item);
      toast.success('Removed from cart');
    } catch (error) {
      console.error('dashboard_cart_remove_error', error);
      toast.error('Unable to remove item');
    }
  }, [removeFromCart]);

  const lastSyncedLabel = profileMeta.lastSync ? timeAgo(profileMeta.lastSync) : null;
  const roleSummary = [profileForm.jobTitle, profileForm.company].filter(Boolean).join(' • ');
  const timezoneSummary = profileForm.timezone || '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Welcome back {profileForm.fullName || 'guest'} <span className="inline-block align-middle">👋</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {profileMeta.loading
                ? 'Syncing your information…'
                : lastSyncedLabel
                ? `Last synced ${lastSyncedLabel}`
                : 'Keeping your profile in sync.'}
            </p>
            {(roleSummary || timezoneSummary) && (
              <p className="text-xs text-slate-500">
                {roleSummary}
                {roleSummary && timezoneSummary ? ' · ' : ''}
                {timezoneSummary}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshAll}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Refresh data
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <RoleOnboardingGuide role="user" dense />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Account snapshot</h2>
                <p className="text-sm text-slate-500">A quick overview of your activity across Builtattic.</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  {ordersLoading ? 'Orders syncing…' : `${ordersStats.total} orders tracked`}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  {wishlistItems?.length || 0} saved studios
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  {cartItemCount || 0} cart item{cartItemCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SnapshotCard label="Total orders" value={ordersStats.total} trend={ordersStats.lastOrder ? `Last on ${toDate(ordersStats.lastOrder)}` : 'No orders yet'} />
              <SnapshotCard label="Open orders" value={ordersStats.open} highlight={ordersStats.open > 0} trend={ordersStats.open > 0 ? 'We will notify you on status changes.' : 'All caught up!'} />
              <SnapshotCard label="Lifetime spend" value={toCurrency(ordersStats.lifetimeValue, ordersStats.currency)} trend={ordersStats.lifetimeValue ? 'Across completed orders' : 'Place an order to get started'} />
              <SnapshotCard label="Saved studios" value={wishlistItems?.length || 0} trend={wishlistItems?.length ? 'Pinned for quick access' : 'Explore studios to save favourites'} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
                <p className="text-sm text-slate-500">Manage the details we use across quotes, orders, and communications.</p>
              </div>
              {profileMeta.saving && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  Saving…
                </span>
              )}
            </div>

            {profileMeta.error && <ErrorBanner message={profileMeta.error} />}

            <div className="mt-4 space-y-4">
              <Field label="Full name" value={profileForm.fullName} onChange={handleField('fullName')} placeholder="Alex Johnson" autoComplete="name" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email" type="email" value={profileForm.email} onChange={handleField('email')} placeholder="you@example.com" autoComplete="email" />
                <Field label="Phone" type="tel" value={profileForm.phone} onChange={handleField('phone')} placeholder="+1 555 010 2024" autoComplete="tel" />
              </div>
              <Field label="Company" value={profileForm.company} onChange={handleField('company')} placeholder="Builtattic Ltd" autoComplete="organization" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Job title" value={profileForm.jobTitle} onChange={handleField('jobTitle')} placeholder="Design Lead" autoComplete="organization-title" />
                <Field label="Pronouns" value={profileForm.pronouns} onChange={handleField('pronouns')} placeholder="She / Her" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Timezone</span>
                  <select
                    value={profileForm.timezone || ''}
                    onChange={handleField('timezone')}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Select timezone</option>
                    {DASHBOARD_TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Website / portfolio" type="url" value={profileForm.website} onChange={handleField('website')} placeholder="https://builtattic.com/you" autoComplete="url" />
              </div>
              <Field label="Location" value={profileForm.location} onChange={handleField('location')} placeholder="San Francisco, CA" autoComplete="address-level2" />
              <Field label="Bio" multiline value={profileForm.bio} onChange={handleField('bio')} placeholder="Tell us the kind of work you are focusing on." />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={profileMeta.saving || profileMeta.loading || !hasUnsavedChanges}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Save profile
                </button>
                {!profileMeta.loading && !profileMeta.saving && !hasUnsavedChanges && (
                  <p className="text-sm text-slate-500">All changes saved.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
                <p className="text-sm text-slate-500">Track fulfilment progress and revisit order details.</p>
              </div>
              <button
                type="button"
                onClick={() => refreshOrders()}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              {ordersLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((key) => (
                    <div key={key} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="h-4 w-24 rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-40 rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              )}

              {!ordersLoading && ordersError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {ordersError}
                </div>
              )}

              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No orders yet. Explore the marketplace to place your first order.
                </div>
              )}

              {!ordersLoading && !ordersError && orders.length > 0 && (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{order.reference}</p>
                        <p className="text-xs text-slate-500">Placed {toDate(order.placedAt)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{toCurrency(order.total, order.currency)}</p>
                        <p className="text-xs text-slate-500">{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <CartPanel
            title="Buying pipeline"
            description="Review the services and materials you're about to checkout."
            items={readyCartItems}
            onRemove={readyCartItems.length ? handleRemoveCartItem : undefined}
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Saved studios</h2>
              <Link
                to="/marketplace/studios"
                className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 hover:text-slate-500"
              >
                Browse
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {savedStudios.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                  Nothing saved yet. Pin studios to see them here.
                </div>
              ) : (
                savedStudios.map((studio) => (
                  <div key={studio.productId} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-900">{studio.title}</p>
                    <p className="text-xs text-slate-500">{studio.source}</p>
                    {Number.isFinite(studio.price) && studio.price > 0 && (
                      <p className="mt-2 text-xs font-semibold text-slate-600">{toCurrency(studio.price)}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-500">Jump straight into the workflows you use most often.</p>
            <div className="mt-4 space-y-2">
              <Link
                to="/marketplace/materials"
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Explore materials
                <span className="text-xs text-slate-400">→</span>
              </Link>
              <Link
                to="/orders"
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                View all orders
                <span className="text-xs text-slate-400">→</span>
              </Link>
              <Link
                to="/support"
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Contact support
                <span className="text-xs text-slate-400">→</span>
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function SnapshotCard({ label, value, trend, highlight = false }) {
  return (
    <div className={`rounded-xl border px-4 py-5 shadow-sm ${highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
      {trend ? <p className="mt-1 text-xs text-slate-500">{trend}</p> : null}
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', multiline = false, placeholder = '', autoComplete }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={4}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      ) : (
        <input
          value={value}
          type={type}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      )}
    </label>
  );
}
