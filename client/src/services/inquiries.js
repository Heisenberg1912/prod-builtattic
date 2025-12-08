// Service for managing inquiries/messages (localStorage-based)

const STORAGE_KEY = 'associate_inquiries';

// Helper to get current user ID
const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || user._id || 'demo-user-1';
};

// Get all inquiries for current user (received messages)
export const getAllInquiries = () => {
  try {
    const userId = getCurrentUserId();
    const allInquiries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return allInquiries.filter(inquiry => inquiry.recipientId === userId);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return [];
  }
};

// Get unread inquiries count
export const getUnreadCount = () => {
  try {
    const inquiries = getAllInquiries();
    return inquiries.filter(inquiry => !inquiry.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Get single inquiry by ID
export const getInquiryById = (id) => {
  try {
    const inquiries = getAllInquiries();
    return inquiries.find(inquiry => inquiry.id === id) || null;
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    return null;
  }
};

// Create new inquiry (when someone contacts the associate)
export const createInquiry = (inquiryData) => {
  try {
    const allInquiries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const newInquiry = {
      id: `inquiry-${Date.now()}`,
      ...inquiryData,
      read: false,
      archived: false,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allInquiries.push(newInquiry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allInquiries));

    return { success: true, inquiry: newInquiry };
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return { success: false, error: error.message };
  }
};

// Mark inquiry as read
export const markAsRead = (id) => {
  try {
    const allInquiries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = allInquiries.findIndex(inquiry => inquiry.id === id);

    if (index === -1) {
      return { success: false, error: 'Inquiry not found' };
    }

    allInquiries[index] = {
      ...allInquiries[index],
      read: true,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allInquiries));

    return { success: true, inquiry: allInquiries[index] };
  } catch (error) {
    console.error('Error marking as read:', error);
    return { success: false, error: error.message };
  }
};

// Mark inquiry as unread
export const markAsUnread = (id) => {
  try {
    const allInquiries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = allInquiries.findIndex(inquiry => inquiry.id === id);

    if (index === -1) {
      return { success: false, error: 'Inquiry not found' };
    }

    allInquiries[index] = {
      ...allInquiries[index],
      read: false,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allInquiries));

    return { success: true, inquiry: allInquiries[index] };
  } catch (error) {
    console.error('Error marking as unread:', error);
    return { success: false, error: error.message };
  }
};

// Archive inquiry
export const archiveInquiry = (id) => {
  try {
    const allInquiries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = allInquiries.findIndex(inquiry => inquiry.id === id);

    if (index === -1) {
      return { success: false, error: 'Inquiry not found' };
    }

    allInquiries[index] = {
      ...allInquiries[index],
      archived: true,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allInquiries));

    return { success: true, inquiry: allInquiries[index] };
  } catch (error) {
    console.error('Error archiving inquiry:', error);
    return { success: false, error: error.message };
  }
};

// Delete inquiry
export const deleteInquiry = (id) => {
  try {
    const allInquiries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = allInquiries.filter(inquiry => inquiry.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    return { success: true };
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    return { success: false, error: error.message };
  }
};

// Add reply to inquiry
export const addReply = (inquiryId, replyData) => {
  try {
    const allInquiries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = allInquiries.findIndex(inquiry => inquiry.id === inquiryId);

    if (index === -1) {
      return { success: false, error: 'Inquiry not found' };
    }

    const reply = {
      id: `reply-${Date.now()}`,
      senderId: getCurrentUserId(),
      ...replyData,
      createdAt: new Date().toISOString(),
    };

    allInquiries[index] = {
      ...allInquiries[index],
      replies: [...(allInquiries[index].replies || []), reply],
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allInquiries));

    return { success: true, inquiry: allInquiries[index], reply };
  } catch (error) {
    console.error('Error adding reply:', error);
    return { success: false, error: error.message };
  }
};

// Get inquiry stats
export const getInquiryStats = () => {
  try {
    const inquiries = getAllInquiries();

    return {
      total: inquiries.length,
      unread: inquiries.filter(i => !i.read).length,
      archived: inquiries.filter(i => i.archived).length,
      thisWeek: inquiries.filter(i => {
        const createdDate = new Date(i.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate >= weekAgo;
      }).length,
    };
  } catch (error) {
    console.error('Error getting inquiry stats:', error);
    return {
      total: 0,
      unread: 0,
      archived: 0,
      thisWeek: 0,
    };
  }
};
