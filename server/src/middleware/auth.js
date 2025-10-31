import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const user = await User.findById(decoded.sub || decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
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
