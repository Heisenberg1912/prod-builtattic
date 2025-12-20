// Input validation middleware

const DANGEROUS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\(/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
];

const hasDangerousContent = (str) => {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(str));
};

// Validate AI prompts
export const validatePrompt = (req, res, next) => {
  const { prompt } = req.body;

  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'prompt_required' });
  }

  if (typeof prompt !== 'string') {
    return res.status(400).json({ error: 'invalid_prompt_type' });
  }

  if (prompt.length > 4000) {
    return res.status(400).json({ error: 'prompt_too_long' });
  }

  if (hasDangerousContent(prompt)) {
    return res.status(400).json({ error: 'invalid_prompt_content' });
  }

  req.body.prompt = prompt.trim();
  next();
};

// Validate text fields
export const validateText = (field, { required = false, max = 10000, min = 0 } = {}) => {
  return (req, res, next) => {
    const value = req.body[field];

    if (!value?.trim()) {
      return required
        ? res.status(400).json({ error: `${field}_required` })
        : next();
    }

    if (typeof value !== 'string') {
      return res.status(400).json({ error: `${field}_invalid_type` });
    }

    if (value.length < min || value.length > max) {
      return res.status(400).json({ error: `${field}_invalid_length` });
    }

    if (hasDangerousContent(value)) {
      return res.status(400).json({ error: `${field}_invalid_content` });
    }

    req.body[field] = value.trim();
    next();
  };
};

// Validate email
export const validateEmail = (field = 'email', required = true) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (req, res, next) => {
    const email = req.body[field];

    if (!email) {
      return required
        ? res.status(400).json({ error: `${field}_required` })
        : next();
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    req.body[field] = email.trim().toLowerCase();
    next();
  };
};

// Validate URLs
export const validateUrl = (field, required = false) => {
  return (req, res, next) => {
    const url = req.body[field];

    if (!url) {
      return required
        ? res.status(400).json({ error: `${field}_required` })
        : next();
    }

    if (/^(javascript|data|vbscript):/i.test(url)) {
      return res.status(400).json({ error: 'invalid_protocol' });
    }

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'invalid_protocol' });
      }
      req.body[field] = parsed.href;
    } catch {
      return res.status(400).json({ error: 'invalid_url' });
    }

    next();
  };
};

// Validate numbers
export const validateNumber = (field, { required = false, min = null, max = null, integer = false } = {}) => {
  return (req, res, next) => {
    const value = req.body[field];

    if (value == null || value === '') {
      return required
        ? res.status(400).json({ error: `${field}_required` })
        : next();
    }

    const num = Number(value);

    if (isNaN(num)) {
      return res.status(400).json({ error: `${field}_invalid` });
    }

    if (integer && !Number.isInteger(num)) {
      return res.status(400).json({ error: `${field}_must_be_integer` });
    }

    if ((min !== null && num < min) || (max !== null && num > max)) {
      return res.status(400).json({ error: `${field}_out_of_range` });
    }

    req.body[field] = num;
    next();
  };
};

// Sanitize MongoDB queries (removes $ operators)
export const sanitizeBody = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const clean = Array.isArray(obj) ? [] : {};
    for (const [key, val] of Object.entries(obj)) {
      if (typeof key === 'string' && key.startsWith('$')) continue;
      clean[key] = typeof val === 'object' ? sanitize(val) : val;
    }
    return clean;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }

  next();
};
