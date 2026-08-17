// FILE: server/routes/shopAccount.js (NEW) — day-wise shop-source (custom product) history + due/payment
const express = require("express");
const router = express.Router();
const CustomProductSource = require("../models/CustomProductSource");
const ShopAccountEntry = require("../models/ShopAccountEntry");

const toDateOnly = (d) => new Date(d).toISOString().slice(0, 10);

async function computeShopBalance(shopName) {
  const [purchases, entries] = await Promise.all([
    CustomProductSource.find({ shopName }).lean(),
    ShopAccountEntry.find({ shopName }).lean(),
  ]);
  const totalPurchase = purchases.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const manualDue = entries.filter((e) => e.type === "due").reduce((s, e) => s + e.amount, 0);
  const totalPaid = entries.filter((e) => e.type === "payment").reduce((s, e) => s + e.amount, 0);
  const totalOwed = totalPurchase + manualDue;
  const balance = +(totalOwed - totalPaid).toFixed(2);
  return { totalPurchase: +totalPurchase.toFixed(2), manualDue: +manualDue.toFixed(2), totalPaid: +totalPaid.toFixed(2), due: Math.max(0, balance) };
}

router.get("/summary", async (req, res) => {
  try {
    const shopNames = await CustomProductSource.distinct("shopName");
    const results = await Promise.all(shopNames.map(async (name) => ({ shopName: name, ...(await computeShopBalance(name)) })));
    res.json({ shops: results.sort((a, b) => b.due - a.due) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Day-wise history for one shop
router.get("/detail", async (req, res) => {
  try {
    const { shopName } = req.query;
    if (!shopName || !shopName.trim()) return res.status(400).json({ message: "shopName is required." });
    const name = shopName.trim();

    const [purchases, entries, balance] = await Promise.all([
      CustomProductSource.find({ shopName: name }).sort({ date: -1 }).lean(),
      ShopAccountEntry.find({ shopName: name }).sort({ date: -1, createdAt: -1 }).lean(),
      computeShopBalance(name),
    ]);

    const byDate = {};
    purchases.forEach((p) => {
      const key = toDateOnly(p.date);
      if (!byDate[key]) byDate[key] = { date: key, items: [], totalAmount: 0 };
      byDate[key].items.push({ productName: p.productName, quantity: p.quantity, unitPrice: p.unitPrice, totalAmount: p.totalAmount });
      byDate[key].totalAmount += p.totalAmount;
    });
    const dailyPurchases = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));

    res.json({ shopName: name, dailyPurchases, entries, balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/due", async (req, res) => {
  try {
    const { shopName, amount, date, note } = req.body;
    if (!shopName || !String(shopName).trim()) return res.status(400).json({ message: "Shop name required." });
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Enter a valid amount." });
    await ShopAccountEntry.create({ shopName: String(shopName).trim(), type: "due", amount: amt, date: date || new Date().toISOString().slice(0, 10), note: String(note || "").slice(0, 300) });
    const balance = await computeShopBalance(String(shopName).trim());
    res.status(201).json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/payment", async (req, res) => {
  try {
    const { shopName, amount, method, provider, bankName, date, note } = req.body;
    if (!shopName || !String(shopName).trim()) return res.status(400).json({ message: "Shop name required." });
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Enter a valid amount." });
    await ShopAccountEntry.create({
      shopName: String(shopName).trim(), type: "payment", amount: amt,
      method: method || "cash", provider: method === "mobile" ? provider : null, bankName: method === "bank" ? bankName : "",
      date: date || new Date().toISOString().slice(0, 10), note: String(note || "").slice(0, 300),
    });

    const Ledger = require("../models/Ledger");
    await Ledger.create({
      type: "expense", category: "Purchase", amount: amt,
      description: `Shop payment — ${String(shopName).trim()}`,
      date: date || new Date().toISOString().slice(0, 10), method: method || "cash",
      provider: method === "mobile" ? provider : null, bankName: method === "bank" ? String(bankName || "") : "", addedBy: "System",
    });

    const balance = await computeShopBalance(String(shopName).trim());
    res.status(201).json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;