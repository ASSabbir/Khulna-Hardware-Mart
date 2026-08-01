// FILE: server/routes/supplier.js (FULL REPLACEMENT)
const express = require("express");
const router = express.Router();
const Supplier = require("../models/Supplier");

// Get All Suppliers
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30, search = "", status = "all", category = "all" } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const filter = {};
    if (search && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { companyName: { $regex: safe, $options: "i" } },
        { name: { $regex: safe, $options: "i" } }, // legacy field fallback
        { contactPerson: { $regex: safe, $options: "i" } },
      ];
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (category && category !== "all") {
      filter.$or = (filter.$or || []).concat([
        { category },
        { speciality: { $in: [category] } }, // legacy field fallback
      ]);
    }

    const [suppliersRaw, total] = await Promise.all([
      Supplier.find(filter).sort({ companyName: 1, name: 1 }).skip(skip).limit(parseInt(limit)).lean(),
      Supplier.countDocuments(filter),
    ]);

    // Guarantee every supplier has a displayable companyName, even for legacy
    // records that only ever had `name` (avoids blank entries in dropdowns/cards).
    const suppliers = suppliersRaw.map((s) => ({
      ...s,
      companyName: s.companyName || s.name || "Unnamed Supplier",
    }));

    res.json({
      suppliers,
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

// Create Supplier
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const companyName = String(body.companyName || body.name || "").trim();

    if (!companyName) {
      return res.status(400).json({ message: "Company name is required." });
    }
    if (!String(body.contactPerson || "").trim()) {
      return res.status(400).json({ message: "Contact person is required." });
    }
    if (!String(body.phone || "").trim()) {
      return res.status(400).json({ message: "Phone number is required." });
    }

     const normalized = companyName.replace(/\s+/g, " ").trim();
    const safe = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Supplier.findOne({
      companyName: { $regex: `^${safe}$`, $options: "i" },
    }).lean();
    if (existing) {
      console.log("[supplier dup-check] blocked:", { attempted: companyName, matchedId: existing._id, matchedName: existing.companyName });
      return res.status(400).json({ message: `A supplier named "${companyName}" already exists.` });
    }

     const supplier = await Supplier.create({ ...body, companyName: normalized });
    res.status(201).json(supplier);
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0]?.message || "Invalid supplier data.";
      return res.status(400).json({ message: firstError });
    }
    if (error.code === 11000) {
      console.log("[supplier dup-check] E11000:", error.keyPattern, error.keyValue);
      return res.status(400).json({ message: `Duplicate key on field: ${Object.keys(error.keyPattern || {}).join(", ")}` });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update Supplier
router.put("/:id", async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.companyName) body.name = body.companyName; // keep legacy field in sync
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ message: "Supplier not found." });
    res.json(supplier);
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0]?.message || "Invalid supplier data.";
      return res.status(400).json({ message: firstError });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete Supplier
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Supplier.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Supplier not found." });
    res.json({ message: "Supplier deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;