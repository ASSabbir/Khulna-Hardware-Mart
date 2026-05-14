import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FiSearch, FiShoppingCart, FiPackage, FiGrid, FiList,
  FiChevronLeft, FiChevronRight, FiStar, FiFilter,
  FiX, FiPhone, FiMapPin
} from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

function ProductCard({ product, onViewDetails }) {
  const [imageError, setImageError] = useState(false);

  const price = product.retailPrice || product.buyingPrice * 1.05 || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
        {!imageError && product.image ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <FiPackage size={48} className="text-gray-300" />
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Out of Stock
          </div>
        )}
        {product.stock > 0 && product.stock <= 10 && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Low Stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">{product.brand || product.company || "—"}</div>
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <FiStar
              key={star}
              size={14}
              className={star <= 4 ? "text-amber-400 fill-amber-400" : "text-gray-300"}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">(0)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-bold text-orange-600">{fmt(price)}</span>
            {product.buyingPrice && (
              <span className="text-xs text-gray-400 line-through ml-2">{fmt(product.buyingPrice)}</span>
            )}
          </div>
          <div className="text-xs text-gray-500">{product.stock || 0} in stock</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(product)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-sm transition"
          >
            View Details
          </button>
          
        </div>
      </div>
    </div>
  );
}

// Product Detail Modal
function ProductModal({ product, onClose }) {
  if (!product) return null;

  const price = product.retailPrice || product.buyingPrice * 1.05 || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition"
          >
            <FiX size={20} />
          </button>

          {/* Image */}
          <div className="h-64 bg-gray-100 flex items-center justify-center">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <FiPackage size={64} className="text-gray-300" />
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="text-sm text-gray-500 mb-1">{product.brand || product.company}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h2>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar key={star} size={18} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-sm text-gray-400 ml-2">(0 reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-orange-600">{fmt(price)}</span>
            {product.buyingPrice && (
              <span className="text-lg text-gray-400 line-through">{fmt(product.buyingPrice)}</span>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Brand</div>
              <div className="font-semibold text-gray-900">{product.brand || product.company || "—"}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">SKU</div>
              <div className="font-semibold text-gray-900">{product.sku || "—"}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Category</div>
              <div className="font-semibold text-gray-900">{product.category || "—"}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Stock</div>
              <div className={`font-semibold ${product.stock === 0 ? "text-red-600" : "text-green-600"}`}>
                {product.stock || 0} units
              </div>
            </div>
          </div>

          {product.description && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 text-sm">{product.description}</p>
            </div>
          )}

          {/* Contact */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
              <FiPhone size={16} />
              Interested? Contact Us
            </div>
            <div className="text-sm text-blue-600">
              02477-721990 · +880 1931-272839
            </div>
          </div>

          <div
            disabled={product.stock === 0}
            className={`w-full py-4 rounded-xl flex items-center justify-center font-bold text-lg transition ${
              product.stock === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-orange-500  text-white"
            }`}
          >
            <h1>{product.stock === 0 ? "Out of Stock" : "In Stock"}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}

// Debounce hook
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

export default function PublicProducts() {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        limit: 12,
        search: debouncedSearch,
      });
      if (category !== "all") params.append("category", category);
      if (sortBy) params.append("sort", sortBy);

      const res = await axios.get(`https://khulna-hardware-mart.vercel.app/api/products?${params}`);
      setProducts(res.data.products);
      setTotalProducts(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(totalProducts / 12);

  const categories = ["all", "Tools", "Plumbing", "Electrical", "Paints", "Safety", "Adhesives"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <FiPackage size={32} />
            <span className="text-blue-200 font-semibold">Khulna Hardware Mart</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Our Products</h1>
          <p className="text-blue-200 text-lg">Browse our complete catalog of hardware items</p>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="name">Name (A-Z)</option>
            <option value="-name">Name (Z-A)</option>
            <option value="retailPrice">Price (Low to High)</option>
            <option value="-retailPrice">Price (High to Low)</option>
            <option value="-createdAt">Newest First</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 ${viewMode === "grid" ? "bg-orange-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <FiGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 ${viewMode === "list" ? "bg-orange-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <FiList size={18} />
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500">
            Showing {((page - 1) * 12) + 1}-{Math.min(page * 12, totalProducts)} of {totalProducts} products
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* No Results */}
        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <FiPackage size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {products.map((product) => (
              viewMode === "grid" ? (
                <ProductCard
                  key={product._id}
                  product={product}
                  onViewDetails={setSelectedProduct}
                />
              ) : (
                <div
                  key={product._id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 hover:shadow-lg transition"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <FiPackage size={32} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">{product.brand || product.company}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-orange-600">
                        {fmt(product.retailPrice || product.buyingPrice * 1.05)}
                      </span>
                      <span className="text-sm text-gray-400">{product.stock || 0} in stock</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="self-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
                  >
                    View
                  </button>
                </div>
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-3 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FiChevronLeft size={18} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-xl font-semibold transition ${
                    page === pageNum
                      ? "bg-orange-500 text-white"
                      : "border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-3 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-6 text-center">
          <h3 className="font-bold text-blue-900 mb-2">Can't find what you're looking for?</h3>
          <p className="text-blue-700 mb-4">Contact us for custom orders and bulk purchases</p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="flex items-center gap-2 text-blue-700">
              <FiPhone size={16} /> 02477-721990
            </span>
            <span className="flex items-center gap-2 text-blue-700">
              <FiPhone size={16} /> +880 1931-272839
            </span>
            <span className="flex items-center gap-2 text-blue-700">
              <FiMapPin size={16} /> Khulna, Bangladesh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}