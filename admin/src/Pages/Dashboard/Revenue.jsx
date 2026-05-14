import { useState, useEffect } from "react";
import axios from "axios";
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign,
  FiShoppingBag, FiCalendar, FiArrowUpRight, FiArrowDownRight,
} from "react-icons/fi";

/* ─── Format money ─────────────────────────────────────────────── */
const fmt = (n) => {
  if (!n) n = 0;
  if (n >= 10000000) return "৳" + (n / 10000000).toFixed(2) + "Cr";
  if (n >= 100000) return "৳" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "৳" + (n / 1000).toFixed(0) + "K";
  return "৳" + n.toLocaleString();
};

/* ─── Bar Chart Component ───────────────────────────────────────── */
function BarChart({ monthlyData }) {
  const max = Math.max(...monthlyData.map((m) => m.revenue), 1);
  return (
    <div className="flex items-end gap-3 h-44 mt-4">
      {monthlyData.map((m, i) => {
        const h = Math.round((m.revenue / max) * 100);
        const isLast = i === monthlyData.length - 1;
        return (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-gray-500 text-sm">{fmt(m.revenue)}</span>
            <div className="w-full flex items-end" style={{ height: "120px" }}>
              <div
                className={`w-full rounded-xl transition-all ${isLast ? "bg-green-500" : "bg-green-200 hover:bg-green-400"}`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className={`text-sm font-semibold ${isLast ? "text-green-600" : "text-gray-400"}`}>{m.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Revenue Component
══════════════════════════════════════════════════════════════ */
const Revenue = () => {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axios.get("https://khulna-hardware-mart.vercel.app/api/invoices/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#1E3A8A] border-t-transparent rounded-full" />
      </div>
    );
  }

  const s = stats?.stats || {};
  const monthlyData = stats?.monthlyRevenue || [
    { month: "Jan", revenue: 0 }, { month: "Feb", revenue: 0 },
    { month: "Mar", revenue: 0 }, { month: "Apr", revenue: 0 },
    { month: "May", revenue: 0 }, { month: "Jun", revenue: 0 },
  ];
  const topCategories = stats?.topCategories || [];

  const STATS = [
    {
      label: "Today's Revenue",
      value: s.todayRevenue || 0,
      change: s.todayOrders ? `${s.todayOrders} orders` : "No orders",
      up: true,
      icon: <FiDollarSign size={22} />,
      bg: "bg-green-50",
      iconBg: "bg-green-600",
      border: "border-green-200",
    },
    {
      label: "This Week",
      value: s.weekRevenue || 0,
      change: "This week",
      up: true,
      icon: <FiTrendingUp size={22} />,
      bg: "bg-blue-50",
      iconBg: "bg-blue-600",
      border: "border-blue-200",
    },
    {
      label: "This Month",
      value: s.monthRevenue || 0,
      change: "This month",
      up: true,
      icon: <FiCalendar size={22} />,
      bg: "bg-purple-50",
      iconBg: "bg-purple-600",
      border: "border-purple-200",
    },
    {
      label: "Total All Time",
      value: s.totalRevenue || 0,
      change: "All time",
      up: true,
      icon: <FiShoppingBag size={22} />,
      bg: "bg-orange-50",
      iconBg: "bg-orange-500",
      border: "border-orange-200",
    },
  ];

  // Calculate total for percentage
  const catTotal = topCategories.reduce((sum, c) => sum + c.revenue, 0);

  // Recent transactions from recentInvoices
  const recentTransactions = (stats?.recentInvoices || []).slice(0, 5).map(inv => ({
    label: inv.customer?.name || "Unknown Customer",
    amount: inv.grandTotal,
    type: "sale",
    date: new Date(inv.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revenue Overview </h1>
            <p className="text-gray-500 text-lg mt-1">Here's how much money your shop is making, boss!</p>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            {["week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-lg text-base font-semibold capitalize transition
                  ${period === p ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ label, value, change, up, icon, bg, iconBg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-5`}>
              <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center text-white mb-4`}>
                {icon}
              </div>
              <div className="text-2xl font-bold text-gray-900 leading-none">{fmt(value)}</div>
              <div className="text-gray-600 text-base mt-1 mb-3">{label}</div>
              <div className={`flex items-center gap-1 text-base font-semibold ${up ? "text-green-600" : "text-red-500"}`}>
                {up ? <FiArrowUpRight size={16} /> : <FiArrowDownRight size={16} />}
                {change}
              </div>
            </div>
          ))}
        </div>

        {/* ── BAR CHART ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-7">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Monthly Revenue </h2>
              <p className="text-gray-500 text-base mt-0.5">Last 6 months · All in Bangladeshi Taka</p>
            </div>
            <div className="bg-green-100 text-green-700 text-base font-bold px-4 py-2 rounded-xl">
              {fmt(s.monthRevenue || 0)} this month
            </div>
          </div>
          <BarChart monthlyData={monthlyData} />
        </div>

        {/* ── BOTTOM 2-COL ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Category breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Revenue by Category </h2>
            <p className="text-gray-500 text-base mb-6">Where the money's actually coming from</p>
            {topCategories.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No sales data yet</div>
            ) : (
              <div className="space-y-4">
                {topCategories.map(({ name, revenue }, i) => {
                  const pct = catTotal > 0 ? (revenue / catTotal) * 100 : 0;
                  const colors = ["bg-blue-500", "bg-pink-500", "bg-orange-500", "bg-purple-500", "bg-yellow-500"];
                  return (
                    <div key={name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-gray-700 text-base font-medium">{name}</span>
                        <span className="text-gray-900 text-base font-bold">{fmt(revenue)}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-gray-400 text-sm mt-1">{pct.toFixed(0)}% of total</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Recent Transactions </h2>
            <p className="text-gray-500 text-base mb-6">Latest money in & money out</p>
            {recentTransactions.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No transactions yet</div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map(({ label, amount, type, date }) => (
                  <div key={label + date} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === "sale" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {type === "sale" ? <FiTrendingUp size={18} /> : <FiTrendingDown size={18} />}
                      </div>
                      <div>
                        <div className="text-gray-900 text-base font-semibold">{label}</div>
                        <div className="text-gray-400 text-base">{date}</div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${amount > 0 ? "text-green-600" : "text-red-500"}`}>
                      {amount > 0 ? "+" : ""}৳{Math.abs(amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── TOTAL SUMMARY BAR ── */}
        <div className="bg-green-600 rounded-2xl p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="text-green-100 text-lg font-medium">Total All-Time Revenue</p>
            <p className="text-white text-4xl font-bold mt-1">{fmt(s.totalRevenue || 0)}</p>
            <p className="text-green-200 text-base mt-1">Since you started tracking </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-green-100 text-base">Average per month</p>
            <p className="text-white text-3xl font-bold mt-1">
              {fmt(monthlyData.length > 0 ? s.totalRevenue / monthlyData.length : 0)}
            </p>
            <p className="text-green-200 text-base mt-1">Based on {monthlyData.length} months </p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-base pb-6">
          Khulna Hardware Mart · Revenue Report · Data from database
        </p>
      </div>
    </div>
  );
};

export default Revenue;