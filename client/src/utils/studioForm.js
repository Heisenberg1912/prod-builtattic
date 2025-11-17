const toLineString = (value) => (Array.isArray(value) ? value.join("\n") : value || "");
const toCommaString = (value) => (Array.isArray(value) ? value.join(", ") : value || "");

const splitLines = (value, limit) => {
  if (!value) return [];
  const entries = value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
};

const splitComma = (value, limit) => {
  if (!value) return [];
  const entries = value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
};

const sanitiseNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const EMPTY_STUDIO_FORM = {
  id: null,
  title: "",
  summary: "",
  description: "",
  price: "",
  priceSqft: "",
  currency: "USD",
  heroImage: "",
  gallery: "",
  categories: "",
   category: "",
  tags: "",
  style: "",
  highlights: "",
  city: "",
  country: "",
  timezone: "",
   areaSqft: "",
   plotAreaSqft: "",
   areaUnit: "sq ft",
   bedrooms: "",
   bathrooms: "",
   floors: "",
  deliveryNotes: "",
  fulfilmentType: "",
  leadTimeWeeks: "",
  handoverMethod: "",
  includesInstallation: false,
  deliveryItems: "",
};

export const mapStudioToForm = (studio = {}) => ({
  ...EMPTY_STUDIO_FORM,
  id: studio._id || studio.id || null,
  title: studio.title || "",
  summary: studio.summary || "",
  description: studio.description || "",
  price: studio.price != null ? String(studio.price) : "",
  priceSqft: studio.priceSqft != null ? String(studio.priceSqft) : "",
  currency: studio.currency || "USD",
  heroImage: studio.heroImage || "",
  gallery: toLineString(studio.gallery),
  categories: toCommaString(studio.categories),
  category: studio.category || studio.primaryCategory || "",
  tags: toCommaString(studio.tags),
  style: studio.style || "",
  highlights: toLineString(studio.highlights),
  city: studio.location?.city || "",
  country: studio.location?.country || "",
  timezone: studio.location?.timezone || "",
  areaSqft:
    studio.areaSqft != null
      ? String(studio.areaSqft)
      : studio.metrics?.areaSqft != null
      ? String(studio.metrics.areaSqft)
      : "",
  plotAreaSqft:
    studio.plotAreaSqft != null
      ? String(studio.plotAreaSqft)
      : studio.metrics?.plotAreaSqft != null
      ? String(studio.metrics.plotAreaSqft)
      : "",
  areaUnit: studio.areaUnit || studio.metrics?.areaUnit || "sq ft",
  bedrooms:
    studio.bedrooms != null
      ? String(studio.bedrooms)
      : studio.metadata?.bedrooms != null
      ? String(studio.metadata.bedrooms)
      : "",
  bathrooms:
    studio.bathrooms != null
      ? String(studio.bathrooms)
      : studio.metadata?.bathrooms != null
      ? String(studio.metadata.bathrooms)
      : "",
  floors:
    studio.floors != null
      ? String(studio.floors)
      : studio.metadata?.floors != null
      ? String(studio.metadata.floors)
      : "",
  deliveryNotes: studio.delivery?.instructions || "",
  fulfilmentType: studio.delivery?.fulfilmentType || "",
  leadTimeWeeks: studio.delivery?.leadTimeWeeks != null ? String(studio.delivery.leadTimeWeeks) : "",
  handoverMethod: studio.delivery?.handoverMethod || "",
  includesInstallation: Boolean(studio.delivery?.includesInstallation),
  deliveryItems: toLineString(studio.delivery?.items),
});

const cleanupPayload = (payload = {}) => {
  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    const isArray = Array.isArray(value);
    const isObject = typeof value === "object" && value !== null && !isArray;
    if (
      value === undefined ||
      value === null ||
      (isArray && value.length === 0) ||
      (typeof value === "string" && value.trim() === "") ||
      (isObject && Object.keys(value).length === 0)
    ) {
      delete payload[key];
    }
  });
  return payload;
};

export const studioFormToPayload = (form = {}) => {
  const location = cleanupPayload({
    city: form.city?.trim(),
    country: form.country?.trim(),
    timezone: form.timezone?.trim(),
  });

  const delivery = cleanupPayload({
    instructions: form.deliveryNotes?.trim(),
    fulfilmentType: form.fulfilmentType?.trim(),
    leadTimeWeeks: sanitiseNumber(form.leadTimeWeeks),
    handoverMethod: form.handoverMethod?.trim(),
    includesInstallation: form.includesInstallation || undefined,
    items: splitLines(form.deliveryItems, 30),
  });

  const areaUnit = (form.areaUnit || '').toLowerCase() === 'm2' ? 'm2' : 'sq ft';

  const payload = {
    title: form.title?.trim() || undefined,
    summary: form.summary?.trim() || undefined,
    description: form.description?.trim() || undefined,
    price: sanitiseNumber(form.price),
    priceSqft: sanitiseNumber(form.priceSqft),
    currency: form.currency?.trim()?.toUpperCase() || undefined,
    heroImage: form.heroImage?.trim() || undefined,
    gallery: splitLines(form.gallery, 20),
    categories: splitComma(form.categories, 20),
    category: form.category?.trim() || undefined,
    tags: splitComma(form.tags, 30),
    style: form.style?.trim() || undefined,
    highlights: splitLines(form.highlights, 20),
    areaSqft: sanitiseNumber(form.areaSqft),
    plotAreaSqft: sanitiseNumber(form.plotAreaSqft),
    areaUnit,
    bedrooms: sanitiseNumber(form.bedrooms),
    bathrooms: sanitiseNumber(form.bathrooms),
    floors: sanitiseNumber(form.floors),
    location: Object.keys(location).length ? location : undefined,
    delivery: Object.keys(delivery).length ? delivery : undefined,
  };

  return cleanupPayload(payload);
};
