import mongoose from "mongoose";

const MattersModeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true },
    description: String,
    color: String,
    icon: String,
    order: { type: Number, default: 0 },
    is_default: { type: Boolean, default: false },
    dashboard_sections: [{ type: String }],
    metrics: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.MattersMode ||
  mongoose.model("MattersMode", MattersModeSchema);
