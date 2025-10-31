import express from "express";

const router = express.Router();

// In-memory wishlist store (per-process). Replace with DB later.
let state = { items: [] };

// Normalize incoming payload to a standardized item
const normalizeItem = (body) => {
  if (!body) return null;
  const { id, _id, studioId, productId, ...rest } = body;
  const itemId = id || _id || studioId || productId;
  return itemId ? { id: String(itemId), ...rest } : null;
};

// GET wishlist
router.get("/", (req, res) => {
  res.json({ items: state.items, count: state.items.length });
});

// POST add item
router.post("/", (req, res) => {
  const item = normalizeItem(req.body);
  if (!item) return res.status(400).json({ message: "Missing id" });

  if (!state.items.some(i => i.id === item.id)) state.items.push(item);

  res.status(201).json({ items: state.items, count: state.items.length });
});

// POST toggle item
router.post("/toggle", (req, res) => {
  const item = normalizeItem(req.body);
  if (!item) return res.status(400).json({ message: "Missing id" });

  const idx = state.items.findIndex(i => i.id === item.id);
  const added = idx === -1;

  if (added) state.items.push(item);
  else state.items.splice(idx, 1);

  res.json({ items: state.items, count: state.items.length, added });
});

// DELETE item
router.delete("/:id", (req, res) => {
  const id = String(req.params.id);
  const originalLength = state.items.length;
  state.items = state.items.filter(i => i.id !== id);

  res.json({
    items: state.items,
    count: state.items.length,
    removed: state.items.length < originalLength
  });
});

export default router;
