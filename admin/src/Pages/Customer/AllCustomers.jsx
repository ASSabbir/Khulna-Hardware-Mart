import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  FiUsers, FiSearch, FiX, FiEye, FiTrash2, FiPlus,
  FiPhone, FiMail, FiMapPin, FiCalendar, FiShoppingBag,
  FiCheckCircle, FiAlertCircle, FiDollarSign, FiEdit2,
  FiGrid, FiBox, FiClipboard, FiTruck, FiFileText, FiSettings,
} from "react-icons/fi";
import Pagination from "../../Components/Pagination";

const PAGE_SIZE = 12;

const API_URL = "http://localhost:5000/api/customers";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const COLORS = ["bg-green-600","bg-blue-600","bg-purple-600","bg-orange-500","bg-pink-600","bg-teal-600","bg-indigo-600","bg-rose-500"];
const avatarBg = (name) => COLORS[name?.charCodeAt(0) % COLORS.length] || "bg-green-600";
const initials = (n) => n?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "CU";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: FiGrid },
  { key: "inventory", label: "Inventory", icon: FiBox },
  { key: "customers", label: "Customers", icon: FiUsers, active: true },
  { key: "orders", label: "Orders", icon: FiClipboard },
  { key: "suppliers", label: "Suppliers", icon: FiTruck },
  { key: "reports", label: "Reports", icon: FiFileText },
  { key: "settings", label: "Settings", icon: FiSettings },
];

// Hoisted OUTSIDE CustomerModal — defining a component inside another component's render
// creates a brand-new function identity every re-render, which makes React unmount/remount
// the <input>, dropping keyboard focus after every single keystroke.
function CustomerField({ label, fkey, value, error, onChange, type = "text", placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-bold text-[#334155] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type} value={value || ""} onChange={onChange} placeholder={placeholder}
        className={`w-full bg-[#F8FAFC] border ${error ? "border-red-400" : "border-[#E2E8F0]"} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 transition`}
      />
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={13}/>{error}</p>}
    </div>
  );
}

// Add/Edit Modal
function CustomerModal({ existing, onClose, onSave }) {
  const [form, setForm] = useState(
    existing || { name: "", phone: "", email: "", address: "", totalDue: 0 }
  );
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Customer name is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#F1F5F9]">
          <h2 className="text-lg font-extrabold text-[#0F172A]">{existing ? "Edit Customer" : "Add New Customer"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-xl transition"><FiX size={20} className="text-[#64748B]"/></button>
        </div>
        <div className="px-7 py-6 flex flex-col gap-4">
          <CustomerField label="Customer Name" value={form.name} onChange={set("name")} error={errors.name} placeholder="e.g. Karim Bhai" required />
          <CustomerField label="Phone Number" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="e.g. 01711-000000" />
          <CustomerField label="Email Address" value={form.email} onChange={set("email")} error={errors.email} type="email" placeholder="e.g. customer@email.com" />
          <div>
            <label className="block text-sm font-bold text-[#334155] mb-1.5">Address</label>
            <textarea value={form.address || ""} onChange={set("address")} rows={2} placeholder="Customer address"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 transition resize-none"/>
          </div>
          <CustomerField label="Due Amount (৳)" value={form.totalDue} onChange={set("totalDue")} error={errors.totalDue} type="number" placeholder="0" />
        </div>
        <div className="px-7 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#E2E8F0] text-[#334155] font-bold py-3.5 rounded-xl text-sm hover:bg-[#F8FAFC] transition">Cancel</button>
          <button onClick={handleSave} className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3.5 rounded-xl text-sm shadow-[0_4px_14px_-2px_rgba(22,163,74,0.35)] transition">
            {existing ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Detail Drawer
function Drawer({ c, onClose, onEdit, onDelete }) {
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
          <div className="w-16 h-16 rounded-full bg-[#334155] flex items-center justify-center text-white text-xl font-extrabold">{initials(c.name)}</div>
          <div>
            <div className="text-lg font-extrabold text-[#0F172A]">{c.name}</div>
            <span className={`inline-block text-xs px-3 py-0.5 rounded-full font-bold mt-1 ${(c.totalDue || 0) > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              {(c.totalDue || 0) > 0 ? "Has Due" : "Paid"}
            </span>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { icon: <FiPhone size={15} />, label: "Phone", val: c.phone || "Not provided" },
            { icon: <FiMail size={15} />, label: "Email", val: c.email || "Not provided" },
            { icon: <FiMapPin size={15} />, label: "Address", val: c.address || "—" },
            { icon: <FiCalendar size={15} />, label: "Joined", val: fmtDate(c.createdAt) },
            { icon: <FiCalendar size={15} />, label: "Last Order", val: c.lastOrderDate ? fmtDate(c.lastOrderDate) : "No orders yet" },
          ].map(({ icon, label, val }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#64748B] shrink-0">{icon}</div>
              <div>
                <div className="text-xs text-[#94A3B8] font-semibold">{label}</div>
                <div className={`text-sm font-semibold ${val === "Not provided" ? "text-[#94A3B8] italic" : "text-[#0F172A]"}`}>{val}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#F1F5F9] mx-6" />
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <div className="text-emerald-700 text-lg font-extrabold">{fmt(c.totalSpent || 0)}</div>
            <div className="text-emerald-600 text-xs mt-0.5 font-semibold">Total spent</div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="text-blue-700 text-lg font-extrabold">{c.totalOrders || 0}</div>
            <div className="text-blue-600 text-xs mt-0.5 font-semibold">Orders</div>
          </div>
          <div className={`${(c.totalDue || 0) > 0 ? "bg-red-50 border-red-100" : "bg-[#F8FAFC] border-[#F1F5F9]"} border rounded-xl p-4 col-span-2`}>
            <div className={`text-lg font-extrabold ${(c.totalDue || 0) > 0 ? "text-red-600" : "text-[#94A3B8]"}`}>{(c.totalDue || 0) > 0 ? fmt(c.totalDue) : "No due ✅"}</div>
            <div className="text-xs mt-0.5 text-[#94A3B8] font-semibold">Outstanding due</div>
          </div>
        </div>
        <div className="mt-auto px-6 pb-6 flex gap-3">
          <button onClick={() => { onClose(); onEdit(c); }} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition">
            <FiEdit2 size={15}/> Edit
          </button>
          <button onClick={() => { onClose(); onDelete(c._id); }} className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition">
            <FiTrash2 size={15}/> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllCustomers() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(null);
  const [delId, setDelId] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}?search=${search}`),
        axios.get(`${API_URL}/stats`),
      ]);
      setData(custRes.data.customers);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to load customers", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 2800);
  };

  const handleSave = async (customer) => {
    try {
      if (customer._id) {
        await axios.put(`${API_URL}/${customer._id}`, customer);
        showToast("Customer updated.");
      } else {
        await axios.post(API_URL, customer);
        showToast("Customer added.");
      }
      fetchData();
      setModal(null);
    } catch (err) {
      showToast("Failed to save customer", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/${delId}`);
      showToast("Customer deleted.");
      fetchData();
      setDelId(null);
      setDrawer(null);
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

    // Filter based on tab — Phase 10 C6: memoized so it doesn't recompute on every unrelated re-render (modal open/close, toast, etc.)
  const filteredData = useMemo(() => data.filter(c => {
    if (tab === "paid") return (c.totalDue || 0) === 0;
    if (tab === "due") return (c.totalDue || 0) > 0;
    return true;
  }), [data, tab]);

  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [tab, search]);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#64748B] text-sm font-medium">Loading...</p>
      </div>
    </div>
  );

  const s = stats || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex">


      {/* ══════════════════ MAIN ══════════════════ */}
      <div className="flex-1 min-w-0">
        {toast.msg && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 text-white ${toast.type === "success" ? "bg-[#16A34A]" : "bg-red-500"}`}>
            <FiCheckCircle size={18} /> {toast.msg}
          </div>
        )}

        {delId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><FiTrash2 size={24} className="text-red-500"/></div>
              <h3 className="text-lg font-extrabold text-[#0F172A] mb-2">Remove Customer</h3>
              <p className="text-[#64748B] text-sm mb-6">This customer will be removed permanently.</p>
              <div className="flex gap-3">
                <button onClick={() => setDelId(null)} className="flex-1 border border-[#E2E8F0] text-[#334155] font-bold py-3 rounded-xl hover:bg-[#F8FAFC] transition">Cancel</button>
                <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition">Remove</button>
              </div>
            </div>
          </div>
        )}

        {modal && (
          <CustomerModal
            existing={modal === "add" ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}

        <Drawer c={drawer} onClose={() => setDrawer(null)} onEdit={(c) => setModal(c)} onDelete={(id) => setDelId(id)} />

        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

          {/* Breadcrumb */}
          <p className="text-sm text-[#94A3B8] font-semibold">ERP</p>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#16A34A] rounded-2xl flex items-center justify-center text-white shadow-[0_4px_14px_-2px_rgba(22,163,74,0.35)]"><FiUsers size={22} /></div>
              <div>
                <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0F172A] tracking-tight">All Customers</h1>
                <p className="text-[#94A3B8] text-sm mt-0.5">Every customer in your system</p>
              </div>
            </div>
            <button onClick={() => setModal("add")} className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold px-5 py-3 rounded-xl text-sm shadow-[0_4px_14px_-2px_rgba(22,163,74,0.35)] transition">
              <FiPlus size={17}/> Add Customer
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Total Customers", val: s.totalCustomers || 0, icon: FiUsers, bg: "bg-emerald-500", trend: null },
              { label: "Paid Customers", val: s.totalPaid || 0, icon: FiCheckCircle, bg: "bg-emerald-500", trend: "+2.8%" },
              { label: "Customers With Due", val: s.totalWithDue || 0, icon: FiAlertCircle, bg: "bg-red-500", trend: "+1.5%" },
              { label: "Total Revenue", val: fmt(s.totalRevenue || 0), icon: FiDollarSign, bg: "bg-blue-500", trend: null },
              { label: "Total Due", val: fmt(s.totalDue || 0), icon: FiDollarSign, bg: "bg-red-500", trend: null },
            ].map(({ label, val, icon: Icon, bg, trend }) => (
              <div key={label} className="bg-white border border-[#F1F5F9] rounded-2xl p-4 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${bg}`}>
                    <Icon size={13} />
                  </span>
                  <span className="text-[11px] font-bold text-[#64748B]">{label}</span>
                </div>
                <div className="flex items-end gap-2 mt-2">
                  <div className="text-xl font-extrabold text-[#0F172A] leading-none">{val}</div>
                  {trend && <span className="text-[10px] font-bold text-[#16A34A] mb-0.5">{trend}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs + Search */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all", label: "All Customers" },
                { key: "paid", label: "Paid" },
                { key: "due", label: "With Due" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition ${
                    tab === t.key
                      ? "bg-[#16A34A] text-white shadow-[0_4px_14px_-2px_rgba(22,163,74,0.35)]"
                      : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#16A34A]/40"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 md:max-w-sm md:ml-auto">
              <FiSearch size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone..."
                className="w-full bg-white border border-[#E2E8F0] rounded-full pl-11 pr-10 py-2.5 text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 transition" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#334155]"><FiX size={16} /></button>}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl overflow-hidden shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)]">
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                    {["Customer", "Phone", "Address", "Orders", "Total Spent", "Due", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {pagedData.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16 text-[#94A3B8] text-sm">No customers found 🔍</td></tr>
                  ) : pagedData.map((c) => (
                    <tr key={c._id} className="hover:bg-[#F8FAFC] transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#334155] flex items-center justify-center text-white text-xs font-bold shrink-0">{initials(c.name)}</div>
                          <div>
                            <div className="text-sm font-bold text-[#0F172A] whitespace-nowrap">{c.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#64748B] whitespace-nowrap">{c.phone || "—"}</td>
                      <td className="px-5 py-4 text-sm text-[#64748B]"><span className="truncate block max-w-[140px]">{c.address || "—"}</span></td>
                      <td className="px-5 py-4 text-sm font-bold text-[#334155]">{c.totalOrders || 0}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#334155] whitespace-nowrap">{fmt(c.totalSpent || 0)}</td>
                      <td className="px-5 py-4">{(c.totalDue || 0) > 0 ? <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">{fmt(c.totalDue)}</span> : <span className="text-[#CBD5E1]">—</span>}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setDrawer(c)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"><FiEye size={15} /></button>
                          <button onClick={() => setModal(c)} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] rounded-lg transition"><FiEdit2 size={15} /></button>
                          <button onClick={() => setDelId(c._id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"><FiTrash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y divide-[#F1F5F9]">
              {pagedData.length === 0 ? (
                <div className="text-center py-16 text-[#94A3B8] text-sm">No customers found 🔍</div>
              ) : pagedData.map((c) => (
                <div key={c._id} className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#334155] flex items-center justify-center text-white font-bold text-sm">{initials(c.name)}</div>
                      <div>
                        <div className="text-sm font-bold text-[#0F172A]">{c.name}</div>
                        <div className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5"><FiPhone size={11} />{c.phone || "—"}</div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${(c.totalDue || 0) > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {(c.totalDue || 0) > 0 ? "Due" : "Paid"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-[#F8FAFC] rounded-xl p-3 text-center"><div className="text-sm font-bold text-[#0F172A]">{c.totalOrders || 0}</div><div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Orders</div></div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center"><div className="text-xs font-bold text-emerald-700">{fmt(c.totalSpent || 0)}</div><div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Spent</div></div>
                    <div className={`${(c.totalDue || 0) > 0 ? "bg-red-50" : "bg-[#F8FAFC]"} rounded-xl p-3 text-center`}><div className={`text-xs font-bold ${(c.totalDue || 0) > 0 ? "text-red-600" : "text-[#94A3B8]"}`}>{(c.totalDue || 0) > 0 ? fmt(c.totalDue) : "—"}</div><div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">Due</div></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setDrawer(c)} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2.5 rounded-xl text-xs transition"><FiEye size={14} />View</button>
                    <button onClick={() => setModal(c)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] font-bold py-2.5 rounded-xl text-xs transition"><FiEdit2 size={14} />Edit</button>
                    <button onClick={() => setDelId(c._id)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 font-bold py-2.5 rounded-xl text-xs transition"><FiTrash2 size={14} />Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} className="pt-2" />

          <p className="text-center text-[#94A3B8] text-sm pb-4">Khulna Hardware Mart · All Customers</p>
        </div>
      </div>
    </div>
  );
}