import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft, FiPackage } from "react-icons/fi";

/* price format */
const fmt = (n) =>
  "৳ " + Number(n).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const WHOLESELL_RATE = 0.03;
const RETAIL_RATE = 0.05;

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);

  useEffect(() => {
    axios.get("/public/JSON/Products.json").then((res) => {
      const found = res.data.find((p) => String(p.id) === id);
      setProduct(found);
    });
  }, [id]);

  if (!product) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        Loading...
      </div>
    );
  }

  const holcell = product.buyingPrice + product.buyingPrice * WHOLESELL_RATE;
  const retail = product.buyingPrice + product.buyingPrice * RETAIL_RATE;

  return (
    <div className="max-w-4xl mx-auto p-4 font-['Barlow'] flex flex-col gap-4">

      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-blue-700 font-semibold"
      >
        <FiArrowLeft /> Back
      </button>

      {/* CARD */}
      <div className="bg-white border-2 border-slate-200 rounded-lg p-6 flex flex-col gap-4">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white">
            <FiPackage />
          </div>
          <div>
            <h1 className="font-['Barlow_Condensed'] text-xl font-bold text-blue-900 uppercase">
              {product.name}
            </h1>
            <p className="text-xs text-slate-400">{product.company}</p>
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

          <div className="border p-3 rounded">
            <p className="text-slate-400 text-xs">Buying Price</p>
            <p className="font-bold">{fmt(product.buyingPrice)}</p>
          </div>

          <div className="border p-3 rounded">
            <p className="text-slate-400 text-xs">Wholesale Price (+3%)</p>
            <p className="font-bold text-blue-700">{fmt(holcell)}</p>
          </div>

          <div className="border p-3 rounded">
            <p className="text-slate-400 text-xs">Retail Price (+5%)</p>
            <p className="font-bold text-orange-500">{fmt(retail)}</p>
          </div>

          <div className="border p-3 rounded">
            <p className="text-slate-400 text-xs">Stock Quantity</p>
            <p className="font-bold">{product.quantity}</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductDetails;