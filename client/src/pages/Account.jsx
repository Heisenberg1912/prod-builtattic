import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MapPin,
  MessageSquare,
  PackageCheck,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  UserCog,
  Wallet,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Clock,
  User,
  Headphones,
  Gift,
} from "lucide-react";

import { fetchOrders } from "../services/orders.js";
import { useCart } from "../context/CartContext";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06
    }
  }
};

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
  const tokens = namePart.split(/[\s._-]+/).filter(Boolean);
  if (!tokens.length) return source.slice(0, 2).toUpperCase();
  const first = tokens[0][0] || "";
  const last = tokens.length > 1 ? tokens[tokens.length - 1][0] : tokens[0][1] || "";
  const initials = `${first}${last || ""}`.slice(0, 2);
  return initials.toUpperCase() || "BT";
};

const Account = () => {
  const navigate = useNavigate();
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
  const fullName = profile?.name || "Guest";
  const email = profile?.email || "guest@builtattic.com";
  const initials = initialsFrom(fullName || email);

  const stats = [
    {
      label: "Orders",
      value: orderStats.total,
      icon: PackageCheck,
      subLabel: orderStats.total ? "Total placed" : "No orders yet",
    },
    {
      label: "Spent",
      value: orderStats.spend ? formatCurrency(orderStats.spend) : "-",
      icon: TrendingUp,
      subLabel: "Lifetime value",
    },
    {
      label: "Wishlist",
      value: wishlistCount,
      icon: Heart,
      subLabel: wishlistCount ? "Saved items" : "None saved",
    },
    {
      label: "Cart",
      value: cartCount,
      icon: ShoppingBag,
      subLabel: cartCount ? "Ready to buy" : "Empty",
    },
  ];

  const quickActions = [
    {
      title: "Marketplace",
      description: "Explore products & services",
      icon: ShoppingBag,
      to: "/studio",
    },
    {
      title: "Settings",
      description: "Account preferences",
      icon: Settings2,
      to: "/settings",
    },
    {
      title: "Wishlist",
      description: `${wishlistCount} saved`,
      icon: Heart,
      to: "/wishlist",
      badge: wishlistCount || null,
    },
    {
      title: "Support",
      description: "Get help",
      icon: Headphones,
      to: "/faqs",
    },
  ];

  const accountFeatures = [
    {
      title: "Security",
      description: "Password, 2FA, devices",
      icon: ShieldCheck,
      to: "/settings",
    },
    {
      title: "Addresses",
      description: "Delivery locations",
      icon: MapPin,
      to: "/settings",
    },
    {
      title: "Payment",
      description: "Cards & billing",
      icon: Wallet,
      to: "/settings",
    },
    {
      title: "Gift Cards",
      description: "Redeem credits",
      icon: Gift,
      to: "/account",
    },
    {
      title: "Notifications",
      description: "Email & alerts",
      icon: MessageSquare,
      to: "/settings",
    },
    {
      title: "Team",
      description: "Collaborators",
      icon: UserCog,
      to: "/associates",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <motion.header
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center text-white text-xl font-semibold"
              >
                {initials}
              </motion.div>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm font-medium text-stone-400 uppercase tracking-wider mb-0.5"
                >
                  Account
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl lg:text-3xl font-semibold text-stone-900 tracking-tight"
                >
                  {fullName}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-stone-500 text-sm"
                >
                  {email}
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/settings">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-all duration-300">
                  <Settings2 className="w-4 h-4" />
                  Manage Account
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.header>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-stone-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-semibold text-stone-900 mb-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-500">{stat.label}</p>
                    <p className="text-xs text-stone-400">{stat.subLabel}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.to}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="group bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-300 cursor-pointer h-full"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center group-hover:bg-stone-800 transition-colors">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {action.badge && (
                        <span className="px-2 py-1 text-xs font-medium bg-stone-100 text-stone-600 rounded-full">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-stone-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-stone-500">{action.description}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4 text-stone-600" />
                </div>
                <h3 className="font-medium text-stone-900">Recent Orders</h3>
              </div>
              {orders.length > 0 && (
                <Link to="/orders">
                  <button className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>
            <div className="p-5">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                </div>
              ) : recentOrders.length ? (
                <div className="space-y-3">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + index * 0.05 }}
                      className="group p-4 rounded-lg border border-stone-100 hover:border-stone-200 hover:bg-stone-50/50 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span className="text-xs text-stone-500">{order.placedOn}</span>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-600 rounded-full capitalize">
                          {order.status}
                        </span>
                      </div>
                      <h4 className="font-medium text-stone-900 text-sm line-clamp-1 mb-2">{order.title}</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-stone-900">{order.amount}</p>
                        <Link to="/orders">
                          <button className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
                            Track
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                    <PackageCheck className="w-5 h-5 text-stone-400" />
                  </div>
                  <p className="text-sm text-stone-500 mb-3">No orders yet</p>
                  <Link to="/studio">
                    <button className="text-sm text-stone-900 font-medium flex items-center gap-1 mx-auto hover:gap-2 transition-all">
                      Start Shopping
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              )}
              {ordersError && (
                <div className="mt-4 px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-600">
                  {ordersError}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Account Management */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                <User className="w-4 h-4 text-stone-600" />
              </div>
              <h3 className="font-medium text-stone-900">Account Settings</h3>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {accountFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Link key={feature.title} to={feature.to}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 + index * 0.03 }}
                        whileHover={{ x: 2 }}
                        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-all duration-300 cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                          <Icon className="w-4 h-4 text-stone-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-900 text-sm">{feature.title}</p>
                          <p className="text-xs text-stone-500 truncate">{feature.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0" />
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Account;
