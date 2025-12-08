import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Plus,
  Briefcase,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import StatsCard from "../../components/associate/StatsCard";
import StatusBadge from "../../components/associate/StatusBadge";
import { getDesignStats } from "../../services/associateDesigns";
import { getServiceStats } from "../../services/associateServices";
import { getInquiryStats, getAllInquiries } from "../../services/inquiries";
import { getAnalyticsSummary } from "../../services/analytics";
import { seedMockDesigns } from "../../data/mockDesigns";
import { seedMockServices } from "../../data/mockServices";
import { seedMockInquiries } from "../../data/mockInquiries";

export default function AssociateDashboard() {
  const navigate = useNavigate();
  const [designStats, setDesignStats] = useState(null);
  const [serviceStats, setServiceStats] = useState(null);
  const [inquiryStats, setInquiryStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Seed mock data if not exists
    seedMockDesigns();
    seedMockServices();
    seedMockInquiries();

    // Load stats
    setDesignStats(getDesignStats());
    setServiceStats(getServiceStats());
    setInquiryStats(getInquiryStats());
    setAnalytics(getAnalyticsSummary(30));

    // Load recent inquiries
    const allInquiries = getAllInquiries();
    setRecentInquiries(allInquiries.slice(0, 3));

    // Calculate profile completion
    calculateProfileCompletion();
  };

  const calculateProfileCompletion = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const designs = getDesignStats();
    const services = getServiceStats();

    let completed = 0;
    const total = 5;

    if (user.name || user.fullName) completed++;
    if (user.email) completed++;
    if (designs.total > 0) completed++;
    if (services.total > 0) completed++;
    if (designs.published > 0 || services.published > 0) completed++;

    setProfileCompletion(Math.round((completed / total) * 100));
  };

  const totalViews = (designStats?.totalViews || 0) + (serviceStats?.totalViews || 0);
  const totalPublished = (designStats?.published || 0) + (serviceStats?.published || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome back, {JSON.parse(localStorage.getItem('user') || '{}').name || 'Associate'}!
              </h1>
              <p className="text-slate-600">Here's what's happening with your portfolio today</p>
            </div>
          </div>
        </motion.div>

        {/* Publishing Guide Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-2">📍 Where Your Work Gets Published</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-slate-700">
                        <strong>Design Plans</strong> → <a href="/studio" className="text-blue-600 hover:underline">Studio Marketplace</a>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-slate-700">
                        <strong>Services</strong> → <a href="/associates" className="text-purple-600 hover:underline">Associates Marketplace</a>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Completion Banner */}
        {profileCompletion < 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">Complete Your Profile</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      You're {profileCompletion}% done! Complete your profile to attract more clients.
                    </p>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${profileCompletion}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2.5 rounded-full"
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      {designStats?.total === 0 && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          Add at least one Design Plan
                        </div>
                      )}
                      {serviceStats?.total === 0 && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          Add at least one Service
                        </div>
                      )}
                      {totalPublished === 0 && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          Publish your first plan or service
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/settings')}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Complete Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Views"
            value={totalViews.toLocaleString()}
            icon={Eye}
            trend={12}
            trendLabel="vs last month"
            color="blue"
            delay={0.1}
          />
          <StatsCard
            title="Published Items"
            value={totalPublished}
            icon={CheckCircle}
            trend={8}
            trendLabel="this month"
            color="green"
            delay={0.2}
          />
          <StatsCard
            title="Saves"
            value={(designStats?.totalSaves || 0) + (serviceStats?.totalSaves || 0)}
            icon={Heart}
            trend={-3}
            trendLabel="vs last month"
            color="purple"
            delay={0.3}
          />
          <StatsCard
            title="Inquiries"
            value={inquiryStats?.total || 0}
            icon={MessageSquare}
            trend={15}
            trendLabel="new this week"
            color="orange"
            delay={0.4}
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon={FileText}
              title="Add Design Plan"
              description="Publishes to Studio Marketplace"
              onClick={() => navigate('/associates/design-studio/create')}
              color="from-blue-500 to-cyan-500"
            />
            <QuickActionCard
              icon={Briefcase}
              title="Add Service"
              description="Publishes to Associates Marketplace"
              onClick={() => navigate('/associates/skill-studio/create')}
              color="from-purple-500 to-pink-500"
            />
            <QuickActionCard
              icon={MessageSquare}
              title="View Inquiries"
              description={`${inquiryStats?.unread || 0} unread messages`}
              onClick={() => navigate('/associates/inquiries')}
              color="from-orange-500 to-amber-500"
              badge={inquiryStats?.unread || 0}
            />
            <QuickActionCard
              icon={TrendingUp}
              title="View Analytics"
              description="Check performance"
              onClick={() => navigate('/associates/analytics')}
              color="from-emerald-500 to-teal-500"
            />
          </div>
        </motion.div>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Design Plans Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Design Plans</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Published to <a href="/studio" className="text-blue-600 hover:underline font-medium">Studio Marketplace</a></p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/associates/design-studio')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Plans</span>
                  <span className="font-semibold text-slate-900">{designStats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Published</span>
                  <StatusBadge status="published" size="sm" />
                  <span className="font-semibold text-slate-900">{designStats?.published || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Drafts</span>
                  <StatusBadge status="draft" size="sm" />
                  <span className="font-semibold text-slate-900">{designStats?.draft || 0}</span>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Views</span>
                    <span className="font-semibold text-slate-700">{designStats?.totalViews || 0}</span>
                  </div>
                </div>
                <Button
                  onClick={() => window.location.href = '/studio'}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  View on Studio Marketplace →
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Services Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Services</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Published to <a href="/associates" className="text-purple-600 hover:underline font-medium">Associates Marketplace</a></p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/associates/skill-studio')}
                  className="text-purple-600 hover:text-purple-700"
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Services</span>
                  <span className="font-semibold text-slate-900">{serviceStats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Published</span>
                  <StatusBadge status="published" size="sm" />
                  <span className="font-semibold text-slate-900">{serviceStats?.published || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Drafts</span>
                  <StatusBadge status="draft" size="sm" />
                  <span className="font-semibold text-slate-900">{serviceStats?.draft || 0}</span>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Views</span>
                    <span className="font-semibold text-slate-700">{serviceStats?.totalViews || 0}</span>
                  </div>
                </div>
                <Button
                  onClick={() => window.location.href = '/associates'}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  View on Associates Marketplace →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Inquiries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Inquiries</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/associates/inquiries')}
                className="text-orange-600 hover:text-orange-700"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentInquiries.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No inquiries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      onClick={() => navigate(`/associates/inquiries/${inquiry.id}`)}
                      className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">{inquiry.senderName}</h4>
                          <p className="text-sm text-slate-600">{inquiry.subject}</p>
                        </div>
                        {!inquiry.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1">{inquiry.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-blue-600">View Details →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, description, onClick, color, badge }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        onClick={onClick}
        className="cursor-pointer border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            {badge > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {badge}
              </div>
            )}
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
