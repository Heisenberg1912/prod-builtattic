import "../config/hardcodedEnv.js";

import connectDB from "../config/db.js";
import Asset from "../models/Asset.js";
import AssociateProfile from "../models/AssociateProfile.js";
import Firm from "../models/Firm.js";
import MeetingSchedule from "../models/MeetingSchedule.js";
import PlanUpload from "../models/PlanUpload.js";
import Product from "../models/Product.js";
import Rating from "../models/Rating.js";
import ServicePack from "../models/ServicePack.js";
import StudioRequest from "../models/StudioRequest.js";
import User from "../models/User.js";
import WorkspaceChatThread from "../models/WorkspaceChatThread.js";
import WorkspaceDownload from "../models/WorkspaceDownload.js";

const REQUIRED_FLAG = "ALLOW_WORKSPACE_PURGE";
const OWNER_TYPES = ["associate", "firm"];

const requireFlag = () => {
  if ((process.env[REQUIRED_FLAG] || "").toLowerCase() !== "true") {
    console.error(`[cleanup-workspaces] Refusing to run without ${REQUIRED_FLAG}=true`);
    process.exit(1);
  }
};

const deleteAndRecord = async (label, action, summary) => {
  const result = await action();
  const count = result?.deletedCount ?? result?.modifiedCount ?? 0;
  summary.push({ label, count });
};

async function purgeWorkspaces() {
  requireFlag();

  const connection = await connectDB();
  if (!connection) {
    console.error("[cleanup-workspaces] Unable to connect to MongoDB. Check MONGODB_URI/MONGO_URI.");
    process.exit(1);
  }

  const summary = [];

  // Gather ids to keep deletes targeted
  const firms = await Firm.find({}).select("_id slug name").lean();
  const firmIds = firms.map((firm) => firm._id);

  const products = await Product.find({
    $or: [
      { firm: { $in: firmIds } },
      { kind: { $in: ["studio", "material", "service"] } },
    ],
  })
    .select("_id slug kind firm")
    .lean();
  const productIds = products.map((product) => product._id);

  const associateProfiles = await AssociateProfile.find({}).select("_id user").lean();
  const associateUserIds = associateProfiles.map((profile) => profile.user).filter(Boolean);

  const roleBoundUsers = await User.find({ role: { $in: OWNER_TYPES } })
    .select("_id email role")
    .lean();

  const membershipLinkedUsers = firmIds.length
    ? await User.find({ "memberships.firm": { $in: firmIds } })
        .select("_id email role")
        .lean()
    : [];

  const userIds = new Set([
    ...associateUserIds.map((id) => String(id)),
    ...roleBoundUsers.map((user) => String(user._id)),
    ...membershipLinkedUsers.map((user) => String(user._id)),
  ]);

  console.log("[cleanup-workspaces] Targets discovered:");
  console.log(`  - Firms: ${firmIds.length}`);
  console.log(`  - Products: ${productIds.length}`);
  console.log(`  - Associate profiles: ${associateProfiles.length}`);
  console.log(`  - Users tied to firms/associates: ${userIds.size}`);

  await deleteAndRecord("service packs", () => ServicePack.deleteMany({ ownerType: { $in: OWNER_TYPES } }), summary);
  await deleteAndRecord(
    "meeting schedules",
    () => MeetingSchedule.deleteMany({ ownerType: { $in: OWNER_TYPES } }),
    summary,
  );
  await deleteAndRecord(
    "plan uploads",
    () => PlanUpload.deleteMany({ ownerType: { $in: OWNER_TYPES } }),
    summary,
  );
  await deleteAndRecord(
    "workspace downloads",
    () => WorkspaceDownload.deleteMany({ ownerType: { $in: OWNER_TYPES } }),
    summary,
  );
  await deleteAndRecord(
    "workspace chats",
    () => WorkspaceChatThread.deleteMany({ ownerType: { $in: OWNER_TYPES } }),
    summary,
  );
  await deleteAndRecord("ratings", () => Rating.deleteMany({ targetType: { $in: OWNER_TYPES } }), summary);

  if (firmIds.length) {
    await deleteAndRecord(
      "studio requests",
      () => StudioRequest.deleteMany({ firm: { $in: firmIds } }),
      summary,
    );
  }

  if (productIds.length) {
    await deleteAndRecord("assets", () => Asset.deleteMany({ product: { $in: productIds } }), summary);
    await deleteAndRecord("products", () => Product.deleteMany({ _id: { $in: productIds } }), summary);
  } else {
    summary.push({ label: "assets", count: 0 });
    summary.push({ label: "products", count: 0 });
  }

  await deleteAndRecord("associate profiles", () => AssociateProfile.deleteMany({}), summary);

  if (firmIds.length) {
    await deleteAndRecord("firms", () => Firm.deleteMany({ _id: { $in: firmIds } }), summary);
    const membershipCleanup = await User.updateMany(
      { "memberships.firm": { $in: firmIds } },
      { $pull: { memberships: { firm: { $in: firmIds } } } },
    );
    summary.push({ label: "memberships patched", count: membershipCleanup.modifiedCount || 0 });
  } else {
    summary.push({ label: "firms", count: 0 });
    summary.push({ label: "memberships patched", count: 0 });
  }

  if (userIds.size) {
    await deleteAndRecord(
      "users (firm/associate)",
      () =>
        User.deleteMany({
          _id: { $in: Array.from(userIds) },
          role: { $nin: ["superadmin", "admin"] },
        }),
      summary,
    );
  } else {
    summary.push({ label: "users (firm/associate)", count: 0 });
  }

  console.log("\n[cleanup-workspaces] Summary");
  summary.forEach((row) => {
    console.log(`  - ${row.label}: ${row.count}`);
  });
  console.log("\n[cleanup-workspaces] Done. Firm/associate dashboards and studio data have been removed.");

  try {
    await connection.close();
  } catch (error) {
    console.warn("[cleanup-workspaces] Failed to close Mongo connection", error?.message || error);
  }

  process.exit(0);
}

purgeWorkspaces().catch((error) => {
  console.error("[cleanup-workspaces] Unexpected failure", error?.message || error);
  process.exit(1);
});
