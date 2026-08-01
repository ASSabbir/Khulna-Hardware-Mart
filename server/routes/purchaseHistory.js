// FILE: server/routes/purchaseHistory.js (NEW)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PurchaseHistory = require("../models/PurchaseHistory");

// GET /api/purchase-history?productId=&supplierId=&from=&to=&page=&limit=
router.get("/", async (req, res) => {
  try {
   const { productId, productName, supplierId, from, to, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ message: "Invalid productId." });
      filter.productId = productId;
    }
    if (!productId && productName && String(productName).trim()) {
      filter.productName = { $regex: String(productName).trim(), $options: "i" };
    }
    if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) return res.status(400).json({ message: "Invalid supplierId." });
      filter.supplierId = supplierId;
    }
    if (from || to) {
      filter.purchaseDate = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate)) return res.status(400).json({ message: "Invalid 'from' date." });
        filter.purchaseDate.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate)) return res.status(400).json({ message: "Invalid 'to' date." });
        toDate.setHours(23, 59, 59, 999);
        filter.purchaseDate.$lte = toDate;
      }
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      PurchaseHistory.find(filter).sort({ purchaseDate: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      PurchaseHistory.countDocuments(filter),
    ]);

    res.json({
      records,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;