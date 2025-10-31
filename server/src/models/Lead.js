import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  contact: { type: String },
  ownerSalesId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['new','contacted','proposal','won','lost'], default: 'new', index: true },
  notes: [{ type: String }]
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('Lead', leadSchema);
