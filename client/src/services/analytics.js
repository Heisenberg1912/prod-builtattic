// Service for analytics and tracking (localStorage-based)

const STORAGE_KEY = 'associate_analytics';

// Helper to get current user ID
const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || user._id || 'demo-user-1';
};

// Track a view event
export const trackView = (itemType, itemId) => {
  try {
    const userId = getCurrentUserId();
    const allEvents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const event = {
      id: `event-${Date.now()}`,
      userId,
      type: 'view',
      itemType, // 'design' or 'service'
      itemId,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };

    allEvents.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents));

    return { success: true, event };
  } catch (error) {
    console.error('Error tracking view:', error);
    return { success: false, error: error.message };
  }
};

// Track a save/favorite event
export const trackSave = (itemType, itemId) => {
  try {
    const userId = getCurrentUserId();
    const allEvents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const event = {
      id: `event-${Date.now()}`,
      userId,
      type: 'save',
      itemType,
      itemId,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    allEvents.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents));

    return { success: true, event };
  } catch (error) {
    console.error('Error tracking save:', error);
    return { success: false, error: error.message };
  }
};

// Track an inquiry event
export const trackInquiry = (itemType, itemId) => {
  try {
    const userId = getCurrentUserId();
    const allEvents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const event = {
      id: `event-${Date.now()}`,
      userId,
      type: 'inquiry',
      itemType,
      itemId,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    allEvents.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents));

    return { success: true, event };
  } catch (error) {
    console.error('Error tracking inquiry:', error);
    return { success: false, error: error.message };
  }
};

// Get events for current user
const getUserEvents = () => {
  try {
    const userId = getCurrentUserId();
    const allEvents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return allEvents.filter(event => event.userId === userId);
  } catch (error) {
    console.error('Error getting user events:', error);
    return [];
  }
};

// Get views for a specific item
export const getItemViews = (itemType, itemId, days = 30) => {
  try {
    const events = getUserEvents();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return events.filter(event =>
      event.type === 'view' &&
      event.itemType === itemType &&
      event.itemId === itemId &&
      new Date(event.timestamp) >= cutoffDate
    ).length;
  } catch (error) {
    console.error('Error getting item views:', error);
    return 0;
  }
};

// Get analytics summary for date range
export const getAnalyticsSummary = (days = 30) => {
  try {
    const events = getUserEvents();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentEvents = events.filter(event =>
      new Date(event.timestamp) >= cutoffDate
    );

    return {
      totalViews: recentEvents.filter(e => e.type === 'view').length,
      totalSaves: recentEvents.filter(e => e.type === 'save').length,
      totalInquiries: recentEvents.filter(e => e.type === 'inquiry').length,
      designViews: recentEvents.filter(e => e.type === 'view' && e.itemType === 'design').length,
      serviceViews: recentEvents.filter(e => e.type === 'view' && e.itemType === 'service').length,
    };
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    return {
      totalViews: 0,
      totalSaves: 0,
      totalInquiries: 0,
      designViews: 0,
      serviceViews: 0,
    };
  }
};

// Get daily views for chart data
export const getDailyViews = (days = 30) => {
  try {
    const events = getUserEvents();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const dailyData = {};

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = 0;
    }

    // Count views per day
    events
      .filter(e => e.type === 'view' && new Date(e.timestamp) >= cutoffDate)
      .forEach(event => {
        if (dailyData[event.date] !== undefined) {
          dailyData[event.date]++;
        }
      });

    // Convert to array format for charts
    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('Error getting daily views:', error);
    return [];
  }
};

// Get top performing items
export const getTopPerforming = (itemType, limit = 5) => {
  try {
    const events = getUserEvents();
    const itemCounts = {};

    events
      .filter(e => e.type === 'view' && e.itemType === itemType)
      .forEach(event => {
        itemCounts[event.itemId] = (itemCounts[event.itemId] || 0) + 1;
      });

    return Object.entries(itemCounts)
      .map(([itemId, views]) => ({ itemId, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top performing:', error);
    return [];
  }
};

// Calculate growth percentage
export const getGrowthPercentage = (days = 30) => {
  try {
    const events = getUserEvents();
    const now = new Date();

    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);

    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    const previousPeriodEnd = currentPeriodStart;

    const currentViews = events.filter(e =>
      e.type === 'view' &&
      new Date(e.timestamp) >= currentPeriodStart &&
      new Date(e.timestamp) <= now
    ).length;

    const previousViews = events.filter(e =>
      e.type === 'view' &&
      new Date(e.timestamp) >= previousPeriodStart &&
      new Date(e.timestamp) < previousPeriodEnd
    ).length;

    if (previousViews === 0) return currentViews > 0 ? 100 : 0;

    const growth = ((currentViews - previousViews) / previousViews) * 100;
    return Math.round(growth);
  } catch (error) {
    console.error('Error calculating growth:', error);
    return 0;
  }
};
