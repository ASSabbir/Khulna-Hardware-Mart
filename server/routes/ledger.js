// FILE: server/routes/ledger.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Ledger = require("../models/Ledger");
const Invoice = require("../models/Invoice");
const Return = require("../models/Return");
const PaymentMethodOption = require("../models/PaymentMethodOption");

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


async function computeMobileBreakdown(transactions) {
  const out = {};
  const configured = await PaymentMethodOption.find({ type: "mobile" }).lean();
  configured.forEach((o) => (out[o.name] = 0));
  transactions.forEach((t) => {
    if (t.method === "mobile" && t.provider) {
      out[t.provider] = (out[t.provider] || 0) + (t.type === "income" ? t.amount : -t.amount);
    }
  });
  Object.keys(out).forEach((k) => (out[k] = +out[k].toFixed(2)));
  return out;
}

async function computeBankBreakdown(transactions) {
  const out = {};
  const configured = await PaymentMethodOption.find({ type: "bank" }).lean();
  configured.forEach((o) => (out[o.name] = 0));
  transactions.forEach((t) => {
    if (t.method === "bank" && t.bankName) {
      out[t.bankName] = (out[t.bankName] || 0) + (t.type === "income" ? t.amount : -t.amount);
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

    let transactions = [...manualTxns, ...derivedTxns].sort((a, b) => {
      const diff = new Date(b.datetime) - new Date(a.datetime);
      if (diff !== 0) return diff;
      return String(b.id).localeCompare(String(a.id));
    });

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
      mobileBankingBreakdown: await computeMobileBreakdown(transactions),
      bankBreakdown: await computeBankBreakdown(transactions),
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
    const categoryTrimmed = String(category || "").trim();
    if (!categoryTrimmed || categoryTrimmed.length > 100) {
      return res.status(400).json({ message: "A valid category is required." });
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
    if (method === "mobile" && !String(provider || "").trim()) {
      return res.status(400).json({ message: "Select a mobile banking provider." });
    }

    // #22 — overdraw is intentionally allowed for every payment method. The resulting
    // negative balance is expected and must remain visible, never blocked.
    const entry = await Ledger.create({
      type,
      category: categoryTrimmed,
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

// GET /api/ledger/balances — available balance per payment method/provider/bank
router.get("/balances", async (req, res) => {
  try {
    const entries = await Ledger.find().lean();
    const derivedTxns = await buildDerivedTransactions();
    const allTxns = [...entries.map(toClientShape), ...derivedTxns];

    let cash = 0;
    const mobile = {};
    const bank = {};
    const configuredMobile = await PaymentMethodOption.find({ type: "mobile" }).lean();
    const configuredBank = await PaymentMethodOption.find({ type: "bank" }).lean();
    configuredMobile.forEach((o) => (mobile[o.name] = 0));
    configuredBank.forEach((o) => (bank[o.name] = 0));

    allTxns.forEach((t) => {
      const sign = t.type === "income" ? 1 : -1;
      if (t.method === "cash") cash += sign * t.amount;
      else if (t.method === "mobile" && t.provider) mobile[t.provider] = (mobile[t.provider] || 0) + sign * t.amount;
      else if (t.method === "bank" && t.bankName) bank[t.bankName] = (bank[t.bankName] || 0) + sign * t.amount;
    });

    res.json({
      cash: +cash.toFixed(2),
      mobile: Object.fromEntries(Object.entries(mobile).map(([k, v]) => [k, +v.toFixed(2)])),
      bank: Object.fromEntries(Object.entries(bank).map(([k, v]) => [k, +v.toFixed(2)])),
    });
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