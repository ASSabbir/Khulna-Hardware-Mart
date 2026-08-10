// FILE: src/Pages/Invoice/DueInvoice.jsx (FULL REPLACEMENT)
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  FiAlertCircle,
  FiSearch,
  FiCalendar,
  FiUser,
  FiPhone,
  FiFileText,
  FiDollarSign,
  FiSmartphone,
  FiCreditCard,
  FiLoader,
  FiPrinter,
  FiEye,
  FiX,
  FiPlus,
  FiClock,
  FiRefreshCw,
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiPercent,
  FiInbox,
  FiUsers,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiPackage,
  FiFilter,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import InvoicePreviewModalEye from "./InvoicePreviewModalEye";
import { buildReturnHTML } from "../../Print/returnTemplate";
import { buildChallanHTML } from "../../Print/challanTemplate";
import { openPrintWindow } from "../../Print/printUtils";
import Pagination from "../../Components/Pagination";

const API_BASE = "http://localhost:5000/api/invoices";
const PAGE_LIMIT = 20;

const fmt = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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

const METHOD_ICON = {
  cash: FiDollarSign,
  mobile: FiSmartphone,
  bank: FiCreditCard,
};
const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const PAYMENT_CHIPS = [
  { method: "cash", label: "Cash", icon: FiDollarSign },
  { method: "bank", label: "Bank Transfer", icon: FiCreditCard },
  { method: "mobile", provider: "bKash", label: "bKash", icon: FiSmartphone },
  { method: "mobile", provider: "Nagad", label: "Nagad", icon: FiSmartphone },
  { method: "mobile", provider: "Rocket", label: "Rocket", icon: FiSmartphone },
  { method: "mobile", provider: "Upay", label: "Upay", icon: FiSmartphone },
];
const QUICK_FILTERS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "overdue", label: "Overdue" },
  { key: "high", label: "High Due" },
];

const emptySplit = (method = "cash", provider = "bKash") => ({
  id: Date.now() + Math.random(),
  method,
  amount: "",
  provider,
});

const sanitizeCsvCell = (val) => {
  const str = String(val ?? "");
  const escaped = str.replace(/"/g, '""');
  return /^[=+\-@]/.test(escaped) ? `'${escaped}` : escaped;
};

function PayNowModal({ invoice, onClose, onDone }) {
  const [rows, setRows] = useState([emptySplit()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const remaining = Math.max(0, (invoice.dueAmount || 0) - total);

  const addRow = (method = "cash", provider = "bKash") =>
    setRows((p) => [...p, emptySplit(method, provider)]);
  const removeRow = (id) =>
    setRows((p) => (p.length > 1 ? p.filter((r) => r.id !== id) : p));
  const updateRow = (id, field, value) => {
    if (field === "amount") {
      const others = rows
        .filter((r) => r.id !== id)
        .reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const maxForThisRow = Math.max(0, (invoice.dueAmount || 0) - others);
      const n = Number(value);
      if (Number.isFinite(n) && n > maxForThisRow)
        value = String(maxForThisRow);
    }
    setRows((p) => p.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const submit = async () => {
    setError("");
    if (total <= 0) {
      setError("Enter at least one payment amount.");
      return;
    }
    if (total > invoice.dueAmount + 0.01) {
      setError(`Total cannot exceed due balance (${fmt(invoice.dueAmount)}).`);
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/${invoice._id}/collect-due`, {
        payments: rows
          .filter((r) => (Number(r.amount) || 0) > 0)
          .map((r) => ({
            method: r.method,
            amount: Number(r.amount),
            provider: r.method === "mobile" ? r.provider : undefined,
          })),
      });
      setSuccess(true);
      setTimeout(() => onDone(res.data), 650);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Collect Payment
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {invoice.invoiceNumber} · {invoice.customer?.name || "Unknown"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 hover:bg-gray-100 rounded-lg shrink-0 disabled:opacity-40"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 animate-pulse">
              <FiCheckCircle size={34} />
            </div>
            <p className="font-bold text-gray-900">Payment Recorded</p>
            <p className="text-sm text-gray-500">
              Updating invoice and preparing receipt...
            </p>
          </div>
        ) : (
          <>
            <div className="px-5 sm:px-6 pt-5 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-500 font-semibold">
                    Remaining Due
                  </p>
                  <p className="text-xl font-extrabold text-red-600">
                    {fmt(remaining)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Invoice Due</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {fmt(invoice.dueAmount)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                  Payment Method
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_CHIPS.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => addRow(c.method, c.provider)}
                      className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition"
                    >
                      <c.icon size={16} />
                      <span className="text-[11px] font-semibold">
                        {c.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 space-y-2">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
                  <FiAlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}
              {rows.map((r) => {
                const Icon = METHOD_ICON[r.method] || FiDollarSign;
                return (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                  >
                    <span className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                      <Icon size={13} />
                    </span>
                    <select
                      value={r.method}
                      onChange={(e) =>
                        updateRow(r.id, "method", e.target.value)
                      }
                      className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                    >
                      <option value="cash">Cash</option>
                      <option value="mobile">Mobile Banking</option>
                      <option value="bank">Bank</option>
                    </select>
                    {r.method === "mobile" && (
                      <select
                        value={r.provider}
                        onChange={(e) =>
                          updateRow(r.id, "provider", e.target.value)
                        }
                        className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                      >
                        {MOBILE_PROVIDERS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <span className="px-2 text-xs text-gray-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.amount}
                        onChange={(e) =>
                          updateRow(r.id, "amount", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-20 px-1 py-1.5 text-xs font-semibold outline-none"
                      />
                    </div>
                    <button
                      onClick={() => removeRow(r.id)}
                      className="ml-auto text-gray-300 hover:text-red-500"
                      aria-label="Remove row"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => addRow()}
                className="w-full text-xs font-bold text-blue-700 border border-dashed border-blue-300 rounded-xl py-2.5 hover:bg-blue-50 flex items-center justify-center gap-1"
              >
                <FiPlus size={13} /> Add Payment Row
              </button>

              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-100">
                <span className="text-gray-500 font-semibold">
                  Total Entered
                </span>
                <span
                  className={
                    total > invoice.dueAmount
                      ? "text-red-600"
                      : "text-emerald-600"
                  }
                >
                  {fmt(total)}
                </span>
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={saving || total <= 0}
                className="flex-1 bg-slate-900 hover:bg-black text-white font-semibold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <FiLoader className="animate-spin" size={15} /> Saving...
                  </>
                ) : (
                  "Confirm Payment"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PaymentHistoryModal({ invoice, onClose }) {
  const payments = invoice.payments || [];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Payment History
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {invoice.invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg shrink-0"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {payments.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No payments recorded yet.
            </div>
          ) : (
            payments.map((p, i) => {
              const Icon = METHOD_ICON[p.method] || FiDollarSign;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3"
                >
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-blue-600">
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {p.method === "mobile"
                        ? p.provider
                        : p.method === "bank"
                          ? "Bank Transfer"
                          : "Cash"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmtDateTime(
                        p.date ||
                          p.createdAt ||
                          invoice.updatedAt ||
                          invoice.invoiceDate,
                      )}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600 text-sm shrink-0">
                    {fmt(p.amount)}
                  </span>
                </div>
              );
            })
          )}
          <div className="flex justify-between text-sm font-bold pt-3 border-t border-gray-100">
            <span className="text-gray-500">Total Paid</span>
            <span className="text-emerald-600">{fmt(invoice.paidAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DueInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeQuick, setActiveQuick] = useState("");
  const [eyeId, setEyeId] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [toast, setToast] = useState("");
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams({
        page,
        limit: PAGE_LIMIT,
        paymentStatus: "due",
      });
      if (search.trim()) params.append("search", search.trim());
      const res = await axios.get(`${API_BASE}?${params}`, {
        signal: controller.signal,
        timeout: 15000,
      });
      setInvoices(Array.isArray(res.data?.invoices) ? res.data.invoices : []);
      setTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      setTotal(Number(res.data?.pagination?.total) || 0);
    } catch (err) {
      if (axios.isCancel(err) || err.code === "ERR_CANCELED") return;
      setInvoices([]);
      setErrorMsg("Failed to load due invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);
  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const printInvoice = (inv) => openPrintWindow(buildReturnHTML(inv));

  const handlePaymentDone = (updatedInvoice) => {
    setPayModal(null);
    setToast(
      updatedInvoice.paymentStatus === "paid"
        ? "Fully paid — moved to Paid Invoices ✅"
        : "Payment recorded ✅",
    );
    setTimeout(() => setToast(""), 3000);
    fetchData();
    printInvoice(updatedInvoice);
  };

  const avgDue = invoices.length
    ? invoices.reduce((s, i) => s + (i.dueAmount || 0), 0) / invoices.length
    : 0;
  const isOverdueInv = (inv) => daysAgo(inv.invoiceDate) > 30;
  const isHighDue = (inv) => avgDue > 0 && (inv.dueAmount || 0) > avgDue * 1.5;

  const filteredInvoices = useMemo(() => {
    if (!activeQuick) return invoices;
    const now = new Date();
    return invoices.filter((inv) => {
      const d = new Date(inv.invoiceDate);
      if (activeQuick === "today")
        return d.toDateString() === now.toDateString();
      if (activeQuick === "week") return daysAgo(inv.invoiceDate) <= 7;
      if (activeQuick === "month")
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      if (activeQuick === "overdue") return isOverdueInv(inv);
      if (activeQuick === "high") return isHighDue(inv);
      return true;
    });
  }, [invoices, activeQuick]);

  const stats = useMemo(() => {
    const grandTotalSum = filteredInvoices.reduce(
      (s, i) => s + (i.grandTotal || 0),
      0,
    );
    const paidSum = filteredInvoices.reduce(
      (s, i) => s + (i.paidAmount || 0),
      0,
    );
    const dueSum = filteredInvoices.reduce((s, i) => s + (i.dueAmount || 0), 0);
    const overdueCount = filteredInvoices.filter(isOverdueInv).length;
    const avgOutstanding = filteredInvoices.length
      ? dueSum / filteredInvoices.length
      : 0;
    const collectionRate =
      grandTotalSum > 0 ? (paidSum / grandTotalSum) * 100 : 0;
    return {
      grandTotalSum,
      paidSum,
      dueSum,
      overdueCount,
      avgOutstanding,
      collectionRate,
    };
  }, [filteredInvoices]);

  const topCustomers = useMemo(() => {
    const map = new Map();
    filteredInvoices.forEach((inv) => {
      const key = inv.customer?.phone || inv.customer?.name || "unknown";
      const prev = map.get(key) || {
        name: inv.customer?.name || "Unknown",
        phone: inv.customer?.phone || "—",
        due: 0,
        count: 0,
      };
      prev.due += inv.dueAmount || 0;
      prev.count += 1;
      map.set(key, prev);
    });
    return [...map.values()].sort((a, b) => b.due - a.due).slice(0, 4);
  }, [filteredInvoices]);

  const trendData = useMemo(() => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = dayLabels.map((day) => ({ day, due: 0, collected: 0 }));
    filteredInvoices.forEach((inv) => {
      const idx = new Date(inv.invoiceDate).getDay();
      buckets[idx].due += inv.dueAmount || 0;
      buckets[idx].collected += inv.paidAmount || 0;
    });
    return [...buckets.slice(1), buckets[0]];
  }, [filteredInvoices]);

  const activityTimeline = useMemo(() => {
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
    return events
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [filteredInvoices]);

  const handleExportCsv = () => {
    const headers = [
      "Invoice #",
      "Date",
      "Customer",
      "Phone",
      "Grand Total",
      "Paid",
      "Due",
    ];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      fmtDate(inv.invoiceDate),
      inv.customer?.name || "Unknown",
      inv.customer?.phone || "",
      inv.grandTotal,
      inv.paidAmount,
      inv.dueAmount,
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
    a.download = `due-invoices-page-${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setActiveQuick("");
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {toast && (
        <div className="fixed top-5 right-5 left-5 sm:left-auto z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-center sm:text-left">
          {toast}
        </div>
      )}

      <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 xl:col-span-9 space-y-6 min-w-0">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Due Invoice Management
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mt-1 max-w-xl">
                Manage all customer due invoices, outstanding balances, and
                payment collections.
              </p>
            </div>
            <div className="relative w-full sm:w-[300px] shrink-0 rounded-2xl p-5 overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
              <div className="relative z-10 space-y-1">
                <p className="text-white/80 text-xs font-semibold">
                  Financial Summary
                </p>
                <p className="text-2xl font-extrabold">
                  {fmt(stats.grandTotalSum)}
                </p>
                <div className="flex items-center justify-between text-xs pt-1 text-white/90">
                  <span>Paid: {fmt(stats.paidSum)}</span>
                  <span>Due: {fmt(stats.dueSum)}</span>
                </div>
              </div>
              <FiAlertCircle
                className="absolute -right-3 -bottom-3 text-white/20"
                size={90}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              icon={<FiDollarSign size={18} />}
              iconBg="bg-red-50 text-red-600"
              label="Total Due Amount"
              value={fmt(stats.dueSum)}
              trend="down"
            />
            <KpiCard
              icon={<FiFileText size={18} />}
              iconBg="bg-emerald-50 text-emerald-600"
              label="Total Due Invoices"
              value={total.toLocaleString()}
              trend="flat"
            />
            <KpiCard
              icon={<FiTrendingUp size={18} />}
              iconBg="bg-blue-50 text-blue-600"
              label="Collected (this page)"
              value={fmt(stats.paidSum)}
              trend="up"
            />
            <KpiCard
              icon={<FiClock size={18} />}
              iconBg="bg-slate-800 text-white"
              dark
              label="Overdue Invoices"
              value={stats.overdueCount}
              trend="down"
            />
            <KpiCard
              icon={<FiPackage size={18} />}
              iconBg="bg-slate-100 text-slate-600"
              label="Avg Outstanding"
              value={fmt(stats.avgOutstanding)}
              trend="flat"
            />
            <KpiCard
              icon={<FiPercent size={18} />}
              iconBg="bg-blue-50 text-blue-600"
              label="Collection Rate"
              value={`${stats.collectionRate.toFixed(2)}%`}
              trend={stats.collectionRate >= 50 ? "up" : "down"}
            />
          </div>

          <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <FiSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                value={search}
                maxLength={100}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, phone, or invoice number..."
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() =>
                    setActiveQuick((prev) => (prev === f.key ? "" : f.key))
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                    activeQuick === f.key
                      ? "bg-red-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                <FiRefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!filteredInvoices.length}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-40"
              >
                <FiDownload size={14} /> Export CSV
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              <FiAlertCircle size={16} /> {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse space-y-3"
                >
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              ))
            ) : filteredInvoices.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <FiInbox size={26} />
                </div>
                <p className="font-bold text-slate-800">
                  No due invoices found
                </p>
                <p className="text-sm text-slate-400 max-w-xs">
                  No due invoices found for this criteria. Try adjusting your
                  search or filters.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const overdue = isOverdueInv(inv);
                const high = isHighDue(inv);
                const paidPct =
                  inv.grandTotal > 0
                    ? Math.min(
                        100,
                        Math.round((inv.paidAmount / inv.grandTotal) * 100),
                      )
                    : 0;
                return (
                  <div
                    key={inv._id}
                    className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs">
                          {initials(inv.customer?.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                            <FiFileText
                              size={13}
                              className="text-slate-300 shrink-0"
                            />{" "}
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              <FiUser size={11} />{" "}
                              {inv.customer?.name || "Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiPhone size={11} /> {inv.customer?.phone || "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiCalendar size={11} />{" "}
                              {fmtDate(inv.invoiceDate)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {high && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">
                            High Priority
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${overdue ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}
                        >
                          {overdue ? "Overdue" : "Due"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-slate-400">{inv.totalReturnedAmount > 0 ? "Original Total" : "Grand Total"}</p>
                        <p className={`font-semibold text-sm ${inv.totalReturnedAmount > 0 ? "text-slate-400 line-through" : "text-slate-800"}`}>{fmt(inv.grandTotal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Paid Amount</p>
                        <p className="font-semibold text-emerald-600 text-sm">{fmt(inv.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Remaining Due</p>
                        <p className="font-bold text-red-600 text-sm">{fmt(inv.dueAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Items</p>
                        <p className="font-semibold text-slate-800 text-sm">{inv.items?.length || 0}</p>
                      </div>
                    </div>
                    {inv.totalReturnedAmount > 0 && (
                      <div className="flex items-center justify-between mb-3 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                        <span className="text-xs text-rose-500 font-semibold">Returned {fmt(inv.totalReturnedAmount)}</span>
                        <span className="text-sm font-bold text-emerald-700">Net {fmt(inv.netSaleAmount ?? inv.grandTotal)}</span>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="h-2 w-full bg-red-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {paidPct}% paid
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {(inv.payments || []).map((p, i) => {
                        const Icon = METHOD_ICON[p.method] || FiDollarSign;
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg"
                          >
                            <Icon size={11} />{" "}
                            {p.method === "mobile" ? p.provider : p.method}{" "}
                            {fmt(p.amount)}
                          </span>
                        );
                      })}
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
                        onClick={() => setPayModal(inv)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black transition"
                      >
                        <FiDollarSign size={13} /> Collect Payment
                      </button>
                      <button
                        onClick={() => printInvoice(inv)}
                        title="Print invoice"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-500 transition"
                      >
                        <FiPrinter size={13} /> Print
                      </button>
                      <button
                        onClick={() =>
                          openPrintWindow(
                            buildChallanHTML({
                              invoiceNum: inv.invoiceNumber,
                              customer: inv.customer,
                              items: inv.items,
                            }),
                          )
                        }
                        title="Print challan (no prices)"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-amber-500 hover:text-amber-600 transition"
                      >
                        <FiFileText size={13} /> Challan
                      </button>
                      <button
                        onClick={() => setHistoryModal(inv)}
                        title="Payment history"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-500 transition ml-auto"
                      >
                        <FiClock size={13} /> Payment History
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-4">
            <p className="text-sm text-slate-500 order-2 sm:order-1">
              {total === 0
                ? "Showing 0 invoices"
                : `Showing ${(page - 1) * PAGE_LIMIT + 1}-${(page - 1) * PAGE_LIMIT + invoices.length} of ${total.toLocaleString()} invoices`}
            </p>
            <div className="order-1 sm:order-2">
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={goToPage}
                accent="#EF4444"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 xl:col-span-3 space-y-6 min-w-0">
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Due &amp; Collection Trend
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Based on invoices currently loaded
            </p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="dueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="collectedFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
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
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="due"
                    name="Due"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fill="url(#dueFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name="Collected"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#collectedFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FiUsers size={14} /> Top Customers with Highest Dues
              </h3>
            </div>
            <div className="space-y-3">
              {topCustomers.length === 0 ? (
                <p className="text-xs text-slate-400">No data yet.</p>
              ) : (
                topCustomers.map((c) => (
                  <div
                    key={c.phone + c.name}
                    className="flex items-center gap-3"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {c.phone} · {c.count} invoice{c.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                      {fmt(c.due)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-1.5">
              <FiActivity size={14} /> Activity Timeline
            </h3>
            <div className="space-y-4">
              {activityTimeline.length === 0 ? (
                <p className="text-xs text-slate-400">No recent activity.</p>
              ) : (
                activityTimeline.map((e, i) => (
                  <div key={e.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      {i !== activityTimeline.length - 1 && (
                        <span className="w-px flex-1 bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm text-slate-800 leading-snug">
                        {e.invoiceNumber} — {fmt(e.amount)} via{" "}
                        {e.method === "mobile" ? e.provider : e.method}
                      </p>
                      <p className="text-xs text-slate-400">
                        {daysAgo(e.date)} days ago
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {eyeId && (
        <InvoicePreviewModalEye
          invoiceId={eyeId}
          onClose={() => setEyeId(null)}
        />
      )}
      {payModal && (
        <PayNowModal
          invoice={payModal}
          onClose={() => setPayModal(null)}
          onDone={handlePaymentDone}
        />
      )}
      {historyModal && (
        <PaymentHistoryModal
          invoice={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}

function KpiCard({ icon, iconBg, label, value, trend, dark = false }) {
  return (
    <div
      className={`border rounded-2xl p-4 flex items-center gap-3 ${dark ? "bg-slate-900 border-slate-900" : "bg-white border-slate-100"}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={`text-xs font-medium truncate ${dark ? "text-slate-300" : "text-slate-400"}`}
        >
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          <p
            className={`text-base font-bold truncate ${dark ? "text-white" : "text-slate-900"}`}
          >
            {value}
          </p>
          {trend === "up" && (
            <FiTrendingUp className="text-emerald-500 shrink-0" size={14} />
          )}
          {trend === "down" && (
            <FiTrendingDown className="text-red-500 shrink-0" size={14} />
          )}
        </div>
      </div>
    </div>
  );
}
