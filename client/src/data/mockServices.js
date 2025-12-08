// Mock services data for development

export const mockServices = [
  {
    id: 'service-1',
    userId: 'demo-user-1',
    title: '3D Architectural Visualization',
    category: 'Rendering',
    description: 'Professional photorealistic 3D renders of your architectural designs. Perfect for presentations, marketing materials, and client approvals.',
    thumbnail: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
    images: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
    ],
    packages: [
      {
        name: 'Basic',
        price: 500,
        deliveryTime: '3-5 days',
        features: [
          '2 exterior views',
          'HD resolution (1920x1080)',
          '2 revision rounds',
          'Basic landscaping',
        ],
      },
      {
        name: 'Standard',
        price: 1200,
        deliveryTime: '5-7 days',
        features: [
          '4 exterior + 2 interior views',
          '4K resolution',
          '3 revision rounds',
          'Detailed landscaping',
          'Day & night scenes',
        ],
        popular: true,
      },
      {
        name: 'Premium',
        price: 2500,
        deliveryTime: '7-10 days',
        features: [
          '8 exterior + 4 interior views',
          '4K resolution',
          'Unlimited revisions',
          'Premium landscaping',
          'Multiple lighting scenarios',
          '360° panoramic view',
          'Animation walkthrough (30 sec)',
        ],
      },
    ],
    requirements: [
      'CAD files (DWG, DXF) or SketchUp models',
      'Material specifications',
      'Reference images (if any)',
      'Site photos (for landscaping)',
    ],
    portfolio: [
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600',
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=600',
    ],
    tags: ['3d', 'rendering', 'visualization', 'photorealistic'],
    status: 'published',
    views: 456,
    saves: 34,
    inquiries: 12,
    rating: 4.8,
    reviewCount: 23,
    createdAt: '2025-01-08T10:00:00Z',
    updatedAt: '2025-01-20T14:00:00Z',
  },
  {
    id: 'service-2',
    userId: 'demo-user-1',
    title: 'Interior Design Consultation',
    category: 'Consulting',
    description: 'Expert interior design consultation to transform your spaces. From concept to execution, I help you create beautiful and functional interiors.',
    thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    images: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
      'https://images.unsplash.com/photo-1618219740975-d40978bb7378?w=800',
    ],
    packages: [
      {
        name: 'Single Room',
        price: 800,
        deliveryTime: '5-7 days',
        features: [
          'One room consultation',
          'Mood board creation',
          'Color palette',
          'Furniture recommendations',
          'Shopping list',
        ],
      },
      {
        name: 'Full Home',
        price: 2500,
        deliveryTime: '10-14 days',
        features: [
          'Entire home consultation',
          'Custom mood boards for each room',
          'Detailed floor plans',
          'Furniture & decor sourcing',
          '3D visualization (2 rooms)',
          'Budget planning',
        ],
        popular: true,
      },
      {
        name: 'Premium + Implementation',
        price: 5000,
        deliveryTime: '14-21 days',
        features: [
          'Everything in Full Home',
          'Project management',
          'Contractor coordination',
          'Site visits (up to 3)',
          'Custom furniture design',
          'Final styling',
        ],
      },
    ],
    requirements: [
      'Room dimensions/floor plans',
      'Current photos of the space',
      'Budget range',
      'Style preferences',
      'Functional requirements',
    ],
    portfolio: [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600',
      'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=600',
    ],
    tags: ['interior', 'design', 'consultation', 'styling'],
    status: 'published',
    views: 312,
    saves: 28,
    inquiries: 15,
    rating: 4.9,
    reviewCount: 18,
    createdAt: '2025-01-05T11:00:00Z',
    updatedAt: '2025-01-19T09:00:00Z',
  },
  {
    id: 'service-3',
    userId: 'demo-user-1',
    title: 'Architectural Drawing Services',
    category: 'Technical',
    description: 'Professional architectural and construction drawings including floor plans, elevations, sections, and working drawings.',
    thumbnail: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
    images: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
    ],
    packages: [
      {
        name: 'Basic Plans',
        price: 1200,
        deliveryTime: '7-10 days',
        features: [
          'Floor plans (all levels)',
          'Site plan',
          '4 elevations',
          'Basic sections',
          'CAD files included',
        ],
      },
      {
        name: 'Complete Set',
        price: 3000,
        deliveryTime: '14-21 days',
        features: [
          'Everything in Basic',
          'Detailed sections',
          'Foundation plan',
          'Roof plan',
          'Door/window schedule',
          'Material specifications',
        ],
        popular: true,
      },
    ],
    requirements: [
      'Project brief or concept sketches',
      'Site survey (if available)',
      'Local building codes',
      'Specific requirements',
    ],
    tags: ['cad', 'drawings', 'technical', 'construction'],
    status: 'draft',
    views: 89,
    saves: 7,
    inquiries: 3,
    createdAt: '2025-01-22T13:00:00Z',
    updatedAt: '2025-01-25T15:00:00Z',
  },
];

// Function to seed mock data to localStorage
export const seedMockServices = () => {
  const existing = localStorage.getItem('associate_services');
  if (!existing || JSON.parse(existing).length === 0) {
    localStorage.setItem('associate_services', JSON.stringify(mockServices));
    console.log('Mock services seeded successfully');
    return true;
  }
  console.log('Services already exist in localStorage');
  return false;
};

// Function to clear all services
export const clearServices = () => {
  localStorage.removeItem('associate_services');
  console.log('All services cleared');
};

// Function to reset to mock data
export const resetToMockServices = () => {
  localStorage.setItem('associate_services', JSON.stringify(mockServices));
  console.log('Reset to mock services');
};
