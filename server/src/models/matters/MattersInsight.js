import mongoose from "mongoose";

const MattersInsightSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true },
    summary: String,
    severity: { type: String, trim: true },
    tags: [{ type: String }],
    source: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.MattersInsight ||
  mongoose.model("MattersInsight", MattersInsightSchema);
