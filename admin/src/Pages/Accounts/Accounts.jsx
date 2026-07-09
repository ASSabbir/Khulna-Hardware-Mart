// FILE: src/Pages/Accounts/Accounts.jsx (FULL REPLACEMENT — real business data, not the mock manual-entry system)
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiActivity,
  FiPlusCircle, FiMinusCircle, FiBarChart2, FiSmartphone,
  FiCreditCard, FiLoader,
} from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });

export default function Accounts() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:5000/api/invoices/stats")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center gap-2 text-gray-500">
        <FiLoader className="animate-spin" size={20} /> Loading accounts…
      </div>
    );
  }

  const s = stats?.stats || {};
  const pay = stats?.paymentMethodSummary || {};
  const mobile = stats?.mobileBankingBreakdown || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
            <FiActivity size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
            <p className="text-gray-500 text-base mt-0.5">Live sales, returns & payment overview from your invoices</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Sales / Returns / Net / Profit — auto-updates with returns (accounts integration) */}
        <div className="bg-gray-900 rounded-2xl p-7">
          <p className="text-gray-400 text-base font-medium mb-4">Sales Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Sales (Gross)", value: s.grossSales, color: "text-blue-400" },
              { label: "Total Returns", value: s.totalReturnsAmount, color: "text-red-400" },
              { label: "Net Sales", value: s.netSales, color: "text-green-400" },
              { label: "Est. Profit", value: s.totalProfit, color: "text-purple-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-gray-500 text-sm">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Collected / Due */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><FiTrendingUp size={18} /></div>
              <p className="text-gray-500 text-sm font-semibold">Total Collected</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{fmt(s.totalCollected)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600"><FiTrendingDown size={18} /></div>
              <p className="text-gray-500 text-sm font-semibold">Outstanding Due</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{fmt(s.totalDueAmount)}</p>
          </div>
        </div>

        {/* Payment method breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <FiBarChart2 size={17} className="text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Payment Method Breakdown</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {[
              { label: "Cash", value: pay.cash, icon: FiDollarSign, bg: "bg-green-50", text: "text-green-700" },
              { label: "Bank", value: pay.bank, icon: FiCreditCard, bg: "bg-purple-50", text: "text-purple-700" },
              { label: "Mobile Banking", value: pay.mobileBanking, icon: FiSmartphone, bg: "bg-blue-50", text: "text-blue-700" },
            ].map(({ label, value, icon: Icon, bg, text }) => (
              <div key={label} className={`${bg} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className={text} />
                  <p className="text-gray-500 text-sm">{label}</p>
                </div>
                <p className={`text-xl font-bold ${text}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm font-semibold mb-3">Mobile Banking Breakdown</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["bKash", "Nagad", "Rocket", "Upay"].map((p) => (
              <div key={p} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs">{p}</p>
                <p className="font-bold text-gray-800">{fmt(mobile[p])}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Manual bookkeeping shortcuts (separate ledger for rent/salary/etc — not sales-derived) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-gray-500 text-sm font-semibold mb-4">Manual Bookkeeping (rent, salary, other cash movement — not tied to sales)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="add-money" className="flex items-center gap-3 bg-green-50 hover:bg-green-100 border border-green-100 rounded-xl px-4 py-3.5 transition">
              <FiPlusCircle size={18} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700">Add Money</span>
            </Link>
            <Link to="add-expense" className="flex items-center gap-3 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl px-4 py-3.5 transition">
              <FiMinusCircle size={18} className="text-red-500" />
              <span className="text-sm font-semibold text-red-600">Add Expense</span>
            </Link>
            <Link to="status" className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-4 py-3.5 transition">
              <FiActivity size={18} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Full Account Status</span>
            </Link>
          </div>
          <p className="text-[10px] text-gray-400 mt-3">
            * Note: these links assume routes "add-money" / "add-expense" / "status" under your Accounts layout — adjust the paths here if your actual route names differ.
          </p>
        </div>

        <p className="text-center text-gray-400 text-sm pb-4">Khulna Hardware Mart · Accounts Overview</p>
      </div>
    </div>
  );
}