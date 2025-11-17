import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['associate', 'firm'], required: true, index: true },
    target: { type: mongoose.Types.ObjectId, required: true, index: true },
    score: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

RatingSchema.index({ user: 1, targetType: 1, target: 1 }, { unique: true });

export default mongoose.model('Rating', RatingSchema);
