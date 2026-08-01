// FILE: server/routes/return.js (FULL REPLACEMENT)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const Return = require("../models/Return");
const { restoreStockFIFO } = require("./product");

router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { invoiceId, items } = req.body;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) throw new Error("Invalid invoice id.");
    if (!Array.isArray(items) || items.length === 0) throw new Error("At least one return item is required.");

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

    await invoice.save({ session });

    const returnRecord = await Return.create(
      [{ invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, items: returnRecordItems, totalReturnAmount, returnDateBST: nowBST }],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ invoice, returnRecord: returnRecord[0] });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
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