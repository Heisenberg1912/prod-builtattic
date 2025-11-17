import mongoose from 'mongoose';

const StudioRequestSchema = new mongoose.Schema(
  {
    firm: { type: mongoose.Types.ObjectId, ref: 'Firm', required: true },
    studio: { type: mongoose.Types.ObjectId, ref: 'Product' },
    studioSlug: { type: String },
    studioTitle: { type: String },
    requester: { type: mongoose.Types.ObjectId, ref: 'User' },
    source: { type: String, enum: ['user', 'client', 'guest'], default: 'guest' },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactCompany: { type: String },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'responded', 'archived'],
      default: 'new',
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

StudioRequestSchema.index({ firm: 1, createdAt: -1 });
StudioRequestSchema.index({ status: 1, firm: 1 });

export default mongoose.model('StudioRequest', StudioRequestSchema);

