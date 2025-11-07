import mongoose from "mongoose";

const MattersRiskSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true },
    status: { type: String, default: 'open', index: true },
    score: { type: Number, default: 0 },
    owner: String,
    impact: String,
    likelihood: String,
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.MattersRisk ||
  mongoose.model("MattersRisk", MattersRiskSchema);
