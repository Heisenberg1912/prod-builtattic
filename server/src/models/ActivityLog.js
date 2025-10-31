import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  resource: String,
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  changes: {},
  ip: String,
  timestamp: { type: Date, default: Date.now }
});

activityLogSchema.index({ resource: 1, resourceId: 1 });

export default mongoose.model('ActivityLog', activityLogSchema);
