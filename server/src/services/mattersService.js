import { randomUUID } from 'crypto';

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

const store = {
  modes,
  inventory,
  financeRecords,
  galleryAssets,
  insights,
  incidents,
  risks,
  drills,
  kpisByMode,
  weatherByMode,
  chatConfig,
  systems,
  user: mattersUser,
};

const sortByDateDesc = (items, field) =>
  [...items].sort((a, b) => new Date(b[field]).getTime() - new Date(a[field]).getTime());

const requireMode = (mode) => {
  if (!store.modes.find((item) => item.name === mode)) {
    const error = new Error(`Mode '${mode}' not found`);
    error.status = 404;
    throw error;
  }
};

export const listModes = () => deepClone([...store.modes].sort((a, b) => a.order - b.order));

export const getMode = (name) => {
  const mode = store.modes.find((item) => item.name === name);
  if (!mode) {
    const error = new Error(`Mode '${name}' not found`);
    error.status = 404;
    throw error;
  }
  return deepClone(mode);
};

export const listInventory = ({ mode, category, status, limit = 50 }) => {
  let items = store.inventory;
  if (mode) items = items.filter((item) => item.mode === mode);
  if (category) items = items.filter((item) => item.category === category);
  if (status) items = items.filter((item) => item.status === status);
  return deepClone(sortByDateDesc(items, 'updated_at').slice(0, limit));
};

export const createInventory = (payload) => {
  requireMode(payload.mode);
  const now = nowISO();
  const record = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    ...payload,
  };
  store.inventory.push(record);
  return deepClone(record);
};

export const listFinance = ({ mode, record_type, limit = 50 }) => {
  let items = store.financeRecords;
  if (mode) items = items.filter((item) => item.mode === mode);
  if (record_type) items = items.filter((item) => item.record_type === record_type);
  return deepClone(sortByDateDesc(items, 'updated_at').slice(0, limit));
};

export const createFinance = (payload) => {
  requireMode(payload.mode);
  const now = nowISO();
  const record = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    ...payload,
  };
  store.financeRecords.push(record);
  return deepClone(record);
};

export const listGallery = ({ mode, limit = 24 }) => {
  let items = store.galleryAssets;
  if (mode) items = items.filter((item) => item.mode === mode);
  return deepClone(sortByDateDesc(items, 'uploaded_at').slice(0, limit));
};

export const createGalleryAsset = (payload) => {
  requireMode(payload.mode);
  const now = nowISO();
  const record = {
    id: randomUUID(),
    uploaded_at: now,
    ...payload,
  };
  store.galleryAssets.push(record);
  return deepClone(record);
};

export const listInsights = ({ mode, tag, limit = 6 }) => {
  let items = store.insights;
  if (mode) items = items.filter((item) => item.mode === mode);
  if (tag) items = items.filter((item) => item.tags?.includes(tag));
  return deepClone(sortByDateDesc(items, 'created_at').slice(0, limit));
};

export const createInsight = (payload) => {
  requireMode(payload.mode);
  const now = nowISO();
  const record = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    ...payload,
  };
  store.insights.push(record);
  return deepClone(record);
};

export const getChatConfig = () => deepClone(store.chatConfig);

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

export const getDashboardSummary = (mode) => {
  requireMode(mode);
  const latestInventory = listInventory({ mode, limit: 4 });
  const latestFinance = listFinance({ mode, limit: 4 });
  const galleryPreview = listGallery({ mode, limit: 4 });
  const insightPreview = listInsights({ mode, limit: 4 });

  const metrics = {
    inventorySummary: aggregateInventoryMetrics(
      store.inventory.filter((item) => item.mode === mode)
    ),
    financeSummary: aggregateFinanceMetrics(
      store.financeRecords.filter((item) => item.mode === mode)
    ),
  };

  return {
    mode,
    metrics,
    latest_inventory: latestInventory,
    latest_finance: latestFinance,
    gallery_preview: galleryPreview,
    insights: insightPreview,
    kpis: store.kpisByMode[mode] || {},
    incidents: store.incidents.filter((item) => item.mode === mode),
    risks: store.risks.filter((item) => item.mode === mode),
    systems: store.systems,
    user: store.user,
  };
};

export const getWeatherInsight = ({ mode, units = 'metric' }) => {
  requireMode(mode);
  const base = store.weatherByMode[mode] || store.weatherByMode.design;
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

export const updateRiskStatus = (id, payload) => {
  const risk = store.risks.find((item) => item.id === id);
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

export const listIncidents = (mode) => {
  let items = store.incidents;
  if (mode) items = items.filter((item) => item.mode === mode);
  return deepClone(items);
};

export const listRisks = (mode) => {
  let items = store.risks;
  if (mode) items = items.filter((item) => item.mode === mode);
  return deepClone(items);
};

export const listDrills = (mode) => {
  let items = store.drills;
  if (mode) items = items.filter((item) => item.mode === mode);
  return deepClone(items);
};



