// Studio.jsx — dynamic + mobile-optimized (single file drop-in)
// - Mobile filter drawer (bottom sheet) + body scroll lock
// - Sticky actions on small screens; results + active filter count
// - Client-side "Load more" pagination (no backend changes)
// - Skeleton loaders, reduced-motion friendly animations
// - Centered dual-range slider thumbs (CSS injected)
// - Card layout unchanged in spirit: Title, Firm + Country + Logo, Rating, Image,
//   Price (per sq ft), meta (Primary Category; Style; Plot Area; Climate; Terrain), Bio
// - Montserrat font injected via <link> (no other file edits)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { HiOutlineSearch } from "react-icons/hi";
import { AiFillStar } from "react-icons/ai";
import { FiHome, FiLayers, FiMap, FiPackage, FiTool, FiFeather } from "react-icons/fi";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import RatingModal from "../components/RatingModal.jsx";
import { createEmptyFilterState } from "../constants/designFilters.js";
import { marketplaceFeatures } from "../data/marketplace.js";
import { fetchStudios, fetchDesignStudioHosting, buildStudioSlug } from "../services/marketplace.js";
import { fetchFirmDashboard } from "../services/dashboard.js";
import { analyzeImage } from "../utils/imageSearch.js";
import {
  applyFallback,
  getStudioFallback,
  getStudioImageUrl,
} from "../utils/imageFallbacks.js";

// ---- Inject Montserrat once (no other file changes required)
const ensureMontserrat = () => {
  const id = "montserrat-link";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
};

// ---- Slider CSS (center thumbs exactly on the bar) + mobile enhancements
const SLIDER_CSS = `
.dual-range{position:relative;height:32px}
.dual-range__track{
  position:absolute;left:4px;right:4px;top:50%;
  transform:translateY(-50%);height:6px;border-radius:9999px;
  background:#e2e8f0;
}
.dual-range__range{
  position:absolute;top:50%;transform:translateY(-50%);
  height:6px;border-radius:9999px;background:#0f172a;z-index:1;
}
.dual-range__input{
  position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);
  width:100%;height:32px;background:transparent;border:0;outline:0;
  pointer-events:none;-webkit-appearance:none;appearance:none;z-index:2;
}
/* WebKit */
.dual-range__input::-webkit-slider-runnable-track{height:6px;background:transparent;border:none}
.dual-range__input::-webkit-slider-thumb{
  -webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:9999px;
  background:#0f172a;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.15);
  pointer-events:auto;
}
/* Firefox */
.dual-range__input::-moz-range-track{height:6px;background:transparent;border:none}
.dual-range__input::-moz-range-thumb{
  width:22px;height:22px;border-radius:9999px;background:#0f172a;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.15);
  pointer-events:auto;
}
/* Edge/IE */
.dual-range__input::-ms-track{height:6px;background:transparent;border-color:transparent;color:transparent}
.dual-range__input::-ms-thumb{width:22px;height:22px;border-radius:9999px;background:#0f172a;border:2px solid #fff}

/* Mobile specifics */
@media (max-width: 640px){
  .dual-range{height:36px}
}

/* Bottom sheet drawer */
.sheet-overlay{position:fixed;inset:0;background:rgba(2,6,23,.44);backdrop-filter:saturate(120%) blur(2px);z-index:50;opacity:0;pointer-events:none;transition:opacity .2s ease}
.sheet-overlay.open{opacity:1;pointer-events:auto}
.sheet{position:fixed;left:0;right:0;bottom:0;max-height:80vh;background:#fff;border-top-left-radius:20px;border-top-right-radius:20px;box-shadow:0 -10px 30px rgba(0,0,0,.15);transform:translateY(100%);transition:transform .24s ease;z-index:51}
.sheet.open{transform:translateY(0)}
.sheet-handle{width:38px;height:4px;background:#e2e8f0;border-radius:9999px;margin:10px auto}

/* Safe area paddings */
.safe-bottom{padding-bottom:env(safe-area-inset-bottom)}
`;

// ---- Category images bootstrap (unchanged)
const rawCategoryImages = import.meta.glob("/src/assets/category_icon/*.avif", {
  eager: true,
  import: "default",
});
const categoryImages = Object.fromEntries(
  Object.entries(rawCategoryImages).map(([key, value]) => [key, value])
);
const IMG = (file) =>
  categoryImages[`/src/assets/category_icon/${file}`] || null;

const CATEGORY_IMAGE_MAP = {
  All: IMG("all.avif"),
  Residential: IMG("residential.avif"),
  Commercial: IMG("Commercial.avif"),
  "Mixed-Use": IMG("mixed_use.avif"),
  Industrial: IMG("industrial.avif"),
  Institutional: IMG("institutional.avif"),
  Agricultural: IMG("agricultural.avif"),
  Recreational: IMG("recreational.avif"),
  Infrastructure: IMG("infrastructural.avif"),
};

const DEFAULT_CATEGORY_IMG = CATEGORY_IMAGE_MAP.All || null;
const EMPTY_HOSTING_TILES = { summary: "", services: [], products: [] };
const motionCreate = typeof motion.create === "function" ? motion.create : motion;
const MotionArticle = motionCreate("article");

const normalizeWorkspaceStudio = (studio = {}, firm = null) => {
  const galleryArray = Array.isArray(studio.gallery) ? studio.gallery.filter(Boolean) : [];
  const heroCandidate =
    studio.heroImage ||
    studio.hero_image ||
    studio.image ||
    galleryArray[0] ||
    null;
  const gallery = heroCandidate
    ? [heroCandidate, ...galleryArray.filter((img) => img !== heroCandidate)]
    : galleryArray;
  return {
    ...studio,
    firm: studio.firm || firm || null,
    slug: buildStudioSlug({ ...studio, firm: studio.firm || firm }),
    heroImage: heroCandidate,
    gallery,
  };
};

const CATEGORY_DISPLAY_ORDER = [
  "All",
  "Residential",
  "Commercial",
  "Mixed-Use",
  "Institutional",
  "Industrial",
  "Agricultural",
  "Recreational",
  "Infrastructure",
];

const SORT_OPTIONS = [
  { value: "price-asc", label: "Price - Low to High" },
  { value: "price-desc", label: "Price - High to Low" },
  { value: "rating-desc", label: "Rating - High to Low" },
];

const AMAZON_FILTER_SECTIONS = [
  "Typology",
  "Style",
  "Climate Adaptability",
  "Terrain",
  "Soil Type",
  "Material Used",
  "Interior Layout",
  "Roof Type",
  "Exterior",
  "Additional Features",
  "Sustainability",
];

const STYLE_OPTIONS = [
  "Classical","Gothic","Renaissance","Baroque","Neoclassical","Victorian","Beaux-Arts","Art Nouveau","Art Deco","Modernism",
  "Bauhaus","International Style","Mid-Century Modern","Brutalism","Postmodernism","Deconstructivism",
  "Minimalism","Neo-Futurism","Bohemian","Industrial","Eco-architecture","Japanese","Parametric","Scandinavian",
  "Fachwerk/ Half-Timbered","Greek Revival","Contemporary","Chinese","Romanesque","Queenslander","Federation",
];

const CLIMATE_OPTIONS = [
  "Hot & Dry","Hot & Humid","Cold & Dry","Cold","Temperate","Tropical","Tundra","Mediterranean","Continental",
  "Composite","Tropical Rainforest","Tropical Monsoon","Tropical Savanna","Hot Desert","Cold Desert","Hot Semi-Arid","Cold Semi-Arid","Marine",
];

const TERRAIN_OPTIONS = [
  "Flat","Sloping","Hilly","Mountainous","Coastal","Waterfront","Plateau","Valley","Riverfront","Lakefront","Swamp",
  "Floodplains","Cliff",
];

const SOIL_OPTIONS = [
  "Loose","Soft","Firm","Stiff","Dense","Hard","Sandy","Rocky","Clayey","Sandy Clay","Silty Clay","Loamy",
  "Loamy Sand","Black Soil","Red Soil","Alluvial Soil","Yellow Soil","Light Grey Soil",
];

const MATERIAL_OPTIONS = [
  "Stone","Brick","Concrete","Steel","Glass","Wood","Bamboo","Aluminum","Copper","Clay","Plaster & Stucco","Adobe",
  "Rammed Earth","Fiber-reinforced","CSEB (Compressed Stabilized Earth Blocks)","PVC","Translucent Concrete","Hydroceramics",
];

const INTERIOR_LAYOUT_OPTIONS = [
  "Open","Closed","Linear","Centralized","Radial","Grid","Cluster","Split-Level","Loft","Courtyard","Studio","Staggered",
];

const ROOF_OPTIONS = [
  "Flat","Gable","Hip","Shed","Mansard","Gambrel","Butterfly","Dome","Pyramid","Green","Sawtooth","Thatch",
  "Barrel Vault","Hip & Valley","Truss Roof",
];

const EXTERIOR_OPTIONS = [
  "Façade","Cladding","Siding","Stucco","Brickwork","Stone Veneer","Glass Curtain Wall","Timber Exterior","Metal Panels",
  "Green Walls","Awnings","Canopies",
];

const FEATURES_OPTIONS = [
  "Balconies","Verandas","Terraces","Patios","Decks","Courtyards","Pergolas","Bay Windows","Skylights","Chimneys",
  "Columns","Spires","Porches","Driveways","Fences","Eaves","Gates","Water Features (Pond)","Water Features (Fountain)",
  "Ramps","Elevators","Escalators",
];

const SUSTAINABILITY_OPTIONS = [
  "Passive Solar Design","Green Roofs","Rainwater Harvesting","Greywater Recycling","Natural Ventilation","Thermal Mass",
  "Daylighting","Recycled Materials","Modular Construction","Smart Glass","Solar Panels (Photovoltaics)","Wind Energy Integration",
  "Geothermal Heating & Cooling","Biomimicry Design","BREEAM Standards","Circular Economy Design","Adaptive Reuse",
  "Green Cover Preservation","Carbon-Neutral Construction","Net-Zero Energy Design","Low-Carbon Materials",
];

const SERVICE_FILTERS = [
  { id: "all", label: "All offerings", description: "Show every studio plus their services and products." },
  { id: "services", label: "Design services", description: "Studios leading bespoke architectural, planning, and interior briefs." },
  { id: "plans", label: "Pre-designed plans", description: "Catalogues of builder-ready plan sets clients can license." },
  { id: "designBuild", label: "Design-build", description: "Studios that both design and construct turnkey assets." },
];

const SERVICE_KEYWORDS = {
  services: ['architectural design','design service','blueprint','schematic','planning','concept','masterplan','bim','ifc','document set'],
  interior: ['interior','space planning','furniture','finish palette','ff&e','fitout','styling'],
  urban: ['urban','infrastructure','streetscape','transit','public realm','sceneography','broadcast'],
  sustainable: ['sustainable','green building','net-zero','passive house','leed','breeam','low-carbon','solar','energy model'],
  plans: ['plan set','pre-designed','catalogue plan','builder set','kit of parts','stock plan'],
  designBuild: ['design-build','turnkey','epc','delivery partner','constructed','built turnkey','gc of record'],
};

const SERVICE_PRIMER = [
  {
    id: "architectural-design",
    title: "Architectural design",
    description: "Concept-to-IFC drawing sets for residential, commercial, and institutional programs.",
    highlights: ["Full BIM deliverables", "Permitting support"],
    icon: FiLayers,
  },
  {
    id: "interior-design",
    title: "Interior design",
    description: "Space planning, furniture specification, finish palettes, and FF&E sourcing.",
    highlights: ["FF&E schedules", "Material boards"],
    icon: FiHome,
  },
  {
    id: "urban-infrastructure",
    title: "Urban & infrastructure",
    description: "Public realm, transit, and broadcast/sceneography briefs at district scale.",
    highlights: ["Masterplans", "Infrastructure playbooks"],
    icon: FiMap,
  },
  {
    id: "sustainable-solutions",
    title: "Sustainable solutions",
    description: "Passive design, low-carbon materials, and certification advisory.",
    highlights: ["Net-zero roadmaps", "Climate adaptation"],
    icon: FiFeather,
  },
];

const PRODUCT_PRIMER = [
  {
    id: "plan-catalogue",
    title: "Plan catalogue",
    description: "Digital builder sets clients can license and adapt to their site.",
    highlights: ["Permit-ready", "Digital delivery"],
    icon: FiPackage,
    focus: "plans",
  },
  {
    id: "design-build",
    title: "Design-build programs",
    description: "Studios that both design and construct turnkey housing or mixed-use assets.",
    highlights: ["Single contract", "Delivered building"],
    icon: FiTool,
    focus: "designBuild",
  },
];

const gatherStudioText = (studio) =>
  [
    studio.title,
    studio.summary,
    studio.description,
    studio.bio,
    studio.story,
    studio.programType,
    studio.studioType,
    (studio.programs || []).join(' '),
    (studio.features || []).join(' '),
    (studio.tags || []).join(' '),
    (studio.metadata?.keywords || []).join(' '),
    studio.firm?.bio,
    (studio.firm?.services || []).join(' '),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .join(' ');

const deriveServiceSignals = (studio) => {
  const text = gatherStudioText(studio);
  const tokens = new Set(
    [
      ...(studio.programs || []),
      ...(studio.services || []),
      ...(studio.tags || []),
      ...(studio.features || []),
      studio.programType,
      studio.offerType,
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase())
  );
  const hasKeyword = (bucket) =>
    SERVICE_KEYWORDS[bucket].some((needle) => text.includes(needle) || tokens.has(needle));
  const offersDesign = hasKeyword('services') || tokens.has('design') || tokens.has('architecture');
  const offersInterior = hasKeyword('interior');
  const offersUrban = hasKeyword('urban');
  const offersSustainable = hasKeyword('sustainable');
  const sellsPlans = hasKeyword('plans') || tokens.has('plan set') || studio.catalogType === 'plan';
  const designBuild = hasKeyword('designBuild') || /turnkey|build partner|construction/.test(text);

  const badges = [];
  if (offersDesign) badges.push('Architectural design');
  if (offersInterior) badges.push('Interior design');
  if (offersUrban) badges.push('Urban / infrastructure');
  if (offersSustainable) badges.push('Sustainable consulting');
  if (sellsPlans) badges.push('Plan catalogue');
  if (designBuild) badges.push('Design-build delivery');

  return {
    offersDesign,
    offersInterior,
    offersUrban,
    offersSustainable,
    sellsPlans,
    designBuild,
    badges,
  };
};

const matchesServiceFocus = (signals, focus) => {
  if (focus === 'all') return true;
  if (focus === 'services') return signals.offersDesign || signals.offersInterior || signals.offersUrban;
  if (focus === 'plans') return signals.sellsPlans;
  if (focus === 'designBuild') return signals.designBuild;
  return true;
};

// Typologies by top-level category

// Typologies by top-level category
const TYPOLOGIES_BY_CATEGORY = {
  Residential: [
    "Apartment","Condominium","Single-Family House","Duplex","Triplex","Row House","Bungalow","Cottage","Villa","Mansion",
    "Studio Apartment","Loft","Penthouse","Farmhouse","Earth Shelter",
  ],
  Commercial: [
    "Office Buildings","Retail Stores","Shopping Malls","Restaurants","Cafés","Hotels","Hostels","Resorts","Motels",
    "Theaters","Convention Centers","Exhibition Halls","Clinics","Banks","Warehouses","Showrooms","Supermarkets","Mixed-Use Buildings",
  ],
  Industrial: [
    "Factories","Manufacturing Plants","Warehouses","Distribution Centers","Power Plants","Refineries","Steel Mills","Chemical Plants",
    "Food Processing Plants","Textile Mills","Breweries","Shipyards","Mining Facilities","Industrial Parks",
  ],
  Agricultural: [
    "Barns","Silos","Greenhouses","Farmhouses","Storage Sheds","Poultry Houses","Cattle Sheds","Piggeries","Sheep Pens","Stables",
    "Irrigation Structures","Fencing","Fish Farms","Crop Processing Units","Dairy Farms",
  ],
  Recreational: [
    "Parks","Playgrounds","Stadiums","Sports Complexes","Gyms","Swimming Pools","Golf Courses","Resorts","Amusement Parks","Zoos",
    "Aquariums","Museums","Art Galleries","Theaters","Cinemas","Community Centers","Clubs","Spas","Gaming Arcades",
  ],
  Institutional: [
    "Schools","Colleges","Universities","Libraries","Research Institutes","Museums","Courthouses","Police Stations","Fire Stations",
    "Post Offices","City Halls","Government Offices","Parliament","Embassies","Military Bases","Cultural Centers","Hospitals",
    "Community Centers",
  ],
  "Mixed-Use": [
    "Residential + Commercial","Residential + Office","Residential + Retail","Office + Retail","Hotel + Residential","Hotel + Retail",
    "Transit-Oriented Developments","Live-Work Units","Mall + Office + Residential","Smart Cities",
  ],
  Infrastructure: [
    "Highways","Airports","Seaports","Bus Terminals","Metro","Dams","Canals","Irrigation Systems","Water Supply Systems","Sewage Systems",
    "Power Plants","Transmission Lines","Telecommunication Towers","Pipelines","Parking Structures",
  ],
};

const AMAZON_OPTIONS = {
  Style: STYLE_OPTIONS,
  "Climate Adaptability": CLIMATE_OPTIONS,
  Terrain: TERRAIN_OPTIONS,
  "Soil Type": SOIL_OPTIONS,
  "Material Used": MATERIAL_OPTIONS,
  "Interior Layout": INTERIOR_LAYOUT_OPTIONS,
  "Roof Type": ROOF_OPTIONS,
  Exterior: EXTERIOR_OPTIONS,
  "Additional Features": FEATURES_OPTIONS,
  Sustainability: SUSTAINABILITY_OPTIONS,
};

const Studio = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  // --- Core state
  const [selectedCategory, setSelectedCategory] = useState(() => location.state?.category || "All");
  const [query, setQuery] = useState(() => location.state?.search || "");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [studios, setStudios] = useState([]);
  const [workspaceState, setWorkspaceState] = useState({ loading: true, error: null, items: [], meta: null, fallback: false, lastUpdated: null });
  const [marketplaceState, setMarketplaceState] = useState({ loading: true, error: null, items: [], meta: null, web3: null, fallback: false });

  // Reverse image search
  const [imageKeywords, setImageKeywords] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageStatus, setImageStatus] = useState("");
  const [imageSearching, setImageSearching] = useState(false);
  const imageInputRef = useRef(null);

  // Filters + UI
  const [filters, setFilters] = useState(() => createEmptyFilterState());
  const [serviceFocus, setServiceFocus] = useState('all');
  const [sortOrder, setSortOrder] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true); // desktop sidebar
  // collapsed sections
  const initialCollapsedSections = useMemo(() => {
    const obj = { Typology: true, price: true, sqft: true, floors: true, programs: true };
    for (const sec of AMAZON_FILTER_SECTIONS) if (sec !== "Typology") obj[sec] = true;
    return obj;
  }, []);
  const [collapsed, setCollapsed] = useState(initialCollapsedSections);
  const toggleSection = (key) => setCollapsed((s) => ({ ...s, [key]: !s[key] }));

  // ---- RANGE FILTER STATE ----
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [sqftRange, setSqftRange] = useState([0, 0]);
  const [floorsRange, setFloorsRange] = useState([0, 0]);
  const [programsRange, setProgramsRange] = useState([0, 0]);

  const [priceSel, setPriceSel] = useState([0, 0]);
  const [sqftSel, setSqftSel] = useState([0, 0]);
  const [floorsSel, setFloorsSel] = useState([0, 0]);
  const [programsSel, setProgramsSel] = useState([0, 0]);
  const [hostingTiles, setHostingTiles] = useState(EMPTY_HOSTING_TILES);
  const [activeSource, setActiveSource] = useState("workspace");
  const loading = activeSource === "workspace" ? workspaceState.loading : marketplaceState.loading;
  const error = activeSource === "workspace" ? workspaceState.error : marketplaceState.error;
  const web3Meta = activeSource === "workspace" ? null : marketplaceState.web3;

  // Client-side pagination (no backend change)
  const PAGE_SIZE = 9;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Mount effects
  useEffect(() => {
    ensureMontserrat();
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const { category: incomingCategory, search: incomingSearch } = location.state || {};
    if (incomingCategory) setSelectedCategory(incomingCategory);
    if (incomingSearch) setQuery(incomingSearch);
  }, [location.state]);

  // Fetch studios (backend untouched)
  useEffect(() => {
    let cancelled = false;
    async function loadStudios() {
      setMarketplaceState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = {};
        if (selectedCategory !== "All") params.category = selectedCategory;
        if (debouncedQuery) params.search = debouncedQuery;
        const { items, meta } = await fetchStudios(params);
        if (!cancelled) {
          setMarketplaceState({
            loading: false,
            error: null,
            items,
            meta,
            web3: meta?.web3 || null,
            fallback: false,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setMarketplaceState((prev) => ({
            ...prev,
            loading: false,
            error: err?.message || "Unable to load studios right now.",
            fallback: false,
          }));
        }
      }
    }
    loadStudios();
    return () => { cancelled = true; };
  }, [selectedCategory, debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspaceStudios() {
      setWorkspaceState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetchFirmDashboard();
        if (cancelled) return;
        const firm = response?.firm || {};
        const isFallback = Boolean(response?.fallback);
        const items = Array.isArray(response?.studios)
          ? response.studios.map((entry) => normalizeWorkspaceStudio(entry, firm))
          : [];
        const publishedCount = items.filter((item) => item.status === "published").length;
        const draftCount = items.length - publishedCount;
        setWorkspaceState({
          loading: false,
          error: null,
          items,
          meta: { total: items.length, publishedCount, draftCount },
          fallback: isFallback,
          lastUpdated: response?.metrics?.lastUpdated || response?.firm?.updatedAt || null,
        });
      } catch (err) {
        if (cancelled) return;
        setWorkspaceState({
          loading: false,
          error: err?.message || "Unable to sync workspace",
          items: [],
          meta: { total: 0, publishedCount: 0, draftCount: 0 },
          fallback: true,
          lastUpdated: null,
        });
      }
    }
    loadWorkspaceStudios();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadHostingConfig() {
      try {
        const response = await fetchDesignStudioHosting();
        if (cancelled) return;
        const hosting = response?.hosting || {};
        setHostingTiles({
          summary: hosting.serviceSummary?.trim() || "",
          services: Array.isArray(hosting.services) ? hosting.services : [],
          products: Array.isArray(hosting.products) ? hosting.products : [],
        });
      } catch (error) {
        if (cancelled) return;
        console.warn("studio_hosting_load_error", error);
        setHostingTiles(EMPTY_HOSTING_TILES);
      }
    }

    loadHostingConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sourceItems = activeSource === "workspace" ? workspaceState.items : marketplaceState.items;
    setStudios(sourceItems);
  }, [activeSource, marketplaceState.items, workspaceState.items]);

  useEffect(() => {
    if (!workspaceState.loading && workspaceState.items.length) {
      setActiveSource("workspace");
      return;
    }
    if (!marketplaceState.loading && marketplaceState.items.length) {
      setActiveSource("marketplace");
      return;
    }
    if (!workspaceState.loading && !workspaceState.items.length && !marketplaceState.loading) {
      setActiveSource("marketplace");
    }
  }, [workspaceState.loading, workspaceState.items.length, marketplaceState.loading, marketplaceState.items.length]);

  // helpers
  const resolvePrice = (studio) => {
    const raw =
      studio.priceSqft ?? studio.pricing?.basePrice ?? studio.pricing?.total ?? studio.price ?? studio.cost;
    if (raw == null) return null;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
    const numeric = parseFloat(String(raw).replace(/[^0-9.]+/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  };
  const resolveRating = (studio) => {
    const raw =
      studio.rating ?? studio.score ?? studio.reviews?.avgRating ?? studio.reviews?.rating ?? studio.metrics?.rating ?? studio.stats?.rating;
    if (raw == null) return null;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
    const numeric = parseFloat(String(raw));
    return Number.isFinite(numeric) ? numeric : null;
  };
  const resolveSqft = (s) =>
    s.areaSqft ?? s.area?.sqft ?? s.metrics?.areaSqft ?? s.sizeSqft ?? s.size ?? null;
  const resolveFloors = (s) => s.floors ?? s.metadata?.floors ?? s.stats?.floors ?? null;
  const resolveProgramsCount = (s) => {
    if (Number.isFinite(s.programsCount)) return s.programsCount;
    const list = s.programs ?? s.program ?? s.metadata?.programs;
    if (Array.isArray(list)) return list.length;
    return null;
  };
  const resolveRoomsCount = (s) => {
    if (Number.isFinite(s.rooms)) return s.rooms;
    if (Array.isArray(s.rooms)) return s.rooms.length;
    if (Number.isFinite(s.metadata?.rooms)) return s.metadata.rooms;
    return null;
  };
  const resolvePrimaryCategory = (s) =>
    s.primaryCategory ?? (Array.isArray(s.categories) ? s.categories[0] : null);
  const resolvePlotAreaSqft = (s) =>
    s.plotAreaSqft ??
    s.metrics?.plotAreaSqft ??
    s.metrics?.plotArea ??
    s.plot?.areaSqft ??
    s.plot?.area ??
    s.site?.areaSqft ??
    null;
  const resolveClimate = (s) =>
    s.climate ?? s.metadata?.climate ?? s.environment?.climate ?? null;
  const resolveTerrain = (s) =>
    s.terrain ?? s.site?.terrain ?? s.metadata?.terrain ?? null;
  const resolveFirmName = (s) =>
    s.firm?.name ?? s.studioName ?? s.creator?.name ?? null;
  const resolveFirmCountry = (s) =>
    s.firm?.location?.country ?? s.location?.country ?? s.country ?? null;

  const normalizeUnit = (u) => {
    if (!u) return null;
    const t = String(u).toLowerCase();
    return /sq/.test(t) ? "sq ft" : u;
  };

  const deriveDomain = (arr, getter, fallbackMax) => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const it of arr) {
      const v = Number(getter(it));
      if (Number.isFinite(v)) { if (v < min) min = v; if (v > max) max = v; }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, fallbackMax];
    if (min === max) return [0, max];
    return [Math.max(0, Math.floor(min)), Math.ceil(max)];
  };

  useEffect(() => {
    const pDom = deriveDomain(studios, resolvePrice, 100000);
    const aDom = deriveDomain(studios, resolveSqft, 100000);
    const fDom = deriveDomain(studios, resolveFloors, 50);
    const gDom = deriveDomain(studios, resolveProgramsCount, 50);

    setPriceRange(pDom); setPriceSel(pDom);
    setSqftRange(aDom);  setSqftSel(aDom);
    setFloorsRange(fDom); setFloorsSel(fDom);
    setProgramsRange(gDom); setProgramsSel(gDom);
  }, [studios]);

  // DualRange with arrow nudges (thumbs centered by CSS above)
  const DualRange = ({ id, label, domain, value, onChange, format = (n) => n, step = 1 }) => {
    const [min, max] = domain;
    const [lo, hi] = value;
    const clamp = (v, loBound, hiBound) => Math.min(Math.max(v, loBound), hiBound);

    const nudgeLo = (delta) => onChange([clamp(lo + delta, min, hi), hi]);
    const nudgeHi = (delta) => onChange([lo, clamp(hi + delta, lo, max)]);

    const span = Math.max(max - min, 1);
    const toPercent = (val) => {
      if (!Number.isFinite(val)) return 0;
      const raw = ((val - min) / span) * 100;
      return Math.min(Math.max(raw, 0), 100);
    };
    const lowerPercent = toPercent(lo);
    const upperPercent = toPercent(hi);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleSection(id)}
            className="text-left text-sm font-semibold text-slate-700 w-full flex items-center gap-2"
          >
            <span className={`inline-block transition-transform ${collapsed[id] ? "rotate-0" : "rotate-90"}`}>{"\u203A"}</span>
            {label}
          </button>
        </div>

        <div className={collapsed[id] ? "hidden" : "space-y-3"}>
          <div className="px-1">
            <div className="dual-range">
              <div className="dual-range__track" />
              <div
                className="dual-range__range"
                style={{ left: `${lowerPercent}%`, right: `${100 - upperPercent}%` }}
              />
              <input
                aria-label={`${label} minimum`}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={lo}
                aria-valuetext={format(lo)}
                id={`${id}-min`}
                type="range"
                min={min}
                max={max}
                step={step}
                value={lo}
                onChange={(e) => {
                  const nextLo = clamp(Number(e.target.value), min, hi);
                  onChange([nextLo, hi]);
                }}
                className="dual-range__input dual-range__input--min"
              />
              <input
                aria-label={`${label} maximum`}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={hi}
                aria-valuetext={format(hi)}
                id={`${id}-max`}
                type="range"
                min={min}
                max={max}
                step={step}
                value={hi}
                onChange={(e) => {
                  const nextHi = clamp(Number(e.target.value), lo, max);
                  onChange([lo, nextHi]);
                }}
                className="dual-range__input dual-range__input--max"
              />
            </div>
          </div>

          {/* arrow nudges + numeric inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 w-1/2 min-w-[140px]">
              <button
                type="button"
                aria-label="decrease min"
                onClick={() => nudgeLo(-step)}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600"
              >
                -
              </button>
              <input
                type="number"
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={lo}
                onChange={(e) => {
                  const next = clamp(Number(e.target.value || min), min, hi);
                  onChange([next, hi]);
                }}
              />
              <button
                type="button"
                aria-label="increase min"
                onClick={() => nudgeLo(step)}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600"
              >
                +
              </button>
            </div>

            <div className="text-slate-400">to</div>

            <div className="flex items-center gap-1 w-1/2 min-w-[140px]">
              <button
                type="button"
                aria-label="decrease max"
                onClick={() => nudgeHi(-step)}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600"
              >
                -
              </button>
              <input
                type="number"
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={hi}
                onChange={(e) => {
                  const next = clamp(Number(e.target.value || max), lo, max);
                  onChange([lo, next]);
                }}
              />
              <button
                type="button"
                aria-label="increase max"
                onClick={() => nudgeHi(step)}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Categories (hide "Modernism" chip as requested earlier)
  const categories = useMemo(() => [...CATEGORY_DISPLAY_ORDER], []);

  const toFileName = (value) =>
    value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_");

  const categoryOptions = useMemo(() => {
    return categories
      .filter((name) => name !== "Modernism")
      .map((name) => {
        const label = name === "All" ? "All Categories" : name;
        const candidates = [
          CATEGORY_IMAGE_MAP[name],
          CATEGORY_IMAGE_MAP[label],
          categoryImages[`/src/assets/category_icon/${toFileName(name)}.avif`],
          categoryImages[`/src/assets/category_icon/${toFileName(label)}.avif`],
          DEFAULT_CATEGORY_IMG,
        ];
        const imgSrc = candidates.find(Boolean) || null;
        return { value: name, label, imgSrc };
      });
  }, [categories]);

  const orderedCategoryOptions = useMemo(() => {
    const priority = new Map(CATEGORY_DISPLAY_ORDER.map((name, index) => [name, index]));
    const baseIndex = priority.size;
    return categoryOptions
      .map((option, index) => ({ option, index }))
      .sort((a, b) => {
        const aIndex = priority.has(a.option.value) ? priority.get(a.option.value) : baseIndex + a.index;
        const bIndex = priority.has(b.option.value) ? priority.get(b.option.value) : baseIndex + b.index;
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.option.label.localeCompare(b.option.label);
      })
      .map(({ option }) => option);
  }, [categoryOptions]);

  const handleReverseSearchClick = () => imageInputRef.current?.click();

  const handleFilterToggle = (section, option) => {
    setFilters((prev) => {
      const nextSet = new Set(prev[section] || []);
      if (nextSet.has(option)) nextSet.delete(option);
      else nextSet.add(option);
      return { ...prev, [section]: nextSet };
    });
  };

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageSearching(true);
    setImageStatus("Analysing image...");
    try {
      const result = await analyzeImage(file);
      setImagePreview(result.dataUrl);
      setImageKeywords(result.keywords);
      setImageStatus(`Reverse search matched keywords: ${result.keywords.join(", ")}`);
    } catch (err) {
      console.error("Reverse image search failed", err);
      setImageStatus(err?.message || "Could not analyse the image.");
      setImageKeywords([]);
      setImagePreview(null);
    } finally {
      setImageSearching(false);
      if (event.target) event.target.value = "";
    }
  };

  const filteredByFilters = useMemo(() => {
    const base = studios.filter((s) => {
      if (selectedCategory === "All") return true;
      const catList = (s.categories || []).map(String);
      return catList.includes(selectedCategory);
    });

    const mkHaystack = (s) =>
      [
        s.title, s.summary, s.description, s.style, s.typology, s.programType, s.program,
        (s.categories || []).join(" "),
        (s.tags || []).join(" "),
        (s.features || []).join(" "),
        (s.metadata?.keywords || []).join(" "),
        s.firm?.name,
        (s.firm?.styles || []).join(" "),
        (s.firm?.specialisations || []).join(" "),
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());

    const everyCheckboxMatch = (s) => {
      const hay = mkHaystack(s);
      const serviceSignals = deriveServiceSignals(s);
      if (!matchesServiceFocus(serviceSignals, serviceFocus)) return false;
      if (filters["Typology"]?.size) {
        const ok = Array.from(filters["Typology"]).some((needle) =>
          hay.some((h) => h.includes(String(needle).toLowerCase()))
        );
        if (!ok) return false;
      }
      for (const sec of AMAZON_FILTER_SECTIONS) {
        if (sec === "Typology") continue;
        const set = filters[sec];
        if (!set?.size) continue;
        const ok = Array.from(set).some((needle) =>
          hay.some((h) => h.includes(String(needle).toLowerCase()))
        );
        if (!ok) return false;
      }
      return true;
    };

    const withinRanges = (s) => {
      const price = resolvePrice(s);
      const sqft  = resolveSqft(s);
      const floors = resolveFloors(s);
      const progs  = resolveProgramsCount(s);

      const inPrice   = price == null  ? true : (priceSel[0]  <= price && price <= priceSel[1]);
      const inSqft    = sqft == null   ? true : (sqftSel[0]   <= sqft  && sqft  <= sqftSel[1]);
      const inFloors  = floors == null ? true : (floorsSel[0] <= floors &&  floors<= floorsSel[1]);
      const inPrograms= progs == null  ? true : (programsSel[0]<= progs && progs <= programsSel[1]);

      return inPrice && inSqft && inFloors && inPrograms;
    };

    return base.filter((s) => everyCheckboxMatch(s) && withinRanges(s));
  }, [studios, selectedCategory, filters, priceSel, sqftSel, floorsSel, programsSel, serviceFocus]);

  const sortedStudios = useMemo(() => {
    const list = filteredByFilters.slice();

    if (sortOrder === "price-asc" || sortOrder === "price-desc") {
      const ascending = sortOrder === "price-asc";
      list.sort((a, b) => {
        const aPrice = resolvePrice(a);
        const bPrice = resolvePrice(b);
        if (aPrice == null && bPrice == null) return 0;
        if (aPrice == null) return 1;
        if (bPrice == null) return -1;
        return ascending ? aPrice - bPrice : bPrice - aPrice;
      });
      return list;
    }

    if (sortOrder === "rating-desc") {
      list.sort((a, b) => {
        const aRating = resolveRating(a) ?? 0;
        const bRating = resolveRating(b) ?? 0;
        if (bRating !== aRating) return bRating - aRating;

        const aPrice = resolvePrice(a);
        const bPrice = resolvePrice(b);
        if (aPrice == null && bPrice == null) return 0;
        if (aPrice == null) return 1;
        if (bPrice == null) return -1;
        return aPrice - bPrice;
      });
      return list;
    }

    return list;
  }, [filteredByFilters, sortOrder]);

  // Apply reverse-image keyword filter
  const displayStudios = useMemo(() => {
    if (!imageKeywords.length) return sortedStudios;
    const needles = imageKeywords.map((kw) => kw.toLowerCase());
    return sortedStudios.filter((studio) => {
      const haystackParts = [
        studio.title, studio.summary, studio.description, studio.style, studio.typology, studio.programType,
        ...(studio.categories || []), ...(studio.tags || []), ...(studio.features || []),
        studio.firm?.name, ...(studio.firm?.styles || []),
      ].filter(Boolean).map((v) => String(v).toLowerCase());
      return needles.some((needle) => haystackParts.some((part) => part.includes(needle)));
    });
  }, [sortedStudios, imageKeywords]);

  // Reset client-side pagination when result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [displayStudios.length, selectedCategory, sortOrder, debouncedQuery, serviceFocus]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let n = 0;
    for (const value of Object.values(filters)) {
      if (value instanceof Set && value.size) n += value.size;
    }
    const ranges = [
      [priceSel, priceRange],
      [sqftSel, sqftRange],
      [floorsSel, floorsRange],
      [programsSel, programsRange],
    ];
    for (const [sel, rng] of ranges) {
      if (sel[0] !== rng[0] || sel[1] !== rng[1]) n += 1;
    }
        if (serviceFocus !== 'all') n += 1;
    return n;
  }, [filters, priceSel, priceRange, sqftSel, sqftRange, floorsSel, floorsRange, programsSel, programsRange, serviceFocus]);

  // Grid class responsive tweak
  const listingsGridClass = useMemo(
    () =>
      filtersOpen
        ? "grid w-full auto-rows-fr gap-5 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid w-full auto-rows-fr gap-5 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    [filtersOpen]
  );

  const listingsContainerClass = useMemo(
    () => (filtersOpen ? "mx-auto w-full max-w-5xl" : "mx-auto w-full max-w-6xl"),
    [filtersOpen]
  );

  // Skeleton placeholder
  const SkeletonCard = () => (
    <div className="animate-pulse h-full overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="aspect-[4/3] w-full bg-slate-200" />
      <div className="p-6 space-y-3">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-5 w-3/4 bg-slate-200 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 rounded" />
        <div className="h-8 w-full bg-slate-200 rounded" />
      </div>
    </div>
  );

  // Animation helpers
  const initialAnim = prefersReducedMotion ? {} : { opacity: 0, y: 20 };
  const inViewAnim = prefersReducedMotion ? {} : { opacity: 1, y: 0 };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-[Montserrat]">
      {/* Inject slider + drawer CSS once */}
      <style dangerouslySetInnerHTML={{ __html: SLIDER_CSS }} />
      <RegistrStrip />

      {/* Sticky small-screen actions */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 border-b border-slate-200 safe-bottom">
        <div className="max-w-screen-2xl mx-auto px-3 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Filters{activeFilterCount ? <span className="ml-1 text-xs text-slate-500">({activeFilterCount})</span> : null}
          </button>
          <div className="relative flex-1">
            <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search studios, locations, deliverables"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              inputMode="search"
            />
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
            aria-label="Sort studios"
          >
            <option value="">Sort</option>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-screen-2xl mx-auto px-3 md:px-4 lg:px-6 py-6 md:py-8 w-full">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">

          {/* Desktop Collapsible Filters Sidebar */}
          <aside
            className={`hidden lg:block order-1 lg:order-none transition-[width] duration-300 ease-out flex-shrink-0
              ${filtersOpen ? "w-72 xl:w-80" : "w-0"} overflow-hidden`}
          >
            {filtersOpen && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="text-xs text-slate-600 hover:text-slate-800"
                    >
                      Hide
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(createEmptyFilterState());
                        setSortOrder("");
                        setPriceSel(priceRange);
                        setSqftSel(sqftRange);
                        setFloorsSel(floorsRange);
                        setProgramsSel(programsRange);
                        setServiceFocus('all');
                      }}
                      className="text-xs text-slate-600 hover:text-slate-800"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {/* Typology */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => toggleSection("Typology")}
                    className="text-left text-sm font-semibold text-slate-700 mb-2 w-full flex items-center gap-2"
                  >
                    <span className={`inline-block transition-transform ${collapsed["Typology"] ? "rotate-0" : "rotate-90"}`}>{"\u203A"}</span>
                    Typology {selectedCategory !== "All" && <span className="text-slate-400">(for {selectedCategory})</span>}
                  </button>
                  <div className={collapsed["Typology"] ? "hidden" : "space-y-1 max-h-56 overflow-auto pr-1"}>
                    {(selectedCategory === "All"
                      ? Object.entries(TYPOLOGIES_BY_CATEGORY).flatMap(([category, entries]) =>
                          entries.map((option) => ({ category, option }))
                        )
                      : (TYPOLOGIES_BY_CATEGORY[selectedCategory] || []).map((option) => ({
                          category: selectedCategory,
                          option,
                        }))
                    ).map(({ category, option }, index) => (
                      <label
                        key={`${category}-${option}-${index}`}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-slate-800"
                          checked={!!filters["Typology"]?.has(option)}
                          onChange={() => handleFilterToggle("Typology", option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <DualRange
                    id="price"
                    label="Price"
                    domain={priceRange}
                    value={priceSel}
                    onChange={setPriceSel}
                    format={(n) => n.toLocaleString()}
                    step={1}
                  />
                </div>
                <div className="px-4 py-3 border-b border-slate-100">
                  <DualRange
                    id="sqft"
                    label="Area (sq ft)"
                    domain={sqftRange}
                    value={sqftSel}
                    onChange={setSqftSel}
                    step={10}
                  />
                </div>
                <div className="px-4 py-3 border-b border-slate-100">
                  <DualRange
                    id="floors"
                    label="Number of Floors"
                    domain={floorsRange}
                    value={floorsSel}
                    onChange={setFloorsSel}
                    step={1}
                  />
                </div>
                <div className="px-4 py-3 border-b border-slate-100">
                  <DualRange
                    id="programs"
                    label="Number of Programs"
                    domain={programsRange}
                    value={programsSel}
                    onChange={setProgramsSel}
                    step={1}
                  />
                </div>

                {/* Checkbox sections */}
                {AMAZON_FILTER_SECTIONS.filter((s) => s !== "Typology").map((section) => (
                  <div key={section} className="px-4 py-3 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleSection(section)}
                      className="text-left text-sm font-semibold text-slate-700 mb-2 w-full flex items-center gap-2"
                    >
                      <span className={`inline-block transition-transform ${collapsed[section] ? "rotate-0" : "rotate-90"}`}>{"\u203A"}</span>
                      {section}
                    </button>
                    <div className={collapsed[section] ? "hidden" : "space-y-1 max-h-48 overflow-auto pr-1"}>
                      {(AMAZON_OPTIONS[section] || []).map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-slate-800"
                            checked={!!filters[section]?.has(opt)}
                            onChange={() => handleFilterToggle(section, opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-8 order-2 lg:order-none">
            {/* Desktop top controls */}
            <section className="hidden lg:block bg-transparent border-0 rounded-none shadow-none">
              <div className="flex items-center justify-center gap-4 overflow-x-auto px-1 sm:px-2 py-3 sm:py-4">
                {orderedCategoryOptions.map(({ value, label, imgSrc }) => {
                  const isActive = selectedCategory === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedCategory(value)}
                      aria-pressed={isActive}
                      className={`group flex min-w-[96px] flex-col items-center gap-2 px-2 py-1 text-sm font-medium transition ${
                        isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <img
                        src={imgSrc || DEFAULT_CATEGORY_IMG}
                        alt={label}
                        className="h-10 w-10 object-contain"
                        loading="lazy"
                      />
                      <span className="whitespace-nowrap text-xs font-medium tracking-tight">
                        {label}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`block h-0.5 w-8 rounded-full transition ${
                          isActive ? "bg-slate-900" : "bg-transparent"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 px-1 sm:px-2 py-2 lg:flex-row lg:items-center">
                <div className="w-full lg:w-56">
                  <label htmlFor="studio-sort-select" className="sr-only">Sort by</label>
                  <select
                    id="studio-sort-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-0"
                  >
                    <option value="">Sort by</option>
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for studios, locations, or deliverables"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-700 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                      inputMode="search"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReverseSearchClick}
                      disabled={imageSearching}
                      className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {imageSearching ? "Scanning..." : "Reverse image"}
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelected}
                    />
                  </div>
                </div>
              </div>
            </section>

            {(imageStatus || imagePreview || imageKeywords.length > 0) && (
              <section className="bg-white border border-slate-200 rounded-xl px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-700">Reverse image search</p>
                  <p className="text-slate-500">
                    {imageStatus || "Upload a reference to discover similar catalogue items."}
                  </p>
                  {imageKeywords.length > 0 && (
                    <p className="text-slate-400 text-xs uppercase tracking-wide">
                      Matched keywords: {imageKeywords.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Reverse search preview"
                      className="w-16 h-16 rounded-lg border border-slate-200 object-cover"
                      loading="lazy"
                    />
                  )}
                  {imageKeywords.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setImageKeywords([]); setImagePreview(null); setImageStatus(""); }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Result header */}
            {!loading && !error && (
              <div className="flex items-center justify-between text-sm px-1 sm:px-2">
                <div className="text-slate-600">
                  Showing <span className="font-semibold text-slate-900">
                    {Math.min(visibleCount, displayStudios.length)}
                  </span>{" "}
                  of <span className="font-semibold text-slate-900">{displayStudios.length}</span> results
                </div>
                <div className="hidden lg:flex items-center gap-3">
                  {!filtersOpen && (
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(true)}
                      className="rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-md transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                      Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
                    </button>
                  )}
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(createEmptyFilterState());
                        setSortOrder("");
                        setPriceSel(priceRange);
                        setSqftSel(sqftRange);
                        setFloorsSel(floorsRange);
                        setProgramsSel(programsRange);
                        setServiceFocus('all');
                      }}
                      className="text-xs text-slate-600 hover:text-slate-800"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Skeletons */}
            {loading && (
              <section className={`${listingsContainerClass} ${listingsGridClass}`}>
                {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
              </section>
            )}

            {!loading && activeSource === "marketplace" && web3Meta && !marketplaceState.fallback && (
              <div className={`${listingsContainerClass} rounded-2xl border border-indigo-200 bg-indigo-900/95 px-6 py-5 text-indigo-100 shadow-sm`}>
                <p className="text-[11px] uppercase tracking-[0.35em] text-indigo-300">
                  On-chain studio proofs
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    {web3Meta.total ?? 0} studio drops verified on {web3Meta.chain ?? "Polygon"}
                  </h2>
                  {Array.isArray(web3Meta.anchors) && web3Meta.anchors.length > 0 ? (
                    <p className="text-xs text-indigo-200">
                      Latest anchors: {web3Meta.anchors.slice(0, 3).join(" | ")}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Responsive, dynamic grid */}
            {!loading && (
              <section className={`${listingsContainerClass} ${listingsGridClass}`}>
                {displayStudios.slice(0, visibleCount).map((studio) => {
                  const href = studio.slug
                    ? `/studio/${studio.slug}`
                    : `/studio/${encodeURIComponent(studio.id)}`;

                  const priceLabel =
                    studio.priceSqft ?? studio.pricing?.basePrice ?? studio.price ?? null;
                  const currency = studio.currency || studio.pricing?.currency || "USD";

                  const summarySource =
                    studio.summary || studio.description ||
                    "Explore the full catalogue to review deliverables, pricing, and project precedents.";
                  const summaryPreview =
                    summarySource.length > 180 ? `${summarySource.slice(0, 177)}...` : summarySource;

                  const firmLogo = studio.logo || studio.firm?.logo;
                  const stylesList = [
                    studio.style,
                    ...(studio.styles || []),
                    ...(studio.firm?.styles || []),
                  ].flat().filter(Boolean);
                  const uniqueStyles = Array.from(new Set(stylesList.map(String)));
                  const primaryStyle = uniqueStyles[0] || null;

                  const areaValue = resolveSqft(studio);
                  const plotAreaValue = resolvePlotAreaSqft(studio);
                  const ratingValue = resolveRating(studio);
                  const floorsValue = resolveFloors(studio);
                  const programsValue = resolveProgramsCount(studio);
                  const roomsValue = resolveRoomsCount(studio);
                  const heroImage = getStudioImageUrl(studio);
                  const heroFallback = getStudioFallback(studio);

                  const priceUnit =
                    studio.pricing?.unit || studio.pricing?.unitLabel || studio.unit || "sq ft";
                  const normalizedUnit = normalizeUnit(priceUnit) || "unit";
                  const formattedPrice =
                    priceLabel != null && Number.isFinite(Number(priceLabel))
                      ? Number(priceLabel).toLocaleString(undefined, { maximumFractionDigits: 0 })
                      : priceLabel;

                  const firmHosting = studio.firm?.hosting || null;
                  const overlayTilesSource = (() => {
                    if (firmHosting?.products?.length) return firmHosting.products;
                    if (firmHosting?.services?.length) return firmHosting.services;
                    return hostingTiles.products;
                  })();
                  const overlayTiles = (overlayTilesSource || []).slice(0, 2);
                  const bodyTiles = (firmHosting?.services?.length ? firmHosting.services : hostingTiles.services).slice(0, 2);

                  const supportingText = studio.firm?.bio || studio.bio || summaryPreview;
                  const firmName = resolveFirmName(studio);
                  const firmCountry = resolveFirmCountry(studio);
                  const primaryCategory = resolvePrimaryCategory(studio);
                  const climate = resolveClimate(studio);
                  const terrain = resolveTerrain(studio);
                  const areaToken = (() => {
                    const raw = plotAreaValue ?? areaValue;
                    if (raw == null || !Number.isFinite(Number(raw))) return null;
                    return `${Number(raw).toLocaleString()} sq ft`;
                  })();
                  const serviceSignals = deriveServiceSignals(studio);
                  const practiseBadgesSource = Array.isArray(studio.practiceBadges)
                    ? studio.practiceBadges
                    : Array.isArray(studio.firm?.practiceBadges)
                    ? studio.firm.practiceBadges
                    : [];
                  const practiseBadges = (practiseBadgesSource.length ? practiseBadgesSource : serviceSignals.badges).filter(Boolean);
                  const readinessFlags = [];
                  if (serviceSignals.sellsPlans) {
                    readinessFlags.push({ id: "plan-ready", label: "Plan-ready", tone: "emerald" });
                  }
                  if (serviceSignals.designBuild) {
                    readinessFlags.push({ id: "design-build", label: "Design-build ready", tone: "amber" });
                  }
                  const metaPills = [
                    { id: "category", label: "Category", value: primaryCategory },
                    { id: "style", label: "Style", value: primaryStyle },
                    { id: "plot", label: "Plot", value: areaToken },
                    { id: "climate", label: "Climate", value: climate },
                    { id: "terrain", label: "Terrain", value: terrain },
                  ].filter((pill) => pill.value);
                  const contactEmail =
                    studio.firm?.contact?.email ||
                    studio.contactEmail ||
                    studio.inquiriesEmail ||
                    studio.pointOfContact?.email ||
                    null;
                  const contactCtaLabel = contactEmail ? "Share brief" : "View services";
                  const programTokens = [
                    Number.isFinite(roomsValue)
                      ? `${roomsValue} room${roomsValue === 1 ? "" : "s"}`
                      : null,
                    Number.isFinite(programsValue)
                      ? `${programsValue} program${programsValue === 1 ? "" : "s"}`
                      : null,
                    Number.isFinite(floorsValue)
                      ? `${floorsValue} floor${floorsValue === 1 ? "" : "s"}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" | ");

                  return (
                    <MotionArticle
                      key={studio._id || studio.slug || studio.id}
                      initial={initialAnim}
                      animate={inViewAnim}
                      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                      role="link"
                      tabIndex={0}
                      onClick={(event) => {
                        if (event.defaultPrevented) return;
                        navigate(href);
                      }}
                      onKeyDown={(event) => {
                        if (
                          (event.key === "Enter" || event.key === " ") &&
                          event.currentTarget === event.target
                        ) {
                          event.preventDefault();
                          navigate(href);
                        }
                      }}
                    >
                      <Link
                        to={href}
                        onClick={(event) => event.stopPropagation()}
                        className="relative aspect-[4/3] w-full overflow-hidden"
                      >
                        <img
                          src={heroImage}
                          alt={studio.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(event) => applyFallback(event, heroFallback)}
                        />
                        {overlayTiles.length > 0 && (
                          <div className="absolute left-3 top-3 flex max-w-[90%] flex-wrap gap-2">
                            {overlayTiles.map((tile, index) => (
                              <span
                                key={`overlay-${studio.slug || studio.id}-${tile.id || index}`}
                                className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                              >
                                {tile.label}
                              </span>
                            ))}
                          </div>
                        )}
                        {Array.isArray(studio.highlights) && studio.highlights.length > 0 && (
                          <div className="absolute bottom-3 left-3 flex max-w-[90%] flex-wrap gap-2">
                            {studio.highlights.slice(0, 2).map((highlight, index) => (
                              <span
                                key={`highlight-${studio.slug || studio.id}-${index}`}
                                className="rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col gap-5 p-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
                                {firmName || "Verified studio"}
                              </p>
                              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-tight line-clamp-2">
                                <Link
                                  to={href}
                                  onClick={(event) => event.stopPropagation()}
                                  className="text-slate-900 hover:text-slate-700 transition"
                                >
                                  {studio.title}
                                </Link>
                              </h2>
                              {firmCountry && (
                                <p className="text-xs text-slate-500">{firmCountry}</p>
                              )}
                              {studio.status ? (
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                      studio.status === "published"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-amber-200 bg-amber-50 text-amber-800"
                                    }`}
                                  >
                                    {studio.status === "published" ? "Published" : "Draft"}
                                  </span>
                                </div>
                              ) : null}
                              {studio.firm?.tagline && (
                                <p className="text-xs text-slate-500">{studio.firm.tagline}</p>
                              )}
                            </div>
                            {firmLogo ? (
                              <img
                                src={firmLogo}
                                alt={`${firmName || studio.title} logo`}
                                className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-full border border-slate-200 bg-white object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>

                          {Number.isFinite(ratingValue) && (
                            <div className="flex items-center gap-1 text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <AiFillStar
                                  key={i}
                                  className={`h-4 w-4 ${i < Math.round(ratingValue ?? 0) ? "text-amber-500" : "text-slate-300"}`}
                                />
                              ))}
                              <span className="ml-1 text-xs text-slate-500">
                                {(ratingValue ?? 0).toFixed(1)}
                              </span>
                            </div>
                          )}

                          {practiseBadges.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {practiseBadges.slice(0, 4).map((badge, index) => (
                                <span
                                  key={`practise-${studio.slug || studio.id}-${badge}-${index}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-slate-900/10 px-2.5 py-1 text-[11px] font-semibold text-slate-800"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-800" aria-hidden="true" />
                                  {badge}
                                </span>
                              ))}
                            </div>
                          )}

                          {bodyTiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {bodyTiles.map((tile, index) => (
                                <span
                                  key={`hosting-chip-${studio.slug || studio.id}-${tile.id || index}`}
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                                >
                                  {tile.label}
                                </span>
                              ))}
                            </div>
                          )}

                          {metaPills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {metaPills.map((pill) => (
                                <span
                                  key={`meta-${studio.slug || studio.id}-${pill.id}`}
                                  className="inline-flex min-w-[110px] flex-col rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
                                >
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                                    {pill.label}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                                    {pill.value}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}

                          {Array.isArray(studio.firm?.services) && studio.firm.services.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {studio.firm.services.slice(0, 4).map((service, index) => {
                                const serviceLabel =
                                  typeof service === "string"
                                    ? service
                                    : service?.title || service?.name || service?.description;
                                if (!serviceLabel) return null;
                                const serviceKey =
                                  typeof service === "string"
                                    ? service
                                    : service?._id || service?.title || service?.name || index;
                                return (
                                  <span
                                    key={`service-${studio.slug || studio.id}-${serviceKey}`}
                                    className="rounded-full bg-slate-900/10 px-2.5 py-1 text-xs font-medium text-slate-600"
                                  >
                                    {serviceLabel}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {readinessFlags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {readinessFlags.map((flag) => {
                                const toneClass =
                                  flag.tone === "emerald"
                                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                    : flag.tone === "amber"
                                    ? "border-amber-100 bg-amber-50 text-amber-700"
                                    : "border-slate-200 bg-slate-50 text-slate-700";
                                return (
                                  <span
                                    key={`readiness-${studio.slug || studio.id}-${flag.id}`}
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                                    {flag.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {programTokens && (
                            <p className="text-xs text-slate-500">{programTokens}</p>
                          )}
                          {studio.web3Proof?.explorerUrl && (
                            <a
                              href={studio.web3Proof.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-medium text-indigo-500 hover:text-indigo-400"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <span className="h-2 w-2 rounded-full bg-indigo-400" />
                              Verified on-chain | {studio.web3Proof.anchor}
                            </a>
                          )}
                        </div>

                        <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                          {supportingText}
                        </p>

                        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                          {studio.firm?.contact?.email && (
                            <a
                              href={`mailto:${studio.firm.contact.email}`}
                              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Email firm
                            </a>
                          )}
                          {studio.firm?.contact?.phone && (
                            <span className="inline-flex items-center gap-2">
                              {studio.firm.contact.phone}
                            </span>
                          )}
                          {studio.firm?.website && (
                            <a
                              href={studio.firm.website}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Visit website
                            </a>
                          )}
                        </div>

                        <div className="mt-auto space-y-4">
                          <div className="flex flex-wrap items-end justify-between gap-3">
                            {priceLabel ? (
                              <p className="text-base font-semibold text-slate-900">
                                {currency} {formattedPrice}
                                <span className="ml-1 text-xs font-normal text-slate-500">
                                  / {normalizedUnit}
                                </span>
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-slate-500">Price on request</p>
                            )}
                            {areaToken && (
                              <p className="text-xs text-slate-500">{areaToken}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Link
                              to={href}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex flex-1 min-w-[140px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                            >
                              View studio
                            </Link>
                            {contactEmail ? (
                              <a
                                href={`mailto:${contactEmail}`}
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex flex-1 min-w-[140px] items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                              >
                                {contactCtaLabel}
                              </a>
                            ) : (
                              <Link
                                to={href}
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex flex-1 min-w-[140px] items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                              >
                                {contactCtaLabel}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </MotionArticle>
                  );
                })}
              </section>
            )}

            {/* Load more */}
            {!loading && displayStudios.length > visibleCount && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400"
                >
                  Load more
                </button>
              </div>
            )}

            {!loading && displayStudios.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                No studios match these filters. Try adjusting the filters or search keywords.
              </div>
            )}

            <section className="">
              <div className="grid md:grid-cols-3 gap-8">
                {marketplaceFeatures.map((feature) => (
                  <div key={feature.title}>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Studio;



