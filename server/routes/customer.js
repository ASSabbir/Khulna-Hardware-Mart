const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");

// Get All Customers (from database + invoices aggregated)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30, search = "", status = "all" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // First get customers from database
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
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Customer
router.delete("/:id", async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
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
    const totalPaid = customers.filter(c => c.totalDue === 0).length;
    const totalWithDue = customers.filter(c => c.totalDue > 0).length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalDue = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);

    res.json({
      totalCustomers,
      totalPaid,
      totalWithDue,
      totalRevenue,
      totalDue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;