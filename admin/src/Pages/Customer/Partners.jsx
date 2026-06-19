import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiUsers, FiSearch, FiX, FiPlus, FiEye, FiTrash2,
  FiPhone, FiMail, FiMapPin, FiCalendar, FiEdit2,
  FiStar, FiPackage, FiDollarSign, FiCheckCircle,
  FiAlertCircle, FiUser, FiTag, FiFileText,
} from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const CATEGORIES = ["Distribution", "Logistics", "Technology", "Courier", "Finance", "Marketing", "Other"];

const STATUS_STYLE = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
};

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <FiStar key={s} size={13} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
      ))}
    </div>
  );
}

// Add/Edit Modal
function PartnerModal({ existing, onClose, onSave }) {
  const [form, setForm] = useState(
    existing || {
      companyName: "", contactPerson: "", phone: "", email: "",
      address: "", category: "", rating: 5, notes: "", status: "active",
    }
  );
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.contactPerson.trim()) e.contactPerson = "Contact person is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.category) e.category = "Select a category";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      ...form,
      totalBusinessAmount: existing?.totalBusinessAmount || 0,
      productsSupplied: existing?.productsSupplied || 0,
      rating: Number(form.rating),
    });
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
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{existing ? "Edit Partner" : "Add New Partner"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><FiX size={20} className="text-gray-500"/></button>
        </div>
        <div className="px-7 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Company Name" fkey="companyName" placeholder="e.g. Delta Trading Co." required />
          <Field label="Contact Person" fkey="contactPerson" placeholder="e.g. Arif Hossain" required />
          <Field label="Phone Number" fkey="phone" placeholder="e.g. 01711-000000" required />
          <Field label="Email Address" fkey="email" type="email" placeholder="e.g. info@company.bd" />
          <div className="sm:col-span-2">
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Address</label>
            <input value={form.address || ""} onChange={set("address")} placeholder="Full address"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={set("category")}
              className={`w-full bg-gray-50 border ${errors.category ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition`}>
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={13}/>{errors.category}</p>}
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Rating</label>
            <select value={form.rating} onChange={set("rating")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Status</label>
            <select value={form.status} onChange={set("status")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea value={form.notes || ""} onChange={set("notes")} rows={3} placeholder="Any notes about this partner..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"/>
          </div>
        </div>
        <div className="px-7 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl text-base hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-base transition">
            {existing ? "Save Changes" : "Add Partner"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Detail Drawer
function DetailDrawer({ p, onClose, onEdit, onDelete }) {
  if (!p) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose}/>
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Partner Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><FiX size={20} className="text-gray-500"/></button>
        </div>
        <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center text-white text-2xl font-bold">
            {p.companyName?.charAt(0) || "P"}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 leading-tight">{p.companyName}</div>
            <Stars rating={p.rating}/>
            <span className={`inline-block text-sm px-2.5 py-0.5 rounded-full font-semibold mt-1.5 ${STATUS_STYLE[p.status]}`}>{p.status}</span>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { icon: <FiUser size={15}/>, label: "Contact", val: p.contactPerson },
            { icon: <FiPhone size={15}/>, label: "Phone", val: p.phone },
            { icon: <FiMail size={15}/>, label: "Email", val: p.email || "Not provided" },
            { icon: <FiMapPin size={15}/>, label: "Address", val: p.address || "—" },
            { icon: <FiTag size={15}/>, label: "Category", val: p.category },
            { icon: <FiCalendar size={15}/>, label: "Since", val: fmtDate(p.createdAt) },
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
        <div className="border-t border-gray-100 mx-6"/>
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="text-green-700 text-xl font-bold">{fmt(p.totalBusinessAmount)}</div>
            <div className="text-green-600 text-sm mt-0.5">Total business</div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="text-blue-700 text-xl font-bold">{p.productsSupplied || 0}</div>
            <div className="text-blue-600 text-sm mt-0.5">Products linked</div>
          </div>
          {p.notes && (
            <div className="col-span-2 bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">Notes</div>
              <div className="text-base text-gray-700">{p.notes}</div>
            </div>
          )}
        </div>
        <div className="mt-auto px-6 pb-6 flex gap-3">
          <button onClick={() => { onClose(); onEdit(p); }} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-base transition">
            <FiEdit2 size={15}/> Edit
          </button>
          <button onClick={() => { onClose(); onDelete(p._id); }} className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-base transition">
            <FiTrash2 size={15}/> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// MAIN PAGE
export default function Partners() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(null);
  const [delId, setDelId] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: filter });
      const res = await axios.get(`http://localhost:5000/api/partners?${params}`);
      setData(res.data.partners);
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to load partners", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 2800);
  };

  const handleSave = async (partner) => {
    try {
      if (partner._id) {
        await axios.put(`http://localhost:5000/api/partners/${partner._id}`, partner);
        showToast("Partner updated successfully.");
      } else {
        await axios.post("http://localhost:5000/api/partners", partner);
        showToast("New partner added successfully.");
      }
      fetchPartners();
      setModal(null);
    } catch (err) {
      showToast("Failed to save partner", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/partners/${delId}`);
      showToast("Partner removed.");
      fetchPartners();
      setDelId(null);
      setDrawer(null);
    } catch (err) {
      showToast("Failed to delete partner", "error");
    }
  };

  const rows = data || [];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-11 h-11 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-base">Loading partners...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-base font-medium flex items-center gap-2 text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          <FiCheckCircle size={18}/> {toast.msg}
        </div>
      )}

      {delId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><FiTrash2 size={24} className="text-red-500"/></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Partner</h3>
            <p className="text-gray-500 text-base mb-6">This partner will be removed permanently.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition">Remove</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <PartnerModal
          existing={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <DetailDrawer p={drawer} onClose={() => setDrawer(null)} onEdit={(p) => setModal(p)} onDelete={(id) => setDelId(id)} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shrink-0"><FiUsers size={24}/></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Partners</h1>
            <p className="text-gray-500 text-base mt-0.5">Manage all your business partnerships in one place</p>
          </div>
          <button onClick={() => setModal("add")} className="ml-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl text-base transition">
            <FiPlus size={18}/> Add Partner
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <FiUsers size={20}/>, label: "Total Partners", val: (data||[]).length, color: "bg-green-600" },
            { icon: <FiCheckCircle size={20}/>, label: "Active", val: (data||[]).filter(d=>d.status==="active").length, color: "bg-blue-600" },
            { icon: <FiDollarSign size={20}/>, label: "Total Business", val: fmt((data||[]).reduce((s,d)=>s+(d.totalBusinessAmount||0),0)), color: "bg-purple-600" },
            { icon: <FiPackage size={20}/>, label: "Products Linked", val: (data||[]).reduce((s,d)=>s+(d.productsSupplied||0),0), color: "bg-orange-500" },
          ].map(({ icon, label, val, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${color}`}>{icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900 leading-none">{val}</div>
                <div className="text-base text-gray-500 mt-1">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company, person or category..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition"/>
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><FiX size={16}/></button>}
          </div>
          <div className="flex gap-2">
            {["all","active","inactive"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-5 py-3 rounded-xl text-base font-semibold capitalize transition ${filter===s ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-green-400"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <p className="text-gray-400 text-base">{rows.length} partner{rows.length !== 1 ? "s" : ""}</p>

        {/* Cards Grid */}
        {rows.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center text-gray-400 text-lg">No partners found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rows.map((p) => (
              <div key={p._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {p.companyName?.charAt(0) || "P"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-gray-900 leading-tight truncate">{p.companyName}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 capitalize ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Stars rating={p.rating}/>
                    </div>
                    <span className="inline-block text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-lg mt-1">{p.category}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-base text-gray-600"><FiUser size={13} className="text-gray-400 shrink-0"/><span className="truncate">{p.contactPerson}</span></div>
                  <div className="flex items-center gap-2 text-base text-gray-600"><FiPhone size={13} className="text-gray-400 shrink-0"/>{p.phone}</div>
                  <div className="flex items-center gap-2 text-base text-gray-500"><FiMapPin size={13} className="text-gray-400 shrink-0"/><span className="truncate">{p.address || "—"}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="text-sm font-bold text-green-700">{fmt(p.totalBusinessAmount)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Business value</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="text-sm font-bold text-blue-700">{p.productsSupplied || 0}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Products linked</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setDrawer(p)} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-base transition">
                    <FiEye size={15}/> View
                  </button>
                  <button onClick={() => setModal(p)} className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2.5 rounded-xl text-base transition">
                    <FiEdit2 size={15}/> Edit
                  </button>
                  <button onClick={() => setDelId(p._id)} className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition">
                    <FiTrash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-400 text-base pb-4">Khulna Hardware Mart — Business Partners</p>
      </div>
    </div>
  );
}