// FILE: src/Pages/Customer/DueCustomers.jsx (FULL REPLACEMENT — your exact design, real backend data, CSV kept)
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiAlertCircle,
  FiSearch,
  FiX,
  FiEye,
  FiTrash2,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiShoppingBag,
  FiCheckCircle,
  FiTag,
  FiFileText,
  FiDownload,
  FiLoader,
  FiDollarSign,
  FiGrid,
  FiBox,
  FiUsers,
  FiShoppingCart,
  FiBarChart2,
  FiSettings,
  FiChevronRight,
  FiChevronLeft,
  FiBell,
  FiSmartphone,
  FiCreditCard,
} from "react-icons/fi";
import InvoicePreviewModal from "./InvoicePreviewModal";
import Pagination from "../../Components/Pagination";
import {
  MOBILE_PROVIDERS,
  BANK_OPTIONS,
  clampToMax,
} from "../../utils/paymentConstants";
import { buildReturnHTML } from "../../Print/returnTemplate";
import { openPrintWindow } from "../../Print/printUtils";

const PAGE_SIZE = 12;
const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const initials = (n) =>
  (n || "C")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const COLORS = [
  "bg-green-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-orange-500",
  "bg-pink-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-rose-500",
];
const avatarBg = (key) => {
  const s = String(key || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) % COLORS.length;
  return COLORS[h];
};

const CUSTOMER_TYPES = {
  1: { label: "Retail", style: "bg-blue-50 text-blue-600" },
  2: { label: "Wholesale", style: "bg-purple-50 text-purple-600" },
};
const typeLabel = (t) => CUSTOMER_TYPES[t]?.label || CUSTOMER_TYPES[1].label;
const typeStyle = (t) => CUSTOMER_TYPES[t]?.style || CUSTOMER_TYPES[1].style;

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: FiGrid },
  { key: "inventory", label: "Inventory", icon: FiBox },
  {
    key: "customers",
    label: "Customers",
    icon: FiUsers,
    active: true,
    children: ["Orders", "Due Customers", "Limit Managers"],
  },
  { key: "sales", label: "Sales", icon: FiShoppingCart },
  { key: "accounting", label: "Accounting", icon: FiFileText },
  { key: "reports", label: "Reports", icon: FiBarChart2 },
  { key: "settings", label: "Settings", icon: FiSettings },
];

const MOBILE_ICON_BG = {
  bKash: "bg-pink-500",
  Nagad: "bg-orange-500",
  Rocket: "bg-purple-600",
  Upay: "bg-blue-600",
};

function toCsv(rows) {
  const headers = [
    "Name",
    "Phone",
    "Email",
    "Address",
    "Customer Type",
    "Orders",
    "Total Spent",
    "Due Amount",
    "Joined",
    "Last Order",
    "Invoice Count",
  ];
  const escape = (val) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((c) =>
    [
      c.name,
      c.phone,
      c.email || "",
      c.address || "",
      typeLabel(c.customerType),
      c.invoiceCount,
      c.totalSpent,
      c.totalDue,
      fmtDate(c.joinedAt),
      fmtDate(c.lastOrderDate),
      c.invoiceCount,
    ]
      .map(escape)
      .join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

function downloadCsv(rows) {
  const csv = "\ufeff" + toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `due-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Drawer({ c, onClose, onPreview }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!c) return;
    let active = true;
    setLoading(true);
    axios
      .get("http://localhost:5000/api/invoices", {
        params: { customerName: c.name, limit: 100 },
      })
      .then((res) => {
        if (active) setInvoices(res.data.invoices || []);
      })
      .catch(() => {
        if (active) setInvoices([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [c]);

  if (!c) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Cover */}
        <div className="relative bg-[#1E3A8A] pt-8 pb-14 px-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-white/15 hover:bg-white/25 rounded-full transition"
          >
            <FiX size={16} className="text-white" />
          </button>
          <div className="flex flex-col items-center">
            <div
              className={`w-20 h-20 rounded-full ring-4 ring-white/30 flex items-center justify-center text-white text-2xl font-extrabold ${avatarBg(c.customerId || c.name)}`}
            >
              {initials(c.name)}
            </div>
            <h2 className="text-white text-lg font-extrabold mt-3">{c.name}</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-red-500 text-white">
                <FiAlertCircle size={10} /> Has Due
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-white/90 ${typeStyle(c.customerType).split(" ")[1]}`}
              >
                {typeLabel(c.customerType)}
              </span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="px-6 -mt-8">
          <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-[0_8px_24px_-6px_rgba(15,23,42,0.12)] p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">
                Personal Info
              </p>
              <p className="text-sm font-bold text-[#0F172A] mt-0.5 truncate">
                {c.phone}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">
                Email
              </p>
              <p className="text-sm font-bold text-[#0F172A] mt-0.5 truncate">
                {c.email || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">
                Join Date
              </p>
              <p className="text-sm font-bold text-[#0F172A] mt-0.5">
                {fmtDate(c.joinedAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">
                Last Order
              </p>
              <p className="text-sm font-bold text-[#0F172A] mt-0.5">
                {fmtDate(c.lastOrderDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
              <p className="text-[#0F172A] text-base font-extrabold">
                {fmt(c.totalSpent)}
              </p>
              <p className="text-emerald-600 text-[11px] font-semibold mt-0.5">
                Total Spent
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
              <p className="text-[#0F172A] text-base font-extrabold">
                {c.invoiceCount}
              </p>
              <p className="text-blue-600 text-[11px] font-semibold mt-0.5">
                Total Orders
              </p>
            </div>
          </div>
          <div className="bg-red-500 rounded-xl p-4 mt-3 flex items-center justify-between">
            <div>
              <p className="text-red-100 text-[11px] font-bold uppercase">
                Outstanding Due Amount
              </p>
              <p className="text-white text-xl font-extrabold mt-0.5">
                {fmt(c.totalDue)}
              </p>
            </div>
            <FiAlertCircle size={22} className="text-red-200" />
          </div>
        </div>

        <div className="px-6 pt-5 pb-2">
          <a
            href={`tel:${c.phone}`}
            className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3 rounded-xl text-sm shadow-[0_4px_14px_-2px_rgba(22,163,74,0.35)] transition"
          >
            <FiPhone size={16} /> Call Customer
          </a>
        </div>

        {/* Invoice timeline */}
        <div className="px-6 py-5">
          <p className="text-sm font-extrabold text-[#0F172A] mb-4 flex items-center gap-1.5">
            <FiFileText size={14} /> Invoice History
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-[#94A3B8] text-sm py-6 justify-center">
              <FiLoader className="animate-spin" size={14} /> Loading…
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-[#94A3B8] text-sm text-center py-6 bg-[#F8FAFC] rounded-xl">
              No invoices yet
            </p>
          ) : (
            <div className="relative pl-5 space-y-5">
              <div className="absolute left-[5px] top-1 bottom-1 w-px bg-[#E2E8F0]" />
              {invoices.map((inv) => (
                <div key={inv._id} className="relative">
                  <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#1E3A8A] ring-4 ring-white" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {inv.invoiceDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0F172A]">
                        {fmt(inv.grandTotal)}
                      </span>
                      <button
                        onClick={() => onPreview(inv._id)}
                        title="View invoice"
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                      >
                        <FiDownload size={13} />
                      </button>
                      <button
                        onClick={() => openPrintWindow(buildReturnHTML(inv))}
                        title="Print invoice"
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                      >
                        <FiFileText size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-bold py-3 rounded-xl text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DueCustomers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [delId, setDelId] = useState(null);
  const [toast, setToast] = useState("");
  const [previewId, setPreviewId] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payProvider, setPayProvider] = useState("bKash");
  const [payBankName, setPayBankName] = useState(BANK_OPTIONS[0]);
  const [payLoading, setPayLoading] = useState(false);
  const [dynMobileProviders, setDynMobileProviders] = useState(MOBILE_PROVIDERS);
  const [dynBankOptions, setDynBankOptions] = useState(BANK_OPTIONS);

  useEffect(() => {
    axios.get("http://localhost:5000/api/payment-methods?type=mobile")
      .then((res) => { const n = (res.data.options || []).map((o) => o.name); if (n.length) { setDynMobileProviders(n); setPayProvider(n[0]); } })
      .catch(() => {});
    axios.get("http://localhost:5000/api/payment-methods?type=bank")
      .then((res) => { const n = (res.data.options || []).map((o) => o.name); if (n.length) { setDynBankOptions(n); setPayBankName(n[0]); } })
      .catch(() => {});
  }, []);
  const [payModalInvoices, setPayModalInvoices] = useState([]);
  const [payModalInvoicesLoading, setPayModalInvoicesLoading] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const submitPayment = async () => {
    const amt = Number(payAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setToast("Enter a valid amount");
      return;
    }
    if (!payModal?.customerId) {
      setToast("This customer has no linked customer record.");
      return;
    }
    setPayLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/customers/${payModal.customerId}/collect-due`,
        {
          amount: amt,
          method: payMethod,
          provider: payMethod === "mobile" ? payProvider : undefined,
          bankName: payMethod === "bank" ? payBankName : undefined,
          invoiceIds:
            selectedInvoiceIds.length > 0 ? selectedInvoiceIds : undefined,
        },
      );
      setToast(
        res.data.movedToPaid
          ? "Fully paid — moved to Paid Customers ✅"
          : "Payment recorded ✅",
      );
      setPayModal(null);
      setPayAmount("");
      setSelectedInvoiceIds([]);
      fetchData();
    } catch (err) {
      setToast(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPayLoading(false);
      setTimeout(() => setToast(""), 3000);
    }
  };

  useEffect(() => {
    if (!payModal?.name) {
      setPayModalInvoices([]);
      setSelectedInvoiceIds([]);
      return;
    }
    setPayModalInvoicesLoading(true);
    axios
      .get("http://localhost:5000/api/invoices", {
        params: {
          customerName: payModal.name,
          paymentStatus: "due",
          limit: 100,
        },
      })
      .then((res) => setPayModalInvoices(res.data.invoices || []))
      .catch(() => setPayModalInvoices([]))
      .finally(() => setPayModalInvoicesLoading(false));
    setSelectedInvoiceIds([]);
  }, [payModal]);

  const toggleInvoiceSelection = (id) =>
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const payCap =
    selectedInvoiceIds.length > 0
      ? payModalInvoices
          .filter((inv) => selectedInvoiceIds.includes(inv._id))
          .reduce((s, inv) => s + (Number(inv.dueAmount) || 0), 0)
      : payModal?.totalDue || 0;

  // Phase 10 C3 — search already debounced 350ms below; kept as-is (already correct), no duplicate immediate fetch on mount + search change
  const fetchData = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/customers/due", { params: { search } })
      .then((res) => setData(res.data.customers || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(fetchData, 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const totalDueAmount = data.reduce((sum, c) => sum + (c.totalDue || 0), 0);

  const filteredRows = useMemo(() => {
    let list = data;
    if (typeFilter !== "all")
      list = list.filter((c) => String(c.customerType) === String(typeFilter));
    return list;
  }, [data, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, search]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const rows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleSelectAll = () =>
    setSelected((p) =>
      p.length === rows.length ? [] : rows.map((c) => c.customerId || c.name),
    );

  const handleDelete = async () => {
    const target = data.find((c) => (c.customerId || c.name) === delId);
    try {
      if (target?.customerId) {
        await axios.delete(
          `http://localhost:5000/api/customers/${target.customerId}`,
        );
      }
      setData((p) => p.filter((c) => (c.customerId || c.name) !== delId));
      setToast("Customer removed ✅");
    } catch (err) {
      setToast("Failed to remove customer");
    }
    setDelId(null);
    setDrawer(null);
    setTimeout(() => setToast(""), 2800);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#64748B] text-sm font-medium">Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex">
      {/* ══════════════════ MAIN ══════════════════ */}
      <div className="flex-1 min-w-0">
        {toast && (
          <div className="fixed top-5 right-5 z-50 bg-white border border-emerald-200 text-[#0F172A] px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2.5 max-w-sm">
            <span className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <FiCheckCircle size={15} className="text-[#16A34A]" />
            </span>
            {toast}
          </div>
        )}

        {previewId && (
          <InvoicePreviewModal
            invoiceId={previewId}
            onClose={() => setPreviewId(null)}
          />
        )}

        {delId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiTrash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0F172A] mb-2">
                Remove customer?
              </h3>
              <p className="text-[#64748B] text-sm mb-6">
                <strong className="text-[#0F172A]">
                  {data.find((c) => (c.customerId || c.name) === delId)?.name}
                </strong>{" "}
                will be removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDelId(null)}
                  className="flex-1 border border-[#E2E8F0] text-[#334155] font-bold py-3 rounded-xl hover:bg-[#F8FAFC] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        <Drawer
          c={drawer}
          onClose={() => setDrawer(null)}
          onPreview={setPreviewId}
        />

        {/* Payment Modal (floating card, styled to match reference) */}
        {payModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center px-4 py-8 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-5 bg-[#0F172A]">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-extrabold shrink-0 ${avatarBg(payModal.customerId || payModal.name)}`}
                >
                  {initials(payModal.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-extrabold text-sm truncate">
                    {payModal.name}
                  </p>
                  <p className="text-white/50 text-[11px]">Due Amount</p>
                </div>
                <p className="text-red-400 font-extrabold text-sm whitespace-nowrap">
                  {fmt(payModal.totalDue)}
                </p>
              </div>

              <div className="px-6 py-5">
                {payModalInvoices.length > 0 && (
                  <div className="mb-4">
                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide mb-1.5 block">
                      Apply to Invoice(s)
                    </label>
                    <div className="border border-[#E2E8F0] rounded-xl max-h-36 overflow-y-auto divide-y divide-[#F1F5F9]">
                      {payModalInvoicesLoading ? (
                        <p className="text-xs text-[#94A3B8] text-center py-3">
                          Loading invoices…
                        </p>
                      ) : (
                        payModalInvoices.map((inv) => (
                          <label
                            key={inv._id}
                            className="flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[#F8FAFC]"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={selectedInvoiceIds.includes(inv._id)}
                                onChange={() => toggleInvoiceSelection(inv._id)}
                                className="accent-[#16A34A] w-4 h-4 rounded shrink-0"
                              />
                              <span className="truncate font-semibold text-[#0F172A]">
                                {inv.invoiceNumber}
                              </span>
                            </span>
                            <span className="text-red-600 font-bold shrink-0">
                              ৳{Number(inv.dueAmount || 0).toLocaleString()}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="text-[10px] text-[#94A3B8] mt-1">
                      Select specific invoice(s) to pay only those — or leave
                      unchecked to auto-clear the oldest due invoices first (pay
                      full total to clear everything).
                    </p>
                  </div>
                )}
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide">
                  Payment Amount
                </label>
                <input
                  type="number"
                  min="0"
                  max={payCap}
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(clampToMax(e.target.value, payCap))
                  }
                  placeholder="Payment"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-base mt-1.5 mb-4 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                />

                <div className="flex gap-4 mb-3 text-sm font-semibold text-[#334155]">
                  {["cash", "mobile", "bank"].map((m) => (
                    <label
                      key={m}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={payMethod === m}
                        onChange={() => setPayMethod(m)}
                        className="accent-[#16A34A]"
                      />
                      {m === "mobile"
                        ? "Mobile Banking"
                        : m === "bank"
                          ? "Bank"
                          : "Cash"}
                    </label>
                  ))}
                </div>

                 {payMethod === "mobile" && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {dynMobileProviders.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPayProvider(p)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition ${
                          payProvider === p
                            ? "border-[#16A34A] bg-emerald-50"
                            : "border-[#E2E8F0] bg-white"
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${MOBILE_ICON_BG[p] || "bg-gray-400"}`}
                        >
                          <FiSmartphone size={14} />
                        </span>
                        <span className="text-[10px] font-bold text-[#334155] text-center">
                          {p}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {payMethod === "bank" && (
                  <div className="mb-4">
                    <div className="relative">
                      <FiCreditCard
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                      />
                      <select
                        value={payBankName}
                        onChange={(e) => setPayBankName(e.target.value)}
                        className="w-full border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-sm bg-[#F8FAFC]"
                      >
                        {dynBankOptions.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setPayModal(null)}
                    className="flex-1 border border-[#E2E8F0] text-[#334155] font-bold py-3 rounded-xl hover:bg-[#F8FAFC] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitPayment}
                    disabled={payLoading}
                    className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-[0_4px_14px_-2px_rgba(22,163,74,0.35)] transition"
                  >
                    {payLoading ? "Saving..." : "Confirm Payment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
          {/* Header */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight">
                Due Customers
              </h1>
              <p className="text-[#94A3B8] text-sm mt-1">
                Manage due customers for your account
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3 bg-white border border-[#F1F5F9] rounded-2xl px-4 py-3 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
                <span className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <FiUsers size={15} className="text-blue-600" />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase">
                    Total Due Customers
                  </p>
                  <p className="text-lg font-extrabold text-[#0F172A] leading-tight">
                    {data.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-[#F1F5F9] rounded-2xl px-4 py-3 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
                <span className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <FiDollarSign size={15} className="text-red-500" />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase">
                    Total Due Amount
                  </p>
                  <p className="text-lg font-extrabold text-[#0F172A] leading-tight">
                    {fmt(totalDueAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter / Search bar */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl p-4 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)] flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <FiSearch
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-full pl-11 pr-10 py-2.5 text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-red-400/30 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#334155]"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: "all", label: "All Types" },
                { key: "1", label: "Retail" },
                { key: "2", label: "Wholesale" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition border ${
                    typeFilter === key
                      ? "bg-[#0F172A] text-white border-[#0F172A]"
                      : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-red-300"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => downloadCsv(data)}
                className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold px-4 py-2 rounded-full text-sm shadow-[0_4px_14px_-2px_rgba(22,163,74,0.35)] transition"
              >
                <FiDownload size={14} /> CSV Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl overflow-hidden shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                    <th className="px-5 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={
                          rows.length > 0 && selected.length === rows.length
                        }
                        onChange={toggleSelectAll}
                        className="accent-[#16A34A] w-4 h-4 rounded"
                      />
                    </th>
                    {[
                      "Customer",
                      "Type",
                      "Phone",
                      "Address",
                      "Orders",
                      "Total Spent",
                      "Due Amount",
                      "Status",
                      "Actions",
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
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center py-16 text-[#94A3B8] text-sm"
                      >
                        No due customers found{" "}
                      </td>
                    </tr>
                  ) : (
                    rows.map((c) => {
                      const id = c.customerId || c.name;
                      return (
                        <tr key={id} className="hover:bg-[#F8FAFC] transition">
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={selected.includes(id)}
                              onChange={() => toggleSelect(id)}
                              className="accent-[#16A34A] w-4 h-4 rounded"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarBg(id)}`}
                              >
                                {initials(c.name)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[#0F172A] whitespace-nowrap">
                                  {c.name}
                                </div>
                                <div className="text-[11px] text-[#94A3B8]">
                                  Realistic Do.
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${typeStyle(c.customerType)}`}
                            >
                              {typeLabel(c.customerType)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#64748B] whitespace-nowrap">
                            {c.phone}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#64748B]">
                            <span className="truncate block max-w-[150px]">
                              {c.address || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-[#334155]">
                            {c.invoiceCount}
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-[#334155] whitespace-nowrap">
                            {fmt(c.totalSpent)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                              {fmt(c.totalDue)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${c.status === "active" ? "bg-amber-50 text-amber-600" : "bg-[#F1F5F9] text-[#94A3B8]"}`}
                            >
                              {c.status === "active" ? "Rated" : c.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => {
                                setPayModal(c);
                                setPayAmount("");
                              }}
                              className="text-xs font-bold text-white bg-[#0F172A] hover:bg-[#1E293B] px-4 py-2 rounded-full transition whitespace-nowrap"
                            >
                              Collect Payment
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-[#F1F5F9]">
              {filteredRows.length === 0 ? (
                <div className="text-center py-16 text-[#94A3B8] text-sm">
                  No due customers{" "}
                </div>
              ) : (
                rows.map((c) => {
                  const id = c.customerId || c.name;
                  return (
                    <div key={id} className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarBg(id)}`}
                          >
                            {initials(c.name)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">
                              {c.name}
                            </div>
                            <div className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                              <FiPhone size={11} />
                              {c.phone}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                            Due
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeStyle(c.customerType)}`}
                          >
                            {typeLabel(c.customerType)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
                          <div className="text-sm font-bold text-[#0F172A]">
                            {c.invoiceCount}
                          </div>
                          <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">
                            Orders
                          </div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                          <div className="text-xs font-bold text-emerald-700">
                            {fmt(c.totalSpent)}
                          </div>
                          <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">
                            Spent
                          </div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3 text-center">
                          <div className="text-xs font-bold text-red-600">
                            {fmt(c.totalDue)}
                          </div>
                          <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">
                            Due
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${c.phone}`}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] font-bold py-2.5 rounded-xl text-xs transition"
                        >
                          <FiPhone size={13} />
                          Call
                        </a>
                        <button
                          onClick={() => setDrawer(c)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2.5 rounded-xl text-xs transition"
                        >
                          <FiEye size={13} />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setPayModal(c);
                            setPayAmount("");
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold py-2.5 rounded-xl text-xs transition"
                        >
                          <FiDollarSign size={13} />
                          Pay
                        </button>
                        <button
                          onClick={() => setDelId(id)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 font-bold py-2.5 rounded-xl text-xs transition"
                        >
                          <FiTrash2 size={13} />
                          Del
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination footer inline */}
            <div className="flex items-center justify-center gap-1.5 px-5 py-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC] flex items-center justify-center"
              >
                «
              </button>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC] flex items-center justify-center"
              >
                <FiChevronLeft size={14} />
              </button>
              <span className="w-8 h-8 rounded-lg bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center">
                {page}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC] flex items-center justify-center"
              >
                <FiChevronRight size={14} />
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#64748B] disabled:opacity-40 hover:bg-[#F8FAFC] flex items-center justify-center"
              >
                »
              </button>
            </div>
          </div>

          <p className="text-center text-[#94A3B8] text-sm pb-4">
            Khulna Hardware Mart · Due Customers
          </p>
        </div>
      </div>
    </div>
  );
}
