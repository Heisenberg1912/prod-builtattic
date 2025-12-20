// Dashboard API service - real data with localStorage fallback

import client from "../config/axios.jsx";

const defaultStats = {
  designStats: { total: 0, published: 0, draft: 0, totalViews: 0, totalSaves: 0 },
  serviceStats: { total: 0, published: 0, draft: 0, totalViews: 0, totalSaves: 0 },
  inquiryStats: { total: 0, unread: 0, read: 0 },
  analytics: { totalViews: 0, uniqueVisitors: 0, avgSessionDuration: 0, topDesigns: [], topServices: [] },
  profileCompletion: 0,
};

// Fetch all dashboard stats
export const fetchDashboardStats = async () => {
  try {
    const { data } = await client.get("/dashboard/stats");
    return { ...defaultStats, ...data, fallback: false };
  } catch (error) {
    console.warn("Dashboard API unavailable, using localStorage");

    const [designs, services, inquiries, analytics] = await Promise.all([
      import("./associateDesigns.js").then(m => m.getDesignStats()),
      import("./associateServices.js").then(m => m.getServiceStats()),
      import("./inquiries.js").then(m => m.getInquiryStats()),
      import("./analytics.js").then(m => m.getAnalyticsSummary(30)),
    ]);

    return {
      designStats: designs,
      serviceStats: services,
      inquiryStats: inquiries,
      analytics,
      profileCompletion: 0,
      fallback: true,
    };
  }
};

// Fetch recent inquiries
export const fetchRecentInquiries = async (limit = 3) => {
  try {
    const { data } = await client.get("/dashboard/inquiries", {
      params: { limit, sort: "-createdAt" },
    });
    return { items: data?.items || [], total: data?.total || 0, fallback: false };
  } catch {
    const { getAllInquiries } = await import("./inquiries.js");
    const items = getAllInquiries().slice(0, limit);
    return { items, total: items.length, fallback: true };
  }
};

// Fetch analytics
export const fetchAnalytics = async (days = 30) => {
  try {
    const { data } = await client.get("/dashboard/analytics", { params: { days } });
    return { ...data, fallback: false };
  } catch {
    const { getAnalyticsSummary } = await import("./analytics.js");
    return { ...getAnalyticsSummary(days), fallback: true };
  }
};

// Calculate profile completion
export const fetchProfileCompletion = async () => {
  try {
    const { data } = await client.get("/dashboard/profile-completion");
    return data?.completion || 0;
  } catch {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [designs, services] = await Promise.all([
      import("./associateDesigns.js").then(m => m.getDesignStats()),
      import("./associateServices.js").then(m => m.getServiceStats()),
    ]);

    let score = 0;
    if (user.name || user.fullName) score += 20;
    if (user.email) score += 20;
    if (designs.total > 0) score += 20;
    if (services.total > 0) score += 20;
    if (designs.published > 0 || services.published > 0) score += 20;

    return score;
  }
};

// Track page view
export const trackPageView = async (page, metadata = {}) => {
  try {
    await client.post("/dashboard/analytics/track", {
      event: "page_view",
      page,
      metadata,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
};

// Mark inquiry as read
export const markInquiryAsRead = async (inquiryId) => {
  const { data } = await client.patch(`/dashboard/inquiries/${inquiryId}`, { read: true });
  return data?.inquiry || null;
};
