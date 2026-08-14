// FILE: src/Print/buildReportData.js (NEW)
export function buildReportData({
  company = {
    name: "KHULNA HARDWARE MART",
    address: "📍 280-Khanjahan Ali Road (Rahmanie Madrasha Complex), Khulna",
    phone: "📞 02477-721990, +880 1931-272839",
    currency: "৳",
  },
  reportPeriodLabel,
  accounts,
  byMethod,
  bankBreakdown,
  mobileBreakdown,
  monthStats,
  topIncome,
  topExpense,
  txns,
  selectedMonth,
  generatedBy = "Admin",
}) {
  const today = new Date();
  const fmtDMY = (d) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const banks = Object.entries(bankBreakdown || {}).map(([name, balance]) => ({
    name,
    balance: Number(balance || 0),
  }));

  const mobileBanking = Object.entries(mobileBreakdown || {}).map(([name, balance]) => ({
    name,
    balance: Number(balance || 0),
  }));

  const incomeSources = topIncome.map(([category, amount]) => ({
    category,
    amount,
    percentage: monthStats.income > 0 ? Math.round((amount / monthStats.income) * 100) : 0,
  }));

  const expenseCategories = topExpense.map(([category, amount]) => ({
    category,
    amount,
    percentage: monthStats.expense > 0 ? Math.round((amount / monthStats.expense) * 100) : 0,
  }));

  const transactions = [...txns]
    .sort((a, b) => (b.datetime || b.date).localeCompare(a.datetime || a.date))
    .map((t, i) => ({
      sl: String(i + 1).padStart(2, "0"),
      date: new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      type: t.type === "income" ? "Income" : "Expense",
      category: t.category,
      method: { cash: "Cash", mobile: "Mobile Banking", bank: "Bank Account" }[t.method] || t.method,
      desc: t.description || "",
      user: t.addedBy || "",
      amount: t.type === "income" ? Math.abs(t.amount) : -Math.abs(t.amount),
    }));

  const balance = accounts?.balance ?? ((accounts?.totalIncome ?? 0) - (accounts?.totalExpense ?? 0));

  return {
    company: {
      ...company,
      reportDate: fmtDMY(today),
      reportPeriod: reportPeriodLabel,
      genDate: fmtDMY(today),
      genBy: generatedBy,
    },
    summary: {
      currentBalance: balance,
      totalIncome: accounts?.totalIncome || 0,
      totalExpense: accounts?.totalExpense || 0,
      netProfit: (accounts?.totalIncome || 0) - (accounts?.totalExpense || 0),
    },
    methodBreakdown: {
      cash: byMethod.cash,
      mobile: byMethod.mobile,
      bank: byMethod.bank,
    },
    banks,
    mobileBanking,
    incomeSources,
    expenseCategories,
    transactions,
    periodLabel: reportPeriodLabel,
  };
}