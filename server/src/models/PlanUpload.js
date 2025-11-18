import mongoose from 'mongoose';

const { Schema } = mongoose;

const PlanUploadSchema = new Schema(
  {
    ownerType: {
      type: String,
      enum: ['associate', 'firm'],
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    projectTitle: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    subtype: { type: String, trim: true },
    primaryStyle: { type: String, trim: true },
    conceptPlan: { type: String, trim: true },
    renderImages: {
      type: [String],
      default: [],
    },
    walkthrough: { type: String, trim: true },
    areaSqft: Number,
    floors: Number,
    materials: {
      type: [String],
      default: [],
    },
    climate: { type: String, trim: true },
    designRate: Number,
    constructionCost: Number,
    licenseType: { type: String, trim: true },
    delivery: { type: String, trim: true },
    description: { type: String, trim: true },
    tags: {
      type: [String],
      default: [],
    },
    metadata: Schema.Types.Mixed,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

PlanUploadSchema.index({ ownerType: 1, ownerId: 1, updatedAt: -1 });

export default mongoose.model('PlanUpload', PlanUploadSchema);

