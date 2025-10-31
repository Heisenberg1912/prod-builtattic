// import express from "express";
// import User from "../models/User.js"; // adjust path as needed

// const router = express.Router();

// router.get("/", (req, res) => {
//   res.json({ message: "Users route working" });
// });

// router.post("/", (req, res) => {
//   // ...create user...
//   res.status(201).json({ message: "User created" });
// });

// router.get("/:id", (req, res) => {
//   // ...get user...
//   res.json({ message: "User details", id: req.params.id });
// });

// router.put("/:id", (req, res) => {
//   // ...update user...
//   res.json({ message: "User updated", id: req.params.id });
// });

// router.delete("/:id", (req, res) => {
//   // ...delete user...
//   res.json({ message: "User deleted", id: req.params.id });
// });

// router.get("/me", async (req, res) => {
//   // Prevent caching for this endpoint
//   res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
//   res.set("Pragma", "no-cache");
//   res.set("Expires", "0");
//   try {
//     // req.user is set by authMiddleware
//     const userId = req.user.sub || req.user.id || req.user._id;
//     if (!userId) return res.status(401).json({ message: "Unauthorized" });
//     const user = await User.findById(userId).select("-passwordHash -refreshTokens");
//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// export default router;

import express from "express";
import User from "../models/User.js"; // adjust path as needed

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Users route working" });
});

router.post("/", (req, res) => {
  // ...create user...
  res.status(201).json({ message: "User created" });
});

router.get("/:id", (req, res) => {
  // ...get user...
  res.json({ message: "User details", id: req.params.id });
});

router.put("/:id", (req, res) => {
  // ...update user...
  res.json({ message: "User updated", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  // ...delete user...
  res.json({ message: "User deleted", id: req.params.id });
});

router.get("/me", async (req, res) => {
  // Prevent caching for this endpoint
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  try {
    // req.user is set by authMiddleware
    const userId = req.user.sub || req.user.id || req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(userId).select("-passwordHash -refreshTokens");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
