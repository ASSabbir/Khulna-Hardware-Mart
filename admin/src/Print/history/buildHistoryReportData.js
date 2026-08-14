// FILE: src/Print/history/buildHistoryReportData.js (NEW)
export function buildHistoryReportData({ txns, from, to, generatedBy = "Admin" }) {
  const today = new Date();
  const fmtDMY = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const byCategory = (type) => {
    const m = {};
    txns.filter((t) => t.type === type).forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    const total = type === "income" ? income : expense;
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, amount]) => ({ category, amount, percentage: total > 0 ? Math.round((amount / total) * 100) : 0 }));
  };

  const methodTotals = { cash: 0, mobile: 0, bank: 0 };
  txns.forEach((t) => { if (methodTotals[t.method] !== undefined) methodTotals[t.method] += t.amount; });

  const sorted = [...txns].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const transactions = sorted.map((t, i) => ({
    sl: String(i + 1).padStart(2, "0"),
    date: new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    type: t.type === "income" ? "Income" : "Expense",
    category: t.category || "—",
    method: t.method === "mobile" ? `Mobile Banking${t.provider ? ` (${t.provider})` : ""}` : t.method === "bank" ? `Bank${t.bankName ? ` (${t.bankName})` : ""}` : "Cash",
    desc: t.description || "—",
    user: t.addedBy || "—",
    amount: t.type === "income" ? Math.abs(t.amount) : -Math.abs(t.amount),
  }));

  const periodLabel = from && to ? `${fmtDMY(from)} – ${fmtDMY(to)}` : from ? `From ${fmtDMY(from)}` : "All Time";

  return {
    company: {
      name: "KHULNA HARDWARE MART",
      address: "280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna",
      phone1: "02477-721990",
      phone2: "+880 1931-272839",
      currency: "৳",
      reportDate: fmtDMY(today),
      periodLabel,
      genDate: fmtDMY(today),
      genBy: generatedBy,
    },
    summary: { income, expense, net: income - expense },
    methodTotals,
    topIncome: byCategory("income"),
    topExpense: byCategory("expense"),
    transactions,
  };
}