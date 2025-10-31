import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
} from "../utils/tokens.js";
import { ROLES } from "../config/constants.js";
import { getDashboardPath } from "../utils/dashboardPaths.js";
import { sendWelcomeEmail } from "../services/email/emailService.js";
import nodemailer from "nodemailer";

const signToken = (user) => {
  return jwt.sign(
    { sub: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXP || "15m" }
  );
};

// Helper to generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Use only email and password from src/config/hardcodedEnv.js (for Gmail, Outlook, etc.)
const transporter = nodemailer.createTransport({
  service: "gmail", // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
});

// Helper to send email
async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log("OTP email sent:", info.response);
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw err;
  }
}

/**
 * Step 1: Initial login - validate credentials and send OTP
 */
export const loginStep1 = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("[LOGIN STEP 1] incoming:", { email, hasPassword: !!password });

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash"
    );
    console.log("[LOGIN STEP 1] userFound:", !!user);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await user.comparePassword(password);
    console.log("[LOGIN STEP 1] passwordMatch:", passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user has 2FA enabled
    if (!user.twoFactorEnabled) {
      // Skip OTP for users without 2FA
      const token = signToken(user);
      const dashboardPath = getDashboardPath(user.role);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return res.json({
        user: user.toJSON(),
        token,
        role: user.role,
        dashboardPath,
        requires2FA: false,
      });
    }

    // Generate and send OTP
    const otpResult = await generateAndSendOTP(email, "login", user._id);

    if (!otpResult.success) {
      return res.status(500).json({
        message: "Failed to send verification code",
        error: otpResult.error,
      });
    }

    // Return success without token (user needs to verify OTP)
    return res.json({
      message: "Verification code sent to your email",
      requires2FA: true,
      userId: user._id,
      email: user.email,
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error("[LOGIN STEP 1 ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Step 2: Verify OTP and complete login
 */
export const loginStep2 = async (req, res) => {
  try {
    const { email, otp, userId } = req.body;
    console.log("[LOGIN STEP 2] incoming:", { email, otp: !!otp, userId });

    if (!email || !otp || !userId) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and user ID required" });
    }

    // Verify OTP
    const otpResult = await verifyOTP(email, otp, "login", userId);

    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate token
    const token = signToken(user);
    const dashboardPath = getDashboardPath(user.role);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Always return role and dashboardPath for frontend navigation
    return res.json({
      user: user.toJSON(),
      token,
      role: user.role,
      dashboardPath,
      message: "Login successful",
    });
  } catch (error) {
    console.error("[LOGIN STEP 2 ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Step 1: Initial registration - create user and send verification OTP
 */
export const registerStep1 = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // These fields are required because this function is designed to CREATE the user in the database
    // before sending the OTP. That's why it checks for name, email, and password.
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user but mark email as unverified
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: role || ROLES.USER,
      isEmailVerified: false,
    });

    await user.save();

    // Generate and send OTP
    const otpResult = await generateAndSendOTP(email, "register", user._id);

    if (!otpResult.success) {
      // If OTP sending fails, delete the created user
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        message: "Failed to send verification code",
        error: otpResult.error,
      });
    }

    return res.status(201).json({
      message:
        "Registration successful. Please check your email for verification code.",
      userId: user._id,
      email: user.email,
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error("[REGISTER STEP 1 ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Step 2: Verify email with OTP and complete registration
 */
export const registerStep2 = async (req, res) => {
  try {
    const { email, otp, userId } = req.body;

    if (!email || !otp || !userId) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and user ID required" });
    }

    // Verify OTP
    const otpResult = await verifyOTP(email, otp, "register", userId);

    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error });
    }

    // Update user as verified
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isEmailVerified = true;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Generate token
    const token = signToken(user);
    const dashboardPath = getDashboardPath(user.role);

    return res.status(201).json({
      message: "Email verified successfully. Welcome to Builtatic!",
      user: user.toJSON(),
      token,
      role: user.role,
      dashboardPath,
    });
  } catch (error) {
    console.error("[REGISTER STEP 2 ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Resend OTP for various purposes
 */
export const resendOTPEndpoint = async (req, res) => {
  try {
    const { email, purpose, userId, orderId } = req.body;

    if (!email || !purpose) {
      return res
        .status(400)
        .json({ message: "Email and purpose are required" });
    }

    // Validate purpose
    const validPurposes = ["login", "register", "order"];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({ message: "Invalid purpose" });
    }

    const otpResult = await resendOTP(email, purpose, userId, orderId);

    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error });
    }

    return res.json({
      message: "Verification code resent successfully",
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error("[RESEND OTP ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Check OTP status
 */
export const checkOTPStatus = async (req, res) => {
  try {
    const { email, purpose, userId, orderId } = req.query;

    if (!email || !purpose) {
      return res
        .status(400)
        .json({ message: "Email and purpose are required" });
    }

    const result = await hasPendingOTP(email, purpose, userId, orderId);

    return res.json({
      hasPending: result.hasPending,
      expiresAt: result.expiresAt,
      error: result.error,
    });
  } catch (error) {
    console.error("[CHECK OTP STATUS ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Legacy login method (for backward compatibility)
export const login = async (req, res) => {
  console.log("[LEGACY LOGIN] Redirecting to step-based login");
  return loginStep1(req, res);
};

// Legacy register method (for backward compatibility)
export const register = async (req, res) => {
  console.log("[LEGACY REGISTER] Redirecting to step-based registration");
  return registerStep1(req, res);
};

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Missing refresh token" });
    const decoded = verifyRefresh(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Invalid token" });
    const exists = user.refreshTokens.some((rt) => rt.token === refreshToken);
    if (!exists) return res.status(401).json({ message: "Invalid token" });
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select(
      "-passwordHash -refreshTokens"
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Generate and store OTP (no user data required at OTP stage)
export const sendOtpToEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP is required" });

    // Generate expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP (remove old OTPs first)
    await Otp.deleteMany({});
    await Otp.create({ email, otp, expiresAt });
    const otpDoc = await Otp.findOne({ email, otp });

    // No email sending logic here, just respond success for OTP storage
    return res.status(200).json({ message: "OTP stored successfully" });
  } catch (err) {
    console.error("[SEND OTP ERROR]", err);
    return res
      .status(500)
      .json({ message: "Failed to store OTP", error: err.message });
  }
};

// Verify OTP only (no user data required)
export const registerWithOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    // Find OTP
    const otpDoc = await Otp.findOne({ otp });
    if (!otpDoc) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: "OTP expired" });
    }

    // Remove OTP after use
    await Otp.deleteOne({ _id: otpDoc._id });

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("[REGISTER OTP ERROR]", err);
    return res
      .status(500)
      .json({ message: "OTP verification failed", error: err.message });
  }
};

// Helper to verify OTP
async function verifyOtpForEmail(email, otp) {
  const otpDoc = await Otp.findOne({ email, otp });
  if (!otpDoc) return { success: false, error: "Invalid OTP" };
  if (otpDoc.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpDoc._id });
    return { success: false, error: "OTP expired" };
  }
  await Otp.deleteOne({ _id: otpDoc._id });
  return { success: true };
}

// Registration: Step 1 - create user and send OTP
export const sendRegisterOtp = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ message: "Email already registered" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email: email.toLowerCase(),
    password: passwordHash,
    role: role || ROLES.USER,
    isEmailVerified: false,
  });
  await user.save();
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await Otp.createOrReplace({ email, otp, expiresAt });
  try {
    await sendEmail(email, "Your Registration OTP", `Your OTP is: ${otp}`);
    res.status(201).json({
      message:
        "OTP sent to your email. Please check your inbox and spam/junk folder.",
      email: user.email,
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    res
      .status(500)
      .json({ message: "Failed to send OTP email", error: err.message });
  }
};

// Registration: Step 2 - verify OTP and mark user as verified
export const verifyRegisterOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }
  const otpResult = await verifyOtpForEmail(email, otp);
  if (!otpResult.success) {
    return res.status(400).json({ message: otpResult.error });
  }
  user.isEmailVerified = true;
  await user.save();
  res.json({ message: "Registration successful. You can now log in." });
};

// Only keep this version of verifyLoginOtp
export const verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.body;
  const otpDoc = await Otp.findOne({ email, otp });
  if (!otpDoc) return res.status(400).json({ message: "Invalid OTP" });
  if (otpDoc.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpDoc._id });
    return res.status(400).json({ message: "OTP expired" });
  }
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });
  await Otp.deleteOne({ _id: otpDoc._id });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ message: "Login successful", token, data: user });
};

export const sendLoginOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await Otp.createOrReplace({ email, otp, expiresAt });
  try {
    await sendEmail(email, "Your Login OTP", `Your OTP is: ${otp}`);
    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    res
      .status(500)
      .json({ message: "Failed to send OTP email", error: err.message });
  }
};

// 1. Replace dummy SMTP config with your real SMTP credentials in src/config/hardcodedEnv.js
// 2. Replace in-memory otpStore with a persistent store (DB/Redis) for production
// 3. Ensure password is saved as passwordHash in User model
// 4. Remove console.log of OTP in production
