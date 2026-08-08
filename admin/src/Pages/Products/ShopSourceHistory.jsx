// FILE: src/Pages/Products/ShopSourceHistory.jsx (NEW) — #22 shop-source history page UI

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiShoppingBag, FiCalendar, FiSearch, FiLoader } from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function ShopSourceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [shopFilter, setShopFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/custom-product-sources?page=${page}&limit=30`);
      setRecords(res.data.records || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = shopFilter.trim()
    ? records.filter((r) => r.shopName.toLowerCase().includes(shopFilter.trim().toLowerCase()))
    : records;

  const totalAmount = filtered.reduce((s, r) => s + (r.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white"><FiShoppingBag size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Product — Shop Source History</h1>
            <p className="text-gray-500">Which shop supplied which custom product, and when</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              placeholder="Filter by shop name..."
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="bg-amber-50 text-amber-700 font-bold px-4 py-2 rounded-xl text-sm">
            Total: {fmt(totalAmount)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {["Shop", "Product", "Quantity", "Unit Price", "Total", "Date"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400"><FiLoader className="animate-spin inline mr-2" />Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">No records found.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-semibold text-gray-900">{r.shopName}</td>
                  <td className="px-5 py-3 text-gray-700">{r.productName}</td>
                  <td className="px-5 py-3 text-gray-700">{r.quantity}</td>
                  <td className="px-5 py-3 text-gray-700">{fmt(r.unitPrice)}</td>
                  <td className="px-5 py-3 font-bold text-gray-900">{fmt(r.totalAmount)}</td>
                  <td className="px-5 py-3 text-gray-500 text-sm flex items-center gap-1.5"><FiCalendar size={12} />{fmtDate(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-gray-100">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}