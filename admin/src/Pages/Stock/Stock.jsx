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
} from "react-icons/fi";
import RestockModal from "../../Components/RestockModal";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");

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
      const res = await axios.get(
        "http://localhost:5000/api/products?limit=1000&search=",
      );
      const lowStock = res.data.products.filter((p) => (p.stock || 0) <= 10);
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

  // Stats — binary threshold per spec: stock <= 10 is Low Stock, 0 is Out of Stock
  const critical = products.filter((p) => (p.stock || 0) === 0).length;
  const low = products.filter(
    (p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10,
  ).length;

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-lg">Loading stock data...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Toast */}
      {toast.msg && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-base font-medium flex items-center gap-2 text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}
        >
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
            <p className="text-gray-500 text-base mt-0.5">
              Products with low stock need attention
            </p>
          </div>
          <div className="ml-auto bg-red-50 border border-red-100 text-red-600 text-xl font-bold px-5 py-2 rounded-2xl">
            {products.length} items
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <div className="text-gray-500 text-sm">Low Stock (&le;10)</div>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              All Stock is Healthy!
            </h3>
            <p className="text-gray-500">
              No products are below the minimum stock level.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500">
                      Product
                    </th>
                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500">
                      Brand/Company
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">
                      Buying Price
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">
                      Retail Price
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">
                      Current Stock
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">
                      Status
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => {
                    const stock = product.stock || 0;

                    let statusBadge;
                    if (stock === 0) {
                      statusBadge = (
                        <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                          Out of Stock
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                          Low Stock
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={product._id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                                stock === 0 ? "bg-red-500" : "bg-orange-500"
                              }`}
                            >
                              <FiPackage size={16} />
                            </div>
                            <div>
                              <div className="text-base font-semibold text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {product.sku || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-gray-700">
                            {product.brand || product.company || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-700">
                            {fmt(product.buyingPrice)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-700">
                            {fmt(product.retailPrice)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div
                            className={`text-2xl font-bold ${
                              stock === 0 ? "text-red-600" : "text-orange-600"
                            }`}
                          >
                            {stock}
                          </div>
                          <div className="text-xs text-gray-400">units</div>
                        </td>
                        <td className="px-5 py-4 text-center">{statusBadge}</td>
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

        <p className="text-center text-gray-400 text-base pb-4">
          Khulna Hardware Mart · Stock Warnings
        </p>
      </div>
    </div>
  );
};

export default Stock;
