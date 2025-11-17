import express from "express";
import {
  registerStep1,
  registerStep2,
  loginStep1,
  loginStep2,
  resendOTPEndpoint,
  checkOTPStatus,
  refresh,
  me,
} from "../controllers/authOTPController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Registration flow
router.post("/register", registerStep1); // Step 1: collect details + send OTP
router.post("/register/verify", registerStep2); // Step 2: verify OTP and activate

// Login flow
router.post("/login", loginStep1); // Step 1: validate credentials + send OTP
router.post("/login/verify", loginStep2); // Step 2: verify OTP and login

// OTP management routes
router.post("/otp/resend", resendOTPEndpoint);
router.get("/otp/status", checkOTPStatus);

// Token management
router.post("/refresh", refresh);
router.get("/me", protect, me);

export default router;
