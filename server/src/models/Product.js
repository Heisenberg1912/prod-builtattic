import mongoose from 'mongoose';
const DeliverySchema = new mongoose.Schema(
  {
    leadTimeWeeks: Number,
    fulfilmentType: {
      type: String,
      enum: ["digital", "hybrid", "logistics"],
      default: "digital",
    },
    includesInstallation: { type: Boolean, default: false },
    handoverMethod: {
      type: String,
      enum: ["download", "email", "courier", "onsite"],
      default: "download",
    },
    instructions: String,
    items: [String],
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    city: String,
    country: String,
    latitude: Number,
    longitude: Number,
    timezone: String,
  },
  { _id: false }
);

const PricingSchema = new mongoose.Schema(
  {
    unit: { type: String, default: "sq.ft" },
    unitLabel: { type: String, default: "Per sq.ft" },
    currency: { type: String, default: "USD" },
    basePrice: { type: Number, default: 0 },
    minQuantity: { type: Number, default: 0 },
    maxQuantity: { type: Number },
    tierPricing: [
      {
        min: Number,
        max: Number,
        price: Number,
      },
    ],
  },
  { _id: false }
);

const AssetRefSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    url: String,
    filename: String,
    mimeType: String,
    sizeBytes: Number,
    checksum: String,
    kind: {
      type: String,
      enum: ["preview", "deliverable", "spec", "marketing"],
      default: "preview",
    },
    secure: { type: Boolean, default: true },
    expiresAt: Date,
  },
  { _id: false }
);

const SpecSchema = new mongoose.Schema(
  {
    label: String,
    value: mongoose.Schema.Types.Mixed,
    unit: String,
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    firm: { type: mongoose.Types.ObjectId, ref: "Firm", index: true },
    title: { type: String, index: "text" },
    slug: { type: String, unique: true },
    kind: {
      type: String,
      enum: ["studio", "material", "service"],
      default: "studio",
      index: true,
    },
    description: String,
    summary: String,
    heroImage: String,
    gallery: [String],
    price: Number,
    priceSqft: Number,
    pricing: PricingSchema,
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    inventory: { type: Number, default: 0 },
    categories: [String],
    tags: [String],
    style: String,
    delivery: DeliverySchema,
    location: LocationSchema,
    highlights: [String],
    specs: [SpecSchema],
    assets: [AssetRefSchema],
    metrics: mongoose.Schema.Types.Mixed,
    metafields: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

ProductSchema.index({ firm: 1, status: 1, kind: 1 });
ProductSchema.index({ categories: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ style: 1 });

export default mongoose.model('Product', ProductSchema);
