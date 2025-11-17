const STORAGE_KEY = 'builtattic.workspace-sync.v1';
export const WORKSPACE_SYNC_EVENT = 'workspace:sync';

const ROLE_DEFAULT = {
  planUploads: [],
  serviceBundles: [],
  syncedAt: null,
};

const DEFAULT_STATE = {
  associate: { ...ROLE_DEFAULT },
  firm: { ...ROLE_DEFAULT },
};

const safeParseJSON = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readState = () => {
  const storage = getStorage();
  if (!storage) {
    return { ...DEFAULT_STATE };
  }
  const parsed = safeParseJSON(storage.getItem(STORAGE_KEY));
  if (!parsed) {
    return { ...DEFAULT_STATE };
  }
  return {
    associate: { ...ROLE_DEFAULT, ...(parsed.associate || {}) },
    firm: { ...ROLE_DEFAULT, ...(parsed.firm || {}) },
  };
};

const writeState = (state) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const emitSyncEvent = (role, nextState) => {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_SYNC_EVENT, {
        detail: { role, state: nextState },
      }),
    );
  } catch {}
};

const createId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const cleanString = (value) => (typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim());

const normaliseList = (value) => {
  if (!value && value !== 0) return [];
  if (Array.isArray(value)) {
    return value
      .map(cleanString)
      .map((entry) => entry.replace(/[,;]+$/g, '').trim())
      .filter(Boolean);
  }
  return String(value)
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const normaliseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const buildPlanPayload = (payload = {}) => {
  const renderImages = normaliseList(payload.renderImages);
  if (!renderImages.length && Array.isArray(payload.renderImageLinks)) {
    renderImages.push(
      ...payload.renderImageLinks.map(cleanString).filter(Boolean),
    );
  }
  return {
    id: payload.id || createId('plan'),
    projectTitle: cleanString(payload.projectTitle),
    category: cleanString(payload.category),
    subtype: cleanString(payload.subtype),
    primaryStyle: cleanString(payload.primaryStyle),
    conceptPlan: cleanString(payload.conceptPlan),
    renderImages,
    walkthrough: cleanString(payload.walkthrough),
    areaSqft: normaliseNumber(payload.areaSqft),
    floors: normaliseNumber(payload.floors),
    materials: normaliseList(payload.materials),
    climate: cleanString(payload.climate || payload.climateSuitability),
    designRate: normaliseNumber(payload.designRate),
    constructionCost: normaliseNumber(payload.constructionCost),
    licenseType: cleanString(payload.licenseType),
    delivery: cleanString(payload.delivery),
    description: cleanString(payload.description),
    tags: normaliseList(payload.tags),
    updatedAt: new Date().toISOString(),
  };
};

const buildBundlePayload = (payload = {}) => ({
  id: payload.id || createId('bundle'),
  bundleName: cleanString(payload.bundleName),
  cadence: cleanString(payload.cadence || payload.typeDuration),
  scope: cleanString(payload.scope || payload.scopeOfWork),
  price: normaliseNumber(payload.price),
  deliverables: normaliseList(payload.deliverables),
  fileFormat: cleanString(payload.fileFormat),
  revisionsAllowed: cleanString(payload.revisionsAllowed || payload.revisions),
  turnaroundTime: cleanString(payload.turnaroundTime),
  skillLevel: cleanString(payload.skillLevel),
  references: normaliseList(payload.references),
  durationLabel: cleanString(payload.durationLabel || payload.type),
  notes: cleanString(payload.notes),
  updatedAt: new Date().toISOString(),
});

const updateRoleState = (role, mutator) => {
  if (!DEFAULT_STATE[role]) {
    throw new Error(`Unsupported workspace role: ${role}`);
  }
  const state = readState();
  const currentRoleState = { ...ROLE_DEFAULT, ...state[role] };
  const mutated = mutator(currentRoleState);
  const nextRoleState = {
    ...currentRoleState,
    ...mutated,
    syncedAt: new Date().toISOString(),
  };
  const nextState = { ...state, [role]: nextRoleState };
  writeState(nextState);
  emitSyncEvent(role, nextRoleState);
  return nextRoleState;
};

export const getWorkspaceCollections = (role = 'associate') => {
  const state = readState();
  return { ...ROLE_DEFAULT, ...state[role] };
};

export const upsertPlanUpload = (role, payload) => {
  const plan = buildPlanPayload(payload);
  const result = updateRoleState(role, (roleState) => {
    const nextPlans = Array.isArray(roleState.planUploads) ? [...roleState.planUploads] : [];
    const index = nextPlans.findIndex((item) => item.id === plan.id);
    if (index >= 0) {
      nextPlans[index] = { ...nextPlans[index], ...plan };
    } else {
      nextPlans.unshift(plan);
    }
    return { planUploads: nextPlans };
  });
  return result.planUploads;
};

export const removePlanUpload = (role, planId) => {
  const result = updateRoleState(role, (roleState) => {
    const nextPlans = (roleState.planUploads || []).filter((plan) => plan.id !== planId);
    return { planUploads: nextPlans };
  });
  return result.planUploads;
};

export const upsertServiceBundle = (role, payload) => {
  const bundle = buildBundlePayload(payload);
  const result = updateRoleState(role, (roleState) => {
    const nextBundles = Array.isArray(roleState.serviceBundles) ? [...roleState.serviceBundles] : [];
    const index = nextBundles.findIndex((item) => item.id === bundle.id);
    if (index >= 0) {
      nextBundles[index] = { ...nextBundles[index], ...bundle };
    } else {
      nextBundles.unshift(bundle);
    }
    return { serviceBundles: nextBundles };
  });
  return result.serviceBundles;
};

export const removeServiceBundle = (role, bundleId) => {
  const result = updateRoleState(role, (roleState) => {
    const nextBundles = (roleState.serviceBundles || []).filter((bundle) => bundle.id !== bundleId);
    return { serviceBundles: nextBundles };
  });
  return result.serviceBundles;
};

export const subscribeToWorkspaceRole = (role, handler) => {
  if (typeof window === 'undefined') return () => {};
  const listener = (event) => {
    if (event?.detail?.role !== role) return;
    handler(event.detail.state);
  };
  window.addEventListener(WORKSPACE_SYNC_EVENT, listener);
  return () => window.removeEventListener(WORKSPACE_SYNC_EVENT, listener);
};

export const stringifyList = (list = []) => (Array.isArray(list) ? list.join('\n') : '');

export const WORKSPACE_SYNC_STORAGE_KEY = STORAGE_KEY;

export const workspaceHelpers = {
  cleanString,
  normaliseList,
  normaliseNumber,
};

export default {
  getWorkspaceCollections,
  upsertPlanUpload,
  removePlanUpload,
  upsertServiceBundle,
  removeServiceBundle,
  subscribeToWorkspaceRole,
  WORKSPACE_SYNC_STORAGE_KEY,
  WORKSPACE_SYNC_EVENT,
};
