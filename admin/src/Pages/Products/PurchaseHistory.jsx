// FILE: src/Pages/Products/PurchaseHistory.jsx (FULL REPLACEMENT) — grouped by date+supplier, eye + print
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiFilter, FiCalendar, FiTruck, FiEye, FiPrinter, FiX } from "react-icons/fi";
import { openPrintWindow } from "../../Print/printUtils";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function buildGroupHTML(g) {
  const rows = g.items.map((it, i) => `
    <tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${i + 1}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.productName}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.buyingPrice)}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.totalCost)}</td></tr>`).join("");
  const payRows = (g.payments || []).map((p) => `${p.method === "mobile" ? p.provider : p.method}: ${fmt(p.amount)}`).join(" · ");
  return `<html><head><title>Purchase — ${g.supplierName} (${fmtDate(g.date)})</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1E293B;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}</style>
    </head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Purchase Record — ${fmtDate(g.date)}</p>
    <p><strong>Supplier:</strong> ${g.supplierName}</p>
    <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="text-align:right;margin-top:12px;">
      <strong style="font-size:18px;color:#F97316;">Total Cost: ${fmt(g.totalCost)}</strong><br/>
      Paid: ${fmt(g.paidThatDay)}<br/>
      ${g.duePortion > 0 ? `<strong style="color:#ef4444;">Due: ${fmt(g.duePortion)}</strong>` : `<strong style="color:#16a34a;">Fully Paid</strong>`}
    </p>
    ${payRows ? `<p style="color:#64748b;font-size:13px;">Payment: ${payRows}</p>` : ""}
    </body></html>`;
}

function GroupDetailModal({ group, onClose }) {
  if (!group) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><h2 className="text-lg font-bold text-gray-900">{group.supplierName}</h2><p className="text-sm text-gray-500">{fmtDate(group.date)}</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => openPrintWindow(buildGroupHTML(group))} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"><FiPrinter size={14} /> Print</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={18} /></button>
          </div>
        </div>
        <div className="p-6">
          <table className="w-full text-sm border-collapse mb-4">
            <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500"><th className="text-left px-2 py-2">Product</th><th className="text-center px-2 py-2">Qty</th><th className="text-right px-2 py-2">Price</th><th className="text-right px-2 py-2">Total</th></tr></thead>
            <tbody>{group.items.map((it, i) => <tr key={i} className="border-b border-gray-100"><td className="px-2 py-2">{it.productName}</td><td className="px-2 py-2 text-center">{it.quantity}</td><td className="px-2 py-2 text-right">{fmt(it.buyingPrice)}</td><td className="px-2 py-2 text-right font-semibold">{fmt(it.totalCost)}</td></tr>)}</tbody>
          </table>
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex justify-between w-56"><span>Total Cost</span><span className="font-bold">{fmt(group.totalCost)}</span></div>
            <div className="flex justify-between w-56 text-green-600"><span>Paid</span><span>{fmt(group.paidThatDay)}</span></div>
            <div className={`flex justify-between w-56 font-bold ${group.duePortion > 0 ? "text-red-600" : "text-green-600"}`}><span>{group.duePortion > 0 ? "Due" : "Status"}</span><span>{group.duePortion > 0 ? fmt(group.duePortion) : "Fully Paid"}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseHistory() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailGroup, setDetailGroup] = useState(null);

  useEffect(() => { axios.get("http://localhost:5000/api/suppliers?limit=200").then((res) => setSuppliers(res.data.suppliers || [])).catch(() => setSuppliers([])); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (supplierId) params.append("supplierId", supplierId);
      const res = await axios.get(`http://localhost:5000/api/purchase-history/grouped?${params}`);
      setGroups(res.data.groups);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [from, to, supplierId, page]);

  useEffect(() => { setPage(1); }, [from, to, supplierId]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const totalCost = groups.reduce((s, g) => s + g.totalCost, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><FiTruck size={22} /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Purchase History</h1><p className="text-gray-500">Grouped by date and supplier</p></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center gap-3">
          <FiFilter className="text-gray-400" />
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">All Suppliers</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.companyName}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" size={16} />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <span className="text-gray-400">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          {(supplierId || from || to) && <button onClick={() => { setSupplierId(""); setFrom(""); setTo(""); }} className="text-xs font-semibold text-red-500 hover:text-red-700">Clear Filters</button>}
          <div className="ml-auto bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-xl text-sm">Total Cost: {fmt(totalCost)}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-100">{["Date", "Supplier", "Products", "Total Cost", "Paid", "Due", ""].map((h) => <th key={h} className="text-left px-5 py-3 text-sm font-semibold text-gray-500">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">Loading...</td></tr>
              ) : groups.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">No purchase records found.</td></tr>
              ) : groups.map((g, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700 text-sm">{fmtDate(g.date)}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{g.supplierName}</td>
                  <td className="px-5 py-3 text-gray-700 text-sm">{g.items.length} item{g.items.length !== 1 ? "s" : ""} · {g.totalQty} units</td>
                  <td className="px-5 py-3 font-bold text-gray-900">{fmt(g.totalCost)}</td>
                  <td className="px-5 py-3 text-green-600 font-semibold">{fmt(g.paidThatDay)}</td>
                  <td className={`px-5 py-3 font-bold ${g.duePortion > 0 ? "text-red-600" : "text-green-600"}`}>{g.duePortion > 0 ? fmt(g.duePortion) : "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setDetailGroup(g)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-500"><FiEye size={14} /></button>
                      <button onClick={() => openPrintWindow(buildGroupHTML(g))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"><FiPrinter size={14} /></button>
                    </div>
                  </td>
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
      <GroupDetailModal group={detailGroup} onClose={() => setDetailGroup(null)} />
    </div>
  );
}