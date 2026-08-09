import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  FiCheckCircle, FiSearch, FiCalendar, FiUser, FiPhone, FiFileText, FiDollarSign,
  FiSmartphone, FiCreditCard, FiLoader, FiPrinter, FiEye, FiX, FiRefreshCw, FiDownload,
  FiTrendingUp, FiTrendingDown, FiPercent, FiInbox, FiUsers, FiActivity, FiChevronLeft,
  FiChevronRight, FiPackage, FiFilter, FiClock, FiHash,
} from "react-icons/fi";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import InvoicePreviewModalEye from "./InvoicePreviewModalEye";
import { buildInvoiceReceiptHTML } from "../../Print/invoiceReceiptTemplate";
import { buildChallanHTML } from "../../Print/challanTemplate";
import { openPrintWindow } from "../../Print/printUtils";
import Pagination from "../../Components/Pagination";

const API_BASE = "http://localhost:5000/api/invoices";
const PAGE_LIMIT = 20;

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (d) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const daysAgo = (d) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";

const METHOD_ICON = { cash: FiDollarSign, mobile: FiSmartphone, bank: FiCreditCard };
const QUICK_FILTERS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

const sanitizeCsvCell = (val) => {
  const str = String(val ?? "");
  const escaped = str.replace(/"/g, '""');
  return /^[=+\-@]/.test(escaped) ? `'${escaped}` : escaped;
};

function PaymentDetailsModal({ invoice, onClose }) {
  const payments = invoice.payments || [];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Payment Details</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{invoice.invoiceNumber} · {invoice.customer?.name || "Unknown"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg shrink-0" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {payments.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No transaction records found.</div>
          ) : (
            payments.map((p, i) => {
              const Icon = METHOD_ICON[p.method] || FiDollarSign;
              return (
                <div key={i} className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 shrink-0 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {p.method === "mobile" ? p.provider : p.method === "bank" ? "Bank Transfer" : "Cash"}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <FiClock size={10} /> {p.date || p.createdAt ? fmtDateTime(p.date || p.createdAt) : "Date unavailable"}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600 text-sm shrink-0">{fmt(p.amount)}</span>
                  </div>
                  {(p.transactionId || p.collectedBy) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 pl-12">
                      {p.transactionId && <span className="flex items-center gap-1"><FiHash size={10} /> {p.transactionId}</span>}
                      {p.collectedBy && <span className="flex items-center gap-1"><FiUser size={10} /> {p.collectedBy}</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div className="flex justify-between text-sm font-bold pt-3 border-t border-gray-100">
            <span className="text-gray-500">Grand Total</span>
            <span className="text-emerald-600">{fmt(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaidInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeQuick, setActiveQuick] = useState("");
  const [eyeId, setEyeId] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams({ page, limit: PAGE_LIMIT, paymentStatus: "paid" });
      if (search.trim()) params.append("search", search.trim());
      const res = await axios.get(`${API_BASE}?${params}`, { signal: controller.signal, timeout: 15000 });
      setInvoices(Array.isArray(res.data?.invoices) ? res.data.invoices : []);
      setTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      setTotal(Number(res.data?.pagination?.total) || 0);
    } catch (err) {
      if (axios.isCancel(err) || err.code === "ERR_CANCELED") return;
      setInvoices([]);
      setErrorMsg("Failed to load paid invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchData(); return () => abortRef.current?.abort(); }, [fetchData]);

  const printInvoice = (inv) => openPrintWindow(buildInvoiceReceiptHTML(inv));

  const filteredInvoices = useMemo(() => {
    if (!activeQuick) return invoices;
    const now = new Date();
    return invoices.filter((inv) => {
      const d = new Date(inv.invoiceDate);
      if (activeQuick === "today") return d.toDateString() === now.toDateString();
      if (activeQuick === "7d") return daysAgo(inv.invoiceDate) <= 7;
      if (activeQuick === "30d") return daysAgo(inv.invoiceDate) <= 30;
      if (activeQuick === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (activeQuick === "year") return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [invoices, activeQuick]);

  const stats = useMemo(() => {
    const grandTotalSum = filteredInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const now = new Date();
    const todaySum = filteredInvoices
      .filter((i) => new Date(i.invoiceDate).toDateString() === now.toDateString())
      .reduce((s, i) => s + (i.grandTotal || 0), 0);
    const monthSum = filteredInvoices
      .filter((i) => { const d = new Date(i.invoiceDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, i) => s + (i.grandTotal || 0), 0);
    const avgInvoice = filteredInvoices.length ? grandTotalSum / filteredInvoices.length : 0;
    return { grandTotalSum, todaySum, monthSum, avgInvoice, count: filteredInvoices.length };
  }, [filteredInvoices]);

  const topCustomers = useMemo(() => {
    const map = new Map();
    filteredInvoices.forEach((inv) => {
      const key = inv.customer?.phone || inv.customer?.name || "unknown";
      const prev = map.get(key) || { name: inv.customer?.name || "Unknown", phone: inv.customer?.phone || "—", revenue: 0, count: 0 };
      prev.revenue += inv.grandTotal || 0;
      prev.count += 1;
      map.set(key, prev);
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  }, [filteredInvoices]);

  const revenueTrend = useMemo(() => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = dayLabels.map((day) => ({ day, revenue: 0 }));
    filteredInvoices.forEach((inv) => {
      const idx = new Date(inv.invoiceDate).getDay();
      buckets[idx].revenue += inv.grandTotal || 0;
    });
    return [...buckets.slice(1), buckets[0]];
  }, [filteredInvoices]);

  const recentActivity = useMemo(() => {
    const events = [];
    filteredInvoices.forEach((inv) => {
      (inv.payments || []).forEach((p, i) => {
        events.push({
          key: `${inv._id}-${i}`,
          invoiceNumber: inv.invoiceNumber,
          method: p.method,
          provider: p.provider,
          amount: p.amount,
          date: p.date || p.createdAt || inv.updatedAt || inv.invoiceDate,
        });
      });
    });
    return events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [filteredInvoices]);

  const handleExportCsv = () => {
    const headers = ["Invoice #", "Date", "Customer", "Phone", "Items", "Subtotal", "Discount", "VAT", "Grand Total"];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber, fmtDate(inv.invoiceDate), inv.customer?.name || "Unknown", inv.customer?.phone || "",
      inv.items?.length || 0, inv.subtotal, inv.discount, inv.vat, inv.grandTotal,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(sanitizeCsvCell).map((c) => `"${c}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paid-invoices-page-${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setSearch(""); setActiveQuick(""); };
  const goToPage = (p) => { if (p < 1 || p > totalPages || p === page) return; setPage(p); };
  const pageNumbers = useMemo(() => {
    const nums = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 3);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 xl:col-span-9 space-y-6 min-w-0">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Paid Invoice Management</h1>
              <p className="text-slate-500 text-sm sm:text-base mt-1 max-w-xl">
                Manage and analyze all fully paid invoices with payment tracking and financial reporting.
              </p>
            </div>
            <div className="relative w-full sm:w-[300px] shrink-0 rounded-2xl p-5 overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg">
              <div className="relative z-10 space-y-1">
                <p className="text-white/80 text-xs font-semibold">Financial Overview</p>
                <p className="text-2xl font-extrabold">{fmt(stats.grandTotalSum)}</p>
                <p className="text-xs text-white/90 pt-1">{stats.count.toLocaleString()} paid invoices</p>
              </div>
              <FiCheckCircle className="absolute -right-3 -bottom-3 text-white/20" size={90} />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard icon={<FiFileText size={18} />} iconBg="bg-emerald-50 text-emerald-600" label="Total Paid Invoices" value={total.toLocaleString()} trend="up" />
            <KpiCard icon={<FiDollarSign size={18} />} iconBg="bg-emerald-50 text-emerald-600" label="Total Revenue Collected" value={fmt(stats.grandTotalSum)} trend="up" />
            <KpiCard icon={<FiCalendar size={18} />} iconBg="bg-slate-100 text-slate-600" label="Today's Collection" value={fmt(stats.todaySum)} trend="flat" />
            <KpiCard icon={<FiTrendingUp size={18} />} iconBg="bg-slate-100 text-slate-600" label="Monthly Collection" value={fmt(stats.monthSum)} trend="up" />
            <KpiCard icon={<FiPackage size={18} />} iconBg="bg-slate-100 text-slate-600" label="Average Invoice Value" value={fmt(stats.avgInvoice)} trend="flat" />
            <KpiCard icon={<FiPercent size={18} />} iconBg="bg-emerald-50 text-emerald-600" label="Collection Growth" value={stats.count ? "Active" : "—"} trend="up" />
          </div>

          <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                maxLength={100}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, phone, or invoice number..."
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveQuick((prev) => (prev === f.key ? "" : f.key))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                    activeQuick === f.key ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <FiFilter size={11} /> {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200"
              >
                <FiX size={14} /> Clear
              </button>
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 disabled:opacity-40"
              >
                <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!filteredInvoices.length}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40"
              >
                <FiDownload size={14} /> Export Reports
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse space-y-3">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              ))
            ) : filteredInvoices.length === 0 ? (
              <div className="col-span-full bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <FiInbox size={26} />
                </div>
                <p className="font-bold text-slate-800">No paid invoices found for this filter</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const lastPayment = (inv.payments || [])[inv.payments.length - 1];
                return (
                  <div key={inv._id} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                          {initials(inv.customer?.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                            <FiFileText size={13} className="text-slate-300 shrink-0" /> {inv.invoiceNumber}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1"><FiUser size={11} /> {inv.customer?.name || "Unknown"}</span>
                            <span className="flex items-center gap-1"><FiPhone size={11} /> {inv.customer?.phone || "—"}</span>
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-100/60 text-emerald-700 text-xs font-bold border border-emerald-200">
                        Fully Paid
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1"><FiCalendar size={11} /> {fmtDate(inv.invoiceDate)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{inv.items?.length || 0} Items</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Subtotal</p>
                        <p className="font-semibold text-slate-800">{fmt(inv.subtotal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Discount</p>
                        <p className="font-semibold text-slate-800">{inv.discount > 0 ? `-${fmt(inv.discount)}` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">VAT</p>
                        <p className="font-semibold text-slate-800">{inv.vat > 0 ? fmt(inv.vat) : "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mb-3">
                      <span className="text-xs text-slate-400 font-semibold">Grand Total</span>
                      <span className="font-bold text-slate-900 text-lg">{fmt(inv.grandTotal)}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap gap-1">
                        {(inv.payments || []).map((p, i) => {
                          const Icon = METHOD_ICON[p.method] || FiDollarSign;
                          return (
                            <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                              <Icon size={11} /> {p.method === "mobile" ? p.provider : p.method}
                            </span>
                          );
                        })}
                      </div>
                      {lastPayment && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <FiClock size={10} /> {fmtDateTime(lastPayment.date || lastPayment.createdAt || inv.invoiceDate)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setEyeId(inv._id)}
                        title="View invoice"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-blue-400 hover:text-blue-600 transition"
                      >
                        <FiEye size={13} /> View Invoice
                      </button>
                      <button
                        onClick={() => printInvoice(inv)}
                        title="Print invoice"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-500 transition"
                      >
                        <FiPrinter size={13} /> Print
                      </button>
                      <button
                        onClick={() => openPrintWindow(buildChallanHTML({ invoiceNum: inv.invoiceNumber, customer: inv.customer, items: inv.items }))}
                        title="Print challan (no prices)"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-amber-500 hover:text-amber-600 transition"
                      >
                        <FiFileText size={13} /> Challan
                      </button>
                      <button
                        onClick={() => setDetailsModal(inv)}
                        title="Payment details"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-emerald-400 hover:text-emerald-600 transition ml-auto"
                      >
                        <FiClock size={13} /> Payment Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-4">
            <p className="text-sm text-slate-500 order-2 sm:order-1">
              {total === 0 ? "Showing 0 invoices" : `Showing ${(page - 1) * PAGE_LIMIT + 1}-${(page - 1) * PAGE_LIMIT + invoices.length} of ${total.toLocaleString()} invoices`}
            </p>
           <div className="order-1 sm:order-2">
              <Pagination page={page} totalPages={totalPages} onChange={goToPage} accent="#059669" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 xl:col-span-3 space-y-6 min-w-0">
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Revenue Trend</h3>
            <p className="text-xs text-slate-400 mb-3">Based on invoices currently loaded</p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v}`} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5"><FiUsers size={14} /> Top Customers by Revenue</h3>
            </div>
            <div className="space-y-3">
              {topCustomers.length === 0 ? (
                <p className="text-xs text-slate-400">No data yet.</p>
              ) : (
                topCustomers.map((c) => (
                  <div key={c.phone + c.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.phone} · {c.count} invoice{c.count !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">{fmt(c.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-1.5"><FiActivity size={14} /> Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400">No recent activity.</p>
              ) : (
                recentActivity.map((e, i) => (
                  <div key={e.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      {i !== recentActivity.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm text-slate-800 leading-snug">
                        {e.invoiceNumber} — {fmt(e.amount)} via {e.method === "mobile" ? e.provider : e.method}
                      </p>
                      <p className="text-xs text-slate-400">{daysAgo(e.date)} days ago</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {eyeId && <InvoicePreviewModalEye invoiceId={eyeId} onClose={() => setEyeId(null)} />}
      {detailsModal && <PaymentDetailsModal invoice={detailsModal} onClose={() => setDetailsModal(null)} />}
    </div>
  );
}

function KpiCard({ icon, iconBg, label, value, trend }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium truncate">{label}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-base font-bold text-slate-900 truncate">{value}</p>
          {trend === "up" && <FiTrendingUp className="text-emerald-500 shrink-0" size={14} />}
          {trend === "down" && <FiTrendingDown className="text-red-500 shrink-0" size={14} />}
        </div>
      </div>
    </div>
  );
}