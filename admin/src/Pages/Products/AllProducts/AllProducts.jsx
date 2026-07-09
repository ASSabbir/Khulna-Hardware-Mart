import React, { useState } from "react";
import ProductsShow from "./ProductsShow";

const AllProducts = () => {
  const [tab, setTab] = useState("all");

  return (
    <div className="p-6">
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