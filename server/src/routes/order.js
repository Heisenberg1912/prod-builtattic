import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Orders route working" });
});

router.post("/", (req, res) => {
  // ...create order...
  res.status(201).json({ message: "Order created" });
});

router.get("/:id", (req, res) => {
  // ...get order...
  res.json({ message: "Order details", id: req.params.id });
});

router.put("/:id", (req, res) => {
  // ...update order...
  res.json({ message: "Order updated", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  // ...delete order...
  res.json({ message: "Order deleted", id: req.params.id });
});

export default router;
