// FILE: server/routes/restockList.js (NEW)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const RestockListItem = require("../models/RestockListItem");
const Product = require("../models/Product");

// GET / — auto low-stock products (computed, not stored) + manually saved list items
router.get("/", async (req, res) => {
  try {
    const lowStockProducts = await Product.find({ stock: { $lte: 10 } })
      .select("name sku brand unit stock buyingPrice retailPrice")
      .lean();

    const savedItems = await RestockListItem.find().sort({ createdAt: -1 }).lean();
    const savedProductIds = savedItems.map((i) => String(i.productId));
    const savedProducts = await Product.find({ _id: { $in: savedProductIds } })
      .select("name sku brand unit stock buyingPrice retailPrice")
      .lean();
    const productMap = {};
    savedProducts.forEach((p) => (productMap[String(p._id)] = p));

    const manualItems = savedItems
      .filter((i) => productMap[String(i.productId)])
      .map((i) => ({
        _id: i._id,
        productId: i.productId,
        quantity: i.quantity,
        product: productMap[String(i.productId)],
        auto: false,
      }));

    const autoItems = lowStockProducts
      .filter((p) => !savedProductIds.includes(String(p._id)))
      .map((p) => ({
        productId: p._id,
        quantity: Math.max(10 - (p.stock || 0), 5),
        product: p,
        auto: true,
      }));

    res.json({ manualItems, autoItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ message: "Invalid product." });
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: "Product not found." });
    const qty = Number(quantity) || 10;

    const item = await RestockListItem.findOneAndUpdate(
      { productId },
      { productId, name: product.name, quantity: qty },
      { upsert: true, new: true }
    );
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await RestockListItem.findByIdAndUpdate(req.params.id, { quantity: Number(quantity) || 1 }, { new: true });
    if (!item) return res.status(404).json({ message: "Not found." });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await RestockListItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Removed." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;