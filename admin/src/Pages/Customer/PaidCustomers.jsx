// FILE: src/Pages/Customer/PaidCustomers.jsx (FULL REPLACEMENT — your exact design, real backend data, CSV kept)
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiCheckCircle, FiSearch, FiX, FiEye, FiTrash2,
  FiPhone, FiMail, FiMapPin, FiCalendar, FiShoppingBag,
  FiTag, FiFileText, FiChevronLeft, FiChevronRight, FiDownload, FiLoader,
  FiGrid, FiBox, FiClipboard, FiUsers, FiSettings, FiBarChart2, FiPrinter,
  FiAlertTriangle,
} from "react-icons/fi";
import InvoicePreviewModal from "./InvoicePreviewModal";
import Pagination from "../../Components/Pagination";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const initials = (n) => (n || "C").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const COLORS = ["bg-green-600", "bg-blue-600", "bg-purple-600", "bg-orange-500", "bg-pink-600", "bg-teal-600", "bg-indigo-600", "bg-rose-500"];
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
  { key: "orders", label: "Orders", icon: FiClipboard },
  { key: "customers", label: "Customers", icon: FiUsers, active: true },
  { key: "settings", label: "Settings", icon: FiSettings },
  { key: "reports", label: "Reports", icon: FiBarChart2 },
];

const PAGE_SIZE = 10;

function toCsv(rows) {
  const headers = ["Name", "Phone", "Email", "Address", "Customer Type", "Orders", "Total Paid", "Joined", "Last Order", "Invoice Count"];
  const escape = (val) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((c) => [
    c.name, c.phone, c.email || "", c.address || "", typeLabel(c.customerType),
    c.invoiceCount, c.totalPaid, fmtDate(c.joinedAt), fmtDate(c.lastOrderDate), c.invoiceCount,
  ].map(escape).join(","));
  return [headers.join(","), ...lines].join("\n");
}

function downloadCsv(rows) {
  const csv = "\ufeff" + toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `paid-customers-${new Date().toISOString().slice(0, 10)}.csv`;
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
    axios.get("http://localhost:5000/api/invoices", { params: { customerName: c.name, paymentStatus: "paid", limit: 100 } })
      .then((res) => { if (active) setInvoices(res.data.invoices || []); })
      .catch(() => { if (active) setInvoices([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [c]);

  if (!c) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9]">
          <h2 className="text-lg font-extrabold text-[#0F172A]">Customer Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-xl transition"><FiX size={20} className="text-[#64748B]" /></button>
        </div>
        <div className="px-6 py-6 flex items-center gap-4 border-b border-[#F1F5F9]">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-extrabold ${avatarBg(c.customerId || c.name)}`}>{initials(c.name)}</div>
          <div>
            <div className="text-lg font-extrabold text-[#0F172A]">{c.name}</div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-[#16A34A]">
                <FiCheckCircle size={11} /> Fully Paid
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold ${typeStyle(c.customerType)}`}>
                {typeLabel(c.customerType)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5">
          <a href={`tel:${c.phone}`} className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3.5 rounded-xl text-sm shadow-[0_4px_14px_-2px_rgba(22,163,74,0.35)] transition">
            <FiPhone size={16} /> Call Customer
          </a>
        </div>

        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Phone", val: c.phone },
            { label: "Email", val: c.email || "Not provided" },
            { label: "Address", val: c.address || "—" },
            { label: "Joined Date", val: fmtDate(c.joinedAt) },
            { label: "Last Order Date", val: fmtDate(c.lastOrderDate) },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#94A3B8]">{label}</span>
              <span className={`text-sm font-bold ${val === "Not provided" ? "text-[#94A3B8] italic" : "text-[#0F172A]"}`}>{val}</span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-5 grid grid-cols-2 gap-3">
          <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-4">
            <div className="text-[#0F172A] text-lg font-extrabold">{fmt(c.totalPaid)}</div>
            <div className="text-[#94A3B8] text-xs mt-0.5 font-semibold">Total Spent</div>
            <div className="text-[#CBD5E1] text-[11px] mt-2 font-medium">Total Orders</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <div className="text-[#16A34A] text-lg font-extrabold">No due</div>
            <div className="text-emerald-600 text-xs mt-0.5 font-semibold">Payment Status</div>
            <div className="text-emerald-500 text-[11px] mt-2 font-medium flex items-center gap-1">All cleared — great customer! 👍</div>
          </div>
        </div>

        <div className="border-t border-[#F1F5F9] mx-6" />
        <div className="px-6 py-5">
          <p className="text-sm font-extrabold text-[#0F172A] mb-3 flex items-center gap-1.5"><FiFileText size={14} /> Invoice History</p>
          {loading ? (
            <div className="flex items-center gap-2 text-[#94A3B8] text-sm py-6 justify-center"><FiLoader className="animate-spin" size={14} /> Loading…</div>
          ) : invoices.length === 0 ? (
            <p className="text-[#94A3B8] text-sm text-center py-6 bg-[#F8FAFC] rounded-xl">No invoices yet</p>
          ) : (
            <div className="rounded-xl border border-[#F1F5F9] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-[#94A3B8] uppercase">Invoice</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-[#94A3B8] uppercase">Date</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-[#94A3B8] uppercase">Total</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="px-3 py-2.5 font-bold text-[#0F172A] whitespace-nowrap">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2.5 text-[#64748B] whitespace-nowrap">{inv.invoiceDate}</td>
                      <td className="px-3 py-2.5 font-bold text-[#0F172A] whitespace-nowrap">{fmt(inv.grandTotal)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button className="text-[11px] font-bold text-blue-600 hover:underline">View</button>
                          <button onClick={() => onPreview(inv._id)} className="text-[11px] font-bold text-[#64748B] hover:underline">Print</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-auto px-6 pb-6">
          <button onClick={onClose} className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-bold py-3 rounded-xl text-sm transition">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function PaidCustomers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(null);
  const [delId, setDelId] = useState(null);
  const [toast, setToast] = useState("");
  const [previewId, setPreviewId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    axios.get("http://localhost:5000/api/customers/paid", { params: { search } })
      .then((res) => setData(res.data.customers || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line
  useEffect(() => { const t = setTimeout(fetchData, 350); return () => clearTimeout(t); }, [search]); // eslint-disable-line

  const filtered = useMemo(() => {
    let rows = data;
    if (typeFilter !== "all") rows = rows.filter((c) => String(c.customerType) === String(typeFilter));
    return rows;
  }, [data, typeFilter]);

  useEffect(() => { setPage(1); }, [search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    const target = data.find((c) => (c.customerId || c.name) === delId);
    try {
      if (target?.customerId) {
        await axios.delete(`http://localhost:5000/api/customers/${target.customerId}`);
      }
      setData((p) => p.filter((c) => (c.customerId || c.name) !== delId));
      setToast("Customer removed");
    } catch (err) {
      setToast("Failed to remove customer");
    }
    setDelId(null);
    setDrawer(null);
    setTimeout(() => setToast(""), 2800);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#64748B] text-sm font-medium">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex">



      {/* ══════════════════ MAIN ══════════════════ */}
      <div className="flex-1 min-w-0">
        {toast && (
          <div className="fixed top-5 right-5 z-50 bg-white border border-emerald-200 text-[#0F172A] px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2.5 max-w-xs">
            <span className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FiCheckCircle size={15} className="text-[#16A34A]" />
            </span>
            {toast}
          </div>
        )}

        {previewId && <InvoicePreviewModal invoiceId={previewId} onClose={() => setPreviewId(null)} />}

        {delId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><FiTrash2 size={24} className="text-red-500"/></div>
              <h3 className="text-lg font-extrabold text-[#0F172A] mb-2">Remove customer?</h3>
              <p className="text-[#64748B] text-sm mb-6">
                Name <strong className="text-[#0F172A]">{data.find((c) => (c.customerId || c.name) === delId)?.name}</strong> will be removed.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDelId(null)} className="flex-1 border border-[#E2E8F0] text-[#334155] font-bold py-3 rounded-xl hover:bg-[#F8FAFC] transition">Cancel</button>
                <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition">Remove</button>
              </div>
            </div>
          </div>
        )}

        <Drawer c={drawer} onClose={() => setDrawer(null)} onPreview={setPreviewId} />

        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#16A34A] rounded-2xl flex items-center justify-center text-white shadow-[0_4px_14px_-2px_rgba(22,163,74,0.35)]"><FiCheckCircle size={22} /></div>
              <div>
                <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0F172A] tracking-tight">Paid Customers</h1>
                <p className="text-[#94A3B8] text-sm mt-0.5">Customers with no outstanding due — the good ones!</p>
              </div>
            </div>
            <span className="flex items-center gap-2 bg-emerald-50 text-[#16A34A] text-sm font-bold px-4 py-2.5 rounded-full">
              <FiBarChart2 size={14} /> Total Paid Customers: {data.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer name, phone, or email"
              className="w-full bg-white border border-[#E2E8F0] rounded-full pl-11 pr-10 py-3 text-sm placeholder-[#94A3B8] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 transition" />
            {search && <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#334155]"><FiX size={16} /></button>}
          </div>

          {/* Type tabs — underline style */}
          <div className="flex gap-6 border-b border-[#F1F5F9]">
            {[{ key: "all", label: "All Types" }, { key: "1", label: "Retail" }, { key: "2", label: "Wholesale" }].map(({ key, label }) => (
              <button key={key} onClick={() => setTypeFilter(key)}
                className={`pb-3 text-sm font-bold transition border-b-2 -mb-px ${
                  typeFilter === key ? "text-[#16A34A] border-[#16A34A]" : "text-[#94A3B8] border-transparent hover:text-[#334155]"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl overflow-hidden shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                    {["Customer", "Type", "Phone", "Address", "Orders", "Total Spent", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {rows.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-16 text-[#94A3B8] text-sm">No paid customers found 🔍</td></tr>
                  ) : rows.map((c) => (
                    <tr key={c.customerId || c.name} className="hover:bg-[#F8FAFC] transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarBg(c.customerId || c.name)}`}>{initials(c.name)}</div>
                          <div>
                            <div className="text-sm font-bold text-[#0F172A] whitespace-nowrap">{c.name}</div>
                            <div className="text-xs text-[#94A3B8]">{c.email || <span className="italic">No email</span>}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${typeStyle(c.customerType)}`}>{typeLabel(c.customerType)}</span></td>
                      <td className="px-5 py-4 text-sm text-[#64748B] whitespace-nowrap">{c.phone}</td>
                      <td className="px-5 py-4 text-sm text-[#64748B]"><span className="truncate block max-w-[140px]">{c.address || "—"}</span></td>
                      <td className="px-5 py-4 text-sm font-bold text-[#334155]">{c.invoiceCount}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#334155] whitespace-nowrap">{fmt(c.totalPaid)}</td>
                      <td className="px-5 py-4"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${c.status === "active" ? "bg-emerald-50 text-[#16A34A]" : "bg-[#F1F5F9] text-[#94A3B8]"}`}>{c.status}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${c.phone}`} className="text-[11px] font-bold text-white bg-[#16A34A] hover:bg-[#15803D] px-3 py-1.5 rounded-full transition">Call</a>
                          <button onClick={() => setDrawer(c)} className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full transition">View</button>
                          <button onClick={() => setDelId(c.customerId || c.name)} className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-full transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-[#F1F5F9]">
              {rows.length === 0 ? (
                <div className="text-center py-16 text-[#94A3B8] text-sm">No paid customers found 🔍</div>
              ) : rows.map((c) => (
                <div key={c.customerId || c.name} className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarBg(c.customerId || c.name)}`}>{initials(c.name)}</div>
                      <div>
                        <div className="text-sm font-bold text-[#0F172A]">{c.name}</div>
                        <div className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5"><FiPhone size={11} />{c.phone}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#16A34A]">Paid</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeStyle(c.customerType)}`}>{typeLabel(c.customerType)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-[#F8FAFC] rounded-xl p-3 text-center"><div className="text-sm font-bold text-[#0F172A]">{c.invoiceCount}</div><div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Orders</div></div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center"><div className="text-xs font-bold text-emerald-700">{fmt(c.totalPaid)}</div><div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Total Spent</div></div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${c.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-2.5 rounded-xl text-xs transition"><FiPhone size={13} />Call</a>
                    <button onClick={() => setDrawer(c)} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition"><FiEye size={13} />View</button>
                    <button onClick={() => setDelId(c.customerId || c.name)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs transition"><FiTrash2 size={13} />Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-[#94A3B8] text-xs font-medium">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} accent="#16A34A" />
            </div>
          )}

          {/* CSV Export Section */}
          <div className="bg-[#0F172A] rounded-2xl p-5">
            <p className="text-white/60 text-xs font-bold uppercase tracking-wide mb-3">CSV Export Section</p>
            <button onClick={() => downloadCsv(data)} className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3 rounded-xl text-sm transition">
              <FiDownload size={16} /> Download All Customer Data (CSV)
            </button>
          </div>

          <p className="text-center text-[#94A3B8] text-sm pb-4">Khulna Hardware Mart · Paid Customers</p>
        </div>
      </div>
    </div>
  );
}