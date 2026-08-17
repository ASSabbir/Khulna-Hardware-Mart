// FILE: server/routes/shopNames.js (NEW)
const express = require("express");
const router = express.Router();
const CustomProductSource = require("../models/CustomProductSource");
const ShopSale = require("../models/ShopSale");

router.get("/", async (req, res) => {
  try {
    const { search = "" } = req.query;
    const [fromCustom, fromSales] = await Promise.all([
      CustomProductSource.distinct("shopName"),
      ShopSale.distinct("shopName"),
    ]);
    let names = [...new Set([...fromCustom, ...fromSales].filter(Boolean))];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      names = names.filter((n) => n.toLowerCase().includes(q));
    }
    res.json({ shopNames: names.sort() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;