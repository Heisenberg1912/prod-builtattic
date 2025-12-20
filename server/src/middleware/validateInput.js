/**
 * Input Validation Middleware
 * Validates and sanitizes API request inputs
 */

const MAX_PROMPT_LENGTH = 4000;
const MAX_STRING_LENGTH = 10000;

/**
 * Check for common injection patterns
 */
const FORBIDDEN_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /__proto__/gi,
  /constructor/gi,
];

/**
 * Validate and sanitize prompt input
 */
export function validatePrompt(req, res, next) {
  const { prompt } = req.body || {};

  // Check if prompt exists
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      error: 'invalid_prompt',
      message: 'Prompt must be a non-empty string',
    });
  }

  const trimmed = prompt.trim();

  // Check length
  if (trimmed.length === 0) {
    return res.status(400).json({
      error: 'empty_prompt',
      message: 'Prompt cannot be empty',
    });
  }

  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      error: 'prompt_too_long',
      message: `Prompt must be ${MAX_PROMPT_LENGTH} characters or less`,
      maxLength: MAX_PROMPT_LENGTH,
    });
  }

  // Check for injection patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn('Blocked malicious prompt pattern:', pattern, 'in:', trimmed.substring(0, 100));
      return res.status(400).json({
        error: 'invalid_prompt_content',
        message: 'Prompt contains forbidden content',
      });
    }
  }

  // Sanitize and store
  req.body.prompt = trimmed;
  next();
}

/**
 * Validate string input
 */
export function validateString(field, options = {}) {
  const { required = false, maxLength = MAX_STRING_LENGTH, minLength = 0 } = options;

  return (req, res, next) => {
    const value = req.body?.[field];

    if (required && (!value || typeof value !== 'string')) {
      return res.status(400).json({
        error: `invalid_${field}`,
        message: `${field} is required and must be a string`,
      });
    }

    if (value) {
      const trimmed = String(value).trim();

      if (trimmed.length < minLength) {
        return res.status(400).json({
          error: `${field}_too_short`,
          message: `${field} must be at least ${minLength} characters`,
        });
      }

      if (trimmed.length > maxLength) {
        return res.status(400).json({
          error: `${field}_too_long`,
          message: `${field} must be ${maxLength} characters or less`,
        });
      }

      req.body[field] = trimmed;
    }

    next();
  };
}

/**
 * Validate email input
 */
export function validateEmail(field = 'email') {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (req, res, next) => {
    const email = req.body?.[field];

    if (!email) {
      return next();
    }

    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({
        error: 'invalid_email',
        message: 'Email address is not valid',
      });
    }

    req.body[field] = email.trim().toLowerCase();
    next();
  };
}

/**
 * Validate URL input
 */
export function validateUrl(field = 'url', options = {}) {
  const { allowedProtocols = ['http:', 'https:'], required = false } = options;

  return (req, res, next) => {
    const url = req.body?.[field];

    if (!url) {
      if (required) {
        return res.status(400).json({
          error: `${field}_required`,
          message: `${field} is required`,
        });
      }
      return next();
    }

    try {
      const parsedUrl = new URL(String(url).trim());

      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        return res.status(400).json({
          error: 'invalid_url_protocol',
          message: `URL protocol must be one of: ${allowedProtocols.join(', ')}`,
        });
      }

      req.body[field] = parsedUrl.href;
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'invalid_url',
        message: 'URL is not valid',
      });
    }
  };
}

/**
 * Validate numeric input
 */
export function validateNumber(field, options = {}) {
  const { required = false, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = options;

  return (req, res, next) => {
    const value = req.body?.[field];

    if (value === undefined || value === null) {
      if (required) {
        return res.status(400).json({
          error: `${field}_required`,
          message: `${field} is required`,
        });
      }
      return next();
    }

    const num = Number(value);

    if (!Number.isFinite(num)) {
      return res.status(400).json({
        error: `invalid_${field}`,
        message: `${field} must be a valid number`,
      });
    }

    if (num < min) {
      return res.status(400).json({
        error: `${field}_too_small`,
        message: `${field} must be at least ${min}`,
      });
    }

    if (num > max) {
      return res.status(400).json({
        error: `${field}_too_large`,
        message: `${field} must be at most ${max}`,
      });
    }

    req.body[field] = num;
    next();
  };
}

/**
 * Rate limiting helper
 */
export function createRateLimiter(options = {}) {
  const { windowMs = 60000, maxRequests = 10 } = options;
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);

    // Remove expired requests
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    requests.set(key, validRequests);

    // Check limit
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000),
      });
    }

    // Add this request
    validRequests.push(now);
    next();
  };
}
