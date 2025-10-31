import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  firmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm', required: true },
  serviceId: { type: String },
  schedule: {},
  status: { type: String, default: 'pending' },
  price: Number,
  paymentStatus: { type: String, default: 'unpaid' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('Booking', bookingSchema);
