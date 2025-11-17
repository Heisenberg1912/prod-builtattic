import { createWeb3Proof, summariseProofs } from "../services/web3ProofService.js";

const now = () => new Date().toISOString();
const normalise = (value) => String(value ?? "").trim().toLowerCase();

const FALLBACK_STUDIOS = [
  {
    _id: "studio-demo-1",
    slug: "demo-parametric-villa",
    title: "Parametric Villa",
    summary: "Off-site fabricated villa kit optimised for tropical hospitality sites.",
    description:
      "A premium three-bedroom layout that ships as a parametric kit-of-parts. Includes passive shading screens, pre-integrated MEP racks, and a commissioning playbook so your site team can stand up the show unit inside 12 weeks.",
    heroImage: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 180000,
    currency: "USD",
    priceSqft: 240,
    areaSqft: 2400,
    categories: ["Residential", "Resort"],
    styles: ["Parametric", "Tropical modern"],
    tags: ["Turnkey", "Rapid deploy", "Passive cooling"],
    specs: [
      { label: "Bedrooms", value: "3" },
      { label: "Bathrooms", value: "3.5" },
      { label: "Floor plates", value: "2" }
    ],
    firm: {
      _id: "firm-demo",
      slug: "demo-design-collective",
      name: "Demo Design Collective",
      tagline: "Concepts, specs, and delivery playbooks."
    },
    hosting: {
      serviceSummary: "Programs you can activate immediately.",
      services: [
        { title: "Concept + DD package", description: "Full BIM + spec book to LOD 300.", highlight: "4 weeks" },
        { title: "Fabrication kit", description: "Coordinated shop drawings + vendor introductions.", highlight: "6 weeks" }
      ],
      products: [
        { title: "Lifestyle FF&E pack", description: "Curated furniture + lighting set ready for procurement." }
      ]
    },
    updatedAt: now()
  },
  {
    _id: "studio-demo-2",
    slug: "demo-hospitality-capsule",
    title: "Hospitality Capsule",
    summary: "Compact guest suites for resorts, co-living, and remote work retreats.",
    description:
      "Prefabricated suite cores that arrive complete with bathrooms, casework, and MEP backbone. Stackable and designed to plug into modular circulation spines.",
    heroImage: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 95000,
    currency: "USD",
    priceSqft: 210,
    areaSqft: 1600,
    categories: ["Hospitality", "Mixed-use"],
    styles: ["Modular", "Minimal"],
    tags: ["Prefabricated", "Stackable", "Smart-ready"],
    specs: [
      { label: "Suites", value: "2" },
      { label: "Bathrooms", value: "2" },
      { label: "Modules", value: "3" }
    ],
    firm: {
      _id: "firm-demo",
      slug: "demo-design-collective",
      name: "Demo Design Collective",
      tagline: "Concepts, specs, and delivery playbooks."
    },
    hosting: {
      serviceSummary: "Activate modules + operating playbooks.",
      services: [{ title: "Suites deployment plan", description: "Site-fit, logistics, and commissioning supervision." }],
      products: [{ title: "Capsule FF&E kit", description: "Loose furniture & finishes to match the render set." }]
    },
    updatedAt: now()
  },
  {
    _id: "studio-demo-3",
    slug: "cafca",
    title: "Cafca Residence Lab",
    summary: "Sample listing so the /studio/cafca route renders even when the API is offline.",
    description:
      "A lightweight fallback entry that mirrors what a real listing would expose. Replace this with live data once the Design Studio API is wired up.",
    heroImage: "https://images.unsplash.com/photo-1503389152951-9f343605f61e?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 125000,
    currency: "USD",
    priceSqft: 260,
    areaSqft: 2100,
    categories: ["Residential", "Prototype"],
    styles: ["Contemporary", "Low-carbon"],
    tags: ["Live-work", "Modular shell"],
    specs: [
      { label: "Bedrooms", value: "4" },
      { label: "Bathrooms", value: "3" },
      { label: "Structure", value: "Cross-laminated timber" }
    ],
    firm: {
      _id: "firm-demo",
      slug: "demo-design-collective",
      name: "Demo Design Collective",
      tagline: "Concepts, specs, and delivery playbooks."
    },
    hosting: {
      serviceSummary: "Programs you can activate instantly.",
      services: [
        { title: "Cafca concept kit", description: "Narrative, hero renders, and schematic plans." },
        { title: "Delivery sprint", description: "90-day DD + vendor onboarding package." }
      ],
      products: [{ title: "Material moodboard", description: "Finish schedule + alternates ready for procurement." }]
    },
    updatedAt: now()
  }
];

const FALLBACK_MATERIALS = [
  {
    _id: "material-demo-1",
    slug: "thermal-brick-panel",
    title: "Thermal Brick Panel",
    description: "High-density terracotta brick panel with integrated insulation backing for rapid facade installs.",
    price: 45,
    currency: "USD",
    unit: "sq ft",
    heroImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1451976426598-a7593bd6d0b2?auto=format&fit=crop&w=1200&q=80"
    ],
    categories: ["Envelope", "Low-carbon"],
    tags: ["Fire rated", "Panelised"],
    metafields: {
      vendor: "Titan Materials",
      leadTime: "2 weeks",
      finish: "Matte",
      sku: "TM-THERMAL-01"
    },
    updatedAt: now()
  },
  {
    _id: "material-demo-2",
    slug: "recycled-steel-grid",
    title: "Recycled Steel Grid",
    description: "Modular structural grid fabricated from recycled steel billets with mill certification.",
    price: 120,
    currency: "USD",
    unit: "linear ft",
    heroImage: "https://images.unsplash.com/photo-1451976426598-a7593bd6d0b2?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1451976426598-a7593bd6d0b2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80"
    ],
    categories: ["Structure"],
    tags: ["Recycled", "Bespoke"],
    metafields: {
      vendor: "ForgeCo Labs",
      leadTime: "5 weeks",
      finish: "Brushed",
      sku: "FC-GRID-12"
    },
    updatedAt: now()
  },
  {
    _id: "material-demo-3",
    slug: "acoustic-lathe-panel",
    title: "Acoustic Lathe Panel",
    description: "CNC milled acoustic lathe panel with felt backing for studio and hospitality fitouts.",
    price: 32,
    currency: "USD",
    unit: "sq ft",
    heroImage: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1451976426598-a7593bd6d0b2?auto=format&fit=crop&w=1200&q=80"
    ],
    categories: ["Interior", "Acoustics"],
    tags: ["Felt backed", "CNC"],
    metafields: {
      vendor: "Studio Supply",
      leadTime: "10 days",
      finish: "Oak / Walnut",
      sku: "SS-ACOUSTIC-08"
    },
    updatedAt: now()
  }
];

const FALLBACK_ASSOCIATES = [
  {
    _id: "associate-demo-1",
    slug: "aurora-lim",
    name: "Aurora Lim",
    title: "Parametric Design Lead",
    summary: "Architect + computational designer building hospitality systems across APAC.",
    avatar: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    location: "Singapore",
    timezone: "Asia/Singapore",
    experienceYears: 9,
    hourlyRate: 95,
    rates: { hourly: 95, currency: "USD" },
    specialisations: ["Parametric design", "BIM management"],
    softwares: ["Grasshopper", "Revit", "Speckle"],
    languages: ["English", "Mandarin"],
    summaryTags: ["Hospitality", "Computational"],
    updatedAt: now()
  },
  {
    _id: "associate-demo-2",
    slug: "leo-fernandez",
    name: "Leo Fernandez",
    title: "Design Operations Architect",
    summary: "Runs large workplace rollouts with playbooks covering DD to commissioning.",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80",
    location: "Madrid, Spain",
    timezone: "Europe/Madrid",
    experienceYears: 12,
    hourlyRate: 85,
    rates: { hourly: 85, currency: "EUR" },
    specialisations: ["Design Ops", "Workplace"],
    softwares: ["AutoCAD", "Revit", "Monday"],
    languages: ["Spanish", "English"],
    summaryTags: ["Rollouts", "Program management"],
    updatedAt: now()
  },
  {
    _id: "associate-demo-3",
    slug: "nisha-patel",
    name: "Nisha Patel",
    title: "Sustainability Strategist",
    summary: "Advises studios on low-carbon material selections + certification pathways.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    location: "Bengaluru, India",
    timezone: "Asia/Kolkata",
    experienceYears: 7,
    hourlyRate: 70,
    rates: { hourly: 70, currency: "USD" },
    specialisations: ["Sustainability", "Certification"],
    softwares: ["Enscape", "Insight360"],
    languages: ["English", "Hindi"],
    summaryTags: ["LEED", "Material science"],
    updatedAt: now()
  }
];

const HOSTING_FALLBACK = {
  firm: {
    _id: "firm-demo",
    slug: "demo-design-collective",
    name: "Demo Design Collective"
  },
  hosting: {
    enabled: true,
    serviceSummary:
      "Demo view showing how design studios articulate hosting programs when the primary DB is offline.",
    services: [
      { id: "concept", label: "Concept design", description: "Narratives, renders, and schematic plans.", status: "available" },
      { id: "delivery", label: "Delivery sprint", description: "DD through IFC with BIM coordination.", status: "available" },
      { id: "ops", label: "Operator kit", description: "Commissioning checklists + SOPs.", status: "available" }
    ],
    products: [
      {
        id: "ff&e",
        label: "FF&E kit",
        description: "Loose furniture + finishes for hospitality suites.",
        status: "available",
        extra: "Ships with vendor roster"
      }
    ],
    updatedAt: now()
  }
};

const paginate = (items, page = 1, limit = 12) => {
  const limitNum = Math.max(1, Math.min(Number(limit) || 12, 60));
  const pageNum = Math.max(1, Number(page) || 1);
  const start = (pageNum - 1) * limitNum;
  return {
    pageNum,
    limitNum,
    slice: items.slice(start, start + limitNum)
  };
};

const buildFacet = (items, key) => {
  const counts = new Map();
  items.forEach((item) => {
    const values = Array.isArray(item[key]) ? item[key] : item[key] ? [item[key]] : [];
    values.forEach((value) => {
      if (!value) return;
      const label = typeof value === "string" ? value : value.label || value.name;
      if (!label) return;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
  });
  return Array.from(counts, ([name, count]) => ({ name, count }));
};

const decorateWithProof = (item, type) => {
  const next = { ...item };
  next.web3Proof = createWeb3Proof(next, type);
  return next;
};

export const getFallbackStudios = (query = {}) => {
  const search = normalise(query.search);
  const category = normalise(query.category);
  const style = normalise(query.style);
  const firmSlug = normalise(query.firmSlug);

  let items = FALLBACK_STUDIOS.slice();
  if (search) {
    items = items.filter((studio) => {
      const haystack = [studio.title, studio.summary, studio.description, studio.firm?.name]
        .filter(Boolean)
        .map(normalise);
      return haystack.some((entry) => entry.includes(search));
    });
  }
  if (category) {
    items = items.filter((studio) => (studio.categories || []).some((entry) => normalise(entry) === category));
  }
  if (style) {
    items = items.filter((studio) => (studio.styles || []).some((entry) => normalise(entry) === style));
  }
  if (firmSlug) {
    items = items.filter((studio) => normalise(studio.firm?.slug) === firmSlug);
  }

  const { pageNum, limitNum, slice } = paginate(items, query.page, query.limit);
  const decorated = slice.map((item) => decorateWithProof(item, "studio"));
  const proofSummary = summariseProofs(decorated.map((entry) => entry.web3Proof));

  return {
    items: decorated,
    meta: {
      total: items.length,
      page: pageNum,
      pageSize: decorated.length,
      facets: {
        categories: buildFacet(items, "categories"),
        tags: buildFacet(items, "tags"),
        styles: buildFacet(items, "styles")
      },
      web3: proofSummary,
      fallback: true
    }
  };
};

export const findFallbackStudio = (idOrSlug) => {
  if (!idOrSlug) return null;
  const target = normalise(idOrSlug);
  const found = FALLBACK_STUDIOS.find(
    (studio) => normalise(studio.slug) === target || normalise(studio._id) === target
  );
  return found ? decorateWithProof(found, "studio") : null;
};

export const getFallbackMaterials = (query = {}) => {
  const search = normalise(query.search);
  const category = normalise(query.category);

  let items = FALLBACK_MATERIALS.slice();
  if (search) {
    items = items.filter((material) => {
      const haystack = [material.title, material.description, material.metafields?.vendor]
        .filter(Boolean)
        .map(normalise);
      return haystack.some((entry) => entry.includes(search));
    });
  }
  if (category) {
    items = items.filter((material) => (material.categories || []).some((entry) => normalise(entry) === category));
  }

  const { pageNum, limitNum, slice } = paginate(items, query.page, query.limit);
  const decorated = slice.map((item) => decorateWithProof(item, "material"));
  const proofSummary = summariseProofs(decorated.map((entry) => entry.web3Proof));

  return {
    items: decorated,
    meta: {
      total: items.length,
      page: pageNum,
      pageSize: decorated.length,
      facets: {
        categories: buildFacet(items, "categories"),
        tags: buildFacet(items, "tags")
      },
      web3: proofSummary,
      fallback: true
    }
  };
};

export const findFallbackMaterial = (idOrSlug) => {
  if (!idOrSlug) return null;
  const target = normalise(idOrSlug);
  const found = FALLBACK_MATERIALS.find(
    (material) => normalise(material.slug) === target || normalise(material._id) === target
  );
  return found ? decorateWithProof(found, "material") : null;
};

export const getFallbackAssociates = (query = {}) => {
  const search = normalise(query.search);
  const skill = normalise(query.skill);
  const software = normalise(query.software);
  const timezone = normalise(query.timezone);

  let items = FALLBACK_ASSOCIATES.slice();
  if (search) {
    items = items.filter((associate) => {
      const haystack = [associate.name, associate.title, associate.summary, ...((associate.summaryTags || []))].map(
        normalise
      );
      return haystack.some((entry) => entry.includes(search));
    });
  }
  if (skill) {
    items = items.filter((associate) => (associate.specialisations || []).some((entry) => normalise(entry) === skill));
  }
  if (software) {
    items = items.filter((associate) => (associate.softwares || []).some((entry) => normalise(entry) === software));
  }
  if (timezone) {
    items = items.filter((associate) => normalise(associate.timezone) === timezone);
  }

  const decorated = items.map((item) => decorateWithProof(item, "associate"));
  const proofSummary = summariseProofs(decorated.map((entry) => entry.web3Proof));

  return {
    items: decorated,
    meta: {
      total: decorated.length,
      web3: proofSummary,
      fallback: true
    }
  };
};

export const findFallbackAssociate = (idOrSlug) => {
  if (!idOrSlug) return null;
  const target = normalise(idOrSlug);
  const found = FALLBACK_ASSOCIATES.find(
    (associate) =>
      normalise(associate.slug) === target || normalise(associate._id) === target || normalise(associate.name) === target
  );
  return found ? decorateWithProof(found, "associate") : null;
};

export const getFallbackHosting = () => ({
  hosting: HOSTING_FALLBACK.hosting,
  firm: HOSTING_FALLBACK.firm,
  meta: { updatedAt: HOSTING_FALLBACK.hosting.updatedAt, fallback: true }
});

