import jwt from "jsonwebtoken";
import argon2 from "argon2";

import User from "../models/User.js";
import Otp from "../models/OTP.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
} from "../utils/tokens.js";
import { ROLES } from "../config/constants.js";
import { getDashboardPath } from "../utils/dashboardPaths.js";
import { sendOTPEmail, sendWelcomeEmail } from "../services/email/emailService.js";
import { defaultSettings } from "./settingsController.js";

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_PURPOSES = {
  LOGIN: "login",
  REGISTER: "register",
  ORDER: "order",
};

const signToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXP || "15m",
  });

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === 'undefined' || value === null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  return defaultValue;
};

const OTP_DISABLE_FOR_ALL = parseBoolean(process.env.OTP_DISABLE_FOR_ALL, false);
const OTP_SUPERADMIN_DEV_BYPASS = parseBoolean(
  process.env.OTP_SUPERADMIN_DEV_BYPASS,
  process.env.NODE_ENV !== 'production'
);
const OTP_BYPASS_EMAILS = new Set(
  String(process.env.OTP_BYPASS_EMAILS || '')
    .split(',')
    .map((value) => normalizeEmail(value))
    .filter(Boolean)
);

const shouldBypassTwoFactor = (user, normalizedEmail) => {
  if (OTP_DISABLE_FOR_ALL) return true;
  if (OTP_BYPASS_EMAILS.has(normalizedEmail)) return true;
  const rolesGlobal = Array.isArray(user.rolesGlobal) ? user.rolesGlobal : [];
  if (
    OTP_SUPERADMIN_DEV_BYPASS &&
    (user.role === ROLES.SUPER_ADMIN || rolesGlobal.includes('superadmin'))
  ) {
    return true;
  }
  return false;
};

function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}
const cloneDefaultSettings = () => JSON.parse(JSON.stringify(defaultSettings));
const buildSettingsPayload = (profile = {}, fallbackName, fallbackEmail) => {
  const base = cloneDefaultSettings();
  base.profile = { ...base.profile, ...(profile || {}) };
  if (fallbackName && !base.profile.fullName) {
    base.profile.fullName = fallbackName;
  }
  if (fallbackEmail && !base.profile.email) {
    base.profile.email = fallbackEmail;
  }
  return base;
};

const publicUserShape = (user) => ({
  _id: user._id,
  email: user.email,
  role: user.role,
  rolesGlobal: user.rolesGlobal || [],
  memberships: user.memberships || [],
  isSuspended: user.isSuspended || false,
  lastLoginAt: user.lastLoginAt || null,
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateAndSendOTP(email, purpose, userId, orderId) {
  const normalizedEmail = normalizeEmail(email);
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await Otp.createOrReplace({
    email: normalizedEmail,
    otp,
    purpose,
    userId,
    orderId,
    expiresAt,
  });
  await sendOTPEmail(normalizedEmail, otp, purpose);
  return { success: true, expiresAt };
}

async function verifyOTP(email, otp, purpose, userId, orderId) {
  const normalizedEmail = normalizeEmail(email);
  const query = { email: normalizedEmail, otp, purpose };
  if (userId) query.userId = userId;
  if (orderId) query.orderId = orderId;
  const record = await Otp.findOne(query);
  if (!record) {
    return { success: false, error: "Invalid verification code" };
  }
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    return { success: false, error: "Verification code expired" };
  }
  await record.deleteOne();
  return { success: true };
}

async function hasPendingOTP(email, purpose, userId, orderId) {
  const normalizedEmail = normalizeEmail(email);
  const query = { email: normalizedEmail, purpose };
  if (userId) query.userId = userId;
  if (orderId) query.orderId = orderId;
  const record = await Otp.findOne(query).lean();
  if (!record) {
    return { hasPending: false, expiresAt: null };
  }
  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    return { hasPending: false, expiresAt: null };
  }
  return { hasPending: true, expiresAt: record.expiresAt };
}

async function resendOTP(email, purpose, userId, orderId) {
  return generateAndSendOTP(email, purpose, userId, orderId);
}

const resolveRolesGlobal = (role) => {
  if (role === ROLES.SUPER_ADMIN) return ["superadmin"];
  if (role === ROLES.ADMIN) return ["admin"];
  return [];
};

export const loginStep1 = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const userDoc = await User.findOne({ email: normalizedEmail })
      .select(
        "+passHash +twoFactorEnabled +isSuspended +isEmailVerified +rolesGlobal +memberships +lastLoginAt +role +isClient"
      );

    if (!userDoc) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (userDoc.isSuspended) {
      return res.status(403).json({ message: "Account suspended" });
    }

    const passwordMatch = await argon2.verify(userDoc.passHash, password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!userDoc.isEmailVerified) {
      return res.status(403).json({ message: "Please verify your email before signing in" });
    }

    const user = userDoc.toObject();
    const bypass2FA = shouldBypassTwoFactor(user, normalizedEmail);
    const requires2FA = user.twoFactorEnabled !== false && !bypass2FA;
    if (!requires2FA) {
      userDoc.lastLoginAt = new Date();
      await userDoc.save({ validateBeforeSave: false });
      const token = signToken(user);
      const dashboardPath = getDashboardPath(user.role);
      return res.json({
        user: publicUserShape(user),
        token,
        role: user.role,
        dashboardPath,
        requires2FA: false,
      });
    }

    const otpResult = await generateAndSendOTP(
      normalizedEmail,
      OTP_PURPOSES.LOGIN,
      user._id
    );
    return res.json({
      message: "Verification code sent to your email",
      requires2FA: true,
      userId: user._id,
      email: normalizedEmail,
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error("[LOGIN STEP 1 ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginStep2 = async (req, res) => {
  try {
    const { email, otp, userId } = req.body;
    if (!email || !otp || !userId) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and user ID required" });
    }

    const otpResult = await verifyOTP(email, otp, OTP_PURPOSES.LOGIN, userId);
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error });
    }

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userDoc.isSuspended) {
      return res.status(403).json({ message: "Account suspended" });
    }

    userDoc.lastLoginAt = new Date();
    await userDoc.save({ validateBeforeSave: false });

    const token = signToken(userDoc);
    const dashboardPath = getDashboardPath(userDoc.role);

    return res.json({
      user: publicUserShape(userDoc),
      token,
      role: userDoc.role,
      dashboardPath,
      message: "Login successful",
    });
  } catch (error) {
    console.error("[LOGIN STEP 2 ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const registerStep1 = async (req, res) => {
  try {
    const { name, fullName, email, password, role = ROLES.USER, profile = {} } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const displayName = name || fullName || profile.fullName || normalizedEmail.split("@")[0];
    const passHash = await argon2.hash(password);
    const rolesGlobal = resolveRolesGlobal(role);
    const settingsPayload = buildSettingsPayload(profile, displayName, normalizedEmail);

    const user = await User.create({
      email: normalizedEmail,
      passHash,
      role,
      rolesGlobal,
      settings: settingsPayload,
      isClient: role === ROLES.CLIENT,
      isEmailVerified: false,
      twoFactorEnabled: true,
    });

    const otpResult = await generateAndSendOTP(normalizedEmail, OTP_PURPOSES.REGISTER, user._id);

    return res.status(201).json({
      message: "OTP sent to your email. Please verify to finish registration.",
      userId: user._id,
      email: normalizedEmail,
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error("[REGISTER STEP 1 ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const registerStep2 = async (req, res) => {
  try {
    const { email, otp, userId } = req.body;

    if (!email || !otp || !userId) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and user ID required" });
    }

    const otpResult = await verifyOTP(email, otp, OTP_PURPOSES.REGISTER, userId);
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isEmailVerified = true;
    await user.save();

    try {
      await sendWelcomeEmail(user.email, user.settings?.profile?.fullName || user.email);
    } catch (err) {
      console.warn("[REGISTER STEP 2] welcome email failed", err.message);
    }

    const token = signToken(user);
    const dashboardPath = getDashboardPath(user.role);

    return res.status(201).json({
      message: "Email verified successfully. Welcome to Builtattic!",
      user: publicUserShape(user),
      token,
      role: user.role,
      dashboardPath,
    });
  } catch (error) {
    console.error("[REGISTER STEP 2 ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendOTPEndpoint = async (req, res) => {
  try {
    const { email, purpose, userId, orderId } = req.body;

    if (!email || !purpose) {
      return res
        .status(400)
        .json({ message: "Email and purpose are required" });
    }

    if (!Object.values(OTP_PURPOSES).includes(purpose)) {
      return res.status(400).json({ message: "Invalid purpose" });
    }

    const otpResult = await resendOTP(email, purpose, userId, orderId);
    return res.json({
      message: "Verification code resent successfully",
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error("[RESEND OTP ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkOTPStatus = async (req, res) => {
  try {
    const { email, purpose, userId, orderId } = req.query;

    if (!email || !purpose) {
      return res
        .status(400)
        .json({ message: "Email and purpose are required" });
    }

    const result = await hasPendingOTP(email, purpose, userId, orderId);
    return res.json(result);
  } catch (error) {
    console.error("[CHECK OTP STATUS ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => loginStep1(req, res);
export const register = async (req, res) => registerStep1(req, res);

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }
    const decoded = verifyRefresh(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const nextRefreshToken = signRefreshToken({ id: user._id, role: user.role });
    res.json({ accessToken, refreshToken: nextRefreshToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-passHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: publicUserShape(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
