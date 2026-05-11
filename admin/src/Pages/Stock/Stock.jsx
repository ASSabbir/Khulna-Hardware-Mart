import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiAlertTriangle,
  FiTruck,
  FiPhone,
  FiMail,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";

/* Format */
const fmt = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-BD");

/* Simple supplier match */
const getSuppliers = (product, suppliers) => {
  return suppliers.filter((s) =>
    (s.brands || []).some(
      (b) => b.toLowerCase() === product.company.toLowerCase()
    )
  );
};

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordered, setOrdered] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get("/JSON/Products.json"),
      axios.get("/JSON/Suppliers.json"),
    ]).then(([pRes, sRes]) => {
      setProducts(pRes.data.filter((p) => p.quantity <= 10));
      setSuppliers(sRes.data);
      setLoading(false);
    });
  }, []);

  const handleRestock = (id) => {
    setOrdered((prev) => [...prev, id]);
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;700&family=Barlow+Condensed:wght@700&display=swap"
        rel="stylesheet"
      />

      <div className="px-4 py-6 max-w-5xl mx-auto font-['Barlow',sans-serif] flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
            <FiAlertTriangle className="text-white" size={20} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-[#1E3A8A]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Stock Warning
            </h1>
            <p className="text-sm text-slate-400">
              {products.length} products need attention
            </p>
          </div>
        </div>

        {/* Products */}
        {products.map((product) => {
          const related = getSuppliers(product, suppliers);
          const isDone = ordered.includes(product.id);

          return (
            <div
              key={product.id}
              className={`bg-white border-2 rounded-2xl p-5 ${
                isDone ? "border-green-400" : "border-slate-200"
              }`}
            >
              {/* Product Info */}
              <div className="flex justify-between items-center flex-wrap gap-3">

                <div>
                  <h2 className="font-bold text-[#1E293B]">
                    {product.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {product.company} · {fmt(product.buyingPrice)}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {product.quantity}
                  </p>
                  <p className="text-xs text-slate-400">units</p>
                </div>

                <button
                  onClick={() => handleRestock(product.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    isDone
                      ? "bg-green-100 text-green-600"
                      : "bg-[#F97316] text-white"
                  }`}
                >
                  <FiRefreshCw size={12} />
                  {isDone ? "Ordered" : "Restock"}
                </button>
              </div>

              {/* Suppliers */}
              <div className="mt-5">
                <p className="text-xs font-bold text-[#1E3A8A] mb-3 flex items-center gap-2">
                  <FiTruck size={12} /> Suppliers
                </p>

                {related.length === 0 && (
                  <p className="text-xs text-slate-400">
                    No suppliers found
                  </p>
                )}

                <div className="grid md:grid-cols-2 gap-3">
                  {related.map((s) => (
                    <div
                      key={s.id}
                      className="border rounded-xl p-3 bg-slate-50"
                    >
                      <p className="font-semibold text-sm">
                        {s.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.type} · {s.location}
                      </p>

                      <div className="mt-2 text-xs flex flex-col gap-1">
                        <span className="flex items-center gap-1">
                          <FiUser size={10} /> {s.contactPerson}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiPhone size={10} /> {s.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMail size={10} /> {s.email}
                        </span>
                      </div>

                      <p className="text-xs mt-2 text-slate-500">
                        Delivery: {s.deliveryDays}d
                      </p>
                      <p className="text-xs text-slate-500">
                        Min: {fmt(s.minOrderTaka)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Stock;