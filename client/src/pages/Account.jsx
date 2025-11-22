import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarRange,
  Crown,
  Gift,
  Headphones,
  Heart,
  MapPin,
  MessageSquare,
  PackageCheck,
  Repeat,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  UserCog,
  Wallet,
} from "lucide-react";

import { fetchOrders } from "../services/orders.js";
import { useCart } from "../context/CartContext";

const CARD_BASE = "rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md";
const CTA_BUTTON = "inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition";

const quickAccessTiles = [
  {
    title: "Your Orders",
    description: "Check status and history.",
    icon: ShoppingBag,
    to: "/orders",
  },
  {
    title: "Buy it Again",
    description: "Repeat past purchases fast.",
    icon: Repeat,
    to: "/orders",
  },
  {
    title: "Wishlist",
    description: "Save ideas for later.",
    icon: Heart,
    to: "/wishlist",
  },
  {
    title: "Prime Concierge",
    description: "Ping the support desk.",
    icon: Headphones,
    to: "/support",
  },
];

const accountTiles = [
  {
    title: "Login & Security",
    description: "Password, MFA, devices.",
    icon: ShieldCheck,
    to: "/settings",
    cta: "Manage",
  },
  {
    title: "Delivery Addresses",
    description: "Keep site details current.",
    icon: MapPin,
    to: "/settings",
    cta: "Edit",
  },
  {
    title: "Payment Options",
    description: "Cards, UPI, escrow rules.",
    icon: Wallet,
    to: "/cart",
    cta: "Review",
  },
  {
    title: "Gift Cards & Credits",
    description: "Apply codes in one place.",
    icon: Gift,
    to: "/account",
    cta: "Redeem",
  },
  {
    title: "Communication Settings",
    description: "Pick the updates you want.",
    icon: MessageSquare,
    to: "/settings",
    cta: "Update",
  },
  {
    title: "Invite Collaborators",
    description: "Add clients and partners.",
    icon: UserCog,
    to: "/associates",
    cta: "Invite",
  },
];

const supportTiles = [
  {
    title: "Priority Studio Support",
    description: "Concierge help on demand.",
    icon: Crown,
    to: null,
    cta: "Contact",
  },
  {
    title: "Account Preferences",
    description: "Tune privacy and region quickly.",
    icon: Settings2,
    to: "/settings",
    cta: "Adjust",
  },
  {
    title: "Professional Services",
    description: "Browse vetted experts fast.",
    icon: PackageCheck,
    to: "/associates",
    cta: "Explore",
  },
  {
    title: "Coupons & Events",
    description: "Unlock launch deals across studios and materials.",
    icon: Ticket,
    to: "/studio",
    cta: "View",
  },
];

const readProfileSnapshot = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("builtattic_profile"));
  } catch {
    return null;
  }
};

const readWishlistCount = () => {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("wishlist");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

const formatCurrency = (value, currency = "INR") => {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const initialsFrom = (nameOrEmail) => {
  if (!nameOrEmail) return "BT";
  const source = nameOrEmail.trim();
  if (!source) return "BT";
  const namePart = source.includes("@") ? source.split("@")[0] : source;
  const tokens = namePart.split(/[\\s._-]+/).filter(Boolean);
  if (!tokens.length) return source.slice(0, 2).toUpperCase();
  const first = tokens[0][0] || "";
  const last = tokens.length > 1 ? tokens[tokens.length - 1][0] : tokens[0][1] || "";
  const initials = `${first}${last || ""}`.slice(0, 2);
  return initials.toUpperCase() || "BT";
};

const Account = () => {
  const { cartItems } = useCart();
  const [profile, setProfile] = useState(() => readProfileSnapshot() || {});
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(() => readWishlistCount());

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "builtattic_profile") {
        setProfile(readProfileSnapshot() || {});
      }
      if (event.key === "wishlist") {
        setWishlistCount(readWishlistCount());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      setLoadingOrders(true);
      setOrdersError(null);
      try {
        const remote = await fetchOrders();
        if (!active) return;
        if (Array.isArray(remote) && remote.length) {
          setOrders(remote);
        }
      } catch (error) {
        if (!active) return;
        setOrdersError(error?.message || "Unable to sync your orders right now.");
      } finally {
        if (active) setLoadingOrders(false);
      }
    };
    loadOrders();
    return () => {
      active = false;
    };
  }, []);

  const orderStats = useMemo(() => {
    if (!orders.length) return { total: 0, spend: 0 };
    const spend = orders.reduce((sum, order) => {
      const grand = Number(order?.amounts?.grand ?? order?.amounts?.subtotal ?? 0);
      return sum + (Number.isFinite(grand) ? grand : 0);
    }, 0);
    return {
      total: orders.length,
      spend,
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    if (!orders.length) return [];
    return orders
      .slice(0, 3)
      .map((order) => {
        const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
        const item = order?.items?.[0] || {};
        const currency = item?.currency || order?.amounts?.currency || "INR";
        const total = Number(order?.amounts?.grand ?? order?.amounts?.subtotal ?? 0);
        return {
          id: order?._id || order?.id || crypto.randomUUID?.() || Math.random().toString(36).slice(2, 8),
          title: item?.title || item?.name || "Marketplace order",
          status: (order?.status || "created").replace(/_/g, " "),
          amount: formatCurrency(total, currency),
          placedOn: createdAt ? createdAt.toLocaleDateString() : "-",
        };
      });
  }, [orders]);

  const cartCount = Array.isArray(cartItems) ? cartItems.length : 0;
  const stats = [
    {
      label: "Orders placed",
      value: orderStats.total,
      icon: PackageCheck,
      subLabel: orderStats.total ? "Across studios, materials, and associates" : "No orders yet",
    },
    {
      label: "Lifetime spend",
      value: orderStats.spend ? formatCurrency(orderStats.spend) : "-",
      icon: TrendingUp,
      subLabel: "Reflects captured invoices and escrow releases",
    },
    {
      label: "Wishlist",
      value: wishlistCount,
      icon: Star,
      subLabel: wishlistCount ? "Saved for later" : "Add ideas to revisit",
    },
    {
      label: "Cart",
      value: cartCount,
      icon: CalendarRange,
      subLabel: cartCount ? "Ready for checkout" : "No items in cart",
    },
  ];
  const quickShortcuts = useMemo(
    () => [
      {
        label: cartCount ? "Checkout now" : "Start shopping",
        helper: cartCount ? `${cartCount} item${cartCount === 1 ? "" : "s"} to review` : "Browse materials and studios",
        to: cartCount ? "/cart" : "/products",
        icon: ShoppingBag,
        badge: cartCount || null,
      },
      {
        label: "Account settings",
        helper: "Security, privacy, notifications",
        to: "/settings",
        icon: Settings2,
      },
      {
        label: "Wishlist",
        helper: wishlistCount ? `${wishlistCount} saved ideas` : "Save your favorites",
        to: "/wishlist",
        icon: Heart,
        badge: wishlistCount || null,
      },
      {
        label: "Help desk",
        helper: "FAQs and concierge support",
        to: "/faqs",
        icon: Headphones,
      },
    ],
    [cartCount, wishlistCount],
  );
  const fullName = profile?.name || "Guest";
  const email = profile?.email || "guest@builtattic.com";
  const membership = profile?.membership || "Prime Access";
  const initials = initialsFrom(fullName || email);
  const healthPills = [
    { label: membership, helper: "Membership status" },
    { label: orders.length ? `${orders.length} order${orders.length === 1 ? "" : "s"}` : "No orders yet", helper: "Tracked across builds" },
    { label: wishlistCount ? `${wishlistCount} saved` : "Wishlist empty", helper: "Ideas to revisit" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 px-8 py-6">
            <div className="flex items-center gap-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900/5 text-2xl font-semibold text-slate-900">
                {initials}
              </span>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Account overview</p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{fullName}</h1>
                <p className="text-sm text-slate-600">{email}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                <Sparkles size={14} /> Membership
              </div>
              <p className="mt-2 text-base font-semibold text-slate-900">{membership}</p>
              <p className="text-xs text-slate-500">Enjoy priority support.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-8 py-4">
            {healthPills.map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{pill.label}</span>
                <span className="text-[11px] font-medium text-slate-500">{pill.helper}</span>
              </span>
            ))}
          </div>
          <div className="grid gap-4 px-8 py-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                    <span className="rounded-full border border-slate-200 bg-white p-2 text-slate-600">
                      <Icon size={16} />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs text-slate-500">{stat.subLabel}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-lg px-8 py-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Action shelf</h2>
              <p className="text-sm text-slate-500">One-tap shortcuts for the most common account tasks.</p>
            </div>
            {ordersError && <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">Orders temporarily unavailable</span>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                      <Icon size={18} />
                    </span>
                    {item.badge ? (
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                        {item.badge}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Open</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.helper}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-lg px-8 py-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quick access</h2>
              <p className="text-sm text-slate-500">Jump back into common workflows in a click.</p>
            </div>
            {loadingOrders && <span className="text-xs text-slate-500">Syncing latest activity…</span>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickAccessTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link key={tile.title} to={tile.to} className={`${CARD_BASE} p-5`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-900/5 text-slate-600">
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{tile.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{tile.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-lg px-8 py-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
            <Link to="/orders" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
              View all orders
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {recentOrders.length ? (
              recentOrders.map((order) => (
                <div key={order.id} className={`${CARD_BASE} p-5`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{order.placedOn}</p>
                  <h3 className="mt-3 text-base font-semibold text-slate-900 line-clamp-2">{order.title}</h3>
                  <p className="text-sm text-slate-600">Status: {order.status}</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{order.amount}</p>
                  <Link to="/orders" className="mt-4 inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900">
                    Track order &rsaquo;
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600 lg:col-span-3">
                No orders yet. Explore the marketplace to get started.
              </div>
            )}
          </div>
          {ordersError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {ordersError}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-lg px-8 py-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Account management</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accountTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <div key={tile.title} className={`${CARD_BASE} p-5 flex flex-col gap-4`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-900/5 text-slate-600">
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{tile.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{tile.description}</p>
                    </div>
                  </div>
                  {tile.cta && (
                    tile.to ? (
                      <Link to={tile.to} className={CTA_BUTTON}>
                        {tile.cta}
                      </Link>
                    ) : (
                      <button type="button" className={CTA_BUTTON}>
                        {tile.cta}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-lg px-8 py-6 space-y-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Support & concierge</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {supportTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <div key={tile.title} className={`${CARD_BASE} p-5 flex flex-col gap-3`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-900/5 text-slate-600">
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{tile.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{tile.description}</p>
                    </div>
                  </div>
                  {tile.cta && (
                    tile.to ? (
                      <Link to={tile.to} className={CTA_BUTTON}>
                        {tile.cta}
                      </Link>
                    ) : (
                      <button type="button" className={CTA_BUTTON}>
                        {tile.cta}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Account;







