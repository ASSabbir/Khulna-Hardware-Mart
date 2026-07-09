// FILE: src/Pages/Products/EditProduct.jsx (NEW)
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiPackage, FiTag, FiDollarSign, FiArchive, FiImage, FiAlertTriangle,
  FiCheckCircle, FiTruck, FiInfo, FiX, FiUpload, FiSave, FiArrowLeft, FiRefreshCw,
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

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
      {label} {required && <span className="text-[#F97316]">*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ prefix, suffix, className = "", ...rest }) => (
  <div className={`flex items-center border-2 border-slate-200 rounded-lg bg-white overflow-hidden focus-within:border-[#1D4ED8] transition-colors ${className}`}>
    {prefix && <span className="px-3 py-2.5 bg-slate-50 border-r-2 border-slate-200 text-slate-500 text-sm font-semibold shrink-0">{prefix}</span>}
    <input className="flex-1 px-3 py-2.5 text-sm text-[#1E293B] placeholder-slate-400 outline-none bg-transparent font-['Barlow',sans-serif]" {...rest} />
    {suffix && <span className="px-3 py-2.5 bg-slate-50 border-l-2 border-slate-200 text-slate-500 text-xs font-semibold shrink-0">{suffix}</span>}
  </div>
);

const Select = ({ children, ...rest }) => (
  <select {...rest} className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#1E293B] outline-none bg-white focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]">
    {children}
  </select>
);

const CATEGORIES = [
  "Hand Tools", "Power Tools", "Fasteners & Hardware", "Pipes & Fittings",
  "Electrical", "Paints & Coatings", "Safety Equipment", "Building Materials",
  "Adhesives & Sealants", "Measuring & Marking", "Furniture", "Stationery", "Other",
];

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [assignSupplierId, setAssignSupplierId] = useState("");
  const [assignOther, setAssignOther] = useState(false);
  const [assignOtherName, setAssignOtherName] = useState("");

  useEffect(() => {
    axios.get(`http://localhost:5000/api/products/${id}`).then((res) => {
      const p = res.data;
      setForm({
        name: p.name || "", category: p.category || "", company: p.brand || "", origin: p.origin || "",
        unit: p.unit || "pcs", unitValue: p.unitValue ?? "", description: p.description || "",
        quality: p.quality || "", material: p.material || "",
        buyingPrice: p.buyingPrice ?? "", holcellMargin: p.holcellMargin ?? 3, retailMargin: p.retailMargin ?? 5,
        reorderLevel: p.reorderLevel ?? 0, location: p.location || "", status: p.status || "active",
        isCustom: p.isCustom,
      });
      setExistingImages(p.images || []);
      setLoading(false);
    }).catch(() => { setToast({ type: "error", msg: "Failed to load product." }); setLoading(false); });

    axios.get("http://localhost:5000/api/suppliers?limit=200")
      .then((res) => setSuppliers(res.data.suppliers || []))
      .catch(() => setSuppliers([]));
  }, [id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - existingImages.length - images.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages((prev) => [...prev, { url: ev.target.result, file }]);
      reader.readAsDataURL(file);
    });
  };
  const removeNewImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));
  const removeExistingImage = (i) => setExistingImages((prev) => prev.filter((_, idx) => idx !== i));

  const buying = parseFloat(form?.buyingPrice) || 0;
  const holcell = buying + buying * (parseFloat(form?.holcellMargin) / 100 || 0);
  const retail = buying + buying * (parseFloat(form?.retailMargin) / 100 || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.company || !form.buyingPrice) {
      setToast({ type: "error", msg: "Please fill all required fields." });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    if (form.isCustom && !assignSupplierId && !(assignOther && assignOtherName.trim())) {
      setToast({ type: "error", msg: "Assign a real supplier before converting this to a regular product." });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setSaving(true);
    try {
      let uploadedUrls = [];
      if (images.length > 0) {
        uploadedUrls = await Promise.all(
          images.map(async (img) => {
            const formData = new FormData();
            formData.append("image", img.file);
            const res = await axios.post(
              "https://api.imgbb.com/1/upload?key=9bb7645922ca992881ce70f0bac1f069",
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            return res.data.data.display_url;
          })
        );
      }

      const payload = {
        name: form.name,
        category: form.category,
        brand: form.company,
        origin: form.origin,
        unit: form.unit,
        unitValue: form.unitValue !== "" ? parseFloat(form.unitValue) : null,
        description: form.description,
        quality: form.quality,
        material: form.material,
        buyingPrice: parseFloat(form.buyingPrice),
        holcellPrice: holcell,
        retailPrice: retail,
        holcellMargin: parseFloat(form.holcellMargin),
        retailMargin: parseFloat(form.retailMargin),
        reorderLevel: parseInt(form.reorderLevel) || 0,
        location: form.location,
        status: form.status,
        images: [...existingImages, ...uploadedUrls],
      };

      if (form.isCustom) {
        payload.isCustom = false;
        payload.supplierAssignment = assignOther
          ? { supplierName: assignOtherName.trim() }
          : { supplierId: assignSupplierId };
      }

      await axios.put(`http://localhost:5000/api/products/${id}`, payload);
      setToast({ type: "success", msg: "Product updated successfully!" });
      setTimeout(() => navigate(`/products/${id}`), 1200);
    } catch (error) {
      setToast({ type: "error", msg: error.response?.data?.message || "Failed to update product." });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-[#1D4ED8]">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading product…</span>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet" />

      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border-2 text-sm font-semibold font-['Barlow',sans-serif] ${
          toast.type === "success" ? "bg-green-50 border-green-400 text-green-700" : "bg-red-50 border-red-400 text-red-700"
        }`}>
          {toast.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-['Barlow',sans-serif] p-20 mx-auto">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-colors">
              <FiArrowLeft size={16} />
            </button>
            <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center shrink-0">
              <FiPackage size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-2xl uppercase tracking-wide leading-tight">
                Edit Product
              </h1>
              <p className="text-slate-400 text-xs font-medium">Khulna Hardware Mart · Inventory Management</p>
            </div>
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-[#F97316] bg-[#F97316] text-white text-sm font-bold hover:bg-[#EA6C0A] hover:border-[#EA6C0A] transition-colors disabled:opacity-60">
            {saving ? "Saving..." : <><FiSave size={15} /> Save Changes</>}
          </button>
        </div>

        {form.isCustom && (
          <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3">
            <FiRefreshCw size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">This is a Custom Product</p>
              <p className="text-xs text-amber-700 mt-0.5">
                It was created directly from an invoice. Fill in the details below and assign a real supplier to convert it into a regular catalog product.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 flex flex-col gap-5">

            <Section icon={<FiTag />} title="Basic Information" accent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Product Name" required>
                    <Input value={form.name} onChange={set("name")} placeholder="e.g. Heavy Duty Hammer 16oz" />
                  </Field>
                </div>
                <Field label="Category" required>
                  <Select value={form.category} onChange={set("category")}>
                    <option value="">— Select Category —</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label="Brand / Company" required>
                  <Input value={form.company} onChange={set("company")} placeholder="e.g. Stanley, Bosch, BSRM" />
                </Field>
                <Field label="Country of Origin">
                  <Input value={form.origin} onChange={set("origin")} placeholder="e.g. Bangladesh, China" />
                </Field>
                <Field label="Quality">
                  <Input value={form.quality} onChange={set("quality")} placeholder="e.g. Premium, Standard" />
                </Field>
                <Field label="Material">
                  <Input value={form.material} onChange={set("material")} placeholder="e.g. Steel, Wood" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Short Description">
                    <textarea rows={3} value={form.description} onChange={set("description")}
                      placeholder="Brief product description…"
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#1E293B] placeholder-slate-400 outline-none resize-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]" />
                  </Field>
                </div>
              </div>
            </Section>

            <Section icon={<FiDollarSign />} title="Pricing">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Buying Price (৳)" required>
                  <Input type="number" min="0" step="0.01" value={form.buyingPrice} onChange={set("buyingPrice")} prefix="৳" />
                </Field>
                <Field label="Holcell Margin (%)">
                  <Input type="number" min="0" step="0.1" value={form.holcellMargin} onChange={set("holcellMargin")} suffix="%" />
                </Field>
                <Field label="Retail Margin (%)">
                  <Input type="number" min="0" step="0.1" value={form.retailMargin} onChange={set("retailMargin")} suffix="%" />
                </Field>
              </div>
              <div className="flex gap-3 mt-3 text-xs font-semibold text-slate-500">
                <span>Holcell: <span className="text-[#1D4ED8]">৳{holcell.toFixed(2)}</span></span>
                <span>Retail: <span className="text-[#F97316]">৳{retail.toFixed(2)}</span></span>
              </div>
            </Section>

            <Section icon={<FiArchive />} title="Stock & Inventory">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Unit of Measure">
                  <Select value={form.unit} onChange={set("unit")}>
                    {["pcs", "kg", "g", "m", "ft", "L", "bag", "roll", "box", "set", "pair"].map((u) => <option key={u} value={u}>{u}</option>)}
                  </Select>
                </Field>
                <Field label="Quantity per Unit">
                  <Input type="number" min="0" step="0.01" value={form.unitValue} onChange={set("unitValue")} suffix={form.unit} />
                </Field>
                <Field label="Reorder Level">
                  <Input type="number" min="0" value={form.reorderLevel} onChange={set("reorderLevel")} suffix={form.unit} />
                </Field>
                <Field label="Storage Location">
                  <Input value={form.location} onChange={set("location")} placeholder="e.g. Rack B-3" />
                </Field>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                * Current stock is managed via Restock / Sales and isn't edited here.
              </p>
            </Section>

            {form.isCustom && (
              <Section icon={<FiTruck />} title="Assign Real Supplier" accent>
                <p className="text-xs text-slate-400 mb-3">
                  This product's stock is currently marked "N/A (Custom Product)". Assign a real supplier to convert it into a regular product.
                </p>
                <Select
                  value={assignOther ? "__other__" : assignSupplierId}
                  onChange={(e) => {
                    if (e.target.value === "__other__") { setAssignOther(true); setAssignSupplierId(""); }
                    else { setAssignOther(false); setAssignSupplierId(e.target.value); }
                  }}
                >
                  <option value="">— Select Supplier —</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.companyName}</option>)}
                  <option value="__other__">Others (add new)</option>
                </Select>
                {assignOther && (
                  <div className="mt-3">
                    <Input value={assignOtherName} onChange={(e) => setAssignOtherName(e.target.value)} placeholder="New supplier name" />
                  </div>
                )}
              </Section>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <Section icon={<FiInfo />} title="Status">
              <div className="flex flex-col gap-3">
                {["active", "inactive", "discontinued"].map((s) => (
                  <label key={s} className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${form.status === s ? "border-[#1D4ED8] bg-[#EFF6FF]" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <input type="radio" name="status" value={s} checked={form.status === s} onChange={set("status")} className="accent-[#1D4ED8]" />
                    <span className="text-sm font-semibold text-[#1E293B] capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </Section>

            <Section icon={<FiImage />} title="Product Images">
              <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#F97316] hover:bg-[#FFF7ED] transition-colors">
                <FiUpload size={24} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Click to upload images</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
              </div>
              {(existingImages.length > 0 || images.length > 0) && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {existingImages.map((img, i) => (
                    <div key={"e" + i} className="relative rounded-lg border-2 border-slate-200 overflow-hidden aspect-square bg-slate-50">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600">
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                  {images.map((img, i) => (
                    <div key={"n" + i} className="relative rounded-lg border-2 border-slate-200 overflow-hidden aspect-square bg-slate-50">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600">
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </form>
    </>
  );
};

export default EditProduct;