import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'support'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['chat', 'email'],
      default: 'chat',
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    meta: {
      type: Map,
      of: String,
      default: undefined,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const supportThreadSchema = new mongoose.Schema(
  {
    threadId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastOutboundEmailId: {
      type: String,
    },
  },
  { timestamps: true },
);

supportThreadSchema.index({ updatedAt: -1 });

export default mongoose.model('SupportThread', supportThreadSchema);

