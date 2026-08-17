// FILE: src/Pages/Products/ShopSale.jsx (NEW) — sell OUR stock to another shop
import { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch, FiPlus, FiTrash2, FiSave, FiPrinter, FiEdit2, FiDollarSign, FiX } from "react-icons/fi";
import { openPrintWindow } from "../../Print/printUtils";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });

function buildSalePrintHTML(sale) {
  const rows = sale.items.map((it, i) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${i + 1}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.name}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.price)}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.total)}</td></tr>`).join("");
  return `<html><head><title>${sale.invoiceNumber}</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1E293B;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}</style>
    </head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Shop Sale — ${sale.invoiceNumber} — ${sale.saleDate}</p>
    <p><strong>Shop:</strong> ${sale.shopName}</p>
    <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="text-align:right;margin-top:12px;"><strong>Grand Total: ${fmt(sale.grandTotal)}</strong><br/>
    Paid: ${fmt(sale.paidAmount)}<br/>
    ${sale.dueAmount > 0 ? `<strong style="color:#ef4444;">Due: ${fmt(sale.dueAmount)}</strong>` : `<strong style="color:#16a34a;">Fully Paid</strong>`}</p>
    </body></html>`;
}

export default function ShopSale() {
  const [shopName, setShopName] = useState("");
  const [shopSuggestions, setShopSuggestions] = useState([]);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [items, setItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [editSale, setEditSale] = useState(null);
  const [editPrices, setEditPrices] = useState({});
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const fetchSales = () => {
    setLoadingSales(true);
    axios.get("http://localhost:5000/api/shop-sales?limit=50")
      .then((res) => setSales(res.data.sales || []))
      .catch(() => setSales([]))
      .finally(() => setLoadingSales(false));
  };
  useEffect(() => { fetchSales(); }, []);

  useEffect(() => {
    if (!shopName.trim()) { setShopSuggestions([]); return; }
    const t = setTimeout(() => {
      axios.get(`http://localhost:5000/api/shop-names?search=${encodeURIComponent(shopName)}`)
        .then((res) => setShopSuggestions(res.data.shopNames || []))
        .catch(() => setShopSuggestions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [shopName]);

  useEffect(() => {
    if (!productQuery.trim()) { setProductResults([]); return; }
    const t = setTimeout(() => {
      axios.get(`http://localhost:5000/api/products?search=${encodeURIComponent(productQuery)}&limit=10`)
        .then((res) => setProductResults(res.data.products || []))
        .catch(() => setProductResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [productQuery]);

  const addItem = (p) => {
    if (items.some((i) => i.productId === p._id)) { showToast("error", "Already added."); return; }
    setItems((prev) => [...prev, { productId: p._id, name: p.name, unit: p.unit || "pcs", price: p.buyingPrice || 0, qty: 1, maxQty: p.stock || 0 }]);
    setProductQuery(""); setProductResults([]);
  };
  const updateItem = (id, field, value) => setItems((prev) => prev.map((i) => (i.productId === id ? { ...i, [field]: value } : i)));
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.productId !== id));

  const grandTotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);

  const submitSale = async () => {
    if (!shopName.trim()) { showToast("error", "Enter shop name."); return; }
    if (items.length === 0) { showToast("error", "Add at least one product."); return; }
    for (const it of items) {
      if (Number(it.qty) > Number(it.maxQty)) { showToast("error", `${it.name}: quantity exceeds stock (max ${it.maxQty}).`); return; }
    }
    setSaving(true);
    try {
      await axios.post("http://localhost:5000/api/shop-sales", {
        shopName: shopName.trim(), saleDate,
        items: items.map((i) => ({ productId: i.productId, name: i.name, unit: i.unit, qty: Number(i.qty), price: Number(i.price) })),
        paidAmount: Number(paidAmount) || 0,
      });
      showToast("success", "Sale recorded.");
      setShopName(""); setItems([]); setPaidAmount("");
      fetchSales();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (sale) => {
    setEditSale(sale);
    const p = {};
    sale.items.forEach((it, idx) => (p[idx] = it.price));
    setEditPrices(p);
  };
  const saveEdit = async () => {
    try {
      const newItems = editSale.items.map((it, idx) => ({ price: Number(editPrices[idx]) }));
      const res = await axios.put(`http://localhost:5000/api/shop-sales/${editSale._id}`, { items: newItems });
      showToast("success", "Prices updated.");
      setEditSale(null);
      fetchSales();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update.");
    }
  };

  const submitPayment = async () => {
    const amt = Number(payAmount);
    if (!Number.isFinite(amt) || amt <= 0) { showToast("error", "Enter valid amount."); return; }
    try {
      await axios.post(`http://localhost:5000/api/shop-sales/${payModal._id}/collect-due`, { amount: amt, method: "cash" });
      showToast("success", "Payment recorded.");
      setPayModal(null); setPayAmount("");
      fetchSales();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}
      <div className="max-w-300 mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Sell to Shop</h1>
          <p className="text-slate-500 text-sm mt-1">Sell products from our stock to another shop</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Shop Name</label>
              <input list="shop-sale-names" value={shopName} onChange={(e) => setShopName(e.target.value)}
                placeholder="Type or select shop name" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
              <datalist id="shop-sale-names">
                {shopSuggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sale Date</label>
              <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Add Product</label>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search product..."
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            {productResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                {productResults.map((p) => (
                  <button key={p._id} onClick={() => addItem(p)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="text-xs text-slate-400">Stock: {p.stock ?? 0}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase text-slate-400">
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-center px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-right px-3 py-2">Total</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.productId} className="border-t border-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-800">{it.name}<p className="text-[10px] text-slate-400">Max: {it.maxQty}</p></td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" min="1" max={it.maxQty} value={it.qty} onChange={(e) => updateItem(it.productId, "qty", e.target.value)}
                          className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-center" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" min="0" step="0.01" value={it.price} onChange={(e) => updateItem(it.productId, "price", e.target.value)}
                          className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-right" />
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[#F97316]">{fmt((Number(it.price) || 0) * (Number(it.qty) || 0))}</td>
                      <td className="px-3 py-2"><button onClick={() => removeItem(it.productId)} className="text-slate-300 hover:text-red-500"><FiTrash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Paid Now</label>
              <input type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
                className="w-40 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="0.00" />
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold">Grand Total</p>
              <p className="text-2xl font-extrabold text-slate-900">{fmt(grandTotal)}</p>
            </div>
          </div>

          <button onClick={submitSale} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-[#16296B] text-white font-bold py-3 rounded-xl disabled:opacity-50">
            <FiSave size={16} /> {saving ? "Saving..." : "Save Sale"}
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800 text-sm">Recent Shop Sales</h2>
          </div>
          {loadingSales ? (
            <p className="text-center text-slate-400 py-8 text-sm">Loading...</p>
          ) : sales.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No sales yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {sales.map((s) => (
                <div key={s._id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.invoiceNumber} — {s.shopName}</p>
                    <p className="text-xs text-slate-400">{s.saleDate} · {s.items.length} items</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">{fmt(s.grandTotal)}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {s.paymentStatus === "paid" ? "Paid" : `Due ${fmt(s.dueAmount)}`}
                    </span>
                    <button onClick={() => openEdit(s)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg" title="Edit prices"><FiEdit2 size={14} /></button>
                    {s.paymentStatus === "due" && (
                      <button onClick={() => setPayModal(s)} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg" title="Collect payment"><FiDollarSign size={14} /></button>
                    )}
                    <button onClick={() => openPrintWindow(buildSalePrintHTML(s))} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg" title="Print"><FiPrinter size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editSale && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Edit Prices — {editSale.invoiceNumber}</h3>
              <button onClick={() => setEditSale(null)}><FiX size={18} /></button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {editSale.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700">{it.name} × {it.qty}</span>
                  <input type="number" min="0" step="0.01" value={editPrices[idx] ?? it.price}
                    onChange={(e) => setEditPrices((p) => ({ ...p, [idx]: e.target.value }))}
                    className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-right text-sm" />
                </div>
              ))}
            </div>
            <button onClick={saveEdit} className="w-full mt-5 bg-[#1E3A8A] hover:bg-[#16296B] text-white font-bold py-2.5 rounded-xl">Save Changes</button>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Collect Payment — {payModal.invoiceNumber}</h3>
            <p className="text-sm text-slate-500 mb-3">Due: {fmt(payModal.dueAmount)}</p>
            <input type="number" min="0" max={payModal.dueAmount} step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-4" placeholder="Amount" />
            <div className="flex gap-3">
              <button onClick={() => setPayModal(null)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl">Cancel</button>
              <button onClick={submitPayment} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}