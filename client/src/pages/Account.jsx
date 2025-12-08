import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  ChevronRight,
  ArrowRight,
  Zap,
  CheckCircle,
  Activity,
  Award,
  CreditCard,
} from "lucide-react";

import { fetchOrders } from "../services/orders.js";
import { useCart } from "../context/CartContext";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
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
  const fullName = profile?.name || "Guest";
  const email = profile?.email || "guest@builtattic.com";
  const membership = profile?.membership || "Prime Access";
  const initials = initialsFrom(fullName || email);

  const stats = [
    {
      label: "Orders Placed",
      value: orderStats.total,
      icon: PackageCheck,
      subLabel: orderStats.total ? "Across all categories" : "No orders yet",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Lifetime Spend",
      value: orderStats.spend ? formatCurrency(orderStats.spend) : "-",
      icon: TrendingUp,
      subLabel: "Total value of orders",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Wishlist Items",
      value: wishlistCount,
      icon: Star,
      subLabel: wishlistCount ? "Saved for later" : "Add favorites",
      color: "from-amber-500 to-amber-600",
    },
    {
      label: "Cart Items",
      value: cartCount,
      icon: ShoppingBag,
      subLabel: cartCount ? "Ready to checkout" : "Cart is empty",
      color: "from-purple-500 to-purple-600",
    },
  ];

  const quickActions = [
    {
      title: "Browse Marketplace",
      description: "Explore studios, warehouses, and services",
      icon: ShoppingBag,
      to: "/studio",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Account Settings",
      description: "Manage your preferences and security",
      icon: Settings2,
      to: "/settings",
      color: "bg-gradient-to-br from-slate-700 to-slate-900",
    },
    {
      title: "Wishlist",
      description: `${wishlistCount} items saved`,
      icon: Heart,
      to: "/wishlist",
      color: "bg-gradient-to-br from-rose-500 to-rose-600",
      badge: wishlistCount || null,
    },
    {
      title: "Help Center",
      description: "Get support and browse FAQs",
      icon: Headphones,
      to: "/faqs",
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
  ];

  const accountFeatures = [
    {
      title: "Login & Security",
      description: "Manage passwords, 2FA, and devices",
      icon: ShieldCheck,
      to: "/settings",
    },
    {
      title: "Addresses",
      description: "Save delivery locations",
      icon: MapPin,
      to: "/settings",
    },
    {
      title: "Payment Methods",
      description: "Cards, UPI, and billing",
      icon: Wallet,
      to: "/settings",
    },
    {
      title: "Gift Cards",
      description: "Redeem codes and credits",
      icon: Gift,
      to: "/account",
    },
    {
      title: "Communications",
      description: "Email and notification settings",
      icon: MessageSquare,
      to: "/settings",
    },
    {
      title: "Collaborators",
      description: "Invite team members",
      icon: UserCog,
      to: "/associates",
    },
  ];

  const premiumFeatures = [
    {
      title: "Priority Support",
      description: "24/7 dedicated assistance",
      icon: Crown,
    },
    {
      title: "Exclusive Deals",
      description: "Early access to launches",
      icon: Ticket,
    },
    {
      title: "Professional Services",
      description: "Connect with vetted experts",
      icon: PackageCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-8 md:p-12 shadow-2xl text-white overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 ring-4 ring-white/20 shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-white to-slate-100 text-slate-900 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-white/70 uppercase tracking-wider">Account Dashboard</p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">{fullName}</h1>
                <p className="text-white/80 mt-2">{email}</p>
                <div className="flex items-center gap-3 mt-4">
                  <Badge className="bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-sm">
                    <Sparkles size={14} className="mr-1" />
                    {membership}
                  </Badge>
                  <Badge className="bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/30 text-emerald-100 backdrop-blur-sm">
                    <CheckCircle size={14} className="mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/settings">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg w-full md:w-auto">
                  <Settings2 size={18} />
                  Manage Account
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-slate-200 overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon size={24} />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                    <p className="text-sm text-slate-600">{stat.subLabel}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={24} className="text-amber-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>One-click access to your most-used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} to={action.to}>
                      <div className={`${action.color} text-white rounded-2xl p-6 hover:scale-105 transition-transform shadow-lg cursor-pointer relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <Icon size={28} className="opacity-90" />
                            {action.badge && (
                              <Badge className="bg-white/20 border-white/30 text-white">
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                          <p className="text-sm text-white/80">{action.description}</p>
                          <div className="mt-4 flex items-center gap-2 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Open</span>
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity size={24} className="text-blue-500" />
                    Recent Orders
                  </CardTitle>
                  <CardDescription>Your latest marketplace activity</CardDescription>
                </div>
                {orders.length > 0 && (
                  <Link to="/orders">
                    <Button variant="outline" size="sm">
                      View All
                      <ChevronRight size={16} />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                </div>
              ) : recentOrders.length ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {order.placedOn}
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {order.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 line-clamp-2 mb-3">{order.title}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-slate-900">{order.amount}</p>
                        <Link to="/orders">
                          <Button variant="ghost" size="sm">
                            Track
                            <ChevronRight size={16} />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <PackageCheck size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-4">No orders yet</p>
                  <Link to="/studio">
                    <Button>
                      Start Shopping
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              )}
              {ordersError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  {ordersError}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 size={24} className="text-slate-700" />
                Account Management
              </CardTitle>
              <CardDescription>Configure your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {accountFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} to={feature.to}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
                          <Icon size={20} className="text-slate-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{feature.title}</p>
                          <p className="text-sm text-slate-600">{feature.description}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown size={24} className="text-amber-600" />
                Premium Benefits
              </CardTitle>
              <CardDescription className="text-amber-900/70">
                Exclusive perks for {membership} members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {premiumFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-start gap-3 p-4 rounded-lg bg-white/50 backdrop-blur-sm">
                    <div className="p-2 rounded-lg bg-amber-200/50">
                      <Icon size={20} className="text-amber-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900">{feature.title}</p>
                      <p className="text-sm text-amber-800/70">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white mt-4">
                <Award size={18} />
                Upgrade Membership
                <ArrowRight size={18} />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Account;
