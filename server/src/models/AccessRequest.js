import mongoose from 'mongoose';

export const ACCESS_ROLE_OPTIONS = [
  'Architect / Firm',
  'Architectural Student / Graduate',
  'Land Owner / Consumer',
  'Vendor',
  'Builder / Real Estate Agency',
];

const accessRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ACCESS_ROLE_OPTIONS },
    isContributor: { type: Boolean, default: true },
    secretCode: { type: String, required: true, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

accessRequestSchema.index({ contact: 1, secretCode: 1 });
accessRequestSchema.index({ createdAt: -1 });

export default mongoose.model('AccessRequest', accessRequestSchema);
