// Frontend security validation utilities

const DANGEROUS_URL_PROTOCOLS = /^(javascript|data|vbscript):/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Escape HTML to prevent XSS
export const escapeHtml = (str) => {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// Validate and sanitize URLs
export const validateUrl = (url, { allowRelative = false } = {}) => {
  if (!url) return null;

  const trimmed = String(url).trim();

  // Block dangerous protocols
  if (DANGEROUS_URL_PROTOCOLS.test(trimmed)) {
    return null;
  }

  // Allow relative URLs if specified
  if (allowRelative && (trimmed.startsWith('/') || trimmed.startsWith('./'))) {
    return trimmed;
  }

  // Validate absolute URLs
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
};

// Validate email format
export const validateEmail = (email) => {
  return email && EMAIL_REGEX.test(String(email).trim());
};

// Sanitize text (remove HTML tags and scripts)
export const sanitizeText = (text, maxLength = null) => {
  if (!text) return '';

  let clean = String(text)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();

  return maxLength && clean.length > maxLength
    ? clean.substring(0, maxLength)
    : clean;
};

// Sanitize studio/design data from API
export const sanitizeStudioData = (studio) => {
  if (!studio) return null;

  const textFields = ['title', 'summary', 'description', 'bio', 'tagline', 'story'];
  const sanitized = { ...studio };

  textFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeText(sanitized[field], 5000);
    }
  });

  if (sanitized.firm) {
    sanitized.firm = {
      ...sanitized.firm,
      name: sanitizeText(sanitized.firm.name, 200),
      bio: sanitizeText(sanitized.firm.bio, 5000),
      tagline: sanitizeText(sanitized.firm.tagline, 500),
      website: validateUrl(sanitized.firm.website),
    };
  }

  // Sanitize array fields
  ['categories', 'styles', 'typologies'].forEach(field => {
    if (Array.isArray(sanitized[field])) {
      sanitized[field] = sanitized[field]
        .map(item => sanitizeText(item, 100))
        .filter(Boolean);
    }
  });

  return sanitized;
};

// Sanitize inquiry/message data
export const sanitizeInquiryData = (inquiry) => {
  if (!inquiry) return null;

  return {
    ...inquiry,
    subject: sanitizeText(inquiry.subject, 200),
    message: sanitizeText(inquiry.message, 5000),
    senderName: sanitizeText(inquiry.senderName, 100),
    senderEmail: inquiry.senderEmail && validateEmail(inquiry.senderEmail)
      ? inquiry.senderEmail.trim().toLowerCase()
      : null,
  };
};
