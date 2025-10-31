import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import express from "express";

export const Protect = async (req, res, next) => {
  try {
    const token =
      req.headers["authorization"]?.split(" ")[1] || req.cookies.IDCard || "";
    if (!token) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      return next(err);
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const verifiedUser = await User.findById(decode.id);
    if (!verifiedUser) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      return next(err);
    }

    req.user = verifiedUser;
    next();
  } catch (error) {
    next(error);
  }
};

const router = express.Router();

router.get("/me", async (req, res) => {
  const userId = req.user.sub || req.user.id || req.user._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await User.findById(userId).select("-passwordHash -refreshTokens");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

export default router;