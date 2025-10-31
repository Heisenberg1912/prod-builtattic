import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  billingInfo: {},
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('Client', clientSchema);
