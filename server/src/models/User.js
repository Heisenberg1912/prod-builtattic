import mongoose from 'mongoose';

const MembershipSchema = new mongoose.Schema({
  firm: { type: mongoose.Types.ObjectId, ref: 'Firm', index: true, required: true },
  role: { type: String, enum: ['owner','admin','associate'], required: true },
  title: String
}, { _id:false });

const UserSchema = new mongoose.Schema({
  email: { type:String, required:true, lowercase:true, trim:true }, // <- no unique/index here
  passHash: { type:String, required:true, select:false },
  role: {
    type: String,
    enum: ['user','client','vendor','firm','associate','admin','superadmin'],
    default: 'user',
    index: true
  },
  rolesGlobal: [{ type:String, enum:['superadmin','admin'] }],
  memberships: [MembershipSchema],
  settings: {
    notifications: { type: Map, of: Boolean, default: {} },
    privacy: { type: Map, of: Boolean, default: {} },
    security: { type: Map, of: Boolean, default: {} },
    profile: { type: Map, of: String, default: {} },
  },
  passwordReset: {
    tokenHash: { type:String, select:false },
    expiresAt: { type:Date },
  },
  isClient: { type:Boolean, default:true }
}, { timestamps:true });

// single unique index definition
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'passwordReset.tokenHash': 1 }, { sparse: true });

export default mongoose.model('User', UserSchema);
