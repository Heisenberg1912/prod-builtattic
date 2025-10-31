import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { getDashboardPath } from "../utils/dashboardPaths.js";
import { validateEmailDeliverability } from "../utils/emailValidation.js";

const ALLOWED_ROLES = new Set([
  "user",
  "client",
  "vendor",
  "firm",
  "associate",
  "admin",
  "superadmin"
]);

// --- REGISTER ---
export const Register = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password) {
      return next(Object.assign(new Error("All fields must be required"), { statusCode: 400 }));
    }

    const deliverable = await validateEmailDeliverability(email.toLowerCase());
    if (!deliverable) {
      return next(Object.assign(new Error("Email domain cannot receive mail"), { statusCode: 400 }));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(Object.assign(new Error("User already exists"), { statusCode: 409 }));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const safeRole = ALLOWED_ROLES.has((role || "").toLowerCase()) ? role.toLowerCase() : "user";

    const rolesGlobal = [];
    if (safeRole === "superadmin") rolesGlobal.push("superadmin");
    if (safeRole === "admin") rolesGlobal.push("admin");

    await User.create({ fullName, email, password: hashedPassword, role: safeRole, rolesGlobal });
    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    next(error);
  }
};

// --- LOGIN ---
export const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email }).lean();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      dashboardPath: getDashboardPath(user.role),
      user: {
        _id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- GET CURRENT USER ---
export const Getme = async (req, res, next) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store"
    });
    res.status(200).json({ data: req.user });
  } catch (error) {
    next(error);
  }
};

// --- UPDATE USER ---
export const Update = async (req, res, next) => {
  try {
    const { fullName, password, newPassword } = req.body;
    if (!fullName || !password || !newPassword) {
      return next(Object.assign(new Error("All fields are required"), { statusCode: 400 }));
    }

    const currentUser = req.user;
    if (!currentUser) {
      return next(Object.assign(new Error("User not found. Login again."), { statusCode: 401 }));
    }

    if (!(await bcrypt.compare(password, currentUser.password))) {
      return next(Object.assign(new Error("Wrong password"), { statusCode: 401 }));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      { fullName, password: hashedPassword },
      { new: true }
    );

    res.status(200).json({ message: "User updated successfully", data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// --- LOGOUT ---
export const Logout = async (req, res, next) => {
  try {
    res.clearCookie("IDCard", { maxAge: 0 }).status(200).json({ message: "User logout successful" });
  } catch (error) {
    next(error);
  }
};

// --- DELETE USER ---
export const Delete = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(Object.assign(new Error("All fields are required"), { statusCode: 400 }));
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser || existingUser._id.toString() !== req.user._id.toString()) {
      return next(Object.assign(new Error("Unauthorized"), { statusCode: 400 }));
    }

    if (!(await bcrypt.compare(password, existingUser.password))) {
      return next(Object.assign(new Error("Invalid credentials"), { statusCode: 401 }));
    }

    await User.findByIdAndDelete(req.user._id);
    res.clearCookie("IDCard", { maxAge: 0 }).status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export { Getme as me, Register as registerUser };
