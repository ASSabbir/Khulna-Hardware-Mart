import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiAlertTriangle,
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiX,
  FiPlus,
} from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");

// Restock Modal — same supplier-based flow as ProductDetails.jsx (records a
// real purchase batch: supplier + buying price + quantity + date), instead of
// a bare stock-number bump.
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

  if (!product) return null;

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
const Stock = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockModal, setRestockModal] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "" });

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/products?limit=1000&search=");
      const lowStock = res.data.products.filter(p => (p.stock || 0) < 20);
      setProducts(lowStock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 2800);
  };

  const handleRestockDone = (updatedProduct) => {
    showToast(`Restock recorded for ${updatedProduct.name}.`, "success");
    setRestockModal(null);
    fetchLowStockProducts();
  };

  // Stats
  const critical = products.filter(p => (p.stock || 0) === 0).length;
  const low = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
  const warning = products.filter(p => (p.stock || 0) >= 10 && (p.stock || 0) < 20).length;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-lg">Loading stock data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-base font-medium flex items-center gap-2 text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          <FiCheckCircle size={18} /> {toast.msg}
        </div>
      )}

      {/* Restock Modal */}
      {restockModal && (
        <RestockModal
          product={restockModal}
          onClose={() => setRestockModal(null)}
          onDone={handleRestockDone}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white">
            <FiAlertTriangle size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Warning</h1>
            <p className="text-gray-500 text-base mt-0.5">Products with low stock need attention</p>
          </div>
          <div className="ml-auto bg-red-50 border border-red-100 text-red-600 text-xl font-bold px-5 py-2 rounded-2xl">
            {products.length} items
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <FiAlertCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{critical}</div>
              <div className="text-gray-500 text-sm">Out of Stock</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <FiAlertTriangle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{low}</div>
              <div className="text-gray-500 text-sm">Critical Low</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
              <FiPackage size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{warning}</div>
              <div className="text-gray-500 text-sm">Low Stock</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <FiRefreshCw size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Click to</div>
              <div className="text-gray-500 text-sm">Restock</div>
            </div>
          </div>
        </div>

        {/* Table */}
        {products.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-20 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">All Stock is Healthy!</h3>
            <p className="text-gray-500">No products are below the minimum stock level.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500">Product</th>
                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500">Brand/Company</th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">Buying Price</th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">Retail Price</th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">Current Stock</th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">Status</th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => {
                    const stock = product.stock || 0;

                    let statusBadge;
                    if (stock === 0) {
                      statusBadge = <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>;
                    } else if (stock < 10) {
                      statusBadge = <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">Critical</span>;
                    } else {
                      statusBadge = <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">Low</span>;
                    }

                    return (
                      <tr key={product._id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                              stock === 0 ? "bg-red-500" : stock < 10 ? "bg-orange-500" : "bg-yellow-500"
                            }`}>
                              <FiPackage size={16} />
                            </div>
                            <div>
                              <div className="text-base font-semibold text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-400">{product.sku || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-gray-700">{product.brand || product.company || "—"}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-700">{fmt(product.buyingPrice)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-700">{fmt(product.retailPrice)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className={`text-2xl font-bold ${
                            stock === 0 ? "text-red-600" : stock < 10 ? "text-orange-600" : "text-yellow-600"
                          }`}>
                            {stock}
                          </div>
                          <div className="text-xs text-gray-400">units</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {statusBadge}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setRestockModal(product)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto bg-red-500 hover:bg-red-600 text-white transition"
                          >
                            <FiRefreshCw size={14} /> Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-base pb-4">Khulna Hardware Mart · Stock Warnings</p>
      </div>
    </div>
  );
};

export default Stock;