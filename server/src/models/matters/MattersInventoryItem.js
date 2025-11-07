import mongoose from "mongoose";

const MattersInventoryItemSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true },
    category: { type: String, trim: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, trim: true },
    location: String,
    status: { type: String, trim: true, index: true },
    supplier: String,
    notes: String,
    metadata: { type: mongoose.Schema.Types.Mixed },
    eta: String,
  },
  { timestamps: true }
);

export default mongoose.models.MattersInventoryItem ||
  mongoose.model("MattersInventoryItem", MattersInventoryItemSchema);
