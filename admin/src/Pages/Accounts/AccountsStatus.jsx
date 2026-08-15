import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { openPrintWindow } from "../../Print/printUtils";
import { generateReportHTML } from "../../Print/reportTemplate";
import { buildReportData } from "../../Print/buildReportData";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiArrowUpRight,
  FiArrowDownRight,
  FiActivity,
  FiCalendar,
  FiClock,
  FiPieChart,
  FiList,
  FiSmartphone,
  FiCreditCard,
  FiSun,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiSearch,
  FiSliders,
  FiZap,
  FiAlertTriangle,
  FiAward,
  FiCpu,
  FiTarget,
} from "react-icons/fi";
import {
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const API_URL = "http://localhost:5000/api/ledger";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
const dateOnly = (dt) => (dt || "").slice(0, 10);
const pad2 = (n) => String(n).padStart(2, "0");

const METHODS = {
  cash: {
    label: "Cash",
    icon: FiDollarSign,
    color: "#10B981",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  mobile: {
    label: "Mobile Banking",
    icon: FiSmartphone,
    color: "#8B5CF6",
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
  bank: {
    label: "Bank Account",
    icon: FiCreditCard,
    color: "#3B82F6",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ───────────────────────── Stats + chart builders ─────────────────────────
function calcStats(txns, from, to) {
  const list = txns.filter((t) => t.date >= from && t.date <= to);
  const income = list
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = list
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return { income, expense, profit: income - expense, count: list.length };
}

function buildHourly(txns, selectedDate) {
  const rows = Array.from({ length: 24 }, (_, h) => ({
    label: pad2(h) + ":00",
    income: 0,
    expense: 0,
  }));
  txns
    .filter((t) => t.date === selectedDate)
    .forEach((t) => {
      const hour = new Date(t.datetime).getHours();
      rows[hour][t.type] += t.amount;
    });
  return rows;
}

function buildDailyForMonth(txns, ym) {
  const [y, m] = ym.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const rows = Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1),
    income: 0,
    expense: 0,
    net: 0,
  }));
  txns
    .filter((t) => t.date.startsWith(ym))
    .forEach((t) => {
      const day = Number(t.date.slice(8, 10)) - 1;
      rows[day][t.type] += t.amount;
    });
  let running = 0;
  rows.forEach((r) => {
    running += r.income - r.expense;
    r.net = running;
  });
  return rows;
}

function buildMonthlyForYear(txns, year) {
  const rows = MONTH_NAMES.map((label) => ({
    label,
    income: 0,
    expense: 0,
    net: 0,
  }));
  txns
    .filter((t) => t.date.startsWith(String(year)))
    .forEach((t) => {
      const month = Number(t.date.slice(5, 7)) - 1;
      rows[month][t.type] += t.amount;
    });
  let running = 0;
  rows.forEach((r) => {
    running += r.income - r.expense;
    r.net = running;
  });
  return rows;
}

function methodBreakdown(txns) {
  const out = {
    cash: { income: 0, expense: 0 },
    mobile: { income: 0, expense: 0 },
    bank: { income: 0, expense: 0 },
  };
  txns.forEach((t) => {
    if (out[t.method]) out[t.method][t.type] += t.amount;
  });
  return out;
}

function last6MonthsNet(txns) {
  const now = new Date();
  const rows = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    const list = txns.filter((t) => t.date.startsWith(ym));
    const income = list
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = list
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    rows.push({ label: MONTH_NAMES[d.getMonth()], net: income - expense });
  }
  return rows;
}

function buildForecast(txns) {
  const hist = last6MonthsNet(txns);
  const validNets = hist.map((r) => r.net);
  const avgNet = validNets.length
    ? validNets.reduce((a, b) => a + b, 0) / validNets.length
    : 0;
  const lastReal = hist[hist.length - 1]?.net || 0;
  const now = new Date();
  const forecast = [];
  let running = lastReal;
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    running += avgNet;
    forecast.push({
      label: MONTH_NAMES[d.getMonth()],
      net: Math.round(running),
      projected: true,
    });
  }
  return [...hist.map((r) => ({ ...r, projected: false })), ...forecast];
}

// ───────────────────────── Small UI helpers ─────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F172A] text-white text-xs rounded-lg px-3 py-2 shadow-lg">
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
    green: "text-[#10B981]",
    red: "text-[#EF4444]",
    blue: "text-[#3B82F6]",
    orange: "text-[#F59E0B]",
  };
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
      <p className="text-[#64748B] text-sm font-semibold">{label}</p>
      <p className={`text-2xl font-bold mt-1.5 ${tones[tone]}`}>{fmt(value)}</p>
      {sub && <p className="text-[#94A3B8] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  trend,
  trendUp,
  sparkPoints,
  sparkColor,
  sparkId,
  extra,
  valueClass,
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
      <p className="text-[#64748B] text-sm font-medium">{label}</p>
      <p
        className={`text-[22px] sm:text-[24px] font-bold mt-1.5 tracking-tight ${valueClass || "text-[#0F172A]"}`}
      >
        {value}
      </p>
      {trend && (
        <p
          className={`text-xs font-semibold mt-1 flex items-center gap-1 ${trendUp ? "text-[#10B981]" : "text-[#EF4444]"}`}
        >
          {trendUp ? (
            <FiArrowUpRight size={12} />
          ) : (
            <FiArrowDownRight size={12} />
          )}{" "}
          {trend}
        </p>
      )}
      {sub && <p className="text-[#94A3B8] text-[11px] mt-1">{sub}</p>}
      {sparkPoints && (
        <svg
          viewBox="0 0 120 32"
          className="w-full h-8 mt-2"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sparkColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,32 ${sparkPoints} 120,32`}
            fill={`url(#${sparkId})`}
          />
          <polyline
            points={sparkPoints}
            fill="none"
            stroke={sparkColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      {extra}
    </div>
  );
}

function CircularGauge({
  value,
  size = 60,
  stroke = 7,
  color = "#10B981",
  track = "#F1F5F9",
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
    </div>
  );
}

export default function AccountsStatus() {
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileBreakdown, setMobileBreakdown] = useState(null);
  const [bankBreakdown, setBankBreakdown] = useState(null);
  const [period, setPeriod] = useState("daily");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeLabel, setRangeLabel] = useState("This Month");
  const [txnSearch, setTxnSearch] = useState("");
  const [txnFilterOpen, setTxnFilterOpen] = useState(false);
  const [txnTypeFilter, setTxnTypeFilter] = useState("");
  const [breakdownTab, setBreakdownTab] = useState("bank");

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(todayStr.slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = () => {
    setRefreshing(true);
    return axios
      .get(API_URL)
      .then((res) => {
        setAccounts(res.data);
        setMobileBreakdown(res.data.mobileBankingBreakdown || null);
        setBankBreakdown(res.data.bankBreakdown || null);
        setLastUpdated(new Date());
      })
      .catch(() =>
        setAccounts(
          (prev) =>
            prev || {
              balance: 0,
              totalIncome: 0,
              totalExpense: 0,
              transactions: [],
            },
        ),
      )
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!rangeOpen && !txnFilterOpen) return;
    const close = () => {
      setRangeOpen(false);
      setTxnFilterOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [rangeOpen, txnFilterOpen]);

  const txns = useMemo(
    () =>
      (accounts?.transactions || []).map((t) => ({
        ...t,
        date: t.date || dateOnly(t.datetime),
        method: t.method || "cash",
      })),
    [accounts],
  );

  const dayStats = useMemo(
    () => calcStats(txns, selectedDate, selectedDate),
    [txns, selectedDate],
  );
  const monthStats = useMemo(
    () => calcStats(txns, selectedMonth + "-01", selectedMonth + "-31"),
    [txns, selectedMonth],
  );
  const yearStats = useMemo(
    () => calcStats(txns, `${selectedYear}-01-01`, `${selectedYear}-12-31`),
    [txns, selectedYear],
  );

  const hourlyChart = useMemo(
    () => buildHourly(txns, selectedDate),
    [txns, selectedDate],
  );
  const dailyChart = useMemo(
    () => buildDailyForMonth(txns, selectedMonth),
    [txns, selectedMonth],
  );
  const monthlyChart = useMemo(
    () => buildMonthlyForYear(txns, selectedYear),
    [txns, selectedYear],
  );

  const byMethod = useMemo(() => methodBreakdown(txns), [txns]);

  const topIncome = useMemo(() => {
    const m = {};
    txns
      .filter((t) => t.type === "income" && t.date.startsWith(selectedMonth))
      .forEach((t) => {
        m[t.category] = (m[t.category] || 0) + t.amount;
      });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [txns, selectedMonth]);

  const topExpense = useMemo(() => {
    const m = {};
    txns
      .filter((t) => t.type === "expense" && t.date.startsWith(selectedMonth))
      .forEach((t) => {
        m[t.category] = (m[t.category] || 0) + t.amount;
      });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [txns, selectedMonth]);

  const recent = useMemo(
    () =>
      [...txns]
        .sort((a, b) =>
          (b.datetime || b.date).localeCompare(a.datetime || a.date),
        )
        .slice(0, 25),
    [txns],
  );

  const filteredRecent = useMemo(
    () =>
      recent
        .filter((t) => {
          const matchesSearch =
            !txnSearch ||
            t.description?.toLowerCase().includes(txnSearch.toLowerCase()) ||
            t.category?.toLowerCase().includes(txnSearch.toLowerCase()) ||
            t.addedBy?.toLowerCase().includes(txnSearch.toLowerCase());
          const matchesType = !txnTypeFilter || t.type === txnTypeFilter;
          return matchesSearch && matchesType;
        })
        .slice(0, 8),
    [recent, txnSearch, txnTypeFilter],
  );

  const forecastData = useMemo(() => buildForecast(txns), [txns]);

  const growthRate = useMemo(() => {
    const now = new Date();
    const thisM = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevM = `${prevD.getFullYear()}-${pad2(prevD.getMonth() + 1)}`;
    const thisIncome = txns
      .filter((t) => t.type === "income" && t.date.startsWith(thisM))
      .reduce((s, t) => s + t.amount, 0);
    const prevIncome = txns
      .filter((t) => t.type === "income" && t.date.startsWith(prevM))
      .reduce((s, t) => s + t.amount, 0);
    if (!prevIncome) return thisIncome > 0 ? 100 : 0;
    return Math.round(((thisIncome - prevIncome) / prevIncome) * 100);
  }, [txns]);

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const sevenAgo = new Date(now);
    sevenAgo.setDate(now.getDate() - 7);
    const fromStr = sevenAgo.toISOString().split("T")[0];
    return calcStats(txns, fromStr, todayStr);
  }, [txns]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-11 h-11 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const balance =
    accounts?.balance ??
    (accounts?.totalIncome ?? 0) - (accounts?.totalExpense ?? 0);
  const allIncome = accounts?.totalIncome || 0;
  const allExpense = accounts?.totalExpense || 0;
  const netProfit = allIncome - allExpense;
  const expenseRatio =
    allIncome > 0 ? Math.round((allExpense / allIncome) * 100) : 0;
  const healthScore = Math.max(0, Math.min(100, 100 - expenseRatio));
  const riskLevel =
    expenseRatio >= 80
      ? "High Risk"
      : expenseRatio >= 55
        ? "Moderate Risk"
        : "Low Risk";
  const riskColor =
    expenseRatio >= 80 ? "#EF4444" : expenseRatio >= 55 ? "#F59E0B" : "#10B981";

  const activeStats =
    period === "daily"
      ? dayStats
      : period === "monthly"
        ? monthStats
        : yearStats;
  const activeChart =
    period === "daily"
      ? hourlyChart
      : period === "monthly"
        ? dailyChart
        : monthlyChart;
  const showNetLine = period !== "daily";

  const exportCSV = () => {
    const rows = [
      [
        "Date",
        "Type",
        "Category",
        "Method",
        "Description",
        "Added By",
        "Amount",
      ],
    ];
    recent.forEach((t) =>
      rows.push([
        fmtDate(t.date),
        t.type,
        t.category,
        t.method,
        t.description,
        t.addedBy,
        t.amount,
      ]),
    );
    const csv = rows
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `account-report-${todayStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const data = buildReportData({
      reportPeriodLabel: rangeLabel,
      accounts,
      byMethod,
      bankBreakdown,
      mobileBreakdown,
      monthStats,
      topIncome,
      topExpense,
      txns,
      selectedMonth,
    });
    openPrintWindow(generateReportHTML(data));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="max-w-400mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ── Hero Header ── */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
              Account Overview
            </h1>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#10B981] text-xs font-semibold px-2.5 py-1 rounded-full">
                <FiActivity size={12} /> Financial Health Score: {healthScore}
              </span>
              <span className="text-[#94A3B8] text-xs">
                Last updated at {fmtTime(lastUpdated)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setRangeOpen((o) => !o)}
                className="flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold px-4 py-2.5 rounded-[10px] shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] hover:border-[#CBD5E1] transition"
              >
                <FiCalendar size={15} className="text-[#64748B]" /> {rangeLabel}{" "}
                <FiChevronDown size={14} className="text-[#64748B]" />
              </button>
              {rangeOpen && (
                <div className="absolute z-20 right-0 mt-2 w-40 bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] overflow-hidden">
                  {["This Month", "Last Month", "This Year", "All Time"].map(
                    (label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setRangeLabel(label);
                          const now = new Date();
                          if (label === "This Month") {
                            setPeriod("monthly");
                            setSelectedMonth(todayStr.slice(0, 7));
                          }
                          if (label === "Last Month") {
                            const d = new Date(
                              now.getFullYear(),
                              now.getMonth() - 1,
                              1,
                            );
                            setPeriod("monthly");
                            setSelectedMonth(
                              `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
                            );
                          }
                          if (label === "This Year") {
                            setPeriod("yearly");
                            setSelectedYear(now.getFullYear());
                          }
                          if (label === "All Time") {
                            setPeriod("yearly");
                            setSelectedYear(now.getFullYear());
                          }
                          setRangeOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F8FAFC] transition ${rangeLabel === label ? "text-[#3B82F6] font-semibold bg-blue-50" : "text-[#334155]"}`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold px-4 py-2.5 rounded-[10px] shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] hover:border-[#CBD5E1] transition"
            >
              <FiDownload size={15} className="text-[#64748B]" /> Export Report
            </button>

            <button
              type="button"
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold px-4 py-2.5 rounded-[10px] shadow-[0_4px_14px_-2px_rgba(15,23,42,0.3)] transition"
            >
              <FiDownload size={15} /> Download PDF
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={refreshing}
              className="flex items-center justify-center w-10 h-10 bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] hover:border-[#CBD5E1] transition disabled:opacity-60"
            >
              <FiRefreshCw
                size={15}
                className={`text-[#64748B] ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* ── KPI: 6 Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-6 sm:mb-8">
          <KpiCard
            label="Current Balance"
            value={fmt(balance)}
            trend={balance < 0 ? "Overdrawn" : "+1.5%"}
            trendUp={balance >= 0}
            valueClass={balance < 0 ? "text-red-600" : ""}
            sparkPoints="0,26 20,20 40,22 60,14 80,16 100,8 120,10"
            sparkColor={balance < 0 ? "#EF4444" : "#10B981"}
            sparkId="sparkBal"
          />
          <KpiCard
            label="Total Income"
            value={fmt(allIncome)}
            sub="Lifetime income"
            trend="+18.7%"
            trendUp
            sparkPoints="0,28 20,22 40,24 60,16 80,18 100,6 120,8"
            sparkColor="#10B981"
            sparkId="sparkInc"
          />
          <KpiCard
            label="Total Expense"
            value={fmt(allExpense)}
            sub="Lifetime expense"
            trend="+3.2%"
            trendUp={false}
            sparkPoints="0,10 20,18 40,14 60,24 80,20 100,28 120,24"
            sparkColor="#EF4444"
            sparkId="sparkExp"
          />
          <KpiCard
            label={netProfit >= 0 ? "Net Profit" : "Net Loss"}
            value={fmt(Math.abs(netProfit))}
            sub={netProfit >= 0 ? "Profit" : "Loss"}
            extra={
              <span
                className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${netProfit >= 0 ? "bg-emerald-50 text-[#10B981]" : "bg-red-50 text-[#EF4444]"}`}
              >
                {netProfit >= 0 ? "GOOD" : "REVIEW"}
              </span>
            }
          />
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
            <p className="text-[#64748B] text-sm font-medium">
              Monthly Cash Flow
            </p>
            <p className="text-[13px] text-[#0F172A] mt-1.5 font-semibold">
              Income {fmt(monthStats.income)} / Expense{" "}
              {fmt(monthStats.expense)}
            </p>
            <div className="flex items-end gap-1.5 h-10 mt-2">
              <div
                className="flex-1 bg-emerald-100 rounded-t"
                style={{
                  height: `${Math.min((monthStats.income / Math.max(monthStats.income, monthStats.expense, 1)) * 100, 100)}%`,
                }}
              />
              <div
                className="flex-1 bg-red-100 rounded-t"
                style={{
                  height: `${Math.min((monthStats.expense / Math.max(monthStats.income, monthStats.expense, 1)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
            <p className="text-[#64748B] text-sm font-medium">
              Transaction Count
            </p>
            <p className="text-[22px] sm:text-[24px] font-bold text-[#0F172A] mt-1.5 tracking-tight">
              {(accounts?.transactions?.length || 0).toLocaleString()}
            </p>
            <p className="text-[#94A3B8] text-[11px] mt-1">
              All-time transactions
            </p>
            <div className="flex items-end gap-0.5 h-6 mt-2">
              {monthlyChart.map((m, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-200 rounded-sm"
                  style={{
                    height: `${Math.max(m.income + m.expense > 0 ? 30 : 5, Math.min(((m.income + m.expense) / (allIncome + allExpense || 1)) * 400, 100))}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Account Breakdown ── */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FiCreditCard size={17} className="text-[#0F172A]" />
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
              Accounts
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(METHODS).map(([key, cfg]) => {
              const m = byMethod[key];
              const net = m.income - m.expense;
              const Icon = cfg.icon;
              return (
                <div
                  key={key}
                  className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex items-center gap-2 text-[#64748B] text-sm font-semibold">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}
                      >
                        <Icon size={16} className={cfg.text} />
                      </span>
                      {cfg.label}
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${net < 0 ? "text-red-600" : "text-[#0F172A]"}`}
                  >
                    {fmt(net)}
                    {net < 0 && (
                      <span className="ml-2 text-[10px] font-bold uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full align-middle">
                        Overdrawn
                      </span>
                    )}
                  </p>
                  <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex justify-between text-sm">
                    <span className="text-[#64748B]">In {fmt(m.income)}</span>
                    <span className="text-[#64748B]">Out {fmt(m.expense)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {(mobileBreakdown || bankBreakdown) && (
            <div className="mt-4 bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <p className="text-[#64748B] text-sm font-semibold">
                  {breakdownTab === "bank"
                    ? "Bank Breakdown"
                    : "Mobile Banking Breakdown"}
                </p>
                <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-lg p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setBreakdownTab("bank")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      breakdownTab === "bank"
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakdownTab("mobile")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      breakdownTab === "mobile"
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    Mobile Banking
                  </button>
                </div>
              </div>

              {breakdownTab === "bank" ? (
                bankBreakdown ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(bankBreakdown).map(([bankName, amt]) => (
                      <div
                        key={bankName}
                        className={`rounded-xl p-3 ${amt < 0 ? "bg-red-50" : "bg-blue-50"}`}
                      >
                        <p className="text-[#64748B] text-xs">{bankName}</p>
                        <p
                          className={`font-bold text-base sm:text-lg ${amt < 0 ? "text-red-600" : "text-[#3B82F6]"}`}
                        >
                          {fmt(amt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#94A3B8] text-sm text-center py-6">
                    No bank data available
                  </p>
                )
              ) : mobileBreakdown ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["bKash", "Nagad", "Rocket", "Upay"].map((p) => {
                    const val = mobileBreakdown[p] || 0;
                    const total = Object.values(mobileBreakdown).reduce(
                      (s, v) => s + Number(v || 0),
                      0,
                    );
                    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                    return (
                      <div
                        key={p}
                        className={`rounded-xl p-3 ${val < 0 ? "bg-red-50" : "bg-purple-50"}`}
                      >
                        <p className="text-[#64748B] text-xs">{p}</p>
                        <p
                          className={`font-bold text-base sm:text-lg ${val < 0 ? "text-red-600" : "text-[#8B5CF6]"}`}
                        >
                          {fmt(val)}
                        </p>
                        <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-[#8B5CF6] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[#94A3B8] mt-1">
                          {pct}% allocation
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#94A3B8] text-sm text-center py-6">
                  No mobile banking data available
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Main Grid: Smart Analytics + Right Widgets ── */}
        <div className="grid grid-cols-1 2xl:grid-cols-[1fr_360px] gap-5 sm:gap-6">
          <div className="space-y-6">
            {/* Smart Analytics Center */}
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
              <h2 className="text-lg font-bold text-[#0F172A] mb-4">
                Smart Analytics Center
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-xl p-1 w-fit flex-wrap">
                  {[
                    { key: "daily", label: "Daily Tracking", icon: FiSun },
                    {
                      key: "monthly",
                      label: "Monthly Summary",
                      icon: FiCalendar,
                    },
                    { key: "yearly", label: "Yearly Report", icon: FiActivity },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setPeriod(key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                        period === key
                          ? "bg-[#0F172A] text-white"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>

                {period === "daily" && (
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayStr}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#334155] font-medium bg-[#F8FAFC]"
                  />
                )}
                {period === "monthly" && (
                  <input
                    type="month"
                    value={selectedMonth}
                    max={todayStr.slice(0, 7)}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#334155] font-medium bg-[#F8FAFC]"
                  />
                )}
                {period === "yearly" && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#334155] font-medium bg-[#F8FAFC]"
                  >
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - i,
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                  label="Income"
                  value={activeStats.income}
                  tone="green"
                  sub={`${activeStats.count} transactions`}
                />
                <StatCard
                  label="Expense"
                  value={activeStats.expense}
                  tone="red"
                />
                <StatCard
                  label={activeStats.profit >= 0 ? "Net Profit" : "Net Loss"}
                  value={Math.abs(activeStats.profit)}
                  tone={activeStats.profit >= 0 ? "blue" : "orange"}
                />
              </div>

              <div className="h-72 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={activeChart}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${Math.round(v / 1000)}k` : v
                      }
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      barSize={period === "daily" ? 8 : 14}
                    />
                    <Bar
                      dataKey="expense"
                      name="Expense"
                      fill="#EF4444"
                      radius={[4, 4, 0, 0]}
                      barSize={period === "daily" ? 8 : 14}
                    />
                    {showNetLine && (
                      <Line
                        type="monotone"
                        dataKey="net"
                        name="Net Growth"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[#94A3B8] text-xs mt-3 text-center">
                {period === "daily" &&
                  "Hour-by-hour income vs. expense for the selected day"}
                {period === "monthly" &&
                  "Daily income vs. expense with cumulative growth for the selected month"}
                {period === "yearly" &&
                  "Monthly income vs. expense with cumulative growth for the selected year"}
              </p>
            </div>

            {/* Category Analytics */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiPieChart size={17} className="text-[#0F172A]" />
                <h2 className="text-lg font-bold text-[#0F172A]">
                  Category Analytics
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-2 mb-5">
                    <FiPieChart size={16} className="text-[#10B981]" />
                    <h3 className="text-base font-bold text-[#0F172A]">
                      Top Income Sources
                    </h3>
                    <span className="ml-auto text-xs text-[#94A3B8] font-medium">
                      {selectedMonth}
                    </span>
                  </div>
                  {topIncome.length === 0 ? (
                    <p className="text-[#94A3B8] text-sm text-center py-8">
                      No income this month
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {topIncome.map(([cat, val]) => {
                        const pct =
                          monthStats.income > 0
                            ? Math.round((val / monthStats.income) * 100)
                            : 0;
                        return (
                          <div key={cat}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-semibold text-[#334155]">
                                {cat}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-[#94A3B8]">
                                  {pct}%
                                </span>
                                <span className="text-sm font-bold text-[#10B981]">
                                  {fmt(val)}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-[#ECFDF5] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#10B981] rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-2 mb-5">
                    <FiPieChart size={16} className="text-[#EF4444]" />
                    <h3 className="text-base font-bold text-[#0F172A]">
                      Top Expense Categories
                    </h3>
                    <span className="ml-auto text-xs text-[#94A3B8] font-medium">
                      {selectedMonth}
                    </span>
                  </div>
                  {topExpense.length === 0 ? (
                    <p className="text-[#94A3B8] text-sm text-center py-8">
                      No expenses this month
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {topExpense.map(([cat, val]) => {
                        const pct =
                          monthStats.expense > 0
                            ? Math.round((val / monthStats.expense) * 100)
                            : 0;
                        return (
                          <div key={cat}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-semibold text-[#334155]">
                                {cat}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-[#94A3B8]">
                                  {pct}%
                                </span>
                                <span className="text-sm font-bold text-[#EF4444]">
                                  {fmt(val)}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-[#FEF2F2] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#EF4444] rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Transactions Center */}
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
              <div className="px-5 sm:px-6 py-5 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FiList size={17} className="text-[#0F172A]" />
                  <h2 className="text-base font-bold text-[#0F172A]">
                    Recent Transactions Center
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <FiSearch
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />
                    <input
                      value={txnSearch}
                      onChange={(e) => setTxnSearch(e.target.value)}
                      placeholder="Search transactions..."
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 w-44"
                    />
                  </div>
                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setTxnFilterOpen((o) => !o)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${
                        txnTypeFilter
                          ? "border-[#3B82F6] text-[#3B82F6] bg-blue-50"
                          : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <FiSliders size={13} /> Filter
                    </button>
                    {txnFilterOpen && (
                      <div className="absolute z-20 right-0 mt-2 w-40 bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] overflow-hidden">
                        {[
                          ["", "All Types"],
                          ["income", "Income"],
                          ["expense", "Expense"],
                        ].map(([v, l]) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setTxnTypeFilter(v);
                              setTxnFilterOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F8FAFC] transition ${txnTypeFilter === v ? "text-[#3B82F6] font-semibold bg-blue-50" : "text-[#334155]"}`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition"
                  >
                    <FiDownload size={13} /> Export
                  </button>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                      {[
                        "Date",
                        "Type",
                        "Category",
                        "Method",
                        "Description",
                        "Added By",
                        "Amount",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3.5 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredRecent.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-16 text-[#94A3B8] text-sm"
                        >
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredRecent.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-[#F8FAFC] transition"
                        >
                          <td className="px-5 py-4 text-sm text-[#64748B] whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <FiCalendar
                                size={12}
                                className="text-[#CBD5E1]"
                              />
                              {fmtDate(t.date)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${t.type === "income" ? "bg-emerald-50 text-[#10B981]" : "bg-red-50 text-[#EF4444]"}`}
                            >
                              {t.type === "income" ? (
                                <FiArrowUpRight size={11} />
                              ) : (
                                <FiArrowDownRight size={11} />
                              )}
                              {t.type === "income" ? "Income" : "Expense"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded-lg">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${METHODS[t.method]?.bg} ${METHODS[t.method]?.text}`}
                            >
                              {METHODS[t.method]?.label || t.method}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#334155] max-w-xs">
                            <span className="truncate block">
                              {t.description}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#64748B]">
                            {t.addedBy}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`text-sm font-bold ${t.type === "income" ? "text-[#10B981]" : "text-[#EF4444]"}`}
                            >
                              {t.type === "income" ? "+" : "-"}
                              {fmt(t.amount)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-[#F1F5F9]">
                {filteredRecent.length === 0 ? (
                  <p className="text-center text-[#94A3B8] text-sm py-10">
                    No transactions found
                  </p>
                ) : (
                  filteredRecent.map((t) => (
                    <div
                      key={t.id}
                      className="px-5 py-4 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-emerald-50" : "bg-red-50"}`}
                        >
                          {t.type === "income" ? (
                            <FiArrowUpRight
                              size={16}
                              className="text-[#10B981]"
                            />
                          ) : (
                            <FiArrowDownRight
                              size={16}
                              className="text-[#EF4444]"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">
                            {t.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-md font-medium">
                              {t.category}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${METHODS[t.method]?.bg} ${METHODS[t.method]?.text}`}
                            >
                              {METHODS[t.method]?.label}
                            </span>
                            <span className="text-[11px] text-[#94A3B8]">
                              {fmtDate(t.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-bold whitespace-nowrap ${t.type === "income" ? "text-[#10B981]" : "text-[#EF4444]"}`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {fmt(t.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Right: BI & AI Insights Widgets ── */}
          <div className="space-y-5">
            {/* Cash Flow Forecast */}
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-bold text-[#0F172A] mb-1">
                Cash Flow Forecast
              </p>
              <p className="text-[11px] text-[#94A3B8] mb-3">
                Next 3 months, based on 6-month average
              </p>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={forecastData}
                    margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="forecastFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3B82F6"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="net"
                      name="Net"
                      stroke="#3B82F6"
                      fill="url(#forecastFill)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Growth Rate */}
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] flex items-center gap-4">
              <CircularGauge
                value={Math.min(Math.abs(growthRate), 100)}
                color={growthRate >= 0 ? "#10B981" : "#EF4444"}
              />
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  Monthly Growth Rate
                </p>
                <p
                  className={`text-xl font-bold mt-0.5 ${growthRate >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
                >
                  {growthRate >= 0 ? "+" : ""}
                  {growthRate}%
                </p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Income vs last month
                </p>
              </div>
            </div>

            {/* Expense Risk Alert */}
            <div
              className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] flex items-start gap-3"
              style={{ borderColor: `${riskColor}33` }}
            >
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${riskColor}1A` }}
              >
                <FiAlertTriangle size={16} style={{ color: riskColor }} />
              </span>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  Expense Risk Alert
                </p>
                <p
                  className="text-xl font-bold mt-0.5"
                  style={{ color: riskColor }}
                >
                  {riskLevel}
                </p>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  Expenses are {expenseRatio}% of total income
                </p>
              </div>
            </div>

            {/* Top Performing Income Source */}
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <FiAward size={16} className="text-[#10B981]" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  Top Performing Income Source
                </p>
                {topIncome[0] ? (
                  <>
                    <p className="text-lg font-bold text-[#10B981] mt-0.5">
                      {topIncome[0][0]}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {fmt(topIncome[0][1])} this month
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    No income recorded this month
                  </p>
                )}
              </div>
            </div>

            {/* Largest Expense Category */}
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <FiTarget size={16} className="text-[#EF4444]" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  Largest Expense Category
                </p>
                {topExpense[0] ? (
                  <>
                    <p className="text-lg font-bold text-[#EF4444] mt-0.5">
                      {topExpense[0][0]}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {fmt(topExpense[0][1])} this month
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    No expenses recorded this month
                  </p>
                )}
              </div>
            </div>

            {/* Weekly Performance Snapshot */}
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-bold text-[#0F172A] mb-2">
                Weekly Performance Snapshot
              </p>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#64748B]">Income</span>
                <span className="font-bold text-[#10B981]">
                  {fmt(weeklyStats.income)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-[#64748B]">Expense</span>
                <span className="font-bold text-[#EF4444]">
                  {fmt(weeklyStats.expense)}
                </span>
              </div>
              <p
                className={`text-lg font-bold ${weeklyStats.profit >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
              >
                {weeklyStats.profit >= 0 ? "+" : ""}
                {fmt(weeklyStats.profit)}
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Net over last 7 days
              </p>
            </div>

            {/* AI Financial Insights Panel */}
            <div className="bg-linear-to-br from-blue-50 to-white border border-blue-100 rounded-[16px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center shadow-sm">
                  <FiCpu size={15} className="text-[#3B82F6]" />
                </span>
                <p className="text-sm font-bold text-[#0F172A]">
                  AI Financial Insights
                </p>
              </div>
              <ul className="space-y-2 text-xs text-[#475569] leading-relaxed">
                <li className="flex gap-2">
                  <FiZap
                    size={12}
                    className="text-[#3B82F6] mt-0.5 flex-shrink-0"
                  />
                  {expenseRatio >= 55
                    ? `Expenses are consuming ${expenseRatio}% of income — consider reviewing ${topExpense[0]?.[0] || "top categories"}.`
                    : "Spending is well within income — good balance maintained this month."}
                </li>
                <li className="flex gap-2">
                  <FiZap
                    size={12}
                    className="text-[#3B82F6] mt-0.5 flex-shrink-0"
                  />
                  {growthRate >= 0
                    ? `Income grew ${growthRate}% vs last month — momentum is positive.`
                    : `Income dropped ${Math.abs(growthRate)}% vs last month — worth investigating.`}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-center text-[#94A3B8] text-sm pt-6 pb-4">
          BuildMart Hardware — Account Overview
        </p>
      </div>
    </div>
  );
}
