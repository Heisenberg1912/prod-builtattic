import express from "express";
import {
  sendRegisterOtp,
  verifyRegisterOtp,
  sendLoginOtp,
  verifyLoginOtp,
  resendOTPEndpoint,
  checkOTPStatus,
  refresh,
  me,
} from "../controllers/authOTPController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Registration flow
router.post("/register", sendRegisterOtp); // Step 1: send OTP
router.post("/register/verify", verifyRegisterOtp); // Step 2: verify OTP and register

// Login flow
router.post("/login", sendLoginOtp); // Step 1: send OTP
router.post("/login/verify", verifyLoginOtp); // Step 2: verify OTP and login

// OTP management routes
router.post("/otp/resend", resendOTPEndpoint);
router.get("/otp/status", checkOTPStatus);

// Token management
router.post("/refresh", refresh);
router.get("/me", protect, me);

export default router;
