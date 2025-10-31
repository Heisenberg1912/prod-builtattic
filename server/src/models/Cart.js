import mongoose from 'mongoose';
const CartItemSchema=new mongoose.Schema({ product:{type:mongoose.Types.ObjectId,ref:'Product'}, qty:{type:Number,default:1} },{_id:true});
const CartSchema=new mongoose.Schema({ user:{type:mongoose.Types.ObjectId,ref:'User',unique:true,index:true}, items:[CartItemSchema], updatedAt:{type:Date,default:Date.now} },{timestamps:true});
export default mongoose.model('Cart', CartSchema);
