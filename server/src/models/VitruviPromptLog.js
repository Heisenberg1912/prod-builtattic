import mongoose from "mongoose";

const { Schema } = mongoose;

const ResultSchema = new Schema(
  {
    analysis: { type: Schema.Types.Mixed, default: undefined },
    promptAnalysis: { type: Schema.Types.Mixed, default: undefined },
    designAnalysis: { type: Schema.Types.Mixed, default: undefined },
    source: { type: String, default: undefined },
    warning: { type: String, default: undefined },
    imageUrl: { type: String, default: undefined },
    imageAvailable: { type: Boolean, default: undefined },
    hasInlineImage: { type: Boolean, default: undefined },
    mime: { type: String, default: undefined },
  },
  { _id: false },
);

const UserSnapshotSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: "User", default: undefined },
    email: { type: String, default: undefined },
  },
  { _id: false },
);

const VitruviPromptLogSchema = new Schema(
  {
    prompt: { type: String, required: true, trim: true },
    options: { type: Schema.Types.Mixed, default: {} },
    endpoint: {
      type: String,
      enum: ["analyze", "analyze-and-generate", "generate"],
      default: "analyze",
    },
    durationMs: { type: Number, default: undefined },
    result: { type: ResultSchema, default: undefined },
    user: { type: UserSnapshotSchema, default: undefined },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  },
);

VitruviPromptLogSchema.index({ createdAt: -1 });
VitruviPromptLogSchema.index({ endpoint: 1, createdAt: -1 });

export default mongoose.models.VitruviPromptLog ||
  mongoose.model("VitruviPromptLog", VitruviPromptLogSchema);

