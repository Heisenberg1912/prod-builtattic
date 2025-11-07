import mongoose from "mongoose";

const MattersIncidentSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true },
    severity: String,
    cause: String,
    headline: String,
    startedAt: String,
    resolvedAt: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.MattersIncident ||
  mongoose.model("MattersIncident", MattersIncidentSchema);
