import { useState, useEffect } from "react";
import axios from "axios";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

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
  return (
    <>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </>
  );
}

// ── Sparkline (simple SVG) ──────────────────────────────────────────
function Spark({ data, color = "#22c55e" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 80,
    h = 28;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  const sparkData = stats?.monthlyRevenue?.map((m) => m.revenue) || [
    40, 55, 48, 70, 65, 80,
  ];

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

  const recentSales = (stats?.recentInvoices || []).map((inv) => ({
    id: inv.invoiceNumber,
    customer: inv.customer?.name || "Unknown",
    items:
      inv.items
        .slice(0, 2)
        .map((i) => i.name)
        .join(", ") +
      (inv.items.length > 2 ? ` +${inv.items.length - 2} more` : ""),
    amount: inv.grandTotal,
    status: "paid",
    time: inv.createdAt,
  }));

  const activityData = [
    {
      icon: "🛒",
      text: `New order ${recentSales[0]?.id || "#0000"} by ${recentSales[0]?.customer || "Customer"}`,
      time: "Just now",
      color: "bg-green-100 text-green-700",
    },
    {
      icon: "⚠️",
      text: `${s.lowStockProducts || 0} products with low stock`,
      time: "1 hr",
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      icon: "📦",
      text: `${s.totalProducts || 0} total products in inventory`,
      time: "2 hrs",
      color: "bg-blue-100 text-blue-700",
    },
    {
      icon: "💰",
      text: `Total revenue: ${fmt(s.totalRevenue || 0)}`,
      time: "Today",
      color: "bg-purple-100 text-purple-700",
    },
    {
      icon: "✅",
      text: "System running smoothly!",
      time: "Now",
      color: "bg-emerald-100 text-emerald-700",
    },
  ];

  // Calculate monthly target progress (assuming 750000 target)
  const monthlyTarget = 750000;
  const targetProgress = Math.min(
    ((s.monthRevenue || 0) / monthlyTarget) * 100,
    100,
  );

  const CARD_TINTS = [
    { bg: "bg-orange-50", accent: "text-orange-600" },
    { bg: "bg-green-50", accent: "text-green-600" },
    { bg: "bg-blue-50", accent: "text-blue-600" },
    { bg: "bg-purple-50", accent: "text-purple-600" },
  ];

  return (
    <div className="flex bg-gray-50 font-sans overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 px-5 lg:px-8 py-6 space-y-6">
          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map((card, i) => {
              const tint = CARD_TINTS[i % CARD_TINTS.length];
              return (
                <div
                  key={card.id}
                  className={`relative ${tint.bg} rounded-2xl p-5 overflow-hidden border border-black/5`}
                >
                  <div className="text-gray-500 font-medium mb-2">
                    {card.label}
                  </div>
                  <div className="text-3xl font-bold text-gray-800 leading-none mb-3">
                    <Counter
                      target={card.value}
                      prefix={card.prefix || ""}
                      suffix={card.suffix || ""}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-white ${card.up ? "text-green-600" : "text-red-500"}`}
                    >
                      {card.up ? (
                        <FiTrendingUp size={12} />
                      ) : (
                        <FiTrendingDown size={12} />
                      )}
                      {card.change}
                    </span>
                    <span className={`text-xs ${tint.accent}`}>
                      {card.funny}
                    </span>
                  </div>
                  <div className="absolute right-4 bottom-4 opacity-70">
                    <Spark data={card.spark} color={card.sparkColor} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── QUICK INFO ROW ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Products",
                val: (s.totalProducts || 0).toLocaleString(),
                icon: "📦",
                sub: `${s.outOfStockProducts || 0} out of stock`,
              },
              {
                label: "Total Revenue",
                val: fmt(s.totalRevenue || 0),
                icon: "📈",
                sub: "All time earnings",
              },
              {
                label: "This Month",
                val: fmt(s.monthRevenue || 0),
                icon: "📅",
                sub: `${targetProgress.toFixed(0)}% of target`,
              },
              {
                label: "Low Stock",
                val: s.lowStockProducts || 0,
                icon: "⚠️",
                sub: "items need restock",
                warn: true,
              },
            ].map(({ label, val, icon, sub, warn }) => (
              <div
                key={label}
                className={`bg-white border ${warn ? "border-red-200" : "border-gray-200"} rounded-2xl p-4 space-y-2 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <span className="text-gray-400 text-sm">{label}</span>
                </div>
                <div className="text-gray-800 text-2xl font-bold">{val}</div>
                <div
                  className={`text-xs ${warn ? "text-red-500" : "text-gray-400"}`}
                >
                  {sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── MONTHLY TARGET BAR ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  Monthly Target
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {targetProgress >= 100
                    ? "Target achieved! 🎉"
                    : `You're ${targetProgress.toFixed(0)}% there — push it, boss!`}
                </p>
              </div>
              <div className="text-right text-sm">
                <div className="text-green-600 font-bold">
                  {fmt(s.monthRevenue || 0)}{" "}
                  <span className="text-gray-400 font-normal">
                    / {fmt(monthlyTarget)}
                  </span>
                </div>
                <div className="text-gray-400 text-xs">
                  {targetProgress >= 100
                    ? "Target achieved!"
                    : `${fmt(monthlyTarget - (s.monthRevenue || 0))} left to go!`}
                </div>
              </div>
            </div>
            <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-green-500 to-emerald-300 rounded-full transition-all"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-gray-400">৳0</span>
              <span className="text-green-600 font-semibold">
                {targetProgress.toFixed(0)}% complete
              </span>
              <span className="text-gray-400">{fmt(monthlyTarget)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default DeshboardOverview;
