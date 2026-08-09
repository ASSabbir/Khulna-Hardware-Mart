// FILE: server/routes/invoice.js (FULL REPLACEMENT) — write-conflict retry + multi-split collect-due
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const { createCustomProduct, deductStockFIFO, restoreStockFIFO } = require("./product");
const { withTransaction } = require("../utils/withTransaction");

const PAYMENT_METHODS = ["cash", "bank", "mobile"];
const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const BANK_OPTIONS = ["Dutch-Bangla Bank", "Islami Bank Bangladesh", "City Bank Limited"];
const EPS = 0.01;

function validatePayments(payments, expectedTotal) {
  if (!Array.isArray(payments) || payments.length === 0) return "At least one payment method is required.";
  let sum = 0;
  for (const p of payments) {
    if (!PAYMENT_METHODS.includes(p.method)) return `Invalid payment method: ${p.method}`;
    const amt = Number(p.amount);
    if (!Number.isFinite(amt) || amt <= 0) return "Each payment amount must be a positive number.";
    if (p.method === "mobile" && !MOBILE_PROVIDERS.includes(p.provider)) return "Invalid mobile banking provider.";
    if (p.method === "bank" && p.bankName && !BANK_OPTIONS.includes(p.bankName)) return "Invalid bank name.";
    sum += amt;
  }
  if (Math.abs(sum - expectedTotal) > EPS) return `Payment total (${sum.toFixed(2)}) does not match expected amount (${expectedTotal.toFixed(2)}).`;
  return null;
}

router.get("/stats", async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const allInvoices = await Invoice.find().sort({ createdAt: -1 }).lean();
    const netOf = (inv) => inv.netSaleAmount ?? inv.grandTotal;

    const todayRevenue = allInvoices.filter((i) => new Date(i.createdAt) >= today).reduce((s, i) => s + netOf(i), 0);
    const weekRevenue = allInvoices.filter((i) => new Date(i.createdAt) >= weekStart).reduce((s, i) => s + netOf(i), 0);
    const monthRevenue = allInvoices.filter((i) => new Date(i.createdAt) >= monthStart).reduce((s, i) => s + netOf(i), 0);
    const totalRevenue = allInvoices.reduce((s, i) => s + netOf(i), 0);
    const totalReturnsAmount = allInvoices.reduce((s, i) => s + (i.totalReturnedAmount || 0), 0);
    const grossSales = allInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalCOGS = allInvoices.reduce((s, i) => s + (i.items || []).reduce((si, it) => si + (it.costTotal || 0), 0), 0);
    const totalProfit = +(totalRevenue - totalCOGS).toFixed(2);
    const grossProfit = +(grossSales - totalCOGS).toFixed(2);
    const todayOrders = allInvoices.filter((i) => new Date(i.createdAt) >= today).length;

    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $lte: 10 } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    const recentInvoices = allInvoices.slice(0, 10);

    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      const revenue = allInvoices.filter((inv) => new Date(inv.createdAt) >= d && new Date(inv.createdAt) < nextMonth).reduce((s, inv) => s + netOf(inv), 0);
      monthlyRevenue.push({ month: d.toLocaleDateString("en-BD", { month: "short" }), revenue });
    }

    const categoryRevenue = {};
    allInvoices.forEach((inv) => { inv.items.forEach((item) => { const key = item.company || "Other"; categoryRevenue[key] = (categoryRevenue[key] || 0) + item.total; }); });
    const topCategories = Object.entries(categoryRevenue).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    let totalCollected = 0, totalDueAmount = 0;
    let cashTotal = 0, bankTotal = 0, mobileTotal = 0;
    let bkashTotal = 0, nagadTotal = 0, rocketTotal = 0, upayTotal = 0;
    const bankByName = { "Dutch-Bangla Bank": 0, "Islami Bank Bangladesh": 0, "City Bank Limited": 0 };

    allInvoices.forEach((inv) => {
      totalCollected += inv.paidAmount || 0;
      totalDueAmount += inv.dueAmount || 0;
      (inv.payments || []).forEach((p) => {
        const amt = p.amount || 0;
        if (p.method === "cash") cashTotal += amt;
        else if (p.method === "bank") {
          bankTotal += amt;
          if (p.bankName && bankByName[p.bankName] !== undefined) bankByName[p.bankName] += amt;
        }
        else if (p.method === "mobile") {
          mobileTotal += amt;
          if (p.provider === "bKash") bkashTotal += amt;
          else if (p.provider === "Nagad") nagadTotal += amt;
          else if (p.provider === "Rocket") rocketTotal += amt;
          else if (p.provider === "Upay") upayTotal += amt;
        }
      });
    });

    res.json({
      stats: { todayRevenue, todayOrders, weekRevenue, monthRevenue, totalRevenue, totalProducts, lowStockProducts, outOfStockProducts,
        totalCollected, totalDueAmount, outstandingDue: totalDueAmount, grossSales, totalReturnsAmount, netSales: totalRevenue, totalCOGS, totalProfit, grossProfit },
      paymentMethodSummary: { cash: cashTotal, bank: bankTotal, mobileBanking: mobileTotal },
      mobileBankingBreakdown: { bKash: bkashTotal, Nagad: nagadTotal, Rocket: rocketTotal, Upay: upayTotal },
      bankBreakdown: bankByName,
      recentInvoices, monthlyRevenue, topCategories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30, paymentStatus, search } = req.query;
    const cappedLimit = Math.min(parseInt(limit) || 30, 200);
    const skip = (Math.max(1, parseInt(page)) - 1) * cappedLimit;
    const filter = {};
    if (paymentStatus === "paid" || paymentStatus === "due") filter.paymentStatus = paymentStatus;
    if (search && String(search).trim()) {
      const safe = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ "customer.name": { $regex: safe, $options: "i" } }, { "customer.phone": { $regex: safe, $options: "i" } }, { invoiceNumber: { $regex: safe, $options: "i" } }];
    }
    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(cappedLimit).lean(),
      Invoice.countDocuments(filter),
    ]);
    res.json({ invoices, pagination: { total, page: parseInt(page), limit: cappedLimit, totalPages: Math.ceil(total / cappedLimit) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid invoice id." });
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found." });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { invoiceNumber, invoiceDate, customer, items, subtotal, discount, vat, transportCost, grandTotal, priceType, paymentStatus, splitPayment, payments, paidAmount: paidAmountInput, preparedBy } = req.body;

    if (!invoiceNumber || !invoiceDate || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Invoice number, date and at least one item are required." });
    if (!Number.isFinite(Number(grandTotal)) || Number(grandTotal) <= 0) return res.status(400).json({ message: "Invalid grand total." });

    const status = paymentStatus === "due" ? "due" : "paid";
    const total = Number(grandTotal);
    let paidAmount = status === "paid" ? total : Number(paidAmountInput);
    if (!Number.isFinite(paidAmount) || paidAmount < 0) return res.status(400).json({ message: "Invalid paid amount." });
    if (paidAmount > total + EPS) return res.status(400).json({ message: "Paid amount cannot exceed the grand total." });
    const dueAmount = Math.max(0, +(total - paidAmount).toFixed(2));
    if (status === "paid" && dueAmount > EPS) return res.status(400).json({ message: "Paid invoices cannot have a due amount." });

    const isSplit = Boolean(splitPayment);
    const normalizedPayments = (payments || []).map((p) => ({
      method: p.method, amount: Number(p.amount),
      provider: p.method === "mobile" ? p.provider : null,
      bankName: p.method === "bank" ? String(p.bankName || "") : "",
      accountNumber: p.method === "bank" ? String(p.accountNumber || "").slice(0, 50) : "",
      mobileNumber: p.method === "mobile" ? String(p.mobileNumber || "").slice(0, 20) : "",
    }));
    const validationError = validatePayments(normalizedPayments, paidAmount);
    if (validationError) return res.status(400).json({ message: validationError });

    if (invoiceNumber && (await Invoice.findOne({ invoiceNumber }).lean())) return res.status(400).json({ message: "Invoice number already exists." });

    const invoice = await withTransaction(async (session) => {
      const processedItems = [];
      for (const item of items) {
        if (item.custom && !item.productId) {
          const newProduct = await createCustomProduct({ name: item.name, unitPrice: item.price, qty: item.qty, shopName: item.shopName });
          const { batchesUsed, costOfGoodsSold } = await deductStockFIFO(newProduct._id, item.qty, session);
          processedItems.push({ ...item, productId: newProduct._id, company: "Custom", unit: item.unit || "pcs", soldBatches: batchesUsed, costTotal: costOfGoodsSold });
        } else if (item.productId && !item.custom) {
          const { batchesUsed, costOfGoodsSold } = await deductStockFIFO(item.productId, item.qty, session, item.preferredSupplierId || null);
          processedItems.push({ ...item, unit: item.unit || "pcs", soldBatches: batchesUsed, costTotal: costOfGoodsSold });
        } else {
          processedItems.push({ ...item, unit: item.unit || "pcs", costTotal: 0 });
        }
      }

      const inv = new Invoice({
        invoiceNumber, invoiceDate, customer, items: processedItems,
        subtotal, discount, vat: vat || 0, transportCost: Number(transportCost) || 0, grandTotal: total, priceType,
        preparedBy: String(preparedBy || "").trim().slice(0, 100),
        paymentStatus: status, paidAmount, dueAmount, splitPayment: isSplit, payments: normalizedPayments, netSaleAmount: total,
      });
      await inv.save({ session });
      return inv;
    });

    res.status(201).json(invoice);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "Invoice number already exists." });
    res.status(400).json({ message: error.message });
  }
});

// #29/#11 — multi-method partial payment collection, in one call
router.post("/:id/collect-due", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid invoice id." });
    const { payments, amount, method, provider, bankName, accountNumber, mobileNumber, note } = req.body;
    const splits = Array.isArray(payments) && payments.length > 0 ? payments : [{ amount, method, provider, bankName, accountNumber, mobileNumber }];

    for (const p of splits) {
      const amt = Number(p.amount);
      if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Enter a valid collection amount." });
      if (!PAYMENT_METHODS.includes(p.method)) return res.status(400).json({ message: "Invalid payment method." });
      if (p.method === "mobile" && !MOBILE_PROVIDERS.includes(p.provider)) return res.status(400).json({ message: "Invalid mobile provider." });
    }
    const totalCollecting = +splits.reduce((s, p) => s + Number(p.amount), 0).toFixed(2);

    const updatedInvoice = await withTransaction(async (session) => {
      const invoice = await Invoice.findById(req.params.id).session(session);
      if (!invoice) throw new Error("Invoice not found.");
      if (invoice.paymentStatus !== "due") throw new Error("This invoice has no outstanding due.");
      if (totalCollecting > invoice.dueAmount + EPS) throw new Error(`Collection amount cannot exceed due balance (৳${invoice.dueAmount.toFixed(2)}).`);

      const nowBST = new Date(Date.now() + 6 * 60 * 60 * 1000);
      for (const p of splits) {
        const amt = +Number(p.amount).toFixed(2);
        invoice.paidAmount = +(invoice.paidAmount + amt).toFixed(2);
        invoice.dueAmount = Math.max(0, +(invoice.dueAmount - amt).toFixed(2));
        const paymentEntry = {
          method: p.method, amount: amt,
          provider: p.method === "mobile" ? p.provider : null,
          bankName: p.method === "bank" ? String(p.bankName || "") : "",
          accountNumber: p.method === "bank" ? String(p.accountNumber || "").slice(0, 50) : "",
          mobileNumber: p.method === "mobile" ? String(p.mobileNumber || "").slice(0, 20) : "",
        };
        invoice.payments.push(paymentEntry);
        invoice.collectionHistory.push({ ...paymentEntry, note: String(note || "").slice(0, 300), collectedAtBST: nowBST });
      }
      if (invoice.dueAmount <= EPS) { invoice.dueAmount = 0; invoice.paymentStatus = "paid"; }
      await invoice.save({ session });
      return invoice;
    });

    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid invoice id." });
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    for (const item of invoice.items) {
      if (item.productId) {
        const netQty = item.qty - (item.returnedQty || 0);
        if (netQty > 0) await restoreStockFIFO(item.productId, netQty, null, item.soldBatches || [], item.qty);
      }
    }
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: "Invoice deleted and stock restored" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;