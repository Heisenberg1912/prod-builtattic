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
  isEmailVerified: { type:Boolean, default:false },
  twoFactorEnabled: { type:Boolean, default:true },
  settings: {
    notifications: { type: Map, of: Boolean, default: {} },
    privacy: { type: Map, of: Boolean, default: {} },
    security: { type: Map, of: Boolean, default: {} },
    profile: { type: Map, of: String, default: {} },
  },
  addresses: [
    {
      label: { type: String, trim: true },
      name: { type: String, trim: true },
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      phone: { type: String, trim: true },
      gstNumber: { type: String, trim: true },
      isDefault: { type: Boolean, default: false },
    },
  ],
  passwordReset: {
    tokenHash: { type:String, select:false },
    expiresAt: { type:Date },
  },
  isClient: { type:Boolean, default:true },
  isSuspended: { type:Boolean, default:false, index:true },
  lastLoginAt: { type:Date },
}, { timestamps:true });

// single unique index definition
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'passwordReset.tokenHash': 1 }, { sparse: true });

export default mongoose.model('User', UserSchema);
