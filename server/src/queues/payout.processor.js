import { makeWorker } from '../config/redis.js';
import { createPayoutsForOrder } from '../services/payoutService.js';
import Order from '../models/Order.js';
export const payoutWorker=makeWorker('payouts', async job=>{ const {orderId}=job.data; const order=await Order.findById(orderId); if(!order) return; await createPayoutsForOrder(order); });
