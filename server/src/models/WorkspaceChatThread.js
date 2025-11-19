import mongoose from 'mongoose';

const { Schema } = mongoose;

const WorkspaceChatMessageSchema = new Schema(
  {
    senderType: {
      type: String,
      enum: ['workspace', 'client', 'ops'],
      default: 'workspace',
    },
    senderName: {
      type: String,
      trim: true,
    },
    senderRole: {
      type: String,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const WorkspaceChatThreadSchema = new Schema(
  {
    ownerType: {
      type: String,
      enum: ['associate', 'firm'],
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    participants: {
      type: [String],
      default: [],
    },
    clientName: {
      type: String,
      trim: true,
    },
    clientEmail: {
      type: String,
      trim: true,
    },
    lastMessageAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    messages: {
      type: [WorkspaceChatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

WorkspaceChatThreadSchema.index({ ownerType: 1, ownerId: 1, updatedAt: -1 });

export default mongoose.model('WorkspaceChatThread', WorkspaceChatThreadSchema);
