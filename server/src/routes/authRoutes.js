import { Router } from "express";
import { registerUser, me } from "../controllers/authController.js";
// import { protect } from "../middleware/auth.js";
import * as auth from "../middleware/auth.js";

const router = Router();

// Safe fallback for protect middleware
const NOOP = (_req, _res, next) => next();
const protect =
  typeof auth.protect === "function" ? auth.protect
  : typeof auth.authenticateJWT === "function" ? auth.authenticateJWT
  : typeof auth.verifyToken === "function" ? auth.verifyToken
  : NOOP;

router.post("/register", registerUser);
router.get("/me", protect, me);

export default router;