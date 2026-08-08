// FILE: server/routes/customProductSource.js (NEW) — #23
const express = require("express");
const router = express.Router();
const CustomProductSource = require("../models/CustomProductSource");

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      CustomProductSource.find().sort({ date: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      CustomProductSource.countDocuments(),
    ]);
    res.json({ records, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;