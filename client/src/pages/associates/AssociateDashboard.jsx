import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageSquare,
  Briefcase,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Clock,
  ChevronRight,
  DollarSign,
  Activity,
  BarChart3,
  Star,
  Zap,
  Send,
  BookmarkPlus,
  CreditCard,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  fetchDashboardStats,
  fetchRecentInquiries,
  fetchProfileCompletion,
  fetchEarningsOverview,
  fetchChartAnalytics,
  fetchActivityFeed,
  fetchTopPerformers,
} from "../../services/dashboard";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export default function AssociateDashboard() {
  const navigate = useNavigate();
  const [designStats, setDesignStats] = useState(null);
  const [serviceStats, setServiceStats] = useState(null);
  const [inquiryStats, setInquiryStats] = useState(null);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // New feature states
  const [earnings, setEarnings] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [topPerformers, setTopPerformers] = useState({ topDesigns: [], topServices: [] });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [stats, inquiries, completion, earningsData, chartAnalytics, activities, performers] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentInquiries(3),
        fetchProfileCompletion(),
        fetchEarningsOverview(),
        fetchChartAnalytics(7),
        fetchActivityFeed(5),
        fetchTopPerformers(3),
      ]);

      setDesignStats(stats.designStats);
      setServiceStats(stats.serviceStats);
      setInquiryStats(stats.inquiryStats);
      setRecentInquiries(inquiries.items);
      setProfileCompletion(completion);
      setEarnings(earningsData);
      setChartData(chartAnalytics.data || []);
      setActivityFeed(activities.items || []);
      setTopPerformers(performers);
      setUsingFallback(stats.fallback || inquiries.fallback);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = (designStats?.totalViews || 0) + (serviceStats?.totalViews || 0);
  const totalPublished = (designStats?.published || 0) + (serviceStats?.published || 0);
  const userName = JSON.parse(localStorage.getItem('user') || '{}').name || 'Associate';

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          <p className="text-sm text-stone-500 font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Minimal Header */}
        <motion.header
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-start justify-between">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium text-stone-400 uppercase tracking-wider mb-1"
              >
                Dashboard
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl lg:text-3xl font-semibold text-stone-900 tracking-tight"
              >
                Welcome back, {userName}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-stone-500 mt-1"
              >
                Here's your portfolio overview
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden sm:flex items-center gap-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/associates/design-studio/create')}
                className="border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300 transition-all duration-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                New Design
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/associates/skill-studio/create')}
                className="bg-stone-900 text-white hover:bg-stone-800 transition-all duration-300"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                New Service
              </Button>
            </motion.div>
          </div>
        </motion.header>

        {/* Offline Warning */}
        <AnimatePresence>
          {usingFallback && (
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-6"
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-stone-100 border border-stone-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-stone-500 flex-shrink-0" />
                <p className="text-sm text-stone-600">
                  Showing offline data. Connect to see live analytics.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Completion */}
        <AnimatePresence>
          {profileCompletion < 100 && (
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                      <LayoutDashboard className="w-5 h-5 text-stone-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-900">Complete your profile</h3>
                      <p className="text-sm text-stone-500">{profileCompletion}% completed</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/settings')}
                    className="text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  >
                    Complete
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    className="h-full bg-stone-900 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            title="Total Views"
            value={totalViews.toLocaleString()}
            icon={Eye}
            trend="+12%"
            delay={0.1}
          />
          <StatCard
            title="Published"
            value={totalPublished}
            icon={CheckCircle}
            trend="+8%"
            delay={0.15}
          />
          <StatCard
            title="Saves"
            value={(designStats?.totalSaves || 0) + (serviceStats?.totalSaves || 0)}
            icon={Heart}
            trend="-3%"
            negative
            delay={0.2}
          />
          <StatCard
            title="Inquiries"
            value={inquiryStats?.total || 0}
            icon={MessageSquare}
            trend="+15%"
            badge={inquiryStats?.unread || 0}
            delay={0.25}
          />
        </motion.div>

        {/* Earnings Overview & Analytics Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Earnings Overview */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden h-full">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="font-medium text-stone-900">Earnings Overview</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-6">
                  <p className="text-sm text-stone-500 mb-1">Total Earnings</p>
                  <p className="text-3xl font-semibold text-stone-900">
                    ${(earnings?.totalEarnings || 0).toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-stone-50 rounded-lg">
                    <p className="text-xs text-stone-500 mb-1">This Month</p>
                    <p className="text-lg font-semibold text-stone-900">
                      ${(earnings?.thisMonth || 0).toLocaleString()}
                    </p>
                    {earnings?.lastMonth > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {earnings.thisMonth >= earnings.lastMonth ? (
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={`text-xs ${earnings.thisMonth >= earnings.lastMonth ? 'text-emerald-600' : 'text-red-600'}`}>
                          {Math.abs(Math.round(((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100))}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-stone-500 mb-1">Pending</p>
                    <p className="text-lg font-semibold text-amber-700">
                      ${(earnings?.pendingPayments || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">Processing</p>
                  </div>
                </div>
                {earnings?.payoutHistory?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Recent Payouts</p>
                    <div className="space-y-2">
                      {earnings.payoutHistory.slice(0, 2).map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-stone-400" />
                            <span className="text-sm text-stone-600">${payout.amount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400">
                              {new Date(payout.date).toLocaleDateString()}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              payout.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {payout.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Analytics Chart */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.35 }}
          >
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden h-full">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-stone-900">Views & Inquiries</h3>
                </div>
                <span className="text-xs text-stone-400">Last 7 days</span>
              </div>
              <div className="p-5">
                {chartData.length > 0 ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-stone-800" />
                        <span className="text-xs text-stone-500">Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs text-stone-500">Inquiries</span>
                      </div>
                    </div>
                    <div className="h-40 flex items-end gap-2">
                      {chartData.map((day, index) => {
                        const maxViews = Math.max(...chartData.map(d => d.views), 1);
                        const viewHeight = (day.views / maxViews) * 100;
                        const inquiryHeight = (day.inquiries / maxViews) * 100;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex items-end justify-center gap-0.5 h-32">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${viewHeight}%` }}
                                transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                                className="w-2/5 bg-stone-800 rounded-t"
                                title={`${day.views} views`}
                              />
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${inquiryHeight}%` }}
                                transition={{ delay: 0.45 + index * 0.05, duration: 0.5 }}
                                className="w-2/5 bg-blue-500 rounded-t"
                                title={`${day.inquiries} inquiries`}
                              />
                            </div>
                            <span className="text-xs text-stone-400">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-4 pt-4 border-t border-stone-100">
                      <div>
                        <p className="text-xs text-stone-500">Total Views</p>
                        <p className="text-lg font-semibold text-stone-900">
                          {chartData.reduce((sum, d) => sum + d.views, 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-500">Total Inquiries</p>
                        <p className="text-lg font-semibold text-stone-900">
                          {chartData.reduce((sum, d) => sum + d.inquiries, 0)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <p className="text-sm text-stone-400">No data available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Publishing Guide */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Publishing Destinations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.a
                href="/studio"
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100 hover:border-stone-200 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 text-sm">Design Plans</p>
                    <p className="text-xs text-stone-500">Studio Marketplace</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
              </motion.a>
              <motion.a
                href="/associates"
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100 hover:border-stone-200 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 text-sm">Services</p>
                    <p className="text-xs text-stone-500">Associates Marketplace</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions - Mobile */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.35 }}
          className="sm:hidden mb-8"
        >
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/associates/design-studio/create')}
              className="h-auto py-4 flex flex-col gap-2 border-stone-200 hover:bg-stone-50"
            >
              <FileText className="w-5 h-5 text-stone-600" />
              <span className="text-xs font-medium">New Design</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/associates/skill-studio/create')}
              className="h-auto py-4 flex flex-col gap-2 border-stone-200 hover:bg-stone-50"
            >
              <Briefcase className="w-5 h-5 text-stone-600" />
              <span className="text-xs font-medium">New Service</span>
            </Button>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Design Plans */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900">Design Plans</h3>
                    <p className="text-xs text-stone-500">Studio Marketplace</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/associates/design-studio')}
                  className="text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                >
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500">Total Plans</span>
                    <span className="text-sm font-semibold text-stone-900">{designStats?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-500">Published</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-600 rounded-full">Live</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{designStats?.published || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-500">Drafts</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-stone-50 text-stone-500 rounded-full">Draft</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{designStats?.draft || 0}</span>
                  </div>
                  <div className="pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-500">Total Views</span>
                      <span className="font-semibold text-stone-700">{designStats?.totalViews || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.45 }}
          >
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900">Services</h3>
                    <p className="text-xs text-stone-500">Associates Marketplace</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/associates/skill-studio')}
                  className="text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                >
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500">Total Services</span>
                    <span className="text-sm font-semibold text-stone-900">{serviceStats?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-500">Published</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-600 rounded-full">Live</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{serviceStats?.published || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-500">Drafts</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-stone-50 text-stone-500 rounded-full">Draft</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{serviceStats?.draft || 0}</span>
                  </div>
                  <div className="pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-500">Total Views</span>
                      <span className="font-semibold text-stone-700">{serviceStats?.totalViews || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity Feed & Top Performers Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Feed */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden h-full">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-stone-900">Recent Activity</h3>
                </div>
              </div>
              <div className="p-5">
                {activityFeed.length > 0 ? (
                  <div className="space-y-4">
                    {activityFeed.map((activity, index) => {
                      const getActivityIcon = (type) => {
                        switch (type) {
                          case 'inquiry': return { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-100' };
                          case 'view': return { icon: Eye, color: 'text-stone-500', bg: 'bg-stone-100' };
                          case 'publish': return { icon: Send, color: 'text-emerald-500', bg: 'bg-emerald-100' };
                          case 'save': return { icon: BookmarkPlus, color: 'text-pink-500', bg: 'bg-pink-100' };
                          case 'payment': return { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' };
                          default: return { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-100' };
                        }
                      };
                      const { icon: ActivityIcon, color, bg } = getActivityIcon(activity.type);
                      const timeAgo = (timestamp) => {
                        const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
                        if (seconds < 60) return 'Just now';
                        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
                        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
                        return `${Math.floor(seconds / 86400)}d ago`;
                      };
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.55 + index * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                            <ActivityIcon className={`w-4 h-4 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-stone-700 line-clamp-2">{activity.message}</p>
                            <p className="text-xs text-stone-400 mt-1">{timeAgo(activity.timestamp)}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-5 h-5 text-stone-400" />
                    </div>
                    <p className="text-sm text-stone-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Top Performers */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.55 }}
          >
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden h-full">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-medium text-stone-900">Top Performers</h3>
                </div>
              </div>
              <div className="p-5">
                {(topPerformers.topDesigns?.length > 0 || topPerformers.topServices?.length > 0) ? (
                  <div className="space-y-4">
                    {topPerformers.topDesigns?.slice(0, 2).map((design, index) => (
                      <motion.div
                        key={design.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        onClick={() => navigate(`/associates/design-studio/${design.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-stone-100 hover:border-stone-200 hover:bg-stone-50/50 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                          {index === 0 ? (
                            <span className="text-lg">🥇</span>
                          ) : (
                            <span className="text-lg">🥈</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">{design.title || design.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-stone-500 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {design.views || 0}
                            </span>
                            <span className="text-xs text-stone-500 flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {design.saves || 0}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-full">Design</span>
                      </motion.div>
                    ))}
                    {topPerformers.topServices?.slice(0, 2).map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65 + index * 0.05 }}
                        onClick={() => navigate(`/associates/skill-studio/${service.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-stone-100 hover:border-stone-200 hover:bg-stone-50/50 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-stone-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">{service.title || service.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-stone-500 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {service.views || 0}
                            </span>
                            <span className="text-xs text-stone-500 flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {service.saves || 0}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">Service</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                      <Star className="w-5 h-5 text-stone-400" />
                    </div>
                    <p className="text-sm text-stone-500">No data yet</p>
                    <p className="text-xs text-stone-400 mt-1">Publish content to see top performers</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Inquiries */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-stone-600" />
                </div>
                <h3 className="font-medium text-stone-900">Recent Inquiries</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/associates/inquiries')}
                className="text-stone-500 hover:text-stone-900 hover:bg-stone-100"
              >
                View All
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="p-5">
              {recentInquiries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-5 h-5 text-stone-400" />
                  </div>
                  <p className="text-sm text-stone-500 mb-1">No inquiries yet</p>
                  <p className="text-xs text-stone-400">They'll appear here when clients reach out</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInquiries.map((inquiry, index) => (
                    <motion.div
                      key={inquiry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + index * 0.05 }}
                      onClick={() => navigate(`/associates/inquiries/${inquiry.id}`)}
                      className="group p-4 rounded-lg border border-stone-100 hover:border-stone-200 hover:bg-stone-50/50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600">
                            {inquiry.senderName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h4 className="font-medium text-stone-900 text-sm">{inquiry.senderName}</h4>
                            <p className="text-xs text-stone-500">{inquiry.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!inquiry.read && (
                            <span className="w-2 h-2 rounded-full bg-stone-900" />
                          )}
                          <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                        </div>
                      </div>
                      <p className="text-sm text-stone-500 line-clamp-1 ml-11">{inquiry.message}</p>
                      <div className="flex items-center gap-2 mt-2 ml-11">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span className="text-xs text-stone-400">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, negative, badge, delay = 0 }) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-stone-600" />
          </div>
          {badge > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-stone-900 text-white rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-2xl font-semibold text-stone-900 mb-1">{value}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">{title}</p>
          {trend && (
            <span className={`text-xs font-medium ${negative ? 'text-stone-400' : 'text-stone-600'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
