// FILE: server/routes/return.js (FULL REPLACEMENT)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const Return = require("../models/Return");
const Customer = require("../models/Customer");
const Ledger = require("../models/Ledger");
const { restoreStockFIFO } = require("./product");

const { withTransaction } = require("../utils/withTransaction");
const EPS_RETURN = 0.01;

router.post("/", async (req, res) => {
  try {
    const { invoiceId, items, refundPayments } = req.body;
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) throw new Error("Invalid invoice id.");
    if (!Array.isArray(items) || items.length === 0) throw new Error("At least one return item is required.");

    const normalizedRefunds = Array.isArray(refundPayments)
      ? refundPayments.filter((p) => Number(p.amount) > 0).map((p) => ({
          method: ["cash", "mobile", "bank"].includes(p.method) ? p.method : "cash",
          provider: p.method === "mobile" ? p.provider : null,
          bankName: p.method === "bank" ? String(p.bankName || "") : "",
          amount: Number(p.amount),
        }))
      : [];

    const result = await withTransaction(async (session) => {
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) throw new Error("Invoice not found.");

    const returnRecordItems = [];
    let totalReturnAmount = 0;
    const nowBST = Return.nowBST();

    for (const reqItem of items) {
      const qty = Number(reqItem.returnedQty);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Invalid return quantity for ${reqItem.name}.`);

      const invoiceItem = invoice.items.find(
        (it) => (reqItem.productId && String(it.productId) === String(reqItem.productId)) || it.name === reqItem.name
      );
      if (!invoiceItem) throw new Error(`Item "${reqItem.name}" not found on this invoice.`);

      const alreadyReturned = invoiceItem.returnedQty || 0;
      const availableToReturn = invoiceItem.qty - alreadyReturned;
      if (qty > availableToReturn) {
        throw new Error(`Cannot return ${qty} of "${invoiceItem.name}" — only ${availableToReturn} available to return.`);
      }

      const unitPrice = invoiceItem.price;
      const returnAmount = +(unitPrice * qty).toFixed(2);
      totalReturnAmount += returnAmount;

      invoiceItem.returnedQty = alreadyReturned + qty;

      invoice.returnedItems.push({
        productId: invoiceItem.productId || null,
        name: invoiceItem.name,
        returnedQty: qty,
        returnAmount,
        returnDateBST: nowBST,
        reason: String(reqItem.reason || "").slice(0, 300),
      });

      returnRecordItems.push({
        productId: invoiceItem.productId || null,
        name: invoiceItem.name,
        originalQty: invoiceItem.qty,
        returnedQty: qty,
        unitPrice,
        returnAmount,
        reason: String(reqItem.reason || "").slice(0, 300),
      });

      if (invoiceItem.productId) {
        await restoreStockFIFO(invoiceItem.productId, qty, session, invoiceItem.soldBatches || [], invoiceItem.qty);
      }
    }

    totalReturnAmount = +totalReturnAmount.toFixed(2);
    invoice.totalReturnedAmount = +((invoice.totalReturnedAmount || 0) + totalReturnAmount).toFixed(2);
    invoice.netSaleAmount = +(invoice.grandTotal - invoice.totalReturnedAmount).toFixed(2);

    // Auto best-logic split: first waive as much of the return value as possible
    // against any outstanding due on this invoice, then whatever's left over must
    // be physically refunded to the customer via the chosen method(s).
    const autoDueAdjustment = Math.min(totalReturnAmount, invoice.dueAmount || 0);
    const requiredRefund = +(totalReturnAmount - autoDueAdjustment).toFixed(2);

    const refundSum = +normalizedRefunds.reduce((s, p) => s + p.amount, 0).toFixed(2);
    if (Math.abs(refundSum - requiredRefund) > EPS_RETURN) {
      throw new Error(`Refund payments (৳${refundSum}) must total ৳${requiredRefund} — the returned amount not already covered by due.`);
    }

    if (autoDueAdjustment > 0) {
      invoice.dueAmount = Math.max(0, +((invoice.dueAmount || 0) - autoDueAdjustment).toFixed(2));
      if (invoice.dueAmount <= EPS_RETURN) {
        invoice.dueAmount = 0;
        invoice.paymentStatus = "paid";
      }
    }

    await invoice.save({ session });

    const today = new Date().toISOString().slice(0, 10);
    for (const p of normalizedRefunds) {
      await Ledger.create([{
        type: "expense", category: "Return", amount: p.amount,
        description: `Refund — ${invoice.invoiceNumber}`, date: today,
        method: p.method, provider: p.provider, bankName: p.bankName, addedBy: "System",
      }], { session });
    }

    if (autoDueAdjustment > 0 && invoice.customer?.name) {
      const customer = await Customer.findOne({ name: invoice.customer.name }).session(session);
      if (customer) {
        customer.totalDue = Math.max(0, +((customer.totalDue || 0) - autoDueAdjustment).toFixed(2));
        await customer.save({ session });
      }
    }

    const returnRecord = await Return.create(
      [{ invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, items: returnRecordItems, totalReturnAmount, returnDateBST: nowBST, refundPayments: normalizedRefunds, dueAdjustment: autoDueAdjustment }],
      { session }
    );
      return { invoice, returnRecord: returnRecord[0] };
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { invoiceId, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (invoiceId) {
      if (!mongoose.Types.ObjectId.isValid(invoiceId)) return res.status(400).json({ message: "Invalid invoiceId." });
      filter.invoiceId = invoiceId;
    }
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Return.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Return.countDocuments(filter),
    ]);
    res.json({ records, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;