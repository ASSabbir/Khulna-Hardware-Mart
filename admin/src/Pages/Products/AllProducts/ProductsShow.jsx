import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { NavLink } from "react-router-dom";
import {
  FiPackage,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiSearch,
  FiLoader,
} from "react-icons/fi";

/* ─── Constants ─────────────────────────────────────────────────── */
const PAGE_SIZE = 30;
const WHOLESELL_RATE = 0.03; // 3 %  over buying price
const RETAIL_RATE = 0.05; // 5 %  over buying price

/* ─── Helpers ───────────────────────────────────────────────────── */
const fmt = (n) =>
  "৳ " + Number(n).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const calcPrices = (buying) => ({
  holcell: buying + buying * WHOLESELL_RATE,
  retail: buying + buying * RETAIL_RATE,
});

const stockBadge = (qty) => {
  if (qty === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700 border border-red-300" };
  if (qty <= 10) return { label: `Low — ${qty}`, cls: "bg-yellow-100 text-yellow-700 border border-yellow-300" };
  return { label: qty, cls: "bg-green-100 text-green-700 border border-green-300" };
};

/* ══════════════════════════════════════════════════════════════════
   Component
══════════════════════════════════════════════════════════════════ */
const ProductsShow = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ── Fetch ─────────────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    axios
      .get("/JSON/Products.json")
      .then((res) => {
        setProducts(res.data);
        setFiltered(res.data); 
      })
      .catch(() => setError("Failed to load products. Make sure products.json is in /public."))
      .finally(() => setLoading(false));
  }, []);

  /* ── Search filter ─────────────────────────────────────────── */
  useEffect(() => {
    const q = search.toLowerCase().trim();
    const result = q
      ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q)
      )
      : products;
    setFiltered(result);
    setPage(1);
  }, [search, products]);

  /* ── Pagination ────────────────────────────────────────────── */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goTo = (n) => setPage(Math.min(Math.max(n, 1), totalPages));

  /* ── Page number buttons (show max 5 around current) ───────── */
  const pageButtons = () => {
    const btns = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) btns.push(i);
    return btns;
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-4 font-['Barlow',sans-serif]">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#F97316] rounded-lg flex items-center justify-center flex-shrink-0">
            <FiPackage size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-xl uppercase tracking-wide leading-tight">
              All Products
            </h1>
            <p className="text-slate-400 text-xs font-medium">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-lg px-3 py-2 w-72 focus-within:border-[#1D4ED8]">
          <FiSearch size={15} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search name or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-[#1E293B] placeholder-slate-400 bg-transparent font-['Barlow',sans-serif]"
          />
        </div>
      </div>

      {/* ── States: loading / error ── */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-[#1D4ED8]">
          <FiLoader size={22} className="animate-spin" />
          <span className="text-sm font-semibold">Loading products…</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border-2 border-red-300 rounded-lg px-5 py-4 text-red-700">
          <FiAlertTriangle size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && (
        <div className="bg-white border-2 border-slate-200 rounded-lg overflow-hidden">

          {/* Scrollable wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-sm">

              {/* Head */}
              <thead>
                <tr className="bg-[#1E3A8A] text-white text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold w-10">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Company</th>
                  <th className="px-4 py-3 text-right font-semibold">Buying Price</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Holcell Price
                    <span className="ml-1 text-[#FACC15] font-bold">(+3%)</span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Retail Price
                    <span className="ml-1 text-[#FACC15] font-bold">(+5%)</span>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">Stock</th>
                  <th className="px-4 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400 font-medium">
                      No products match your search.
                    </td>
                  </tr>
                )}

                {paginated.map((product, idx) => {
                  const { holcell, retail } = calcPrices(product.buyingPrice);
                  const stock = stockBadge(product.quantity);
                  const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                  const isEven = idx % 2 === 1;

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-slate-100 transition-colors duration-100 hover:bg-blue-50 ${isEven ? "bg-slate-50" : "bg-white"
                        }`}
                    >
                      {/* # */}
                      <td className="px-4 py-3 text-slate-400 font-medium text-xs">{rowNum}</td>

                      {/* Product Name */}
                      <td className="px-4 py-3 font-semibold text-[#1E293B]">
                        {product.name}
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3">
                        <span className="inline-block bg-[#EFF6FF] text-[#1D4ED8] text-xs font-semibold px-2 py-0.5 rounded border border-[#BFDBFE]">
                          {product.company}
                        </span>
                      </td>

                      {/* Buying Price */}
                      <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">
                        {fmt(product.buyingPrice)}
                      </td>

                      {/* Holcell Price */}
                      <td className="px-4 py-3 text-right font-semibold text-[#1D4ED8] tabular-nums">
                        {fmt(holcell)}
                      </td>

                      {/* Retail Price */}
                      <td className="px-4 py-3 text-right font-semibold text-[#F97316] tabular-nums">
                        {fmt(retail)}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${stock.cls}`}>
                          {stock.label}
                        </span>
                      </td>

                      {/* Detail Button */}
                      <td className="px-4 py-3 text-center">
                        <NavLink
                          to={`/products/${product.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-[#1E3A8A] text-[#1E3A8A] text-xs font-semibold bg-white hover:bg-[#1E3A8A] hover:text-white transition-colors duration-150"
                        >
                          <FiEye size={13} />
                          Detail
                        </NavLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination bar ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t-2 border-slate-100 bg-white">

              {/* Info */}
              <span className="text-xs text-slate-500 font-medium">
                Showing{" "}
                <span className="font-bold text-[#1E3A8A]">
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#1E3A8A]">{filtered.length}</span>{" "}
                products
              </span>

              {/* Buttons */}
              <div className="flex items-center gap-1">

                {/* Prev */}
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border-2 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <FiChevronLeft size={14} /> Prev
                </button>

                {/* Page numbers */}
                {pageButtons().map((n) => (
                  <button
                    key={n}
                    onClick={() => goTo(n)}
                    className={`w-8 h-8 rounded-md border-2 text-xs font-bold transition-colors duration-150 ${n === page
                        ? "bg-[#F97316] border-[#F97316] text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-[#F97316] hover:text-[#F97316]"
                      }`}
                  >
                    {n}
                  </button>
                ))}

                {/* Next */}
                <button
                  onClick={() => goTo(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border-2 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Next <FiChevronRight size={14} />
                </button>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsShow;