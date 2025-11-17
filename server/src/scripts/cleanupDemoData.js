import "../config/hardcodedEnv.js";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Firm from "../models/Firm.js";
import Product from "../models/Product.js";
import AssociateProfile from "../models/AssociateProfile.js";
import Asset from "../models/Asset.js";
import StudioRequest from "../models/StudioRequest.js";
import {
  USERS as DEMO_USERS,
  FIRMS as DEMO_FIRMS,
  STUDIO_PRODUCTS as DEMO_STUDIO_PRODUCTS,
  MATERIAL_PRODUCTS as DEMO_MATERIAL_PRODUCTS,
  ASSOCIATE_PROFILES as DEMO_ASSOCIATE_PROFILES,
} from "../seed/seedMarketplace.js";

const REQUIRED_FLAG = "ALLOW_DEMO_PURGE";
const JSON_SEED_SOURCES = ["material-studio-json"];
const skillsEmailRegex = /@skills\.builtattic\.com$/i;

const normalizeLower = (value) => (typeof value === "string" ? value.trim().toLowerCase() : null);
const uniqueLower = (values = []) => {
  const set = new Set();
  values.forEach((value) => {
    const lowered = normalizeLower(value);
    if (lowered) set.add(lowered);
  });
  return Array.from(set);
};

async function cleanupDemoData() {
  if ((process.env[REQUIRED_FLAG] || "").toLowerCase() !== "true") {
    console.error(
      `[cleanup-demo] Refusing to run without ${REQUIRED_FLAG}=true. Set the flag to confirm the purge.`,
    );
    process.exit(1);
  }

  const connection = await connectDB();
  if (!connection) {
    console.error("[cleanup-demo] Unable to connect to MongoDB. Check MONGODB_URI/MONGO_URI.");
    process.exit(1);
  }

  const summary = [];

  try {
    const explicitDemoEmails = uniqueLower([
      ...DEMO_USERS.map((user) => user.email),
      ...DEMO_ASSOCIATE_PROFILES.map((entry) => entry.email),
    ]);

    const userCriteria = [];
    if (explicitDemoEmails.length) {
      userCriteria.push({ email: { $in: explicitDemoEmails } });
    }
    userCriteria.push({ email: { $regex: skillsEmailRegex } });

    let demoUsers = [];
    if (userCriteria.length) {
      demoUsers = await User.find({ $or: userCriteria }).select("_id email").lean();
    }
    const demoUserIds = demoUsers.map((doc) => doc._id);

    if (demoUserIds.length) {
      const { deletedCount: profilesDeleted = 0 } = await AssociateProfile.deleteMany({
        user: { $in: demoUserIds },
      });
      summary.push({ label: "associate profiles", count: profilesDeleted });

      const { deletedCount: usersDeleted = 0 } = await User.deleteMany({ _id: { $in: demoUserIds } });
      summary.push({ label: "users", count: usersDeleted });
    } else {
      summary.push({ label: "associate profiles", count: 0 });
      summary.push({ label: "users", count: 0 });
    }

    const firmSlugSet = new Set(DEMO_FIRMS.map((firm) => normalizeLower(firm.slug)).filter(Boolean));
    const firmSlugList = Array.from(firmSlugSet);
    const firmMatch = [];
    if (firmSlugList.length) firmMatch.push({ slug: { $in: firmSlugList } });
    if (demoUserIds.length) firmMatch.push({ ownerUserId: { $in: demoUserIds } });

    const firmDocs = firmMatch.length
      ? await Firm.find({ $or: firmMatch }).select("_id slug name").lean()
      : [];
    const firmIdSet = new Set(firmDocs.map((firm) => String(firm._id)));
    const firmIds = Array.from(firmIdSet);

    if (firmIds.length) {
      const { deletedCount: requestsDeleted = 0 } = await StudioRequest.deleteMany({ firm: { $in: firmIds } });
      summary.push({ label: "studio requests", count: requestsDeleted });

      const { modifiedCount: membershipsPatched = 0 } = await User.updateMany(
        { "memberships.firm": { $in: firmIds } },
        { $pull: { memberships: { firm: { $in: firmIds } } } },
      );
      summary.push({ label: "user memberships patched", count: membershipsPatched });
    } else {
      summary.push({ label: "studio requests", count: 0 });
      summary.push({ label: "user memberships patched", count: 0 });
    }

    const productSlugSet = new Set([
      ...DEMO_STUDIO_PRODUCTS.map((product) => normalizeLower(product.slug)),
      ...DEMO_MATERIAL_PRODUCTS.map((product) => normalizeLower(product.slug)),
    ].filter(Boolean));
    const productSlugList = Array.from(productSlugSet);

    const productQueries = [];
    if (productSlugList.length) {
      productQueries.push(Product.find({ slug: { $in: productSlugList } }).select("_id slug"));
    }
    if (JSON_SEED_SOURCES.length) {
      productQueries.push(
        Product.find({ "metrics.seedSource": { $in: JSON_SEED_SOURCES } }).select("_id slug"),
      );
    }
    if (firmIds.length) {
      productQueries.push(Product.find({ firm: { $in: firmIds } }).select("_id slug"));
    }

    const productDocs = productQueries.length ? (await Promise.all(productQueries)).flat() : [];
    const productIdSet = new Set(productDocs.map((doc) => String(doc._id)));
    const productIds = Array.from(productIdSet);

    if (productIds.length) {
      const { deletedCount: assetsDeleted = 0 } = await Asset.deleteMany({ product: { $in: productIds } });
      summary.push({ label: "assets", count: assetsDeleted });

      const { deletedCount: productsDeleted = 0 } = await Product.deleteMany({ _id: { $in: productIds } });
      summary.push({ label: "products", count: productsDeleted });
    } else {
      summary.push({ label: "assets", count: 0 });
      summary.push({ label: "products", count: 0 });
    }

    if (firmIds.length) {
      const { deletedCount: firmsDeleted = 0 } = await Firm.deleteMany({ _id: { $in: firmIds } });
      summary.push({ label: "firms", count: firmsDeleted });
    } else {
      summary.push({ label: "firms", count: 0 });
    }

    console.log("\n[cleanup-demo] Removed legacy demo catalog data.");
    console.log("[cleanup-demo] Summary:");
    summary.forEach((row) => {
      console.log(`  - ${row.label}: ${row.count}`);
    });
    console.log("\n[cleanup-demo] Done. Fresh submissions will now be the only marketplace data.");

    await connection.close();
    process.exit(0);
  } catch (error) {
    console.error("[cleanup-demo] Failed:", error?.message || error);
    try {
      await connection.close();
    } catch (closeError) {
      console.warn("[cleanup-demo] Failed to close Mongo connection", closeError?.message || closeError);
    }
    process.exit(1);
  }
}

cleanupDemoData();