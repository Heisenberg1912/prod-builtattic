// Studio deduplication - prevents same design appearing twice in marketplace

const normalizeTitle = (studio) => {
  return (studio?.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

const getStudioId = (studio) => {
  return studio?._id || studio?.id;
};

// Merge and deduplicate studios (localStorage takes priority)
export const mergeAndDedupeStudios = (localStudios, apiStudios) => {
  const seenIds = new Set();
  const seenTitles = new Map();
  const result = [];

  for (const studio of [...localStudios, ...apiStudios]) {
    if (!studio) continue;

    const id = getStudioId(studio);
    const title = normalizeTitle(studio);

    // Skip if seen this ID
    if (id && seenIds.has(id)) continue;

    // Skip if seen this title (fuzzy match)
    if (title && seenTitles.has(title)) {
      const existingSource = seenTitles.get(title);
      // Prefer localStorage version over API
      if (existingSource === 'local' && studio._source !== 'localStorage') {
        continue;
      }
    }

    result.push(studio);

    if (id) seenIds.add(id);
    if (title) seenTitles.set(title, studio._source === 'localStorage' ? 'local' : 'api');
  }

  return result;
};

// Check if two studios are duplicates
export const areStudiosDuplicate = (s1, s2) => {
  if (!s1 || !s2) return false;

  const id1 = getStudioId(s1);
  const id2 = getStudioId(s2);
  if (id1 && id2 && id1 === id2) return true;

  const title1 = normalizeTitle(s1);
  const title2 = normalizeTitle(s2);
  if (!title1 || !title2 || title1 !== title2) return false;

  // Check firm name for confirmation
  const firm1 = (s1.firm?.name || s1.studioName || '').toLowerCase();
  const firm2 = (s2.firm?.name || s2.studioName || '').toLowerCase();

  return (!firm1 && !firm2) || (firm1 && firm2 && firm1 === firm2);
};
