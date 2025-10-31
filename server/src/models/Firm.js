import mongoose from 'mongoose';

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
    priceSqft: Number,
    scope: [String],
    team: Number,
    projectsDelivered: Number,
    avgLeadTimeWeeks: Number,
    rating: Number,
    coverImage: String,
    gallery: [String],
    services: [
      {
        title: String,
        description: String,
        leadTimeWeeks: Number,
      },
    ],
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
  },
  { timestamps: true }
);

FirmSchema.index({ category: 1, approved: 1 });

export default mongoose.model('Firm', FirmSchema);
