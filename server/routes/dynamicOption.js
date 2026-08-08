// FILE: server/routes/dynamicOption.js (NEW)
const express = require("express");
const router = express.Router();
const DynamicOption = require("../models/DynamicOption");

const ALLOWED_TYPES = ["productCategory", "unit", "accountCategory"];

router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    if (!ALLOWED_TYPES.includes(type)) return res.status(400).json({ message: "Invalid option type." });
    const options = await DynamicOption.find({ type }).sort({ value: 1 }).lean();
    res.json({ options: options.map((o) => o.value) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { value } = req.body;
    if (!ALLOWED_TYPES.includes(type)) return res.status(400).json({ message: "Invalid option type." });
    const trimmed = String(value || "").trim();
    if (!trimmed) return res.status(400).json({ message: "Value is required." });
    if (trimmed.length > 100) return res.status(400).json({ message: "Value too long." });

    const safe = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await DynamicOption.findOne({ type, value: { $regex: `^${safe}$`, $options: "i" } });
    if (existing) return res.json({ value: existing.value, created: false });

    const created = await DynamicOption.create({ type, value: trimmed });
    res.status(201).json({ value: created.value, created: true });
  } catch (error) {
    if (error.code === 11000) return res.status(200).json({ value: req.body.value, created: false });
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;