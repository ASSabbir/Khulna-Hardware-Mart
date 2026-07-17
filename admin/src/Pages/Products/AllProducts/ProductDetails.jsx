// FILE: src/Pages/Products/AllProducts/ProductDetails.jsx (FULL REPLACEMENT)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft, FiPackage, FiEdit, FiTrash2, FiDollarSign,
  FiArchive, FiTruck, FiTag, FiInfo, FiImage, FiCheckCircle,
  FiAlertTriangle, FiX, FiChevronRight, FiHome, FiRefreshCw, FiPlus, FiEye, FiCalendar,
} from "react-icons/fi";

const fmt = (n) =>
  "৳ " + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusConfig = {
  active: { label: "Active", cls: "bg-green-100 text-green-700 border-green-300", icon: <FiCheckCircle size={12} /> },
  inactive: { label: "Inactive", cls: "bg-slate-100 text-slate-600 border-slate-300", icon: <FiX size={12} /> },
  discontinued: { label: "Discontinued", cls: "bg-red-100 text-red-700 border-red-300", icon: <FiAlertTriangle size={12} /> },
};

const stockBadge = (qty, reorderLevel) => {
  if (!qty || qty === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700 border-red-300", icon: <FiX size={12} /> };
  if (reorderLevel && qty <= reorderLevel) return { label: `Low Stock (${qty})`, cls: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: <FiAlertTriangle size={12} /> };
  return { label: qty.toLocaleString(), cls: "bg-green-100 text-green-700 border-green-300", icon: <FiCheckCircle size={12} /> };
};

const Card = ({ icon, title, children, accent = false }) => (
  <div className={`bg-white rounded-xl border-2 ${accent ? "border-[#F97316]" : "border-slate-200"} overflow-hidden`}>
    <div className={`flex items-center gap-3 px-5 py-3 border-b-2 ${accent ? "border-[#F97316] bg-[#FFF7ED]" : "border-slate-100 bg-slate-50"}`}>
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-[#F97316]" : "bg-[#1E3A8A]"}`}>
        {React.cloneElement(icon, { size: 14, className: "text-white" })}
      </span>
      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-sm uppercase tracking-widest">
        {title}
      </h2>
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex justify-between items-center gap-3 py-2 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider shrink-0">{label}</span>
    <span className={`text-sm font-semibold text-[#1E293B] text-right break-words ${mono ? "font-mono" : ""}`}>
      {value || <span className="text-slate-300">—</span>}
    </span>
  </div>
);

/* ── Restock Modal — records a new purchase (same or new supplier, new price) ── */
function RestockModal({ product, onClose, onDone }) {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/suppliers?limit=200")
      .then((res) => setSuppliers(res.data.suppliers || []))
      .catch(() => setSuppliers([]));
  }, []);

  const handleSelect = (val) => {
    if (val === "__other__") { setIsOther(true); setSupplierId(""); }
    else { setIsOther(false); setSupplierId(val); }
  };

  const handleSubmit = async () => {
    setError("");
    const qty = Number(quantity);
    const price = Number(buyingPrice);
    if (!Number.isFinite(qty) || qty <= 0) { setError("Enter a valid quantity."); return; }
    if (!Number.isFinite(price) || price < 0) { setError("Enter a valid buying price."); return; }
    if (!supplierId && !otherName.trim()) { setError("Select a supplier or enter a new supplier name."); return; }

    setSaving(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/products/${product._id}/restock`, {
        supplierId: isOther ? undefined : supplierId,
        supplierName: isOther ? otherName.trim() : undefined,
        buyingPrice: price,
        quantity: qty,
        purchaseDate,
      });
      onDone(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to restock product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#1E3A8A]">Restock Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><FiX size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
            <p className="font-semibold text-[#1E293B]">{product.name}</p>
            <p className="text-slate-400 text-xs">Current stock: {product.stock || 0} {product.unit || "pcs"}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">Supplier</label>
            <select
              value={isOther ? "__other__" : supplierId}
              onChange={(e) => handleSelect(e.target.value)}
              className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none bg-white"
            >
              <option value="">— Select Supplier —</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.companyName}</option>
              ))}
              <option value="__other__">Others (add new)</option>
            </select>
          </div>
          {isOther && (
            <input
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              placeholder="New supplier name"
              className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none"
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">Buying Price</label>
              <input type="number" min="0" step="0.01" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)}
                placeholder="0.00" className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">Quantity</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                placeholder="0" className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">Purchase Date</label>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold py-2.5 rounded-xl disabled:opacity-50">
            {saving ? "Saving..." : "Confirm Restock"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SupplierHistoryModal({ product, supplier, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = supplier.supplierId ? `?supplierId=${supplier.supplierId}` : "";
    axios.get(`http://localhost:5000/api/products/${product._id}/purchase-history${params}`)
      .then((res) => setRecords(res.data.records || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [product._id, supplier.supplierId]);

  const sorted = [...records].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
  const totalQty = sorted.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalCost = sorted.reduce((s, r) => s + (r.totalCost || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[88vh] flex flex-col font-['Barlow',sans-serif]">

        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-[#1E3A8A] flex items-center justify-center shrink-0">
              <FiTruck size={16} className="text-white" />
            </span>
            <div>
              <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-base uppercase tracking-wide leading-tight">
                Purchase Timeline
              </h2>
              <p className="text-xs text-slate-400 font-medium">{supplier.supplierName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <FiX size={18} className="text-slate-500" />
          </button>
        </div>

        {!loading && sorted.length > 0 && (
          <div className="grid grid-cols-3 gap-3 px-6 pt-4">
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Purchases</p>
              <p className="text-base font-bold text-[#1E293B] font-['Barlow_Condensed',sans-serif]">{sorted.length}</p>
            </div>
            <div className="rounded-lg border-2 border-blue-100 bg-blue-50 p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-1">Total Qty</p>
              <p className="text-base font-bold text-[#1D4ED8] font-['Barlow_Condensed',sans-serif]">{totalQty} {product.unit || "pcs"}</p>
            </div>
            <div className="rounded-lg border-2 border-orange-100 bg-orange-50 p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-orange-400 mb-1">Total Cost</p>
              <p className="text-base font-bold text-[#F97316] font-['Barlow_Condensed',sans-serif]">{fmt(totalCost)}</p>
            </div>
          </div>
        )}

        <div className="overflow-y-auto px-6 py-5 flex-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[#1D4ED8]">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold">Loading history…</span>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-300">
              <FiArchive size={32} />
              <p className="text-sm font-semibold text-slate-400">No purchase records found.</p>
            </div>
          ) : (
            <div className="relative pl-8">
              {/* vertical line */}
              <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-200" />

              <div className="flex flex-col gap-6">
                {sorted.map((r, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div key={r._id} className="relative">
                      {/* status dot */}
                      <span
                        className={`absolute -left-8 top-1 w-[26px] h-[26px] rounded-full border-4 flex items-center justify-center ${
                          isLatest
                            ? "bg-[#F97316] border-orange-100"
                            : "bg-[#1E3A8A] border-blue-100"
                        }`}
                      >
                        <FiTruck size={11} className="text-white" />
                      </span>

                       <div className={`rounded-xl border-2 ${isLatest ? "border-[#F97316]" : "border-slate-200"} bg-white overflow-hidden`}>
                        <div className={`flex items-center justify-between gap-3 px-4 py-2.5 ${isLatest ? "bg-[#FFF7ED]" : "bg-white"}`}>
                          <div className="flex items-center gap-2 shrink-0">
                            <FiCalendar size={11} className="text-slate-400" />
                            <span className="text-xs font-bold text-[#1E3A8A] whitespace-nowrap">
                              {new Date(r.purchaseDate).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                            {isLatest && (
                              <span className="text-[8px] font-bold uppercase tracking-widest text-white bg-[#F97316] px-1.5 py-0.5 rounded-full">Latest</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap truncate">
                            {r.quantity} {product.unit || "pcs"} @ {fmt(r.buyingPrice)}
                          </span>
                          <span className="text-sm font-bold text-[#F97316] font-['Barlow_Condensed',sans-serif] shrink-0">
                            {fmt(r.totalCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* origin marker at bottom of line */}
                <div className="relative">
                  <span className="absolute -left-8 top-0 w-[26px] h-[26px] rounded-full bg-slate-300 border-4 border-slate-100 flex items-center justify-center">
                    <FiCheckCircle size={11} className="text-white" />
                  </span>
                  <p className="text-[11px] text-slate-400 font-semibold pt-1">Start of purchase history</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);
  const [toast, setToast] = useState(null);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProduct(); }, [id]);

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      navigate("/products");
    } catch (err) {
      alert("Failed to delete product");
    }
    setShowDeleteModal(false);
  };

  const handleRestockDone = (updatedProduct) => {
    setProduct(updatedProduct);
    setShowRestockModal(false);
    setToast("Restock recorded successfully.");
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-[#1D4ED8]">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading product details…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <FiAlertTriangle size={28} className="text-red-500" />
        </div>
        <p className="text-red-600 font-semibold">{error}</p>
        <button
          onClick={() => navigate("/products")}
          className="flex items-center gap-2 px-5 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-[#152a66] transition-colors"
        >
          <FiArrowLeft size={16} /> Back to Products
        </button>
      </div>
    );
  }

  if (!product) return null;

  const status = statusConfig[product.status] || statusConfig.active;
  const stock = stockBadge(product.stock, product.reorderLevel);
  const holcell = product.holcellPrice || (product.buyingPrice * 1.03);
  const retail = product.retailPrice || (product.buyingPrice * 1.05);
  const activeBatches = (product.batches || []).filter((b) => (b.quantity || 0) > 0);

  return (
    <div className="flex flex-col gap-5 font-['Barlow',sans-serif]  w-full mx-auto px-4 sm:px-6 lg:p-20 ">

      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2">
          <FiCheckCircle size={18} /> {toast}
        </div>
      )}
      {showRestockModal && (
        <RestockModal product={product} onClose={() => setShowRestockModal(false)} onDone={handleRestockDone} />
      )}
      {historyFor && (
        <SupplierHistoryModal product={product} supplier={historyFor} onClose={() => setHistoryFor(null)} />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium overflow-x-auto">
        <Link to="/products" className="flex items-center gap-1 hover:text-[#1E3A8A] transition-colors shrink-0">
          <FiHome size={12} /> Products
        </Link>
        <FiChevronRight size={12} className="shrink-0" />
        <span className="text-[#1E3A8A] font-semibold truncate">{product.name}</span>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
            {product.images && product.images[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <FiPackage size={32} className="text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-xl sm:text-2xl uppercase tracking-wide leading-tight break-words">
                {product.name}
              </h1>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}>
                {status.icon} {status.label}
              </span>
              {product.isCustom && (
                <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">CUSTOM</span>
              )}
            </div>
            <p className="text-slate-500 text-sm font-medium">{product.brand || product.company}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {product.category && (
                <span className="inline-block bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded border border-purple-200">
                  {product.category}
                </span>
              )}
              {product.sku && (
                <span className="text-xs text-slate-400 font-mono">SKU: #{product.sku}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setShowRestockModal(true)}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-green-600 text-green-700 text-sm font-semibold bg-white hover:bg-green-600 hover:text-white transition-colors"
          >
            <FiRefreshCw size={14} /> Restock
          </button>
          <Link
            to={`/products/edit/${product._id}`}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-[#1E3A8A] text-[#1E3A8A] text-sm font-semibold bg-white hover:bg-[#1E3A8A] hover:text-white transition-colors"
          >
            <FiEdit size={14} /> Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-red-400 text-red-500 text-sm font-semibold bg-white hover:bg-red-500 hover:text-white transition-colors"
          >
            <FiTrash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 flex flex-col gap-5">

          <Card icon={<FiDollarSign />} title="Pricing" accent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border-2 border-slate-200 p-4 text-center bg-slate-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Buying Price</p>
                <p className="text-xl font-bold text-[#1E293B] font-['Barlow_Condensed',sans-serif]">{fmt(product.buyingPrice)}</p>
                <p className="text-[10px] text-slate-400 mt-1">per {product.unit || "pcs"}</p>
              </div>
              <div className="rounded-lg border-2 border-[#1D4ED8] p-4 text-center bg-blue-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">
                  Holcell (+{product.holcellMargin || 3}%)
                </p>
                <p className="text-xl font-bold text-[#1D4ED8] font-['Barlow_Condensed',sans-serif]">{fmt(holcell)}</p>
                <p className="text-[10px] text-blue-400 mt-1">wholesale price</p>
              </div>
              <div className="rounded-lg border-2 border-[#F97316] p-4 text-center bg-orange-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">
                  Retail (+{product.retailMargin || 5}%)
                </p>
                <p className="text-xl font-bold text-[#F97316] font-['Barlow_Condensed',sans-serif]">{fmt(retail)}</p>
                <p className="text-[10px] text-orange-400 mt-1">customer price</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 flex-wrap">
              <div className="text-xs"><span className="text-slate-400">Holcell Margin: </span><span className="font-bold text-[#1D4ED8]">{product.holcellMargin || 3}%</span></div>
              <div className="text-xs"><span className="text-slate-400">Retail Margin: </span><span className="font-bold text-[#F97316]">{product.retailMargin || 5}%</span></div>
              <div className="text-xs"><span className="text-slate-400">Unit: </span><span className="font-bold text-slate-600">{product.unitValue ? `${product.unitValue} ` : ""}{product.unit || "pcs"}</span></div>
            </div>
          </Card>

          <Card icon={<FiArchive />} title="Stock & Inventory">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border-2 border-slate-200 p-4 text-center bg-slate-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Current Stock</p>
                  <p className={`text-xl font-bold font-['Barlow_Condensed',sans-serif] ${stock.cls.split(" ")[1].replace("700", "800")}`}>
                    {stock.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {product.unit || "pcs"}{product.unitValue ? ` · ${product.unitValue} per ${product.unit}` : ""}
                  </p>
                </div>
                <div className="rounded-lg border-2 border-yellow-200 p-4 text-center bg-yellow-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 mb-2">Reorder Level</p>
                  <p className="text-xl font-bold text-yellow-700 font-['Barlow_Condensed',sans-serif]">
                    {product.reorderLevel || 0}
                  </p>
                </div>
                <div className="rounded-lg border-2 border-green-200 p-4 text-center bg-green-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-2">Stock Value</p>
                  <p className="text-xl font-bold text-green-700 font-['Barlow_Condensed',sans-serif]">
                    {fmt((product.stock || 0) * product.buyingPrice)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                {product.location && (
                  <div className="text-xs"><span className="text-slate-400">Storage: </span><span className="font-semibold text-slate-600">{product.location}</span></div>
                )}
                {product.origin && (
                  <div className="text-xs"><span className="text-slate-400">Origin: </span><span className="font-semibold text-slate-600">{product.origin}</span></div>
                )}
                {product.quality && (
                  <div className="text-xs"><span className="text-slate-400">Quality: </span><span className="font-semibold text-slate-600">{product.quality}</span></div>
                )}
                {product.material && (
                  <div className="text-xs"><span className="text-slate-400">Material: </span><span className="font-semibold text-slate-600">{product.material}</span></div>
                )}
              </div>
            </div>
          </Card>

          {activeBatches.length > 0 && (
            <Card icon={<FiArchive />} title="Batch-wise Stock (FIFO)">
              <div className="flex flex-col gap-2">
                {activeBatches.map((b, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0 text-sm">
                    <div>
                      <p className="font-semibold text-[#1E293B]">{b.supplierName || "Unknown Supplier"}</p>
                      <p className="text-[10px] text-slate-400">
                        {b.purchaseDate ? new Date(b.purchaseDate).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1D4ED8]">{fmt(b.buyingPrice)} / {product.unit || "pcs"}</p>
                      <p className="text-[10px] text-slate-400">{b.quantity} left · Value: {fmt((b.quantity || 0) * (b.buyingPrice || 0))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {product.description && (
            <Card icon={<FiInfo />} title="Description">
              <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-5">

          <Card icon={<FiTag />} title="Basic Information">
            <div className="flex flex-col">
              <InfoRow label="Name" value={product.name} />
              <InfoRow label="Brand" value={product.brand || product.company} />
              <InfoRow label="Category" value={product.category} />
              <InfoRow label="SKU" value={product.sku} mono />
              <InfoRow label="Unit" value={product.unit} />
              <InfoRow label="Quantity per Unit" value={product.unitValue ? `${product.unitValue} (per ${product.unit || "pcs"})` : null} />
              <InfoRow label="Origin" value={product.origin} />
              <InfoRow label="Status" value={<span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${status.cls}`}>{status.icon} {status.label}</span>} />
            </div>
          </Card>

          <Card icon={<FiTruck />} title="Suppliers">
            {Array.isArray(product.suppliers) && product.suppliers.length > 0 ? (
              <div className="flex flex-col gap-3">
                {product.suppliers.map((s, i) => (
                  <div key={i} className="rounded-lg border-2 border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#1E293B]">{s.supplierName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#F97316]">{fmt(s.buyingPrice)}</span>
                        <button onClick={() => setHistoryFor(s)} className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-[#1D4ED8] hover:text-[#1D4ED8]">
                          <FiEye size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Available: {s.availableQuantity ?? 0} {product.unit || "pcs"}</span>
                      <span>Last: {s.lastPurchaseDate ? new Date(s.lastPurchaseDate).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">* No supplier assigned yet.</p>
            )}
            <button
              onClick={() => setShowRestockModal(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg py-2 text-xs font-bold text-slate-500 hover:border-green-500 hover:text-green-600 transition-colors"
            >
              <FiPlus size={13} /> Record New Purchase
            </button>
          </Card>

          {product.images && product.images.length > 0 && (
            <Card icon={<FiImage />} title={`Images (${product.images.length})`}>
              <div className="grid grid-cols-2 gap-2">
                {product.images.map((img, i) => (
                  <div key={i} className="rounded-lg border-2 border-slate-200 overflow-hidden aspect-square bg-slate-50">
                    <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card icon={<FiInfo />} title="Record Info">
            <div className="flex flex-col">
              <InfoRow
                label="Created"
                value={new Date(product.createdAt).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              />
              <InfoRow
                label="Updated"
                value={new Date(product.updatedAt).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              />
            </div>
          </Card>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 max-w-sm w-full shadow-xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] text-center mb-2">Delete Product?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-[#1E293B]">"{product.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-300 text-slate-600 text-sm font-semibold bg-white hover:border-slate-400 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg border-2 border-red-500 bg-red-500 text-white text-sm font-semibold hover:bg-red-600 hover:border-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;