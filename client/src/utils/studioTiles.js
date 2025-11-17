export const DEFAULT_SERVICE_SUMMARY =
  "An architecture studio sells professional services—architectural design, planning, interior systems, and sustainable consultancy—rather than boxed products. Studio teams create residential and commercial blueprints, manage delivery, and specify low-carbon solutions so clients can build with confidence (noted frequently by Reddit practitioners).";

const DEFAULT_SERVICE_TILES = [
  {
    id: 'architectural',
    label: 'Architectural design',
    description:
      'Creating plans and BIM-ready blueprints for residential, commercial, institutional, and mixed-use programmes.',
    status: 'available',
  },
  {
    id: 'interior',
    label: 'Interior design',
    description:
      'Space planning, furniture and FF&E schedules, finish palettes, and experiential styling for hospitality and workplace briefs.',
    status: 'available',
  },
  {
    id: 'urban',
    label: 'Urban & infrastructure',
    description:
      'Transit-oriented masterplans, civic decks, sceneography, and broadcast-grade environments across public infrastructure.',
    status: 'available',
  },
  {
    id: 'sustainable',
    label: 'Sustainable & green solutions',
    description:
      'Passive design moves, energy modelling, low-carbon materials, and regenerative water/landscape systems for resilient builds.',
    status: 'available',
  },
];

const DEFAULT_PRODUCT_TILES = [
  {
    id: 'planCatalogue',
    label: 'Pre-designed plans',
    description:
      'Builder-ready catalogues with adaptable residential modules, allowing teams to licence a plan set and move straight to permitting.',
    status: 'available',
  },
  {
    id: 'designBuild',
    label: 'Design-build projects',
    description:
      'Turnkey delivery where the studio designs, procures, and constructs the asset—selling the completed project as a productized outcome.',
    status: 'available',
  },
];

export const DEFAULT_STUDIO_TILES = {
  summary: DEFAULT_SERVICE_SUMMARY,
  services: DEFAULT_SERVICE_TILES,
  products: DEFAULT_PRODUCT_TILES,
};

const normaliseTile = (tile, type) => {
  if (!tile) return null;
  const id = tile.id || `custom-${type}-${Math.random().toString(36).slice(2, 9)}`;
  const status = tile.status === 'on-request' ? 'on-request' : 'available';
  return {
    id,
    label: tile.label || 'Untitled',
    description: tile.description || '',
    status,
    statusLabel: tile.statusLabel || null,
    extra: tile.extra || '',
    type,
  };
};

export const createEmptyTile = (type) =>
  normaliseTile(
    {
      id: `custom-${type}-${Math.random().toString(36).slice(2, 9)}`,
      label: '',
      description: '',
      status: 'available',
    },
    type,
  );

export const cloneTiles = (config = DEFAULT_STUDIO_TILES) => JSON.parse(JSON.stringify(config));
