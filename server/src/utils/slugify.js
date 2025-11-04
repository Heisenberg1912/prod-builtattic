import crypto from 'node:crypto';

export function slugify(value, fallback = '') {
  const base = String(value ?? fallback ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 96);
  if (base) return base;
  const safeFallback = String(fallback ?? '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  if (safeFallback) return safeFallback;
  return `item-${crypto.randomBytes(4).toString('hex')}`;
}

export async function ensureUniqueSlug(model, value, { fallback, scope = {}, excludeId } = {}) {
  const base = slugify(value, fallback);
  let candidate = base;
  let attempt = 1;
  const buildQuery = () => ({ ...scope, slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
  // eslint-disable-next-line no-await-in-loop
  while (await model.exists(buildQuery())) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}
