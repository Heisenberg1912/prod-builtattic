import dns from 'dns/promises';

const MX_CACHE = new Map();

export async function validateEmailDeliverability(email) {
  if (typeof email !== 'string') return false;
  const [, domain] = email.split('@');
  if (!domain) return false;

  const cached = MX_CACHE.get(domain);
  const now = Date.now();
  if (cached && now - cached.checkedAt < 1000 * 60 * 60) {
    return cached.valid;
  }

  try {
    const records = await dns.resolveMx(domain);
    const valid = Array.isArray(records) && records.length > 0;
    MX_CACHE.set(domain, { valid, checkedAt: now });
    return valid;
  } catch {
    MX_CACHE.set(domain, { valid: false, checkedAt: now });
    return false;
  }
}
