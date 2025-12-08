// Service for managing associate services (localStorage-based)

const STORAGE_KEY = 'associate_services';

// Helper to get current user ID
const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || user._id || 'demo-user-1';
};

// Get all services for current user
export const getAllServices = () => {
  try {
    const userId = getCurrentUserId();
    const allServices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return allServices.filter(service => service.userId === userId);
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Get single service by ID
export const getServiceById = (id) => {
  try {
    const services = getAllServices();
    return services.find(service => service.id === id) || null;
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
};

// Get published services only (for public profile)
export const getPublishedServices = (userId = null) => {
  try {
    const targetUserId = userId || getCurrentUserId();
    const allServices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return allServices.filter(service =>
      service.userId === targetUserId && service.status === 'published'
    );
  } catch (error) {
    console.error('Error fetching published services:', error);
    return [];
  }
};

// Create new service
export const createService = (serviceData) => {
  try {
    const userId = getCurrentUserId();
    const allServices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const newService = {
      id: `service-${Date.now()}`,
      userId,
      ...serviceData,
      status: serviceData.status || 'draft',
      views: 0,
      saves: 0,
      inquiries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allServices.push(newService);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allServices));

    return { success: true, service: newService };
  } catch (error) {
    console.error('Error creating service:', error);
    return { success: false, error: error.message };
  }
};

// Update existing service
export const updateService = (id, updates) => {
  try {
    const allServices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = allServices.findIndex(service => service.id === id);

    if (index === -1) {
      return { success: false, error: 'Service not found' };
    }

    allServices[index] = {
      ...allServices[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allServices));

    return { success: true, service: allServices[index] };
  } catch (error) {
    console.error('Error updating service:', error);
    return { success: false, error: error.message };
  }
};

// Delete service
export const deleteService = (id) => {
  try {
    const allServices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = allServices.filter(service => service.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    return { success: true };
  } catch (error) {
    console.error('Error deleting service:', error);
    return { success: false, error: error.message };
  }
};

// Toggle publish status
export const togglePublishStatus = (id) => {
  try {
    const service = getServiceById(id);
    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    const newStatus = service.status === 'published' ? 'draft' : 'published';
    return updateService(id, { status: newStatus });
  } catch (error) {
    console.error('Error toggling publish status:', error);
    return { success: false, error: error.message };
  }
};

// Duplicate service
export const duplicateService = (id) => {
  try {
    const service = getServiceById(id);
    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    const duplicated = {
      ...service,
      id: undefined, // Will be generated in createService
      title: `${service.title} (Copy)`,
      status: 'draft',
      views: 0,
      saves: 0,
      inquiries: 0,
    };

    return createService(duplicated);
  } catch (error) {
    console.error('Error duplicating service:', error);
    return { success: false, error: error.message };
  }
};

// Increment view count
export const incrementViews = (id) => {
  try {
    const service = getServiceById(id);
    if (!service) return { success: false };

    return updateService(id, { views: (service.views || 0) + 1 });
  } catch (error) {
    console.error('Error incrementing views:', error);
    return { success: false, error: error.message };
  }
};

// Get ALL published services from ALL users (for marketplace display)
export const getAllPublishedServices = () => {
  try {
    const allServices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return allServices.filter(service => service.status === 'published');
  } catch (error) {
    console.error('Error fetching all published services:', error);
    return [];
  }
};

// Convert service to associates marketplace format
export const convertServiceToAssociateFormat = (service) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return {
    id: service.id,
    _id: service.id,
    userId: service.userId, // Keep userId for portfolio grouping

    // Display the SERVICE TITLE as the main name (not user name)
    name: service.title, // THIS is what shows on the card
    firmName: user.firmName || user.name || user.fullName || 'Independent',

    // Service details
    title: service.title,
    summary: service.description,
    description: service.description,
    category: service.category,
    specialization: service.specialization,
    skills: service.skills || [],
    tools: service.tools || [],

    // Images - use service portfolio or user avatar
    avatar: service.portfolio?.[0] || user.profileImage || service.profileImage || null,
    heroImage: service.portfolio?.[0] || user.profileImage || null,
    profileImage: service.portfolio?.[0] || user.profileImage || null,
    portfolio: service.portfolio || [],
    coverImage: service.coverImage || service.portfolio?.[0],

    // Pricing - show the actual rate
    rate: service.rate,
    hourlyRate: service.rateType === 'hourly' ? service.rate : null,
    rateType: service.rateType || 'hourly',
    rates: {
      hourly: service.rateType === 'hourly' ? service.rate : null,
      project: service.rateType === 'project' ? service.rate : null,
      currency: 'USD',
    },
    pricing: {
      hourly: service.rateType === 'hourly' ? service.rate : null,
      project: service.rateType === 'project' ? service.rate : null,
      currency: 'USD',
    },

    // Experience
    experience: service.experience || '1-3 years',
    availability: service.availability || 'Available',
    responseTime: service.responseTime || '24 hours',

    // Contact
    email: user.email || 'contact@example.com',
    location: service.location || user.location || 'Remote',

    // Stats
    views: service.views || 0,
    saves: service.saves || 0,
    rating: 4.5, // Default rating
    reviewCount: 0,
    completedProjects: service.completedProjects || 0,

    // Metadata
    status: service.status,
    verified: true,

    // Timestamps
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,

    // Source tracking
    _source: 'localStorage',
  };
};

// Get service stats summary
export const getServiceStats = () => {
  try {
    const services = getAllServices();

    return {
      total: services.length,
      published: services.filter(s => s.status === 'published').length,
      draft: services.filter(s => s.status === 'draft').length,
      totalViews: services.reduce((sum, s) => sum + (s.views || 0), 0),
      totalSaves: services.reduce((sum, s) => sum + (s.saves || 0), 0),
      totalInquiries: services.reduce((sum, s) => sum + (s.inquiries || 0), 0),
    };
  } catch (error) {
    console.error('Error getting service stats:', error);
    return {
      total: 0,
      published: 0,
      draft: 0,
      totalViews: 0,
      totalSaves: 0,
      totalInquiries: 0,
    };
  }
};
