const express = require("express");
const router = express.Router();
const Partner = require("../models/Partner");

// Get All Partners
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30, search = "", status = "all" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "all") {
      filter.status = status;
    }

    const [partners, total] = await Promise.all([
      Partner.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Partner.countDocuments(filter),
    ]);

    res.json({
      partners,
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

// Create Partner
router.post("/", async (req, res) => {
  try {
    const partner = await Partner.create(req.body);
    res.status(201).json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Partner
router.put("/:id", async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Partner
router.delete("/:id", async (req, res) => {
  try {
    await Partner.findByIdAndDelete(req.params.id);
    res.json({ message: "Partner deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;