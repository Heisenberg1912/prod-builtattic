import mongoose from "mongoose";

const MattersDrillSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true },
    status: { type: String, default: 'scheduled' },
    owner: String,
    scheduledFor: String,
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.MattersDrill ||
  mongoose.model("MattersDrill", MattersDrillSchema);
