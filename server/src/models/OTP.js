import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 minutes expiry
});

otpSchema.statics.createOrReplace = async function({ email, otp }) {
  await this.deleteMany({ email });
  return this.create({ email, otp });
};

export default mongoose.models.Otp || mongoose.model('Otp', otpSchema);