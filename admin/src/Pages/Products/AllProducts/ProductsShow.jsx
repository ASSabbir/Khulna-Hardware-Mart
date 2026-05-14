import React, { useEffect, useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import {
  FiPackage,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiEye,
  FiSearch,
  FiLoader,
  FiX,
  FiFilter,
} from "react-icons/fi";

/* ─── Constants ─────────────────────────────────────────────────── */
const PAGE_SIZE = 30;
const DEBOUNCE_MS = 300;

/* ─── Helpers ───────────────────────────────────────────────────── */
const fmt = (n) =>
  "৳ " + Number(n || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const stockBadge = (qty) => {
  if (!qty || qty === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700 border border-red-300" };
  if (qty <= 10) return { label: `Low — ${qty}`, cls: "bg-yellow-100 text-yellow-700 border border-yellow-300" };
  return { label: qty, cls: "bg-green-100 text-green-700 border border-green-300" };
};

// Debounce utility
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

/* ══════════════════════════════════════════════════════════════════
   Component
══════════════════════════════════════════════════════════════════ */
const ProductsShow = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(search, DEBOUNCE_MS);
  const debouncedCategory = useDebounce(category, DEBOUNCE_MS);

  const categories = [
    "Hand Tools", "Power Tools", "Fasteners & Hardware", "Pipes & Fittings",
    "Electrical", "Paints & Coatings", "Safety Equipment", "Building Materials",
    "Adhesives & Sealants", "Measuring & Marking", "Other"
  ];

  /* ── Fetch products ─────────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        category: debouncedCategory,
      });

      const res = await axios.get(`https://khulna-hardware-mart.vercel.app/api/products?${params}`);
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
      setTotalProducts(res.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, debouncedCategory]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Page number buttons ─────────────────────────────────────── */
  const pageButtons = () => {
    const btns = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) btns.push(i);
    return btns;
  };

  const goTo = (n) => setPage(Math.min(Math.max(n, 1), totalPages));

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
              {totalProducts.toLocaleString()} product{totalProducts !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-72 focus-within:border-[#1D4ED8]">
          <FiSearch size={15} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, brand, SKU, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-[#1E293B] placeholder-slate-400 bg-transparent font-['Barlow',sans-serif]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-red-500 transition-colors">
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <FiFilter size={15} className="text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-[#1D4ED8] outline-none font-['Barlow',sans-serif]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {(search || category) && (
          <button
            onClick={() => { setSearch(""); setCategory(""); }}
            className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Active filters badge ── */}
      {(search || category) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Active filters:</span>
          {search && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
              Search: "{search}" <FiX size={10} className="cursor-pointer" onClick={() => setSearch("")} />
            </span>
          )}
          {category && (
            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
              Category: {category} <FiX size={10} className="cursor-pointer" onClick={() => setCategory("")} />
            </span>
          )}
        </div>
      )}

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
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Brand</th>
                  <th className="px-4 py-3 text-right font-semibold">Buying Price</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Holcell
                    <span className="ml-1 text-[#FACC15] font-bold">(+3%)</span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Retail
                    <span className="ml-1 text-[#FACC15] font-bold">(+5%)</span>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">Stock</th>
                  <th className="px-4 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400 font-medium">
                      No products found. Try adjusting your search.
                    </td>
                  </tr>
                ) : (
                  products.map((product, idx) => {
                    const holcell = product.holcellPrice || (product.buyingPrice * 1.03);
                    const retail = product.retailPrice || (product.buyingPrice * 1.05);
                    const stock = stockBadge(product.stock);
                    const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                    const isEven = idx % 2 === 1;

                    return (
                      <tr
                        key={product._id}
                        className={`border-b border-slate-100 transition-colors duration-100 hover:bg-blue-50 ${isEven ? "bg-slate-50" : "bg-white"}`}
                      >
                        <td className="px-4 py-3 text-slate-400 font-medium text-xs">{rowNum}</td>
                        <td className="px-4 py-3 font-semibold text-[#1E293B]">{product.name}</td>
                        <td className="px-4 py-3">
                          {product.category && (
                            <span className="inline-block bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded border border-purple-200">
                              {product.category}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-[#EFF6FF] text-[#1D4ED8] text-xs font-semibold px-2 py-0.5 rounded border border-[#BFDBFE]">
                            {product.brand || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">
                          {fmt(product.buyingPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1D4ED8] tabular-nums">
                          {fmt(holcell)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#F97316] tabular-nums">
                          {fmt(retail)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${stock.cls}`}>
                            {stock.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <NavLink
                            to={`/products/${product._id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-[#1E3A8A] text-[#1E3A8A] text-xs font-semibold bg-white hover:bg-[#1E3A8A] hover:text-white transition-colors duration-150"
                          >
                            <FiEye size={13} />
                            Detail
                          </NavLink>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination bar ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t-2 border-slate-100 bg-white">

              <span className="text-xs text-slate-500 font-medium">
                Showing{" "}
                <span className="font-bold text-[#1E3A8A]">
                  {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalProducts)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#1E3A8A]">{totalProducts.toLocaleString()}</span>{" "}
                products · Page {page} of {totalPages}
              </span>

              <div className="flex items-center gap-1">
                {/* First */}
                <button
                  onClick={() => goTo(1)}
                  disabled={page === 1}
                  className="p-2 rounded-md border-2 border-slate-200 text-slate-600 bg-white hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronsLeft size={14} />
                </button>

                {/* Prev */}
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border-2 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft size={14} /> Prev
                </button>

                {/* Page numbers */}
                {pageButtons().map((n) => (
                  <button
                    key={n}
                    onClick={() => goTo(n)}
                    className={`w-8 h-8 rounded-md border-2 text-xs font-bold transition-colors ${
                      n === page
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
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border-2 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <FiChevronRight size={14} />
                </button>

                {/* Last */}
                <button
                  onClick={() => goTo(totalPages)}
                  disabled={page === totalPages}
                  className="p-2 rounded-md border-2 border-slate-200 text-slate-600 bg-white hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronsRight size={14} />
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