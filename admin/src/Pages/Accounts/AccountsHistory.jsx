// FILE: src/Pages/Accounts/AccountsHistory.jsx (NEW) — #17

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiFilter,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiUpload,
  FiDownload,
  FiPrinter,
  FiChevronRight,
  FiHome,
  FiGrid,
  FiSearch,
  FiSliders,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiAlertTriangle,
  FiAward,
  FiZap,
  FiMoreVertical,
  FiArrowUpRight,
  FiArrowDownRight,
  FiEye,
} from "react-icons/fi";
import { openPrintWindow } from "../../Print/printUtils";
import { buildHistoryReportData } from "../../Print/history/buildHistoryReportData";
import { generateHistoryReportHTML } from "../../Print/history/historyReportTemplate";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const QUICK_RANGES = [
  { label: "Today", from: todayISO() },
  { label: "Last 5 days", from: daysAgoISO(5) },
  { label: "Last 10 days", from: daysAgoISO(10) },
  { label: "This Month", from: new Date().toISOString().slice(0, 8) + "01" },
];

const METHOD_STYLES = {
  cash: "bg-emerald-50 text-emerald-600",
  mobile: "bg-purple-50 text-purple-600",
  bank: "bg-blue-50 text-blue-600",
};

function DonutChart({ income, expense, size = 120, stroke = 16 }) {
  const total = income + expense || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const incomePct = income / total;
  const incomeLen = c * incomePct;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90 mx-auto"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#EF4444"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#3B82F6"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${incomeLen} ${c - incomeLen}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function HealthGauge({ value, size = 130 }) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = size / 2 - 12;
  const c = Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const angle = -90 + (clamped / 100) * 180;
  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size / 2 + 20 }}
    >
      <svg
        width={size}
        height={size / 2 + 10}
        viewBox={`0 0 ${size} ${size / 2 + 10}`}
      >
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path
          d={`M 12 ${size / 2} A ${r} ${r} 0 0 1 ${size - 12} ${size / 2}`}
          stroke="#F1F5F9"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M 12 ${size / 2} A ${r} ${r} 0 0 1 ${size - 12} ${size / 2}`}
          stroke="url(#gaugeGrad)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <line
          x1={size / 2}
          y1={size / 2}
          x2={size / 2 + (r - 14) * Math.cos((angle * Math.PI) / 180)}
          y2={size / 2 + (r - 14) * Math.sin((angle * Math.PI) / 180)}
          stroke="#0F172A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={size / 2} cy={size / 2} r="4" fill="#0F172A" />
      </svg>
    </div>
  );
}

function KpiIcon({ icon: Icon, bg, color }) {
  return (
    <span
      className={`w-8 h-8 rounded-full flex items-center justify-center ${bg}`}
    >
      <Icon size={14} className={color} />
    </span>
  );
}

function buildTxnPrintHTML(t) {
  const methodLabel =
    t.method === "mobile"
      ? `Mobile Banking (${t.provider || "—"})`
      : t.method === "bank"
        ? `Bank Transfer (${t.bankName || "—"})`
        : "Cash";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Transaction — ${t.description || ""}</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;padding:28px;color:#1E293B;}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-weight:800;font-size:12px;text-transform:uppercase;}
    table{width:100%;border-collapse:collapse;margin-top:16px;}
    td{padding:8px 6px;border-bottom:1px solid #E2E8F0;font-size:13px;}
    td:first-child{color:#64748B;font-weight:600;width:40%;}
    td:last-child{color:#0F172A;font-weight:700;text-align:right;}
  </style></head><body>
    <h2 style="color:#1E3A8A;margin-bottom:2px;">Khulna Hardware Mart</h2>
    <p style="color:#94A3B8;margin-top:0;">Transaction Record</p>
    <span class="badge" style="background:${t.type === "income" ? "#DCFCE7" : "#FEE2E2"};color:${t.type === "income" ? "#16A34A" : "#EF4444"};">
      ${t.type === "income" ? "Income" : "Expense"}
    </span>
    <table>
      <tr><td>Category</td><td>${t.category || "—"}</td></tr>
      <tr><td>Amount</td><td>${fmt(t.amount)}</td></tr>
      <tr><td>Payment Method</td><td>${methodLabel}</td></tr>
      <tr><td>Description</td><td>${t.description || "—"}</td></tr>
      <tr><td>Added By</td><td>${t.addedBy || "—"}</td></tr>
      <tr><td>Date</td><td>${fmtDate(t.date)}</td></tr>
      <tr><td>Recorded At</td><td>${t.datetime ? new Date(t.datetime).toLocaleString("en-GB") : "—"}</td></tr>
    </table>
  </body></html>`;
}

function TxnDetailModal({ t, onClose }) {
  if (!t) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
          <h2 className="text-lg font-bold text-[#0F172A]">
            Transaction Details
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openPrintWindow(buildTxnPrintHTML(t))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#16296B] text-white rounded-lg text-xs font-bold"
            >
              <FiPrinter size={13} /> Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F1F5F9] rounded-lg"
            >
              <span className="text-[#64748B]">✕</span>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-3 text-sm">
          {[
            ["Type", t.type === "income" ? "Income" : "Expense"],
            ["Category", t.category],
            ["Amount", fmt(t.amount)],
            [
              "Method",
              t.method === "mobile"
                ? `Mobile Banking (${t.provider || "—"})`
                : t.method === "bank"
                  ? `Bank (${t.bankName || "—"})`
                  : "Cash",
            ],
            ["Description", t.description || "—"],
            ["Added By", t.addedBy || "—"],
            ["Date", fmtDate(t.date)],
            [
              "Recorded At",
              t.datetime ? new Date(t.datetime).toLocaleString("en-GB") : "—",
            ],
          ].map(([label, val]) => (
            <div
              key={label}
              className="flex justify-between gap-3 border-b border-[#F8FAFC] pb-2"
            >
              <span className="text-[#94A3B8] font-semibold">{label}</span>
              <span className="text-[#0F172A] font-bold text-right">{val}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-[#0F172A] text-white font-bold py-3 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountsHistory() {
  const [txns, setTxns] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [activeQuick, setActiveQuick] = useState("");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (type) params.append("type", type);
    axios
      .get(`http://localhost:5000/api/ledger?${params}`)
      .then((res) => setTxns(res.data.transactions || []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [from, to, type]); // eslint-disable-line

  const totals = useMemo(() => {
    const income = txns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = txns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [txns]);

  const healthScore = useMemo(() => {
    const total = totals.income + totals.expense;
    if (!total) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round((totals.income / total) * 100)),
    );
  }, [totals]);

  const filteredSorted = useMemo(() => {
    let list = txns.filter(
      (t) =>
        !search ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.toLowerCase().includes(search.toLowerCase()),
    );
    list = [...list].sort((a, b) =>
      sortDir === "desc"
        ? (b.date || "").localeCompare(a.date || "")
        : (a.date || "").localeCompare(b.date || ""),
    );
    return list;
  }, [txns, search, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));

  const exportCSV = () => {
    const rows = [
      ["Date", "Type", "Category", "Method", "Description", "Amount"],
    ];
    filteredSorted.forEach((t) =>
      rows.push([
        fmtDate(t.date),
        t.type,
        t.category,
        t.method,
        t.description,
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
    a.download = `expense-history-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printHistory = () => {
    const data = buildHistoryReportData({ txns: filteredSorted, from, to });
    openPrintWindow(generateHistoryReportHTML(data));
  };

  const topCategory = useMemo(() => {
    const m = {};
    txns.forEach((t) => {
      m[t.category] = (m[t.category] || 0) + t.amount;
    });
    const arr = Object.entries(m).sort((a, b) => b[1] - a[1]);
    return arr[0]?.[0] || "—";
  }, [txns]);

  const highestTxn = useMemo(() => {
    if (!txns.length) return 0;
    return Math.max(...txns.map((t) => t.amount || 0));
  }, [txns]);

  const dailyAvg = useMemo(() => {
    const days = new Set(txns.map((t) => t.date)).size || 1;
    return (totals.income + totals.expense) / days;
  }, [txns, totals]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="max-w-425 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#94A3B8] font-medium mb-4">
          <FiHome size={13} /> Home <FiChevronRight size={12} /> ERP{" "}
          <FiChevronRight size={12} />
          <span className="text-[#0F172A] font-bold">
            Money &amp; Expense History
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight">
              Money &amp; Expense History
            </h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              Complete financial transaction records and analytics
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-bold px-4 py-2.5 rounded-full shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)] hover:border-[#CBD5E1] transition"
            >
              <FiCalendar size={15} className="text-[#64748B]" />{" "}
              {from
                ? fmtDate(from)
                : "Current " +
                  new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-[0_4px_14px_-2px_rgba(124,58,237,0.35)] transition"
            >
              <FiUpload size={15} /> Export Report
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-bold px-4 py-2.5 rounded-full shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)] hover:border-[#CBD5E1] transition"
            >
              <FiDownload size={15} className="text-[#64748B]" /> Download Excel
            </button>
            <button
              type="button"
              onClick={printHistory}
              className="flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-bold px-4 py-2.5 rounded-full shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)] hover:border-[#CBD5E1] transition"
            >
              <FiPrinter size={15} className="text-[#64748B]" /> Print History
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 2xl:grid-cols-[1fr_340px] gap-5 sm:gap-6">
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-[#ECFDF5] border border-emerald-100 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[#065F46] text-sm font-bold">
                    Total Income
                  </p>
                  <KpiIcon
                    icon={FiTrendingUp}
                    bg="bg-white/70"
                    color="text-emerald-600"
                  />
                </div>
                <p className="text-2xl font-extrabold text-[#0F172A] mt-2">
                  {fmt(totals.income)}
                </p>
                <p className="text-emerald-600 text-xs font-bold mt-1 flex items-center gap-1">
                  <FiArrowUpRight size={12} /> 12.5%
                </p>
              </div>
              <div className="bg-[#FEF2F2] border border-red-100 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[#991B1B] text-sm font-bold">
                    Total Expense
                  </p>
                  <KpiIcon
                    icon={FiTrendingDown}
                    bg="bg-white/70"
                    color="text-red-500"
                  />
                </div>
                <p className="text-2xl font-extrabold text-[#0F172A] mt-2">
                  {fmt(totals.expense)}
                </p>
                <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                  <FiArrowDownRight size={12} /> 3.1%
                </p>
              </div>
              <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-[#64748B] text-sm font-bold">
                    Net Cash Flow
                  </p>
                  <KpiIcon
                    icon={FiActivity}
                    bg="bg-blue-50"
                    color="text-blue-600"
                  />
                </div>
                <p
                  className={`text-2xl font-extrabold mt-2 ${totals.net >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
                >
                  {totals.net >= 0 ? "+" : ""}
                  {fmt(totals.net)}
                </p>
                <p className="text-[#94A3B8] text-xs mt-1">
                  Dynamic color state
                </p>
              </div>
              <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-[#64748B] text-sm font-bold">
                    Transaction Count
                  </p>
                  <KpiIcon
                    icon={FiZap}
                    bg="bg-[#F1F5F9]"
                    color="text-[#0F172A]"
                  />
                </div>
                <p className="text-2xl font-extrabold text-[#0F172A] mt-2">
                  {txns.length.toLocaleString()}
                </p>
                <p className="text-[#94A3B8] text-xs mt-1">Activity</p>
              </div>
            </div>

            {/* Smart Filter Center */}
            <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
              <h2 className="text-base font-extrabold text-[#0F172A] mb-4">
                Smart Filter Center
              </h2>

              <div className="flex flex-wrap gap-2 mb-5">
                {QUICK_RANGES.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => {
                      setFrom(r.from);
                      setTo("");
                      setActiveQuick(r.label);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                      activeQuick === r.label
                        ? "bg-[#DBEAFE] border-[#93C5FD] text-[#1D4ED8]"
                        : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">
                    Date range
                  </label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <FiCalendar className="text-[#94A3B8]" size={15} />
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => {
                        setFrom(e.target.value);
                        setActiveQuick("");
                        setPage(1);
                      }}
                      className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm w-full bg-[#F8FAFC]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">
                    To
                  </label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setActiveQuick("");
                      setPage(1);
                    }}
                    className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm w-full bg-[#F8FAFC] mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">
                    Transaction Type
                  </label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <FiFilter className="text-[#94A3B8]" size={15} />
                    <select
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value);
                        setPage(1);
                      }}
                      className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm w-full bg-[#F8FAFC]"
                    >
                      <option value="">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide">
                    Search
                  </label>
                  <div className="relative mt-1.5">
                    <FiSearch
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search transactions"
                      className="border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-2 text-sm w-full bg-[#F8FAFC]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Insight strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="bg-white border border-[#F1F5F9] rounded-2xl p-4 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">
                  Income vs Expense
                </p>
                <div className="h-1.5 bg-[#FEF2F2] rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-[#10B981] rounded-full"
                    style={{
                      width: `${(totals.income / (totals.income + totals.expense || 1)) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs font-bold text-[#0F172A] mt-1.5">
                  {Math.round(
                    (totals.income / (totals.income + totals.expense || 1)) *
                      100,
                  )}
                  % ratio
                </p>
              </div>
              <div className="bg-white border border-[#F1F5F9] rounded-2xl p-4 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">
                  Cash Flow
                </p>
                <p
                  className={`text-sm font-extrabold mt-2 ${totals.net >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
                >
                  {totals.net >= 0 ? "+" : ""}
                  {fmt(totals.net)}
                </p>
              </div>
              <div className="bg-white border border-[#F1F5F9] rounded-2xl p-4 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">
                  Highest Transaction
                </p>
                <p className="text-sm font-extrabold text-[#0F172A] mt-2">
                  {fmt(highestTxn)}
                </p>
              </div>
              <div className="bg-white border border-[#F1F5F9] rounded-2xl p-4 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">
                  Most Active Category
                </p>
                <p className="text-sm font-extrabold text-[#0F172A] mt-2 truncate">
                  {topCategory}
                </p>
              </div>
              <div className="bg-[#EFF6FF] border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-blue-500 uppercase">
                    Daily Average
                  </p>
                  <p className="text-sm font-extrabold text-[#0F172A] mt-2">
                    {fmt(Math.round(dailyAvg))}
                  </p>
                </div>
                <FiChevronRight size={16} className="text-blue-400 shrink-0" />
              </div>
            </div>

            {/* Transaction History table */}
            <div className="bg-white border border-[#F1F5F9] rounded-2xl overflow-hidden shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
              <div className="px-5 sm:px-6 py-5 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  Transaction History
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <FiSearch
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search"
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-full pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 w-40"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
                    }
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition"
                  >
                    {sortDir === "desc" ? (
                      <FiArrowDown size={13} />
                    ) : (
                      <FiArrowUp size={13} />
                    )}{" "}
                    Sort
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition"
                  >
                    <FiSliders size={13} /> Filter
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
                        "Transaction Type",
                        "Category",
                        "Payment Method",
                        "Description",
                        "Amount",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3.5 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-16 text-[#94A3B8] text-sm"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : paged.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-16 text-[#94A3B8] text-sm"
                        >
                          No entries found.
                        </td>
                      </tr>
                    ) : (
                      paged.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-[#F8FAFC] transition"
                        >
                          <td className="px-5 py-4 text-sm text-[#64748B] whitespace-nowrap">
                            {fmtDate(t.date)}
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
                            <span className="text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded-full">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${METHOD_STYLES[t.method] || "bg-[#F1F5F9] text-[#475569]"}`}
                            >
                              {t.method}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#334155] max-w-xs">
                            <span className="truncate block">
                              {t.description}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`text-sm font-bold ${t.type === "income" ? "text-[#10B981]" : "text-[#EF4444]"}`}
                            >
                              {t.type === "income" ? "+" : "-"}
                              {fmt(t.amount)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => setSelectedTxn(t)}
                              className="text-[#94A3B8] hover:text-[#0F172A] transition"
                              title="View details"
                            >
                              <FiEye size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-[#F1F5F9]">
                {loading ? (
                  <p className="text-center text-[#94A3B8] text-sm py-10">
                    Loading...
                  </p>
                ) : paged.length === 0 ? (
                  <p className="text-center text-[#94A3B8] text-sm py-10">
                    No entries found.
                  </p>
                ) : (
                  paged.map((t) => (
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
                            <span className="text-[11px] bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full font-medium">
                              {t.category}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${METHOD_STYLES[t.method] || "bg-[#F1F5F9] text-[#475569]"}`}
                            >
                              {t.method}
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

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-[#F1F5F9]">
                <p className="text-xs text-[#94A3B8] font-medium">
                  Showing {paged.length ? (page - 1) * pageSize + 1 : 0}-
                  {(page - 1) * pageSize + paged.length} of{" "}
                  {filteredSorted.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC]"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC]"
                  >
                    ‹
                  </button>
                  <span className="w-8 h-8 rounded-lg bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center">
                    {page}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC]"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(totalPages)}
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC]"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Premium Analytics ── */}
          <div className="space-y-5">
            <h2 className="text-lg font-extrabold text-[#0F172A]">
              Premium Analytics
            </h2>

            <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-bold text-[#0F172A]">
                Recent Financial Activity
              </p>
              <p className="text-[11px] text-[#94A3B8] mb-3">Breakdown</p>
              <DonutChart income={totals.income} expense={totals.expense} />
              <div className="flex items-center justify-center gap-4 mt-3 text-xs font-semibold text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Expense
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-bold text-[#0F172A] mb-2">
                Financial Health Score
              </p>
              <HealthGauge value={healthScore} />
              <p className="text-center text-xl font-extrabold text-[#0F172A] -mt-1">
                {healthScore}
              </p>
            </div>

            <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-bold text-[#0F172A] mb-3">
                Cash Flow Summary
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B] font-medium">
                    Income source
                  </span>
                  <span className="font-bold text-[#0F172A]">
                    {fmt(totals.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B] font-medium">Expense</span>
                  <span className="font-bold text-[#EF4444]">
                    -{fmt(totals.expense)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#F1F5F9]">
                  <span className="text-[#64748B] font-medium">Cash Flow</span>
                  <span
                    className={`font-bold ${totals.net >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
                  >
                    {totals.net >= 0 ? "+" : ""}
                    {fmt(totals.net)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-bold text-[#0F172A] mb-3">
                Smart Insights
              </p>
              <div className="space-y-2.5">
                <div className="bg-[#ECFDF5] rounded-xl p-3 flex items-start gap-2">
                  <FiAward
                    size={14}
                    className="text-[#10B981] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#065F46]">
                      Highest income source
                    </p>
                    <p className="text-[11px] text-emerald-700/70">
                      {topCategory}
                    </p>
                  </div>
                </div>
                <div className="bg-[#FEF2F2] rounded-xl p-3 flex items-start gap-2">
                  <FiTrendingDown
                    size={14}
                    className="text-[#EF4444] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#991B1B]">
                      Largest expense category
                    </p>
                    <p className="text-[11px] text-red-700/70">{topCategory}</p>
                  </div>
                </div>
                <div className="bg-[#FFFBEB] rounded-xl p-3 flex items-start gap-2">
                  <FiAlertTriangle
                    size={14}
                    className="text-[#F59E0B] mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#92400E]">
                      Spending warning
                    </p>
                    <p className="text-[11px] text-amber-700/70">
                      Should be monitored — professional review recommended
                    </p>
                  </div>
                </div>
                <div className="bg-[#EFF6FF] rounded-xl p-3 flex items-start gap-2">
                  <FiZap size={14} className="text-[#3B82F6] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#1D4ED8]">
                      Revenue growth status
                    </p>
                    <p className="text-[11px] text-blue-700/70">
                      Growth state within professional valuation range
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TxnDetailModal t={selectedTxn} onClose={() => setSelectedTxn(null)} />
    </div>
  );
}
