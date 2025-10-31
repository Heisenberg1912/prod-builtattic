import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Types.ObjectId, ref: 'Asset' },
    url: String,
    expiresAt: Date,
  },
  { _id: false }
);

const FulfilmentTaskSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Types.ObjectId, ref: 'Order', index: true, required: true },
    product: { type: mongoose.Types.ObjectId, ref: 'Product', index: true, required: true },
    firm: { type: mongoose.Types.ObjectId, ref: 'Firm', index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'delivered', 'failed'],
      default: 'pending',
      index: true,
    },
    downloadLinks: [LinkSchema],
    emailSentAt: Date,
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

FulfilmentTaskSchema.index({ order: 1, product: 1 }, { unique: true });

export default mongoose.model('FulfilmentTask', FulfilmentTaskSchema);

