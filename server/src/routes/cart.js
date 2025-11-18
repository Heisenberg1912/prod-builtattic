import { Router } from 'express';
import mongoose from 'mongoose';

import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { requireAuth } from '../rbac/guards.js';

const router = Router();

const normalizeQuantity = (value, fallback = 1) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.max(1, Math.trunc(num));
};

const sanitizeCurrency = (value) => {
  if (!value) return 'USD';
  return String(value).trim().toUpperCase().slice(0, 8) || 'USD';
};

const ensureCart = async (userId) => {
  if (!userId) {
    throw new Error('User id is required to load cart');
  }
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, items: [] } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return cart;
  } catch (error) {
    if (error?.code === 11000) {
      return Cart.findOne({ user: userId });
    }
    throw error;
  }
};

const projectCart = (cart) => {
  if (!cart) {
    return { items: [] };
  }
  return {
    _id: cart._id,
    updatedAt: cart.updatedAt,
    items: cart.items.map((item) => {
      const price = Number(item.price ?? item.snapshot?.price ?? 0) || 0;
      const qty = normalizeQuantity(item.qty ?? item.quantity ?? 1);
      return {
        cartItemId: String(item._id),
        productId: item.product ? String(item.product) : item.productId || item.snapshot?.productId || null,
        title: item.title || item.snapshot?.title || 'Untitled',
        price,
        currency: item.currency || item.snapshot?.currency || 'USD',
        quantity: qty,
        totalPrice: Number((price * qty).toFixed(2)),
        image: item.image || item.snapshot?.image || '',
        source: item.source || item.snapshot?.source || 'product',
        metadata: item.snapshot?.metadata || {},
      };
    }),
  };
};

const respondWithCart = (res, cart) => {
  res.json({ ok: true, cart: projectCart(cart) });
};

const buildSnapshot = (payload, product) => {
  if (product) {
    return {
      productId: String(product._id),
      slug: product.slug,
      title: product.title,
      price: payload.price,
      currency: payload.currency,
      image: payload.image,
      source: payload.source,
      metadata: payload.metadata,
    };
  }
  return {
    productId: payload.productId,
    slug: payload.slug,
    title: payload.title,
    price: payload.price,
    currency: payload.currency,
    image: payload.image,
    source: payload.source,
    metadata: payload.metadata,
  };
};

const fetchProductCandidate = async (payload) => {
  const isObjectId = payload.productId && mongoose.isValidObjectId(payload.productId);
  if (isObjectId) {
    const doc = await Product.findById(payload.productId).lean();
    if (doc) return doc;
  }
  if (payload.slug) {
    const doc = await Product.findOne({ slug: payload.slug }).lean();
    if (doc) return doc;
  }
  return null;
};

const normalizeCartPayload = async (body = {}) => {
  const quantity = normalizeQuantity(body.quantity ?? body.qty ?? 1);
  const rawPrice = body.price ?? body.unitPrice ?? 0;
  const payload = {
    quantity,
    productId: body.productId ? String(body.productId) : null,
    slug: body.productSlug || body.slug || null,
    title: body.title || body.name || null,
    price: Number(rawPrice) || 0,
    currency: sanitizeCurrency(body.currency ?? body.unitCurrency ?? body.currencyCode),
    image: body.image || body.img || body.heroImage || null,
    source: body.source || body.kind || 'product',
    metadata: typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : undefined,
  };
  const product = await fetchProductCandidate(payload);
  if (product) {
    payload.productObjectId = product._id;
    payload.title = payload.title || product.title;
    payload.price = payload.price || product.price || product.pricing?.basePrice || 0;
    payload.currency = payload.currency || product.pricing?.currency || product.currency || 'USD';
    payload.image = payload.image || product.heroImage || (product.assets?.[0]?.url ?? null);
  }
  if (!payload.title) payload.title = 'Untitled';
  payload.snapshot = buildSnapshot(payload, product);
  return payload;
};

const findItemByIdentifiers = (cart, identifiers = {}) => {
  const compareId = identifiers.productObjectId ? String(identifiers.productObjectId) : null;
  const compareProductId = identifiers.productId ? String(identifiers.productId) : null;
  const compareSlug = identifiers.slug ? String(identifiers.slug) : null;
  return cart.items.find((item) => {
    if (compareId && item.product && String(item.product) === compareId) return true;
    if (compareProductId && item.productId === compareProductId) return true;
    if (compareSlug && item.snapshot?.slug && item.snapshot.slug === compareSlug) return true;
    return false;
  });
};

const upsertCartItem = async (userId, rawPayload = {}) => {
  const payload = await normalizeCartPayload(rawPayload);
  const cart = await ensureCart(userId);
  const existing = findItemByIdentifiers(cart, payload);
  if (existing) {
    existing.qty += payload.quantity;
    existing.price = payload.price;
    existing.currency = payload.currency;
    existing.title = payload.title;
    existing.image = payload.image;
    existing.source = payload.source;
    existing.productId = payload.productId || existing.productId;
    existing.snapshot = { ...existing.snapshot, ...payload.snapshot };
    if (payload.productObjectId) {
      existing.product = payload.productObjectId;
    }
  } else {
    cart.items.push({
      product: payload.productObjectId || undefined,
      productId: payload.productId || payload.productObjectId?.toString() || payload.slug || undefined,
      title: payload.title,
      price: payload.price,
      currency: payload.currency,
      image: payload.image,
      source: payload.source,
      snapshot: payload.snapshot,
      qty: payload.quantity,
    });
  }
  cart.updatedAt = new Date();
  await cart.save();
  return cart;
};

router.get('/cart', requireAuth, async (req, res) => {
  try {
    const cart = await ensureCart(req.user._id);
    respondWithCart(res, cart);
  } catch (error) {
    console.error('cart_fetch_error', error);
    res.status(500).json({ ok: false, error: 'cart_fetch_failed' });
  }
});

router.post('/cart/items', requireAuth, async (req, res) => {
  try {
    const cart = await upsertCartItem(req.user._id, req.body);
    respondWithCart(res, cart);
  } catch (error) {
    console.error('cart_add_error', error);
    res.status(500).json({ ok: false, error: 'cart_add_failed' });
  }
});

router.patch('/cart/items/:id', requireAuth, async (req, res) => {
  try {
    const qty = normalizeQuantity(req.body?.quantity ?? req.body?.qty ?? 1);
    const cart = await ensureCart(req.user._id);
    const item = cart.items.id(req.params.id);
    if (!item) {
      return res.status(404).json({ ok: false, error: 'item_not_found' });
    }
    item.qty = qty;
    cart.updatedAt = new Date();
    await cart.save();
    respondWithCart(res, cart);
  } catch (error) {
    console.error('cart_update_error', error);
    res.status(500).json({ ok: false, error: 'cart_update_failed' });
  }
});

router.delete('/cart/items/:id', requireAuth, async (req, res) => {
  try {
    const cart = await ensureCart(req.user._id);
    const before = cart.items.length;
    cart.items = cart.items.filter((item) => String(item._id) !== String(req.params.id));
    if (cart.items.length === before) {
      return res.status(404).json({ ok: false, error: 'item_not_found' });
    }
    cart.updatedAt = new Date();
    await cart.save();
    respondWithCart(res, cart);
  } catch (error) {
    console.error('cart_remove_error', error);
    res.status(500).json({ ok: false, error: 'cart_remove_failed' });
  }
});

router.post('/cart/add', requireAuth, async (req, res) => {
  try {
    const cart = await upsertCartItem(req.user._id, req.body);
    respondWithCart(res, cart);
  } catch (error) {
    console.error('cart_legacy_add_error', error);
    res.status(500).json({ ok: false, error: 'cart_add_failed' });
  }
});

router.post('/cart/update', requireAuth, async (req, res) => {
  try {
    const qty = normalizeQuantity(req.body?.quantity ?? req.body?.qty ?? 1);
    const cart = await ensureCart(req.user._id);
    const item = findItemByIdentifiers(cart, {
      productObjectId: req.body?.productId && mongoose.isValidObjectId(req.body.productId)
        ? req.body.productId
        : null,
      productId: req.body?.productId,
      slug: req.body?.productSlug || req.body?.slug,
    });
    if (!item) {
      return res.status(404).json({ ok: false, error: 'item_not_found' });
    }
    item.qty = qty;
    cart.updatedAt = new Date();
    await cart.save();
    respondWithCart(res, cart);
  } catch (error) {
    console.error('cart_legacy_update_error', error);
    res.status(500).json({ ok: false, error: 'cart_update_failed' });
  }
});

router.post('/cart/remove', requireAuth, async (req, res) => {
  try {
    const cart = await ensureCart(req.user._id);
    const before = cart.items.length;
    cart.items = cart.items.filter((item) => {
      if (req.body?.cartItemId && String(item._id) === String(req.body.cartItemId)) return false;
      if (req.body?.productId && item.productId === req.body.productId) return false;
      if (req.body?.productSlug && item.snapshot?.slug === req.body.productSlug) return false;
      return true;
    });
    if (cart.items.length === before) {
      return res.status(404).json({ ok: false, error: 'item_not_found' });
    }
    cart.updatedAt = new Date();
    await cart.save();
    respondWithCart(res, cart);
  } catch (error) {
    console.error('cart_legacy_remove_error', error);
    res.status(500).json({ ok: false, error: 'cart_remove_failed' });
  }
});

export default router;
