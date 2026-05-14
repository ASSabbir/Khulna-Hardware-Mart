import React, { useState, useRef } from "react";
import axios from "axios";
import {
  FiPackage, FiTag, FiLayers, FiDollarSign,
  FiArchive, FiImage, FiAlertTriangle, FiCheckCircle,
  FiHash, FiTruck, FiInfo, FiX, FiUpload, FiSave,
} from "react-icons/fi";

/* ─── Section wrapper ────────────────────────────────────────────── */
const Section = ({ icon, title, accent = false, children }) => (
  <div className={`bg-white rounded-xl border-2 ${accent ? "border-[#F97316]" : "border-slate-200"} overflow-hidden`}>
    <div className={`flex items-center gap-3 px-5 py-3 border-b-2 ${accent ? "border-[#F97316] bg-[#FFF7ED]" : "border-slate-100 bg-slate-50"}`}>
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? "bg-[#F97316]" : "bg-[#1E3A8A]"}`}>
        {React.cloneElement(icon, { size: 14, className: "text-white" })}
      </span>
      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-sm uppercase tracking-widest">
        {title}
      </h2>
    </div>
    <div className="px-5 py-5">{children}</div>
  </div>
);

/* ─── Field wrapper ──────────────────────────────────────────────── */
const Field = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-1">
      {label}
      {required && <span className="text-[#F97316]">*</span>}
      {hint && (
        <span title={hint} className="text-slate-400 cursor-help">
          <FiInfo size={11} />
        </span>
      )}
    </label>
    {children}
  </div>
);

/* ─── Input ──────────────────────────────────────────────────────── */
const Input = ({ type = "text", placeholder, value, onChange, prefix, suffix, ...rest }) => (
  <div className="flex items-center border-2 border-slate-200 rounded-lg bg-white overflow-hidden focus-within:border-[#1D4ED8] transition-colors duration-150">
    {prefix && (
      <span className="px-3 py-2.5 bg-slate-50 border-r-2 border-slate-200 text-slate-500 text-sm font-semibold flex-shrink-0">
        {prefix}
      </span>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="flex-1 px-3 py-2.5 text-sm text-[#1E293B] placeholder-slate-400 outline-none bg-transparent font-['Barlow',sans-serif]"
      {...rest}
    />
    {suffix && (
      <span className="px-3 py-2.5 bg-slate-50 border-l-2 border-slate-200 text-slate-500 text-xs font-semibold flex-shrink-0">
        {suffix}
      </span>
    )}
  </div>
);

/* ─── Select ─────────────────────────────────────────────────────── */
const Select = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#1E293B] outline-none bg-white focus:border-[#1D4ED8] transition-colors duration-150 font-['Barlow',sans-serif]"
  >
    {children}
  </select>
);

/* ─── Price display pill ─────────────────────────────────────────── */
const PricePill = ({ label, value, color }) => (
  <div className={`flex-1 rounded-lg border-2 ${color} px-4 py-3 text-center min-w-[110px]`}>
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">{label}</p>
    <p className="text-base font-bold tabular-nums font-['Barlow_Condensed',sans-serif]">
      ৳ {isNaN(value) || value === "" ? "0.00" : Number(value).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
    </p>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   AddProduct
══════════════════════════════════════════════════════════════════ */
const AddProduct = () => {
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "", sku: "", category: "", company: "", origin: "",
    unit: "pcs", description: "",
    buyingPrice: "", holcellMargin: "3", retailMargin: "5",
    quantity: "", reorderLevel: "", location: "",
    status: "active",
  });

  const [images, setImages]   = useState([]);
  const [toast, setToast]     = useState(null); // { type, msg }

  const [loading, setLoading] = useState(false);

  /* derived prices */
  const buying  = parseFloat(form.buyingPrice) || 0;
  const holcell = buying + buying * (parseFloat(form.holcellMargin) / 100 || 0);
  const retail  = buying + buying * (parseFloat(form.retailMargin)  / 100 || 0);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  /* image upload */
  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - images.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setImages((prev) => [...prev, { url: ev.target.result, name: file.name }].slice(0, 4));
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.company || !form.buyingPrice || !form.quantity) {
      setToast({ type: "error", msg: "Please fill all required fields." });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category,
        brand: form.company,
        origin: form.origin,
        unit: form.unit,
        description: form.description,
        buyingPrice: parseFloat(form.buyingPrice),
        holcellPrice: holcell,
        retailPrice: retail,
        holcellMargin: parseFloat(form.holcellMargin),
        retailMargin: parseFloat(form.retailMargin),
        stock: parseInt(form.quantity),
        reorderLevel: form.reorderLevel ? parseInt(form.reorderLevel) : 0,
        location: form.location,
        status: form.status,
        images: images.map((img) => img.url),
      };

      await axios.post("https://khulna-hardware-mart.vercel.app/api/products", payload);
      setToast({ type: "success", msg: "Product saved successfully!" });
      handleReset();
    } catch (error) {
      setToast({ type: "error", msg: error.response?.data?.message || "Failed to save product." });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleReset = () => {
    setForm({
      name: "", sku: "", category: "", company: "", origin: "",
      unit: "pcs", description: "",
      buyingPrice: "", holcellMargin: "3", retailMargin: "5",
      quantity: "", reorderLevel: "", location: "",
      status: "active",
    });
    setImages([]);
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border-2 shadow-none text-sm font-semibold font-['Barlow',sans-serif] ${
          toast.type === "success"
            ? "bg-green-50 border-green-400 text-green-700"
            : "bg-red-50 border-red-400 text-red-700"
        }`}>
          {toast.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-['Barlow',sans-serif] max-w-5xl">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center flex-shrink-0">
              <FiPackage size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-2xl uppercase tracking-wide leading-tight">
                Add New Product
              </h1>
              <p className="text-slate-400 text-xs font-medium">
                Khulna Hardware Mart · Inventory Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-600 text-sm font-semibold bg-white hover:border-slate-400 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-[#F97316] bg-[#F97316] text-white text-sm font-bold hover:bg-[#EA6C0A] hover:border-[#EA6C0A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : <><FiSave size={15} /> Save Product</>}
            </button>
          </div>
        </div>

        {/* ── GRID: Left col (2/3) + Right col (1/3) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ═══ LEFT COLUMN ═══ */}
          <div className="xl:col-span-2 flex flex-col gap-5">

            {/* 1 · Basic Info */}
            <Section icon={<FiTag />} title="Basic Information" accent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Product Name" required>
                    <Input placeholder="e.g. Heavy Duty Hammer 16oz" value={form.name} onChange={set("name")} />
                  </Field>
                </div>
                <Field label="SKU / Item Code" hint="Stock Keeping Unit — leave blank to auto-generate">
                  <Input placeholder="e.g. STN-HAM-016" value={form.sku} onChange={set("sku")} prefix="#" />
                </Field>
                <Field label="Category" required>
                  <Select value={form.category} onChange={set("category")}>
                    <option value="">— Select Category —</option>
                    <option>Hand Tools</option>
                    <option>Power Tools</option>
                    <option>Fasteners & Hardware</option>
                    <option>Pipes & Fittings</option>
                    <option>Electrical</option>
                    <option>Paints & Coatings</option>
                    <option>Safety Equipment</option>
                    <option>Building Materials</option>
                    <option>Adhesives & Sealants</option>
                    <option>Measuring & Marking</option>
                    <option>Other</option>
                  </Select>
                </Field>
                <Field label="Brand / Company" required>
                  <Input placeholder="e.g. Stanley, Bosch, BSRM" value={form.company} onChange={set("company")} />
                </Field>
                <Field label="Country of Origin">
                  <Input placeholder="e.g. Bangladesh, China, Germany" value={form.origin} onChange={set("origin")} />
                </Field>
                <Field label="Unit of Measure" required>
                  <Select value={form.unit} onChange={set("unit")}>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="m">Meter (m)</option>
                    <option value="ft">Feet (ft)</option>
                    <option value="L">Litre (L)</option>
                    <option value="bag">Bag</option>
                    <option value="roll">Roll</option>
                    <option value="box">Box</option>
                    <option value="set">Set</option>
                    <option value="pair">Pair</option>
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Short Description">
                    <textarea
                      rows={3}
                      placeholder="Brief product description, specifications, or notes…"
                      value={form.description}
                      onChange={set("description")}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#1E293B] placeholder-slate-400 outline-none resize-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]"
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 2 · Pricing */}
            <Section icon={<FiDollarSign />} title="Pricing">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Buying Price (৳)" required>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.buyingPrice}
                      onChange={set("buyingPrice")}
                      prefix="৳"
                      min="0"
                      step="0.01"
                    />
                  </Field>
                  <Field label="Holcell Margin (%)" hint="Percentage added over buying price for wholesale">
                    <Input
                      type="number"
                      placeholder="3"
                      value={form.holcellMargin}
                      onChange={set("holcellMargin")}
                      suffix="%"
                      min="0"
                      step="0.1"
                    />
                  </Field>
                  <Field label="Retail Margin (%)" hint="Percentage added over buying price for retail">
                    <Input
                      type="number"
                      placeholder="5"
                      value={form.retailMargin}
                      onChange={set("retailMargin")}
                      suffix="%"
                      min="0"
                      step="0.1"
                    />
                  </Field>
                </div>

                {/* Computed prices */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <PricePill
                    label="Buying Price"
                    value={buying}
                    color="border-slate-300 text-slate-700"
                  />
                  <PricePill
                    label={`Holcell (+${form.holcellMargin || 0}%)`}
                    value={holcell}
                    color="border-[#1D4ED8] text-[#1D4ED8]"
                  />
                  <PricePill
                    label={`Retail (+${form.retailMargin || 0}%)`}
                    value={retail}
                    color="border-[#F97316] text-[#F97316]"
                  />
                </div>

                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  * Holcell and Retail prices are auto-calculated. You can adjust margins above.
                </p>
              </div>
            </Section>

            {/* 3 · Stock */}
            <Section icon={<FiArchive />} title="Stock & Inventory">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Opening Stock (Qty)" required>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.quantity}
                    onChange={set("quantity")}
                    suffix={form.unit}
                    min="0"
                  />
                </Field>
                <Field label="Reorder Level" hint="Alert when stock falls below this number">
                  <Input
                    type="number"
                    placeholder="10"
                    value={form.reorderLevel}
                    onChange={set("reorderLevel")}
                    suffix={form.unit}
                    min="0"
                  />
                </Field>
                <Field label="Storage Location">
                  <Input placeholder="e.g. Rack B-3, Shelf 2" value={form.location} onChange={set("location")} />
                </Field>
              </div>

              {/* Stock status indicator */}
              {form.quantity !== "" && (
                <div className="mt-4">
                  {parseInt(form.quantity) === 0 ? (
                    <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-lg px-4 py-2.5">
                      <FiAlertTriangle size={14} className="text-red-500" />
                      <span className="text-xs font-semibold text-red-600">Product will be added as Out of Stock</span>
                    </div>
                  ) : parseInt(form.quantity) <= 10 ? (
                    <div className="flex items-center gap-2 bg-yellow-50 border-2 border-yellow-200 rounded-lg px-4 py-2.5">
                      <FiAlertTriangle size={14} className="text-yellow-600" />
                      <span className="text-xs font-semibold text-yellow-700">Low opening stock — consider reordering soon</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-lg px-4 py-2.5">
                      <FiCheckCircle size={14} className="text-green-600" />
                      <span className="text-xs font-semibold text-green-700">Stock level looks good</span>
                    </div>
                  )}
                </div>
              )}
            </Section>

          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className="flex flex-col gap-5">

            {/* 4 · Product Status */}
            <Section icon={<FiInfo />} title="Status">
              <div className="flex flex-col gap-3">
                {["active", "inactive", "discontinued"].map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      form.status === s
                        ? "border-[#1D4ED8] bg-[#EFF6FF]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={set("status")}
                      className="accent-[#1D4ED8]"
                    />
                    <div>
                      <span className="text-sm font-semibold text-[#1E293B] capitalize">{s}</span>
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

            {/* 5 · Product Images */}
            <Section icon={<FiImage />} title="Product Images">
              {/* Upload zone */}
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#F97316] hover:bg-[#FFF7ED] transition-colors duration-150"
              >
                <FiUpload size={24} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Click to upload images</p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB · Max 4 images</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImages}
                />
              </div>

              {/* Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative rounded-lg border-2 border-slate-200 overflow-hidden aspect-square bg-slate-50">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <FiX size={12} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-[#F97316] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* 6 · Supplier (stub for future) */}
            <Section icon={<FiTruck />} title="Supplier Info">
              <div className="flex flex-col gap-3">
                <Field label="Supplier Name">
                  <Input placeholder="e.g. Dhaka Hardware Supplier" />
                </Field>
                <Field label="Supplier Contact">
                  <Input placeholder="+880 1X00-000000" />
                </Field>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-3 tracking-wide">
                * Full supplier management will be available after database integration.
              </p>
            </Section>

          </div>
        </div>

        {/* ── Bottom save bar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-[#1E3A8A] rounded-xl px-6 py-4 border-l-4 border-[#F97316]">
          <div>
            <p className="text-white text-sm font-bold">Ready to save?</p>
            <p className="text-[#93C5FD] text-xs font-medium">
              Database connection will be set up in the next update.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-lg border-2 border-[#3B5EA6] text-[#CBD5E1] text-sm font-semibold bg-transparent hover:border-white hover:text-white transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#F97316] border-2 border-[#F97316] text-white text-sm font-bold hover:bg-[#EA6C0A] hover:border-[#EA6C0A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : <><FiSave size={15} /> Save Product</>}
            </button>
          </div>
        </div>

      </form>
    </>
  );
};

export default AddProduct;