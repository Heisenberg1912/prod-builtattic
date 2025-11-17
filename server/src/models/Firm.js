import mongoose from 'mongoose';

const FirmProfileSchema = new mongoose.Schema(
  {
    name: String,
    tagline: String,
    summary: String,
    foundedYear: Number,
    teamSize: Number,
    headquarters: String,
    regions: [String],
    services: [String],
    specialisations: [String],
    notableProjects: [String],
    awards: [String],
    contactEmail: String,
    contactPhone: String,
    website: String,
    heroImage: String,
    gallery: [String],
    certifications: [String],
    billingCurrency: String,
    averageFee: Number,
    partnerNetwork: [String],
    languages: [String],
    sustainability: String,
    secretCode: String,
    letterOfIntent: String,
    leadTimeDays: Number,
    minOrderQuantity: Number,
    productionCapacity: String,
    paymentTerms: String,
    shippingRegions: [String],
    logisticsNotes: String,
    catalogCategories: [String],
    catalogHighlights: [String],
    catalogSkus: [String],
    updatedAt: Date,
  },
  { _id: false, minimize: false }
);

const FirmSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    approved: { type: Boolean, default: false },
    ownerUserId: { type: mongoose.Types.ObjectId, ref: 'User' },
    tagline: String,
    description: String,
    category: String,
    styles: [String],
    locations: [String],
    operatingRegions: [String],
    priceSqft: Number,
    currency: String,
    scope: [String],
    team: Number,
    projectsDelivered: Number,
    avgLeadTimeWeeks: Number,
    rating: Number,
    ratingsCount: { type: Number, default: 0 },
    coverImage: String,
    gallery: [String],
    services: [
      {
        title: String,
        description: String,
        leadTimeWeeks: Number,
      },
    ],
    languages: [String],
    sustainability: String,
    certifications: [String],
    partners: [String],
    featuredStudios: [{ type: mongoose.Types.ObjectId, ref: 'Product' }],
    testimonials: [
      {
        author: String,
        role: String,
        quote: String,
      },
    ],
    payout: {
      commissionPct: { type: Number, default: 10 },
      mode: {
        type: String,
        enum: ['manual', 'razorpayx'],
        default: 'manual',
      },
      handle: String,
    },
    contact: {
      email: String,
      phone: String,
      website: String,
      timezone: String,
      address: String,
    },
    profile: { type: FirmProfileSchema, default: () => ({}) },
    hosting: {
      enabled: { type: Boolean, default: false },
      serviceSummary: { type: String },
      services: [
        {
          id: String,
          label: String,
          description: String,
          status: { type: String, enum: ['available', 'on-request'], default: 'available' },
          statusLabel: String,
        },
      ],
      products: [
        {
          id: String,
          label: String,
          description: String,
          status: { type: String, enum: ['available', 'on-request'], default: 'available' },
          statusLabel: String,
          extra: String,
        },
      ],
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

FirmSchema.index({ category: 1, approved: 1 });

export default mongoose.model('Firm', FirmSchema);

