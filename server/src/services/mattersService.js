import { randomUUID } from 'crypto';
import {
  MattersMode,
  MattersInventoryItem,
  MattersFinanceRecord,
  MattersGalleryAsset,
  MattersInsight,
  MattersRisk,
  MattersIncident,
  MattersDrill,
  MattersWeather,
  MattersSystem,
  MattersConfig,
  MattersDelivery,
} from '../models/matters/index.js';

const deepClone = (value) => JSON.parse(JSON.stringify(value));
const nowISO = () => new Date().toISOString();

const seedTimestamp = '2024-10-14T08:00:00.000Z';

const modes = [
  {
    id: 'design',
    name: 'design',
    label: 'Design Mode',
    description: 'Coordinate design deliverables, approvals, and creative assets.',
    color: '#7C3AED',
    icon: 'sparkles',
    order: 1,
    is_default: true,
    dashboard_sections: ['weather-insight', 'design-kpis', 'collaboration'],
    metrics: {
      activeProjects: 12,
      approvalsAwaiting: 3,
      avgRevisionTimeDays: 2.4,
    },
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'construction',
    name: 'construction',
    label: 'Construction Mode',
    description: 'Track site logistics, crew readiness, and material delivery windows.',
    color: '#0EA5E9',
    icon: 'hammer',
    order: 2,
    dashboard_sections: ['site-weather', 'safety', 'inventory-health'],
    metrics: {
      crewsOnSite: 5,
      equipmentUptimePct: 96.2,
      inspectionRisks: 1,
    },
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'procurement',
    name: 'procurement',
    label: 'Procurement',
    description: 'Monitor sourcing status, supplier SLAs, and delivery commitments.',
    color: '#22C55E',
    icon: 'shopping-cart',
    order: 3,
    dashboard_sections: ['supplier-health', 'budget-watch', 'contracts'],
    metrics: {
      openPos: 18,
      lateDeliveries: 2,
      preferredSuppliers: 8,
    },
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'site-monitoring',
    name: 'site-monitoring',
    label: 'Site Monitoring',
    description: 'Surface live feeds, safety alerts, and environmental thresholds.',
    color: '#F97316',
    icon: 'camera',
    order: 4,
    dashboard_sections: ['safety-alerts', 'environmental', 'progress-tracking'],
    metrics: {
      activeCameras: 14,
      safetyAlertsToday: 0,
      noiseLevelDb: 68,
    },
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
];

const systems = [
  { id: 'design-suite', name: 'Design Coordination Suite' },
  { id: 'tower-crane', name: 'Tower Crane TC-90' },
  { id: 'hvac-phase', name: 'HVAC Phase Deployment' },
  { id: 'safety-compliance', name: 'Safety Compliance Ops' },
  { id: 'logistics', name: 'Logistics Command Center' },
];

const inventory = [
  {
    id: 'inv-1',
    mode: 'construction',
    name: 'Concrete Mix M40',
    category: 'Materials',
    quantity: 120,
    unit: 'bags',
    location: 'Warehouse - Bay 3',
    status: 'available',
    supplier: 'ReadyMix Corp',
    notes: 'Batch expires in 10 days, prioritise Site A pour.',
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'inv-2',
    mode: 'construction',
    name: 'Tower Crane TC-90',
    category: 'Equipment',
    quantity: 1,
    unit: 'unit',
    location: 'Site B',
    status: 'maintenance',
    supplier: 'LiftSys Rentals',
    notes: 'Scheduled maintenance on Friday 10:00.',
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'inv-3',
    mode: 'design',
    name: 'Interior Finish Palette V5',
    category: 'Assets',
    quantity: 1,
    unit: 'package',
    location: 'Figma Workspace',
    status: 'in-review',
    supplier: 'Design Ops',
    notes: 'Awaiting client feedback for penthouse units.',
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'inv-4',
    mode: 'procurement',
    name: 'HVAC Air Handling Units',
    category: 'Materials',
    quantity: 6,
    unit: 'units',
    location: 'In transit - ETA 3 days',
    status: 'delayed',
    supplier: 'ClimatePro Supply',
    notes: 'Carrier reports weather delay, monitor daily.',
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'inv-5',
    mode: 'site-monitoring',
    name: 'Thermal Camera Kit',
    category: 'Equipment',
    quantity: 4,
    unit: 'sets',
    location: 'Roof Staging Area',
    status: 'available',
    supplier: 'SecureSight Sensors',
    notes: 'Allocate two units to night crew.',
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
];
const deliveries = [
  {
    id: 'del-1',
    mode: 'construction',
    label: 'Floor finish batch A2',
    note: 'Arrives in ~4 hrs',
    eta: '2024-12-28T14:00:00Z',
    status: 'en route',
  },
  {
    id: 'del-2',
    mode: 'construction',
    label: 'Lighting pod fixtures',
    note: '3 units queued',
    eta: '2024-12-28T18:00:00Z',
    status: 'queued',
  },
  {
    id: 'del-3',
    mode: 'procurement',
    label: 'Utility turnout dossier',
    note: 'Messenger pick-up 09:00',
    eta: '2024-12-29T09:00:00Z',
    status: 'scheduled',
  },
];

const actions = [
  {
    id: 'act-1',
    mode: 'construction',
    title: 'Verify AV rough-ins on level 12',
    owner: 'QA team',
    status: 'pending',
    eta: '2024-12-28T10:30:00Z',
    impact: 'HIGH',
    tags: ['MEP', 'Quality'],
    description: 'Confirm conduit spacing before ceiling close-out.',
  },
  {
    id: 'act-2',
    mode: 'construction',
    title: 'Replace damaged louvers along facade stack B',
    owner: 'Envelope crew',
    status: 'in-progress',
    eta: '2024-12-29T06:00:00Z',
    impact: 'MEDIUM',
    tags: ['Facade'],
    description: 'Swap louvers before panel sealant cure.',
  },
  {
    id: 'act-3',
    mode: 'design',
    title: 'Assemble utility turnout dossier',
    owner: 'Design ops',
    status: 'blocked',
    eta: '2025-01-02T12:00:00Z',
    impact: 'HIGH',
    tags: ['Docs', 'Permitting'],
    description: 'Waiting on updated stamped elevations from MEP.',
  },
  {
    id: 'act-4',
    mode: 'procurement',
    title: 'Run safety induction for swing shift',
    owner: 'HSE',
    status: 'pending',
    eta: '2024-12-29T05:30:00Z',
    impact: 'MEDIUM',
    tags: ['Safety'],
    description: 'Brief crews on new hoist sequencing.',
  },
  {
    id: 'act-5',
    mode: 'site-monitoring',
    title: 'Calibrate thermal cameras',
    owner: 'Monitoring team',
    status: 'done',
    eta: '2024-12-27T04:00:00Z',
    impact: 'LOW',
    tags: ['Sensors'],
    description: 'Completed nightly calibration on deck sensors.',
  },
];

const permits = [
  {
    id: 'permit-1',
    mode: 'construction',
    title: 'Phase 3 structural certificate',
    authority: 'Kaduna Development Authority',
    owner: 'Aisha Bello',
    due: '2025-01-04',
    status: 'watch',
    stage: 'Awaiting stamped load calculations',
    deliverables: ['Upload seismic calc addendum', 'Confirm egress update'],
    attachments: 4,
    lastTouch: '2024-12-29T09:30:00Z',
  },
  {
    id: 'permit-2',
    mode: 'construction',
    title: 'Fire suppression tie-in',
    authority: 'Federal Fire Service',
    owner: 'Chinedu Ajayi',
    due: '2024-12-28',
    status: 'blocked',
    stage: 'Hold pending pressure test witness',
    deliverables: ['Schedule joint hydro test', 'Share valve schedule'],
    attachments: 6,
    lastTouch: '2024-12-26T16:15:00Z',
  },
  {
    id: 'permit-3',
    mode: 'procurement',
    title: 'Utility easement registration',
    authority: 'Gonin Gora Utility Board',
    owner: 'Maryam Yusuf',
    due: '2025-01-12',
    status: 'cleared',
    stage: 'Signed by land registry',
    deliverables: ['Courier wet copy', 'Upload stamped plans'],
    attachments: 2,
    lastTouch: '2024-12-27T08:00:00Z',
  },
];

const compliancePackages = [
  {
    id: 'comp-1',
    mode: 'construction',
    title: 'Life-safety audit set',
    status: 'review',
    owner: 'Compliance Ops',
    updated_at: '2024-12-27T11:00:00Z',
  },
  {
    id: 'comp-2',
    mode: 'procurement',
    title: 'Utility turnout dossier',
    status: 'assembling',
    owner: 'Permitting',
    updated_at: '2024-12-28T07:30:00Z',
  },
  {
    id: 'comp-3',
    mode: 'design',
    title: 'Hospitality mockup kit',
    status: 'approved',
    owner: 'Design QA',
    updated_at: '2024-12-25T18:45:00Z',
  },
];




const financeRecords = [
  {
    id: 'fin-1',
    mode: 'construction',
    record_type: 'expense',
    category: 'Labor',
    amount: 18400.0,
    currency: 'USD',
    period: '2024-W41',
    status: 'approved',
    due_date: seedTimestamp,
    notes: 'Crew overtime for concrete pour contingency.',
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'fin-2',
    mode: 'design',
    record_type: 'budget',
    category: 'Interior Packages',
    amount: 95000.0,
    currency: 'USD',
    period: 'Q4 2024',
    status: 'baseline',
    notes: 'Allocated for furnishing mockups across phases.',
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'fin-3',
    mode: 'procurement',
    record_type: 'invoice',
    category: 'Steel Supply',
    amount: 128000.0,
    currency: 'USD',
    period: '2024-10',
    status: 'pending-approval',
    due_date: seedTimestamp,
    notes: 'Invoice #INV-48219 from Northern Steel.',
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'fin-4',
    mode: 'site-monitoring',
    record_type: 'expense',
    category: 'Sensors',
    amount: 18650.0,
    currency: 'USD',
    period: '2024-W40',
    status: 'approved',
    notes: 'Thermal camera lease for perimeter coverage.',
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
];

const galleryAssets = [
  {
    id: 'gal-1',
    mode: 'design',
    title: 'Lobby Concept Night Lighting',
    description: 'Updated lighting layers with bronze accents for evening ambience.',
    image_url:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80',
    thumbnail_url:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=60',
    tags: ['render', 'lighting', 'lobby'],
    uploaded_by: 'clare.nguyen',
    uploaded_at: seedTimestamp,
    aspect_ratio: 1.6,
    dominant_color: '#1F2937',
  },
  {
    id: 'gal-2',
    mode: 'construction',
    title: 'Site A Progress - Level 18',
    description: 'Core walls poured, curtain wall install begins Monday.',
    image_url:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
    thumbnail_url:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=60',
    tags: ['site', 'progress', 'structure'],
    uploaded_by: 'henry.ortiz',
    uploaded_at: seedTimestamp,
    aspect_ratio: 1.5,
    dominant_color: '#1E3A8A',
  },
  {
    id: 'gal-3',
    mode: 'procurement',
    title: 'Millwork Mockup Delivery',
    description: 'Cabinetry samples for penthouse suites ready for QA review.',
    image_url:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1600&q=80',
    thumbnail_url:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=400&q=60',
    tags: ['mockup', 'millwork', 'qa'],
    uploaded_by: 'logan.davis',
    uploaded_at: seedTimestamp,
    aspect_ratio: 1.78,
    dominant_color: '#9A3412',
  },
  {
    id: 'gal-4',
    mode: 'site-monitoring',
    title: 'Perimeter Thermal Sweep',
    description: 'Night crew confirming temperature deltas on facade panels.',
    image_url:
      'https://images.unsplash.com/photo-1531835551805-16d864c8d353?auto=format&fit=crop&w=1600&q=80',
    thumbnail_url:
      'https://images.unsplash.com/photo-1531835551805-16d864c8d353?auto=format&fit=crop&w=400&q=60',
    tags: ['thermal', 'night-shift'],
    uploaded_by: 'indra.raj',
    uploaded_at: seedTimestamp,
    aspect_ratio: 1.77,
    dominant_color: '#0F172A',
  },
];

const insights = [
  {
    id: 'ins-1',
    mode: 'construction',
    title: 'Crew Readiness',
    summary:
      'Framing crew cleared for double shift on Wednesday pending weather check at 06:00.',
    source: 'operations',
    tags: ['staffing', 'schedule'],
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'ins-2',
    mode: 'design',
    title: 'Client Feedback Loop',
    summary:
      'Executive review on hospitality suites pushed to Thursday; update boards by EOD Wednesday.',
    source: 'client-relations',
    tags: ['approvals', 'timeline'],
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'ins-3',
    mode: 'procurement',
    title: 'Supplier SLA Watchlist',
    summary:
      'Track lead time variance for facade panels; current buffer is 3 days below target.',
    source: 'analytics',
    tags: ['supply', 'sla'],
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
  {
    id: 'ins-4',
    mode: 'site-monitoring',
    title: 'Noise Threshold Stable',
    summary: 'Perimeter sensors report 68dB average. No mitigation required.',
    source: 'environmental',
    tags: ['noise', 'monitoring'],
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  },
];

const incidents = [
  {
    id: 'inc-1',
    mode: 'construction',
    system_id: 'tower-crane',
    severity: 'High',
    cause: 'Wind gust exceeded safe operating threshold.',
    started_at: '2024-10-13T06:15:00.000Z',
    resolved_at: null,
  },
  {
    id: 'inc-2',
    mode: 'procurement',
    system_id: 'logistics',
    severity: 'Medium',
    cause: 'Supplier QA variance on facade panel coating.',
    started_at: '2024-10-11T10:20:00.000Z',
    resolved_at: '2024-10-12T14:45:00.000Z',
  },
  {
    id: 'inc-3',
    mode: 'design',
    system_id: 'design-suite',
    severity: 'Low',
    cause: 'Revision backlog due to client change requests.',
    started_at: '2024-10-10T08:00:00.000Z',
    resolved_at: null,
  },
];

const risks = [
  {
    id: 'risk-1',
    mode: 'construction',
    title: 'Crane Wind Exposure',
    owner: 'Julia Crane Ops',
    score: 72,
    status: 'open',
    likelihood: 'Likely',
    impact: 'High',
    updated_at: seedTimestamp,
  },
  {
    id: 'risk-2',
    mode: 'procurement',
    title: 'Facade Supplier SLA',
    owner: 'Carlos Procurement',
    score: 64,
    status: 'monitor',
    likelihood: 'Possible',
    impact: 'Medium',
    updated_at: seedTimestamp,
  },
  {
    id: 'risk-3',
    mode: 'site-monitoring',
    title: 'Thermal Sensor Drift',
    owner: 'Lina Ops',
    score: 58,
    status: 'open',
    likelihood: 'Possible',
    impact: 'Medium',
    updated_at: seedTimestamp,
  },
];

const drills = [
  {
    id: 'drill-1',
    mode: 'construction',
    name: 'Tower Crane High-Wind Drill',
    system_id: 'tower-crane',
    scheduled_at: '2024-10-18T07:30:00.000Z',
    outcome: 'pending',
  },
  {
    id: 'drill-2',
    mode: 'design',
    name: 'Emergency Layout Revision Run',
    system_id: 'design-suite',
    scheduled_at: '2024-10-16T15:00:00.000Z',
    outcome: 'completed',
  },
  {
    id: 'drill-3',
    mode: 'site-monitoring',
    name: 'Thermal Sweep Protocol',
    system_id: 'safety-compliance',
    scheduled_at: '2024-10-17T21:00:00.000Z',
    outcome: 'pending',
  },
];

const kpisByMode = {
  design: {
    uptime_pct: 99.1,
    avg_mttr_min: 38,
    rto_ok_pct: 94,
    rpo_ok_pct: 92,
    incidents_30d: 3,
  },
  construction: {
    uptime_pct: 98.2,
    avg_mttr_min: 62,
    rto_ok_pct: 96,
    rpo_ok_pct: 93,
    incidents_30d: 5,
  },
  procurement: {
    uptime_pct: 97.5,
    avg_mttr_min: 54,
    rto_ok_pct: 91,
    rpo_ok_pct: 89,
    incidents_30d: 4,
  },
  'site-monitoring': {
    uptime_pct: 99.6,
    avg_mttr_min: 22,
    rto_ok_pct: 98,
    rpo_ok_pct: 97,
    incidents_30d: 2,
  },
};

const weatherByMode = {
  design: {
    location: 'Builtattic Studio, Mumbai',
    temperature: 32,
    units: 'metric',
    conditions: 'Humid with scattered clouds',
    humidity: 68,
    wind_speed: 3.5,
    wind_units: 'm/s',
    insight:
      'Track interior finishes with the current humidity; recommend delaying veneer installation until late evening breeze.',
    provider: 'builtattic-local',
  },
  construction: {
    location: 'Smart Site, Ahmedabad',
    temperature: 35,
    units: 'metric',
    conditions: 'Hot and breezy',
    humidity: 42,
    wind_speed: 5.8,
    wind_units: 'm/s',
    insight:
      'Heat stress window between 14:00-16:00. Rotate concreting crews and mist scaffolding to keep steel cool.',
    provider: 'builtattic-local',
  },
  procurement: {
    location: 'Navi Mumbai Logistics Park',
    temperature: 29,
    units: 'metric',
    conditions: 'Passing showers',
    humidity: 74,
    wind_speed: 4.2,
    wind_units: 'm/s',
    insight:
      'Expect intermittent rain bands; preload waterproof tarps and stagger inbound trucks to avoid queueing at Gate 3.',
    provider: 'builtattic-local',
  },
  'site-monitoring': {
    location: 'Perimeter Deck, Bengaluru',
    temperature: 26,
    units: 'metric',
    conditions: 'Overcast with light drizzle',
    humidity: 80,
    wind_speed: 2.9,
    wind_units: 'm/s',
    insight:
      'Low visibility through dusk; run thermal sweep on every second patrol and log readings for the flood-monitoring dashboard.',
    provider: 'builtattic-local',
  },
};

const chatConfig = {
  provider: 'matrix',
  embed_url: 'https://app.element.io/#/room/#builtattic-matters:matrix.local',
  room_hint: '#matters-control-room',
};

const mattersUser = {
  name: 'Amara Patel',
  email: 'amara.patel@builtattic.com',
  role: 'resilience-director',
};

const seedStore = {
  modes,
  inventory,
  financeRecords,
  galleryAssets,
  insights,
  incidents,
  risks,
  drills,
  deliveries,
  actions,
  permits,
  compliancePackages,
  kpisByMode,
  weatherByMode,
  chatConfig,
  systems,
  user: mattersUser,
};

const sortByDateDesc = (items, field) =>
  [...items].sort((a, b) => new Date(b[field]).getTime() - new Date(a[field]).getTime());

const requireMode = (mode) => {
  if (!seedStore.modes.find((item) => item.name === mode)) {
    const error = new Error(`Mode '${mode}' not found`);
    error.status = 404;
    throw error;
  }
};

const seed_listModes = () => deepClone([...seedStore.modes].sort((a, b) => a.order - b.order));

const seed_getMode = (name) => {
  const mode = seedStore.modes.find((item) => item.name === name);
  if (!mode) {
    const error = new Error(`Mode '${name}' not found`);
    error.status = 404;
    throw error;
  }
  return deepClone(mode);
};

const seed_listInventory = ({ mode, category, status, limit = 50 }) => {
  let items = seedStore.inventory;
  if (mode) items = items.filter((item) => item.mode === mode);
  if (category) items = items.filter((item) => item.category === category);
  if (status) items = items.filter((item) => item.status === status);
  const sorted = sortByDateDesc(items, 'updated_at').slice(0, limit);
  const cloned = deepClone(sorted);
  const incoming = seedStore.deliveries.filter((delivery) =>
    !mode || delivery.mode === mode
  );
  cloned.incoming = deepClone(incoming.slice(0, 6));
  return cloned;
};

const seed_createInventory = (payload) => {
  requireMode(payload.mode);
  const now = nowISO();
  const record = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    ...payload,
  };
  seedStore.inventory.push(record);
  return deepClone(record);
};

const seed_listFinance = ({ mode, record_type, limit = 50 }) => {
  let items = seedStore.financeRecords;
  if (mode) items = items.filter((item) => item.mode === mode);
  if (record_type) items = items.filter((item) => item.record_type === record_type);
  return deepClone(sortByDateDesc(items, 'updated_at').slice(0, limit));
};

const seed_createFinance = (payload) => {
  requireMode(payload.mode);
  const now = nowISO();
  const record = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    ...payload,
  };
  seedStore.financeRecords.push(record);
  return deepClone(record);
};

const seed_listGallery = ({ mode, limit = 24 }) => {
  let items = seedStore.galleryAssets;
  if (mode) items = items.filter((item) => item.mode === mode);
  return deepClone(sortByDateDesc(items, 'uploaded_at').slice(0, limit));
};

const seed_createGalleryAsset = (payload) => {
  requireMode(payload.mode);
  const now = nowISO();
  const record = {
    id: randomUUID(),
    uploaded_at: now,
    ...payload,
  };
  seedStore.galleryAssets.push(record);
  return deepClone(record);
};

const seed_listInsights = ({ mode, tag, limit = 6 }) => {
  let items = seedStore.insights;
  if (mode) items = items.filter((item) => item.mode === mode);
  if (tag) items = items.filter((item) => item.tags?.includes(tag));
  return deepClone(sortByDateDesc(items, 'created_at').slice(0, limit));
};

const seed_createInsight = (payload) => {
  requireMode(payload.mode);
  const now = nowISO();
  const record = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    ...payload,
  };
  seedStore.insights.push(record);
  return deepClone(record);
};

const seed_getChatConfig = () => deepClone(seedStore.chatConfig);

const shouldUseDatabase = (process.env.MATTERS_DB_DISABLED || '').toLowerCase() !== 'true';

let seedPromise;
const ensureSeeded = async () => {
  if (!shouldUseDatabase) return;
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const [
      modeCount,
      inventoryCount,
      financeCount,
      galleryCount,
      insightCount,
      riskCount,
      incidentCount,
      drillCount,
      systemCount,
      configCount,
      weatherCount,
      deliveryCount,
    ] = await Promise.all([
      MattersMode.estimatedDocumentCount(),
      MattersInventoryItem.estimatedDocumentCount(),
      MattersFinanceRecord.estimatedDocumentCount(),
      MattersGalleryAsset.estimatedDocumentCount(),
      MattersInsight.estimatedDocumentCount(),
      MattersRisk.estimatedDocumentCount(),
      MattersIncident.estimatedDocumentCount(),
      MattersDrill.estimatedDocumentCount(),
      MattersSystem.estimatedDocumentCount(),
      MattersConfig.estimatedDocumentCount(),
      MattersWeather.estimatedDocumentCount(),
      MattersDelivery.estimatedDocumentCount(),
    ]);

    const operations = [];
    if (!modeCount) operations.push(MattersMode.insertMany(modes));
    if (!inventoryCount) operations.push(MattersInventoryItem.insertMany(inventory));
    if (!financeCount) operations.push(MattersFinanceRecord.insertMany(financeRecords));
    if (!galleryCount) operations.push(MattersGalleryAsset.insertMany(galleryAssets));
    if (!insightCount) operations.push(MattersInsight.insertMany(insights));
    if (!riskCount) operations.push(MattersRisk.insertMany(risks));
    if (!incidentCount) operations.push(MattersIncident.insertMany(incidents));
    if (!drillCount) operations.push(MattersDrill.insertMany(drills));
    if (!systemCount) operations.push(MattersSystem.insertMany(systems));
    if (!deliveryCount) operations.push(MattersDelivery.insertMany(deliveries));
    if (!configCount) {
      operations.push(
        MattersConfig.create({
          chat_config: seedStore.chatConfig,
          default_user: seedStore.user,
          kpis_by_mode: seedStore.kpisByMode,
        })
      );
    }
    if (!weatherCount) {
      const weatherDocs = Object.entries(seedStore.weatherByMode).map(([mode, record]) => ({
        mode,
        ...record,
      }));
      operations.push(MattersWeather.insertMany(weatherDocs));
    }

    if (operations.length) {
      await Promise.all(operations);
    }
  })().catch((error) => {
    seedPromise = undefined;
    throw error;
  });
  return seedPromise;
};

const aggregateInventoryMetrics = (items) => {
  return items.reduce((acc, item) => {
    const key = item.status || 'unknown';
    if (!acc[key]) acc[key] = { items: 0, quantity: 0 };
    acc[key].items += 1;
    acc[key].quantity += Number(item.quantity || 0);
    return acc;
  }, {});
};

const aggregateFinanceMetrics = (items) => {
  return items.reduce((acc, item) => {
    const key = item.record_type || 'other';
    acc[key] = (acc[key] || 0) + Number(item.amount || 0);
    return acc;
  }, {});
};

const seed_getDashboardSummary = (mode) => {
  requireMode(mode);
  const latestInventory = seed_listInventory({ mode, limit: 4 });
  const latestFinance = seed_listFinance({ mode, limit: 4 });
  const galleryPreview = seed_listGallery({ mode, limit: 4 });
  const insightPreview = seed_listInsights({ mode, limit: 4 });
  const actions = deepClone(seedStore.actions.filter((item) => item.mode === mode).slice(0, 8));
  const permitsForMode = deepClone(seedStore.permits.filter((item) => item.mode === mode).slice(0, 6));
  const compliancePackagesForMode = deepClone(
    seedStore.compliancePackages.filter((pkg) => pkg.mode === mode)
  );
  const deliveriesForMode = deepClone(
    seedStore.deliveries.filter((delivery) => delivery.mode === mode)
  );

  const metrics = {
    inventorySummary: aggregateInventoryMetrics(
      seedStore.inventory.filter((item) => item.mode === mode)
    ),
    financeSummary: aggregateFinanceMetrics(
      seedStore.financeRecords.filter((item) => item.mode === mode)
    ),
  };

  return {
    mode,
    metrics,
    latest_inventory: latestInventory,
    latest_finance: latestFinance,
    gallery_preview: galleryPreview,
    insights: insightPreview,
    actions,
    checklist: actions.filter((item) => item.status !== 'done'),
    permits: permitsForMode,
    compliance: {
      packages: compliancePackagesForMode,
      updated_at: '2024-12-28T12:00:00Z',
      owner: 'Compliance Ops',
    },
    deliveries: deliveriesForMode,
    kpis: seedStore.kpisByMode[mode] || {},
    incidents: seedStore.incidents.filter((item) => item.mode === mode),
    risks: seedStore.risks.filter((item) => item.mode === mode),
    systems: seedStore.systems,
    user: seedStore.user,
};

};

const seed_getWeatherInsight = ({ mode, units = 'metric' }) => {
  requireMode(mode);
  const base = seedStore.weatherByMode[mode] || seedStore.weatherByMode.design;
  const temperature =
    units === 'imperial' && base.units === 'metric'
      ? Math.round((base.temperature * 9) / 5 + 32)
      : base.temperature;
  return {
    ...base,
    temperature,
    units,
    retrieved_at: nowISO(),
  };
};

const seed_updateRiskStatus = (id, payload) => {
  const risk = seedStore.risks.find((item) => item.id === id);
  if (!risk) {
    const error = new Error('Risk not found');
    error.status = 404;
    throw error;
  }
  if (payload.status) {
    risk.status = payload.status;
  }
  if (payload.owner) {
    risk.owner = payload.owner;
  }
  if (payload.score !== undefined) {
    risk.score = Number(payload.score);
  }
  risk.updated_at = nowISO();
  return deepClone(risk);
};

const seed_listIncidents = (mode) => {
  let items = seedStore.incidents;
  if (mode) items = items.filter((item) => item.mode === mode);
  return deepClone(items);
};

const seed_listRisks = (mode) => {
  let items = seedStore.risks;
  if (mode) items = items.filter((item) => item.mode === mode);
  return deepClone(items);
};

const seed_listDrills = (mode) => {
  let items = seedStore.drills;
  if (mode) items = items.filter((item) => item.mode === mode);
  return deepClone(items);
};







export const listModes = seed_listModes;
export const getMode = seed_getMode;
export const listInventory = seed_listInventory;
export const createInventory = seed_createInventory;
export const listFinance = seed_listFinance;
export const createFinance = seed_createFinance;
export const listGallery = seed_listGallery;
export const createGalleryAsset = seed_createGalleryAsset;
export const listInsights = seed_listInsights;
export const createInsight = seed_createInsight;
export const getChatConfig = seed_getChatConfig;
export const getDashboardSummary = seed_getDashboardSummary;
export const getWeatherInsight = seed_getWeatherInsight;
export const updateRiskStatus = seed_updateRiskStatus;
export const listIncidents = seed_listIncidents;
export const listRisks = seed_listRisks;
export const listDrills = seed_listDrills;





