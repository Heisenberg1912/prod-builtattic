import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import { prepareFulfilmentForOrder } from '../services/fulfilmentService.js';
import { schedulePayoutsForOrder } from '../services/payoutService.js';

const router = Router();
const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true';

function getRazorpayInstance() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

router.post('/order', async (req, res) => {
  try {
    if (!paymentsEnabled) {
      return res.status(503).json({ ok: false, error: 'Payments disabled' });
    }
    const { orderId } = req.body || {};
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    const gateway = getRazorpayInstance();
    if (!gateway) return res.status(503).json({ ok: false, error: 'Gateway keys missing' });
    const rpOrder = await gateway.orders.create({
      amount: Math.round((order.amounts?.grand || 0) * 100),
      currency: 'INR',
      receipt: String(orderId),
    });
    res.json({ ok: true, rpOrder });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/webhook', async (req, res) => {
  if (!paymentsEnabled) return res.status(503).end();
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const body = JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== signature) {
      return res.status(400).json({ ok: false, error: 'Bad signature' });
    }

    const receipt = req.body?.payload?.order?.entity?.receipt;
    if (receipt) {
      const order = await Order.findById(receipt);
      if (order) {
        order.status = 'paid';
        order.payment = {
          provider: 'razorpay',
          raw: req.body,
          signatureValid: true,
        };
        await order.save();

        try {
          await prepareFulfilmentForOrder(order._id);
          await schedulePayoutsForOrder(order._id);
        } catch (err) {
          console.error('Fulfilment pipeline error:', err.message);
        }
      }
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
