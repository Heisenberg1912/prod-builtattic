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
  // Legacy uniqueness disabled while rebuilding slug logic; return a basic slug without DB checks.
  return slugify(value, fallback);
}
