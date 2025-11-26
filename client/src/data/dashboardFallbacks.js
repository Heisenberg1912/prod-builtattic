const now = () => new Date().toISOString();

export const ASSOCIATE_DASHBOARD_FALLBACK = {
  fallbackLabel: 'Empty Skill Studio data',
  registration: {
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    educationLevel: '',
    verificationStatus: '',
    experienceYears: 0,
    skills: [],
    primaryCategories: [],
    primaryStyles: [],
    designRate: '',
    availability: '',
    workMode: '',
    portfolioLink: '',
  },
  profile: {
    title: '',
    summary: '',
    location: '',
    timezone: '',
    experienceYears: 0,
    hourlyRate: 0,
    availability: '',
  },
  feedback: { average: 0, count: 0, recent: [] },
  metrics: {
    profileCompleteness: 0,
    hourlyRate: 0,
    activeLeads: 0,
    applicationsTracked: 0,
    alerts: 0,
  },
  leads: [],
  applications: [],
  servicePacks: [],
  meetings: [],
  nextActions: [],
  availability: {
    timezone: '',
    note: '',
  },
};

export const FIRM_DASHBOARD_FALLBACK = {
  fallbackLabel: 'Demo Design Studio data',
  firm: {
    name: 'Demo Design Collective',
    tagline: 'Concepts, specs, and delivery playbooks.',
  },
  registration: {
    firmName: 'Demo Design Collective',
    founderName: 'Aria Patel',
    email: 'studio@demo.builtattic.com',
    phone: '+1 310 555 0198',
    country: 'United States',
    city: 'Los Angeles',
    registrationId: 'US-REG-2024-001',
    verificationDocument: 'DemoLicense.pdf',
    firmType: 'Architecture',
    website: 'https://builtattic.com/design-studio',
  },
  profile: {
    tagline: 'Sample listing shown whenever the Design Studio API is offline.',
    summary:
      'Update any field and save to preview how your Design Studio card syncs with the marketplace without touching production data.',
    specialties: ['Hospitality', 'Workplace'],
    services: ['Architecture', 'Interior'],
    regions: ['Middle East', 'South Asia'],
    languages: ['English'],
    certifications: ['ISO 9001'],
    heroImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    ],
    updatedAt: now(),
  },
};

