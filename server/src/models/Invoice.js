import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  firmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm' },
  amount: Number,
  status: { type: String, default: 'unpaid' },
  issuedAt: { type: Date, default: Date.now },
  paidAt: Date
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
