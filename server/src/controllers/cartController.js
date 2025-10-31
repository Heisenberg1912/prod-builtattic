const Cart = require('../models/Cart');

const getUserId = (req) => req.headers['x-demo-user'] || 'demo-user';

exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: getUserId(req) });
  res.json(cart || { items: [] });
};

exports.addToCart = async (req, res) => {
  const { productId, source, name, image, price, quantity } = req.body;
  let cart = await Cart.findOne({ user: getUserId(req) });
  if (!cart) cart = new Cart({ user: getUserId(req), items: [] });

  const idx = cart.items.findIndex(i => i.productId === productId && i.source === source);
  if (idx > -1) {
    cart.items[idx].quantity += quantity || 1;
  } else {
    cart.items.push({ productId, source, name, image, price, quantity: quantity || 1 });
  }
  await cart.save();
  res.json(cart);
};

exports.updateQuantity = async (req, res) => {
  const { productId, source, quantity } = req.body;
  const cart = await Cart.findOne({ user: getUserId(req) });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  const item = cart.items.find(i => i.productId === productId && i.source === source);
  if (item) {
    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
};

exports.removeFromCart = async (req, res) => {
  const { productId, source } = req.body;
  const cart = await Cart.findOne({ user: getUserId(req) });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  cart.items = cart.items.filter(i => !(i.productId === productId && i.source === source));
  await cart.save();
  res.json(cart);
};
