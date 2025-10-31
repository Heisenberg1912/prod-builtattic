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
  isClient: { type:Boolean, default:true }
}, { timestamps:true });

// single unique index definition
UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', UserSchema);
