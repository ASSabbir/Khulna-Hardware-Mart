// FILE: src/Pages/Customer/PaidCustomers.jsx (FULL REPLACEMENT — your exact design, real backend data, CSV kept)
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiCheckCircle, FiSearch, FiX, FiEye, FiTrash2,
  FiPhone, FiMail, FiMapPin, FiCalendar, FiShoppingBag,
  FiTag, FiFileText, FiChevronLeft, FiChevronRight, FiDownload, FiLoader,
} from "react-icons/fi";
import InvoicePreviewModal from "./InvoicePreviewModal";

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
  1: { label: "Retail", style: "bg-blue-100 text-blue-700" },
  2: { label: "Wholesale", style: "bg-purple-100 text-purple-700" },
};
const typeLabel = (t) => CUSTOMER_TYPES[t]?.label || CUSTOMER_TYPES[1].label;
const typeStyle = (t) => CUSTOMER_TYPES[t]?.style || CUSTOMER_TYPES[1].style;

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
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Customer Info</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><FiX size={20} className="text-gray-500" /></button>
        </div>
        <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${avatarBg(c.customerId || c.name)}`}>{initials(c.name)}</div>
          <div>
            <div className="text-xl font-bold text-gray-900">{c.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 text-sm px-3 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">
                <FiCheckCircle size={12} /> Fully Paid
              </span>
              <span className={`inline-flex items-center gap-1 text-sm px-3 py-0.5 rounded-full font-semibold ${typeStyle(c.customerType)}`}>
                <FiTag size={11} /> {typeLabel(c.customerType)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5">
          <a href={`tel:${c.phone}`} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl text-base transition">
            <FiPhone size={17} /> Call {c.name.split(" ")[0]}
          </a>
        </div>

        <div className="px-6 py-5 space-y-4">
          {[
            { icon: <FiPhone size={15} />, label: "Phone", val: c.phone },
            { icon: <FiMail size={15} />, label: "Email", val: c.email || "Not provided" },
            { icon: <FiMapPin size={15} />, label: "Address", val: c.address || "—" },
            { icon: <FiCalendar size={15} />, label: "Joined", val: fmtDate(c.joinedAt) },
            { icon: <FiCalendar size={15} />, label: "Last Order", val: fmtDate(c.lastOrderDate) },
          ].map(({ icon, label, val }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">{icon}</div>
              <div>
                <div className="text-xs text-gray-400">{label}</div>
                <div className={`text-base font-medium ${val === "Not provided" ? "text-gray-400 italic" : "text-gray-800"}`}>{val}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mx-6" />
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="text-green-700 text-xl font-bold">{fmt(c.totalPaid)}</div>
            <div className="text-green-600 text-sm mt-0.5">Total spent</div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="text-blue-700 text-xl font-bold">{c.invoiceCount}</div>
            <div className="text-blue-600 text-sm mt-0.5">Orders</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 col-span-2">
            <div className="text-green-600 text-xl font-bold">No due</div>
            <div className="text-sm mt-0.5 text-green-500">All cleared — great customer!</div>
          </div>
        </div>

        <div className="border-t border-gray-100 mx-6" />
        <div className="px-6 py-5">
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5"><FiFileText size={13} /> Invoice History</p>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center"><FiLoader className="animate-spin" size={14} /> Loading…</div>
          ) : invoices.length === 0 ? (
            <p className="text-gray-400 text-base text-center py-6 bg-gray-50 rounded-xl">No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv._id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-base font-semibold text-gray-800">{inv.invoiceNumber}</div>
                    <div className="text-xs text-gray-400">{inv.invoiceDate}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-base font-bold text-gray-800">{fmt(inv.grandTotal)}</div>
                    <button onClick={() => onPreview(inv._id)} title="Open & Print" className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition">
                      <FiDownload size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto px-6 pb-6">
          <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl text-base transition">Close</button>
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl text-base font-medium flex items-center gap-2">
          <FiCheckCircle size={18} /> {toast}
        </div>
      )}

      {previewId && <InvoicePreviewModal invoiceId={previewId} onClose={() => setPreviewId(null)} />}

      {delId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-3">🗑️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove customer?</h3>
            <p className="text-gray-500 text-base mb-6"><strong>{data.find((c) => (c.customerId || c.name) === delId)?.name}</strong> will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition">Remove</button>
            </div>
          </div>
        </div>
      )}

      <Drawer c={drawer} onClose={() => setDrawer(null)} onPreview={setPreviewId} />

      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white"><FiCheckCircle size={24} /></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Paid Customers</h1>
            <p className="text-gray-500 text-base mt-0.5">Customers with no outstanding due — the good ones!</p>
          </div>
          <div className="ml-auto bg-green-100 text-green-700 text-xl font-bold px-5 py-2 rounded-2xl">{data.length} paid</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-5">
        <div className="relative">
          <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone or email..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><FiX size={16} /></button>}
        </div>

        <div className="flex flex-wrap gap-2">
          {[{ key: "all", label: "All Types" }, { key: "1", label: "Retail" }, { key: "2", label: "Wholesale" }].map(({ key, label }) => (
            <button key={key} onClick={() => setTypeFilter(key)}
              className={`px-4 py-2 rounded-xl text-base font-semibold transition ${typeFilter === key ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-green-400"}`}>
              {label}
            </button>
          ))}
        </div>

        <p className="text-gray-400 text-base">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Customer", "Type", "Phone", "Address", "Orders", "Total Spent", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-base font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-gray-400 text-lg">No paid customers found 🔍</td></tr>
                ) : rows.map((c) => (
                  <tr key={c.customerId || c.name} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarBg(c.customerId || c.name)}`}>{initials(c.name)}</div>
                        <div>
                          <div className="text-base font-semibold text-gray-900 whitespace-nowrap">{c.name}</div>
                          <div className="text-sm text-gray-400">{c.email || <span className="italic">No email</span>}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className={`text-sm font-semibold px-2.5 py-1 rounded-lg ${typeStyle(c.customerType)}`}>{typeLabel(c.customerType)}</span></td>
                    <td className="px-5 py-4 text-base text-gray-700 whitespace-nowrap"><span className="flex items-center gap-1.5"><FiPhone size={13} className="text-gray-400" />{c.phone}</span></td>
                    <td className="px-5 py-4 text-base text-gray-500"><span className="flex items-center gap-1.5 max-w-[140px]"><FiMapPin size={13} className="text-gray-400 flex-shrink-0" /><span className="truncate">{c.address || "—"}</span></span></td>
                    <td className="px-5 py-4"><span className="flex items-center gap-1.5 text-base font-semibold text-gray-800"><FiShoppingBag size={13} className="text-gray-400" />{c.invoiceCount}</span></td>
                    <td className="px-5 py-4 text-base font-semibold text-gray-800 whitespace-nowrap">{fmt(c.totalPaid)}</td>
                    <td className="px-5 py-4"><span className={`text-sm font-semibold px-3 py-1 rounded-lg capitalize ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.status}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <a href={`tel:${c.phone}`} className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"><FiPhone size={16} /></a>
                        <button onClick={() => setDrawer(c)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"><FiEye size={16} /></button>
                        <button onClick={() => setDelId(c.customerId || c.name)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-gray-100">
            {rows.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-lg">No paid customers found 🔍</div>
            ) : rows.map((c) => (
              <div key={c.customerId || c.name} className="p-5">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold ${avatarBg(c.customerId || c.name)}`}>{initials(c.name)}</div>
                    <div>
                      <div className="text-base font-bold text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1"><FiPhone size={12} />{c.phone}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-green-100 text-green-700">Paid</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg ${typeStyle(c.customerType)}`}>{typeLabel(c.customerType)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-base font-bold text-gray-900">{c.invoiceCount}</div><div className="text-xs text-gray-400 mt-0.5">Orders</div></div>
                  <div className="bg-green-50 rounded-xl p-3 text-center"><div className="text-sm font-bold text-green-700">{fmt(c.totalPaid)}</div><div className="text-xs text-gray-400 mt-0.5">Total Spent</div></div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${c.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 font-semibold py-2.5 rounded-xl text-base transition"><FiPhone size={15} />Call</a>
                  <button onClick={() => setDrawer(c)} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2.5 rounded-xl text-base transition"><FiEye size={15} />View</button>
                  <button onClick={() => setDelId(c.customerId || c.name)} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 font-semibold py-2.5 rounded-xl text-base transition"><FiTrash2 size={15} />Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-gray-400 text-sm">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition">
                <FiChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i - 1] > 1) acc.push("…"); acc.push(n); return acc; }, [])
                .map((n, i) => n === "…" ? (
                  <span key={`gap-${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${page === n ? "bg-green-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                    {n}
                  </button>
                ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition">
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button onClick={() => downloadCsv(data)} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl text-base transition">
            <FiDownload size={17} /> Download All Customer Data (CSV)
          </button>
        </div>

        <p className="text-center text-gray-400 text-base pb-4">Khulna Hardware Mart · Paid Customers</p>
      </div>
    </div>
  );
}