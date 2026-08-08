// FILE: src/Components/RestockModal.jsx (FULL REPLACEMENT) — shows supplier's existing payable/receivable, applies receivable credit against this purchase
import { useState, useEffect } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const emptyPayment = () => ({ id: Date.now() + Math.random(), method: "cash", amount: "", provider: "bKash" });

export default function RestockModal({ product, onClose, onDone }) {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [payments, setPayments] = useState([emptyPayment()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // #receivable — existing supplier balance (payable/receivable before this purchase)
  const [supplierBalance, setSupplierBalance] = useState(null);
  const [applyCredit, setApplyCredit] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:5000/api/suppliers?limit=200").then((res) => setSuppliers(res.data.suppliers || [])).catch(() => setSuppliers([]));
  }, []);

  useEffect(() => {
    if (!supplierId || isOther) { setSupplierBalance(null); setApplyCredit(false); return; }
    axios.get(`http://localhost:5000/api/supplier-payments/${supplierId}`)
      .then((res) => setSupplierBalance(res.data.balance))
      .catch(() => setSupplierBalance(null));
  }, [supplierId, isOther]);

  if (!product) return null;

  const handleSelect = (val) => {
    if (val === "__other__") { setIsOther(true); setSupplierId(""); }
    else { setIsOther(false); setSupplierId(val); }
  };

  const totalCost = (Number(buyingPrice) || 0) * (Number(quantity) || 0);
  // #adjust — always auto: min(existing receivable, this purchase's total cost). No manual override.
  const appliedCredit = applyCredit ? Math.min(supplierBalance?.receivableAmount || 0, totalCost) : 0;
  const remainingReceivable = Math.max(0, (supplierBalance?.receivableAmount || 0) - appliedCredit);
  const costAfterCredit = Math.max(0, totalCost - appliedCredit);
  const paidSum = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const due = Math.max(0, costAfterCredit - paidSum);

  const addPayment = () => setPayments((p) => [...p, emptyPayment()]);
  const removePayment = (id) => setPayments((p) => (p.length > 1 ? p.filter((x) => x.id !== id) : p));
  const updatePayment = (id, field, value) => setPayments((p) => p.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const handleSubmit = async () => {
    setError("");
    const qty = Number(quantity);
    const price = Number(buyingPrice);
    if (!Number.isFinite(qty) || qty <= 0) { setError("Enter a valid quantity."); return; }
    if (!Number.isFinite(price) || price < 0) { setError("Enter a valid buying price."); return; }
    if (!supplierId && !otherName.trim()) { setError("Select a supplier or enter a new supplier name."); return; }

    setSaving(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/products/${product._id}/restock`, {
        supplierId: isOther ? undefined : supplierId,
        supplierName: isOther ? otherName.trim() : undefined,
        buyingPrice: price, quantity: qty, purchaseDate,
        payments: payments.filter((p) => (Number(p.amount) || 0) > 0).map((p) => ({ method: p.method, amount: Number(p.amount), provider: p.method === "mobile" ? p.provider : undefined })),
        creditApplied: appliedCredit > 0 ? appliedCredit : undefined,
      });
      onDone(res.data.product || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to restock product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#1E3A8A]">Restock Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><FiX size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
            <p className="font-semibold text-[#1E293B]">{product.name}</p>
            <p className="text-slate-400 text-xs">Current stock: {product.stock || 0} {product.unit || "pcs"}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">Supplier</label>
            <select value={isOther ? "__other__" : supplierId} onChange={(e) => handleSelect(e.target.value)} className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none bg-white">
              <option value="">— Select Supplier —</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.companyName}</option>)}
              <option value="__other__">Others</option>
            </select>
          </div>
          {isOther && <input value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="New supplier name" className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none" />}

          {/* #receivable — supplier's existing outstanding balance before this purchase */}
          {supplierBalance && (supplierBalance.payableAmount > 0 || supplierBalance.receivableAmount > 0) && (
            <div className={`rounded-xl p-3 text-sm border ${supplierBalance.payableAmount > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              {supplierBalance.payableAmount > 0 ? (
                <p className="font-semibold text-red-700">Existing Due to Supplier: {fmt(supplierBalance.payableAmount)}</p>
              ) : (
                <>
                  <p className="font-semibold text-green-700">Existing Receivable from Supplier: {fmt(supplierBalance.receivableAmount)}</p>
                  <label className="flex items-center gap-2 mt-2 text-xs font-bold text-green-800 cursor-pointer select-none">
                    <input type="checkbox" checked={applyCredit} onChange={(e) => setApplyCredit(e.target.checked)} className="w-4 h-4 accent-green-600" />
                    Adjust receivable against this purchase
                  </label>
                  {applyCredit && (
                    <p className="text-xs text-green-700 mt-1.5">
                      {fmt(supplierBalance.receivableAmount)} − {fmt(appliedCredit)} (this purchase) = <strong>{fmt(remainingReceivable)} remaining receivable</strong>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">Buying Price</label>
              <input type="number" min="0" step="0.01" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} placeholder="0.00" className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">Quantity</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">Purchase Date</label>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full text-sm font-semibold border-2 border-slate-200 rounded-lg px-3 py-2.5 outline-none" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex justify-between text-sm font-bold text-blue-800 mb-1"><span>Total Cost</span><span>{fmt(totalCost)}</span></div>
            {appliedCredit > 0 && (
              <div className="flex justify-between text-xs font-semibold text-green-700 mb-1"><span>Credit Applied</span><span>-{fmt(appliedCredit)}</span></div>
            )}
            {appliedCredit > 0 && (
              <div className="flex justify-between text-sm font-bold text-blue-800 mb-2 pt-1 border-t border-blue-200"><span>Amount to Pay</span><span>{fmt(costAfterCredit)}</span></div>
            )}
            <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">Payment Method(s)</label>
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-lg p-2">
                  <select value={p.method} onChange={(e) => updatePayment(p.id, "method", e.target.value)} className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 outline-none">
                    <option value="cash">Cash</option>
                    <option value="mobile">Mobile Banking</option>
                    <option value="bank">Bank</option>
                  </select>
                  {p.method === "mobile" && (
                    <select value={p.provider} onChange={(e) => updatePayment(p.id, "provider", e.target.value)} className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 outline-none">
                      {MOBILE_PROVIDERS.map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                    </select>
                  )}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <span className="px-2 text-xs text-slate-400">৳</span>
                    <input type="number" min="0" step="0.01" value={p.amount} onChange={(e) => updatePayment(p.id, "amount", e.target.value)} placeholder="0.00" className="w-20 px-1 py-1.5 text-xs font-semibold outline-none" />
                  </div>
                  <button type="button" onClick={() => removePayment(p.id)} className="ml-auto text-slate-300 hover:text-red-500"><FiX size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPayment} className="mt-2 w-full text-xs font-bold text-blue-700 border border-dashed border-blue-300 rounded-lg py-1.5 hover:bg-blue-100">+ Add Payment Method</button>
            <div className="flex justify-between text-xs font-bold mt-2 pt-2 border-t border-blue-200">
              <span className="text-slate-600">Paid Now: {fmt(paidSum)}</span>
              <span className={due > 0 ? "text-red-600" : "text-green-600"}>Due to Supplier: {fmt(due)}</span>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold py-2.5 rounded-xl disabled:opacity-50">
            {saving ? "Saving..." : "Confirm Restock"}
          </button>
        </div>
      </div>
    </div>
  );
}