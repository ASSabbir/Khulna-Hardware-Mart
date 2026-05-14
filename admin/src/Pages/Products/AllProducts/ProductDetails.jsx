import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft, FiPackage, FiEdit, FiTrash2, FiDollarSign,
  FiArchive, FiTruck, FiTag, FiInfo, FiImage, FiCheckCircle,
  FiAlertTriangle, FiX, FiChevronRight, FiHome,
} from "react-icons/fi";

/* ─── Price Format ─────────────────────────────────────────────── */
const fmt = (n) =>
  "৳ " + Number(n || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ─── Status Badge ────────────────────────────────────────────── */
const statusConfig = {
  active: { label: "Active", cls: "bg-green-100 text-green-700 border-green-300", icon: <FiCheckCircle size={12} /> },
  inactive: { label: "Inactive", cls: "bg-slate-100 text-slate-600 border-slate-300", icon: <FiX size={12} /> },
  discontinued: { label: "Discontinued", cls: "bg-red-100 text-red-700 border-red-300", icon: <FiAlertTriangle size={12} /> },
};

/* ─── Stock Badge ─────────────────────────────────────────────── */
const stockBadge = (qty, reorderLevel) => {
  if (!qty || qty === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700 border-red-300", icon: <FiX size={12} /> };
  if (reorderLevel && qty <= reorderLevel) return { label: `Low Stock (${qty})`, cls: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: <FiAlertTriangle size={12} /> };
  return { label: qty.toLocaleString(), cls: "bg-green-100 text-green-700 border-green-300", icon: <FiCheckCircle size={12} /> };
};

/* ─── Section Card ────────────────────────────────────────────── */
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

/* ─── Info Row ────────────────────────────────────────────────── */
const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-semibold text-[#1E293B] ${mono ? "font-mono" : ""}`}>
      {value || <span className="text-slate-300">—</span>}
    </span>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   Component
══════════════════════════════════════════════════════════════════ */
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* ── Fetch ─────────────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`https://khulna-hardware-mart.vercel.app/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Delete handler ─────────────────────────────────────────── */
  const handleDelete = async () => {
    try {
      await axios.delete(`https://khulna-hardware-mart.vercel.app/api/products/${id}`);
      navigate("/products");
    } catch (err) {
      alert("Failed to delete product");
    }
    setShowDeleteModal(false);
  };

  /* ── Render ─────────────────────────────────────────────────── */
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

  return (
    <div className="flex flex-col gap-5 font-['Barlow',sans-serif] max-w-5xl">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link to="/products" className="flex items-center gap-1 hover:text-[#1E3A8A] transition-colors">
          <FiHome size={12} /> Products
        </Link>
        <FiChevronRight size={12} />
        <span className="text-[#1E3A8A] font-semibold">{product.name}</span>
      </div>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          {/* Product Image / Icon */}
          <div className="w-20 h-20 rounded-xl border-2 border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
            {product.images && product.images[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <FiPackage size={32} className="text-slate-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-2xl uppercase tracking-wide leading-tight">
                {product.name}
              </h1>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}>
                {status.icon} {status.label}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{product.brand || product.company}</p>
            <div className="flex items-center gap-3 mt-2">
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/products/edit/${product._id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#1E3A8A] text-[#1E3A8A] text-sm font-semibold bg-white hover:bg-[#1E3A8A] hover:text-white transition-colors"
          >
            <FiEdit size={14} /> Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-red-400 text-red-500 text-sm font-semibold bg-white hover:bg-red-500 hover:text-white transition-colors"
          >
            <FiTrash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* ── Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Pricing Card */}
          <Card icon={<FiDollarSign />} title="Pricing" accent>
            <div className="grid grid-cols-3 gap-4">
              {/* Buying Price */}
              <div className="rounded-lg border-2 border-slate-200 p-4 text-center bg-slate-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Buying Price</p>
                <p className="text-xl font-bold text-[#1E293B] font-['Barlow_Condensed',sans-serif]">{fmt(product.buyingPrice)}</p>
                <p className="text-[10px] text-slate-400 mt-1">per {product.unit || "pcs"}</p>
              </div>

              {/* Holcell Price */}
              <div className="rounded-lg border-2 border-[#1D4ED8] p-4 text-center bg-blue-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">
                  Holcell (+{((product.holcellMargin || 3) * 100 / product.buyingPrice).toFixed(1) || 3}%)
                </p>
                <p className="text-xl font-bold text-[#1D4ED8] font-['Barlow_Condensed',sans-serif]">{fmt(holcell)}</p>
                <p className="text-[10px] text-blue-400 mt-1">wholesale price</p>
              </div>

              {/* Retail Price */}
              <div className="rounded-lg border-2 border-[#F97316] p-4 text-center bg-orange-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">
                  Retail (+{((product.retailMargin || 5) * 100 / product.buyingPrice).toFixed(1) || 5}%)
                </p>
                <p className="text-xl font-bold text-[#F97316] font-['Barlow_Condensed',sans-serif]">{fmt(retail)}</p>
                <p className="text-[10px] text-orange-400 mt-1">customer price</p>
              </div>
            </div>

            {/* Margin details */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs">
                <span className="text-slate-400">Holcell Margin: </span>
                <span className="font-bold text-[#1D4ED8]">{product.holcellMargin || 3}%</span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400">Retail Margin: </span>
                <span className="font-bold text-[#F97316]">{product.retailMargin || 5}%</span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400">Unit: </span>
                <span className="font-bold text-slate-600">{product.unit || "pcs"}</span>
              </div>
            </div>
          </Card>

          {/* Stock Card */}
          <Card icon={<FiArchive />} title="Stock & Inventory">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Current Stock */}
                <div className="rounded-lg border-2 border-slate-200 p-4 text-center bg-slate-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Current Stock</p>
                  <p className={`text-xl font-bold font-['Barlow_Condensed',sans-serif] ${stock.cls.split(" ")[1].replace("700", "800")}`}>
                    {stock.label}
                  </p>
                </div>

                {/* Reorder Level */}
                <div className="rounded-lg border-2 border-yellow-200 p-4 text-center bg-yellow-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 mb-2">Reorder Level</p>
                  <p className="text-xl font-bold text-yellow-700 font-['Barlow_Condensed',sans-serif]">
                    {product.reorderLevel || 0}
                  </p>
                </div>

                {/* Stock Value */}
                <div className="rounded-lg border-2 border-green-200 p-4 text-center bg-green-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-2">Stock Value</p>
                  <p className="text-xl font-bold text-green-700 font-['Barlow_Condensed',sans-serif]">
                    {fmt((product.stock || 0) * product.buyingPrice)}
                  </p>
                </div>
              </div>

              {/* Location & Origin */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                {product.location && (
                  <div className="text-xs">
                    <span className="text-slate-400">Storage: </span>
                    <span className="font-semibold text-slate-600">{product.location}</span>
                  </div>
                )}
                {product.origin && (
                  <div className="text-xs">
                    <span className="text-slate-400">Origin: </span>
                    <span className="font-semibold text-slate-600">{product.origin}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Description */}
          {product.description && (
            <Card icon={<FiInfo />} title="Description">
              <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
            </Card>
          )}
        </div>

        {/* Right Column (1/3) */}
        <div className="flex flex-col gap-5">

          {/* Basic Info */}
          <Card icon={<FiTag />} title="Basic Information">
            <div className="flex flex-col">
              <InfoRow label="Name" value={product.name} />
              <InfoRow label="Brand" value={product.brand || product.company} />
              <InfoRow label="Category" value={product.category} />
              <InfoRow label="SKU" value={product.sku} mono />
              <InfoRow label="Unit" value={product.unit} />
              <InfoRow label="Origin" value={product.origin} />
              <InfoRow label="Status" value={<span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${status.cls}`}>{status.icon} {status.label}</span>} />
            </div>
          </Card>

          {/* Supplier Info */}
          <Card icon={<FiTruck />} title="Supplier Information">
            <div className="flex flex-col">
              <InfoRow label="Supplier Name" value={product.supplierName} />
              <InfoRow label="Contact" value={product.supplierContact} />
              <InfoRow label="Supplier ID" value={product.supplierId} mono />
            </div>
            {!product.supplierName && (
              <p className="text-[10px] text-slate-400 font-medium mt-2 tracking-wide">
                * No supplier assigned yet.
              </p>
            )}
          </Card>

          {/* Product Images */}
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

          {/* Timestamps */}
          <Card icon={<FiInfo />} title="Record Info">
            <div className="flex flex-col">
              <InfoRow
                label="Created"
                value={new Date(product.createdAt).toLocaleDateString("en-BD", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              />
              <InfoRow
                label="Updated"
                value={new Date(product.updatedAt).toLocaleDateString("en-BD", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
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
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-300 text-slate-600 text-sm font-semibold bg-white hover:border-slate-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-red-500 bg-red-500 text-white text-sm font-semibold hover:bg-red-600 hover:border-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;