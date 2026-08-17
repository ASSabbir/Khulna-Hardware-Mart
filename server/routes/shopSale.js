// FILE: server/routes/shopSale.js (NEW) — selling our stock to another shop
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ShopSale = require("../models/ShopSale");
const { deductStockFIFO } = require("./product");
const { withTransaction } = require("../utils/withTransaction");

router.get("/shop-names", async (req, res) => {
  try {
    const { search = "" } = req.query;
    const filter = {};
    if (search.trim()) filter.shopName = { $regex: search.trim(), $options: "i" };
    const names = await ShopSale.distinct("shopName", filter);
    res.json({ shopNames: names.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const all = await ShopSale.find().lean();
    const totalSales = all.reduce((s, i) => s + i.grandTotal, 0);
    const totalPaid = all.reduce((s, i) => s + i.paidAmount, 0);
    const totalDue = all.reduce((s, i) => s + i.dueAmount, 0);
    res.json({ totalSales, totalPaid, totalDue, count: all.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30, shopName, paymentStatus, search } = req.query;
    const cappedLimit = Math.min(parseInt(limit) || 30, 200);
    const skip = (Math.max(1, parseInt(page)) - 1) * cappedLimit;
    const filter = {};
    if (shopName) filter.shopName = { $regex: shopName, $options: "i" };
    if (paymentStatus === "paid" || paymentStatus === "due") filter.paymentStatus = paymentStatus;
    if (search && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ shopName: { $regex: safe, $options: "i" } }, { invoiceNumber: { $regex: safe, $options: "i" } }];
    }
    const [sales, total] = await Promise.all([
      ShopSale.find(filter).sort({ createdAt: -1 }).skip(skip).limit(cappedLimit).lean(),
      ShopSale.countDocuments(filter),
    ]);
    res.json({ sales, pagination: { total, page: parseInt(page), limit: cappedLimit, totalPages: Math.ceil(total / cappedLimit) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid id." });
    const sale = await ShopSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Not found." });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { shopName, saleDate, items, paidAmount } = req.body;
    if (!shopName || !String(shopName).trim()) return res.status(400).json({ message: "Shop name is required." });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "At least one item required." });
    for (const it of items) {
      if (!Number.isFinite(Number(it.qty)) || Number(it.qty) <= 0) return res.status(400).json({ message: "Each item needs a valid quantity." });
      if (!Number.isFinite(Number(it.price)) || Number(it.price) < 0) return res.status(400).json({ message: "Each item needs a valid price." });
    }

    const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);
    const grandTotal = +subtotal.toFixed(2);
    const paid = Math.min(Math.max(Number(paidAmount) || 0, 0), grandTotal);
    const due = +(grandTotal - paid).toFixed(2);
    const invoiceNumber = "SS-" + Date.now().toString().slice(-8);

    const sale = await withTransaction(async (session) => {
      const processedItems = [];
      for (const it of items) {
        if (it.productId && mongoose.Types.ObjectId.isValid(it.productId)) {
          await deductStockFIFO(it.productId, Number(it.qty), session);
        }
        processedItems.push({ productId: it.productId || null, name: it.name, unit: it.unit || "pcs", qty: Number(it.qty), price: Number(it.price), total: +(Number(it.price) * Number(it.qty)).toFixed(2) });
      }
      const doc = new ShopSale({
        invoiceNumber, shopName: String(shopName).trim(), saleDate: saleDate || new Date().toISOString().slice(0, 10),
        items: processedItems, subtotal: +subtotal.toFixed(2), grandTotal,
        paymentStatus: due <= 0.01 ? "paid" : "due", paidAmount: paid, dueAmount: Math.max(0, due),
        payments: paid > 0 ? [{ method: "cash", amount: paid }] : [],
      });
      await doc.save({ session });
      return doc;
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Edit item prices after creation (qty not editable — stock already deducted)
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid id." });
    const { items } = req.body;
    const sale = await ShopSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Not found." });
    if (!Array.isArray(items) || items.length !== sale.items.length) return res.status(400).json({ message: "Item list mismatch." });

    let subtotal = 0;
    sale.items.forEach((existing, idx) => {
      const newPrice = Number(items[idx].price);
      if (!Number.isFinite(newPrice) || newPrice < 0) throw new Error("Invalid price.");
      existing.price = newPrice;
      existing.total = +(newPrice * existing.qty).toFixed(2);
      subtotal += existing.total;
    });
    sale.subtotal = +subtotal.toFixed(2);
    sale.grandTotal = sale.subtotal;
    sale.dueAmount = Math.max(0, +(sale.grandTotal - sale.paidAmount).toFixed(2));
    sale.paymentStatus = sale.dueAmount <= 0.01 ? "paid" : "due";
    await sale.save();
    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/:id/collect-due", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid id." });
    const { amount, method, provider, bankName } = req.body;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Enter a valid amount." });

    const sale = await ShopSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Not found." });
    if (amt > sale.dueAmount + 0.01) return res.status(400).json({ message: "Amount exceeds due." });

    sale.paidAmount = +(sale.paidAmount + amt).toFixed(2);
    sale.dueAmount = Math.max(0, +(sale.dueAmount - amt).toFixed(2));
    sale.payments.push({ method: method || "cash", amount: amt, provider: method === "mobile" ? provider : null, bankName: method === "bank" ? bankName : "" });
    if (sale.dueAmount <= 0.01) { sale.dueAmount = 0; sale.paymentStatus = "paid"; }
    await sale.save();
    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;