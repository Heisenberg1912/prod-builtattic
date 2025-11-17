import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    otp: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['login', 'register', 'order'],
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.statics.createOrReplace = async function ({
  email,
  otp,
  purpose,
  userId,
  orderId,
  expiresAt,
}) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const query = { email: normalizedEmail, purpose };
  if (userId) query.userId = userId;
  if (orderId) query.orderId = orderId;
  await this.deleteMany(query);
  return this.create({
    email: normalizedEmail,
    otp,
    purpose,
    userId: userId || undefined,
    orderId: orderId || undefined,
    expiresAt,
  });
};

export default mongoose.models.Otp || mongoose.model('Otp', otpSchema);
