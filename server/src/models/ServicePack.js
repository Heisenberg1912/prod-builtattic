import mongoose from 'mongoose';

const { Schema } = mongoose;

const ServicePackSchema = new Schema(
  {
    ownerType: {
      type: String,
      enum: ['associate', 'firm'],
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    deliverables: {
      type: [String],
      default: [],
    },
    duration: {
      type: String,
      trim: true,
    },
    availability: {
      type: String,
      trim: true,
    },
    meetingPrep: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

ServicePackSchema.index({ ownerType: 1, ownerId: 1, status: 1 });
ServicePackSchema.index({ ownerId: 1, updatedAt: -1 });

export default mongoose.model('ServicePack', ServicePackSchema);

