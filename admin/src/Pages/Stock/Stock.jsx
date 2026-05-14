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

// Restock Modal
function RestockModal({ product, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(50);
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const currentStock = product.stock || 0;
  const newStock = currentStock + parseInt(quantity || 0);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(product._id, parseInt(quantity));
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Restock Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-7 py-6 space-y-5">
          {/* Product Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                currentStock === 0 ? "bg-red-500" : currentStock < 10 ? "bg-orange-500" : "bg-yellow-500"
              }`}>
                <FiPackage size={20} />
              </div>
              <div>
                <div className="text-base font-bold text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">{product.brand || product.company || "—"}</div>
              </div>
            </div>
          </div>

          {/* Current Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{currentStock}</div>
              <div className="text-sm text-red-500">Current Stock</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{newStock}</div>
              <div className="text-sm text-green-500">After Restock</div>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              Quantity to Add
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 10))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
              >
                <FiX size={16} />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => setQuantity(quantity + 10)}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
              >
                <FiPlus size={16} />
              </button>
            </div>
            {/* Quick buttons */}
            <div className="flex gap-2 mt-3">
              {[10, 25, 50, 100].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                    quantity === q
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  +{q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-7 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl text-base hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || quantity < 1}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-base transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Confirm Restock"}
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
      const res = await axios.get("https://khulna-hardware-mart.vercel.app/api/products?limit=1000&search=");
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

  const handleRestock = async (productId, quantity) => {
    try {
      // Find the product to get current stock
      const product = products.find(p => p._id === productId);
      if (!product) return;

      // Update stock in database
      const newStock = (product.stock || 0) + quantity;
      await axios.put(`https://khulna-hardware-mart.vercel.app/api/products/${productId}`, {
        stock: newStock,
      });

      showToast(`Stock updated! Added ${quantity} units.`, "success");
      setRestockModal(null);
      // Refresh the list
      fetchLowStockProducts();
    } catch (err) {
      showToast("Failed to update stock", "error");
    }
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
          onConfirm={handleRestock}
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