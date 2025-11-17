const now = () => new Date().toISOString();



export const ASSOCIATE_DASHBOARD_FALLBACK = {

  fallbackLabel: 'Demo Skill Studio data',

  registration: {

    fullName: 'Mira Desai',

    email: 'associate@demo.builtattic.com',

    phone: '+91 90000 12345',

    country: 'India',

    city: 'Bengaluru',

    educationLevel: "Master's",

    verificationStatus: 'Degree verified',

    experienceYears: 8,

    skills: ['BIM coordination', 'Rhino', 'FF&E sourcing'],

    primaryCategories: ['Residential', 'Hospitality'],

    primaryStyles: ['Tropical modern', 'Minimal'],

    designRate: '$12 / sqft',

    availability: 'Weekly retainer',

    workMode: 'Remote',

    portfolioLink: 'https://builtattic.com/skill-studio/mira',

  },

  profile: {

    title: 'Senior BIM Coordinator',

    summary: 'Demo profile showing how your Skill Studio card looks once it is fully ready.',

    location: 'Remote',

    timezone: 'UTC',

    experienceYears: 8,

    hourlyRate: 75,

    availability: 'Available for part-time consulting',

  },

  feedback: {
    average: 4.8,
    count: 36,
    recent: [
      { id: 'assoc-feedback-1', score: 5, comment: 'Detailed drawings and fast replies. Great to work with.', author: 'Ops buyer', updatedAt: now() },
      { id: 'assoc-feedback-2', score: 4, comment: 'Solid BIM handoff � would hire again.', author: 'Studio lead', updatedAt: now() },
    ],
  },
  metrics: {

    profileCompleteness: 92,

    hourlyRate: 75,

    activeLeads: 3,

    applicationsTracked: 6,

    alerts: 1,

  },

  leads: [

    { id: 'lead-demo-1', title: 'Retail roll-out – NYC', status: 'proposal', contact: 'retail@demo.com', updatedAt: now() },

    { id: 'lead-demo-2', title: 'Hospital LOD upgrade', status: 'review', contact: 'studio@demo.com', updatedAt: now() },

  ],

  applications: [

    {

      id: 'app-demo-1',

      status: 'submitted',

      total: 6800,

      createdAt: now(),

      items: [{ title: 'Immersive Pavilion package' }],

    },

  ],

  nextActions: [

    {

      title: 'Upload a new case study',

      detail: 'Profiles with fresh work are highlighted in Skill Studio searches.',

    },

    {

      title: 'Refresh languages & software',

      detail: 'Keep your card searchable by the newest ops filters.',

    },

  ],

  availability: {

    timezone: 'UTC',

    note: 'Bookings open for April sprint work.',

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

    teamSize: 24,

    yearsActive: 11,

    primaryCategories: ['Residential', 'Hospitality', 'Workspace'],

    primaryStyles: ['Tropical modern', 'Minimalist'],

    averageDesignRate: '$18 / sqft',

    servicesOffered: ['Architecture', 'Interior', 'BIM delivery'],

    portfolioLink: 'https://builtattic.com/design-studio/demo',

  },

  profile: {

    updatedAt: now(),

  },

  metrics: {

    studiosPublished: 6,

    draftStudios: 2,

    publishedValue: 480000,

    documents: 9,

    recentOrders: 4,

  },

  studios: [

    {

      id: 'studio-demo-1',

      slug: 'demo-parametric-villa',

      title: 'Parametric Villa',

      status: 'published',

      price: 180000,

      currency: 'USD',

      updatedAt: now(),

      areaSqft: 2400,

      priceSqft: 240,

      categories: ['Residential', 'Villa'],

      style: 'Parametric',

      heroImage: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',

    },

    {

      id: 'studio-demo-2',

      slug: 'demo-hospitality-capsule',

      title: 'Hospitality Capsule',

      status: 'draft',

      price: 96000,

      currency: 'USD',

      updatedAt: now(),

      areaSqft: 980,

      priceSqft: 310,

      categories: ['Hospitality', 'Modular'],

      style: 'Modular minimal',

      heroImage: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',

    },

    {

      id: 'studio-demo-3',

      slug: 'cafca',

      title: 'Cafca Residence Lab',

      status: 'published',

      price: 125000,

      currency: 'USD',

      updatedAt: now(),

      areaSqft: 2100,

      priceSqft: 260,

      categories: ['Residential', 'Prototype'],

      style: 'Low-carbon contemporary',

      heroImage: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',

    },

  ],

  documents: [

    { id: 'doc-demo-1', filename: 'FF&E package.pdf', kind: 'Spec Sheet', createdAt: now() },

    { id: 'doc-demo-2', filename: 'Brand toolkit.zip', kind: 'Assets', createdAt: now() },

  ],

  orders: [

    { id: 'order-demo-1', status: 'processing', total: 220000, createdAt: now() },

    { id: 'order-demo-2', status: 'fulfilled', total: 110000, createdAt: now() },

  ],

  nextActions: [

    {

      title: 'Publish your modular studio bundle',

      detail: 'Studios with new media are rotated onto the Design Studio landing page.',

    },

    {

      title: 'Upload signed drawings',

      detail: 'Share the latest spec set so the compliance team can pre-approve.',

    },

  ],

};



export const VENDOR_DASHBOARD_FALLBACK = {

  fallbackLabel: 'Demo Material Studio data',

  firm: {

    name: 'Material Ops Collective',

  },

  profile: {

    updatedAt: now(),

  },

  metrics: {

    listedSkus: 12,

    inventoryCount: 1240,

    openOrders: 3,

    pipelineLeads: 4,

  },

  materials: [

    { id: 'mat-demo-1', title: 'Recycled Bamboo Panel', status: 'published', price: 48, currency: 'USD', updatedAt: now(), kind: 'Panel' },

    { id: 'mat-demo-2', title: 'Carbon-neutral Concrete', status: 'published', price: 92, currency: 'USD', updatedAt: now(), kind: 'Concrete' },

  ],

  orders: [

    {

      id: 'order-demo-v1',

      status: 'processing',

      total: 17500,

      createdAt: now(),

      items: [{ title: 'Bamboo Panel' }],

    },

    {

      id: 'order-demo-v2',

      status: 'fulfilled',

      total: 24000,

      createdAt: now(),

      items: [{ title: 'Concrete mix' }],

    },

  ],

  leads: [

    { id: 'lead-demo-v1', title: 'Airport retrofit', status: 'new', contact: 'ops@demo.com', updatedAt: now() },

    { id: 'lead-demo-v2', title: 'Hospital wing fit-out', status: 'follow-up', contact: 'project@demo.com', updatedAt: now() },

  ],

  nextActions: [

    {

      title: 'Publish MOQ for each SKU',

      detail: 'MOQ and logistics data unlock search filters inside Material Studio.',

    },

    {

      title: 'Respond to the airport retrofit lead',

      detail: 'The request expires in 3 days—reply to secure the slot.',

    },

  ],

};



export const DASHBOARD_FALLBACKS = {

  associate: ASSOCIATE_DASHBOARD_FALLBACK,

  firm: FIRM_DASHBOARD_FALLBACK,

  vendor: VENDOR_DASHBOARD_FALLBACK,

};



export default DASHBOARD_FALLBACKS;

