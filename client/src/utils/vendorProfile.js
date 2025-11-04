const toLineString = (value) => (Array.isArray(value) ? value.join("\n") : value || "");
const toCommaString = (value) => (Array.isArray(value) ? value.join(", ") : value || "");

const splitLines = (value, limit) => {
  if (!value) return [];
  const entries = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
};

const splitComma = (value, limit) => {
  if (!value) return [];
  const entries = value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
};

export const EMPTY_VENDOR_PROFILE_FORM = {
  companyName: "",
  tagline: "",
  summary: "",
  location: "",
  foundedYear: "",
  teamSize: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  leadTimeDays: "",
  minOrderQuantity: "",
  productionCapacity: "",
  paymentTerms: "",
  shippingRegions: "",
  logisticsNotes: "",
  sustainability: "",
  certifications: "",
  heroImage: "",
  catalogCategories: "",
  catalogHighlights: "",
  catalogSkus: "",
};

export const mapVendorProfileToForm = (profile = {}) => ({
  ...EMPTY_VENDOR_PROFILE_FORM,
  companyName: profile.companyName || profile.name || "",
  tagline: profile.tagline || "",
  summary: profile.summary || "",
  location: profile.location || "",
  foundedYear: profile.foundedYear ?? "",
  teamSize: profile.teamSize ?? "",
  contactEmail: profile.contactEmail || profile.email || "",
  contactPhone: profile.contactPhone || profile.phone || "",
  website: profile.website || "",
  leadTimeDays: profile.leadTimeDays ?? profile.leadTime ?? "",
  minOrderQuantity: profile.minOrderQuantity ?? profile.moq ?? "",
  productionCapacity: profile.productionCapacity ?? "",
  paymentTerms: profile.paymentTerms || "",
  shippingRegions: toLineString(profile.shippingRegions),
  logisticsNotes: profile.logisticsNotes || profile.logistics || "",
  sustainability: profile.sustainability || "",
  certifications: toCommaString(profile.certifications),
  heroImage: profile.heroImage || profile.coverImage || "",
  catalogCategories: toCommaString(profile.catalogCategories || profile.categories),
  catalogHighlights: toLineString(profile.catalogHighlights),
  catalogSkus: toLineString(profile.catalogSkus || profile.listings),
});

const sanitiseNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const vendorFormToPayload = (form = {}) => {
  const payload = {
    companyName: form.companyName.trim() || undefined,
    tagline: form.tagline.trim() || undefined,
    summary: form.summary.trim() || undefined,
    location: form.location.trim() || undefined,
    foundedYear: sanitiseNumber(form.foundedYear),
    teamSize: sanitiseNumber(form.teamSize),
    contactEmail: form.contactEmail.trim() || undefined,
    contactPhone: form.contactPhone.trim() || undefined,
    website: form.website.trim() || undefined,
    leadTimeDays: sanitiseNumber(form.leadTimeDays),
    minOrderQuantity: sanitiseNumber(form.minOrderQuantity),
    productionCapacity: form.productionCapacity.trim() || undefined,
    paymentTerms: form.paymentTerms.trim() || undefined,
    shippingRegions: splitLines(form.shippingRegions, 12),
    logisticsNotes: form.logisticsNotes.trim() || undefined,
    sustainability: form.sustainability.trim() || undefined,
    certifications: splitComma(form.certifications, 12),
    heroImage: form.heroImage.trim() || undefined,
    catalogCategories: splitComma(form.catalogCategories, 20),
    catalogHighlights: splitLines(form.catalogHighlights, 12),
    catalogSkus: splitLines(form.catalogSkus, 40),
  };

  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    const isArray = Array.isArray(value);
    const isEmptyArray = isArray && value.length === 0;
    if (value === undefined || value === null || (isArray && isEmptyArray)) {
      delete payload[key];
    }
  });

  return payload;
};

export const deriveVendorProfileStats = (profile = {}) => {
  const materials = Array.isArray(profile.catalogSkus) ? profile.catalogSkus.length : 0;
  const leadTime = Number(profile.leadTimeDays) || null;
  const moq = Number(profile.minOrderQuantity) || null;
  const certifications = Array.isArray(profile.certifications) ? profile.certifications.length : 0;
  const regions = Array.isArray(profile.shippingRegions) ? profile.shippingRegions.length : 0;

  return {
    materials,
    leadTime,
    moq,
    certifications,
    regions,
  };
};

export const formatCurrency = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric}`;
  }
};

export const mergeVendorProfileWithPayload = (profile = {}, payload = {}) => ({
  ...profile,
  ...payload,
});
