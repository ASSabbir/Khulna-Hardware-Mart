// FILE: server/routes/supplierPayment.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SupplierPayment = require("../models/SupplierPayment");
const Supplier = require("../models/Supplier");
const PurchaseHistory = require("../models/PurchaseHistory");

async function computeSupplierBalance(supplierId) {
  const [purchases, payments] = await Promise.all([
    PurchaseHistory.find({ supplierId }).lean(),
    SupplierPayment.find({ supplierId }).lean(),
  ]);
  const totalOwed = purchases.reduce((s, p) => s + (p.totalCost || 0), 0);
  const totalPaid = payments.filter((p) => p.type === "payable").reduce((s, p) => s + p.amount, 0);
  // "receivable" entries: positive = supplier overpaid us (increases receivable / decreases net payable),
  // negative = a receivable credit was consumed/adjusted against a new purchase (also decreases receivable, same direction).
  const totalReceived = payments.filter((p) => p.type === "receivable").reduce((s, p) => s + p.amount, 0);
  const net = totalOwed - totalPaid + totalReceived;
  return {
    totalOwed: +totalOwed.toFixed(2),
    totalPaid: +totalPaid.toFixed(2),
    totalReceived: +totalReceived.toFixed(2),
    payableAmount: net > 0.01 ? +net.toFixed(2) : 0,
    receivableAmount: net < -0.01 ? +Math.abs(net).toFixed(2) : 0,
  };
}

router.get("/summary", async (req, res) => {
  try {
    const suppliers = await Supplier.find().lean();
    const results = await Promise.all(
      suppliers.map(async (s) => {
        const bal = await computeSupplierBalance(s._id);
        return { supplierId: s._id, companyName: s.companyName || s.name, ...bal };
      })
    );
    res.json({ suppliers: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// #14 — single combined, date-sorted timeline (purchases + payments) with running summary
router.get("/:supplierId", async (req, res) => {
  try {
    const { supplierId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(supplierId)) return res.status(400).json({ message: "Invalid supplier id." });

    const [purchases, payments, balance] = await Promise.all([
      PurchaseHistory.find({ supplierId }).sort({ purchaseDate: -1 }).lean(),
      SupplierPayment.find({ supplierId }).sort({ date: -1, createdAt: -1 }).lean(),
      computeSupplierBalance(supplierId),
    ]);

    const timeline = [
      ...purchases.map((p) => ({
        kind: "purchase",
        date: p.purchaseDate,
        productName: p.productName,
        quantity: p.quantity,
        buyingPrice: p.buyingPrice,
        amount: p.totalCost,
      })),
      ...payments.map((p) => ({
        kind: p.type === "payable" ? "payment" : "receivable",
        date: p.date,
        method: p.method,
        provider: p.provider,
        amount: p.amount,
        note: p.note,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ timeline, purchases, payments, balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { supplierId, amount, method, provider, note, date } = req.body;
    if (!mongoose.Types.ObjectId.isValid(supplierId)) return res.status(400).json({ message: "Invalid supplier id." });
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Enter a valid payment amount." });
    if (!date || isNaN(new Date(date))) return res.status(400).json({ message: "A valid date is required." });
    if (method === "mobile" && !["bKash", "Nagad", "Rocket", "Upay"].includes(provider)) {
      return res.status(400).json({ message: "Select a valid mobile banking provider." });
    }
    await SupplierPayment.create({ supplierId, type: "payable", amount: amt, method: method || "cash", provider: method === "mobile" ? provider : null, note: String(note || "").slice(0, 300), date });
    const after = await computeSupplierBalance(supplierId);
    res.status(201).json({ balance: after });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
module.exports.computeSupplierBalance = computeSupplierBalance;