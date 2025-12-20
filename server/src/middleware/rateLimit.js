// Simple in-memory rate limiter

const store = new Map();

const cleanup = () => {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (now > data.reset) store.delete(key);
  }
};

setInterval(cleanup, 60_000); // Clean up every minute

export const rateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  keyFn = (req) => req.ip || req.socket.remoteAddress
} = {}) => {
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    const record = store.get(key);

    // First request or window expired
    if (!record || now > record.reset) {
      store.set(key, { count: 1, reset: now + windowMs });
      return next();
    }

    // Increment and check limit
    record.count++;
    if (record.count > max) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        retryAfter: Math.ceil((record.reset - now) / 1000)
      });
    }

    next();
  };
};
