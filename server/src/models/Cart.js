import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Types.ObjectId, ref: 'Product' },
    productId: { type: String },
    title: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    image: { type: String },
    source: { type: String, default: 'product' },
    snapshot: mongoose.Schema.Types.Mixed,
    qty: { type: Number, default: 1 },
  },
  { _id: true }
);

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', unique: true, index: true },
    items: [CartItemSchema],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Cart', CartSchema);
