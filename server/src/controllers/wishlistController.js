const Wishlist = require('../models/Wishlist');

const getUserId = (req) => req.headers['x-demo-user'] || 'demo-user';

exports.getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: getUserId(req) });
  res.json(wishlist || { items: [] });
};

exports.addToWishlist = async (req, res) => {
  const { productId, source, name, image, price } = req.body;
  let wishlist = await Wishlist.findOne({ user: getUserId(req) });
  if (!wishlist) wishlist = new Wishlist({ user: getUserId(req), items: [] });

  const exists = wishlist.items.some(i => i.productId === productId && i.source === source);
  if (!exists) {
    wishlist.items.push({ productId, source, name, image, price });
    await wishlist.save();
  }
  res.json(wishlist);
};

exports.removeFromWishlist = async (req, res) => {
  const { productId, source } = req.body;
  const wishlist = await Wishlist.findOne({ user: getUserId(req) });
  if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });

  wishlist.items = wishlist.items.filter(i => !(i.productId === productId && i.source === source));
  await wishlist.save();
  res.json(wishlist);
};
