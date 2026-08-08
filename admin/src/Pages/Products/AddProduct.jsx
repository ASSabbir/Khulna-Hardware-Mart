// FILE: src/Pages/Products/AddProduct.jsx (FULL REPLACEMENT)
import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiPackage, FiTag, FiDollarSign, FiArchive, FiImage, FiAlertTriangle, FiCheckCircle,
  FiTruck, FiInfo, FiX, FiUpload, FiSave, FiPlus, FiTrash2,
} from "react-icons/fi";

const Section = ({ icon, title, accent = false, children }) => (
  <div className={`bg-white rounded-xl border-2 ${accent ? "border-[#F97316]" : "border-slate-200"} overflow-hidden`}>
    <div className={`flex items-center gap-3 px-5 py-3 border-b-2 ${accent ? "border-[#F97316] bg-[#FFF7ED]" : "border-slate-100 bg-slate-50"}`}>
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? "bg-[#F97316]" : "bg-[#1E3A8A]"}`}>
        {React.cloneElement(icon, { size: 14, className: "text-white" })}
      </span>
      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-sm uppercase tracking-widest">{title}</h2>
    </div>
    <div className="px-5 py-5">{children}</div>
  </div>
);

const Field = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-1">
      {label}{required && <span className="text-[#F97316]">*</span>}
      {hint && <span title={hint} className="text-slate-400 cursor-help"><FiInfo size={11} /></span>}
    </label>
    {children}
  </div>
);

const Input = ({ type = "text", placeholder, value, onChange, prefix, suffix, disabled, className = "", ...rest }) => (
  <div className={`flex items-center border-2 border-slate-200 rounded-lg bg-white overflow-hidden focus-within:border-[#1D4ED8] transition-colors duration-150 ${disabled ? "bg-slate-100" : ""} ${className}`}>
    {prefix && <span className="px-3 py-2.5 bg-slate-50 border-r-2 border-slate-200 text-slate-500 text-sm font-semibold flex-shrink-0">{prefix}</span>}
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} disabled={disabled}
      className={`flex-1 px-3 py-2.5 text-sm text-[#1E293B] placeholder-slate-400 outline-none bg-transparent font-['Barlow',sans-serif] ${disabled ? "cursor-not-allowed text-slate-400" : ""}`} {...rest} />
    {suffix && <span className="px-3 py-2.5 bg-slate-50 border-l-2 border-slate-200 text-slate-500 text-xs font-semibold flex-shrink-0">{suffix}</span>}
  </div>
);

const Select = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange} className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#1E293B] outline-none bg-white focus:border-[#1D4ED8] transition-colors duration-150 font-['Barlow',sans-serif]">
    {children}
  </select>
);

const PricePill = ({ label, value, color }) => (
  <div className={`flex-1 rounded-lg border-2 ${color} px-4 py-3 text-center min-w-[110px]`}>
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">{label}</p>
    <p className="text-base font-bold tabular-nums font-['Barlow_Condensed',sans-serif]">৳ {isNaN(value) || value === "" ? "0.00" : Number(value).toLocaleString("en-BD", { minimumFractionDigits: 2 })}</p>
  </div>
);

const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const DEFAULT_CATEGORIES = ["Hand Tools","Power Tools","Fasteners & Hardware","Pipes & Fittings","Electrical","Paints & Coatings","Safety Equipment","Building Materials","Adhesives & Sealants","Measuring & Marking","Furniture","Stationery"];
const DEFAULT_UNITS = [["pcs","Pieces (pcs)"],["kg","Kilogram (kg)"],["g","Gram (g)"],["m","Meter (m)"],["ft","Feet (ft)"],["L","Litre (L)"],["bag","Bag"],["roll","Roll"],["box","Box"],["set","Set"],["pair","Pair"]];

const emptyPayment = () => ({ id: Date.now() + Math.random(), method: "cash", amount: "", provider: "bKash" });
const emptySupplierRow = (buyingPrice = "") => ({
  id: Date.now() + Math.random(),
  supplierId: "", isOther: false, otherName: "",
  buyingPrice, purchaseDate: new Date().toISOString().slice(0, 10), purchaseQuantity: "",
  payments: [emptyPayment()],
  balance: null, applyCredit: false, creditAmount: "",
});

const AddProduct = () => {
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "", category: "", company: "", origin: "",
    unit: "pcs", unitValue: "", description: "", quality: "", material: "",
    buyingPrice: "", holcellMargin: "3", retailMargin: "5", location: "", status: "active",
  });

  const [images, setImages] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierRows, setSupplierRows] = useState([emptySupplierRow()]);

  const fetchSupplierOptions = () => {
    axios.get("http://localhost:5000/api/suppliers?limit=200").then((res) => setSupplierOptions(res.data.suppliers || [])).catch(() => setSupplierOptions([]));
  };
  useEffect(() => { fetchSupplierOptions(); }, []);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCategoryOther, setIsCategoryOther] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [unitOptions, setUnitOptions] = useState([]);
  const [isUnitOther, setIsUnitOther] = useState(false);
  const [customUnit, setCustomUnit] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/options/productCategory").then((res) => setCategoryOptions(res.data.options || [])).catch(() => setCategoryOptions([]));
    axios.get("http://localhost:5000/api/options/unit").then((res) => setUnitOptions(res.data.options || [])).catch(() => setUnitOptions([]));
  }, []);

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categoryOptions])];
  const allUnits = [...DEFAULT_UNITS, ...unitOptions.filter((u) => !DEFAULT_UNITS.some(([v]) => v === u)).map((u) => [u, u])];

  const handleCategorySelect = (e) => {
    const val = e.target.value;
    if (val === "__others__") { setIsCategoryOther(true); setForm((f) => ({ ...f, category: "" })); }
    else { setIsCategoryOther(false); setForm((f) => ({ ...f, category: val })); }
  };
  const saveCustomCategory = async () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    try {
      const res = await axios.post("http://localhost:5000/api/options/productCategory", { value: trimmed });
      setForm((f) => ({ ...f, category: res.data.value }));
      if (res.data.created) setCategoryOptions((prev) => [...prev, res.data.value]);
    } catch { setForm((f) => ({ ...f, category: trimmed })); }
  };
  const handleUnitSelect = (e) => {
    const val = e.target.value;
    if (val === "__others__") { setIsUnitOther(true); setForm((f) => ({ ...f, unit: "" })); }
    else { setIsUnitOther(false); setForm((f) => ({ ...f, unit: val })); }
  };
  const saveCustomUnit = async () => {
    const trimmed = customUnit.trim();
    if (!trimmed) return;
    try {
      const res = await axios.post("http://localhost:5000/api/options/unit", { value: trimmed });
      setForm((f) => ({ ...f, unit: res.data.value }));
      if (res.data.created) setUnitOptions((prev) => [...prev, res.data.value]);
    } catch { setForm((f) => ({ ...f, unit: trimmed })); }
  };

  const buying = parseFloat(form.buyingPrice) || 0;
  const holcell = buying + buying * (parseFloat(form.holcellMargin) / 100 || 0);
  const retail = buying + buying * (parseFloat(form.retailMargin) / 100 || 0);

  const totalOpeningStock = useMemo(
    () => supplierRows.reduce((sum, r) => sum + (parseInt(r.purchaseQuantity) || 0), 0),
    [supplierRows]
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - images.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages((prev) => [...prev, { url: ev.target.result, name: file.name, file }].slice(0, 4));
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const addSupplierRow = () => setSupplierRows((prev) => [...prev, emptySupplierRow()]);
  const removeSupplierRow = (id) => setSupplierRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  // #5 — supplier row 0's Buying Price is the SAME field as the main Buying Price (bidirectional)
  const updateSupplierRow = (id, field, value) => {
    const isFirstRow = supplierRows[0]?.id === id;
    if (field === "buyingPrice" && isFirstRow) { setForm((f) => ({ ...f, buyingPrice: value })); return; }
    setSupplierRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const setSupplierSelect = (id, value) => {
    const supplierId = value === "__other__" ? "" : value;
    const isOther = value === "__other__";
    setSupplierRows((prev) => prev.map((r) => (r.id === id ? { ...r, supplierId, isOther, balance: null, applyCredit: false, creditAmount: "" } : r)));
    if (!isOther && supplierId) {
      axios.get(`http://localhost:5000/api/supplier-payments/${supplierId}`)
        .then((res) => {
          setSupplierRows((prev) => prev.map((r) => (r.id === id ? { ...r, balance: res.data.balance, creditAmount: res.data.balance?.receivableAmount > 0 ? String(res.data.balance.receivableAmount) : "" } : r)));
        })
        .catch(() => {});
    }
  };
  const setRowApplyCredit = (id, checked) => setSupplierRows((prev) => prev.map((r) => (r.id === id ? { ...r, applyCredit: checked } : r)));

  const addPaymentToRow = (rowId) => setSupplierRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, payments: [...r.payments, emptyPayment()] } : r)));
  const removePaymentFromRow = (rowId, payId) => setSupplierRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, payments: r.payments.length > 1 ? r.payments.filter((p) => p.id !== payId) : r.payments } : r)));
  const updatePaymentInRow = (rowId, payId, field, value) =>
    setSupplierRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, payments: r.payments.map((p) => (p.id === payId ? { ...p, [field]: value } : p)) } : r)));

  const rowTotalCost = (row, idx) => {
    const price = idx === 0 ? buying : (parseFloat(row.buyingPrice) || 0);
    return price * (parseFloat(row.purchaseQuantity) || 0);
  };
  // #adjust — always auto: min(existing receivable, this row's total cost)
  const rowAppliedCredit = (row, idx) => {
    if (!row.applyCredit || !row.balance || row.balance.receivableAmount <= 0) return 0;
    return Math.min(row.balance.receivableAmount, rowTotalCost(row, idx));
  };
  const rowPaidSum = (row) => row.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const validateSupplierRows = () => {
    if (supplierRows.length === 0) return "Add at least one supplier with a purchase quantity to set opening stock.";
    let anyValid = false;
    for (const r of supplierRows) {
      const name = r.isOther ? r.otherName.trim() : "";
      if (!r.supplierId && !name) return "Select a supplier or enter a name for each supplier row.";
      const qty = Number(r.purchaseQuantity);
      if (!Number.isFinite(qty) || qty <= 0) return "Each supplier row needs a valid purchase quantity.";
      anyValid = true;
    }
    if (!buying || buying < 0) return "Enter a valid Buying Price.";
    if (!anyValid) return "Add at least one supplier with a purchase quantity to set opening stock.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.company || !form.buyingPrice) {
      setToast({ type: "error", msg: "Please fill all required fields." });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    const supplierRowError = validateSupplierRows();
    if (supplierRowError) {
      setToast({ type: "error", msg: supplierRowError });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls = await Promise.all(
        images.map(async (img) => {
          const formData = new FormData();
          formData.append("image", img.file);
          const res = await axios.post("https://api.imgbb.com/1/upload?key=9bb7645922ca992881ce70f0bac1f069", formData, { headers: { "Content-Type": "multipart/form-data" } });
          return res.data.data.display_url;
        })
      );

      const suppliersPayload = supplierRows.map((r, idx) => ({
        supplierId: r.isOther ? undefined : r.supplierId || undefined,
        supplierName: r.isOther ? r.otherName.trim() : undefined,
        buyingPrice: idx === 0 ? buying : parseFloat(r.buyingPrice),
        purchaseDate: r.purchaseDate,
        purchaseQuantity: parseInt(r.purchaseQuantity),
        payments: r.payments.filter((p) => (Number(p.amount) || 0) > 0).map((p) => ({ method: p.method, amount: Number(p.amount), provider: p.method === "mobile" ? p.provider : undefined })),
        creditApplied: rowAppliedCredit(r, idx) > 0 ? rowAppliedCredit(r, idx) : undefined,
      }));

      const payload = {
        name: form.name, category: form.category, brand: form.company, origin: form.origin,
        unit: form.unit, unitValue: form.unitValue ? parseFloat(form.unitValue) : null,
        description: form.description, quality: form.quality, material: form.material,
        buyingPrice: parseFloat(form.buyingPrice), holcellPrice: holcell, retailPrice: retail,
        holcellMargin: parseFloat(form.holcellMargin), retailMargin: parseFloat(form.retailMargin),
        location: form.location, status: form.status, images: uploadedUrls, suppliers: suppliersPayload,
      };

      await axios.post("http://localhost:5000/api/products", payload);
      setToast({ type: "success", msg: "Product saved successfully!" });
      handleReset();
      fetchSupplierOptions();
    } catch (error) {
      setToast({ type: "error", msg: error.response?.data?.message || "Failed to save product. Check console for details." });
      console.error("Product save error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleReset = () => {
    setForm({ name: "", category: "", company: "", origin: "", unit: "pcs", unitValue: "", description: "", quality: "", material: "", buyingPrice: "", holcellMargin: "3", retailMargin: "5", location: "", status: "active" });
    setImages([]);
    setSupplierRows([emptySupplierRow()]);
    setIsCategoryOther(false); setCustomCategory("");
    setIsUnitOther(false); setCustomUnit("");
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow_Condensed:wght@600;700&display=swap" rel="stylesheet" />
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border-2 text-sm font-semibold font-['Barlow',sans-serif] ${toast.type === "success" ? "bg-green-50 border-green-400 text-green-700" : "bg-red-50 border-red-400 text-red-700"}`}>
          {toast.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-['Barlow',sans-serif] mx-auto p-20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center flex-shrink-0"><FiPackage size={20} className="text-white" /></div>
            <div>
              <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-2xl uppercase tracking-wide leading-tight">Add New Product</h1>
              <p className="text-slate-400 text-xs font-medium">Khulna Hardware Mart · Inventory Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleReset} className="px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-600 text-sm font-semibold bg-white hover:border-slate-400 transition-colors">Reset</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-[#F97316] bg-[#F97316] text-white text-sm font-bold hover:bg-[#EA6C0A] hover:border-[#EA6C0A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Saving..." : <><FiSave size={15} /> Save Product</>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 flex flex-col gap-5">
            <Section icon={<FiTag />} title="Basic Information" accent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Field label="Product Name" required><Input placeholder="e.g. Heavy Duty Hammer 16oz" value={form.name} onChange={set("name")} /></Field></div>
                <Field label="SKU / Item Code" hint="Auto-generated by system after saving"><Input placeholder="Auto-generated after save" value="Auto-generated" disabled readOnly prefix="#" className="opacity-60 cursor-not-allowed" /></Field>
                <Field label="Category" required>
                  <Select value={isCategoryOther ? "__others__" : form.category} onChange={handleCategorySelect}>
                    <option value="">— Select Category —</option>
                    {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__others__">Others</option>
                  </Select>
                  {isCategoryOther && (
                    <input type="text" autoFocus value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} onBlur={saveCustomCategory}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCustomCategory(); } }}
                      placeholder="Type new category name" className="mt-2 w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1D4ED8] font-['Barlow',sans-serif]" />
                  )}
                </Field>
                <Field label="Brand / Company" required><Input placeholder="e.g. Stanley, Bosch, BSRM" value={form.company} onChange={set("company")} /></Field>
                <Field label="Country of Origin"><Input placeholder="e.g. Bangladesh, China, Germany" value={form.origin} onChange={set("origin")} /></Field>
                <Field label="Quality"><Input placeholder="e.g. Premium, Standard, Economy" value={form.quality} onChange={set("quality")} /></Field>
                <Field label="Material"><Input placeholder="e.g. Steel, Wood, Plastic" value={form.material} onChange={set("material")} /></Field>
                <div className="sm:col-span-2"><Field label="Short Description">
                  <textarea rows={3} placeholder="Brief product description…" value={form.description} onChange={set("description")}
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#1E293B] placeholder-slate-400 outline-none resize-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]" />
                </Field></div>
              </div>
            </Section>

            <Section icon={<FiDollarSign />} title="Pricing">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Buying Price (৳)" required hint="Always mirrors Supplier #1's buying price below, and vice versa.">
                    <Input type="number" placeholder="0.00" value={form.buyingPrice} onChange={set("buyingPrice")} prefix="৳" min="0" step="0.01" />
                  </Field>
                  <Field label="Wholesale Margin (%)"><Input type="number" placeholder="3" value={form.holcellMargin} onChange={set("holcellMargin")} suffix="%" min="0" step="0.1" /></Field>
                  <Field label="Retail Margin (%)"><Input type="number" placeholder="5" value={form.retailMargin} onChange={set("retailMargin")} suffix="%" min="0" step="0.1" /></Field>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <PricePill label="Buying Price" value={buying} color="border-slate-300 text-slate-700" />
                  <PricePill label={`Wholesale (+${form.holcellMargin || 0}%)`} value={holcell} color="border-[#1D4ED8] text-[#1D4ED8]" />
                  <PricePill label={`Retail (+${form.retailMargin || 0}%)`} value={retail} color="border-[#F97316] text-[#F97316]" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">* Wholesale and Retail prices are auto-calculated. You can adjust margins above.</p>
              </div>
            </Section>

            <Section icon={<FiArchive />} title="Stock & Inventory">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Unit of Measure" required>
                  <Select value={isUnitOther ? "__others__" : form.unit} onChange={handleUnitSelect}>
                    {allUnits.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    <option value="__others__">Others</option>
                  </Select>
                  {isUnitOther && (
                    <input type="text" autoFocus value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} onBlur={saveCustomUnit}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCustomUnit(); } }}
                      placeholder="Type new unit name" className="mt-2 w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1D4ED8] font-['Barlow',sans-serif]" />
                  )}
                </Field>
                <Field label="Unit per Carton" hint="Optional — e.g. unit=bag, value=25 means each bag holds 25kg."><Input type="number" placeholder="e.g. 25" value={form.unitValue} onChange={set("unitValue")} min="0" step="0.01" suffix={form.unit} /></Field>
              </div>
              <div className="grid grid-cols-1 gap-4 mb-4"><Field label="Storage Location"><Input placeholder="e.g. Rack B-3, Shelf 2" value={form.location} onChange={set("location")} /></Field></div>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">Total Opening Stock</span>
                <span className="text-lg font-bold text-[#1E293B] font-['Barlow_Condensed',sans-serif]">{totalOpeningStock} {form.unit}{form.unitValue && totalOpeningStock > 0 ? ` (${(totalOpeningStock * parseFloat(form.unitValue)).toLocaleString()} total content)` : ""}</span>
              </div>
              {totalOpeningStock === 0 ? (
                <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-lg px-4 py-2.5 mt-3"><FiAlertTriangle size={14} className="text-red-500" /><span className="text-xs font-semibold text-red-600">No stock yet — add supplier purchase quantities below</span></div>
              ) : totalOpeningStock <= 10 ? (
                <div className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-200 rounded-lg px-4 py-2.5 mt-3"><FiAlertTriangle size={14} className="text-yellow-600" /><span className="text-xs font-semibold text-yellow-700">Low opening stock — consider ordering more soon</span></div>
              ) : (
                <div className="flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-lg px-4 py-2.5 mt-3"><FiCheckCircle size={14} className="text-green-600" /><span className="text-xs font-semibold text-green-700">Stock level looks good</span></div>
              )}
            </Section>
          </div>

          <div className="flex flex-col gap-5">
            <Section icon={<FiInfo />} title="Status">
              <div className="flex flex-col gap-3">
                {["active", "inactive", "discontinued"].map((s) => (
                  <label key={s} className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${form.status === s ? "border-[#1D4ED8] bg-[#EFF6FF]" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <input type="radio" name="status" value={s} checked={form.status === s} onChange={set("status")} className="accent-[#1D4ED8]" />
                    <div><span className="text-sm font-semibold text-[#1E293B] capitalize">{s}</span>
                      <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                        {s === "active" && "Visible and available for sale"}
                        {s === "inactive" && "Hidden from sales, stock retained"}
                        {s === "discontinued" && "No longer stocked or sold"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </Section>

            <Section icon={<FiImage />} title="Product Images">
              <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#F97316] hover:bg-[#FFF7ED] transition-colors duration-150">
                <FiUpload size={24} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Click to upload images</p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB · Max 4 images</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative rounded-lg border-2 border-slate-200 overflow-hidden aspect-square bg-slate-50">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600 transition-colors"><FiX size={12} /></button>
                      {i === 0 && <span className="absolute bottom-1 left-1 bg-[#F97316] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Main</span>}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section icon={<FiTruck />} title="Suppliers & Payment">
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-400">Each row's quantity adds to opening stock. Add one or more payment methods per supplier — unpaid remainder becomes a supplier due, tracked in Suppliers.</p>
                {supplierRows.map((row, idx) => {
                  const price = idx === 0 ? buying : (parseFloat(row.buyingPrice) || 0);
                  const totalCost = rowTotalCost(row, idx);
                  const appliedCredit = rowAppliedCredit(row, idx);
                  const costAfterCredit = Math.max(0, totalCost - appliedCredit);
                  const paidSum = rowPaidSum(row);
                  const due = Math.max(0, costAfterCredit - paidSum);
                  return (
                    <div key={row.id} className="border-2 border-slate-200 rounded-xl p-3 flex flex-col gap-2 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <select value={row.isOther ? "__other__" : row.supplierId} onChange={(e) => setSupplierSelect(row.id, e.target.value)} className="flex-1 text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-2 outline-none bg-white">
                          <option value="">— Select Supplier —</option>
                          {supplierOptions.filter((s) => (s.companyName || s.name || "").trim()).map((s) => <option key={s._id} value={s._id}>{s.companyName || s.name}</option>)}
                          <option value="__other__">Others</option>
                        </select>
                        <button type="button" onClick={() => removeSupplierRow(row.id)} disabled={supplierRows.length === 1} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"><FiTrash2 size={14} /></button>
                      </div>
                      {row.isOther && <input value={row.otherName} onChange={(e) => updateSupplierRow(row.id, "otherName", e.target.value)} placeholder="New supplier name" className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-2 outline-none bg-white" />}

                      {row.balance && (row.balance.payableAmount > 0 || row.balance.receivableAmount > 0) && (
                        <div className={`rounded-lg p-2 text-[11px] border ${row.balance.payableAmount > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                          {row.balance.payableAmount > 0 ? (
                            <p className="font-bold text-red-700">Existing Due: ৳{row.balance.payableAmount.toLocaleString()}</p>
                          ) : (
                            <>
                              <p className="font-bold text-green-700">Existing Receivable: ৳{row.balance.receivableAmount.toLocaleString()}</p>
                              <label className="flex items-center gap-1.5 mt-1 font-bold text-green-800 cursor-pointer select-none">
                                <input type="checkbox" checked={row.applyCredit} onChange={(e) => setRowApplyCredit(row.id, e.target.checked)} className="w-3.5 h-3.5 accent-green-600" />
                                Adjust against this purchase
                              </label>
                              {row.applyCredit && (
                                <p className="text-[10px] text-green-700 mt-1">Auto: ৳{appliedCredit.toLocaleString()} applied · ৳{Math.max(0, row.balance.receivableAmount - appliedCredit).toLocaleString()} remaining</p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" min="0" step="0.01" placeholder="Buying Price" value={idx === 0 ? form.buyingPrice : row.buyingPrice} onChange={(e) => updateSupplierRow(row.id, "buyingPrice", e.target.value)} className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-2 outline-none bg-white" />
                        <input type="number" min="1" placeholder="Quantity" value={row.purchaseQuantity} onChange={(e) => updateSupplierRow(row.id, "purchaseQuantity", e.target.value)} className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-2 outline-none bg-white" />
                        <input type="date" value={row.purchaseDate} onChange={(e) => updateSupplierRow(row.id, "purchaseDate", e.target.value)} className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-2 outline-none bg-white" />
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg p-2 mt-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5"><span>Total Cost</span><span>৳{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        {appliedCredit > 0 && (
                          <div className="flex justify-between text-[11px] font-semibold text-green-700 mb-1.5"><span>Credit Applied</span><span>-৳{appliedCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        )}
                        {row.payments.map((p) => (
                          <div key={p.id} className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <select value={p.method} onChange={(e) => updatePaymentInRow(row.id, p.id, "method", e.target.value)} className="text-[11px] font-semibold border border-slate-200 rounded px-1.5 py-1 outline-none">
                              <option value="cash">Cash</option><option value="mobile">Mobile Banking</option><option value="bank">Bank</option>
                            </select>
                            {p.method === "mobile" && (
                              <select value={p.provider} onChange={(e) => updatePaymentInRow(row.id, p.id, "provider", e.target.value)} className="text-[11px] font-semibold border border-slate-200 rounded px-1.5 py-1 outline-none">
                                {MOBILE_PROVIDERS.map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                              </select>
                            )}
                            <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                              <span className="px-1.5 text-[10px] text-slate-400">৳</span>
                              <input type="number" min="0" step="0.01" value={p.amount} onChange={(e) => updatePaymentInRow(row.id, p.id, "amount", e.target.value)} placeholder="0.00" className="w-16 px-1 py-1 text-[11px] font-semibold outline-none" />
                            </div>
                            <button type="button" onClick={() => removePaymentFromRow(row.id, p.id)} className="ml-auto text-slate-300 hover:text-red-500"><FiX size={12} /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addPaymentToRow(row.id)} className="w-full text-[10px] font-bold text-blue-700 border border-dashed border-blue-300 rounded py-1 hover:bg-blue-50">+ Add Payment Method</button>
                        <div className="flex justify-between text-[11px] font-bold mt-1.5 pt-1.5 border-t border-slate-100">
                          <span className="text-slate-500">Paid: ৳{paidSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className={due > 0 ? "text-red-600" : "text-green-600"}>Due: ৳{due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button type="button" onClick={addSupplierRow} className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg py-2 text-xs font-bold text-slate-500 hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors"><FiPlus size={14} /> Add Supplier</button>
              </div>
            </Section>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 bg-[#1E3A8A] rounded-xl px-6 py-4 border-l-4 border-[#F97316]">
          <div>
            <p className="text-white text-sm font-bold">Ready to save?</p>
            <p className="text-[#93C5FD] text-xs font-medium">SKU is auto-generated per category. Stock comes from the Suppliers section.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleReset} className="px-5 py-2.5 rounded-lg border-2 border-[#3B5EA6] text-[#CBD5E1] text-sm font-semibold bg-transparent hover:border-white hover:text-white transition-colors">Clear Form</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#F97316] border-2 border-[#F97316] text-white text-sm font-bold hover:bg-[#EA6C0A] hover:border-[#EA6C0A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Saving..." : <><FiSave size={15} /> Save Product</>}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddProduct;