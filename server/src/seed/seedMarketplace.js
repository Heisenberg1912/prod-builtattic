import '../config/hardcodedEnv.js';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import User from '../models/User.js';
import Firm from '../models/Firm.js';
import Product from '../models/Product.js';
import AssociateProfile from '../models/AssociateProfile.js';
import Asset from '../models/Asset.js';

const USERS = [
  { email: 'superadmin@builtattic.com', password: 'Super#123', role: 'superadmin' },
  { email: 'admin@builtattic.com', password: 'Admin#123', role: 'admin' },
  { email: 'vendor@builtattic.com', password: 'Vendor#123', role: 'vendor' },
  { email: 'firm@builtattic.com', password: 'Firm#123', role: 'firm' },
  { email: 'associate@builtattic.com', password: 'Associate#123', role: 'associate' },
  { email: 'associate.eu@builtattic.com', password: 'Associate#123', role: 'associate' },
  { email: 'associate.apac@builtattic.com', password: 'Associate#123', role: 'associate' },
  { email: 'client@builtattic.com', password: 'Client#123', role: 'client' },
  { email: 'user@builtattic.com', password: 'User#123', role: 'user' },
];

const FIRMS = [
  {
    name: 'Lumen Atelier',
    slug: 'lumen-atelier',
    tagline: 'Modular coastal living systems built for sustainability.',
    description:
      'Lumen Atelier orchestrates modular living systems for coastal geographies with rapid deployment, passive cooling, and digitally-managed lifecycle maintenance.',
    category: 'Residential',
    styles: ['Modernism', 'Brutalism'],
    locations: ['San Diego, USA', 'Muscat, Oman'],
    priceSqft: 12.5,
    scope: ['Residential masterplans', 'Hospitality', 'Civic'],
    team: 42,
    projectsDelivered: 128,
    avgLeadTimeWeeks: 4,
    rating: 4.8,
    coverImage: '/assets/firms/lumen-cover.jpg',
    gallery: [
      '/assets/firms/lumen-01.jpg',
      '/assets/firms/lumen-02.jpg',
    ],
    services: [
      {
        title: 'Concept to IFC Delivery',
        description:
          'Full-stack design documentation bundles with BIM coordination, energy modelling, and procurement-ready schedules.',
        leadTimeWeeks: 8,
      },
      {
        title: 'Modular Housing Program',
        description:
          'Catalog-driven housing typologies optimised for coastal climate resilience with plug-and-play wet cores.',
        leadTimeWeeks: 6,
      },
    ],
    certifications: ['LEED AP', 'Living Building Challenge Partner'],
    partners: ['BuildMart Logistics', 'SolarSphere Systems'],
    testimonials: [
      {
        author: 'Alicia DeSouza',
        role: 'VP Development, Cove Residences',
        quote:
          'Lumen delivered a resilient housing catalog that went from concept to sales launch in 10 weeks. The prefab detailing saved 18% on change orders.',
      },
    ],
    contact: {
      email: 'studio@lumenatelier.com',
      phone: '+1 415 555 0123',
      website: 'https://lumenatelier.com',
      timezone: 'America/Los_Angeles',
      address: '210 Lightwave Ave, San Diego, CA 92101',
    },
  },
  {
    name: 'Gridline Collective',
    slug: 'gridline-collective',
    tagline: 'Data-led urban design for adaptive cities.',
    description:
      'Gridline Collective blends computational planning with climate analytics to deliver adaptive urban districts and agile retail podiums.',
    category: 'Mixed-Use',
    styles: ['International Style', 'Postmodern'],
    locations: ['Singapore', 'Dubai'],
    priceSqft: 18.4,
    scope: ['Transit-oriented developments', 'Retail', 'Corporate campuses'],
    team: 60,
    projectsDelivered: 210,
    avgLeadTimeWeeks: 6,
    rating: 4.9,
    coverImage: '/assets/firms/gridline-cover.jpg',
    gallery: [
      '/assets/firms/gridline-01.jpg',
      '/assets/firms/gridline-02.jpg',
    ],
    services: [
      {
        title: 'Transit Urbanism Toolkit',
        description:
          'GIS, ridership, and energy modelling suite to fast-track approvals for TOD precincts with net-zero ready podiums.',
        leadTimeWeeks: 10,
      },
      {
        title: 'Retail Podium Conversion',
        description:
          'Adaptive reuse playbooks for mall-to-mixed-use transformations with anchor tenant coordination.',
        leadTimeWeeks: 7,
      },
    ],
    certifications: ['BCA Green Mark Platinum Consultant'],
    partners: ['Metria Analytics', 'SunGrid Microgrids'],
    testimonials: [
      {
        author: 'Naveen Chandra',
        role: 'Director, Urban Redev Authority',
        quote:
          'Their analytics-first approach helped us unlock a 14% mobility gain and reduced soft costs through automated compliance packs.',
      },
    ],
    contact: {
      email: 'hello@gridline.co',
      phone: '+65 6235 2212',
      website: 'https://gridline.co',
      timezone: 'Asia/Singapore',
      address: '11 Marina Blvd, #20-01, Singapore 018939',
    },
  },
  {
    name: 'Atelier Oryza',
    slug: 'atelier-oryza',
    tagline: 'Low-carbon estates inspired by vernacular craft.',
    description:
      'Atelier Oryza fuses vernacular craft with parametric fabrication for climate-positive hospitality and premium villa estates.',
    category: 'Residential',
    styles: ['Neo-futurism', 'Minimalism'],
    locations: ['Lisbon, Portugal', 'Kerala, India'],
    priceSqft: 15.75,
    scope: ['Luxury villas', 'Resorts', 'Boutique hospitality'],
    team: 28,
    projectsDelivered: 76,
    avgLeadTimeWeeks: 5,
    rating: 4.7,
    coverImage: '/assets/firms/oryza-cover.jpg',
    gallery: [
      '/assets/firms/oryza-01.jpg',
      '/assets/firms/oryza-02.jpg',
    ],
    services: [
      {
        title: 'Eco Resort Charter',
        description:
          'Zero-carbon resort blueprint with passive cooling, water reuse, and modular FF&E packages.',
        leadTimeWeeks: 9,
      },
      {
        title: 'Luxury Villa Customisation',
        description:
          'Customisable villa shells with digital twins, concierge-ready fit-out packages, and remote project monitoring.',
        leadTimeWeeks: 6,
      },
    ],
    certifications: ['BREEAM Excellent', 'WELL AP'],
    partners: ['EcoTimber Labs', 'BlueLoop Water Systems'],
    testimonials: [
      {
        author: 'Francis Almeida',
        role: 'Founder, Azure Sanctuaries',
        quote:
          'Oryza’s climate-focused detailing helped us secure EU green financing and accelerated procurement cycles by 30%.',
      },
    ],
    contact: {
      email: 'contact@atelieroryza.com',
      phone: '+351 21 234 567',
      website: 'https://atelieroryza.com',
      timezone: 'Europe/Lisbon',
      address: 'Rua do Ouro 118, 1100-060 Lisboa, Portugal',
    },
  },
  {
    name: 'Aurelius Classical Atelier',
    slug: 'aurelius-classical',
    tagline: 'Stone-built residences inspired by Roman heritage.',
    description:
      'Aurelius Classical Atelier crafts monumental villas in carved stone with modern services hidden behind classical detailing.',
    category: 'Residential',
    styles: ['Classical'],
    locations: ['Rome, Italy', 'Nice, France'],
    priceSqft: 19.2,
    scope: ['Luxury villas', 'Urban palazzos', 'Estate masterplanning'],
    team: 38,
    projectsDelivered: 96,
    avgLeadTimeWeeks: 7,
    rating: 4.8,
    coverImage: 'https://images.unsplash.com/photo-1575517111478-7f6afd0973db?auto=format&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&w=1600',
      'https://images.unsplash.com/photo-1600585154340-0ef3c08dcdb6?auto=format&w=1600',
    ],
    services: [
      {
        title: 'Heritage Residence Kit',
        description:
          'Stone masonry shell with integrated climate control, BIM deliverables, and classical façade kits.',
        leadTimeWeeks: 10,
      },
      {
        title: 'Estate Regeneration Program',
        description:
          'Adaptive reuse of historical estates with hospitality-ready infrastructure and cultural approvals.',
        leadTimeWeeks: 14,
      },
    ],
    certifications: ['Europa Nostra', 'ISO 19650'],
    partners: ['Carrara Quarries Consortium', 'Lazio Engineering Labs'],
    testimonials: [
      {
        author: 'Giovanni Robles',
        role: 'Director, Villa Aurea Estates',
        quote:
          'Their mastery of stone allowed us to deliver 34 bespoke villas without compromising modern comfort.',
      },
    ],
    contact: {
      email: 'studio@aureliusclassical.com',
      phone: '+39 06 555 0123',
      website: 'https://aureliusclassical.com',
      timezone: 'Europe/Rome',
      address: 'Via dei Condotti 92, Rome, Italy',
    },
  },
  {
    name: 'Cathedral Works Guild',
    slug: 'cathedral-works',
    tagline: 'Gothic commercial landmarks with modern systems.',
    description:
      'Cathedral Works Guild engineers soaring commercial halls with pointed arches, structural brick, and adaptive services for retailers.',
    category: 'Commercial',
    styles: ['Gothic'],
    locations: ['Prague, Czech Republic', 'Vienna, Austria'],
    priceSqft: 24.6,
    scope: ['Retail flagships', 'Boutique hotels', 'Urban renewal'],
    team: 54,
    projectsDelivered: 148,
    avgLeadTimeWeeks: 9,
    rating: 4.7,
    coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1576085898329-95edb7f95bb4?auto=format&w=1600',
      'https://images.unsplash.com/photo-1505842465776-3acb7fc9288e?auto=format&w=1600',
    ],
    services: [
      {
        title: 'Retail Nave Package',
        description:
          'Brick and rib vault structural system with integrated lighting, signage, and tenant-fit BIM models.',
        leadTimeWeeks: 11,
      },
      {
        title: 'Gothic Hospitality Conversion',
        description:
          'Transforms industrial shells into gothic-themed hotels complete with MEP, acoustic, and life-safety documentation.',
        leadTimeWeeks: 12,
      },
    ],
    certifications: ['LEED Gold', 'ISO 9001'],
    partners: ['Moravian Brick Cooperative', 'Danube Lighting Systems'],
    testimonials: [
      {
        author: 'Sophia Keller',
        role: 'Head of Development, Helios Retail',
        quote:
          'The guild delivered a vaulted flagship that doubled footfall while maintaining historic character.',
      },
    ],
    contact: {
      email: 'projects@cathedralworks.eu',
      phone: '+420 241 005 320',
      website: 'https://cathedralworks.eu',
      timezone: 'Europe/Prague',
      address: 'Husova 21, Prague 1, Czech Republic',
    },
  },
  {
    name: 'Arcadia Leisure Lab',
    slug: 'arcadia-leisure',
    tagline: 'Renaissance-inspired recreational environments.',
    description:
      'Arcadia Leisure Lab creates immersive recreational destinations blending Renaissance geometry with contemporary amenities.',
    category: 'Recreational',
    styles: ['Renaissance'],
    locations: ['Seville, Spain', 'Orlando, USA'],
    priceSqft: 17.8,
    scope: ['Theme parks', 'Cultural plazas', 'Resort amenities'],
    team: 62,
    projectsDelivered: 204,
    avgLeadTimeWeeks: 8,
    rating: 4.9,
    coverImage: 'https://images.unsplash.com/photo-1529429617124-aee0a93d4432?auto=format&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1520350098754-1a834128b24b?auto=format&w=1600',
      'https://images.unsplash.com/photo-1512455102796-7f3c4bac7a95?auto=format&w=1600',
    ],
    services: [
      {
        title: 'Renaissance Water Plaza',
        description:
          'Prefabricated colonnades, fountains, and performance decks with integrated show control systems.',
        leadTimeWeeks: 10,
      },
      {
        title: 'Heritage Resort Amenity Pack',
        description:
          'Wellness and leisure modules with AR storytelling overlays and modular landscape zones.',
        leadTimeWeeks: 9,
      },
    ],
    certifications: ['ILAM Aquatic Safety', 'ASTM F24'],
    partners: ['Hydraform Pools', 'Aura Projection Design'],
    testimonials: [
      {
        author: 'Miguel Torres',
        role: 'Director, Palacio Del Sol Resorts',
        quote:
          'Arcadia delivered a Renaissance water plaza that increased dwell time and nightly event revenue by 22%.',
      },
    ],
    contact: {
      email: 'hello@arcadialeisure.com',
      phone: '+34 954 600 732',
      website: 'https://arcadialeisure.com',
      timezone: 'Europe/Madrid',
      address: 'Avenida de la Constitución 14, Seville, Spain',
    },
  },
  {
    name: 'Archivum Institute Partners',
    slug: 'archivum-institute',
    tagline: 'Steel-framed academic icons with ceremonial grandeur.',
    description:
      'Archivum Institute Partners specialises in institutional campuses with baroque-inspired atria and robust steel systems.',
    category: 'Institutional',
    styles: ['Baroque'],
    locations: ['Boston, USA', 'Zurich, Switzerland'],
    priceSqft: 21.5,
    scope: ['Universities', 'Research centres', 'Museums'],
    team: 71,
    projectsDelivered: 122,
    avgLeadTimeWeeks: 11,
    rating: 4.6,
    coverImage: 'https://images.unsplash.com/photo-1467757002533-947bfcfba0a0?auto=format&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1468636138210-8504d934f0b5?auto=format&w=1600',
      'https://images.unsplash.com/photo-1533749047139-189de3cf07e8?auto=format&w=1600',
    ],
    services: [
      {
        title: 'Signature Atrium Package',
        description:
          'Steel and glass atrium structures with ceremonial staircases, acoustics, and exhibition lighting plans.',
        leadTimeWeeks: 14,
      },
      {
        title: 'Campus Heritage Upgrade',
        description:
          'Seismic and accessibility upgrading for legacy academic halls with occupant phasing strategies.',
        leadTimeWeeks: 16,
      },
    ],
    certifications: ['LEED Platinum', 'ISO 38200'],
    partners: ['Helix Steel Consortium', 'Luminaire Systems'],
    testimonials: [
      {
        author: 'Dr. Evelyn Richter',
        role: 'Provost, Helios University',
        quote:
          'They delivered a ceremonial atrium that doubled exhibition capacity while staying within our academic calendar.',
      },
    ],
    contact: {
      email: 'projects@archivuminstitute.com',
      phone: '+1 617 420 8801',
      website: 'https://archivuminstitute.com',
      timezone: 'America/New_York',
      address: '77 Beacon Street, Boston, MA 02108',
    },
  },
  {
    name: 'Transverse Neoclassica',
    slug: 'transverse-neoclassica',
    tagline: 'Glass infrastructural hubs with civic gravitas.',
    description:
      'Transverse Neoclassica engineers transport interchanges with sweeping neoclassical forms and high-performance glazing.',
    category: 'Infrastructural',
    styles: ['Neoclassical'],
    locations: ['Doha, Qatar', 'Warsaw, Poland'],
    priceSqft: 26.4,
    scope: ['Transport hubs', 'Civic concourses', 'Mobility masterplans'],
    team: 58,
    projectsDelivered: 89,
    avgLeadTimeWeeks: 12,
    rating: 4.8,
    coverImage: 'https://images.unsplash.com/photo-1505843490538-51312b3d605d?auto=format&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&w=1600',
      'https://images.unsplash.com/photo-1464036388609-747537735d23?auto=format&w=1600',
    ],
    services: [
      {
        title: 'Transit Concourse System',
        description:
          'Glazed concourse modules with passenger flow analytics, MEP coordination, and retail plug-ins.',
        leadTimeWeeks: 15,
      },
      {
        title: 'Adaptive Mobility Masterplan',
        description:
          'Data-driven transport masterplanning with multimodal hubs, BIM, and stakeholder facilitation.',
        leadTimeWeeks: 20,
      },
    ],
    certifications: ['EN 1090', 'LEED for Transit'],
    partners: ['GlasLab Facades', 'FlowSense Analytics'],
    testimonials: [
      {
        author: 'Karol Majka',
        role: 'Director, Warsaw Mobility Agency',
        quote:
          'The concourse system lifted throughput by 18% while delivering a civic presence our city demanded.',
      },
    ],
    contact: {
      email: 'contact@transverseneo.com',
      phone: '+48 22 200 4720',
      website: 'https://transverseneo.com',
      timezone: 'Europe/Warsaw',
      address: 'Plac Trzech Krzyży 3, Warsaw, Poland',
    },
  },
  {
    name: 'Verdant Grain Cooperative',
    slug: 'verdant-grain',
    tagline: 'Victorian agricultural campuses rooted in timber craft.',
    description:
      'Verdant Grain Cooperative designs regenerative agricultural campuses with Victorian detailing and heavy timber structures.',
    category: 'Agricultural',
    styles: ['Victorian'],
    locations: ['Canterbury, UK', 'Canberra, Australia'],
    priceSqft: 13.6,
    scope: ['Agri-tech campuses', 'Food processing halls', 'Visitor centres'],
    team: 44,
    projectsDelivered: 132,
    avgLeadTimeWeeks: 8,
    rating: 4.7,
    coverImage: 'https://images.unsplash.com/photo-1505842465776-3acb7fc9288e?auto=format&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&w=1600',
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&w=1600',
    ],
    services: [
      {
        title: 'Agri Innovation Barn Kit',
        description:
          'Mass timber barn structures with daylighting, environmental controls, and agri-tech integration.',
        leadTimeWeeks: 9,
      },
      {
        title: 'Farmgate Visitor Centre',
        description:
          'Victorian-inspired tasting halls with modular exhibits, retail, and farm-to-table kitchens.',
        leadTimeWeeks: 10,
      },
    ],
    certifications: ['FSC Chain-of-Custody', 'BREEAM Very Good'],
    partners: ['GreenSpan Timber', 'Harvest IoT Systems'],
    testimonials: [
      {
        author: 'Claire Donnelly',
        role: 'Director, Canterbury AgriTech',
        quote:
          'Their timber barn kit gave us a carbon-smart hub that doubled public engagement and processing efficiency.',
      },
    ],
    contact: {
      email: 'hello@verdantgrain.coop',
      phone: '+44 1227 555 921',
      website: 'https://verdantgrain.coop',
      timezone: 'Europe/London',
      address: '8 Sun Street, Canterbury CT1 2HX, UK',
    },
  },
];

const STUDIO_PRODUCTS = [
  {
    title: 'Skyline Loft Residences',
    slug: 'skyline-loft-residences',
    firmSlug: 'lumen-atelier',
    kind: 'studio',
    description: 'Open-plan loft typologies tuned for coastal climates.',
    summary:
      'Sculpted concrete and expansive glazing with modular interiors ideal for fast-track residential developments.',
    heroImage: '/src/assets/studio/california_villa.avif',
    gallery: [
      '/src/assets/studio/california_villa.avif',
      '/src/assets/studio/mansion.avif',
      '/src/assets/studio/apartment.avif',
    ],
    priceSqft: 12.5,
    currency: 'USD',
    status: 'published',
    style: 'Modernism',
    pricing: {
      unit: 'sq.ft',
      unitLabel: 'Per sq.ft',
      currency: 'USD',
      basePrice: 12.5,
      minQuantity: 1000,
      tierPricing: [
        { min: 1000, max: 2500, price: 12.5 },
        { min: 2501, max: 5000, price: 11.75 },
      ],
    },
    categories: ['Residential', 'Modernism'],
    tags: ['prefab', 'mid-rise', 'coastal'],
    highlights: [
      'Parametric shell optimized for coastal climates',
      'Plug-and-play kitchen and wet-core services',
      'Net-zero ready envelope with BIM kit',
    ],
    specs: [
      { label: 'GFA', value: '1,200 - 2,400', unit: 'sq.ft' },
      { label: 'Structure', value: 'RC Frame + CLT Panels' },
      { label: 'Energy', value: 'Net-zero ready' },
    ],
    assets: [
      {
        key: 'studios/skyline-loft/lookbook.pdf',
        filename: 'Skyline-Loft-Lookbook.pdf',
        mimeType: 'application/pdf',
        kind: 'marketing',
        secure: false,
      },
      {
        key: 'studios/skyline-loft/sample-bim.ifc',
        filename: 'Skyline-Loft-Sample-IFC.ifc',
        mimeType: 'application/octet-stream',
        kind: 'preview',
      },
        {
          key: 'studios/skyline-loft/full-pack.zip',
          filename: 'Skyline-Loft-Pack.zip',
          mimeType: 'application/zip',
          kind: 'deliverable',
          secure: true,
        },
    ],
    delivery: {
      leadTimeWeeks: 4,
      fulfilmentType: 'digital',
      handoverMethod: 'download',
      includesInstallation: false,
      items: ['IFC drawings', 'Revit model', 'Render pack'],
      instructions: 'Deliverables shared via secure download within 24 hours of payment confirmation.',
    },
    location: { city: 'San Diego', country: 'United States', timezone: 'America/Los_Angeles' },
  },
  {
    title: 'Terraced Courtyard Villa',
    slug: 'terraced-courtyard-villa',
    firmSlug: 'atelier-oryza',
    kind: 'studio',
    description: 'Layered terraces with passive ventilation and water harvesting.',
    summary:
      'Sunken courtyards and cascading terraces tuned for Mediterranean climates using cross-laminated timber.',
    heroImage: '/src/assets/studio/newyork_suburban.avif',
    gallery: [
      '/src/assets/studio/newyork_suburban.avif',
      '/src/assets/studio/carolina_abbey.avif',
    ],
    priceSqft: 15.75,
    currency: 'USD',
    status: 'published',
    style: 'Neo-futurism',
    pricing: {
      unit: 'sq.ft',
      unitLabel: 'Per sq.ft',
      currency: 'USD',
      basePrice: 15.75,
      minQuantity: 2000,
      tierPricing: [
        { min: 2000, max: 4000, price: 15.75 },
        { min: 4001, max: 6500, price: 14.9 },
      ],
    },
    categories: ['Residential'],
    tags: ['luxury', 'sustainable'],
    highlights: [
      'Rainwater harvesting integrated into landscape',
      'CLT primary structure with BIM fabrication set',
      'Flexible wings for home-office or studio suites',
    ],
    specs: [
      { label: 'GFA', value: '1,800 - 3,200', unit: 'sq.ft' },
      { label: 'Structure', value: 'Cross Laminated Timber' },
      { label: 'Sustainability', value: 'Passive ventilation + rainwater reuse' },
    ],
    assets: [
      {
        key: 'studios/terraced-villa/lookbook.pdf',
        filename: 'Terraced-Villa-Lookbook.pdf',
        mimeType: 'application/pdf',
        kind: 'marketing',
        secure: false,
      },
      {
        key: 'studios/terraced-villa/sample-schedule.xlsx',
        filename: 'Terraced-Villa-FFE.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        kind: 'preview',
        secure: false,
      },
      {
        key: 'studios/terraced-villa/full-pack.zip',
        filename: 'Terraced-Villa-Pack.zip',
        mimeType: 'application/zip',
        kind: 'deliverable',
        secure: true,
      },
    ],
    delivery: {
      leadTimeWeeks: 5,
      fulfilmentType: 'digital',
      handoverMethod: 'download',
      includesInstallation: false,
      items: ['Fabrication set', 'Lumion renders', 'FF&E schedule'],
      instructions: 'FF&E schedule and models issued through secure workspace within 24 hours of payment.',
    },
    location: { city: 'Lisbon', country: 'Portugal', timezone: 'Europe/Lisbon' },
  },
  {
    title: 'Urban Mixed-Use Podium',
    slug: 'urban-mixed-use-podium',
    firmSlug: 'gridline-collective',
    kind: 'studio',
    description: 'Retail podium with co-working tower engineered for tropical density.',
    summary:
      'Retail podium with co-working tower and landscaped decks engineered for tropical high-density parcels.',
    heroImage:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&auto=format',
    ],
    priceSqft: 18.4,
    currency: 'USD',
    status: 'published',
    style: 'International Style',
    pricing: {
      unit: 'sq.ft',
      unitLabel: 'Per sq.ft (GFA)',
      currency: 'USD',
      basePrice: 18.4,
      minQuantity: 45000,
      tierPricing: [
        { min: 45000, max: 60000, price: 18.4 },
        { min: 60001, max: 90000, price: 17.8 },
      ],
    },
    categories: ['Mixed-Use', 'Commercial'],
    tags: ['retail', 'cowork', 'podium-tower'],
    highlights: [
      'MEP coordination pack with clash-free BIM',
      'Occupancy analytics for retail circulation',
      'GreenMark Platinum envelope detailing',
    ],
    specs: [
      { label: 'Built-up area', value: '45,000 - 88,000', unit: 'sq.ft' },
      { label: 'Use mix', value: 'Retail podium + Office tower' },
      { label: 'Compliance', value: 'BCA GreenMark Platinum ready' },
    ],
    assets: [
      {
        key: 'studios/urban-hub/tenancy-guide.pdf',
        filename: 'Urban-Hub-Tenancy-Guide.pdf',
        mimeType: 'application/pdf',
        kind: 'spec',
        secure: true,
      },
      {
        key: 'studios/urban-hub/stacking-plan.png',
        filename: 'Urban-Hub-Stacking-Plan.png',
        mimeType: 'image/png',
        kind: 'preview',
        secure: false,
      },
      {
        key: 'studios/urban-hub/full-pack.zip',
        filename: 'Urban-Hub-Delivery-Pack.zip',
        mimeType: 'application/zip',
        kind: 'deliverable',
        secure: true,
      },
    ],
    delivery: {
      leadTimeWeeks: 6,
      fulfilmentType: 'hybrid',
      handoverMethod: 'download',
      includesInstallation: true,
      items: ['BIM LOD 300 model', 'Lease plans', 'Tenant guide'],
      instructions: 'Dedicated success manager schedules tenancy alignment workshops within 72 hours of purchase.',
    },
    location: { city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  },
];

const MATERIAL_PRODUCTS = [
  {
    title: 'UltraTech OPC 53 Grade Cement',
    slug: 'ultratech-opc-53',
    firmSlug: 'gridline-collective',
    kind: 'material',
    description: 'High-strength OPC cement compliant with IS 12269.',
    heroImage: '/src/assets/warehouse/ultratech_cement.webp',
    price: 325,
    currency: 'INR',
    status: 'published',
    pricing: {
      unit: 'bag',
      unitLabel: 'Per 50kg bag',
      currency: 'INR',
      basePrice: 325,
      minQuantity: 50,
    },
    categories: ['Cement'],
    tags: ['structure', 'ready-stock'],
    highlights: ['Shelf life 3 months', 'Packed in 50kg bags'],
    specs: [
      { label: 'Grade', value: 'OPC 53' },
      { label: 'Packaging', value: '50kg moisture-proof bag' },
      { label: 'Compliance', value: 'IS 12269' },
    ],
    assets: [
      {
        key: 'materials/cement/ultratech-datasheet.pdf',
        filename: 'UltraTech-OPC53-Datasheet.pdf',
        mimeType: 'application/pdf',
        kind: 'spec',
        secure: false,
      },
    ],
    delivery: {
      leadTimeWeeks: 1,
      fulfilmentType: 'logistics',
      handoverMethod: 'courier',
      includesInstallation: false,
      items: ['Consignment tracking', 'QA certificates', 'Batch testing reports'],
      instructions: 'Delivery slots confirmed within 12 hours. Upload unloading instructions via the order workspace.',
    },
    location: { city: 'Navi Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
    metafields: {
      unit: 'bag',
      leadTimeDays: 3,
      moq: 50,
      vendor: 'BuildMart Logistics',
      location: 'Navi Mumbai, India',
    },
  },
  {
    title: 'Fe 500D TMT Rebars',
    slug: 'fe500d-tmt-rebars',
    firmSlug: 'gridline-collective',
    kind: 'material',
    description: 'High ductility TMT bars supplied in 12m lengths.',
    heroImage: '/src/assets/warehouse/tmt_steelbar.jpeg',
    price: 58,
    currency: 'INR',
    status: 'published',
    pricing: {
      unit: 'kg',
      unitLabel: 'Per kg',
      currency: 'INR',
      basePrice: 58,
      minQuantity: 2000,
    },
    categories: ['Steel'],
    tags: ['structure', 'isi-certified'],
    highlights: ['Available in 8mm-32mm dia', 'Includes mill certificates'],
    specs: [
      { label: 'Diameter Range', value: '8mm - 32mm' },
      { label: 'Length', value: '12m standard' },
      { label: 'Compliance', value: 'ISI / IS 1786:2008' },
    ],
    assets: [
      {
        key: 'materials/steel/fe500d-millcert.pdf',
        filename: 'Fe500D-Mill-Certificate.pdf',
        mimeType: 'application/pdf',
        kind: 'spec',
        secure: true,
      },
    ],
    delivery: {
      leadTimeWeeks: 1,
      fulfilmentType: 'logistics',
      handoverMethod: 'courier',
      includesInstallation: false,
      items: ['Dispatch tracking', 'QA certificate bundle'],
      instructions: 'Bundle strapped and dispatched with crane-offload support available on request.',
    },
    location: { city: 'Vizag', country: 'India', timezone: 'Asia/Kolkata' },
    metafields: {
      unit: 'kg',
      leadTimeDays: 7,
      moq: 2000,
      vendor: 'SteelMart Asia',
      location: 'Vizag, India',
    },
  },
  {
    title: 'Matte Laminate Flooring',
    slug: 'matte-laminate-flooring',
    firmSlug: 'gridline-collective',
    kind: 'material',
    description: 'Matte laminate flooring with AC4 abrasion rating.',
    heroImage: 'https://images.unsplash.com/photo-1616628182508-7f5d4ec17993?w=1200&auto=format',
    price: 540,
    currency: 'INR',
    status: 'published',
    pricing: {
      unit: 'sq.m',
      unitLabel: 'Per sq.m',
      currency: 'INR',
      basePrice: 540,
      minQuantity: 200,
    },
    categories: ['Finishes'],
    tags: ['flooring', 'interiors'],
    highlights: ['Includes underlay', '10-year manufacturer warranty'],
    specs: [
      { label: 'Abrasion Rating', value: 'AC4' },
      { label: 'Thickness', value: '10mm' },
      { label: 'Warranty', value: '10 years' },
    ],
    assets: [
      {
        key: 'materials/laminate/flooring-swatches.pdf',
        filename: 'Laminate-Flooring-Swatches.pdf',
        mimeType: 'application/pdf',
        kind: 'marketing',
        secure: false,
      },
    ],
    delivery: {
      leadTimeWeeks: 2,
      fulfilmentType: 'logistics',
      handoverMethod: 'courier',
      includesInstallation: false,
      items: ['Underlay rolls', 'Installation guide'],
      instructions: 'Ships on pallets with moisture barrier packaging. Schedule receiving dock before dispatch.',
    },
    location: { city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
    metafields: {
      unit: 'sq.m',
      leadTimeDays: 10,
      moq: 200,
      vendor: 'FloorHub Studios',
      location: 'Kuala Lumpur, Malaysia',
    },
  },
];

const ASSOCIATE_PROFILES = [
    {
      email: 'associate@builtattic.com',
      profile: {
        title: 'BIM Coordinator',
        location: 'Bengaluru, India',
        hourlyRate: 40,
        rates: { hourly: 40, daily: 320, currency: 'USD' },
        availability: 'Full-time contract',
        availabilityWindows: [
          { day: 'mon', from: '09:00', to: '18:00' },
          { day: 'tue', from: '09:00', to: '18:00' },
          { day: 'wed', from: '09:00', to: '18:00' },
          { day: 'thu', from: '09:00', to: '18:00' },
          { day: 'fri', from: '09:00', to: '16:00' },
        ],
        timezone: 'Asia/Kolkata',
        experienceYears: 5,
        specialisations: ['LOD 400 modelling', 'MEP coordination'],
        softwares: ['Revit', 'Navisworks', 'Dynamo'],
        languages: ['English', 'Hindi'],
        completedProjects: 52,
        rating: 4.7,
        avatar: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format',
        summary:
          'Experienced BIM coordinator specialising in complex mixed-use developments and clash detection.',
        certifications: ['Autodesk Certified Professional (Revit)', 'BIM Level 2 Practitioner'],
        portfolioLinks: [
          'https://portfolio.builtattic.com/rahul-iyer-casefiles',
          'https://www.linkedin.com/in/rahul-iyer-bim',
        ],
        keyProjects: [
          {
            title: 'Azure Marina Mixed-Use',
            scope: 'LOD 350 modelling + coordination',
            year: 2023,
            role: 'BIM Lead',
          },
          {
            title: 'Transit Hub Redevelopment',
            scope: 'MEP clash detection + federated BIM',
            year: 2024,
            role: 'Coordination Specialist',
          },
        ],
      },
    },
    {
      email: 'associate.eu@builtattic.com',
      profile: {
        title: 'Computational Designer',
        location: 'Barcelona, Spain',
        hourlyRate: 65,
        rates: { hourly: 65, daily: 520, currency: 'EUR' },
        availability: '15 hrs / week',
        availabilityWindows: [
          { day: 'mon', from: '10:00', to: '14:00' },
          { day: 'wed', from: '10:00', to: '18:00' },
          { day: 'fri', from: '09:00', to: '15:00' },
        ],
        timezone: 'Europe/Madrid',
        experienceYears: 4,
        specialisations: ['Parametric facades', 'Scripting', 'Visualization'],
        softwares: ['Rhino', 'Grasshopper', 'Revit', '3ds Max'],
        languages: ['English', 'Spanish'],
        completedProjects: 38,
        rating: 4.9,
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format',
        summary:
          'Computational designer building complex facade systems and high-impact visualisation assets.',
        certifications: ['McNeel Authorized Grasshopper Specialist'],
        portfolioLinks: [
          'https://parametric.studio/laia',
          'https://www.behance.net/laiacodes',
        ],
        keyProjects: [
          {
            title: 'Helix Pavilion',
            scope: 'Parametric facade scripting + fabrication files',
            year: 2022,
            role: 'Lead Designer',
          },
          {
            title: 'Aurora Tower Visualisation',
            scope: 'AR + realtime viz pipelines',
            year: 2024,
            role: 'Visualization Lead',
          },
        ],
      },
    },
    {
      email: 'associate.apac@builtattic.com',
      profile: {
        title: 'Sustainability Analyst',
        location: 'Singapore',
        hourlyRate: 72,
        rates: { hourly: 72, daily: 540, currency: 'SGD' },
        availability: 'Project-based',
        availabilityWindows: [
          { day: 'tue', from: '13:00', to: '19:00' },
          { day: 'thu', from: '09:00', to: '17:00' },
        ],
        timezone: 'Asia/Singapore',
        experienceYears: 6,
        specialisations: ['Energy modelling', 'LEED documentation'],
        softwares: ['Ladybug', 'Sefaira', 'IES VE'],
        languages: ['English', 'Mandarin'],
        completedProjects: 44,
        rating: 4.8,
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&auto=format',
        summary:
          'Performs daylighting, ventilation, and energy simulations with actionable recommendations.',
        certifications: ['LEED AP BD+C', 'WELL AP'],
        portfolioLinks: [
          'https://sustainability.buildattic.com/lin-zhang',
        ],
        keyProjects: [
          {
            title: 'Harbourfront Innovation Hub',
            scope: 'Energy + daylight optimisation',
            year: 2023,
            role: 'Lead Analyst',
          },
          {
            title: 'Skyline Residences Retrofit',
            scope: 'LEED Gold submission package',
            year: 2024,
            role: 'Sustainability Consultant',
          },
        ],
      },
    },
];

async function seed() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DBNAME || 'builtattic_dev';

  if (!uri) {
    console.error('❌ Missing MONGO_URI in environment.');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName });
  console.log(`Connected to MongoDB (${dbName})`);

  try {
    await User.syncIndexes?.();
    await Firm.syncIndexes?.();
    await Product.syncIndexes?.();
    await AssociateProfile.syncIndexes?.();

    // Clear existing seed data (safe guard by slug/email)
    const emails = USERS.map((u) => u.email);
    await User.deleteMany({ email: { $in: emails } });

    const firmSlugs = FIRMS.map((f) => f.slug);
    await Firm.deleteMany({ slug: { $in: firmSlugs } });

    const productSlugs = [...STUDIO_PRODUCTS, ...MATERIAL_PRODUCTS].map((p) => p.slug);
    await Product.deleteMany({ slug: { $in: productSlugs } });

    await AssociateProfile.deleteMany({});

    const createdUsers = [];
    for (const user of USERS) {
      const passHash = await argon2.hash(user.password);
      const rolesGlobal = [];
      if (user.role === 'superadmin') rolesGlobal.push('superadmin');
      if (user.role === 'admin') rolesGlobal.push('admin');
      const doc = await User.create({
        email: user.email,
        passHash,
        role: user.role,
        rolesGlobal,
        memberships: [],
        isClient: user.role === 'client'
      });
      createdUsers.push(doc);
    }
    console.log(`Seeded ${createdUsers.length} users.`);

    const vendorUser = createdUsers.find((u) => u.email === 'vendor@builtattic.com');
    const firmAdminUser = createdUsers.find((u) => u.email === 'firm@builtattic.com');
    if (!vendorUser) throw new Error('Vendor user missing after seed.');

    const createdFirms = {};
    for (const [index, firm] of FIRMS.entries()) {
      const ownerUserId =
        index === 0 && vendorUser
          ? vendorUser._id
          : firmAdminUser
          ? firmAdminUser._id
          : vendorUser._id;
      const doc = await Firm.create({
        ...firm,
        ownerUserId,
        approved: true,
      });
      createdFirms[firm.slug] = doc;
    }
    console.log(`Seeded ${Object.keys(createdFirms).length} firms.`);

    if (vendorUser) {
      await User.updateOne(
        { _id: vendorUser._id },
        {
          $set: {
            memberships: [
              {
                firm: Object.values(createdFirms)[0]?._id,
                role: 'owner',
                title: 'Vendor Owner',
              },
            ],
          },
        }
      );
    }

    if (firmAdminUser) {
      await User.updateOne(
        { _id: firmAdminUser._id },
        {
          $set: {
            memberships: [{
              firm: Object.values(createdFirms)[1]?._id,
              role: 'admin',
              title: 'Firm Admin',
            }]
          }
        }
      );
    }

    for (const associate of ASSOCIATE_PROFILES) {
      const user = createdUsers.find((u) => u.email === associate.email);
      if (!user) continue;
      await AssociateProfile.create({ user: user._id, ...associate.profile });
    }

    let seededProducts = 0;
    const featuredByFirm = new Map();

    for (const product of STUDIO_PRODUCTS) {
      const targetFirm =
        createdFirms[product.firmSlug] || Object.values(createdFirms)[0];
      const doc = await Product.create({
        ...product,
        firm: targetFirm?._id,
        price: product.priceSqft ?? product.pricing?.basePrice ?? product.price ?? 0,
        inventory: 0,
      });
      if (Array.isArray(product.assets) && product.assets.length) {
        for (const asset of product.assets) {
          await Asset.updateOne(
            { key: asset.key },
            {
              $set: {
                originalName: asset.filename,
                mimeType: asset.mimeType,
                sizeBytes: asset.sizeBytes || 0,
                storageProvider: asset.secure ? 'local' : 'remote',
                storagePath: asset.secure ? null : `https://cdn.builtattic.dev/${asset.key}`,
                secure: asset.secure ?? asset.kind === 'deliverable',
                algorithm: 'aes-256-gcm',
                product: doc._id,
                kind: asset.kind || 'preview',
                status: asset.kind === 'deliverable' ? 'ready' : 'uploaded',
                metadata: { seeded: true },
              },
            },
            { upsert: true }
          );
        }
      }
      if (targetFirm && product.firmSlug) {
        const current = featuredByFirm.get(product.firmSlug) || [];
        current.push(doc._id);
        featuredByFirm.set(product.firmSlug, current);
      }
      seededProducts += 1;
    }

    for (const product of MATERIAL_PRODUCTS) {
      const targetFirm =
        createdFirms[product.firmSlug] || Object.values(createdFirms)[0];
      const doc = await Product.create({
        ...product,
        firm: targetFirm?._id,
        price: product.price ?? product.pricing?.basePrice ?? product.priceSqft ?? 0,
        inventory: product.metafields?.moq || 0,
      });
      if (Array.isArray(product.assets) && product.assets.length) {
        for (const asset of product.assets) {
          await Asset.updateOne(
            { key: asset.key },
            {
              $set: {
                originalName: asset.filename,
                mimeType: asset.mimeType,
                sizeBytes: asset.sizeBytes || 0,
                storageProvider: asset.secure ? 'local' : 'remote',
                storagePath: asset.secure ? null : `https://cdn.builtattic.dev/${asset.key}`,
                secure: asset.secure ?? asset.kind === 'deliverable',
                algorithm: 'aes-256-gcm',
                product: doc._id,
                kind: asset.kind || 'preview',
                status: asset.kind === 'deliverable' ? 'ready' : 'uploaded',
                metadata: { seeded: true },
              },
            },
            { upsert: true }
          );
        }
      }
      seededProducts += 1;
    }

    await Promise.all(
      Object.entries(createdFirms).map(([slug, firmDoc]) => {
        const featured = featuredByFirm.get(slug) || [];
        return Firm.updateOne(
          { _id: firmDoc._id },
          { $set: { featuredStudios: featured } }
        );
      })
    );

    console.log(`Seeded ${seededProducts} products.`);

    console.log('\n✅ Marketplace seed complete.');
    console.log('    Super Admin   : superadmin@builtattic.com / Super#123');
    console.log('    Admin login   : admin@builtattic.com / Admin#123');
    console.log('    Vendor login  : vendor@builtattic.com / Vendor#123');
    console.log('    Firm admin    : firm@builtattic.com / Firm#123');
    console.log('    Associate     : associate@builtattic.com / Associate#123');
    console.log('    Client login  : client@builtattic.com / Client#123');
    console.log('    User login    : user@builtattic.com / User#123');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();

