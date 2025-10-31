import "../config/hardcodedEnv.js";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import argon2 from "argon2";

import Product from "../models/Product.js";
import AssociateProfile from "../models/AssociateProfile.js";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../..");

const MATERIAL_JSON_PATH = path.resolve(ROOT_DIR, "Material Studio Dummy List.json");
const SKILL_JSON_PATH = path.resolve(ROOT_DIR, "Skill Studio Dummy list.json");

const currencyBySymbol = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "₹": "INR",
  "¥": "JPY",
};

function slugify(value, fallback = "item") {
  if (!value || !String(value).trim()) return fallback;
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80) || fallback;
}

function parseUnitPrice(raw) {
  if (!raw || typeof raw !== "string") {
    return {
      amount: null,
      currency: "USD",
      unit: "unit",
      unitLabel: "Per unit",
      raw: raw ?? "",
    };
  }
  const match = raw.match(/([€£₹$])?\s*([\d,.]+(?:\.\d+)?)/);
  const amount = match ? Number(match[2].replace(/,/g, "")) : null;
  const symbol = match?.[1] || "$";
  const currency = currencyBySymbol[symbol] || "USD";
  const unitPart = raw.includes("/") ? raw.split("/").slice(1).join("/").trim() : "unit";
  const unit = unitPart.replace(/^per\s+/i, "").toLowerCase() || "unit";
  const unitLabel = raw.includes("/") ? `Per ${unitPart}` : `Per ${unit}`;
  return { amount, currency, unit, unitLabel, raw };
}

function parseLeadTime(raw) {
  if (!raw || typeof raw !== "string") {
    return { days: null, weeks: null, raw: raw ?? "" };
  }
  const lower = raw.toLowerCase();
  const numbers = raw.match(/\d+(?:\.\d+)?/g)?.map((num) => Number(num)) || [];
  if (!numbers.length) return { days: null, weeks: null, raw };
  const average = numbers.length === 1 ? numbers[0] : numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  if (lower.includes("week")) {
    const weeks = average;
    return { weeks, days: Math.round(weeks * 7), raw };
  }
  if (lower.includes("month")) {
    const weeks = average * 4;
    return { weeks, days: Math.round(weeks * 7), raw };
  }
  const days = average;
  return { days, weeks: days / 7, raw };
}

function parseMoq(raw) {
  if (!raw || typeof raw !== "string") return { quantity: null, text: raw ?? "" };
  const numbers = raw.match(/\d+(?:\.\d+)?/g)?.map((val) => Number(val)) || [];
  const quantity = numbers.length ? numbers[numbers.length - 1] : null;
  return { quantity, text: raw };
}

function splitList(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[\n;,]+/)
    .map((entry) => entry.replace(/^\s*\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function parseSpecs(...blocks) {
  const specs = [];
  blocks.filter(Boolean).forEach((block) => {
    const lines = String(block)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    lines.forEach((line) => {
      const [label, ...rest] = line.split(":");
      if (!rest.length) return;
      const value = rest.join(":").trim();
      const cleanLabel = label.trim();
      if (!cleanLabel || !value) return;
      specs.push({ label: cleanLabel, value });
    });
  });
  return specs;
}

function deriveCategory(materialName) {
  if (!materialName) return "Materials";
  const primary = materialName.split("(")[0].trim();
  return primary || materialName || "Materials";
}

function buildMaterialDocument(record, seenSlugs) {
  const materialName = String(record["Material"] || "").trim();
  const brandName = String(record["Brand Name"] || "").trim();
  const vendorName = String(record["Vendor Name"] || "").trim();
  const titleBase = [brandName, materialName].filter(Boolean).join(" - ") || materialName || brandName || `Material ${record["S.no"] || ""}`;
  let slug = slugify(titleBase, `material-${record["S.no"] || "item"}`);
  let counter = 1;
  while (seenSlugs.has(slug)) {
    counter += 1;
    slug = `${slug}-${counter}`;
  }
  seenSlugs.add(slug);

  const unitPrice = parseUnitPrice(record["Unit Price"]);
  const leadTime = parseLeadTime(record["Lead Time"]);
  const moq = parseMoq(record["MOQ"]);
  const category = deriveCategory(materialName);

  const tags = splitList(record["Trending Usages"]);
  const highlights = [
    ...tags,
    ...splitList(record["Sustainability Features"]),
  ];

  const deliverables = splitList(record["Portfolio Deliverables"]);
  if (deliverables.length) {
    deliverables.forEach((item) => highlights.push(item));
  }

  const alternativeVendors = splitList(record["Alternative Vendors"]);

  const specs = parseSpecs(record["Product Specification Brief"], record["Additional Details"]);

  const description = String(record["Product Specification Brief"] || record["Product Usage"] || "").trim();
  const summary = String(record["Product Usage"] || "").trim();

  const locationText = String(record["Location"] || "").trim();
  const [city, country] = locationText.split(",").map((value) => value && value.trim());

  const pricing = {
    unit: unitPrice.unit,
    unitLabel: unitPrice.unitLabel,
    currency: unitPrice.currency,
    basePrice: unitPrice.amount ?? 0,
  };
  if (Number.isFinite(moq.quantity)) {
    pricing.minQuantity = moq.quantity;
  }

  const delivery = {
    leadTimeWeeks: Number.isFinite(leadTime.weeks) ? Number(leadTime.weeks) : null,
    fulfilmentType: "logistics",
    handoverMethod: "freight",
    includesInstallation: false,
    instructions: record["Additional Details"] || record["Lead Time"],
    items: deliverables.slice(0, 5),
  };

  const metafields = {
    vendor: vendorName || record["Vendor"] || "",
    brand: brandName,
    location: locationText,
    contact: record["Contact Info"],
    unitPrice: record["Unit Price"],
    moq: Number.isFinite(moq.quantity) ? moq.quantity : undefined,
    moqLabel: record["MOQ"],
    leadTimeLabel: record["Lead Time"],
    leadTimeDays: Number.isFinite(leadTime.days) ? Math.round(leadTime.days) : undefined,
    sustainability: record["Sustainability Features"],
    trendNotes: record["Trending Usages"],
    usage: record["Product Usage"],
    deliverables: record["Portfolio Deliverables"],
    additionalDetails: record["Additional Details"],
    alternativeVendors: record["Alternative Vendors"],
    category,
    seedSource: "material-studio-json",
  };

  return {
    title: titleBase,
    slug,
    kind: "material",
    description,
    summary,
    heroImage: record.heroImage || null,
    gallery: Array.isArray(record.gallery) ? record.gallery : [],
    pricing,
    currency: unitPrice.currency,
    status: "published",
    categories: [category].filter(Boolean),
    tags,
    highlights: highlights.filter(Boolean),
    specs,
    delivery,
    location: {
      city: city || undefined,
      country: country || undefined,
    },
    metafields,
    metrics: { seedSource: "material-studio-json" },
  };
}

function parseAvgCost(value) {
  if (!value) return null;
  const numbers = String(value).match(/\d+(?:\.\d+)?/g)?.map((num) => Number(num.replace(/,/g, ""))) || [];
  if (!numbers.length) return null;
  if (numbers.length === 1) return numbers[0];
  return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
}

function buildAssociateDocument(record, index) {
  const title = String(record["Firm Name"] || `Skill Associate ${index + 1}`).trim();
  const slug = slugify(title, `skill-${index + 1}`);
  const email = `${slug}@skills.builtattic.com`;
  const location = String(record["Location (HQ)"] || "").trim();
  const yearEstablished = Number(record["Year Est."] || record["Year Est"]);
  const currentYear = new Date().getFullYear();
  const experienceYears = Number.isFinite(yearEstablished)
    ? Math.max(0, currentYear - yearEstablished)
    : null;

  const categories = splitList(record["Primary Categories"]);
  const primaryStyle = String(record["Primary Style"] || "").split(/[,/]/).map((value) => value.trim()).filter(Boolean);
  const avgCostBlock = record["Avg. Cost (USD"] || record["Avg. Cost (USD)"] || null;
  const avgCostValue = typeof avgCostBlock === "object" && avgCostBlock !== null
    ? Object.values(avgCostBlock)[0]
    : avgCostBlock;
  const rateBase = parseAvgCost(avgCostValue);
  const hourlyRate = Number.isFinite(rateBase) ? Math.round(rateBase / 40) : null;

  const dailyRate = hourlyRate ? hourlyRate * 8 : null;
  const principal = String(record["Principal Architect(s)"] || "").trim();

  const keyProjects = [
    String(record["Project 1 (Category)"] || "").trim(),
    String(record["Project 2 (Category)"] || "").trim(),
  ]
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(.*?)(?:\s*\((.*)\))?$/);
      return {
        title: match?.[1]?.trim() || entry,
        scope: match?.[2]?.trim() || "Signature project",
        year: Number.isFinite(yearEstablished) ? yearEstablished + Math.max(1, Math.min(10, index + 1)) : undefined,
        role: "Lead Architect",
      };
    });

  const summaryParts = [];
  if (principal) summaryParts.push(`Led by ${principal}`);
  if (primaryStyle.length) summaryParts.push(`${primaryStyle.join(", ")} specialists`);
  if (categories.length) summaryParts.push(`Focusing on ${categories.join(", ")}`);
  const summary = summaryParts.join(". ") || undefined;

  const completedProjects = experienceYears ? experienceYears * 4 : 20 + index * 3;
  const rating = 4.2 + ((index % 7) * 0.1);

  return {
    email,
    profile: {
      title,
      location,
      hourlyRate: hourlyRate || undefined,
      rates: {
        hourly: hourlyRate || undefined,
        daily: dailyRate || undefined,
        currency: "USD",
      },
      availability: "Consultancy basis",
      availabilityWindows: [],
      timezone: "UTC",
      experienceYears: experienceYears || undefined,
      specialisations: categories.length ? categories : undefined,
      softwares: primaryStyle.length ? primaryStyle : undefined,
      languages: ["English"],
      completedProjects,
      rating: Number(rating.toFixed(1)),
      avatar: null,
      summary,
      certifications: record["License No."] ? [record["License No."]] : undefined,
      keyProjects,
    },
  };
}

async function seedMaterials(materialRecords) {
  const results = { upserted: 0, total: materialRecords.length };
  const seenSlugs = new Set();
  for (const record of materialRecords) {
    const doc = buildMaterialDocument(record, seenSlugs);
    await Product.findOneAndUpdate(
      { slug: doc.slug },
      {
        $set: {
          ...doc,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.upserted += 1;
  }
  return results;
}

async function seedAssociates(associateRecords) {
  const results = { upserted: 0, total: associateRecords.length };
  const defaultPassword = await argon2.hash("Skill#123");

  for (const [index, record] of associateRecords.entries()) {
    const doc = buildAssociateDocument(record, index);
    const existingUser = await User.findOne({ email: doc.email }).lean();
    let userId;
    if (existingUser) {
      userId = existingUser._id;
    } else {
      const created = await User.create({
        email: doc.email,
        passHash: defaultPassword,
        role: "associate",
        rolesGlobal: [],
        memberships: [],
        isClient: false,
      });
      userId = created._id;
    }

    await AssociateProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          ...doc.profile,
          user: userId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.upserted += 1;
  }

  return results;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DBNAME,
  });

  const [materialJson, skillJson] = await Promise.all([
    fs.readFile(MATERIAL_JSON_PATH, "utf8"),
    fs.readFile(SKILL_JSON_PATH, "utf8"),
  ]);

  const materialRecords = JSON.parse(materialJson);
  const skillRecords = JSON.parse(skillJson);

  const materialResult = await seedMaterials(materialRecords);
  const associateResult = await seedAssociates(skillRecords);

  console.log(`Seeded materials from JSON: ${materialResult.upserted}/${materialResult.total}`);
  console.log(`Seeded associates from JSON: ${associateResult.upserted}/${associateResult.total}`);
}

main()
  .catch((err) => {
    console.error("Seed from JSON failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
