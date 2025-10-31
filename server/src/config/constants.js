import "./hardcodedEnv.js";

export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_PROD = NODE_ENV === "production";

export const API_PREFIX = process.env.API_PREFIX || "/api";
export const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  process.env.CLIENT_URL ||
  "http://localhost:5173";

export const PORT = Number(process.env.PORT || 5000);

// Auth
export const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_env";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";

// Pagination
export const PAGE_SIZE = Number(process.env.PAGE_SIZE || 20);
export const MAX_PAGE_SIZE = Number(process.env.MAX_PAGE_SIZE || 100);

// CORS
export const CORS_ENABLED = (process.env.CORS_ENABLED || "true") === "true";
export const CORS_ORIGIN = process.env.CORS_ORIGIN || CLIENT_ORIGIN;

// Database (optional, for convenience)
export const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";
export const MONGODB_DB = process.env.MONGODB_DB || "";

// Roles used across the app
export const ROLES = Object.freeze({
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  USER: "user",
  CLIENT: "client",
  VENDOR: "vendor",
  FIRM: "firm",
  ASSOCIATE: "associate",
});
export const DEFAULT_ROLE = process.env.DEFAULT_ROLE || ROLES.USER;

// Default export for flexibility
const constants = {
  NODE_ENV,
  IS_PROD,
  API_PREFIX,
  CLIENT_ORIGIN,
  PORT,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  PAGE_SIZE,
  MAX_PAGE_SIZE,
  CORS_ENABLED,
  CORS_ORIGIN,
  MONGODB_URI,
  MONGODB_DB,
  ROLES,
  DEFAULT_ROLE,
};

export default constants;
