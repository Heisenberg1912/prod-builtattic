import mongoose from 'mongoose';

const DummyCatalogEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['design', 'skill', 'material'],
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('DummyCatalogEntry', DummyCatalogEntrySchema);
