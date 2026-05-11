import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign,
  FiArrowUpRight, FiArrowDownRight, FiActivity,
  FiCalendar, FiClock, FiPieChart, FiList,
} from "react-icons/fi";

// 👉 swap to real API when backend ready
const API_URL = "/accounts.json";

const fmt     = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function getFrom(period) {
  const now = new Date();
  if (period === "day")   return now.toISOString().split("T")[0];
  if (period === "week")  { const d = new Date(now); d.setDate(d.getDate() - 6); return d.toISOString().split("T")[0]; }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  return null;
}

function calcStats(txns, period) {
  const from = getFrom(period);
  const list = from ? txns.filter((t) => t.date >= from) : txns;
  const income  = list.filter((t) => t.type === "income").reduce((s, t)  => s + t.amount, 0);
  const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const count   = list.length;
  return { income, expense, profit: income - expense, count };
}

export default function AccountsStatus() {
  const [accounts, setAccounts] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axios.get(API_URL)
      .then((res) => {
        let d = res.data;
        if (Array.isArray(d)) d = { balance: 0, totalIncome: 0, totalExpense: 0, transactions: d };
        setAccounts(d);
      })
      .catch(() => setAccounts({ balance: 0, totalIncome: 0, totalExpense: 0, transactions: [] }))
      .finally(() => setLoading(false));
  }, []);

  const txns = useMemo(() => accounts?.transactions || [], [accounts]);

  const today = useMemo(() => calcStats(txns, "day"),   [txns]);
  const week  = useMemo(() => calcStats(txns, "week"),  [txns]);
  const month = useMemo(() => calcStats(txns, "month"), [txns]);

  // top income categories this month
  const topIncome = useMemo(() => {
    const m = {};
    txns.filter((t) => t.type === "income" && t.date >= getFrom("month"))
      .forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [txns]);

  // top expense categories this month
  const topExpense = useMemo(() => {
    const m = {};
    txns.filter((t) => t.type === "expense" && t.date >= getFrom("month"))
      .forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [txns]);

  // recent 8 transactions
  const recent = useMemo(() =>
    [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8), [txns]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-11 h-11 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const balance   = accounts?.balance       || 0;
  const allIncome = accounts?.totalIncome   || 0;
  const allExpense= accounts?.totalExpense  || 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
            <FiActivity size={22}/>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Overview</h1>
            <p className="text-gray-500 text-base mt-0.5">Your complete financial snapshot</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-gray-400 text-sm">Last updated</p>
            <p className="text-gray-700 text-base font-semibold">{fmtDate(new Date().toISOString().split("T")[0])}</p>
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
              {allIncome - allExpense >= 0 ? <FiArrowUpRight size={18}/> : <FiArrowDownRight size={18}/>}
              {fmt(Math.abs(allIncome - allExpense))} all-time net {allIncome - allExpense >= 0 ? "profit" : "loss"}
            </div>
          </div>
          <div className="flex gap-6 sm:gap-10">
            <div className="text-center sm:text-right">
              <p className="text-gray-500 text-sm font-medium">All-Time Income</p>
              <p className="text-green-400 text-2xl font-bold mt-1">{fmt(allIncome)}</p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block"/>
            <div className="text-center sm:text-right">
              <p className="text-gray-500 text-sm font-medium">All-Time Expense</p>
              <p className="text-red-400 text-2xl font-bold mt-1">{fmt(allExpense)}</p>
            </div>
          </div>
        </div>

        {/* ── TODAY / WEEK / MONTH INCOME CARDS ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <FiTrendingUp size={18} className="text-green-600"/>
            <h2 className="text-xl font-bold text-gray-900">Income</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Today income */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-gray-500 text-sm font-semibold"><FiClock size={15} className="text-green-500"/>Today</span>
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center"><FiArrowUpRight size={16} className="text-green-600"/></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{fmt(today.income)}</p>
              <p className="text-gray-400 text-sm mt-1">{txns.filter((t) => t.type === "income" && t.date === getFrom("day")).length} transactions</p>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expense today</span>
                  <span className="text-red-500 font-semibold">{fmt(today.expense)}</span>
                </div>
                <div className={`flex justify-between text-sm mt-1 font-bold ${today.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                  <span>Net</span>
                  <span>{fmt(Math.abs(today.profit))}</span>
                </div>
              </div>
            </div>

            {/* This week income */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-gray-500 text-sm font-semibold"><FiCalendar size={15} className="text-green-500"/>This Week</span>
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center"><FiArrowUpRight size={16} className="text-green-600"/></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{fmt(week.income)}</p>
              <p className="text-gray-400 text-sm mt-1">{txns.filter((t) => t.type === "income" && t.date >= getFrom("week")).length} transactions</p>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expense this week</span>
                  <span className="text-red-500 font-semibold">{fmt(week.expense)}</span>
                </div>
                <div className={`flex justify-between text-sm mt-1 font-bold ${week.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                  <span>Net</span>
                  <span>{fmt(Math.abs(week.profit))}</span>
                </div>
              </div>
            </div>

            {/* This month income */}
            <div className="bg-green-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-green-100 text-sm font-semibold"><FiActivity size={15}/>This Month</span>
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><FiArrowUpRight size={16} className="text-white"/></div>
              </div>
              <p className="text-3xl font-bold text-white">{fmt(month.income)}</p>
              <p className="text-green-200 text-sm mt-1">{txns.filter((t) => t.type === "income" && t.date >= getFrom("month")).length} transactions</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex justify-between text-sm">
                  <span className="text-green-200">Expense this month</span>
                  <span className="text-white font-semibold">{fmt(month.expense)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1 font-bold text-white">
                  <span>Net</span>
                  <span>{fmt(Math.abs(month.profit))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TODAY / WEEK / MONTH EXPENSE CARDS ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <FiTrendingDown size={18} className="text-red-500"/>
            <h2 className="text-xl font-bold text-gray-900">Expense</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Today expense */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-gray-500 text-sm font-semibold"><FiClock size={15} className="text-red-400"/>Today</span>
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center"><FiArrowDownRight size={16} className="text-red-500"/></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{fmt(today.expense)}</p>
              <p className="text-gray-400 text-sm mt-1">{txns.filter((t) => t.type === "expense" && t.date === getFrom("day")).length} transactions</p>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full"
                  style={{ width: `${today.income > 0 ? Math.min((today.expense / today.income) * 100, 100) : 0}%` }}/>
              </div>
              <p className="text-gray-400 text-xs mt-1.5">{today.income > 0 ? Math.round((today.expense / today.income) * 100) : 0}% of today's income</p>
            </div>

            {/* This week expense */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-gray-500 text-sm font-semibold"><FiCalendar size={15} className="text-red-400"/>This Week</span>
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center"><FiArrowDownRight size={16} className="text-red-500"/></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{fmt(week.expense)}</p>
              <p className="text-gray-400 text-sm mt-1">{txns.filter((t) => t.type === "expense" && t.date >= getFrom("week")).length} transactions</p>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full"
                  style={{ width: `${week.income > 0 ? Math.min((week.expense / week.income) * 100, 100) : 0}%` }}/>
              </div>
              <p className="text-gray-400 text-xs mt-1.5">{week.income > 0 ? Math.round((week.expense / week.income) * 100) : 0}% of this week's income</p>
            </div>

            {/* This month expense */}
            <div className="bg-red-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-red-100 text-sm font-semibold"><FiActivity size={15}/>This Month</span>
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><FiArrowDownRight size={16} className="text-white"/></div>
              </div>
              <p className="text-3xl font-bold text-white">{fmt(month.expense)}</p>
              <p className="text-red-200 text-sm mt-1">{txns.filter((t) => t.type === "expense" && t.date >= getFrom("month")).length} transactions</p>
              <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full"
                  style={{ width: `${month.income > 0 ? Math.min((month.expense / month.income) * 100, 100) : 0}%` }}/>
              </div>
              <p className="text-red-200 text-xs mt-1.5">{month.income > 0 ? Math.round((month.expense / month.income) * 100) : 0}% of this month's income</p>
            </div>
          </div>
        </div>

        {/* ── NET PROFIT CARDS ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <FiDollarSign size={18} className="text-blue-600"/>
            <h2 className="text-xl font-bold text-gray-900">Net Profit</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Today",      profit: today.profit,  income: today.income  },
              { label: "This Week",  profit: week.profit,   income: week.income   },
              { label: "This Month", profit: month.profit,  income: month.income  },
            ].map(({ label, profit, income }) => {
              const pct = income > 0 ? Math.round((profit / income) * 100) : 0;
              const pos = profit >= 0;
              return (
                <div key={label} className={`border rounded-2xl p-6 ${pos ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 text-sm font-semibold">{label}</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pos ? "bg-blue-100" : "bg-orange-100"}`}>
                      {pos ? <FiArrowUpRight size={16} className="text-blue-600"/> : <FiArrowDownRight size={16} className="text-orange-500"/>}
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${pos ? "text-blue-700" : "text-orange-600"}`}>{fmt(Math.abs(profit))}</p>
                  <p className={`text-sm font-semibold mt-1 ${pos ? "text-blue-500" : "text-orange-500"}`}>{pos ? "Profit" : "Loss"} · {Math.abs(pct)}% margin</p>
                  <div className="mt-4 h-2 bg-white/70 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pos ? "bg-blue-500" : "bg-orange-400"}`} style={{ width: `${Math.min(Math.abs(pct), 100)}%` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CATEGORY BREAKDOWN ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by category */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <FiPieChart size={17} className="text-green-600"/>
              <h2 className="text-base font-bold text-gray-900">Top Income Sources</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">This month</span>
            </div>
            {topIncome.length === 0 ? (
              <p className="text-gray-400 text-base text-center py-8">No income this month</p>
            ) : (
              <div className="space-y-4">
                {topIncome.map(([cat, val]) => {
                  const pct = month.income > 0 ? Math.round((val / month.income) * 100) : 0;
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
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expense by category */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <FiPieChart size={17} className="text-red-500"/>
              <h2 className="text-base font-bold text-gray-900">Top Expense Categories</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">This month</span>
            </div>
            {topExpense.length === 0 ? (
              <p className="text-gray-400 text-base text-center py-8">No expenses this month</p>
            ) : (
              <div className="space-y-4">
                {topExpense.map(([cat, val]) => {
                  const pct = month.expense > 0 ? Math.round((val / month.expense) * 100) : 0;
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
                        <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${pct}%` }}/>
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
              <FiList size={17} className="text-gray-600"/>
              <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
            </div>
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg">Last 8 records</span>
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Date", "Type", "Category", "Description", "Added By", "Amount"].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-base">No transactions found</td></tr>
                ) : recent.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><FiCalendar size={13} className="text-gray-300"/>{fmtDate(t.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${t.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {t.type === "income" ? <FiArrowUpRight size={12}/> : <FiArrowDownRight size={12}/>}
                        {t.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">{t.category}</span>
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
                    {t.type === "income" ? <FiArrowUpRight size={16} className="text-green-600"/> : <FiArrowDownRight size={16} className="text-red-500"/>}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium">{t.category}</span>
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