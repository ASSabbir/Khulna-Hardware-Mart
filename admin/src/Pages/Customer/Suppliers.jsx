import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiTruck, FiSearch, FiX, FiPlus, FiEye, FiTrash2,
  FiPhone, FiMail, FiMapPin, FiCalendar, FiEdit2,
  FiStar, FiPackage, FiDollarSign, FiCheckCircle,
  FiAlertCircle, FiUser, FiTag, FiCamera, FiNavigation,
  FiCreditCard, FiSmartphone, FiLoader,
} from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const CATEGORIES = ["Plumbing", "Paints", "Hand Tools", "Power Tools", "Washroom", "Electrical", "Safety", "Adhesives", "Other"];

const STATUS_STYLE = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
};

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <FiStar key={s} size={13} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}/>
      ))}
    </div>
  );
}

// Small avatar helper: shows the supplier's photo if present, otherwise the initial-letter fallback
function SupplierAvatar({ p, size = "w-14 h-14", textSize = "text-xl" }) {
  if (p?.profilePicture) {
    return (
      <img
        src={p.profilePicture}
        alt={p.companyName || "Supplier"}
        className={`${size} rounded-2xl object-cover shrink-0 border border-gray-100`}
      />
    );
  }
  return (
    <div className={`${size} rounded-2xl bg-blue-600 flex items-center justify-center text-white ${textSize} font-bold shrink-0`}>
      {p?.companyName?.charAt(0) || "S"}
    </div>
  );
}

// Hoisted OUTSIDE SupplierModal on purpose: defining this inline inside SupplierModal's render
// recreated a brand-new component type on every keystroke, which made React unmount/remount the
// <input> each time — that's what was causing the field to lose focus after one character.
function Field({ label, fkey, form, errors, onChange, type = "text", placeholder, required }) {
  return (
    <div>
      <label className="block text-base font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type} value={form[fkey] || ""} onChange={onChange(fkey)} placeholder={placeholder}
        className={`w-full bg-gray-50 border ${errors[fkey] ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
      />
      {errors[fkey] && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={13}/>{errors[fkey]}</p>}
    </div>
  );
}

// Add/Edit Modal
function SupplierModal({ existing, onClose, onSave }) {
  const [form, setForm] = useState(
    existing || {
      companyName: "", contactPerson: "", phone: "", altPhone: "", email: "",
      location: "", address: "", category: "", rating: 5, notes: "", status: "active",
      profilePicture: "", products: [],
      bankName: "", accountNumber: "", mobileBankingNumber: "",
    }
  );
  const [errors, setErrors] = useState({});
  const [productInput, setProductInput] = useState("");

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, profilePicture: "Please choose an image file" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((p) => ({ ...p, profilePicture: reader.result }));
      setErrors((p) => ({ ...p, profilePicture: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const removePicture = () => setForm((p) => ({ ...p, profilePicture: "" }));

  const addProduct = () => {
    const val = productInput.trim();
    if (!val) return;
    if ((form.products || []).some((x) => x.toLowerCase() === val.toLowerCase())) { setProductInput(""); return; }
    setForm((p) => ({ ...p, products: [...(p.products || []), val] }));
    setProductInput("");
  };

  const removeProduct = (name) => setForm((p) => ({ ...p, products: (p.products || []).filter((x) => x !== name) }));

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
      totalPurchaseAmount: existing?.totalPurchaseAmount || 0,
      productsSupplied: (form.products || []).length,
      rating: Number(form.rating),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{existing ? "Edit Supplier" : "Add New Supplier"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><FiX size={20} className="text-gray-500"/></button>
        </div>

        {/* Profile picture */}
        <div className="px-7 pt-6 flex items-center gap-5">
          <div className="relative">
            {form.profilePicture ? (
              <img src={form.profilePicture} alt="Supplier" className="w-20 h-20 rounded-2xl object-cover border border-gray-100"/>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {form.companyName?.charAt(0) || "S"}
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-50 transition">
              <FiCamera size={14} className="text-gray-600"/>
              <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden"/>
            </label>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">Profile Picture</p>
            <p className="text-sm text-gray-400 mt-0.5">JPG or PNG, tap the camera icon to upload</p>
            {form.profilePicture && (
              <button onClick={removePicture} className="text-sm text-red-500 font-semibold mt-1 hover:underline">Remove photo</button>
            )}
            {errors.profilePicture && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={13}/>{errors.profilePicture}</p>}
          </div>
        </div>

        <div className="px-7 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Company Name" fkey="companyName" form={form} errors={errors} onChange={set} placeholder="e.g. Supreme Pipe Industries" required/>
          <Field label="Contact Person" fkey="contactPerson" form={form} errors={errors} onChange={set} placeholder="e.g. Jahangir Alam" required/>
          <Field label="Phone Number" fkey="phone" form={form} errors={errors} onChange={set} placeholder="e.g. 01711-000000" required/>
          <Field label="Alternate / WhatsApp" fkey="altPhone" form={form} errors={errors} onChange={set} placeholder="e.g. 01911-000000"/>
          <Field label="Email Address" fkey="email" form={form} errors={errors} onChange={set} type="email" placeholder="e.g. info@supplier.bd"/>
          <Field label="Location" fkey="location" form={form} errors={errors} onChange={set} placeholder="e.g. Khulna, Bangladesh"/>

          <div className="sm:col-span-2">
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Address</label>
            <input value={form.address || ""} onChange={set("address")} placeholder="Full address"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={set("category")}
              className={`w-full bg-gray-50 border ${errors.category ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}>
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={13}/>{errors.category}</p>}
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Rating</label>
            <select value={form.rating} onChange={set("rating")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
              {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Status</label>
            <select value={form.status} onChange={set("status")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Product List */}
          <div className="sm:col-span-2">
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Product List</label>
            <div className="flex gap-2">
              <input
                value={productInput}
                onChange={(e) => setProductInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProduct(); } }}
                placeholder="Type a product name and press Enter"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button onClick={addProduct} type="button" className="px-4 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition">
                <FiPlus size={18}/>
              </button>
            </div>
            {(form.products || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.products.map((prod) => (
                  <span key={prod} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-semibold pl-3 pr-2 py-1.5 rounded-full">
                    {prod}
                    <button onClick={() => removeProduct(prod)} type="button" className="hover:text-blue-900"><FiX size={13}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Accounts Info */}
          <div className="sm:col-span-2 bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2"><FiCreditCard size={15}/> Accounts Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Bank Name" fkey="bankName" form={form} errors={errors} onChange={set} placeholder="e.g. Dutch-Bangla Bank"/>
              <Field label="Account Number" fkey="accountNumber" form={form} errors={errors} onChange={set} placeholder="e.g. 1234567890"/>
              <Field label="Mobile Banking No." fkey="mobileBankingNumber" form={form} errors={errors} onChange={set} placeholder="e.g. bKash 01711-000000"/>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea value={form.notes || ""} onChange={set("notes")} rows={3} placeholder="Any notes about this supplier..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"/>
          </div>
        </div>
        <div className="px-7 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl text-base hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-base transition">
            {existing ? "Save Changes" : "Add Supplier"}
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
          <h2 className="text-xl font-bold text-gray-900">Supplier Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><FiX size={20} className="text-gray-500"/></button>
        </div>
        <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100">
          <SupplierAvatar p={p} size="w-16 h-16" textSize="text-2xl"/>
          <div>
            <div className="text-lg font-bold text-gray-900 leading-tight">{p.companyName}</div>
            <Stars rating={p.rating}/>
            <span className={`inline-block text-sm px-2.5 py-0.5 rounded-full font-semibold mt-1.5 ${STATUS_STYLE[p.status]}`}>{p.status}</span>
          </div>
        </div>

        {/* Contact + location */}
        <div className="px-6 py-5 space-y-4">
          {[
            { icon: <FiUser size={15}/>, label: "Contact", val: p.contactPerson },
            { icon: <FiPhone size={15}/>, label: "Phone", val: p.phone },
            { icon: <FiPhone size={15}/>, label: "Alternate / WhatsApp", val: p.altPhone || "Not provided" },
            { icon: <FiMail size={15}/>, label: "Email", val: p.email || "Not provided" },
            { icon: <FiNavigation size={15}/>, label: "Location", val: p.location || "Not provided" },
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

        {/* Purchase stats */}
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="text-blue-700 text-xl font-bold">{fmt(p.totalPurchaseAmount)}</div>
            <div className="text-blue-600 text-sm mt-0.5">Total purchased</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="text-green-700 text-xl font-bold">{p.productsSupplied ?? (p.products || []).length}</div>
            <div className="text-green-600 text-sm mt-0.5">Products supplied</div>
          </div>
        </div>

        {/* Product list */}
        {(p.products || []).length > 0 && (
          <div className="px-6 pb-5">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5"><FiPackage size={13}/> Product List</p>
            <div className="flex flex-wrap gap-2">
              {p.products.map((prod) => (
                <span key={prod} className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">{prod}</span>
              ))}
            </div>
          </div>
        )}

        {/* Accounts info */}
        {(p.bankName || p.accountNumber || p.mobileBankingNumber) && (
          <div className="px-6 pb-5">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5"><FiCreditCard size={13}/> Accounts Info</p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5">
              {p.bankName && (
                <div className="flex items-center gap-2 text-base text-gray-700"><FiCreditCard size={14} className="text-gray-400"/>{p.bankName}{p.accountNumber ? ` — ${p.accountNumber}` : ""}</div>
              )}
              {p.mobileBankingNumber && (
                <div className="flex items-center gap-2 text-base text-gray-700"><FiSmartphone size={14} className="text-gray-400"/>{p.mobileBankingNumber}</div>
              )}
            </div>
          </div>
        )}

        {p.notes && (
          <div className="px-6 pb-5">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">Notes</div>
              <div className="text-base text-gray-700">{p.notes}</div>
            </div>
          </div>
        )}

        <div className="mt-auto px-6 pb-6 flex gap-3">
          <button onClick={() => { onClose(); onEdit(p); }} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-base transition">
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
export default function Suppliers() {
  const [data, setData] = useState([]);

  // Two separate loading flags on purpose:
  // - initialLoading only drives the full-page spinner on first mount
  // - fetching drives a small inline indicator for every later search/filter fetch,
  //   so the whole page (and the search input) never unmounts while you type.
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  // The input is bound to searchInput immediately (so it never feels laggy),
  // and the actual API call uses the debounced `search` value 400ms after you
  // stop typing — this is what stops a request (and a re-render) firing per keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(null);
  const [delId, setDelId] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const fetchSuppliers = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ search, status: filter, category: catFilter });
      const res = await axios.get(`http://localhost:5000/api/suppliers?${params}`);
      setData(res.data.suppliers);
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to load suppliers", type: "error" });
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, [search, filter, catFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 2800);
  };

   const handleSave = async (supplier) => {
    try {
      if (supplier._id) {
        await axios.put(`http://localhost:5000/api/suppliers/${supplier._id}`, supplier);
        showToast("Supplier updated successfully.");
      } else {
        await axios.post("http://localhost:5000/api/suppliers", supplier);
        showToast("New supplier added successfully.");
      }
      fetchSuppliers();
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save supplier", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/suppliers/${delId}`);
      showToast("Supplier removed.");
      fetchSuppliers();
      setDelId(null);
      setDrawer(null);
    } catch (err) {
      showToast("Failed to delete supplier", "error");
    }
  };

  const usedCategories = ["all", ...new Set((data || []).map((d) => d.category).filter(Boolean))];
  const rows = data || [];

  if (initialLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-11 h-11 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-base">Loading suppliers...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-base font-medium flex items-center gap-2 text-white ${toast.type === "success" ? "bg-blue-600" : "bg-red-500"}`}>
          <FiCheckCircle size={18}/> {toast.msg}
        </div>
      )}

      {delId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><FiTrash2 size={24} className="text-red-500"/></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Supplier</h3>
            <p className="text-gray-500 text-base mb-6">This supplier will be removed permanently.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition">Remove</button>
            </div>
          </div>
        </div>
      )}

      {modal && <SupplierModal existing={modal === "add" ? null : modal} onClose={() => setModal(null)} onSave={handleSave}/>}
      <DetailDrawer p={drawer} onClose={() => setDrawer(null)} onEdit={(p) => setModal(p)} onDelete={(id) => setDelId(id)}/>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0"><FiTruck size={24}/></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-500 text-base mt-0.5">All product suppliers and vendors in one place</p>
          </div>
          <button onClick={() => setModal("add")} className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-base transition">
            <FiPlus size={18}/> Add Supplier
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <FiTruck size={20}/>, label: "Total Suppliers", val: (data||[]).length, color: "bg-blue-600" },
            { icon: <FiCheckCircle size={20}/>, label: "Active", val: (data||[]).filter(d=>d.status==="active").length, color: "bg-green-600" },
            { icon: <FiDollarSign size={20}/>, label: "Total Purchased", val: fmt((data||[]).reduce((s,d)=>s+(d.totalPurchaseAmount||0),0)), color: "bg-purple-600" },
            { icon: <FiPackage size={20}/>, label: "Products Supplied", val: (data||[]).reduce((s,d)=>s+(d.productsSupplied||0),0), color: "bg-orange-500" },
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

        {/* Search + Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <FiSearch size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by company, contact person or category..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
            {fetching ? (
              <FiLoader size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"/>
            ) : searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><FiX size={16}/></button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {["all","active","inactive"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-base font-semibold capitalize transition ${filter===s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-blue-400"}`}>
                {s}
              </button>
            ))}
            <div className="w-px bg-gray-200 self-stretch mx-1"/>
            {usedCategories.map((c) => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-4 py-2 rounded-xl text-base font-semibold capitalize transition ${catFilter===c ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <p className="text-gray-400 text-base">{rows.length} supplier{rows.length !== 1 ? "s" : ""}</p>

        {/* Cards */}
        {rows.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center text-gray-400 text-lg">No suppliers found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rows.map((p) => (
              <div key={p._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <SupplierAvatar p={p}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-gray-900 leading-tight truncate">{p.companyName}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 capitalize ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                    </div>
                    <Stars rating={p.rating}/>
                    <span className="inline-block text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-lg mt-1">{p.category}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-base text-gray-600"><FiUser size={13} className="text-gray-400 shrink-0"/><span className="truncate">{p.contactPerson}</span></div>
                  <div className="flex items-center gap-2 text-base text-gray-600"><FiPhone size={13} className="text-gray-400 shrink-0"/>{p.phone}</div>
                  {p.location && (
                    <div className="flex items-center gap-2 text-base text-gray-500"><FiNavigation size={13} className="text-gray-400 shrink-0"/><span className="truncate">{p.location}</span></div>
                  )}
                  <div className="flex items-center gap-2 text-base text-gray-500"><FiMapPin size={13} className="text-gray-400 shrink-0"/><span className="truncate">{p.address || "—"}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="text-sm font-bold text-blue-700">{fmt(p.totalPurchaseAmount)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Total purchased</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="text-sm font-bold text-green-700">{p.productsSupplied ?? (p.products || []).length}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Products supplied</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setDrawer(p)} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-base transition">
                    <FiEye size={15}/> View
                  </button>
                  <button onClick={() => setModal(p)} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2.5 rounded-xl text-base transition">
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

        <p className="text-center text-gray-400 text-base pb-4">Khulna Hardware Mart — Suppliers</p>
      </div>
    </div>
  );
}