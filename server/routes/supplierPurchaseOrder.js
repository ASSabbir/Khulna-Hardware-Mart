// FILE: server/routes/supplierPurchaseOrder.js (NEW)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const PurchaseHistory = require("../models/PurchaseHistory");
const SupplierPayment = require("../models/SupplierPayment");
const Ledger = require("../models/Ledger");
const Supplier = require("../models/Supplier");
const { withTransaction } = require("../utils/withTransaction");
const { computeSupplierBalance } = require("./supplierPayment");

// POST /api/supplier-purchase-orders — one supplier, multiple existing products in one submission
router.post("/", async (req, res) => {
  try {
    const { supplierId, items, payments, creditApplied } = req.body;
    if (!mongoose.Types.ObjectId.isValid(supplierId)) return res.status(400).json({ message: "Select a valid supplier." });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Add at least one product." });
    for (const it of items) {
      if (!mongoose.Types.ObjectId.isValid(it.productId)) return res.status(400).json({ message: "Invalid product selected." });
      if (!Number.isFinite(Number(it.buyingPrice)) || Number(it.buyingPrice) < 0) return res.status(400).json({ message: "Each item needs a valid buying price." });
      if (!Number.isFinite(Number(it.quantity)) || Number(it.quantity) <= 0) return res.status(400).json({ message: "Each item needs a valid quantity." });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ message: "Supplier not found." });

    const totalCost = items.reduce((s, it) => s + Number(it.buyingPrice) * Number(it.quantity), 0);
    const credit = Number(creditApplied) || 0;
    const paidSum = (payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const dueRemaining = Math.max(0, +(totalCost - credit - paidSum).toFixed(2));

    const result = await withTransaction(async (session) => {
      const purchasedItems = [];
      const today = new Date().toISOString().slice(0, 10);

      for (const it of items) {
        const product = await Product.findById(it.productId).session(session);
        if (!product) throw new Error("A selected product no longer exists.");
        const price = Number(it.buyingPrice);
        const qty = Number(it.quantity);
        const pDate = new Date();

        product.batches.push({ supplierId: supplier._id, supplierName: supplier.companyName, buyingPrice: price, quantity: qty, originalQuantity: qty, purchaseDate: pDate });
        product.stock = (product.stock || 0) + qty;
        const existingSupplierIdx = product.suppliers.findIndex((s) => String(s.supplierId) === String(supplier._id));
        if (existingSupplierIdx >= 0) { product.suppliers[existingSupplierIdx].buyingPrice = price; product.suppliers[existingSupplierIdx].lastPurchaseDate = pDate; }
        else product.suppliers.push({ supplierId: supplier._id, supplierName: supplier.companyName, buyingPrice: price, lastPurchaseDate: pDate, availableQuantity: 0 });

        const bySupplier = {};
        for (const b of product.batches) { const key = b.supplierId ? String(b.supplierId) : null; if (!key) continue; bySupplier[key] = (bySupplier[key] || 0) + Math.max(0, b.quantity || 0); }
        product.suppliers.forEach((s) => { s.availableQuantity = bySupplier[String(s.supplierId)] || 0; });

        await product.save({ session });
        await PurchaseHistory.create([{ productId: product._id, productName: product.name, supplierId: supplier._id, supplierName: supplier.companyName, buyingPrice: price, quantity: qty, totalCost: price * qty, purchaseDate: pDate }], { session });
        await Supplier.findByIdAndUpdate(supplier._id, { $inc: { totalPurchaseAmount: price * qty, totalPurchaseCount: 1, totalPurchasedQuantity: qty }, $set: { lastPurchasePrice: price, lastPurchaseDate: pDate } }, { session });

        purchasedItems.push({ productName: product.name, buyingPrice: price, quantity: qty, totalCost: price * qty });
      }

      // Credit consumption needs no SupplierPayment entry — see product.js recordPurchasePayments.
      for (const p of payments || []) {
        const amt = Number(p.amount);
        if (!Number.isFinite(amt) || amt <= 0) continue;
        const method = ["cash", "mobile", "bank"].includes(p.method) ? p.method : "cash";
        const provider = method === "mobile" ? p.provider : null;
        await SupplierPayment.create([{ supplierId: supplier._id, type: "payable", amount: amt, method, provider, date: today, note: "Purchase order" }], { session });
        await Ledger.create([{ type: "expense", category: "Purchase", amount: amt, description: `Purchase order — ${supplier.companyName}`, date: today, method, provider, addedBy: "System" }], { session });
      }

      return { purchasedItems, totalCost, credit, paidSum, dueRemaining };
    });

    const balance = await computeSupplierBalance(supplier._id);
    res.status(201).json({ ...result, supplierName: supplier.companyName, balance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;