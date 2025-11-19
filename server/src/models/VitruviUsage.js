import mongoose from "mongoose";

const { Schema } = mongoose;

const VitruviUsageSchema = new Schema(
  {
    ownerType: { type: String, enum: ["user", "ip"], required: true },
    ownerId: { type: String, required: true },
    plan: { type: String, default: "free" },
    promptsUsed: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    promptCredits: { type: Number, default: 0 },
    tokenCredits: { type: Number, default: 0 },
    freePromptLimit: { type: Number, default: undefined },
    freeTokenLimit: { type: Number, default: undefined },
    currency: { type: String, default: "USD" },
    lastResetAt: { type: Date, default: Date.now },
    lifetimePrompts: { type: Number, default: 0 },
    lifetimeTokens: { type: Number, default: 0 },
  },
  { timestamps: true },
);

VitruviUsageSchema.index({ ownerType: 1, ownerId: 1 }, { unique: true });

export default mongoose.models.VitruviUsage ||
  mongoose.model("VitruviUsage", VitruviUsageSchema);
