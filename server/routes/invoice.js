const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Product = require("../models/Product");

// Get Dashboard Stats
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all invoices
    const allInvoices = await Invoice.find().sort({ createdAt: -1 }).lean();

    // Calculate stats
    const todayRevenue = allInvoices
      .filter(inv => new Date(inv.createdAt) >= today)
      .reduce((sum, inv) => sum + inv.grandTotal, 0);

    const weekRevenue = allInvoices
      .filter(inv => new Date(inv.createdAt) >= weekStart)
      .reduce((sum, inv) => sum + inv.grandTotal, 0);

    const monthRevenue = allInvoices
      .filter(inv => new Date(inv.createdAt) >= monthStart)
      .reduce((sum, inv) => sum + inv.grandTotal, 0);

    const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // Today's orders count
    const todayOrders = allInvoices.filter(inv => new Date(inv.createdAt) >= today).length;

    // Product stats
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ $expr: { $lte: ["$stock", "$reorderLevel"] } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Recent invoices (last 10)
    const recentInvoices = allInvoices.slice(0, 10);

    // Monthly revenue for chart (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      const revenue = allInvoices
        .filter(inv => {
          const invDate = new Date(inv.createdAt);
          return invDate >= d && invDate < nextMonth;
        })
        .reduce((sum, inv) => sum + inv.grandTotal, 0);
      monthlyRevenue.push({
        month: d.toLocaleDateString("en-BD", { month: "short" }),
        revenue: revenue
      });
    }

    // Revenue by category
    const categoryRevenue = {};
    allInvoices.forEach(inv => {
      inv.items.forEach(item => {
        // Since we don't have category in items, we'll use brand as proxy
        const key = item.company || "Other";
        categoryRevenue[key] = (categoryRevenue[key] || 0) + item.total;
      });
    });

    const topCategories = Object.entries(categoryRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      stats: {
        todayRevenue,
        todayOrders,
        weekRevenue,
        monthRevenue,
        totalRevenue,
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
      },
      recentInvoices,
      monthlyRevenue,
      topCategories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Invoices
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Invoice.countDocuments(),
    ]);

    res.json({
      invoices,
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

// Get Single Invoice
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Invoice & Update Stock
router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceNumber, invoiceDate, customer, items, subtotal, discount, grandTotal, priceType } = req.body;

    // Process each item and update stock
    for (const item of items) {
      if (item.productId && !item.custom) {
        const product = await Product.findById(item.productId).session(session);
        if (product) {
          const newStock = product.stock - item.qty;
          if (newStock < 0) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.qty}`);
          }
          product.stock = newStock;
          await product.save({ session });
        }
      }
    }

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      invoiceDate,
      customer,
      items,
      subtotal,
      discount,
      grandTotal,
      priceType,
    });
    await invoice.save({ session });

    await session.commitTransaction();
    res.status(201).json(invoice);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Delete Invoice (optional - restores stock if needed)
router.delete("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Restore stock for each item
    for (const item of invoice.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.qty },
        });
      }
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: "Invoice deleted and stock restored" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;