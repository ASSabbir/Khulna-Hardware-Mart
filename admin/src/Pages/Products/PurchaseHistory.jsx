// FILE: src/Pages/Products/PurchaseHistory.jsx (NEW)
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiFilter, FiCalendar, FiPackage, FiTruck } from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function PurchaseHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [productName, setProductName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/suppliers?limit=200`)
      .then((res) => setSuppliers(res.data.suppliers || []))
      .catch(() => setSuppliers([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (productName.trim()) params.append("productName", productName.trim());
      if (supplierId) params.append("supplierId", supplierId);
      const res = await axios.get(`http://localhost:5000/api/purchase-history?${params}`);
      setRecords(res.data.records);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [from, to, productName, supplierId, page]);

  useEffect(() => { setPage(1); }, [from, to, productName, supplierId]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const totalCost = records.reduce((s, r) => s + r.totalCost, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><FiTruck size={22}/></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase History</h1>
            <p className="text-gray-500">All stock purchases across suppliers</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center gap-3">
          <FiFilter className="text-gray-400" />
          <div className="flex items-center gap-2">
            <FiPackage className="text-gray-400" size={16}/>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Filter by product name..."
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48"
            />
          </div>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>{s.companyName}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" size={16}/>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <span className="text-gray-400">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          {(productName || supplierId || from || to) && (
            <button
              onClick={() => { setProductName(""); setSupplierId(""); setFrom(""); setTo(""); }}
              className="text-xs font-semibold text-red-500 hover:text-red-700"
            >
              Clear Filters
            </button>
          )}
          <div className="ml-auto bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-xl text-sm">
            Total Cost: {fmt(totalCost)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Product", "Supplier", "Buying Price", "Quantity", "Total Cost", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-sm font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400">Loading...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400">No purchase records found.</td></tr>
                ) : records.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-gray-900">{r.productName}</td>
                    <td className="px-5 py-3 text-gray-700">{r.supplierName}</td>
                    <td className="px-5 py-3 text-gray-700">{fmt(r.buyingPrice)}</td>
                    <td className="px-5 py-3 text-gray-700">{r.quantity}</td>
                    <td className="px-5 py-3 font-bold text-gray-900">{fmt(r.totalCost)}</td>
                    <td className="px-5 py-3 text-gray-500 text-sm">{fmtDate(r.purchaseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-gray-100">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}