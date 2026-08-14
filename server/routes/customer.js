// FILE: server/routes/customer.js (FULL REPLACEMENT)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");

// Get All Customers
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const dbFilter = {};
    if (search) {
      dbFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const [dbCustomers, total] = await Promise.all([
      Customer.find(dbFilter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Customer.countDocuments(dbFilter),
    ]);

    res.json({
      customers: dbCustomers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Paid customers — aggregated from fully-paid invoices, enriched with the Customer record
router.get("/paid", async (req, res) => {
  try {
    const { search = "" } = req.query;
    const match = { paymentStatus: "paid", dueAmount: { $lte: 0 } };
    if (search.trim()) {
      match["customer.name"] = { $regex: search.trim(), $options: "i" };
    }

    const rows = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $toLower: "$customer.name" },
          name: { $first: "$customer.name" },
          phone: { $first: "$customer.phone" },
          address: { $first: "$customer.address" },
          invoiceCount: { $sum: 1 },
          totalPaid: { $sum: "$paidAmount" },
          lastOrderDate: { $max: "$updatedAt" },
        },
      },
      { $sort: { lastOrderDate: -1 } },
    ]);

    // Enrich each row with the matching Customer document (email, customerType, id, joinedAt)
    const enriched = await Promise.all(
      rows.map(async (r) => {
        const cust = await Customer.findOne({ name: { $regex: `^${r.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }).lean();
        return {
          ...r,
          customerId: cust?._id || null,
          email: cust?.email || "",
          customerType: cust?.customerType || 1,
          joinedAt: cust?.createdAt || null,
          status: cust?.status || "active",
        };
      })
    );

    res.json({ customers: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Due customers — aggregated from invoices with an outstanding balance, enriched with the Customer record
router.get("/due", async (req, res) => {
  try {
    const { search = "" } = req.query;
    const match = { paymentStatus: "due", dueAmount: { $gt: 0 } };
    if (search.trim()) {
      match["customer.name"] = { $regex: search.trim(), $options: "i" };
    }

    const rows = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $toLower: "$customer.name" },
          name: { $first: "$customer.name" },
          phone: { $first: "$customer.phone" },
          address: { $first: "$customer.address" },
          invoiceCount: { $sum: 1 },
          totalDue: { $sum: "$dueAmount" },
          totalSpent: { $sum: "$paidAmount" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $sort: { totalDue: -1 } },
    ]);

    const enriched = await Promise.all(
      rows.map(async (r) => {
        const cust = await Customer.findOne({ name: { $regex: `^${r.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }).lean();
        return {
          ...r,
          customerId: cust?._id || null,
          email: cust?.email || "",
          customerType: cust?.customerType || 1,
          joinedAt: cust?.createdAt || null,
          status: cust?.status || "active",
        };
      })
    );

    res.json({ customers: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// #11 — Collect a partial/full due payment for a customer, applied against their oldest due invoices (FIFO)
const { withTransaction } = require("../utils/withTransaction");

router.post("/:id/collect-due", async (req, res) => {
  try {
    const Invoice = require("../models/Invoice");
    const Ledger = require("../models/Ledger");
    const { amount, method, provider, bankName, accountNumber, mobileNumber, note, invoiceIds, splits } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new Error("Invalid customer id.");

    const customerDoc = await Customer.findById(req.params.id).lean();
    if (!customerDoc) throw new Error("Customer not found.");

    // Support a single method/amount payload AND a multi-method split payload (from PaymentSplitEditor).
    const paymentSplits = Array.isArray(splits) && splits.length > 0
      ? splits.filter((p) => Number(p.amount) > 0).map((p) => ({
          method: p.method, amount: Number(p.amount),
          provider: p.method === "mobile" ? p.provider : null,
          bankName: p.method === "bank" ? String(p.bankName || "") : "",
          accountNumber: p.method === "bank" ? String(p.accountNumber || "") : "",
          mobileNumber: p.method === "mobile" ? String(p.mobileNumber || "") : "",
        }))
      : (Number(amount) > 0 ? [{ method: method || "cash", amount: Number(amount), provider: method === "mobile" ? provider : null, bankName: method === "bank" ? bankName : "", accountNumber: accountNumber || "", mobileNumber: mobileNumber || "" }] : []);

    const totalAmt = +paymentSplits.reduce((s, p) => s + p.amount, 0).toFixed(2);
    if (totalAmt <= 0) throw new Error("Enter a valid payment amount.");

    let candidateInvoices = await Invoice.find({ "customer.name": customerDoc.name, paymentStatus: "due" }).sort({ createdAt: 1 });
    if (Array.isArray(invoiceIds) && invoiceIds.length > 0) {
      const validIds = new Set(invoiceIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map(String));
      candidateInvoices = candidateInvoices.filter((inv) => validIds.has(String(inv._id)));
    }
    const availableDue = +candidateInvoices.reduce((s, inv) => s + (inv.dueAmount || 0), 0).toFixed(2);
    if (totalAmt > availableDue + 0.01) {
      throw new Error(`Payment cannot exceed the selected due amount (৳${availableDue.toFixed(2)}).`);
    }

    const result = await withTransaction(async (session) => {
      const nowBST = new Date(Date.now() + 6 * 60 * 60 * 1000);
      let remaining = totalAmt;
      const touchedInvoices = [];

      // Case 1: single invoice selected/only-one-due → all of it goes there.
      // Case 2: multiple invoices selected → applied in the order given.
      // Case 3: nothing selected, multiple due invoices → oldest-first (FIFO), auto-clearing
      // one invoice fully before spilling into the next — exactly the 500/800/100 example.
      for (const inv of candidateInvoices) {
        if (remaining <= 0.009) break;
        const invDoc = await Invoice.findById(inv._id).session(session);
        if (!invDoc || invDoc.dueAmount <= 0) continue;

        const applyToThisInvoice = Math.min(remaining, invDoc.dueAmount);
        remaining = +(remaining - applyToThisInvoice).toFixed(2);

        let invRemaining = applyToThisInvoice;
        for (const p of paymentSplits) {
          if (invRemaining <= 0.009) break;
          const share = totalAmt > 0 ? +(p.amount * (applyToThisInvoice / totalAmt)).toFixed(2) : 0;
          const amt = Math.min(share, invRemaining);
          if (amt <= 0.009) continue;
          invRemaining = +(invRemaining - amt).toFixed(2);

          invDoc.paidAmount = +(invDoc.paidAmount + amt).toFixed(2);
          invDoc.dueAmount = Math.max(0, +(invDoc.dueAmount - amt).toFixed(2));
          const paymentEntry = { method: p.method, amount: amt, provider: p.provider, bankName: p.bankName, accountNumber: p.accountNumber, mobileNumber: p.mobileNumber };
          invDoc.payments.push(paymentEntry);
          invDoc.collectionHistory.push({ ...paymentEntry, note: String(note || "").slice(0, 300), collectedAtBST: nowBST, dueAfter: invDoc.dueAmount });
        }
        if (invRemaining > 0.009 && paymentSplits.length > 0) {
          const last = paymentSplits[paymentSplits.length - 1];
          invDoc.paidAmount = +(invDoc.paidAmount + invRemaining).toFixed(2);
          invDoc.dueAmount = Math.max(0, +(invDoc.dueAmount - invRemaining).toFixed(2));
          invDoc.payments.push({ method: last.method, amount: invRemaining, provider: last.provider, bankName: last.bankName });
          invDoc.collectionHistory.push({ method: last.method, amount: invRemaining, provider: last.provider, bankName: last.bankName, note: String(note || "").slice(0, 300), collectedAtBST: nowBST, dueAfter: invDoc.dueAmount });
        }

        if (invDoc.dueAmount <= 0.01) { invDoc.dueAmount = 0; invDoc.paymentStatus = "paid"; }
        await invDoc.save({ session });
        touchedInvoices.push(invDoc);
      }

      const customer = await Customer.findById(req.params.id).session(session);
      customer.totalDue = Math.max(0, +((customer.totalDue || 0) - totalAmt).toFixed(2));
      await customer.save({ session });

      for (const p of paymentSplits) {
        await Ledger.create([{
          type: "income", category: "Due Collection", amount: p.amount,
          description: `Due collected — ${customerDoc.name}`, date: new Date().toISOString().slice(0, 10),
          method: p.method, provider: p.provider, bankName: p.bankName, addedBy: "System",
        }], { session });
      }

      return { customer, touchedInvoiceIds: touchedInvoices.map((i) => i._id) };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create Customer
router.post("/", async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Customer
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer id." });
    }
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Customer
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer id." });
    }
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Customer not found." });
    res.json({ message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer stats
router.get("/stats", async (req, res) => {
  try {
    const customers = await Customer.find().lean();
    const totalCustomers = customers.length;
    const totalPaid = customers.filter((c) => (c.totalDue || 0) === 0).length;
    const totalWithDue = customers.filter((c) => (c.totalDue || 0) > 0).length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalDue = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);

    res.json({ totalCustomers, totalPaid, totalWithDue, totalRevenue, totalDue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/history", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer id." });
    }
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return res.status(404).json({ message: "Customer not found." });

    const invoices = await Invoice.find({ "customer.name": customer.name }).sort({ createdAt: -1 }).lean();
    res.json({ customer, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;