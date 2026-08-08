// FILE: src/Pages/Accounts/AccountsHistory.jsx (NEW) — #17

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FiCalendar, FiFilter, FiDollarSign, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

const QUICK_RANGES = [
  { label: "Today", from: todayISO() },
  { label: "Last 5 days", from: daysAgoISO(5) },
  { label: "Last 10 days", from: daysAgoISO(10) },
  { label: "This Month", from: new Date().toISOString().slice(0, 8) + "01" },
];

export default function AccountsHistory() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (type) params.append("type", type);
    axios.get(`http://localhost:5000/api/ledger?${params}`)
      .then((res) => setTxns(res.data.transactions || []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [from, to, type]); // eslint-disable-line

  const totals = useMemo(() => {
    const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  }, [txns]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white"><FiDollarSign size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Money & Expense History</h1>
            <p className="text-gray-500">Filterable log of all income and expense entries</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_RANGES.map((r) => (
              <button key={r.label} onClick={() => { setFrom(r.from); setTo(""); }}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">
                {r.label}
              </button>
            ))}
            <button onClick={() => { setFrom(""); setTo(""); setType(""); }} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50">Clear</button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2"><FiCalendar className="text-gray-400" size={16} /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
            <span className="text-gray-400">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <div className="flex items-center gap-2"><FiFilter className="text-gray-400" size={16} />
              <select value={type} onChange={(e) => setType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
            <FiTrendingUp className="text-green-600" size={22} />
            <div><p className="text-green-700 text-xl font-bold">{fmt(totals.income)}</p><p className="text-green-600 text-sm">Total Income</p></div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
            <FiTrendingDown className="text-red-500" size={22} />
            <div><p className="text-red-600 text-xl font-bold">{fmt(totals.expense)}</p><p className="text-red-500 text-sm">Total Expense</p></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {["Date", "Type", "Category", "Method", "Description", "Amount"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">Loading...</td></tr>
              ) : txns.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">No entries found.</td></tr>
              ) : txns.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-500">{fmtDate(t.date)}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{t.type}</span></td>
                  <td className="px-5 py-3 text-sm text-gray-700">{t.category}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{t.method}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{t.description}</td>
                  <td className={`px-5 py-3 text-sm font-bold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>{t.type === "income" ? "+" : "-"}{fmt(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}