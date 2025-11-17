export const DEFAULT_STUDIO_LOOKUP = {
  headline: 'Studio not found.',
  description:
    "We couldn't find the system you requested. Re-run your search or open a fresh marketplace session--your recommendations update instantly.",
  helper:
    'Need personalised help? Share the slug or screenshot with studios@builtattic.com and we will surface the closest catalogue-ready pairings.',
  tags: ['Residential kits', 'Design-build partners', 'Plan catalogues'],
  reasons: [
    {
      title: 'The link is stale',
      detail: 'Studios evolve quickly. A partner may have archived or renamed this slug.',
    },
    {
      title: 'Private catalog item',
      detail: 'Some enterprise programmes stay invitation-only. Ask your Builtattic rep to unlock access.',
    },
    {
      title: 'Typo in the URL',
      detail: 'Double-check the slug or jump into the marketplace search to pick a live listing.',
    },
  ],
};

export const ACCESS_LOOKUP_REASONS = [
  {
    title: 'No firm membership',
    detail: 'This dashboard unlocks once your login is linked to a Design Studio workspace.',
  },
  {
    title: 'Invite pending',
    detail: 'Look for the portal invite email or ask an admin to resend it to your work inbox.',
  },
  {
    title: 'Using a personal login',
    detail: 'Switch to your firm-issued email in the header to view internal stats and tools.',
  },
];

const cleanText = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

const cleanArray = (data, fallback = []) => {
  if (!Array.isArray(data)) return fallback;
  return data
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 5);
};

const cleanReasons = (reasons, fallback = []) => {
  if (!Array.isArray(reasons)) return fallback;
  return reasons
    .map((reason) => ({
      title: cleanText(reason?.title),
      detail: cleanText(reason?.detail),
    }))
    .filter((reason) => reason.title && reason.detail)
    .slice(0, 4);
};

export const normalizeLookupConfig = (config = {}) => {
  const merged = {
    ...DEFAULT_STUDIO_LOOKUP,
    ...config,
  };

  merged.headline = cleanText(config.headline, DEFAULT_STUDIO_LOOKUP.headline);
  merged.description = cleanText(config.description, DEFAULT_STUDIO_LOOKUP.description);
  merged.helper = cleanText(config.helper, DEFAULT_STUDIO_LOOKUP.helper);
  merged.tags = cleanArray(config.tags, DEFAULT_STUDIO_LOOKUP.tags);

  const normalizedReasons = cleanReasons(config.reasons, DEFAULT_STUDIO_LOOKUP.reasons);
  merged.reasons = normalizedReasons.length ? normalizedReasons : DEFAULT_STUDIO_LOOKUP.reasons;

  return merged;
};

export const serializeLookupDraft = (draft) => {
  const tags = cleanArray(draft.tags, DEFAULT_STUDIO_LOOKUP.tags);
  const reasons = cleanReasons(draft.reasons, DEFAULT_STUDIO_LOOKUP.reasons);
  return {
    headline: cleanText(draft.headline, DEFAULT_STUDIO_LOOKUP.headline),
    description: cleanText(draft.description, DEFAULT_STUDIO_LOOKUP.description),
    helper: cleanText(draft.helper, DEFAULT_STUDIO_LOOKUP.helper),
    tags,
    reasons,
  };
};


const LOOKUP_STORAGE_KEY = 'builtattic:studioLookup';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getStoredLookupConfig = () => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(LOOKUP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('lookup_storage_read_failed', error);
    return null;
  }
};

export const setStoredLookupConfig = (config) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(LOOKUP_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('lookup_storage_write_failed', error);
  }
};
