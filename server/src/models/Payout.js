import mongoose from 'mongoose';
const PayoutSchema=new mongoose.Schema({
  firm:{type:mongoose.Types.ObjectId,ref:'Firm',index:true},
  order:{type:mongoose.Types.ObjectId,ref:'Order'},
  amountGross:Number,
  commissionPct:Number,
  commissionAmount:Number,
  amountNet:Number,
  currency:{type:String,default:'USD'},
  status:{type:String,enum:['pending','processing','paid','failed'],default:'pending',index:true},
  scheduledAt:Date,
  processor:{
    type:String,
    enum:['manual','razorpayx'],
    default:'manual'
  },
  attempts:{type:Number,default:0},
  notes:String
},{timestamps:true});
export default mongoose.model('Payout', PayoutSchema);
