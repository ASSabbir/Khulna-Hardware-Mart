// FILE: src/Pages/Products/ShopSourceHistory.jsx (NEW) — #22 shop-source history page UI

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  FiShoppingBag,
  FiCalendar,
  FiSearch,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiX,
  FiHome,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiHash,
  FiMapPin,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Pagination from "../../Components/Pagination";

const API_BASE = "http://localhost:5000/api/custom-product-sources";
const PAGE_LIMIT = 30;
const QUICK_FILTERS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "month", label: "This Month" },
];

const fmt = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 });
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const daysAgo = (d) =>
  Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));
const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "?";

const deriveStatus = (record) => {
  const age = daysAgo(record.date);
  if (age <= 7) return { label: "Processing", cls: "bg-blue-50 text-blue-600" };
  if (age <= 14) return { label: "Shipped", cls: "bg-amber-50 text-amber-600" };
  return { label: "Completed", cls: "bg-emerald-50 text-emerald-700" };
};

const sanitizeCsvCell = (val) => {
  const str = String(val ?? "");
  const escaped = str.replace(/"/g, '""');
  return /^[=+\-@]/.test(escaped) ? `'${escaped}` : escaped;
};

export default function ShopSourceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [shopFilter, setShopFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeQuick, setActiveQuick] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!selectedRecord) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedRecord(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedRecord]);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(API_BASE, {
        params: { page, limit: PAGE_LIMIT },
        signal: controller.signal,
        timeout: 15000,
      });
      setRecords(Array.isArray(res.data?.records) ? res.data.records : []);
      setTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      setTotalCount(
        Number(res.data?.pagination?.totalRecords) ||
          res.data?.records?.length ||
          0,
      );
    } catch (err) {
      if (axios.isCancel(err) || err.code === "ERR_CANCELED") return;
      setRecords([]);
      setError("Failed to load records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const applyQuickFilter = (key) => {
    const now = new Date();
    let from = null;
    if (key === "today")
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (key === "7d") from = new Date(Date.now() - 7 * 86400000);
    else if (key === "30d") from = new Date(Date.now() - 30 * 86400000);
    else if (key === "month")
      from = new Date(now.getFullYear(), now.getMonth(), 1);

    if (activeQuick === key) {
      setActiveQuick("");
      setDateFrom("");
      setDateTo("");
    } else {
      setActiveQuick(key);
      setDateFrom(from.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    }
  };

  const clearFilters = () => {
    setShopFilter("");
    setDateFrom("");
    setDateTo("");
    setActiveQuick("");
  };

  const filtered = useMemo(() => {
    const q = shopFilter.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;
    return records.filter((r) => {
      if (q && !r.shopName?.toLowerCase().includes(q)) return false;
      const t = new Date(r.date).getTime();
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    });
  }, [records, shopFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const shops = new Set();
    const products = new Set();
    let totalAmount = 0;
    let thisMonth = 0;
    const now = new Date();
    filtered.forEach((r) => {
      if (r.shopName) shops.add(r.shopName);
      if (r.productName) products.add(r.productName);
      totalAmount += Number(r.totalAmount || 0);
      const d = new Date(r.date);
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        thisMonth += Number(r.totalAmount || 0);
      }
    });
    return {
      totalShops: shops.size,
      totalProducts: products.size,
      totalAmount,
      thisMonth,
    };
  }, [filtered]);

  const topShops = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      if (!r.shopName) return;
      map.set(r.shopName, (map.get(r.shopName) || 0) + 1);
    });
    const list = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const max = list[0]?.[1] || 1;
    return list.map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / max) * 100),
    }));
  }, [filtered]);

  const spendingBreakdown = useMemo(() => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = dayLabels.map((day) => ({ day, amount: 0 }));
    filtered.forEach((r) => {
      const idx = new Date(r.date).getDay();
      buckets[idx].amount += Number(r.totalAmount || 0);
    });
    return [...buckets.slice(1), buckets[0]];
  }, [filtered]);

  const recentActivity = useMemo(() => {
    return [...filtered]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4)
      .map((r) => ({ ...r, status: deriveStatus(r) }));
  }, [filtered]);

  const handleExportCsv = () => {
    const headers = [
      "Shop",
      "Product",
      "Quantity",
      "Unit Price",
      "Total",
      "Date",
    ];
    const rows = filtered.map((r) => [
      r.shopName,
      r.productName,
      r.quantity,
      r.unitPrice,
      r.totalAmount,
      fmtDate(r.date),
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map(sanitizeCsvCell)
          .map((c) => `"${c}"`)
          .join(","),
      )
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shop-source-history-page-${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  const pageNumbers = useMemo(() => {
    const nums = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 3);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6">
      <div className=" mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main column */}
        <div className="lg:col-span-3 space-y-6 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                Custom Product — Shop Source History
              </h1>
              <p className="text-[#64748B] text-sm sm:text-base mt-1">
                Track which shop supplied which custom products
              </p>
            </div>
            <div className="relative w-full sm:w-[320px] shrink-0 rounded-2xl p-5 overflow-hidden bg-linear-to-br from-[#F59E0B] to-[#F97316] text-white shadow-lg">
              <div className="relative z-10">
                <p className="font-bold text-base">Sourcing Audit Log</p>
                <p className="text-white/85 text-xs mt-1 max-w-[200px]">
                  Detailed record of shop-to-shop inventory transfers.
                </p>
              </div>
              <FiShoppingBag
                className="absolute -right-2 -bottom-2 text-white/25"
                size={90}
              />
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<FiHome size={18} />}
              iconBg="bg-slate-100 text-slate-600"
              label="Total Shops"
              value={stats.totalShops}
              trend="up"
            />
            <KpiCard
              icon={<FiPackage size={18} />}
              iconBg="bg-blue-50 text-blue-600"
              label="Total Products"
              value={stats.totalProducts}
              trend="flat"
            />
            <KpiCard
              icon={<FiDollarSign size={18} />}
              iconBg="bg-amber-50 text-amber-600"
              label="Total Purchase Amount"
              value={fmt(stats.totalAmount)}
              trend="up"
              valueClass="text-[#F59E0B]"
            />
            <KpiCard
              icon={<FiCalendar size={18} />}
              iconBg="bg-blue-50 text-blue-600"
              label="This Month Purchases"
              value={fmt(stats.thisMonth)}
              tag="New metric"
            />
          </div>

          {/* Filter panel */}
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                value={shopFilter}
                maxLength={100}
                onChange={(e) => setShopFilter(e.target.value)}
                placeholder="Search shop name..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <FiCalendar className="text-gray-400" size={14} />
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setActiveQuick("");
                }}
                className="text-sm outline-none bg-transparent"
              />
              <span className="text-gray-300">–</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setActiveQuick("");
                }}
                className="text-sm outline-none bg-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => applyQuickFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    activeQuick === f.key
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200"
              >
                <FiX size={14} /> Clear Filters
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!filtered.length}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiDownload size={14} /> Export CSV
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              <FiAlertCircle size={16} /> {error}
            </div>
          )}

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-20 text-gray-400 gap-2">
                <FiLoader className="animate-spin" /> Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-400">
                No records found.
              </div>
            ) : (
              filtered.map((r) => {
                const status = deriveStatus(r);
                return (
                  <div
                    key={r._id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                          {initials(r.shopName)}
                        </div>
                        <span className="font-semibold text-gray-900 truncate">
                          {r.shopName}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                          <FiPackage size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {r.productName} (Custom)
                          </p>
                          <p className="text-xs text-gray-400">
                            SKU:{" "}
                            {String(r._id || "")
                              .slice(-4)
                              .padStart(3, "0") || "N/A"}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                        Qty {r.quantity} units
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Unit Price</p>
                        <p className="font-semibold text-gray-800">
                          {fmt(r.unitPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Total Amount</p>
                        <p className="font-bold text-amber-600">
                          {fmt(r.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Purchase Date</p>
                        <p className="font-semibold text-gray-800">
                          {fmtDate(r.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(r)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4">
            <p className="text-sm text-gray-500 order-2 sm:order-1">
              {filtered.length === 0
                ? `Showing 0 of ${totalCount} transfers`
                : `Showing ${(page - 1) * PAGE_LIMIT + 1}-${(page - 1) * PAGE_LIMIT + filtered.length} of ${totalCount} transfers`}
            </p>
            <div className="order-1 sm:order-2">
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={goToPage}
                accent="#2563EB"
              />
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!filtered.length}
              className="order-3 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-40"
            >
              <FiDownload size={14} /> Export
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6 min-w-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">
                Top Supplier Shops
              </h3>
              <span className="text-xs text-blue-600 font-semibold cursor-default">
                List view
              </span>
            </div>
            <div className="space-y-3">
              {topShops.length === 0 ? (
                <p className="text-xs text-gray-400">No data yet.</p>
              ) : (
                topShops.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      {initials(s.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.count} transaction{s.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <RingBadge pct={s.pct} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 text-sm">
              Spending Breakdown
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Clean spend over the last month
            </p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={spendingBreakdown}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#3B82F6"
                        stopOpacity={0.35}
                      />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `৳${v}`}
                  />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#spendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4">
              Recent Activity Timeline
            </h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-gray-400">No recent activity.</p>
              ) : (
                recentActivity.map((r, i) => (
                  <div key={r._id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          r.status.label === "Completed"
                            ? "bg-emerald-500"
                            : r.status.label === "Processing"
                              ? "bg-blue-500"
                              : "bg-amber-500"
                        }`}
                      />
                      {i !== recentActivity.length - 1 && (
                        <span className="w-px flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm text-gray-800 leading-snug">
                        {r.productName} (Custom){" "}
                        <span className="text-gray-500">
                          {r.status.label.toLowerCase()}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {daysAgo(r.date)} days ago
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedRecord && (
        <DetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}

function DetailsModal({ record, onClose }) {
  const status = deriveStatus(record);
  const sku =
    String(record._id || "")
      .slice(-4)
      .padStart(3, "0") || "N/A";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
          <h2
            id="details-modal-title"
            className="font-bold text-gray-900 text-base"
          >
            Purchase Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                {initials(record.shopName)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {record.shopName || "Unknown Shop"}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FiMapPin size={11} /> Supplier Shop
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${status.cls}`}
            >
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-500">
              <FiPackage size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {record.productName || "Unnamed Product"} (Custom)
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <FiHash size={10} /> SKU: {sku}
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
              Qty {record.quantity ?? 0} units
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailStat label="Unit Price" value={fmt(record.unitPrice)} />
            <DetailStat
              label="Total Amount"
              value={fmt(record.totalAmount)}
              accent
            />
            <DetailStat
              label="Quantity"
              value={`${record.quantity ?? 0} units`}
            />
            <DetailStat label="Purchase Date" value={fmtDate(record.date)} />
          </div>

          {record.note && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Note</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 break-words">
                {record.note}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 mb-1">Record ID</p>
            <p className="text-xs font-mono text-gray-500 break-all">
              {record._id || "N/A"}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value, accent = false }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p
        className={`text-sm font-bold truncate ${accent ? "text-amber-600" : "text-gray-800"}`}
      >
        {value}
      </p>
    </div>
  );
}

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  trend,
  tag,
  valueClass = "text-gray-900",
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium truncate">{label}</p>
        <div className="flex items-center gap-1.5">
          <p className={`text-base font-bold truncate ${valueClass}`}>
            {value}
          </p>
          {trend === "up" && (
            <FiTrendingUp className="text-emerald-500 shrink-0" size={14} />
          )}
          {tag && (
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
              {tag}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RingBadge({ pct }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className="shrink-0">
      <circle
        cx="17"
        cy="17"
        r={r}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth="4"
      />
      <circle
        cx="17"
        cy="17"
        r={r}
        fill="none"
        stroke="#F59E0B"
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 17 17)"
      />
    </svg>
  );
}
