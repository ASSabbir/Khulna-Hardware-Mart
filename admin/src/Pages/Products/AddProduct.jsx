// FILE: src/Pages/Products/AddProduct.jsx (FULL REPLACEMENT — DESIGN ONLY, LOGIC UNCHANGED)
import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiPackage,
  FiTag,
  FiDollarSign,
  FiArchive,
  FiImage,
  FiAlertTriangle,
  FiCheckCircle,
  FiTruck,
  FiInfo,
  FiX,
  FiUpload,
  FiSave,
  FiPlus,
  FiTrash2,
  FiHash,
  FiGrid,
  FiHome,
  FiGlobe,
  FiAward,
  FiLayers,
  FiEdit3,
  FiPercent,
  FiBox,
  FiMapPin,
  FiChevronRight,
  FiBold,
  FiItalic,
  FiUnderline,
  FiCode,
  FiList,
  FiLink,
} from "react-icons/fi";
import PaymentSplitEditor from "../../Components/PaymentSplitEditor";

const NAVY = "#1E3A8A";
const ORANGE = "#F97316";

const Card = ({ title, icon, children, right }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.08)] overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#EFF3FF" }}
          >
            {React.cloneElement(icon, { size: 15, color: NAVY })}
          </span>
        )}
        <h2 className="font-bold text-[15px] text-slate-800">{title}</h2>
      </div>
      {right}
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const Field = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[13px] font-semibold text-slate-600 flex items-center gap-1">
      {label}
      {required && <span style={{ color: ORANGE }}>*</span>}
      {hint && (
        <span title={hint} className="text-slate-300 cursor-help">
          <FiInfo size={11} />
        </span>
      )}
    </label>
    {children}
  </div>
);

const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  prefix,
  suffix,
  disabled,
  className = "",
  ...rest
}) => (
  <div
    className={`flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden focus-within:border-[#1E3A8A] focus-within:ring-2 focus-within:ring-[#1E3A8A]/10 transition-all ${disabled ? "bg-slate-50" : ""} ${className}`}
  >
    {icon && (
      <span className="pl-3 text-slate-400 flex-shrink-0">
        {React.cloneElement(icon, { size: 14 })}
      </span>
    )}
    {prefix && (
      <span className="px-3 py-2.5 text-slate-400 text-sm font-medium flex-shrink-0">
        {prefix}
      </span>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`flex-1 min-w-0 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent ${disabled ? "cursor-not-allowed text-slate-400" : ""}`}
      {...rest}
    />
    {suffix && (
      <span className="px-3 py-2.5 text-slate-400 text-xs font-semibold flex-shrink-0 border-l border-slate-100 bg-slate-50">
        {suffix}
      </span>
    )}
  </div>
);

const Select = ({ value, onChange, icon, children }) => (
  <div className="flex items-center border border-slate-200 rounded-lg bg-white focus-within:border-[#1E3A8A] focus-within:ring-2 focus-within:ring-[#1E3A8A]/10 transition-all">
    {icon && (
      <span className="pl-3 text-slate-400 flex-shrink-0">
        {React.cloneElement(icon, { size: 14 })}
      </span>
    )}
    <select
      value={value}
      onChange={onChange}
      className="w-full min-w-0 px-3 py-2.5 text-sm text-slate-800 outline-none bg-transparent appearance-none"
    >
      {children}
    </select>
  </div>
);

const StatPill = ({ label, value, tone }) => {
  const tones = {
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    navy: "bg-[#EFF3FF] border-[#DCE5FB] text-[#1E3A8A]",
    orange: "bg-[#FFF3E8] border-[#FBDCC0] text-[#F97316]",
  };
  return (
    <div
      className={`flex-1 min-w-[110px] rounded-xl border px-4 py-3.5 ${tones[tone]}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-1">
        {label}
      </p>
      <p className="text-xl font-extrabold tabular-nums">
        ৳
        {isNaN(value) || value === ""
          ? "0.00"
          : Number(value).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const DEFAULT_CATEGORIES = [
  "Hand Tools",
  "Power Tools",
  "Fasteners & Hardware",
  "Pipes & Fittings",
  "Electrical",
  "Paints & Coatings",
  "Safety Equipment",
  "Building Materials",
  "Adhesives & Sealants",
  "Measuring & Marking",
  "Furniture",
  "Stationery",
];
const DEFAULT_UNITS = [
  ["pcs", "Pieces (pcs)"],
  ["kg", "Kilogram (kg)"],
  ["g", "Gram (g)"],
  ["m", "Meter (m)"],
  ["ft", "Feet (ft)"],
  ["L", "Litre (L)"],
  ["bag", "Bag"],
  ["roll", "Roll"],
  ["box", "Box"],
  ["set", "Set"],
  ["pair", "Pair"],
];

const emptyPayment = () => ({ id: Date.now() + Math.random(), method: "cash", amount: "", provider: "bKash", bankName: "Dutch-Bangla Bank", accountNumber: "", mobileNumber: "" });
const emptySupplierRow = (buyingPrice = "") => ({
  id: Date.now() + Math.random(),
  supplierId: "",
  isOther: false,
  otherName: "",
  buyingPrice,
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchaseQuantity: "",
  payments: [emptyPayment()],
  balance: null,
  applyCredit: false,
  creditAmount: "",
});

const AddProduct = () => {
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    company: "",
    origin: "",
    unit: "pcs",
    unitValue: "",
    description: "",
    quality: "",
    material: "",
    buyingPrice: "",
    holcellMargin: "3",
    retailMargin: "5",
    location: "",
    status: "active",
  });

  const [images, setImages] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierRows, setSupplierRows] = useState([emptySupplierRow()]);

  const fetchSupplierOptions = () => {
    axios
      .get("http://localhost:5000/api/suppliers?limit=200")
      .then((res) => setSupplierOptions(res.data.suppliers || []))
      .catch(() => setSupplierOptions([]));
  };
  useEffect(() => {
    fetchSupplierOptions();
  }, []);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCategoryOther, setIsCategoryOther] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [unitOptions, setUnitOptions] = useState([]);
  const [isUnitOther, setIsUnitOther] = useState(false);
  const [customUnit, setCustomUnit] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/options/productCategory")
      .then((res) => setCategoryOptions(res.data.options || []))
      .catch(() => setCategoryOptions([]));
    axios
      .get("http://localhost:5000/api/options/unit")
      .then((res) => setUnitOptions(res.data.options || []))
      .catch(() => setUnitOptions([]));
  }, []);

  const allCategories = [
    ...new Set([...DEFAULT_CATEGORIES, ...categoryOptions]),
  ];
  const allUnits = [
    ...DEFAULT_UNITS,
    ...unitOptions
      .filter((u) => !DEFAULT_UNITS.some(([v]) => v === u))
      .map((u) => [u, u]),
  ];

  const handleCategorySelect = (e) => {
    const val = e.target.value;
    if (val === "__others__") {
      setIsCategoryOther(true);
      setForm((f) => ({ ...f, category: "" }));
    } else {
      setIsCategoryOther(false);
      setForm((f) => ({ ...f, category: val }));
    }
  };
  const saveCustomCategory = async () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    try {
      const res = await axios.post(
        "http://localhost:5000/api/options/productCategory",
        { value: trimmed },
      );
      setForm((f) => ({ ...f, category: res.data.value }));
      if (res.data.created)
        setCategoryOptions((prev) => [...prev, res.data.value]);
    } catch {
      setForm((f) => ({ ...f, category: trimmed }));
    }
  };
  const handleUnitSelect = (e) => {
    const val = e.target.value;
    if (val === "__others__") {
      setIsUnitOther(true);
      setForm((f) => ({ ...f, unit: "" }));
    } else {
      setIsUnitOther(false);
      setForm((f) => ({ ...f, unit: val }));
    }
  };
  const saveCustomUnit = async () => {
    const trimmed = customUnit.trim();
    if (!trimmed) return;
    try {
      const res = await axios.post("http://localhost:5000/api/options/unit", {
        value: trimmed,
      });
      setForm((f) => ({ ...f, unit: res.data.value }));
      if (res.data.created) setUnitOptions((prev) => [...prev, res.data.value]);
    } catch {
      setForm((f) => ({ ...f, unit: trimmed }));
    }
  };

  const buying = parseFloat(form.buyingPrice) || 0;
  const holcell = buying + buying * (parseFloat(form.holcellMargin) / 100 || 0);
  const retail = buying + buying * (parseFloat(form.retailMargin) / 100 || 0);

  const totalOpeningStock = useMemo(
    () =>
      supplierRows.reduce(
        (sum, r) => sum + (parseInt(r.purchaseQuantity) || 0),
        0,
      ),
    [supplierRows],
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - images.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setImages((prev) =>
          [...prev, { url: ev.target.result, name: file.name, file }].slice(
            0,
            4,
          ),
        );
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (i) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  const addSupplierRow = () =>
    setSupplierRows((prev) => [...prev, emptySupplierRow()]);
  const removeSupplierRow = (id) =>
    setSupplierRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );

  const updateSupplierRow = (id, field, value) => {
    const isFirstRow = supplierRows[0]?.id === id;
    if (field === "buyingPrice" && isFirstRow) {
      setForm((f) => ({ ...f, buyingPrice: value }));
      return;
    }
    setSupplierRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };
  const setSupplierSelect = (id, value) => {
    const supplierId = value === "__other__" ? "" : value;
    const isOther = value === "__other__";
    setSupplierRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              supplierId,
              isOther,
              balance: null,
              applyCredit: false,
              creditAmount: "",
            }
          : r,
      ),
    );
    if (!isOther && supplierId) {
      axios
        .get(`http://localhost:5000/api/supplier-payments/${supplierId}`)
        .then((res) => {
          setSupplierRows((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    balance: res.data.balance,
                    creditAmount:
                      res.data.balance?.receivableAmount > 0
                        ? String(res.data.balance.receivableAmount)
                        : "",
                  }
                : r,
            ),
          );
        })
        .catch(() => {});
    }
  };
  const setRowApplyCredit = (id, checked) =>
    setSupplierRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, applyCredit: checked } : r)),
    );

  const setRowPayments = (rowId, newPayments) => setSupplierRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, payments: newPayments } : r)));

  const rowTotalCost = (row, idx) => {
    const price = idx === 0 ? buying : parseFloat(row.buyingPrice) || 0;
    return price * (parseFloat(row.purchaseQuantity) || 0);
  };
  const rowAppliedCredit = (row, idx) => {
    if (!row.applyCredit || !row.balance || row.balance.receivableAmount <= 0)
      return 0;
    return Math.min(row.balance.receivableAmount, rowTotalCost(row, idx));
  };
  const rowPaidSum = (row) =>
    row.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const grandTotalCost = useMemo(
    () => supplierRows.reduce((sum, r, idx) => sum + rowTotalCost(r, idx), 0),
    [supplierRows, buying],
  );

  const validateSupplierRows = () => {
    if (supplierRows.length === 0)
      return "Add at least one supplier with a purchase quantity to set opening stock.";
    let anyValid = false;
    for (const r of supplierRows) {
      const name = r.isOther ? r.otherName.trim() : "";
      if (!r.supplierId && !name)
        return "Select a supplier or enter a name for each supplier row.";
      const qty = Number(r.purchaseQuantity);
      if (!Number.isFinite(qty) || qty <= 0)
        return "Each supplier row needs a valid purchase quantity.";
      anyValid = true;
    }
    if (!buying || buying < 0) return "Enter a valid Buying Price.";
    if (!anyValid)
      return "Add at least one supplier with a purchase quantity to set opening stock.";
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
          const res = await axios.post(
            "https://api.imgbb.com/1/upload?key=9bb7645922ca992881ce70f0bac1f069",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
          return res.data.data.display_url;
        }),
      );

      const suppliersPayload = supplierRows.map((r, idx) => ({
        supplierId: r.isOther ? undefined : r.supplierId || undefined,
        supplierName: r.isOther ? r.otherName.trim() : undefined,
        buyingPrice: idx === 0 ? buying : parseFloat(r.buyingPrice),
        purchaseDate: r.purchaseDate,
        purchaseQuantity: parseInt(r.purchaseQuantity),
        payments: r.payments
          .filter((p) => (Number(p.amount) || 0) > 0)
          .map((p) => ({
            method: p.method,
            amount: Number(p.amount),
            provider: p.method === "mobile" ? p.provider : undefined,
          })),
        creditApplied:
          rowAppliedCredit(r, idx) > 0 ? rowAppliedCredit(r, idx) : undefined,
      }));

      const payload = {
        name: form.name,
        category: form.category,
        brand: form.company,
        origin: form.origin,
        unit: form.unit,
        unitValue: form.unitValue ? parseFloat(form.unitValue) : null,
        description: form.description,
        quality: form.quality,
        material: form.material,
        buyingPrice: parseFloat(form.buyingPrice),
        holcellPrice: holcell,
        retailPrice: retail,
        holcellMargin: parseFloat(form.holcellMargin),
        retailMargin: parseFloat(form.retailMargin),
        location: form.location,
        status: form.status,
        images: uploadedUrls,
        suppliers: suppliersPayload,
      };

      await axios.post("http://localhost:5000/api/products", payload);
      setToast({ type: "success", msg: "Product saved successfully!" });
      handleReset();
      fetchSupplierOptions();
    } catch (error) {
      setToast({
        type: "error",
        msg:
          error.response?.data?.message ||
          "Failed to save product. Check console for details.",
      });
      console.error(
        "Product save error:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleReset = () => {
    setForm({
      name: "",
      category: "",
      company: "",
      origin: "",
      unit: "pcs",
      unitValue: "",
      description: "",
      quality: "",
      material: "",
      buyingPrice: "",
      holcellMargin: "3",
      retailMargin: "5",
      location: "",
      status: "active",
    });
    setImages([]);
    setSupplierRows([emptySupplierRow()]);
    setIsCategoryOther(false);
    setCustomCategory("");
    setIsUnitOther(false);
    setCustomUnit("");
  };

  const stockThreshold = 10;
  const stockPct = Math.min(
    100,
    Math.round((totalOpeningStock / stockThreshold) * 100),
  );

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-semibold shadow-lg ${toast.type === "success" ? "bg-green-50 border-green-300 text-green-700" : "bg-red-50 border-red-300 text-red-700"}`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {toast.type === "success" ? (
            <FiCheckCircle size={16} />
          ) : (
            <FiAlertTriangle size={16} />
          )}
          {toast.msg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 mx-auto p-4 sm:p-6 lg:p-10 bg-white min-h-screen"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#EFF3FF" }}
            >
              <FiPackage size={22} color={NAVY} />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-2xl sm:text-[28px] leading-tight">
                Add New Product
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1 flex-wrap">
                <span>Dashboard</span>
                <FiChevronRight size={10} />
                <span>Inventory</span>
                <FiChevronRight size={10} />
                <span>Products</span>
                <FiChevronRight size={10} />
                <span className="text-slate-600 font-semibold">
                  Add Product
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: ORANGE }}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <FiSave size={15} /> Save Product
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-lg border-2 border-slate-200 text-slate-600 text-sm font-bold bg-white hover:border-slate-300 transition-colors"
            >
              Reset
            </button>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border-2 border-slate-200 bg-white">
              <span className="text-xs font-bold text-slate-600">
                Product Status
              </span>
              <span
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${form.status === "active" ? "bg-green-500 justify-end" : "bg-slate-300 justify-start"}`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow" />
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT ~70% */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            <Card icon={<FiTag />} title="Product Information Card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Product Name" required>
                  <Input
                    icon={<FiTag />}
                    placeholder="e.g. Heavy Duty Hammer 16oz"
                    value={form.name}
                    onChange={set("name")}
                  />
                </Field>
                <Field
                  label="SKU Preview"
                  hint="Auto-generated by system after saving"
                >
                  <Input
                    icon={<FiHash />}
                    placeholder="Auto-generated after save"
                    value="Auto-generated"
                    disabled
                    readOnly
                  />
                </Field>
                <Field label="Category" required>
                  <Select
                    icon={<FiGrid />}
                    value={isCategoryOther ? "__others__" : form.category}
                    onChange={handleCategorySelect}
                  >
                    <option value="">— Select Category —</option>
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__others__">Others</option>
                  </Select>
                  {isCategoryOther && (
                    <input
                      type="text"
                      autoFocus
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      onBlur={saveCustomCategory}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveCustomCategory();
                        }
                      }}
                      placeholder="Type new category name"
                      className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1E3A8A]"
                    />
                  )}
                </Field>
                <Field label="Brand / Company" required>
                  <Input
                    icon={<FiHome />}
                    placeholder="e.g. Stanley, Bosch, BSRM"
                    value={form.company}
                    onChange={set("company")}
                  />
                </Field>
                <Field label="Country of Origin">
                  <Input
                    icon={<FiGlobe />}
                    placeholder="e.g. Bangladesh, China, Germany"
                    value={form.origin}
                    onChange={set("origin")}
                  />
                </Field>
                <Field label="Quality">
                  <Input
                    icon={<FiAward />}
                    placeholder="e.g. Premium, Standard, Economy"
                    value={form.quality}
                    onChange={set("quality")}
                  />
                </Field>
                <Field label="Material">
                  <Input
                    icon={<FiLayers />}
                    placeholder="e.g. Steel, Wood, Plastic"
                    value={form.material}
                    onChange={set("material")}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:border-[#1E3A8A] focus-within:ring-2 focus-within:ring-[#1E3A8A]/10">
                      <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 bg-slate-50 text-slate-400">
                        <FiBold size={13} />
                        <FiItalic size={13} />
                        <FiUnderline size={13} />
                        <FiCode size={13} />
                        <FiList size={13} />
                        <FiLink size={13} />
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Brief product description…"
                        value={form.description}
                        onChange={set("description")}
                        className="w-full px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none resize-none bg-white"
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </Card>

            <Card icon={<FiDollarSign />} title="Pricing Card">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field
                    label="Buying Price"
                    required
                    hint="Always mirrors Supplier #1's buying price below, and vice versa."
                  >
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
                  <Field label="Wholesale Margin %">
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
                  <Field label="Retail Margin %">
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
                <div className="flex flex-wrap gap-3 pt-1">
                  <StatPill label="Buying Price" value={buying} tone="slate" />
                  <StatPill
                    label={`Wholesale (+${form.holcellMargin || 0}%)`}
                    value={holcell}
                    tone="navy"
                  />
                  <StatPill
                    label={`Retail (+${form.retailMargin || 0}%)`}
                    value={retail}
                    tone="orange"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  * Wholesale and Retail prices are auto-calculated. You can
                  adjust margins above.
                </p>
              </div>
            </Card>

            <Card icon={<FiArchive />} title="Inventory Card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Unit of Measure" required>
                  <Select
                    icon={<FiArchive />}
                    value={isUnitOther ? "__others__" : form.unit}
                    onChange={handleUnitSelect}
                  >
                    {allUnits.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                    <option value="__others__">Others</option>
                  </Select>
                  {isUnitOther && (
                    <input
                      type="text"
                      autoFocus
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      onBlur={saveCustomUnit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveCustomUnit();
                        }
                      }}
                      placeholder="Type new unit name"
                      className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1E3A8A]"
                    />
                  )}
                </Field>
                <Field
                  label="Unit per Carton"
                  hint="Optional — e.g. unit=bag, value=25 means each bag holds 25kg."
                >
                  <Input
                    icon={<FiBox />}
                    type="number"
                    placeholder="e.g. 25"
                    value={form.unitValue}
                    onChange={set("unitValue")}
                    min="0"
                    step="0.01"
                    suffix={form.unit}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 mb-5">
                <Field label="Storage Location">
                  <Input
                    icon={<FiMapPin />}
                    placeholder="e.g. Rack B-3, Shelf 2"
                    value={form.location}
                    onChange={set("location")}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
                    <span className="text-[13px] font-bold text-slate-600">
                      Opening Stock Summary
                    </span>
                    <span className="text-lg font-extrabold text-slate-800">
                      {totalOpeningStock} {form.unit}
                    </span>
                  </div>
                  {totalOpeningStock === 0 ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                      <FiAlertTriangle
                        size={14}
                        className="text-red-500 flex-shrink-0"
                      />
                      <span className="text-xs font-semibold text-red-600">
                        No stock yet — add supplier purchase quantities below
                      </span>
                    </div>
                  ) : totalOpeningStock <= 10 ? (
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5">
                      <FiAlertTriangle
                        size={14}
                        className="text-yellow-600 flex-shrink-0"
                      />
                      <span className="text-xs font-semibold text-yellow-700">
                        Low opening stock — consider ordering more soon
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                      <FiCheckCircle
                        size={14}
                        className="text-green-600 flex-shrink-0"
                      />
                      <span className="text-xs font-semibold text-green-700">
                        Stock level looks good
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-[#FFF7ED] border border-[#FBE3C6] rounded-xl px-4 py-3.5">
                  <p className="text-[13px] font-bold text-slate-700 mb-2.5">
                    Low Stock Warning
                  </p>
                  <div className="w-full h-2 rounded-full bg-white overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${stockPct}%`, background: ORANGE }}
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-2">
                    Custom Threshold &lt; {stockThreshold} {form.unit}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT ~30% */}
          <div className="flex flex-col gap-6">
            <Card icon={<FiInfo />} title="Product Status Card">
              <div className="flex flex-col gap-3">
                {["active", "inactive", "discontinued"].map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${form.status === s ? (s === "active" ? "border-green-400 bg-green-50" : "border-[#1E3A8A] bg-[#EFF3FF]") : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={set("status")}
                      className="accent-[#1E3A8A]"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-800 capitalize">
                        {s}
                      </span>
                      <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                        {s === "active" && "Visible and available for sale"}
                        {s === "inactive" &&
                          "Hidden from sales, stock retained"}
                        {s === "discontinued" && "No longer stocked or sold"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <Card icon={<FiImage />} title="Product Images Card">
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-7 text-center cursor-pointer hover:border-[#1E3A8A] hover:bg-[#EFF3FF] transition-colors"
                style={{ background: "#F8FAFF" }}
              >
                <div className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                  <FiUpload size={18} color={NAVY} />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  Drag-and-drop illustration
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Drag-and-drop upload you can here · PNG, JPG up to 5MB · Max 4
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImages}
                />
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative rounded-lg border border-slate-200 overflow-hidden aspect-square bg-slate-50"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <FiX size={12} />
                      </button>
                      {i === 0 && (
                        <span
                          className="absolute bottom-1 left-1 text-white text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: ORANGE }}
                        >
                          Main Image
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card icon={<FiTruck />} title="Supplier Management Card">
              <div className="flex flex-col gap-3">
                <p className="text-[11px] text-slate-400">
                  Each row's quantity adds to opening stock. Add one or more
                  payment methods per supplier — unpaid remainder becomes a
                  supplier due.
                </p>
                {supplierRows.map((row, idx) => {
                  const totalCost = rowTotalCost(row, idx);
                  const appliedCredit = rowAppliedCredit(row, idx);
                  const costAfterCredit = Math.max(
                    0,
                    totalCost - appliedCredit,
                  );
                  const paidSum = rowPaidSum(row);
                  const due = Math.max(0, costAfterCredit - paidSum);
                  return (
                    <div
                      key={row.id}
                      className="border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2.5 bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <select
                          value={row.isOther ? "__other__" : row.supplierId}
                          onChange={(e) =>
                            setSupplierSelect(row.id, e.target.value)
                          }
                          className="flex-1 min-w-0 text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2.5 outline-none bg-white"
                        >
                          <option value="">— Selected Supplier —</option>
                          {supplierOptions
                            .filter((s) =>
                              (s.companyName || s.name || "").trim(),
                            )
                            .map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.companyName || s.name}
                              </option>
                            ))}
                          <option value="__other__">Others</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSupplierRow(row.id)}
                          disabled={supplierRows.length === 1}
                          className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      {row.isOther && (
                        <input
                          value={row.otherName}
                          onChange={(e) =>
                            updateSupplierRow(
                              row.id,
                              "otherName",
                              e.target.value,
                            )
                          }
                          placeholder="New supplier name"
                          className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2.5 outline-none bg-white"
                        />
                      )}

                      {row.balance &&
                        (row.balance.payableAmount > 0 ||
                          row.balance.receivableAmount > 0) && (
                          <div
                            className={`rounded-lg p-2.5 text-[11px] border ${row.balance.payableAmount > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
                          >
                            {row.balance.payableAmount > 0 ? (
                              <p className="font-bold text-red-700">
                                Existing Due: ৳
                                {row.balance.payableAmount.toLocaleString()}
                              </p>
                            ) : (
                              <>
                                <p className="font-bold text-green-700">
                                  Existing Balance: ৳
                                  {row.balance.receivableAmount.toLocaleString()}
                                </p>
                                <label className="flex items-center gap-1.5 mt-1.5 font-bold text-green-800 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={row.applyCredit}
                                    onChange={(e) =>
                                      setRowApplyCredit(
                                        row.id,
                                        e.target.checked,
                                      )
                                    }
                                    className="w-3.5 h-3.5 accent-green-600"
                                  />
                                  Credit Adjustment
                                </label>
                                {row.applyCredit && (
                                  <p className="text-[10px] text-green-700 mt-1">
                                    Auto: ৳{appliedCredit.toLocaleString()}{" "}
                                    applied · ৳
                                    {Math.max(
                                      0,
                                      row.balance.receivableAmount -
                                        appliedCredit,
                                    ).toLocaleString()}{" "}
                                    remaining
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )}

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Buying Price"
                          value={idx === 0 ? form.buyingPrice : row.buyingPrice}
                          onChange={(e) =>
                            updateSupplierRow(
                              row.id,
                              "buyingPrice",
                              e.target.value,
                            )
                          }
                          className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2.5 outline-none bg-white"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Purchase Quantity"
                          value={row.purchaseQuantity}
                          onChange={(e) =>
                            updateSupplierRow(
                              row.id,
                              "purchaseQuantity",
                              e.target.value,
                            )
                          }
                          className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2.5 outline-none bg-white"
                        />
                        <input
                          type="date"
                          value={row.purchaseDate}
                          onChange={(e) =>
                            updateSupplierRow(
                              row.id,
                              "purchaseDate",
                              e.target.value,
                            )
                          }
                          className="col-span-2 text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2.5 outline-none bg-white"
                        />
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-2"><span>Total Cost</span><span>৳{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        {appliedCredit > 0 && (
                          <div className="flex justify-between text-[11px] font-semibold text-green-700 mb-2"><span>Credit Applied</span><span>-৳{appliedCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        )}
                        <PaymentSplitEditor rows={row.payments} onChange={(newRows) => setRowPayments(row.id, newRows)} maxTotal={costAfterCredit} label="Payment Method(s)" />
                        <div className="grid grid-cols-2 gap-2 mt-2.5">
                          <div
                            className="rounded-lg px-2.5 py-2 text-center"
                            style={{ background: "#EFF3FF" }}
                          >
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                              Due Calculation
                            </p>
                            <p
                              className={`text-sm font-extrabold ${due > 0 ? "text-red-600" : "text-green-600"}`}
                            >
                              ৳
                              {due.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <div
                            className="rounded-lg px-2.5 py-2 text-center"
                            style={{ background: "#1E3A8A" }}
                          >
                            <p className="text-[9px] font-bold uppercase tracking-wide text-blue-200">
                              Paid
                            </p>
                            <p className="text-sm font-extrabold text-white">
                              ৳
                              {paidSum.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addSupplierRow}
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg py-2.5 text-xs font-bold text-slate-500 hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-colors"
                >
                  <FiPlus size={14} /> Add Supplier
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Summary Banner */}
        <div
          className="sticky bottom-4 flex items-center justify-between flex-wrap gap-4 rounded-2xl px-6 py-4 shadow-xl"
          style={{ background: NAVY }}
        >
          <div className="min-w-[160px]">
            <p className="text-white text-sm font-bold truncate">
              Product: {form.name || "—"}
            </p>
            <p className="text-blue-200 text-xs font-medium mt-0.5">
              SKU: Auto-generated · Total Cost: ৳
              {grandTotalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center px-4 py-1.5 rounded-lg bg-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-200">
                Stock Preview
              </p>
              <p className="text-white font-extrabold text-sm">
                {totalOpeningStock} {form.unit}
              </p>
            </div>
            <div className="text-center px-4 py-1.5 rounded-lg bg-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-200">
                Cost Summary
              </p>
              <p className="text-white font-extrabold text-sm">
                ৳
                {grandTotalCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: ORANGE }}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <FiSave size={15} /> Save Product
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddProduct;
