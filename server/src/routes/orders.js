import { Router } from 'express';
import mongoose from 'mongoose';
import argon2 from 'argon2';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { sendAdminNotificationEmail } from '../services/email/emailService.js';

const router = Router();

class OrderError extends Error {
  constructor(message, status = 400, code = 'order_error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const DEMO_DOMAIN = 'demo.builtattic.local';
const DEMO_PASSWORD = 'demo#orders2025';
let demoPassHashCache;

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const clampQuantity = (value, fallback = 1) => {
  const quantity = Math.trunc(toNumber(value, fallback));
  return quantity > 0 ? quantity : fallback;
};

const sanitizeCheckout = (input = {}) => {
  if (!input) return undefined;
  return {
    addressId: input.addressId || null,
    addressLabel: input.addressLabel || null,
    gstInvoice: Boolean(input.gstInvoice),
    notes: input.notes || '',
    couponCode: input.couponCode || null,
    metadata: input.metadata || null,
  };
};

const sanitizeMetadata = (input) => {
  if (!input || typeof input !== 'object') return undefined;
  return input;
};

const normalizeItems = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((raw) => {
      if (!raw) return null;
      const productIdCandidate = raw.productId || raw.id || raw._id;
      const productSlugCandidate = raw.productSlug || raw.slug;
      if (!productIdCandidate && !productSlugCandidate) return null;
      const quantity = clampQuantity(raw.quantity || raw.qty || 1);
      const unitPrice = raw.unitPrice ?? raw.price ?? null;
      const currency = raw.currency || null;
      const cartItemId = raw.cartItemId || raw.idInCart || null;
      const source = raw.source || raw.kind || null;
      const title = raw.title || raw.name || null;
      const result = {
        quantity,
        unitPrice: unitPrice != null ? Number(unitPrice) : null,
        currency,
        cartItemId: cartItemId ? String(cartItemId) : null,
        source,
        title,
      };
      if (productIdCandidate && mongoose.isValidObjectId(productIdCandidate)) {
        result.productId = String(productIdCandidate);
      } else if (productSlugCandidate) {
        result.productSlug = String(productSlugCandidate);
      } else if (productIdCandidate) {
        // fallback to treating as slug
        result.productSlug = String(productIdCandidate);
      } else {
        return null;
      }
      return result;
    })
    .filter(Boolean);
};

async function getDemoPassHash() {
  if (!demoPassHashCache) {
    demoPassHashCache = await argon2.hash(DEMO_PASSWORD);
  }
  return demoPassHashCache;
}

async function ensureActor(req) {
  if (req.user?._id) {
    return req.user;
  }
  const demoKeyRaw = req.headers['x-demo-user'];
  if (!demoKeyRaw) {
    return null;
  }
  const demoKey = String(demoKeyRaw).trim();
  if (!demoKey) return null;
  const email = `${demoKey}@${DEMO_DOMAIN}`;
  let user = await User.findOne({ email });
  if (!user) {
    const passHash = await getDemoPassHash();
    user = await User.create({ email, passHash, role: 'user', isClient: true });
    logger.debug('Created demo user for orders', { email });
  }
  req.user = user;
  return user;
}

async function fetchProductMaps(items) {
  const byId = items.filter((item) => item.productId);
  const bySlug = items.filter((item) => !item.productId && item.productSlug);

  const idMap = new Map();
  const slugMap = new Map();

  if (byId.length) {
    const ids = [...new Set(byId.map((item) => item.productId))];
    const docs = await Product.find({ _id: { $in: ids } }).lean();
    docs.forEach((doc) => {
      idMap.set(String(doc._id), doc);
      if (doc.slug) slugMap.set(doc.slug, doc);
    });
  }

  const missingSlugQueries = bySlug
    .map((item) => item.productSlug)
    .filter((slug) => slug && !slugMap.has(slug));

  if (missingSlugQueries.length) {
    const docs = await Product.find({ slug: { $in: [...new Set(missingSlugQueries)] } }).lean();
    docs.forEach((doc) => {
      slugMap.set(doc.slug, doc);
      idMap.set(String(doc._id), doc);
    });
  }

  return { idMap, slugMap };
}

async function removeItemsFromCart(userId, items, options = {}) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return;
  const cartItemIdSet = new Set((options.cartItemIds || []).map((id) => String(id)));
  if (cartItemIdSet.size > 0) {
    cart.items = cart.items.filter((item) => !cartItemIdSet.has(String(item._id)));
  } else {
    const productSet = new Set(items.map((item) => item.resolvedProductId));
    cart.items = cart.items.filter((item) => !productSet.has(String(item.product)));
  }
  cart.updatedAt = new Date();
  await cart.save();
}


async function notifyAdminOfOrder(orderDoc, actor) {
  const actorLabel = actor?.email || actor?.contactEmail || ('user:' + String(actor?._id || 'unknown'));
  const amountValue = orderDoc.amounts?.grand ?? orderDoc.amounts?.subtotal ?? 0;
  const amount = Number.isFinite(amountValue) ? Number(amountValue).toFixed(2) : String(amountValue || '0');
  const currency = (orderDoc.items && orderDoc.items[0]?.currency) || 'USD';
  const summaryRows = (orderDoc.items || [])
    .map((item) => {
      const title = item.title || 'Item';
      const qty = item.qty || item.quantity || 1;
      const unit = item.unitPrice != null ? Number(item.unitPrice).toFixed(2) : 'n/a';
      const line = item.unitPrice != null ? Number(item.unitPrice * qty).toFixed(2) : 'n/a';
      return '<tr><td style="padding:4px 8px;border:1px solid #e2e8f0;">' + title + '</td>' +
        '<td style="padding:4px 8px;border:1px solid #e2e8f0;text-align:right;">' + qty + '</td>' +
        '<td style="padding:4px 8px;border:1px solid #e2e8f0;text-align:right;">' + unit + ' ' + currency + '</td>' +
        '<td style="padding:4px 8px;border:1px solid #e2e8f0;text-align:right;">' + line + ' ' + currency + '</td></tr>';
    })
    .join('');
  try {
    await sendAdminNotificationEmail({
      subject: 'Builtattic order ' + String(orderDoc._id || ''),
      html:
        '<p>' + actorLabel + ' placed a new order.</p>' +
        '<p>Total: <strong>' + amount + ' ' + currency + '</strong></p>' +
        '<table style="border-collapse:collapse;border:1px solid #e2e8f0;"><thead><tr>' +
        '<th style="padding:4px 8px;border:1px solid #e2e8f0;text-align:left;">Item</th>' +
        '<th style="padding:4px 8px;border:1px solid #e2e8f0;">Qty</th>' +
        '<th style="padding:4px 8px;border:1px solid #e2e8f0;">Unit</th>' +
        '<th style="padding:4px 8px;border:1px solid #e2e8f0;">Line total</th>' +
        '</tr></thead><tbody>' + summaryRows + '</tbody></table>',
      text: actorLabel + ' placed order ' + String(orderDoc._id || '') + ' totaling ' + amount + ' ' + currency + '.',
    });
  } catch (error) {
    logger.warn('order_notification_email_failed', { order: String(orderDoc?._id), error: error.message });
  }
}

async function createOrder(actor, items, options = {}) {
  if (!actor?._id) {
    throw new OrderError('Actor missing', 401, 'unauthorized');
  }
  const normalized = normalizeItems(items);
  if (!normalized.length) {
    throw new OrderError('No items supplied', 400, 'no_items');
  }

  const { idMap, slugMap } = await fetchProductMaps(normalized);

  const orderItems = [];
  let subtotal = 0;

  for (const item of normalized) {
    let product;
    if (item.productId && idMap.has(item.productId)) {
      product = idMap.get(item.productId);
    } else if (item.productSlug && slugMap.has(item.productSlug)) {
      product = slugMap.get(item.productSlug);
    }
    if (!product) {
      throw new OrderError('Product not found', 404, 'product_not_found');
    }

    const quantity = clampQuantity(item.quantity, 1);
    const unitPrice = toNumber(
      item.unitPrice,
      toNumber(product?.pricing?.basePrice, toNumber(product.price, 0))
    );
    const lineTotal = Number((unitPrice * quantity).toFixed(2));
    subtotal += lineTotal;

    orderItems.push({
      product: product._id,
      firm: product.firm || undefined,
      qty: quantity,
      unitPrice,
      currency: item.currency || product?.pricing?.currency || product?.currency || 'INR',
      lineTotal,
      source: item.source || product.kind || undefined,
      title: item.title || product.title || product.name || undefined,
      resolvedProductId: String(product._id),
    });
  }

  if (!orderItems.length) {
    throw new OrderError('Unable to resolve order items', 400, 'items_unresolved');
  }

  const discount = toNumber(options.discount, 0);
  let tax;
  if (options.tax != null) {
    tax = toNumber(options.tax, 0);
  } else if (options.checkout?.gstInvoice) {
    tax = Number((subtotal * 0.18).toFixed(2));
  } else {
    tax = 0;
  }
  const grand = Number(Math.max(0, subtotal - discount + tax).toFixed(2));

  const orderPayload = {
    user: actor._id,
    items: orderItems.map(({ resolvedProductId, ...rest }) => rest),
    amounts: {
      subtotal,
      discount,
      tax,
      grand,
    },
    status: 'created',
    checkout: sanitizeCheckout(options.checkout),
    metadata: sanitizeMetadata(options.metadata),
  };

  const order = await Order.create(orderPayload);

  if (options.removeFromCart) {
    try {
      await removeItemsFromCart(actor._id, orderItems.map((item) => ({
        resolvedProductId: String(item.product),
      })), {
        cartItemIds: options.cartItemIds,
      });
    } catch (cartErr) {
      logger.warn('Failed to tidy cart after order placement', {
        error: cartErr.message,
        user: String(actor._id),
      });
    }
  }

  await notifyAdminOfOrder(order, actor);

  return order;
}

function handleError(res, error) {
  if (error instanceof OrderError) {
    return res.status(error.status).json({ ok: false, error: error.code, message: error.message });
  }
  logger.error('Order route failure', { error: error.message, stack: error.stack });
  return res.status(500).json({ ok: false, error: 'internal_error' });
}

router.get('/orders', async (req, res) => {
  try {
    const actor = await ensureActor(req);
    if (!actor) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    const orders = await Order.find({ user: actor._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ ok: true, items: orders });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/orders/place', async (req, res) => {
  try {
    const actor = await ensureActor(req);
    if (!actor) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    const items = req.body?.items || [];
    const checkout = sanitizeCheckout(req.body?.checkout);
    const metadata = sanitizeMetadata(req.body?.metadata);
    const discount = req.body?.pricing?.discount ?? req.body?.amounts?.discount;
    const tax = req.body?.pricing?.tax ?? req.body?.amounts?.tax;
    const cartItemIds = Array.isArray(req.body?.cartItemIds)
      ? req.body.cartItemIds.map((id) => String(id))
      : [];

    const order = await createOrder(actor, items, {
      checkout,
      metadata,
      discount,
      tax,
      removeFromCart: req.body?.removeFromCart !== false,
      cartItemIds,
    });

    res.status(201).json({ ok: true, order });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/orders/buy-now', async (req, res) => {
  try {
    const actor = await ensureActor(req);
    if (!actor) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    const item = req.body?.item || req.body;
    const checkout = sanitizeCheckout(req.body?.checkout);
    const metadata = sanitizeMetadata(req.body?.metadata);
    const pricing = req.body?.pricing || {};

    const items = [
      {
        productId: item?.productId,
        productSlug: item?.productSlug || item?.slug,
        quantity: item?.quantity || item?.qty || 1,
        unitPrice: item?.unitPrice ?? pricing.unitPrice ?? item?.price,
        currency: item?.currency ?? pricing.currency,
        source: item?.source || item?.kind,
        title: item?.title || item?.name,
      },
    ];

    const order = await createOrder(actor, items, {
      checkout,
      metadata,
      discount: pricing.discount,
      tax: pricing.tax,
      removeFromCart: false,
    });

    res.status(201).json({ ok: true, order });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/orders', async (req, res) => {
  try {
    const actor = await ensureActor(req);
    if (!actor) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    // If payload includes explicit items, reuse the place endpoint logic
    if (Array.isArray(req.body?.items) && req.body.items.length > 0) {
      const order = await createOrder(actor, req.body.items, {
        checkout: sanitizeCheckout(req.body?.checkout),
        metadata: sanitizeMetadata(req.body?.metadata),
        discount: req.body?.pricing?.discount ?? req.body?.amounts?.discount,
        tax: req.body?.pricing?.tax ?? req.body?.amounts?.tax,
        removeFromCart: req.body?.removeFromCart !== false,
        cartItemIds: Array.isArray(req.body?.cartItemIds)
          ? req.body.cartItemIds.map((id) => String(id))
          : [],
      });
      return res.status(201).json({ ok: true, order });
    }

    const cart = await Cart.findOne({ user: actor._id });
    if (!cart || !cart.items.length) {
      throw new OrderError('Cart empty', 400, 'cart_empty');
    }
    const items = cart.items.map((item) => ({
      productId: String(item.product),
      quantity: item.qty,
      cartItemId: String(item._id),
    }));

    const order = await createOrder(actor, items, {
      checkout: sanitizeCheckout(req.body?.checkout),
      metadata: sanitizeMetadata(req.body?.metadata),
      discount: req.body?.pricing?.discount ?? req.body?.amounts?.discount,
      tax: req.body?.pricing?.tax ?? req.body?.amounts?.tax,
      removeFromCart: true,
      cartItemIds: items.map((item) => item.cartItemId),
    });

    res.status(201).json({ ok: true, order });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;