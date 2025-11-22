import materialStudioRecords from "./materialStudioRaw.json";
import { getMaterialStudioImage } from "../assets/materialStudioImages.js";

const currencyBySymbol = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "₹": "INR",
  "¥": "JPY",
};

function slugify(value = "", fallback = "material") {
  const slug = String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return slug || fallback;
}

function ensureUniqueSlug(base, seen, fallback) {
  const seed = base || fallback;
  let candidate = seed;
  let index = 1;
  while (seen.has(candidate)) {
    index += 1;
    candidate = `${seed}-${index}`;
  }
  seen.add(candidate);
  return candidate;
}

function splitList(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[\n;,]+/)
    .map((entry) => entry.replace(/^\s*\d+[).\s-]*/, "").trim())
    .filter(Boolean);
}

function parseUnitPrice(raw) {
  if (!raw || typeof raw !== "string") {
    return {
      amount: null,
      currency: "USD",
      unit: "unit",
      unitLabel: "Per unit",
    };
  }
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const amountMatch = cleaned.match(/([\d,.]+(?:\.\d+)?)/);
  const symbolMatch = cleaned.match(/([$€£₹¥])/);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : null;
  const symbol = symbolMatch ? symbolMatch[1] : "$";
  const currency = currencyBySymbol[symbol] || "USD";
  const unitPart = cleaned.includes("/")
    ? cleaned
        .split("/")
        .slice(1)
        .join("/")
        .trim()
    : "unit";
  const unit = unitPart.replace(/^per\s+/i, "").toLowerCase() || "unit";
  const unitLabel = cleaned.includes("/") ? `Per ${unitPart}` : `Per ${unit}`;
  return {
    amount,
    currency,
    unit,
    unitLabel,
  };
}

function parseLeadTime(raw) {
  if (!raw || typeof raw !== "string") {
    return { days: null, weeks: null };
  }
  const numbers =
    raw
      .match(/\d+(?:\.\d+)?/g)
      ?.map((value) => Number(value.replace(/,/g, ""))) || [];
  if (!numbers.length) return { days: null, weeks: null };
  const average =
    numbers.length === 1
      ? numbers[0]
      : numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  const lower = raw.toLowerCase();
  if (lower.includes("week")) {
    const weeks = average;
    return { weeks, days: weeks * 7 };
  }
  if (lower.includes("month")) {
    const weeks = average * 4;
    return { weeks, days: weeks * 7 };
  }
  const days = average;
  return { days, weeks: days / 7 };
}

function parseMoq(raw) {
  if (!raw || typeof raw !== "string") {
    return { quantity: null, text: raw ?? "" };
  }
  const numbers =
    raw
      .match(/\d+(?:\.\d+)?/g)
      ?.map((value) => Number(value.replace(/,/g, ""))) || [];
  const quantity = numbers.length ? numbers[numbers.length - 1] : null;
  return { quantity, text: raw.trim() };
}

function parseSpecs(...blocks) {
  const specs = [];
  blocks
    .filter(Boolean)
    .forEach((block) => {
      String(block)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
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

function parseLocation(raw) {
  if (!raw || typeof raw !== "string") {
    return { city: undefined, country: undefined, label: undefined };
  }
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return { city: undefined, country: undefined, label: raw.trim() };
  if (parts.length === 1) {
    return { city: parts[0], country: undefined, label: raw.trim() };
  }
  const country = parts.pop();
  const city = parts.join(", ");
  return { city: city || undefined, country: country || undefined, label: raw.trim() };
}

const seenSlugs = new Set();

function buildMaterial(record, index) {
  const serialRaw = record["S.no"];
  const serialNumber = Number(serialRaw);
  const normalizedSerial =
    Number.isFinite(serialNumber)
      ? serialNumber
      : Number(String(serialRaw || "").replace(/^0+/, "")) || null;
  const heroImage =
    (normalizedSerial && getMaterialStudioImage(normalizedSerial)) ||
    record.imageUrl ||
    null;

  const materialName = String(record.Material || "").trim();
  const brandName = String(record["Brand Name"] || "").trim();
  const vendorName = String(record["Vendor Name"] || "").trim();
  const locationRaw = String(record.Location || "").trim();
  const unitPriceRaw = record["Unit Price"];
  const moqRaw = record["MOQ"];
  const leadTimeRaw = record["Lead Time"];

  const titleBase =
    [brandName, materialName].filter(Boolean).join(" - ") ||
    materialName ||
    brandName ||
    `Material ${serialRaw ?? index + 1}`;
  const baseSlug = slugify(titleBase, `material-${serialNumber || index + 1}`);
  const slug = ensureUniqueSlug(baseSlug, seenSlugs, `material-${index + 1}`);

  const unitPrice = parseUnitPrice(unitPriceRaw);
  const moq = parseMoq(moqRaw);
  const leadTime = parseLeadTime(leadTimeRaw);

  const tags = splitList(record["Trending Usages"]);
  const highlights = splitList(record["Sustainability Features"]);
  const deliverables = splitList(record["Portfolio Deliverables"]);
  const specs = parseSpecs(record["Product Specification Brief"], record["Additional Details"]);
  const usage = record["Product Usage"] ? String(record["Product Usage"]).trim() : "";
  const location = parseLocation(locationRaw);
  const alternativeVendors = splitList(record["Alternative Vendors"]);

  const basePrice = Number.isFinite(unitPrice.amount) ? unitPrice.amount : 0;
  const minQuantity = Number.isFinite(moq.quantity) ? moq.quantity : 1;
  const leadTimeWeeks = Number.isFinite(leadTime.weeks) ? Number(leadTime.weeks.toFixed(1)) : null;
  const leadTimeDays = Number.isFinite(leadTime.days) ? Math.round(leadTime.days) : null;

  const category = deriveCategory(materialName);

  return {
    _id: slug,
    title: titleBase,
    slug,
    kind: "material",
    description: String(record["Product Specification Brief"] || "").trim(),
    summary: usage || undefined,
    heroImage,
    gallery: [
      heroImage,
      record.imageUrl && record.imageUrl !== heroImage ? record.imageUrl : null,
    ].filter(Boolean),
    pricing: {
      unit: unitPrice.unit,
      unitLabel: unitPrice.unitLabel,
      currency: unitPrice.currency,
      basePrice,
      minQuantity,
    },
    status: "published",
    category,
    categories: category ? [category] : [],
    tags,
    highlights,
    specs,
    delivery: {
      leadTimeWeeks,
      leadTimeDays,
      fulfilmentType: "logistics",
      handoverMethod: "freight",
      includesInstallation: false,
      items: deliverables,
      instructions: String(record["Additional Details"] || "").trim() || undefined,
    },
    location: {
      city: location.city || undefined,
      country: location.country || undefined,
      label: location.label || undefined,
    },
    metafields: {
      serial: Number.isFinite(serialNumber) ? serialNumber : undefined,
      unit: unitPrice.unit,
      priceLabel: unitPriceRaw || undefined,
      moq: Number.isFinite(moq.quantity) ? moq.quantity : undefined,
      moqLabel: moqRaw || undefined,
      leadTimeDays,
      leadTimeLabel: leadTimeRaw || undefined,
      vendor: vendorName || brandName || undefined,
      location: locationRaw || undefined,
      contact: String(record["Contact Info"] || "").trim() || undefined,
      brand: brandName || undefined,
      material: materialName || undefined,
      alternativeVendors: alternativeVendors,
    },
    metrics: {
      seedSource: "material-studio-json",
      serial: Number.isFinite(serialNumber) ? serialNumber : undefined,
    },
    extras: {
      productUsage: usage || undefined,
      trendingUsages: tags,
      sustainability: highlights,
      deliverables,
      additionalDetails: String(record["Additional Details"] || "").trim() || undefined,
    },
  };
}

const sortedRecords = [...materialStudioRecords].sort(
  (a, b) => Number(a["S.no"] || 0) - Number(b["S.no"] || 0),
);

const materialStudioFallbackAll = sortedRecords.map(buildMaterial);
export const materialStudioFallback = materialStudioFallbackAll.slice(0, 6);
