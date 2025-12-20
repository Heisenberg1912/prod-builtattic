// Authentication middleware for protecting API routes

const extractToken = (authHeader) => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
};

// Core authentication - blocks requests without valid token
export const authenticate = async (req, res, next) => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    // TODO: Replace with your auth provider
    // Clerk: const { userId } = await clerkClient.verifyToken(token);
    // JWT: const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Temporary validation - REPLACE THIS
    if (token.length < 20) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    req.user = { authenticated: true };
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
};

// Optional auth - allows requests with or without token
export const optionalAuth = async (req, res, next) => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Same verification as authenticate, but don't fail
    if (token.length >= 20) {
      req.user = { authenticated: true };
      req.token = token;
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }

  next();
};
