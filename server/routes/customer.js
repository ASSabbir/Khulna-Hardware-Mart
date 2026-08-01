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
          lastOrderDate: { $max: "$createdAt" },
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