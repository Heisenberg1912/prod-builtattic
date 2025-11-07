import mongoose from "mongoose";

const MattersConfigSchema = new mongoose.Schema(
  {
    chat_config: { type: mongoose.Schema.Types.Mixed },
    default_user: { type: mongoose.Schema.Types.Mixed },
    kpis_by_mode: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.MattersConfig ||
  mongoose.model("MattersConfig", MattersConfigSchema);
