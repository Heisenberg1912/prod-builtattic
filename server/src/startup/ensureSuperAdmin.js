import argon2 from "argon2";
import User from "../models/User.js";

const resolveValue = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return candidates[candidates.length - 1];
};

export async function ensureSuperAdmin() {
  const email = resolveValue(
    process.env.SUPER_ADMIN_EMAIL,
    process.env.SUPERADMIN_EMAIL,
    process.env.SEED_SUPERADMIN_EMAIL,
    "superadmin@example.com"
  ).toLowerCase();

  const password = resolveValue(
    process.env.SUPER_ADMIN_PASSWORD,
    process.env.SUPERADMIN_PASSWORD,
    process.env.SEED_SUPERADMIN_PASSWORD,
    "superadmin@123"
  );

  const existing = await User.findOne({ email }).select("+passHash");
  const passHash = await argon2.hash(password);
  if (!existing) {
    await User.create({
      email,
      passHash,
      role: "superadmin",
      rolesGlobal: ["superadmin"],
    });
    console.log("[INIT] Super admin created:", email);
    return;
  }

  const updates = { passHash };
  if (existing.role !== "superadmin") {
    updates.role = "superadmin";
  }
  if (!Array.isArray(existing.rolesGlobal) || !existing.rolesGlobal.includes("superadmin")) {
    updates.rolesGlobal = ["superadmin"];
  }
  await User.updateOne({ _id: existing._id }, { $set: updates });
  console.log("[INIT] Super admin credentials refreshed for:", email);
}
