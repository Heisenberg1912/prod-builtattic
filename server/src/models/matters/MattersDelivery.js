import mongoose from "mongoose";

const MattersDeliverySchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, lowercase: true, trim: true, index: true },
    label: { type: String, required: true },
    note: String,
    eta: String,
    status: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.MattersDelivery ||
  mongoose.model("MattersDelivery", MattersDeliverySchema);
