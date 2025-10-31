import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createOrder,
  confirmOrder,
  resendOrderOTP,
  getUserOrders,
  getOrderById,
  cancelOrder
} from '../controllers/orderOTPController.js';

const router = express.Router();

// Order creation (requires authentication)
router.post('/', protect, createOrder);

// Confirm order with OTP
router.post('/confirm', protect, confirmOrder);

// Resend OTP for order confirmation
router.post('/resend-otp', protect, resendOrderOTP);

// Get user's orders
router.get('/', protect, getUserOrders);

// Get order by ID
router.get('/:orderId', protect, getOrderById);

// Cancel order
router.post('/:orderId/cancel', protect, cancelOrder);

export default router;