// server/src/routes/payment.js
import { Router } from "express";
import Razorpay from "razorpay";

const router = Router();

function getRazorpayClient() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

router.post("/order", async (req, res, next) => {
  try {
    const rzp = getRazorpayClient();
    if (!rzp) return res.status(503).json({ ok: false, error: "Payments disabled (missing keys)" });

    const { amount, currency = "INR", receipt } = req.body;
    const order = await rzp.orders.create({ amount, currency, receipt });
    res.json({ ok: true, order });
  } catch (err) { next(err); }
});

export default router;