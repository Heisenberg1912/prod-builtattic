import jwt from "jsonwebtoken";
import User from "../models/User.js";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string") return null;
  const [scheme, token] = authHeader.split(" ");
  if (!/^Bearer$/i.test(scheme) || !token) return null;
  return token.trim();
};

export const authenticateJWT = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    if (!ACCESS_SECRET) {
      throw new Error('JWT access secret not configured');
    }

    const decoded = jwt.verify(token, ACCESS_SECRET);
    const userId = decoded._id || decoded.sub || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    const message = err?.name === 'JsonWebTokenError' ? 'Invalid token' : err?.message || 'Unauthorized';
    return res.status(401).json({ message });
  }
};

export { authenticateJWT as protect };

export const authorizeRoles = (...roles) => {
  const normalized = roles.flat().map((role) => String(role).toLowerCase());
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (normalized.length === 0) return next();
    const primaryRole = String(req.user.role || "").toLowerCase();
    if (normalized.includes(primaryRole)) return next();
    const globalRoles = (req.user.rolesGlobal || []).map((role) => String(role).toLowerCase());
    if (globalRoles.some((role) => normalized.includes(role))) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
};

export const scopeQueryByRole = (_resource) => (_req, _res, next) => next();
