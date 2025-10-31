import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
    firm: { type: mongoose.Types.ObjectId, ref: 'Firm', index: true },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    lineTotal: { type: Number, default: 0 },
    source: { type: String },
    title: { type: String },
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['razorpay'], default: 'razorpay' },
    orderId: String,
    paymentId: String,
    signatureValid: Boolean,
    raw: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const FulfilmentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'processing', 'delivered'],
      default: 'pending',
    },
    deliveredAt: Date,
    notes: String,
  },
  { _id: false }
);

const CheckoutSchema = new mongoose.Schema(
  {
    addressId: String,
    addressLabel: String,
    gstInvoice: { type: Boolean, default: false },
    notes: String,
    couponCode: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const AmountSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grand: { type: Number, default: 0 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', index: true, required: true },
    items: { type: [ItemSchema], default: [] },
    amounts: { type: AmountSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['created', 'paid', 'fulfilled', 'refunded', 'cancelled'],
      default: 'created',
      index: true,
    },
    payment: PaymentSchema,
    fulfilment: FulfilmentSchema,
    checkout: CheckoutSchema,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

OrderSchema.index({ 'items.firm': 1, status: 1, createdAt: -1 });

export default mongoose.model('Order', OrderSchema);