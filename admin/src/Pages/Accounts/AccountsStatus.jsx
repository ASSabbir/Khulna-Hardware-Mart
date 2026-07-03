import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign,
  FiArrowUpRight, FiArrowDownRight, FiActivity,
  FiCalendar, FiClock, FiPieChart, FiList,
  FiSmartphone, FiCreditCard, FiSun,
} from "react-icons/fi";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// 👉 swap to real API when backend ready
const API_URL = "/accounts.json";

const fmt      = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate  = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateOnly = (dt) => (dt || "").slice(0, 10);
const pad2     = (n) => String(n).padStart(2, "0");

const METHODS = {
  cash:   { label: "Cash",           icon: FiDollarSign, color: "#16a34a", bg: "bg-green-50",  text: "text-green-600" },
  mobile: { label: "Mobile Banking", icon: FiSmartphone,  color: "#2563eb", bg: "bg-blue-50",   text: "text-blue-600"  },
  bank:   { label: "Bank Account",   icon: FiCreditCard,  color: "#9333ea", bg: "bg-purple-50", text: "text-purple-600" },
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ───────────────────────── Mock data fallback (used until a real API is wired up) ─────────────────────────
function generateMockTransactions() {
  const cats = {
    income:  ["Sales", "Service Fee", "Consulting", "Product Sales", "Rental Income"],
    expense: ["Inventory", "Rent", "Salaries", "Utilities", "Marketing", "Transport"],
  };
  const methods = ["cash", "mobile", "bank"];
  const addedBy = ["Rafiq", "Anika", "Shuvo", "Mim"];
  const txns = [];
  const now = new Date();
  let id = 1;

  for (let dayOffset = 364; dayOffset >= 0; dayOffset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    const entriesToday = 1 + Math.floor(Math.random() * 4);
    for (let e = 0; e < entriesToday; e++) {
      const type = Math.random() > 0.4 ? "income" : "expense";
      const hour = 8 + Math.floor(Math.random() * 11);
      const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, Math.floor(Math.random() * 60));
      txns.push({
        id: id++,
        datetime: dt.toISOString(),
        date: dateOnly(dt.toISOString()),
        type,
        category: cats[type][Math.floor(Math.random() * cats[type].length)],
        amount: Math.round((type === "income" ? 800 + Math.random() * 9000 : 300 + Math.random() * 4000) / 10) * 10,
        method: methods[Math.floor(Math.random() * methods.length)],
        description: type === "income" ? "Customer payment received" : "Operational expense",
        addedBy: addedBy[Math.floor(Math.random() * addedBy.length)],
      });
    }
  }
  return txns;
}

function buildMockAccounts() {
  const transactions = generateMockTransactions();
  const totalIncome  = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { balance: totalIncome - totalExpense, totalIncome, totalExpense, transactions };
}

// ───────────────────────── Stats + chart builders ─────────────────────────
function calcStats(txns, from, to) {
  const list = txns.filter((t) => t.date >= from && t.date <= to);
  const income  = list.filter((t) => t.type === "income").reduce((s, t)  => s + t.amount, 0);
  const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expense, profit: income - expense, count: list.length };
}

function buildHourly(txns, selectedDate) {
  const rows = Array.from({ length: 24 }, (_, h) => ({ label: pad2(h) + ":00", income: 0, expense: 0 }));
  txns.filter((t) => t.date === selectedDate).forEach((t) => {
    const hour = new Date(t.datetime).getHours();
    rows[hour][t.type] += t.amount;
  });
  return rows;
}

function buildDailyForMonth(txns, ym) {
  const [y, m] = ym.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const rows = Array.from({ length: daysInMonth }, (_, i) => ({ label: String(i + 1), income: 0, expense: 0, net: 0 }));
  txns.filter((t) => t.date.startsWith(ym)).forEach((t) => {
    const day = Number(t.date.slice(8, 10)) - 1;
    rows[day][t.type] += t.amount;
  });
  let running = 0;
  rows.forEach((r) => { running += r.income - r.expense; r.net = running; });
  return rows;
}

function buildMonthlyForYear(txns, year) {
  const rows = MONTH_NAMES.map((label) => ({ label, income: 0, expense: 0, net: 0 }));
  txns.filter((t) => t.date.startsWith(String(year))).forEach((t) => {
    const month = Number(t.date.slice(5, 7)) - 1;
    rows[month][t.type] += t.amount;
  });
  let running = 0;
  rows.forEach((r) => { running += r.income - r.expense; r.net = running; });
  return rows;
}

function methodBreakdown(txns) {
  const out = { cash: { income: 0, expense: 0 }, mobile: { income: 0, expense: 0 }, bank: { income: 0, expense: 0 } };
  txns.forEach((t) => { if (out[t.method]) out[t.method][t.type] += t.amount; });
  return out;
}

// ───────────────────────── Small UI helpers ─────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, tone }) {
  const tones = {
    green:  "text-green-600 bg-green-50",
    red:    "text-red-500 bg-red-50",
    blue:   "text-blue-600 bg-blue-50",
    orange: "text-orange-500 bg-orange-50",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-gray-500 text-sm font-semibold">{label}</p>
      <p className={`text-2xl font-bold mt-1.5 ${tones[tone].split(" ")[0]}`}>{fmt(value)}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function AccountsStatus() {
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState("daily"); // daily | monthly | yearly

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate,  setSelectedDate]  = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(todayStr.slice(0, 7));
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());

  useEffect(() => {
    axios.get(API_URL)
      .then((res) => {
        let d = res.data;
        if (Array.isArray(d)) d = { balance: 0, totalIncome: 0, totalExpense: 0, transactions: d };
        if (!d.transactions?.length) d = buildMockAccounts();
        setAccounts(d);
      })
      .catch(() => setAccounts(buildMockAccounts()))
      .finally(() => setLoading(false));
  }, []);

  const txns = useMemo(() => (accounts?.transactions || []).map((t) => ({
    ...t,
    date: t.date || dateOnly(t.datetime),
    method: t.method || "cash",
  })), [accounts]);

  const dayStats   = useMemo(() => calcStats(txns, selectedDate, selectedDate), [txns, selectedDate]);
  const monthStats = useMemo(() => calcStats(txns, selectedMonth + "-01", selectedMonth + "-31"), [txns, selectedMonth]);
  const yearStats  = useMemo(() => calcStats(txns, `${selectedYear}-01-01`, `${selectedYear}-12-31`), [txns, selectedYear]);

  const hourlyChart  = useMemo(() => buildHourly(txns, selectedDate), [txns, selectedDate]);
  const dailyChart   = useMemo(() => buildDailyForMonth(txns, selectedMonth), [txns, selectedMonth]);
  const monthlyChart = useMemo(() => buildMonthlyForYear(txns, selectedYear), [txns, selectedYear]);

  const byMethod = useMemo(() => methodBreakdown(txns), [txns]);

  const topIncome = useMemo(() => {
    const m = {};
    txns.filter((t) => t.type === "income" && t.date.startsWith(selectedMonth))
      .forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [txns, selectedMonth]);

  const topExpense = useMemo(() => {
    const m = {};
    txns.filter((t) => t.type === "expense" && t.date.startsWith(selectedMonth))
      .forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [txns, selectedMonth]);

  const recent = useMemo(() =>
    [...txns].sort((a, b) => (b.datetime || b.date).localeCompare(a.datetime || a.date)).slice(0, 8), [txns]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-11 h-11 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const balance    = accounts?.balance      ?? (accounts?.totalIncome - accounts?.totalExpense) ?? 0;
  const allIncome  = accounts?.totalIncome  || 0;
  const allExpense = accounts?.totalExpense || 0;

  const activeStats = period === "daily" ? dayStats : period === "monthly" ? monthStats : yearStats;
  const activeChart  = period === "daily" ? hourlyChart : period === "monthly" ? dailyChart : monthlyChart;
  const showNetLine  = period !== "daily";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
            <FiActivity size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Overview</h1>
            <p className="text-gray-500 text-base mt-0.5">Your complete financial snapshot</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-gray-400 text-sm">Last updated</p>
            <p className="text-gray-700 text-base font-semibold">{fmtDate(todayStr)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── BALANCE BANNER ── */}
        <div className="bg-gray-900 rounded-2xl p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-gray-400 text-base font-medium">Current Balance</p>
            <p className="text-5xl font-bold text-white mt-2 tracking-tight">{fmt(balance)}</p>
            <div className={`flex items-center gap-1.5 mt-3 text-base font-semibold ${allIncome - allExpense >= 0 ? "text-green-400" : "text-red-400"}`}>
              {allIncome - allExpense >= 0 ? <FiArrowUpRight size={18} /> : <FiArrowDownRight size={18} />}
              {fmt(Math.abs(allIncome - allExpense))} all-time net {allIncome - allExpense >= 0 ? "profit" : "loss"}
            </div>
          </div>
          <div className="flex gap-6 sm:gap-10">
            <div className="text-center sm:text-right">
              <p className="text-gray-500 text-sm font-medium">All-Time Income</p>
              <p className="text-green-400 text-2xl font-bold mt-1">{fmt(allIncome)}</p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block" />
            <div className="text-center sm:text-right">
              <p className="text-gray-500 text-sm font-medium">All-Time Expense</p>
              <p className="text-red-400 text-2xl font-bold mt-1">{fmt(allExpense)}</p>
            </div>
          </div>
        </div>

        {/* ── ACCOUNT TYPE BREAKDOWN: Cash / Mobile Banking / Bank ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <FiCreditCard size={18} className="text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Accounts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(METHODS).map(([key, cfg]) => {
              const m = byMethod[key];
              const net = m.income - m.expense;
              const Icon = cfg.icon;
              return (
                <div key={key} className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex items-center gap-2 text-gray-500 text-sm font-semibold">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                        <Icon size={15} className={cfg.text} />
                      </span>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(net)}</p>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-sm">
                    <span className="text-gray-500">In {fmt(m.income)}</span>
                    <span className="text-gray-500">Out {fmt(m.expense)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PERIOD TABS: Daily / Monthly / Yearly ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-fit">
              {[
                { key: "daily",   label: "Daily Tracking",  icon: FiSun },
                { key: "monthly", label: "Monthly Summary", icon: FiCalendar },
                { key: "yearly",  label: "Yearly Report",   icon: FiActivity },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    period === key ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {period === "daily" && (
              <input type="date" value={selectedDate} max={todayStr}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium" />
            )}
            {period === "monthly" && (
              <input type="month" value={selectedMonth} max={todayStr.slice(0, 7)}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium" />
            )}
            {period === "yearly" && (
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium">
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>

          {/* stat row for selected period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Income"  value={activeStats.income}  tone="green" sub={`${activeStats.count} transactions`} />
            <StatCard label="Expense" value={activeStats.expense} tone="red" />
            <StatCard
              label={activeStats.profit >= 0 ? "Net Profit" : "Net Loss"}
              value={Math.abs(activeStats.profit)}
              tone={activeStats.profit >= 0 ? "blue" : "orange"}
            />
          </div>

          {/* chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={period === "daily" ? 8 : 14} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={period === "daily" ? 8 : 14} />
                {showNetLine && (
                  <Line type="monotone" dataKey="net" name="Cumulative Net" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-gray-400 text-xs mt-3 text-center">
            {period === "daily" && "Hour-by-hour income vs. expense for the selected day"}
            {period === "monthly" && "Daily income vs. expense with cumulative growth for the selected month"}
            {period === "yearly" && "Monthly income vs. expense with cumulative growth for the selected year"}
          </p>
        </div>

        {/* ── CATEGORY BREAKDOWN ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <FiPieChart size={17} className="text-green-600" />
              <h2 className="text-base font-bold text-gray-900">Top Income Sources</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">{selectedMonth}</span>
            </div>
            {topIncome.length === 0 ? (
              <p className="text-gray-400 text-base text-center py-8">No income this month</p>
            ) : (
              <div className="space-y-4">
                {topIncome.map(([cat, val]) => {
                  const pct = monthStats.income > 0 ? Math.round((val / monthStats.income) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-base font-semibold text-gray-700">{cat}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">{pct}%</span>
                          <span className="text-base font-bold text-green-600">{fmt(val)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <FiPieChart size={17} className="text-red-500" />
              <h2 className="text-base font-bold text-gray-900">Top Expense Categories</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">{selectedMonth}</span>
            </div>
            {topExpense.length === 0 ? (
              <p className="text-gray-400 text-base text-center py-8">No expenses this month</p>
            ) : (
              <div className="space-y-4">
                {topExpense.map(([cat, val]) => {
                  const pct = monthStats.expense > 0 ? Math.round((val / monthStats.expense) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-base font-semibold text-gray-700">{cat}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">{pct}%</span>
                          <span className="text-base font-bold text-red-500">{fmt(val)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RECENT TRANSACTIONS ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiList size={17} className="text-gray-600" />
              <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
            </div>
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg">Last 8 records</span>
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Date", "Type", "Category", "Method", "Description", "Added By", "Amount"].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-base">No transactions found</td></tr>
                ) : recent.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><FiCalendar size={13} className="text-gray-300" />{fmtDate(t.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${t.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {t.type === "income" ? <FiArrowUpRight size={12} /> : <FiArrowDownRight size={12} />}
                        {t.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">{t.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${METHODS[t.method]?.bg} ${METHODS[t.method]?.text}`}>
                        {METHODS[t.method]?.label || t.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                      <span className="truncate block">{t.description}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{t.addedBy}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-50">
            {recent.map((t) => (
              <div key={t.id} className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                    {t.type === "income" ? <FiArrowUpRight size={16} className="text-green-600" /> : <FiArrowDownRight size={16} className="text-red-500" />}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium">{t.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${METHODS[t.method]?.bg} ${METHODS[t.method]?.text}`}>
                        {METHODS[t.method]?.label}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDate(t.date)}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-base font-bold whitespace-nowrap ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm pb-4">BuildMart Hardware — Account Overview</p>
      </div>
    </div>
  );
}