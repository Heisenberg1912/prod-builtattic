import "../config/hardcodedEnv.js";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Otp from "../models/OTP.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import AssociateProfile from "../models/AssociateProfile.js";
import AccessRequest from "../models/AccessRequest.js";
import SupportThread from "../models/supportThread.js";
import ActivityLog from "../models/ActivityLog.js";

const isProduction = (process.env.NODE_ENV || "").toLowerCase() === "production";

async function resetData() {
  if (isProduction && process.env.ALLOW_DATA_RESET !== "true") {
    console.error("[reset:data] Refusing to run in production without ALLOW_DATA_RESET=true");
    process.exit(1);
  }

  const connection = await connectDB();
  if (!connection) {
    console.error("[reset:data] Unable to connect to MongoDB. Set MONGODB_URI first.");
    process.exit(1);
  }

  const protectedEmails = [
    process.env.SUPER_ADMIN_EMAIL,
    process.env.SEED_SUPERADMIN_EMAIL,
  ]
    .map((email) => email && email.toLowerCase())
    .filter(Boolean);

  const userFilter = { role: { $ne: "superadmin" } };
  if (protectedEmails.length) {
    userFilter.email = { $nin: protectedEmails };
  }

  const summary = [];

  const { deletedCount: usersDeleted = 0 } = await User.deleteMany(userFilter);
  summary.push({ collection: "users", deleted: usersDeleted });

  const cleanupTargets = [
    { label: "otp codes", action: () => Otp.deleteMany({}) },
    { label: "carts", action: () => Cart.deleteMany({}) },
    { label: "orders", action: () => Order.deleteMany({}) },
    { label: "associate profiles", action: () => AssociateProfile.deleteMany({}) },
    { label: "access requests", action: () => AccessRequest.deleteMany({}) },
    { label: "support threads", action: () => SupportThread.deleteMany({}) },
    { label: "activity logs", action: () => ActivityLog.deleteMany({}) },
  ];

  for (const target of cleanupTargets) {
    const { deletedCount = 0 } = await target.action();
    summary.push({ collection: target.label, deleted: deletedCount });
  }

  console.log("\n[reset:data] Summary");
  summary.forEach((row) => {
    console.log(`  - ${row.collection}: ${row.deleted}`);
  });

  console.log("\n[reset:data] Done. Seed fresh data with `npm run seed:superadmin` or the other seed scripts.");

  try {
    await connection.close();
  } catch (error) {
    console.warn("[reset:data] Failed to close connection", error?.message || error);
  }

  process.exit(0);
}

resetData().catch((error) => {
  console.error("[reset:data] Unexpected failure", error);
  process.exit(1);
});
