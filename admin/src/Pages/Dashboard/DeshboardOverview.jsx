import { useState, useEffect } from "react";
import axios from "axios";
import {  FiTrendingUp, FiTrendingDown } from "react-icons/fi";

// ── Format money ────────────────────────────────────────────────
const fmt = (n) => {
  if (n >= 10000000) return "৳" + (n / 10000000).toFixed(2) + "Cr";
  if (n >= 100000) return "৳" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "৳" + (n / 1000).toFixed(1) + "K";
  return "৳" + (n || 0).toLocaleString();
};

// ── Format date ─────────────────────────────────────────────────
const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-BD", { day: "2-digit", month: "short" });
};

// ── animated counter ────────────────────────────────────────────────
function Counter({ target, prefix = "", suffix = "", duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

// ── Sparkline (simple SVG) ──────────────────────────────────────────
function Spark({ data, color = "#22c55e" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 80, h = 28;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DeshboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/invoices/stats");
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1E3A8A] border-t-transparent rounded-full" />
      </div>
    );
  }

  const s = stats?.stats || {};

  // Prepare spark data from monthly revenue
  const sparkData = stats?.monthlyRevenue?.map(m => m.revenue) || [40, 55, 48, 70, 65, 80];

  const STAT_CARDS = [
    {
      id: "sales",
      emoji: "💰",
      label: "Today's Sales",
      value: s.todayRevenue || 0,
      prefix: "৳",
      change: s.todayOrders ? `${s.todayOrders} orders` : "0 orders",
      up: true,
      spark: sparkData.slice(-7),
      sparkColor: "#22c55e",
      bg: "from-emerald-500 to-green-600",
      funny: "Cha-ching! ",
    },
    {
      id: "orders",
      emoji: "📦",
      label: "This Week",
      value: s.weekRevenue || 0,
      prefix: "৳",
      change: "This week",
      up: true,
      spark: sparkData.slice(-5),
      sparkColor: "#3b82f6",
      bg: "from-blue-500 to-indigo-600",
      funny: "Pipes flying out! ",
    },
    {
      id: "due",
      emoji: "️",
      label: "This Month",
      value: s.monthRevenue || 0,
      prefix: "৳",
      change: "This month",
      up: true,
      spark: sparkData.slice(-3),
      sparkColor: "#f59e0b",
      bg: "from-amber-400 to-orange-500",
      funny: "Keep it up, boss ",
    },
    {
      id: "stock",
      emoji: "🏪",
      label: "Low Stock Items",
      value: s.lowStockProducts || 0,
      prefix: "",
      suffix: " items",
      change: s.outOfStockProducts ? `${s.outOfStockProducts} out` : "No outs",
      up: false,
      spark: [2, 3, 5, 4, 6, 7, s.lowStockProducts || 0],
      sparkColor: "#ef4444",
      bg: "from-red-400 to-rose-600",
      funny: "Restock before chaos! ",
    },
  ];

  const recentSales = (stats?.recentInvoices || []).map(inv => ({
    id: inv.invoiceNumber,
    customer: inv.customer?.name || "Unknown",
    items: inv.items.slice(0, 2).map(i => i.name).join(", ") + (inv.items.length > 2 ? ` +${inv.items.length - 2} more` : ""),
    amount: inv.grandTotal,
    status: "paid",
    time: inv.createdAt,
  }));

  const activityData = [
    { icon: "🛒", text: `New order ${recentSales[0]?.id || "#0000"} by ${recentSales[0]?.customer || "Customer"}`, time: "Just now", color: "bg-green-100 text-green-700" },
    { icon: "⚠️", text: `${s.lowStockProducts || 0} products with low stock`, time: "1 hr", color: "bg-yellow-100 text-yellow-700" },
    { icon: "📦", text: `${s.totalProducts || 0} total products in inventory`, time: "2 hrs", color: "bg-blue-100 text-blue-700" },
    { icon: "💰", text: `Total revenue: ${fmt(s.totalRevenue || 0)}`, time: "Today", color: "bg-purple-100 text-purple-700" },
    { icon: "✅", text: "System running smoothly!", time: "Now", color: "bg-emerald-100 text-emerald-700" },
  ];

  // Calculate monthly target progress (assuming 750000 target)
  const monthlyTarget = 750000;
  const targetProgress = Math.min(((s.monthRevenue || 0) / monthlyTarget) * 100, 100);

  return (
    <div className="flex bg- font-sans overflow-hidden">
      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 px-5 lg:px-8 py-6 space-y-6">

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map((card, i) => (
              <div
                key={card.id}
                className={`relative bg-linear-to-br ${card.bg} rounded-2xl p-5 text-white overflow-hidden`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute -top-4 -right-4 text-6xl opacity-10 select-none">{card.emoji}</div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${card.up ? "bg-white/20" : "bg-black/20"}`}>
                    {card.change}
                  </span>
                </div>
                <div className="text-4xl font-bold leading-none mb-3">
                  <Counter target={card.value} prefix={card.prefix || ""} suffix={card.suffix || ""} />
                </div>
                <div className="text-white/60 font-bold text-2xl mb-3">{card.label}</div>
                <div className="flex items-end justify-between">
                  <span className="text-xs text-white/60 italic">{card.funny}</span>
                  <Spark data={card.spark} color="rgba(255,255,255,0.7)" />
                </div>
              </div>
            ))}
          </div>

          {/* ── QUICK INFO ROW ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Products", val: (s.totalProducts || 0).toLocaleString(), icon: "📦", sub: `${s.outOfStockProducts || 0} out of stock` },
              { label: "Total Revenue", val: fmt(s.totalRevenue || 0), icon: "📈", sub: "All time earnings" },
              { label: "This Month", val: fmt(s.monthRevenue || 0), icon: "📅", sub: `${targetProgress.toFixed(0)}% of target` },
              { label: "Low Stock", val: s.lowStockProducts || 0, icon: "⚠️", sub: "items need restock", warn: true },
            ].map(({ label, val, icon, sub, warn }) => (
              <div key={label} className={`bg-gray-200 border ${warn ? "border-red-300" : "border-gray-300"} rounded-xl p-4 space-y-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{icon}</span>
                  <span className="text-gray-400 text-xl">{label}</span>
                </div>
                <div className="text-gray-600 text-4xl font-bold">{val}</div>
                <div className={`text-xl mt-1 ${warn ? "text-red-500" : "text-gray-500"}`}>{sub}</div>
              </div>
            ))}
          </div>

          {/* ── MAIN 2-COL ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Recent Sales — takes 2 cols */}
            <div className="xl:col-span-2 text-gray-600 bg-gray-200 border border-gray-300 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-300">
                <div>
                  <h2 className="font-bold text-2xl">Recent Sales </h2>
                  <p className="text-gray-500 text-xs mt-0.5">Latest transactions from database</p>
                </div>
              </div>
              <div className="divide-y divide-gray-400/60">
                {recentSales.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400">No sales yet. Start selling!</div>
                ) : (
                  recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-750 transition">
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl shrink-0 font-bold text-gray-100">
                        {sale.customer[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold truncate">{sale.customer}</span>
                          <span className="text-gray-600 text-xs">{sale.id}</span>
                        </div>
                        <div className="text-gray-500 text-xs truncate">{sale.items}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold">৳{sale.amount.toLocaleString()}</div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text- px-2 py-0.5 rounded-full font-medium bg-green-900/60 text-green-400">
                            Paid
                          </span>
                        </div>
                        <div className="text-gray-600 text-xs mt-0.5">{formatTime(sale.time)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity feed — 1 col */}
            <div className="bg-gray-200 text-gray-600 border border-gray-300 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700">
                <h2 className="text-gray-600 font-bold text-2xl">Live Activity 🔴</h2>
                <p className="text-gray-500 text-xs mt-0.5">Real-time updates from database</p>
              </div>
              <div className="p-4 space-y-3">
                {activityData.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${a.color}`}>
                      {a.icon}
                    </div>
                    <div>
                      <div className="text-gray-600 text-xl leading-snug">{a.text}</div>
                      <div className="text-gray-600 text-xs mt-0.5">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MONTHLY TARGET BAR ── */}
          <div className="bg-gray-200 border border-gray-300 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-2xl text-gray-600">Monthly Target </h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  {targetProgress >= 100 ? "Target achieved! 🎉" : `You're ${targetProgress.toFixed(0)}% there — push it, boss!`}
                </p>
              </div>
              <div className="text-right text-xl">
                <div className="text-green-500 font-bold">{fmt(s.monthRevenue || 0)} <span className="text-gray-500 font-normal ">/ {fmt(monthlyTarget)}</span></div>
                <div className="text-gray-500 text-xl">{targetProgress >= 100 ? "Target achieved!" : `${fmt(monthlyTarget - (s.monthRevenue || 0))} left to go!`}</div>
              </div>
            </div>
            <div className="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-green-600 to-emerald-300 rounded-full transition-all" style={{ width: `${targetProgress}%` }} />
            </div>
            <div className="flex justify-between text-xl mt-1.5">
              <span className="text-gray-600 ">৳0</span>
              <span className="text-green-500 font-semibold">{targetProgress.toFixed(0)}% complete </span>
              <span className="text-gray-600 ">{fmt(monthlyTarget)}</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
export default DeshboardOverview;