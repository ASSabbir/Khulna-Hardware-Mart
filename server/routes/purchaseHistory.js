// FILE: server/routes/purchaseHistory.js (FULL REPLACEMENT) — grouped view added
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PurchaseHistory = require("../models/PurchaseHistory");
const SupplierPayment = require("../models/SupplierPayment");

router.get("/", async (req, res) => {
  try {
    const { productId, productName, supplierId, from, to, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ message: "Invalid productId." });
      filter.productId = productId;
    }
    if (!productId && productName && String(productName).trim()) filter.productName = { $regex: String(productName).trim(), $options: "i" };
    if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) return res.status(400).json({ message: "Invalid supplierId." });
      filter.supplierId = supplierId;
    }
    if (from || to) {
      filter.purchaseDate = {};
      if (from) { const fromDate = new Date(from); if (isNaN(fromDate)) return res.status(400).json({ message: "Invalid 'from' date." }); filter.purchaseDate.$gte = fromDate; }
      if (to) { const toDate = new Date(to); if (isNaN(toDate)) return res.status(400).json({ message: "Invalid 'to' date." }); toDate.setHours(23, 59, 59, 999); filter.purchaseDate.$lte = toDate; }
    }
    const cappedLimit = Math.min(parseInt(limit) || 30, 200);
    const skip = (Math.max(1, parseInt(page)) - 1) * cappedLimit;
    const [records, total] = await Promise.all([
      PurchaseHistory.find(filter).sort({ purchaseDate: -1 }).skip(skip).limit(cappedLimit).lean(),
      PurchaseHistory.countDocuments(filter),
    ]);
    res.json({ records, pagination: { total, page: parseInt(page), limit: cappedLimit, totalPages: Math.ceil(total / cappedLimit) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// #grouped — one row per (date, supplier): product count, total cost, and full breakdown for the Eye modal
router.get("/grouped", async (req, res) => {
  try {
    const { page = 1, limit = 30, supplierId, from, to } = req.query;
    const filter = {};
    if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) return res.status(400).json({ message: "Invalid supplierId." });
      filter.supplierId = supplierId;
    }
    if (from || to) {
      filter.purchaseDate = {};
      if (from) filter.purchaseDate.$gte = new Date(from);
      if (to) { const toDate = new Date(to); toDate.setHours(23, 59, 59, 999); filter.purchaseDate.$lte = toDate; }
    }

    const all = await PurchaseHistory.find(filter).sort({ purchaseDate: -1 }).lean();
    const groups = {};
    for (const r of all) {
      const dateKey = new Date(r.purchaseDate).toISOString().slice(0, 10);
      const key = `${dateKey}__${r.supplierId || "unknown"}`;
      if (!groups[key]) groups[key] = { date: dateKey, supplierId: r.supplierId, supplierName: r.supplierName, items: [], totalCost: 0, totalQty: 0 };
      groups[key].items.push({ productId: r.productId, productName: r.productName, buyingPrice: r.buyingPrice, quantity: r.quantity, totalCost: r.totalCost, purchaseDate: r.purchaseDate });
      groups[key].totalCost += r.totalCost;
      groups[key].totalQty += r.quantity;
    }
    let groupList = Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));

    // attach payment info made on that date for that supplier (best-effort — payments aren't per-purchase-batch linked)
    const supplierIds = [...new Set(groupList.map((g) => String(g.supplierId)).filter((s) => s !== "undefined" && s !== "null"))];
    const payments = supplierIds.length ? await SupplierPayment.find({ supplierId: { $in: supplierIds } }).lean() : [];
    groupList = groupList.map((g) => {
      const dayPayments = payments.filter((p) => p.type === "payable" && String(p.supplierId) === String(g.supplierId) && p.date === g.date);
      const paidThatDay = dayPayments.reduce((s, p) => s + p.amount, 0);
      return { ...g, paidThatDay: +paidThatDay.toFixed(2), duePortion: Math.max(0, +(g.totalCost - paidThatDay).toFixed(2)), payments: dayPayments };
    });

    const cappedLimit = Math.min(parseInt(limit) || 30, 100);
    const start = (Math.max(1, parseInt(page)) - 1) * cappedLimit;
    const paged = groupList.slice(start, start + cappedLimit);

    res.json({ groups: paged, pagination: { total: groupList.length, page: parseInt(page), limit: cappedLimit, totalPages: Math.ceil(groupList.length / cappedLimit) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;