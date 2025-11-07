import mongoose from "mongoose";

const MattersSystemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    mode: { type: String, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.MattersSystem ||
  mongoose.model("MattersSystem", MattersSystemSchema);
