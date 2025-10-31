// import express from "express";
// import mongoose from "mongoose"; // + DB
// import bcrypt from "bcryptjs";   // + password hashing

// const router = express.Router();

// // In-memory store
// const studios = [];
// let nextId = 1;

// // In-memory users for auth (minimal)
// const users = [];
// let nextUserId = 1;

// const normalizeEmail = (e) => String(e || "").trim().toLowerCase();
// const makeToken = (u) => Buffer.from(`uid:${u.id}:${Date.now()}`).toString("base64");

// // --- DB helpers (lazy connect) ---
// async function ensureDb() {
//   if (mongoose.connection.readyState === 1) return;
//   if (mongoose.connection.readyState === 2) {
//     await new Promise((r) => mongoose.connection.once("connected", r));
//     return;
//   }
//   const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/builtattic";
//   await mongoose.connect(uri, { autoIndex: true });
// }

// const UserSchema = new mongoose.Schema(
//   {
//     email: { type: String, required: true, unique: true, index: true },
//     password: { type: String, required: true }, // hashed
//     role: { type: String, default: "user" },
//     profile: { type: mongoose.Schema.Types.Mixed },
//     createdAt: { type: Date, default: Date.now },
//   },
//   { collection: "users" }
// );
// const User = mongoose.models.User || mongoose.model("User", UserSchema);

// // Auth: Register (multiple aliases incl. /api and /v1)
// router.post(
//   [
//     "/auth/register",
//     "/register",
//     "/auth/signup",
//     "/signup",
//     // API prefixed
//     "/api/auth/register",
//     "/api/register",
//     "/api/auth/signup",
//     "/api/signup",
//     "/api/users/register",
//     "/api/user/register",
//     "/api/user/signup",
//     "/api/users/signup",
//     // v1 variants
//     "/api/v1/auth/register",
//     "/api/v1/register",
//     "/api/v1/auth/signup",
//     "/api/v1/signup",
//     "/v1/auth/register",
//     "/v1/register",
//     "/v1/auth/signup",
//     "/v1/signup",
//   ],
//   async (req, res) => {
//     try {
//       const b = req.body || {};
//       const email = normalizeEmail(b.email || b.user?.email);
//       const password = b.password || b.pass || b.pwd;
//       const role = b.role || b.user?.role || "user";

//       if (!email || !password) {
//         return res.status(400).json({ message: "email and password required" });
//       }

//       // Use DB
//       await ensureDb();
//       const exists = await User.findOne({ email }).lean();
//       if (exists) {
//         return res.status(409).json({ message: "Email already registered" });
//       }

//       const hash = await bcrypt.hash(password, 10);
//       const doc = await User.create({
//         email,
//         password: hash,
//         role,
//         profile: { ...b },
//       });

//       return res.status(201).json({
//         success: true,
//         message: "Registered successfully",
//         user: { id: doc._id, email: doc.email, role: doc.role },
//       });
//     } catch (err) {
//       // If DB fails for some reason, keep old in-memory behavior as last resort
//       try {
//         const b = req.body || {};
//         const email = normalizeEmail(b.email || b.user?.email);
//         const password = b.password || b.pass || b.pwd;
//         const role = b.role || b.user?.role || "user";
//         if (!email || !password) throw err;
//         if (users.some((u) => u.email === email)) {
//           return res.status(409).json({ message: "Email already registered" });
//         }
//         const user = { id: nextUserId++, email, password, role, profile: { ...b } };
//         users.push(user);
//         return res.status(201).json({
//           success: true,
//           message: "Registered successfully (memory)",
//           user: { id: user.id, email: user.email, role: user.role },
//         });
//       } catch {
//         return res.status(500).json({ message: "Registration failed" });
//       }
//     }
//   }
// );

// // Auth: Login (multiple aliases incl. /api and /v1)
// router.post(
//   [
//     "/auth/login",
//     "/login",
//     "/users/login",
//     "/signin",
//     "/auth/signin",
//     // API prefixed
//     "/api/auth/login",
//     "/api/login",
//     "/api/users/login",
//     "/api/signin",
//     "/api/auth/signin",
//     // v1 variants
//     "/api/v1/auth/login",
//     "/api/v1/login",
//     "/api/v1/users/login",
//     "/api/v1/signin",
//     "/api/v1/auth/signin",
//     "/v1/auth/login",
//     "/v1/login",
//     "/v1/users/login",
//     "/v1/signin",
//     "/v1/auth/signin",
//   ],
//   async (req, res) => {
//     const b = req.body || {};
//     const email = normalizeEmail(b.email || b.username || b.user?.email);
//     const password = b.password || b.pass || b.pwd;

//     if (!email || !password) {
//       return res.status(400).json({ message: "email and password required" });
//     }

//     // Try DB first
//     try {
//       await ensureDb();
//       const doc = await User.findOne({ email });
//       if (!doc) return res.status(404).json({ message: "User not found" });
//       const ok = await bcrypt.compare(password, doc.password);
//       if (!ok) return res.status(401).json({ message: "Invalid credentials" });

//       const token = makeToken({ id: String(doc._id) });
//       return res.json({
//         token,
//         role: doc.role,
//         user: { id: doc._id, email: doc.email, role: doc.role },
//         redirectPath: null,
//       });
//     } catch {
//       // Fallback to in-memory if DB unavailable
//       const user = users.find((u) => u.email === email);
//       if (!user) return res.status(404).json({ message: "User not found" });
//       if (user.password !== password) return res.status(401).json({ message: "Invalid credentials" });

//       const token = makeToken(user);
//       return res.json({
//         token,
//         role: user.role,
//         user: { id: user.id, email: user.email, role: user.role },
//         redirectPath: null,
//       });
//     }
//   }
// );

// // Optional: current user (Bearer <token>)
// router.get(
//   ["/auth/me", "/api/auth/me", "/api/v1/auth/me", "/v1/auth/me"],
//   async (req, res) => {
//     const auth = req.headers.authorization || "";
//     const token = auth.replace(/^Bearer\s+/i, "");
//     if (!token) return res.status(401).json({ message: "Missing token" });
//     try {
//       const [_, idStr] = Buffer.from(token, "base64").toString().split(":");
//       // Try DB
//       try {
//         await ensureDb();
//         const doc = await User.findById(idStr).lean();
//         if (doc) {
//           return res.json({ user: { id: doc._id, email: doc.email, role: doc.role } });
//         }
//       } catch {
//         // ignore and fall back
//       }
//       // Fallback to memory
//       const user = users.find((u) => String(u.id) === String(idStr));
//       if (!user) return res.status(401).json({ message: "Invalid token" });
//       res.json({ user: { id: user.id, email: user.email, role: user.role } });
//     } catch {
//       res.status(401).json({ message: "Invalid token" });
//     }
//   }
// );

// router.get("/", (req, res) => {
//   // always return an array
//   res.json(studios);
// });

// router.post("/", (req, res) => {
//   const data = req.body || {};
//   if (!data.name || typeof data.name !== "string") {
//     return res.status(400).json({ error: "name is required" });
//   }
//   const newStudio = { id: nextId++, ...data };
//   studios.push(newStudio);
//   res.status(201).json(newStudio);
// });

// router.get("/:id", (req, res) => {
//   const id = Number(req.params.id);
//   const studio = studios.find((s) => s.id === id);
//   if (!studio) return res.status(404).json({ error: "Studio not found" });
//   res.json(studio);
// });

// router.put("/:id", (req, res) => {
//   const id = Number(req.params.id);
//   const idx = studios.findIndex((s) => s.id === id);
//   if (idx === -1) return res.status(404).json({ error: "Studio not found" });

//   const updates = req.body || {};
//   delete updates.id; // prevent id overwrite

//   studios[idx] = { ...studios[idx], ...updates };
//   res.json(studios[idx]);
// });

// router.delete("/:id", (req, res) => {
//   const id = Number(req.params.id);
//   const idx = studios.findIndex((s) => s.id === id);
//   if (idx === -1) return res.status(404).json({ error: "Studio not found" });

//   const [deleted] = studios.splice(idx, 1);
//   res.json(deleted);
// });

// export default router;

import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const router = express.Router();

// ===== In-memory store =====
const studios = [];
let nextId = 1;

const users = [];
let nextUserId = 1;

// ===== Helpers =====
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const makeToken = (user) =>
  Buffer.from(`uid:${user.id}:${Date.now()}`).toString("base64");

async function ensureDb() {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) =>
      mongoose.connection.once("connected", resolve)
    );
    return;
  }
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/builtattic";
  await mongoose.connect(uri, { autoIndex: true });
}

// ===== User Model =====
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    profile: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "users" }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// ===== Route Aliases =====
const registerPaths = [
  "/auth/register", "/register", "/auth/signup", "/signup",
  "/api/auth/register", "/api/register", "/api/auth/signup", "/api/signup",
  "/api/users/register", "/api/user/register", "/api/user/signup", "/api/users/signup",
  "/api/v1/auth/register", "/api/v1/register", "/api/v1/auth/signup", "/api/v1/signup",
  "/v1/auth/register", "/v1/register", "/v1/auth/signup", "/v1/signup",
];

const loginPaths = [
  "/auth/login", "/login", "/users/login", "/signin", "/auth/signin",
  "/api/auth/login", "/api/login", "/api/users/login", "/api/signin", "/api/auth/signin",
  "/api/v1/auth/login", "/api/v1/login", "/api/v1/users/login", "/api/v1/signin", "/api/v1/auth/signin",
  "/v1/auth/login", "/v1/login", "/v1/users/login", "/v1/signin", "/v1/auth/signin",
];

const mePaths = ["/auth/me", "/api/auth/me", "/api/v1/auth/me", "/v1/auth/me"];

// ===== REGISTER =====
router.post(registerPaths, async (req, res) => {
  const b = req.body || {};
  const email = normalizeEmail(b.email || b.user?.email);
  const password = b.password || b.pass || b.pwd;
  const role = b.role || b.user?.role || "user";

  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" });
  }

  try {
    await ensureDb();
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const doc = await User.create({ email, password: hash, role, profile: { ...b } });

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      user: { id: doc._id, email: doc.email, role: doc.role },
    });
  } catch {
    // fallback to memory
    if (users.some(u => u.email === email)) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const user = { id: nextUserId++, email, password, role, profile: { ...b } };
    users.push(user);
    return res.status(201).json({
      success: true,
      message: "Registered successfully (memory)",
      user: { id: user.id, email: user.email, role: user.role },
    });
  }
});

// ===== LOGIN =====
router.post(loginPaths, async (req, res) => {
  const b = req.body || {};
  const email = normalizeEmail(b.email || b.username || b.user?.email);
  const password = b.password || b.pass || b.pwd;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" });
  }

  try {
    await ensureDb();
    const doc = await User.findOne({ email });
    if (!doc) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, doc.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    return res.json({
      token: makeToken({ id: String(doc._id) }),
      role: doc.role,
      user: { id: doc._id, email: doc.email, role: doc.role },
      redirectPath: null,
    });
  } catch {
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.password !== password) return res.status(401).json({ message: "Invalid credentials" });

    return res.json({
      token: makeToken(user),
      role: user.role,
      user: { id: user.id, email: user.email, role: user.role },
      redirectPath: null,
    });
  }
});

// ===== CURRENT USER =====
router.get(mePaths, async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const [_, idStr] = Buffer.from(token, "base64").toString().split(":");
    await ensureDb();

    const doc = await User.findById(idStr).lean();
    if (doc) return res.json({ user: { id: doc._id, email: doc.email, role: doc.role } });

    const user = users.find(u => String(u.id) === String(idStr));
    if (!user) return res.status(401).json({ message: "Invalid token" });
    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

// ===== STUDIOS =====
router.get("/", (req, res) => res.json(studios));

router.post("/", (req, res) => {
  const data = req.body || {};
  if (!data.name || typeof data.name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }
  const newStudio = { id: nextId++, ...data };
  studios.push(newStudio);
  res.status(201).json(newStudio);
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const studio = studios.find(s => s.id === id);
  if (!studio) return res.status(404).json({ error: "Studio not found" });
  res.json(studio);
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = studios.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Studio not found" });

  const updates = { ...req.body };
  delete updates.id;
  studios[idx] = { ...studios[idx], ...updates };
  res.json(studios[idx]);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = studios.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Studio not found" });

  const [deleted] = studios.splice(idx, 1);
  res.json(deleted);
});

export default router;
