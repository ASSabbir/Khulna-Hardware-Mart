// FILE: server/routes/return.js (FULL REPLACEMENT) — proportional VAT/discount handling + guaranteed non-negative netSaleAmount
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

      const nowBST = Return.nowBST();

      // Pass 1: validate quantities and compute RAW (unscaled) return amount per line,
      // update returnedQty on invoice items and restore stock.
      const rawLines = [];
      let rawTotal = 0;
      const usedIndexes = new Set();
      for (const reqItem of items) {
        const qty = Number(reqItem.returnedQty);
        if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Invalid return quantity for ${reqItem.name}.`);

        // Prefer the exact line index from the client — this is required whenever two lines
        // share the same product name/id (same product bought from two different suppliers
        // in one sale). Falling back to name/productId match only for old callers that don't
        // send lineIndex yet.
        let invoiceItem = null;
        if (Number.isInteger(reqItem.lineIndex) && invoice.items[reqItem.lineIndex] && !usedIndexes.has(reqItem.lineIndex)) {
          invoiceItem = invoice.items[reqItem.lineIndex];
          usedIndexes.add(reqItem.lineIndex);
        } else {
          invoiceItem = invoice.items.find(
            (it, idx) => !usedIndexes.has(idx) && ((reqItem.productId && String(it.productId) === String(reqItem.productId)) || it.name === reqItem.name)
          );
          if (invoiceItem) usedIndexes.add(invoice.items.indexOf(invoiceItem));
        }
        if (!invoiceItem) throw new Error(`Item "${reqItem.name}" not found on this invoice.`);

        const alreadyReturned = invoiceItem.returnedQty || 0;
        const availableToReturn = invoiceItem.qty - alreadyReturned;
        if (qty > availableToReturn) {
          throw new Error(`Cannot return ${qty} of "${invoiceItem.name}" — only ${availableToReturn} available to return.`);
        }

        const unitPrice = invoiceItem.price;
        const rawAmount = +(unitPrice * qty).toFixed(2);
        rawTotal += rawAmount;

        invoiceItem.returnedQty = alreadyReturned + qty;

        rawLines.push({
          productId: invoiceItem.productId || null,
          name: invoiceItem.name,
          returnedQty: qty,
          rawAmount,
          reason: String(reqItem.reason || "").slice(0, 300),
        });

        if (invoiceItem.productId) {
          await restoreStockFIFO(invoiceItem.productId, qty, session, invoiceItem.soldBatches || [], invoiceItem.qty);
        }
      }
      rawTotal = +rawTotal.toFixed(2);

      // Is the ENTIRE invoice now fully returned across every line (this batch + any earlier ones)?
      const allItemsFullyReturned = invoice.items.every((it) => (it.returnedQty || 0) >= it.qty);

      // Determine the scaling factor so the customer's refund correctly reflects discount/VAT already
      // baked into the invoice, without ever exceeding what's actually left of the grand total.
      let scaledTotal;
      if (allItemsFullyReturned) {
        // Full-invoice return (this call finishes it off): refund exactly whatever of the
        // grand total hasn't already been refunded, regardless of rounding on individual lines.
        scaledTotal = +(invoice.grandTotal - (invoice.totalReturnedAmount || 0)).toFixed(2);
      } else {
        // Partial return: scale by (subtotal - discount + vat) / subtotal so returns carry their
        // fair share of any invoice-level discount/VAT. Transport cost is a flat delivery fee and
        // is intentionally NOT refunded on a partial return.
        const netOfDiscountVat = invoice.subtotal - (invoice.discount || 0) + (invoice.vat || 0);
        const ratio = invoice.subtotal > 0 ? netOfDiscountVat / invoice.subtotal : 1;
        scaledTotal = +(rawTotal * ratio).toFixed(2);
      }
      scaledTotal = Math.max(0, scaledTotal);

      // Distribute scaledTotal across the lines proportionally to their raw share, fixing any
      // rounding drift onto the last line so the parts always sum exactly to scaledTotal.
      const returnRecordItems = [];
      let allocated = 0;
      rawLines.forEach((line, idx) => {
        const isLast = idx === rawLines.length - 1;
        let lineAmount;
        if (isLast) {
          lineAmount = +(scaledTotal - allocated).toFixed(2);
        } else {
          const share = rawTotal > 0 ? line.rawAmount / rawTotal : 0;
          lineAmount = +(scaledTotal * share).toFixed(2);
        }
        lineAmount = Math.max(0, lineAmount);
        allocated = +(allocated + lineAmount).toFixed(2);

        invoice.returnedItems.push({
          productId: line.productId,
          name: line.name,
          returnedQty: line.returnedQty,
          returnAmount: lineAmount,
          returnDateBST: nowBST,
          reason: line.reason,
        });
        returnRecordItems.push({
          productId: line.productId,
          name: line.name,
          originalQty: invoice.items.find((it) => it.name === line.name)?.qty || line.returnedQty,
          returnedQty: line.returnedQty,
          unitPrice: rawTotal > 0 ? +(line.rawAmount / line.returnedQty).toFixed(2) : 0,
          returnAmount: lineAmount,
          reason: line.reason,
        });
      });

      const totalReturnAmount = scaledTotal;
      invoice.totalReturnedAmount = Math.max(0, +((invoice.totalReturnedAmount || 0) + totalReturnAmount).toFixed(2));
      invoice.netSaleAmount = Math.max(0, +(invoice.grandTotal - invoice.totalReturnedAmount).toFixed(2));

      // Auto best-logic split: waive as much as possible against outstanding due first, the rest
      // must be physically refunded to the customer via the chosen method(s).
      const autoDueAdjustment = Math.min(totalReturnAmount, invoice.dueAmount || 0);
      const requiredRefund = Math.max(0, +(totalReturnAmount - autoDueAdjustment).toFixed(2));

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

      // Record a due-balance snapshot on each returned line so the invoice print can show a
      // running due balance in chronological order alongside due-collection events.
      const dueAfterThisReturn = invoice.dueAmount;
      invoice.returnedItems.slice(-returnRecordItems.length).forEach((it) => { it.dueAfter = dueAfterThisReturn; });

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