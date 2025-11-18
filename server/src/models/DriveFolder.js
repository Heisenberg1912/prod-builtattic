import mongoose from 'mongoose';

const DriveFolderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
    folderId: { type: String, required: true },
    name: { type: String, required: true },
    parentId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('DriveFolder', DriveFolderSchema);
