import Payout from '../models/Payout.js';
import Order from '../models/Order.js';
import Firm from '../models/Firm.js';

export async function schedulePayoutsForOrder(orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order) throw new Error('Order not found');

  const byFirm = new Map();
  for (const item of order.items || []) {
    if (!item.firm) continue;
    const key = String(item.firm);
    const lineTotal = item.lineTotal ?? (item.qty || 0) * (item.unitPrice || 0);
    const prev = byFirm.get(key) || 0;
    byFirm.set(key, prev + lineTotal);
  }

  const results = [];
  for (const [firmId, gross] of byFirm.entries()) {
    const firm = await Firm.findById(firmId).lean();
    if (!firm) continue;
    const commissionPct = firm.payout?.commissionPct ?? 10;
    const commissionAmount = (gross * commissionPct) / 100;
    const amountNet = gross - commissionAmount;
    const currency = order.items?.find((item) => String(item.firm) === firmId)?.currency || 'USD';

    const payout = await Payout.findOneAndUpdate(
      { firm: firmId, order: order._id },
      {
        firm: firmId,
        order: order._id,
        amountGross: gross,
        commissionPct,
        commissionAmount,
        amountNet,
        currency,
        status: 'pending',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        processor: firm.payout?.mode || 'manual',
      },
      { upsert: true, new: true }
    );
    results.push(payout);
  }

  return results;
}

