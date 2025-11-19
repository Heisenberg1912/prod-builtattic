import mongoose from 'mongoose';

const { Schema } = mongoose;

const WorkspaceDownloadSchema = new Schema(
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
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tag: {
      type: String,
      trim: true,
      default: 'WD-W3',
    },
    accessLevel: {
      type: String,
      enum: ['internal', 'client', 'public'],
      default: 'client',
    },
    status: {
      type: String,
      enum: ['draft', 'released'],
      default: 'draft',
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    downloadCode: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

WorkspaceDownloadSchema.index({ ownerType: 1, ownerId: 1, updatedAt: -1 });

export default mongoose.model('WorkspaceDownload', WorkspaceDownloadSchema);
