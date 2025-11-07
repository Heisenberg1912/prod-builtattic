import mongoose from "mongoose";

const MattersFinanceRecordSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true, lowercase: true, trim: true, index: true },
    record_type: { type: String, trim: true, index: true },
    category: { type: String, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    vendor: String,
    status: { type: String, trim: true },
    due_date: String,
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.MattersFinanceRecord ||
  mongoose.model("MattersFinanceRecord", MattersFinanceRecordSchema);
