const now = () => new Date().toISOString();

const demoStudios = [
  {
    _id: 'studio-demo-1',
    slug: 'demo-parametric-villa',
    title: 'Parametric Villa',
    summary: 'Off-site fabricated villa kit optimised for tropical hospitality sites.',
    description:
      'A premium three-bedroom layout that ships as a parametric kit-of-parts. Includes passive shading screens, pre-integrated MEP racks, and a commissioning playbook so your site team can stand up the show unit inside 12 weeks.',
    story:
      'Demo Design Collective built the Parametric Villa series for resorts who need branded villas at speed. The envelope flexes to metering, but the core kit stays consistent, giving you predictable QS packages across regions.',
    status: 'published',
    heroImage: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
    ],
    price: 180000,
    currency: 'USD',
    priceSqft: 240,
    areaSqft: 2400,
    plotAreaSqft: 5200,
    categories: ['Residential', 'Resort'],
    styles: ['Parametric', 'Tropical modern'],
    tags: ['Turnkey', 'Rapid deploy', 'Passive cooling'],
    features: ['3 ensuite bedrooms', 'Double-height lounge', 'Integrated smart HVAC'],
    amenities: ['Infinity plunge pool', 'Rooftop deck', 'Solar array'],
    specs: [
      { label: 'Bedrooms', value: '3' },
      { label: 'Bathrooms', value: '3.5' },
      { label: 'Floor plates', value: '2' },
    ],
    firm: {
      _id: 'firm-portal-demo',
      slug: 'demo-design-collective',
      name: 'Demo Design Collective',
      tagline: 'Concepts, specs, and delivery playbooks.',
      contactEmail: 'studios@builtattic.com',
      location: { city: 'Dubai', country: 'UAE' },
      services: ['Architecture', 'Interior', 'Fabrication'],
      styles: ['Tropical modern', 'Brut minimalist'],
      bio: 'Sample studio profile that appears when the Design Studio API is offline.',
    },
    hosting: {
      serviceSummary: 'Programs you can activate immediately.',
      services: [
        { title: 'Concept + DD package', description: 'Full BIM + spec book to LOD 300.', highlight: '4 weeks' },
        { title: 'Fabrication kit', description: 'Coordinated shop drawings + vendor introductions.', highlight: '6 weeks' },
      ],
      products: [
        { title: 'Lifestyle FF&E pack', description: 'Curated furniture + lighting set ready for procurement.' },
      ],
    },
    updatedAt: now(),
  },
  {
    _id: 'studio-demo-2',
    slug: 'demo-hospitality-capsule',
    title: 'Hospitality Capsule',
    summary: 'Compact guest suites for resorts, co-living, and remote work retreats.',
    description:
      'Prefabricated suite cores that arrive complete with bathrooms, casework, and MEP backbone. Stackable and designed to plug into modular circulation spines.',
    status: 'draft',
    heroImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    ],
    price: 96000,
    currency: 'USD',
    priceSqft: 310,
    areaSqft: 980,
    categories: ['Hospitality', 'Modular'],
    styles: ['Minimal', 'Smart suite'],
    tags: ['Stackable', 'Plug-and-play'],
    features: ['Integrated smart glass', 'Ambient lighting scenes'],
    amenities: ['Wellness shower', 'Acoustic wall panels'],
    specs: [
      { label: 'Suite type', value: 'King + lounge' },
      { label: 'Module width', value: '4.2 m' },
    ],
    firm: {
      _id: 'firm-portal-demo',
      slug: 'demo-design-collective',
      name: 'Demo Design Collective',
    },
    hosting: {
      serviceSummary: 'Activate modules + operating playbooks.',
      services: [
        { title: 'Suites deployment plan', description: 'Site-fit, logistics, and commissioning supervision.' },
      ],
      products: [
        { title: 'Capsule FF&E kit', description: 'Loose furniture & finishes to match the render set.' },
      ],
    },
    updatedAt: now(),
  },
  {
    _id: 'studio-demo-3',
    slug: 'tushar-studio-cafca',
    title: 'Cafca Residence Lab',
    summary: 'Published sample listing so the /studio/cafca route renders even when the API is offline.',
    description:
      'A lightweight fallback entry that mirrors what a real listing would expose. Replace this with live data once the Design Studio API is wired up.',
    status: 'published',
    heroImage: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
    ],
    price: 125000,
    currency: 'USD',
    priceSqft: 260,
    areaSqft: 2100,
    categories: ['Residential', 'Prototype'],
    styles: ['Contemporary', 'Low-carbon'],
    tags: ['Live-work', 'Modular shell'],
    features: ['Adaptive plan core', 'Integrated services spine'],
    amenities: ['Roof deck', 'Biophilic atrium'],
    specs: [
      { label: 'Bedrooms', value: '4' },
      { label: 'Bathrooms', value: '3' },
      { label: 'Structure', value: 'Cross-laminated timber' },
    ],
    firm: {
      _id: 'firm-portal-demo',
      slug: 'demo-design-collective',
      name: 'Demo Design Collective',
      bio: 'Demo firm profile used for offline previews.',
    },
    hosting: {
      serviceSummary: 'Programs you can activate instantly.',
      services: [
        { title: 'Cafca concept kit', description: 'Narrative, hero renders, and schematic plans.' },
        { title: 'Delivery sprint', description: '90-day DD + vendor onboarding package.' },
      ],
      products: [
        { title: 'Material moodboard', description: 'Finish schedule + alternates ready for procurement.' },
      ],
    },
    updatedAt: now(),
  },
];

export const marketplaceFeatures = [];
export const fallbackStudios = demoStudios;
export const fallbackMaterials = [];
export const fallbackFirms = [];
export const fallbackAssociates = [];
