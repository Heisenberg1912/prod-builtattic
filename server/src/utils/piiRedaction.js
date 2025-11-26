/**
 * PII Redaction Utility
 * Provides functions to redact or pseudonymize personally identifiable information
 * for safe logging and auditing purposes.
 */

/**
 * Redact a person's name to initials only
 * @param {string} name - Full name to redact
 * @returns {string} - Initials (e.g., "John Doe" -> "J.D.")
 */
export const redactName = (name) => {
  if (!name || typeof name !== 'string') return undefined;
  const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
  if (parts.length === 0) return undefined;
  return parts.map(part => part[0].toUpperCase()).join('.');
};

/**
 * Redact an email to domain only
 * @param {string} email - Email address to redact
 * @returns {string} - Domain-only email (e.g., "user@example.com" -> "***@example.com")
 */
export const redactEmail = (email) => {
  if (!email || typeof email !== 'string') return undefined;
  const match = email.match(/^(.*)@(.+)$/);
  if (!match) return undefined;
  return `***@${match[2]}`;
};

/**
 * Redact a phone number to last 4 digits
 * @param {string} phone - Phone number to redact
 * @returns {string} - Redacted phone (e.g., "+1 (555) 123-4567" -> "****-4567")
 */
export const redactPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return undefined;
  const lastFour = digits.slice(-4);
  return `****-${lastFour}`;
};

/**
 * Create a safe requester object with redacted PII
 * Suitable for logging consultation requests and sensitive operations
 * @param {Object} requester - Object with name, email, phone properties
 * @returns {Object} - Object with redacted PII (or undefined for missing fields)
 */
export const redactRequester = (requester) => {
  if (!requester || typeof requester !== 'object') return {};
  
  return {
    name: redactName(requester.name),
    email: redactEmail(requester.email),
    phone: redactPhone(requester.phone),
  };
};

/**
 * Create a safe audit trail object with minimal PII reference
 * @param {Object} requester - Object with name, email, phone properties
 * @param {string} requesterId - Optional user ID or anonymous identifier
 * @returns {Object} - Minimal audit data suitable for logging
 */
export const createSafeAuditTrail = (requester, requesterId) => {
  const redacted = redactRequester(requester);
  return {
    requesterId: requesterId || 'anonymous',
    requesterInfo: Object.fromEntries(
      Object.entries(redacted).filter(([, value]) => value !== undefined)
    ),
  };
};

export default {
  redactName,
  redactEmail,
  redactPhone,
  redactRequester,
  createSafeAuditTrail,
};
