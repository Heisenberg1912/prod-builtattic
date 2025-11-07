import mongoose from "mongoose";

const MattersGalleryAssetSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, lowercase: true, trim: true, index: true },
    label: { type: String, required: true },
    image: { type: String, required: true },
    badge: String,
    tags: [{ type: String }],
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.models.MattersGalleryAsset ||
  mongoose.model("MattersGalleryAsset", MattersGalleryAssetSchema);
