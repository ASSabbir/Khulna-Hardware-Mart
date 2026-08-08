import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductsShow from "./ProductsShow";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

const AllProducts = () => {
  const [tab, setTab] = useState("all");
  const [valuation, setValuation] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/products/valuation/summary")
      .then((res) => setValuation(res.data))
      .catch(() => setValuation(null));
  }, []);

  return (
    <div className="p-6">
      {valuation && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 inline-flex items-center gap-2 text-sm font-bold text-blue-800">
          {valuation.totalProducts} Products — {fmt(valuation.totalValue)} Total Stock Value
        </div>
      )}
      <div className="flex gap-2 mb-4">
        {[
          { key: "all", label: "All Products" },
          { key: "regular", label: "Regular Products" },
          { key: "custom", label: "Custom Products" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === t.key
                ? "bg-[#1E3A8A] text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#1E3A8A]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ProductsShow filterType={tab} />
    </div>
  );
};

export default AllProducts;