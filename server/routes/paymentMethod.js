// FILE: server/routes/paymentMethod.js (NEW)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PaymentMethodOption = require("../models/PaymentMethodOption");

router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type === "mobile" || type === "bank") filter.type = type;
    const options = await PaymentMethodOption.find(filter).sort({ name: 1 }).lean();
    res.json({ options });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { type, name, accountNumber } = req.body;
    if (!["mobile", "bank"].includes(type)) return res.status(400).json({ message: "Invalid type." });
    const trimmed = String(name || "").trim();
    if (!trimmed) return res.status(400).json({ message: "Name is required." });
    const created = await PaymentMethodOption.create({ type, name: trimmed, accountNumber: String(accountNumber || "").trim() });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "This option already exists." });
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid id." });
    await PaymentMethodOption.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;