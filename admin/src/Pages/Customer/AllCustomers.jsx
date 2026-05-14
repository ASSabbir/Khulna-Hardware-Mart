import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiUsers, FiSearch, FiX, FiEye, FiTrash2, FiPlus,
  FiPhone, FiMail, FiMapPin, FiCalendar, FiShoppingBag,
  FiCheckCircle, FiAlertCircle, FiDollarSign, FiEdit2,
} from "react-icons/fi";

const API_URL = "https://khulna-hardware-mart.vercel.app/api/customers";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const COLORS = ["bg-green-600","bg-blue-600","bg-purple-600","bg-orange-500","bg-pink-600","bg-teal-600","bg-indigo-600","bg-rose-500"];
const avatarBg = (name) => COLORS[name?.charCodeAt(0) % COLORS.length] || "bg-green-600";
const initials = (n) => n?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "CU";

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

  const Field = ({ label, fkey, type = "text", placeholder, required }) => (
    <div>
      <label className="block text-base font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type} value={form[fkey] || ""} onChange={set(fkey)} placeholder={placeholder}
        className={`w-full bg-gray-50 border ${errors[fkey] ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition`}
      />
      {errors[fkey] && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={13}/>{errors[fkey]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{existing ? "Edit Customer" : "Add New Customer"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><FiX size={20} className="text-gray-500"/></button>
        </div>
        <div className="px-7 py-6 flex flex-col gap-4">
          <Field label="Customer Name" fkey="name" placeholder="e.g. Karim Bhai" required />
          <Field label="Phone Number" fkey="phone" placeholder="e.g. 01711-000000" />
          <Field label="Email Address" fkey="email" type="email" placeholder="e.g. customer@email.com" />
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Address</label>
            <textarea value={form.address || ""} onChange={set("address")} rows={2} placeholder="Customer address"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"/>
          </div>
          <Field label="Due Amount (৳)" fkey="totalDue" type="number" placeholder="0" />
        </div>
        <div className="px-7 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl text-base hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-base transition">
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Customer Info</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><FiX size={20} className="text-gray-500" /></button>
        </div>
        <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${avatarBg(c.name)}`}>{initials(c.name)}</div>
          <div>
            <div className="text-xl font-bold text-gray-900">{c.name}</div>
            <span className={`inline-block text-sm px-3 py-0.5 rounded-full font-semibold mt-1 ${(c.totalDue || 0) > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
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
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">{icon}</div>
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
            <div className="text-green-700 text-xl font-bold">{fmt(c.totalSpent || 0)}</div>
            <div className="text-green-600 text-sm mt-0.5">Total spent</div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="text-blue-700 text-xl font-bold">{c.totalOrders || 0}</div>
            <div className="text-blue-600 text-sm mt-0.5">Orders</div>
          </div>
          <div className={`${(c.totalDue || 0) > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"} border rounded-xl p-4 col-span-2`}>
            <div className={`text-xl font-bold ${(c.totalDue || 0) > 0 ? "text-red-600" : "text-gray-400"}`}>{(c.totalDue || 0) > 0 ? fmt(c.totalDue) : "No due ✅"}</div>
            <div className="text-sm mt-0.5 text-gray-400">Outstanding due</div>
          </div>
        </div>
        <div className="mt-auto px-6 pb-6 flex gap-3">
          <button onClick={() => { onClose(); onEdit(c); }} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-base transition">
            <FiEdit2 size={15}/> Edit
          </button>
          <button onClick={() => { onClose(); onDelete(c._id); }} className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-base transition">
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

  // Filter based on tab
  const filteredData = data.filter(c => {
    if (tab === "paid") return (c.totalDue || 0) === 0;
    if (tab === "due") return (c.totalDue || 0) > 0;
    return true;
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    </div>
  );

  const s = stats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-base font-medium flex items-center gap-2 text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          <FiCheckCircle size={18} /> {toast.msg}
        </div>
      )}

      {delId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><FiTrash2 size={24} className="text-red-500"/></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Customer</h3>
            <p className="text-gray-500 text-base mb-6">This customer will be removed permanently.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition">Remove</button>
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white"><FiUsers size={24} /></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Customers </h1>
            <p className="text-gray-500 text-base mt-0.5">Every customer in your system</p>
          </div>
          <button onClick={() => setModal("add")} className="ml-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl text-base transition">
            <FiPlus size={18}/> Add Customer
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Customers", val: s.totalCustomers || 0, color: "bg-green-600" },
            { label: "Paid Customers", val: s.totalPaid || 0, color: "bg-blue-600" },
            { label: "With Due", val: s.totalWithDue || 0, color: "bg-red-500" },
            { label: "Total Revenue", val: fmt(s.totalRevenue || 0), color: "bg-purple-600" },
            { label: "Total Due", val: fmt(s.totalDue || 0), color: "bg-orange-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${color}`}>
                {label === "Total Due" ? <FiAlertCircle size={20}/> : label === "Paid Customers" ? <FiCheckCircle size={20}/> : <FiUsers size={20}/>}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 leading-none">{val}</div>
                <div className="text-base text-gray-500 mt-1">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "All Customers", count: s.totalCustomers },
            { key: "paid", label: "Paid", count: s.totalPaid },
            { key: "due", label: "With Due", count: s.totalWithDue },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 rounded-xl text-base font-semibold capitalize transition flex items-center gap-2 ${
                tab === t.key
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-green-400"
              }`}
            >
              {t.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : "bg-gray-100"}`}>
                {t.count || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone or address..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><FiX size={16} /></button>}
        </div>

        <p className="text-gray-400 text-base">{filteredData.length} result{filteredData.length !== 1 ? "s" : ""}</p>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Customer", "Phone", "Address", "Orders", "Total Spent", "Due", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-base font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-lg">No customers found 🔍</td></tr>
                ) : filteredData.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarBg(c.name)}`}>{initials(c.name)}</div>
                        <div>
                          <div className="text-base font-semibold text-gray-900 whitespace-nowrap">{c.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-base text-gray-700 whitespace-nowrap"><span className="flex items-center gap-1.5"><FiPhone size={13} className="text-gray-400" />{c.phone || "—"}</span></td>
                    <td className="px-5 py-4 text-base text-gray-500"><span className="flex items-center gap-1.5 max-w-35"><FiMapPin size={13} className="text-gray-400 shrink-0" /><span className="truncate">{c.address || "—"}</span></span></td>
                    <td className="px-5 py-4"><span className="flex items-center gap-1.5 text-base font-semibold text-gray-800"><FiShoppingBag size={13} className="text-gray-400" />{c.totalOrders || 0}</span></td>
                    <td className="px-5 py-4 text-base font-semibold text-gray-800 whitespace-nowrap">{fmt(c.totalSpent || 0)}</td>
                    <td className="px-5 py-4">{(c.totalDue || 0) > 0 ? <span className="bg-red-100 text-red-600 text-base font-semibold px-3 py-1 rounded-lg">{fmt(c.totalDue)}</span> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDrawer(c)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"><FiEye size={16} /></button>
                        <button onClick={() => setModal(c)} className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"><FiEdit2 size={16} /></button>
                        <button onClick={() => setDelId(c._id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredData.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-lg">No customers found 🔍</div>
            ) : filteredData.map((c) => (
              <div key={c._id} className="p-5">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold ${avatarBg(c.name)}`}>{initials(c.name)}</div>
                    <div>
                      <div className="text-base font-bold text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1"><FiPhone size={12} />{c.phone || "—"}</div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold px-2.5 py-1 rounded-lg capitalize ${(c.totalDue || 0) > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {(c.totalDue || 0) > 0 ? "Due" : "Paid"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-base font-bold text-gray-900">{c.totalOrders || 0}</div><div className="text-xs text-gray-400 mt-0.5">Orders</div></div>
                  <div className="bg-green-50 rounded-xl p-3 text-center"><div className="text-sm font-bold text-green-700">{fmt(c.totalSpent || 0)}</div><div className="text-xs text-gray-400 mt-0.5">Spent</div></div>
                  <div className={`${(c.totalDue || 0) > 0 ? "bg-red-50" : "bg-gray-50"} rounded-xl p-3 text-center`}><div className={`text-sm font-bold ${(c.totalDue || 0) > 0 ? "text-red-600" : "text-gray-400"}`}>{(c.totalDue || 0) > 0 ? fmt(c.totalDue) : "—"}</div><div className="text-xs text-gray-400 mt-0.5">Due</div></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDrawer(c)} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2.5 rounded-xl text-base transition"><FiEye size={15} />View</button>
                  <button onClick={() => setModal(c)} className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 font-semibold py-2.5 rounded-xl text-base transition"><FiEdit2 size={15} />Edit</button>
                  <button onClick={() => setDelId(c._id)} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 font-semibold py-2.5 rounded-xl text-base transition"><FiTrash2 size={15} />Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-gray-400 text-base pb-4">Khulna Hardware Mart · All Customers </p>
      </div>
    </div>
  );
}