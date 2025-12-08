// Service for managing associate design plans (localStorage-based)

const STORAGE_KEY = 'associate_design_plans';

// Helper to get current user ID (you can update this when you have auth)
const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || user._id || 'demo-user-1';
};

// Get all design plans for current user
export const getAllDesigns = () => {
  try {
    const userId = getCurrentUserId();
    const allPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return allPlans.filter(plan => plan.userId === userId);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return [];
  }
};

// Get single design by ID
export const getDesignById = (id) => {
  try {
    const designs = getAllDesigns();
    return designs.find(design => design.id === id) || null;
  } catch (error) {
    console.error('Error fetching design:', error);
    return null;
  }
};

// Get published designs only (for public profile)
export const getPublishedDesigns = (userId = null) => {
  try {
    const targetUserId = userId || getCurrentUserId();
    const allPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return allPlans.filter(plan =>
      plan.userId === targetUserId && plan.status === 'published'
    );
  } catch (error) {
    console.error('Error fetching published designs:', error);
    return [];
  }
};

// Get ALL published designs from ALL users (for marketplace display)
export const getAllPublishedDesigns = () => {
  try {
    const allPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return allPlans.filter(plan => plan.status === 'published');
  } catch (error) {
    console.error('Error fetching all published designs:', error);
    return [];
  }
};

// Convert design plan to studio marketplace format
export const convertDesignToStudioFormat = (design) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return {
    id: design.id,
    _id: design.id,
    title: design.title,
    summary: design.description,
    description: design.description,
    categories: [design.category],
    primaryCategory: design.category,
    style: design.style,
    typology: design.typology,
    climate: design.climate,
    tags: design.tags || [],

    // Images
    heroImage: design.thumbnail || design.images?.[0],
    images: design.images || [],

    // Pricing
    priceSqft: design.priceSqft,
    price: design.totalPrice,
    pricing: {
      basePrice: design.priceSqft,
      total: design.totalPrice,
      currency: 'USD',
      unit: 'sq ft',
    },
    currency: 'USD',

    // Specifications
    areaSqft: design.specifications?.area ? parseInt(design.specifications.area) : null,
    floors: design.specifications?.floors ? parseInt(design.specifications.floors) : null,
    rooms: design.specifications?.bedrooms ? parseInt(design.specifications.bedrooms) : null,

    // Metadata
    status: design.status,
    firm: {
      name: user.name || user.fullName || 'Independent Designer',
      logo: user.profileImage || null,
      bio: 'Design professional offering custom architectural plans',
      services: ['Architectural Design', 'Custom Plans'],
      location: {
        country: 'USA',
      },
    },

    // Stats
    views: design.views || 0,
    rating: 4.5, // Default rating

    // Meta
    createdAt: design.createdAt,
    updatedAt: design.updatedAt,

    // Source tracking
    _source: 'localStorage',
  };
};

// Create new design plan
export const createDesign = (designData) => {
  try {
    const userId = getCurrentUserId();
    const allPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const newDesign = {
      id: `design-${Date.now()}`,
      userId,
      ...designData,
      status: designData.status || 'draft',
      views: 0,
      saves: 0,
      inquiries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allPlans.push(newDesign);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allPlans));

    return { success: true, design: newDesign };
  } catch (error) {
    console.error('Error creating design:', error);
    return { success: false, error: error.message };
  }
};

// Update existing design
export const updateDesign = (id, updates) => {
  try {
    const allPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = allPlans.findIndex(plan => plan.id === id);

    if (index === -1) {
      return { success: false, error: 'Design not found' };
    }

    allPlans[index] = {
      ...allPlans[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allPlans));

    return { success: true, design: allPlans[index] };
  } catch (error) {
    console.error('Error updating design:', error);
    return { success: false, error: error.message };
  }
};

// Delete design
export const deleteDesign = (id) => {
  try {
    const allPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = allPlans.filter(plan => plan.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    return { success: true };
  } catch (error) {
    console.error('Error deleting design:', error);
    return { success: false, error: error.message };
  }
};

// Toggle publish status
export const togglePublishStatus = (id) => {
  try {
    const design = getDesignById(id);
    if (!design) {
      return { success: false, error: 'Design not found' };
    }

    const newStatus = design.status === 'published' ? 'draft' : 'published';
    return updateDesign(id, { status: newStatus });
  } catch (error) {
    console.error('Error toggling publish status:', error);
    return { success: false, error: error.message };
  }
};

// Duplicate design
export const duplicateDesign = (id) => {
  try {
    const design = getDesignById(id);
    if (!design) {
      return { success: false, error: 'Design not found' };
    }

    const duplicated = {
      ...design,
      id: undefined, // Will be generated in createDesign
      title: `${design.title} (Copy)`,
      status: 'draft',
      views: 0,
      saves: 0,
      inquiries: 0,
    };

    return createDesign(duplicated);
  } catch (error) {
    console.error('Error duplicating design:', error);
    return { success: false, error: error.message };
  }
};

// Increment view count
export const incrementViews = (id) => {
  try {
    const design = getDesignById(id);
    if (!design) return { success: false };

    return updateDesign(id, { views: (design.views || 0) + 1 });
  } catch (error) {
    console.error('Error incrementing views:', error);
    return { success: false, error: error.message };
  }
};

// Get design stats summary
export const getDesignStats = () => {
  try {
    const designs = getAllDesigns();

    return {
      total: designs.length,
      published: designs.filter(d => d.status === 'published').length,
      draft: designs.filter(d => d.status === 'draft').length,
      totalViews: designs.reduce((sum, d) => sum + (d.views || 0), 0),
      totalSaves: designs.reduce((sum, d) => sum + (d.saves || 0), 0),
      totalInquiries: designs.reduce((sum, d) => sum + (d.inquiries || 0), 0),
    };
  } catch (error) {
    console.error('Error getting design stats:', error);
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
