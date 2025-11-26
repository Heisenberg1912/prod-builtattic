import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    originalName: String,
    mimeType: String,
    sizeBytes: Number,
    checksum: String,
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'remote', 'drive'],
      default: 'local',
    },
    storagePath: String,
    driveFileId: String,
    driveFolderId: String,
    publicUrl: String,
    bucket: String,
    secure: { type: Boolean, default: true },
    algorithm: { type: String, default: 'aes-256-gcm' },
    iv: String,
    authTag: String,
    expiresAt: Date,
    uploader: { type: mongoose.Types.ObjectId, ref: 'User' },
    product: { type: mongoose.Types.ObjectId, ref: 'Product', index: true },
    order: { type: mongoose.Types.ObjectId, ref: 'Order', index: true },
    planUpload: { type: mongoose.Types.ObjectId, ref: 'PlanUpload', index: true },
    kind: {
      type: String,
      default: 'preview',
      trim: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'ready', 'revoked'],
      default: 'uploaded',
      index: true,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

AssetSchema.index({ secure: 1, status: 1, createdAt: -1 });

export default mongoose.model('Asset', AssetSchema);
