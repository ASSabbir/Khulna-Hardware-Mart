// FILE: src/Pages/Products/RestockList.jsx (NEW)
import { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch, FiPlus, FiTrash2, FiPrinter, FiPackage, FiAlertTriangle } from "react-icons/fi";
import { openPrintWindow } from "../../Print/printUtils";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

function buildPrintHTML(items) {
  const rows = items.map((i, idx) => `
    <tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${idx + 1}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i.product.name}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i.product.sku || "—"}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i.product.stock ?? 0}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td></tr>`).join("");
  return `<html><head><title>Restock List</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1E293B;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}</style>
    </head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Restock List — ${new Date().toLocaleDateString("en-GB")}</p>
    <table><thead><tr><th>#</th><th>Product</th><th>SKU</th><th>Current Stock</th><th>Restock Qty</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;
}

export default function RestockList() {
  const [manualItems, setManualItems] = useState([]);
  const [autoItems, setAutoItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [toast, setToast] = useState("");

  const fetchList = () => {
    setLoading(true);
    axios.get("http://localhost:5000/api/restock-list")
      .then((res) => { setManualItems(res.data.manualItems || []); setAutoItems(res.data.autoItems || []); })
      .catch(() => { setManualItems([]); setAutoItems([]); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchList(); }, []);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      axios.get(`http://localhost:5000/api/products?search=${encodeURIComponent(search)}&limit=10`)
        .then((res) => setResults(res.data.products || []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const addToList = async (product) => {
    try {
      await axios.post("http://localhost:5000/api/restock-list", { productId: product._id, quantity: 10 });
      showToast(`${product.name} added.`);
      setSearch(""); setResults([]);
      fetchList();
    } catch (err) { showToast(err.response?.data?.message || "Failed to add."); }
  };

  const updateQty = async (id, qty) => {
    setManualItems((prev) => prev.map((i) => (i._id === id ? { ...i, quantity: qty } : i)));
    try { await axios.put(`http://localhost:5000/api/restock-list/${id}`, { quantity: qty }); } catch {}
  };

  const removeItem = async (id) => {
    try { await axios.delete(`http://localhost:5000/api/restock-list/${id}`); fetchList(); } catch {}
  };

  const addAutoToManual = async (item) => {
    try { await axios.post("http://localhost:5000/api/restock-list", { productId: item.productId, quantity: item.quantity }); fetchList(); } catch {}
  };

  const printList = () => {
    const all = [...autoItems, ...manualItems];
    if (all.length === 0) { showToast("List is empty."); return; }
    openPrintWindow(buildPrintHTML(all));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {toast && <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm">{toast}</div>}
      <div className="max-w-300 mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Restock List</h1>
            <p className="text-slate-500 text-sm mt-1">Low stock auto-listed. Add others manually and print.</p>
          </div>
          <button onClick={printList} className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#16296B] text-white font-bold px-5 py-2.5 rounded-xl">
            <FiPrinter size={16} /> Print List
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 relative">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search a product to add to the restock list..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]" />
          </div>
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 left-4 right-4 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
              {results.map((p) => (
                <button key={p._id} onClick={() => addToList(p)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                  <span className="font-semibold text-slate-800">{p.name}</span>
                  <span className="text-xs text-slate-400">Stock: {p.stock ?? 0}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-center text-slate-400 py-10">Loading...</p>
        ) : (
          <>
            <div className="bg-white border border-red-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
                <FiAlertTriangle className="text-red-500" size={16} />
                <h2 className="font-bold text-red-700 text-sm">Auto Low Stock ({autoItems.length})</h2>
              </div>
              {autoItems.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No low stock products.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {autoItems.map((i) => (
                    <div key={i.productId} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FiPackage className="text-slate-300 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{i.product.name}</p>
                          <p className="text-xs text-slate-400">Current stock: {i.product.stock ?? 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-red-600">Suggest: {i.quantity}</span>
                        <button onClick={() => addAutoToManual(i)} className="text-xs font-bold text-[#1E3A8A] hover:underline">Move to List</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-800 text-sm">Manually Added ({manualItems.length})</h2>
              </div>
              {manualItems.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">Nothing added yet. Search above to add products.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {manualItems.map((i) => (
                    <div key={i._id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FiPackage className="text-slate-300 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{i.product.name}</p>
                          <p className="text-xs text-slate-400">Current stock: {i.product.stock ?? 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <input type="number" min="1" value={i.quantity} onChange={(e) => updateQty(i._id, Number(e.target.value) || 1)}
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center" />
                        <button onClick={() => removeItem(i._id)} className="text-slate-300 hover:text-red-500"><FiTrash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}