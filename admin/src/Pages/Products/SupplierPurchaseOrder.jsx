// FILE: src/Pages/Products/SupplierPurchaseOrder.jsx (NEW) — dedicated single-supplier purchase page, printable "invoice to supplier"
import { useState, useEffect } from "react";
import axios from "axios";
import { FiTruck, FiSearch, FiPlus, FiX, FiPrinter, FiCheckCircle, FiAlertTriangle, FiLoader } from "react-icons/fi";
import { openPrintWindow } from "../../Print/printUtils";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const emptyPayment = () => ({ id: Date.now() + Math.random(), method: "cash", amount: "", provider: "bKash" });
const emptyItem = () => ({ id: Date.now() + Math.random(), productId: "", name: "", buyingPrice: "", quantity: "" });

function buildOrderHTML({ supplierName, items, totalCost, credit, paidSum, dueRemaining, payments }) {
  const rows = items.map((it, i) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${i + 1}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.productName}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.buyingPrice)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.totalCost)}</td></tr>`).join("");
  const payRows = (payments || []).filter((p) => Number(p.amount) > 0).map((p) => `${p.method === "mobile" ? p.provider : p.method}: ${fmt(p.amount)}`).join(" · ");
  return `<html><head><title>Purchase Order — ${supplierName}</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1E293B;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}</style>
    </head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Purchase Order — ${new Date().toLocaleDateString("en-GB")}</p>
    <p><strong>Supplier:</strong> ${supplierName}</p>
    <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="text-align:right;margin-top:12px;">
      Subtotal: ${fmt(totalCost)}<br/>
      ${credit > 0 ? `Receivable Adjusted: -${fmt(credit)}<br/>` : ""}
      <strong style="font-size:18px;color:#F97316;">Amount Payable: ${fmt(totalCost - credit)}</strong><br/>
      Paid: ${fmt(paidSum)}<br/>
      ${dueRemaining > 0 ? `<strong style="color:#ef4444;">Due: ${fmt(dueRemaining)}</strong>` : `<strong style="color:#16a34a;">Fully Paid</strong>`}
    </p>
    ${payRows ? `<p style="color:#64748b;font-size:13px;">Payment: ${payRows}</p>` : ""}
    </body></html>`;
}

export default function SupplierPurchaseOrder() {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierBalance, setSupplierBalance] = useState(null);
  const [applyCredit, setApplyCredit] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([emptyPayment()]);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => { axios.get("http://localhost:5000/api/suppliers?limit=200").then((res) => setSuppliers(res.data.suppliers || [])).catch(() => setSuppliers([])); }, []);

  useEffect(() => {
    if (!supplierId) { setSupplierBalance(null); setApplyCredit(false); return; }
    axios.get(`http://localhost:5000/api/supplier-payments/${supplierId}`).then((res) => setSupplierBalance(res.data.balance)).catch(() => setSupplierBalance(null));
  }, [supplierId]);

  useEffect(() => {
    if (!productQuery.trim()) { setProductResults([]); return; }
    const t = setTimeout(() => {
      axios.get(`http://localhost:5000/api/products?search=${encodeURIComponent(productQuery.trim())}&limit=10`)
        .then((res) => setProductResults(res.data.products || []))
        .catch(() => setProductResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery]);

  const addProductItem = (p) => {
    if (items.some((it) => it.productId === p._id)) { setToast({ type: "error", msg: "Already added." }); setTimeout(() => setToast(null), 2500); return; }
    setItems((prev) => [...prev, { id: p._id, productId: p._id, name: p.name, buyingPrice: p.buyingPrice || "", quantity: "" }]);
    setProductQuery(""); setProductResults([]);
  };
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const updateItem = (id, field, value) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));

  const totalCost = items.reduce((s, it) => s + (Number(it.buyingPrice) || 0) * (Number(it.quantity) || 0), 0);
  const appliedCredit = applyCredit ? Math.min(supplierBalance?.receivableAmount || 0, totalCost) : 0;
  const costAfterCredit = Math.max(0, totalCost - appliedCredit);
  const paidSum = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const dueRemaining = Math.max(0, costAfterCredit - paidSum);

  const addPayment = () => setPayments((p) => [...p, emptyPayment()]);
  const removePayment = (id) => setPayments((p) => (p.length > 1 ? p.filter((x) => x.id !== id) : p));
  const updatePayment = (id, field, value) => setPayments((p) => p.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const submit = async () => {
    if (!supplierId) { showToast("error", "Select a supplier."); return; }
    if (items.length === 0) { showToast("error", "Add at least one product."); return; }
    for (const it of items) {
      if (!Number(it.buyingPrice) || Number(it.buyingPrice) < 0) { showToast("error", `Enter buying price for ${it.name}.`); return; }
      if (!Number(it.quantity) || Number(it.quantity) <= 0) { showToast("error", `Enter quantity for ${it.name}.`); return; }
    }
    setSaving(true);
    try {
      const res = await axios.post("http://localhost:5000/api/supplier-purchase-orders", {
        supplierId,
        items: items.map((it) => ({ productId: it.productId, buyingPrice: Number(it.buyingPrice), quantity: Number(it.quantity) })),
        payments: payments.filter((p) => Number(p.amount) > 0).map((p) => ({ method: p.method, amount: Number(p.amount), provider: p.method === "mobile" ? p.provider : undefined })),
        creditApplied: appliedCredit > 0 ? appliedCredit : undefined,
      });
      setLastResult(res.data);
      showToast("success", "Purchase order recorded successfully.");
      setItems([]); setPayments([emptyPayment()]); setApplyCredit(false);
      axios.get(`http://localhost:5000/api/supplier-payments/${supplierId}`).then((r) => setSupplierBalance(r.data.balance)).catch(() => {});
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save purchase order.");
    } finally {
      setSaving(false);
    }
  };

  const printOrder = () => {
    if (!lastResult) return;
    openPrintWindow(buildOrderHTML({
      supplierName: lastResult.supplierName, items: lastResult.purchasedItems, totalCost: lastResult.totalCost,
      credit: lastResult.credit, paidSum: lastResult.paidSum, dueRemaining: lastResult.dueRemaining, payments,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          {toast.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />} {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><FiTruck size={22} /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Supplier Purchase Order</h1><p className="text-gray-500">Buy multiple products from a single supplier in one go</p></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Supplier</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select Supplier —</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.companyName}</option>)}
            </select>
          </div>

          {supplierBalance && (supplierBalance.payableAmount > 0 || supplierBalance.receivableAmount > 0) && (
            <div className={`rounded-xl p-3 text-sm border ${supplierBalance.payableAmount > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              {supplierBalance.payableAmount > 0 ? (
                <p className="font-semibold text-red-700">Existing Due to Supplier: {fmt(supplierBalance.payableAmount)}</p>
              ) : (
                <>
                  <p className="font-semibold text-green-700">Existing Receivable from Supplier: {fmt(supplierBalance.receivableAmount)}</p>
                  <label className="flex items-center gap-2 mt-2 text-xs font-bold text-green-800 cursor-pointer select-none">
                    <input type="checkbox" checked={applyCredit} onChange={(e) => setApplyCredit(e.target.checked)} className="w-4 h-4 accent-green-600" />
                    Adjust against this purchase
                  </label>
                  {applyCredit && <p className="text-xs text-green-700 mt-1">Auto: {fmt(appliedCredit)} applied · {fmt(Math.max(0, supplierBalance.receivableAmount - appliedCredit))} remaining</p>}
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Add Products</label>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search product by name..." className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {productResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {productResults.map((p) => (
                    <button key={p._id} onClick={() => addProductItem(p)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-50 text-left">
                      <span className="font-semibold text-gray-800">{p.name}</span>
                      <span className="text-xs text-gray-400">Stock: {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <span className="flex-1 font-semibold text-sm text-gray-800 min-w-[140px]">{it.name}</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white"><span className="px-2 text-xs text-gray-400">৳</span><input type="number" min="0" step="0.01" placeholder="Buying Price" value={it.buyingPrice} onChange={(e) => updateItem(it.id, "buyingPrice", e.target.value)} className="w-24 px-1 py-2 text-xs font-semibold outline-none" /></div>
                  <input type="number" min="1" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(it.id, "quantity", e.target.value)} className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-xs font-semibold outline-none" />
                  <span className="text-sm font-bold text-orange-600 w-24 text-right">{fmt((Number(it.buyingPrice) || 0) * (Number(it.quantity) || 0))}</span>
                  <button onClick={() => removeItem(it.id)} className="text-gray-300 hover:text-red-500"><FiX size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex justify-between text-sm font-bold text-blue-800 mb-1"><span>Subtotal</span><span>{fmt(totalCost)}</span></div>
              {appliedCredit > 0 && <div className="flex justify-between text-xs font-semibold text-green-700 mb-1"><span>Receivable Adjusted</span><span>-{fmt(appliedCredit)}</span></div>}
              <div className="flex justify-between text-sm font-bold text-blue-900 mb-3 pt-1 border-t border-blue-200"><span>Amount Payable</span><span>{fmt(costAfterCredit)}</span></div>

              <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1.5">Payment Method(s)</label>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 bg-white border border-blue-200 rounded-lg p-2">
                    <select value={p.method} onChange={(e) => updatePayment(p.id, "method", e.target.value)} className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                      <option value="cash">Cash</option><option value="mobile">Mobile Banking</option><option value="bank">Bank</option>
                    </select>
                    {p.method === "mobile" && (
                      <select value={p.provider} onChange={(e) => updatePayment(p.id, "provider", e.target.value)} className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                        {MOBILE_PROVIDERS.map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                      </select>
                    )}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden"><span className="px-2 text-xs text-gray-400">৳</span><input type="number" min="0" step="0.01" value={p.amount} onChange={(e) => updatePayment(p.id, "amount", e.target.value)} placeholder="0.00" className="w-24 px-1 py-1.5 text-xs font-semibold outline-none" /></div>
                    <button onClick={() => removePayment(p.id)} className="ml-auto text-gray-300 hover:text-red-500"><FiX size={14} /></button>
                  </div>
                ))}
              </div>
              <button onClick={addPayment} className="mt-2 w-full text-xs font-bold text-blue-700 border border-dashed border-blue-300 rounded-lg py-1.5 hover:bg-blue-100 flex items-center justify-center gap-1"><FiPlus size={12} /> Add Payment Method</button>
              <div className="flex justify-between text-xs font-bold mt-3 pt-2 border-t border-blue-200">
                <span className="text-slate-600">Paid Now: {fmt(paidSum)}</span>
                <span className={dueRemaining > 0 ? "text-red-600" : "text-green-600"}>Due to Supplier: {fmt(dueRemaining)}</span>
              </div>
            </div>
          )}

          <button onClick={submit} disabled={saving || items.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <FiLoader className="animate-spin" size={18} /> : <FiCheckCircle size={18} />} Save Purchase Order
          </button>

          {lastResult && (
            <button onClick={printOrder} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <FiPrinter size={18} /> Print Last Purchase Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}