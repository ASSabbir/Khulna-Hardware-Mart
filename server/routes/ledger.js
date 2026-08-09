// FILE: server/routes/ledger.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Ledger = require("../models/Ledger");
const Invoice = require("../models/Invoice");
const Return = require("../models/Return");

const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const BANK_OPTIONS = ["Dutch-Bangla Bank", "Islami Bank Bangladesh", "City Bank Limited"];
const EPS_LEDGER = 0.01;

const CATEGORIES = {
  income: ["Sales", "Due Collection", "Investment", "Loan", "Bank Interest", "Refund Received", "Other"],
  expense: ["Withdraw", "Purchase", "Salary", "Rent", "Utilities", "Transport", "Marketing", "Maintenance", "Tax", "Loan Repayment", "Other"],
};

function toClientShape(doc) {
  return {
    id: doc._id,
    datetime: doc.createdAt,
    date: doc.date,
    type: doc.type,
    category: doc.category,
    amount: doc.amount,
    method: doc.method,
    provider: doc.provider || null,
    bankName: doc.bankName || "",
    description: doc.description,
    addedBy: doc.addedBy,
  };
}

function computeMobileBreakdown(transactions) {
  const out = { bKash: 0, Nagad: 0, Rocket: 0, Upay: 0 };
  transactions.forEach((t) => {
    if (t.method === "mobile" && out[t.provider] !== undefined) {
      out[t.provider] += t.type === "income" ? t.amount : -t.amount;
    }
  });
  Object.keys(out).forEach((k) => (out[k] = +out[k].toFixed(2)));
  return out;
}

function computeBankBreakdown(transactions) {
  const out = { "Dutch-Bangla Bank": 0, "Islami Bank Bangladesh": 0, "City Bank Limited": 0 };
  transactions.forEach((t) => {
    if (t.method === "bank" && t.bankName && out[t.bankName] !== undefined) {
      out[t.bankName] += t.type === "income" ? t.amount : -t.amount;
    }
  });
  Object.keys(out).forEach((k) => (out[k] = +out[k].toFixed(2)));
  return out;
}

const toDateOnly = (d) => new Date(d).toISOString().slice(0, 10);

async function buildDerivedTransactions() {
  const [invoices, returns] = await Promise.all([
    Invoice.find().select("invoiceNumber customer.name paidAmount payments collectionHistory createdAt").lean(),
    Return.find().select("invoiceNumber totalReturnAmount returnDateBST createdAt").lean(),
  ]);

  const txns = [];

  invoices.forEach((inv) => {
    (inv.payments || []).forEach((p, i) => {
      if ((p.amount || 0) <= 0) return;
      txns.push({
        id: `sale-${inv._id}-${i}`,
        type: "income",
        category: "Sales",
        amount: p.amount,
        description: `Invoice ${inv.invoiceNumber} — ${inv.customer?.name || "Customer"}`,
        date: toDateOnly(inv.createdAt),
        datetime: inv.createdAt,
        method: p.method,
        provider: p.provider || null,
        addedBy: "System",
        source: "sale",
      });
    });
    (inv.collectionHistory || []).forEach((c, i) => {
      txns.push({
        id: `collect-${inv._id}-${i}`,
        type: "income",
        category: "Due Collection",
        amount: c.amount,
        description: `Due collected — ${inv.invoiceNumber}`,
        date: toDateOnly(c.collectedAtBST),
        datetime: c.collectedAtBST,
        method: c.method,
        provider: c.provider || null,
        addedBy: "System",
        source: "due-collection",
      });
    });
  });

  returns.forEach((r) => {
    txns.push({
      id: `return-${r._id}`,
      type: "expense",
      category: "Return",
      amount: r.totalReturnAmount,
      description: `Return — Invoice ${r.invoiceNumber}`,
      date: toDateOnly(r.returnDateBST),
      datetime: r.returnDateBST,
      method: "cash",
      addedBy: "System",
      source: "return",
    });
  });

  return txns;
}

// GET /api/ledger — full transaction list + running totals, shaped exactly how the UI expects
router.get("/", async (req, res) => {
  try {
    const { from, to, type } = req.query; // #17 — custom range / type filter
    const entries = await Ledger.find().sort({ date: -1, createdAt: -1 }).limit(5000).lean();
    const manualTxns = entries.map(toClientShape);
    const derivedTxns = await buildDerivedTransactions();

    let transactions = [...manualTxns, ...derivedTxns].sort(
      (a, b) => new Date(b.datetime) - new Date(a.datetime)
    );

    if (from) transactions = transactions.filter((t) => t.date >= from);
    if (to) transactions = transactions.filter((t) => t.date <= to);
    if (type === "income" || type === "expense") transactions = transactions.filter((t) => t.type === type);

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((t) => {
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    res.json({
      balance: +(totalIncome - totalExpense).toFixed(2),
      totalIncome: +totalIncome.toFixed(2),
      totalExpense: +totalExpense.toFixed(2),
      mobileBankingBreakdown: computeMobileBreakdown(transactions),
      bankBreakdown: computeBankBreakdown(transactions),
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/ledger — add an income or expense entry
router.post("/", async (req, res) => {
  try {
    const { type, category, amount, description, date, method, provider, bankName, addedBy } = req.body;

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'income' or 'expense'." });
    }
    if (!CATEGORIES[type].includes(category)) {
      return res.status(400).json({ message: "Invalid category for this type." });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number." });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ message: "Description is required." });
    }
    if (!date || isNaN(new Date(date))) {
      return res.status(400).json({ message: "A valid date is required." });
    }
    if (method && !["cash", "mobile", "bank"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }
    if (method === "mobile" && !MOBILE_PROVIDERS.includes(provider)) {
      return res.status(400).json({ message: "Select a valid mobile banking provider." });
    }
    if (method === "bank" && bankName && !BANK_OPTIONS.includes(bankName)) {
      return res.status(400).json({ message: "Select a valid bank name." });
    }

     if (type === "expense" && category === "Withdraw") {
      const derivedTxns = await buildDerivedTransactions();
      const existingEntries = await Ledger.find().lean();
      const allTxns = [...existingEntries.map(toClientShape), ...derivedTxns];
      const available = allTxns.reduce((sum, t) => {
        const sameMethod = t.method === (method || "cash") && ((method || "cash") !== "mobile" || t.provider === provider);
        if (!sameMethod) return sum;
        return sum + (t.type === "income" ? t.amount : -t.amount);
      }, 0);
      if (amt > available + EPS_LEDGER) {
        return res.status(400).json({ message: `Insufficient balance — only ৳${available.toFixed(2)} available for this method.` });
      }
    }

    const entry = await Ledger.create({
      type,
      category,
      amount: amt,
      description: String(description).trim().slice(0, 500),
      date,
      method: method || "cash",
      provider: method === "mobile" ? provider : null,
      bankName: method === "bank" ? String(bankName || "") : "",
      addedBy: (addedBy || "Admin").trim().slice(0, 100),
    });

    res.status(201).json(toClientShape(entry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/ledger/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid entry id." });
    }
    const deleted = await Ledger.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Entry not found." });
    res.json({ message: "Entry deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/ledger/zakat — daily closing balance → rolling minimum baseline
router.get("/zakat", async (req, res) => {
  try {
    const entries = await Ledger.find().lean();
    const derivedTxns = await buildDerivedTransactions();
    const allTxns = [...entries.map(toClientShape), ...derivedTxns];

    const byDate = {};
    allTxns.forEach((t) => {
      byDate[t.date] = byDate[t.date] || 0;
      byDate[t.date] += t.type === "income" ? t.amount : -t.amount;
    });

    const dates = Object.keys(byDate).sort();
    let running = 0;
    const dailyClosing = dates.map((d) => {
      running += byDate[d];
      return { date: d, balance: +running.toFixed(2) };
    });

    if (dailyClosing.length === 0) {
      return res.json({ baseline: 0, dailyClosing: [], zakatAmount: 0, note: "No transaction history yet." });
    }

    // Most consistent amount across ALL days — the value that repeats the most (mode),
    // bucketed to nearest 1000. Not restricted to lowest values.
    const balances = dailyClosing.map((d) => d.balance);
    const buckets = {};
    balances.forEach((b) => {
      const bucket = Math.round(b / 1000) * 1000;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    const sortedBuckets = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
    const baseline = sortedBuckets.length > 0 ? Number(sortedBuckets[0][0]) : (balances[balances.length - 1] || 0);

    res.json({ baseline: Number(baseline) || 0, dailyClosing, zakatAmount: +((Number(baseline) || 0) * 0.025).toFixed(2) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
module.exports.CATEGORIES = CATEGORIES;