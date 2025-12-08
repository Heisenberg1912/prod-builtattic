// Mock design plans data for development

export const mockDesigns = [
  {
    id: 'design-1',
    userId: 'demo-user-1',
    title: 'Modern Coastal Villa Design',
    category: 'Residential',
    typology: 'Villa',
    style: 'Modern',
    climate: 'Tropical',
    description: 'A stunning modern villa designed for coastal living with open spaces and natural ventilation. Features large glass panels, minimalist interiors, and seamless indoor-outdoor flow.',
    thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ],
    specifications: {
      area: '3500 sqft',
      bedrooms: 4,
      bathrooms: 3,
      floors: 2,
      parking: '2 cars',
      plotSize: '5000 sqft',
    },
    priceSqft: 450,
    totalPrice: 1575000,
    deliveryTime: '45-60 days',
    tags: ['modern', 'villa', 'coastal', 'luxury', 'sustainable'],
    status: 'published',
    views: 234,
    saves: 18,
    inquiries: 5,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z',
  },
  {
    id: 'design-2',
    userId: 'demo-user-1',
    title: 'Minimalist Urban Apartment',
    category: 'Residential',
    typology: 'Apartment',
    style: 'Minimalist',
    climate: 'Temperate',
    description: 'Efficient use of space with clean lines and functional design. Perfect for young professionals seeking a contemporary urban lifestyle.',
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800',
    ],
    specifications: {
      area: '1200 sqft',
      bedrooms: 2,
      bathrooms: 2,
      floors: 1,
      parking: '1 car',
    },
    priceSqft: 320,
    totalPrice: 384000,
    deliveryTime: '30-45 days',
    tags: ['minimalist', 'apartment', 'urban', 'efficient'],
    status: 'published',
    views: 189,
    saves: 24,
    inquiries: 8,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-18T11:00:00Z',
  },
  {
    id: 'design-3',
    userId: 'demo-user-1',
    title: 'Contemporary Office Complex',
    category: 'Commercial',
    typology: 'Office',
    style: 'Contemporary',
    climate: 'Temperate',
    description: 'Multi-story office building with modern amenities, collaborative spaces, and energy-efficient systems. Designed for tech companies and startups.',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    ],
    specifications: {
      area: '15000 sqft',
      floors: 5,
      parking: '50 cars',
      capacity: '200+ employees',
    },
    priceSqft: 580,
    totalPrice: 8700000,
    deliveryTime: '90-120 days',
    tags: ['commercial', 'office', 'contemporary', 'tech', 'sustainable'],
    status: 'draft',
    views: 67,
    saves: 5,
    inquiries: 2,
    createdAt: '2025-01-25T12:00:00Z',
    updatedAt: '2025-01-26T16:00:00Z',
  },
  {
    id: 'design-4',
    userId: 'demo-user-1',
    title: 'Scandinavian Family Home',
    category: 'Residential',
    typology: 'Single-Family House',
    style: 'Scandinavian',
    climate: 'Cold',
    description: 'Warm and inviting family home with natural materials, cozy interiors, and excellent insulation for cold climates.',
    thumbnail: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    ],
    specifications: {
      area: '2400 sqft',
      bedrooms: 3,
      bathrooms: 2,
      floors: 1,
      parking: '2 cars',
      plotSize: '4000 sqft',
    },
    priceSqft: 380,
    totalPrice: 912000,
    deliveryTime: '60-75 days',
    tags: ['scandinavian', 'family', 'cozy', 'sustainable'],
    status: 'published',
    views: 156,
    saves: 21,
    inquiries: 6,
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-22T10:00:00Z',
  },
];

// Function to seed mock data to localStorage
export const seedMockDesigns = () => {
  const existing = localStorage.getItem('associate_design_plans');
  if (!existing || JSON.parse(existing).length === 0) {
    localStorage.setItem('associate_design_plans', JSON.stringify(mockDesigns));
    console.log('Mock design plans seeded successfully');
    return true;
  }
  console.log('Design plans already exist in localStorage');
  return false;
};

// Function to clear all design plans
export const clearDesigns = () => {
  localStorage.removeItem('associate_design_plans');
  console.log('All design plans cleared');
};

// Function to reset to mock data
export const resetToMockDesigns = () => {
  localStorage.setItem('associate_design_plans', JSON.stringify(mockDesigns));
  console.log('Reset to mock design plans');
};
