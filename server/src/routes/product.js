// import express from "express";

// const router = express.Router();

// router.get("/", (req, res) => {
//   res.json({ message: "Products route working" });
// });

// router.post("/", (req, res) => {
//   // ...create product...
//   res.status(201).json({ message: "Product created" });
// });

// router.get("/:id", (req, res) => {
//   // ...get product...
//   res.json({ message: "Product details", id: req.params.id });
// });

// router.put("/:id", (req, res) => {
//   // ...update product...
//   res.json({ message: "Product updated", id: req.params.id });
// });

// router.delete("/:id", (req, res) => {
//   // ...delete product...
//   res.json({ message: "Product deleted", id: req.params.id });
// });

// export default router;

import express from "express";

const router = express.Router();

// GET all products (test endpoint)
router.get("/", (req, res) => {
  res.json({ message: "Products route working" });
});

// CREATE a product
router.post("/", (req, res) => {
  // TODO: Implement create logic
  res.status(201).json({ message: "Product created" });
});

// GET a single product by ID
router.get("/:id", (req, res) => {
  res.json({ message: "Product details", id: req.params.id });
});

// UPDATE a product by ID
router.put("/:id", (req, res) => {
  // TODO: Implement update logic
  res.json({ message: "Product updated", id: req.params.id });
});

// DELETE a product by ID
router.delete("/:id", (req, res) => {
  // TODO: Implement delete logic
  res.json({ message: "Product deleted", id: req.params.id });
});

export default router;

