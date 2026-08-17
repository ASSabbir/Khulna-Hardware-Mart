// FILE: src/Components/PaymentSplitEditor.jsx (FULL REPLACEMENT)
import { FiPlus, FiX } from "react-icons/fi";
import PaymentMethodSelect from "./PaymentMethodSelect";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });

export default function PaymentSplitEditor({ rows, onChange, maxTotal, label = "Payment Method(s)", balances = null, allowOverpay = false }) {
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const remaining = Math.max(0, (Number(maxTotal) || 0) - total);

  const usedMethodKeys = (excludeId) =>
    rows.filter((r) => r.id !== excludeId).map((r) => (r.method === "mobile" ? `mobile:${r.provider}` : r.method));

  const nextFreeMethod = () => {
    const used = new Set(usedMethodKeys(null));
    if (!used.has("cash")) return { method: "cash", provider: "bKash", bankName: "Dutch-Bangla Bank" };
    if (!used.has("bank")) return { method: "bank", provider: "bKash", bankName: "Dutch-Bangla Bank" };
    return { method: "mobile", provider: "bKash", bankName: "Dutch-Bangla Bank" };
  };

  const addRow = () => onChange([...rows, { id: Date.now() + Math.random(), ...nextFreeMethod(), accountNumber: "", mobileNumber: "", amount: "" }]);
  const removeRow = (id) => onChange(rows.length > 1 ? rows.filter((r) => r.id !== id) : rows);
  const updateRow = (id, patch) => {
    if (patch.method) {
      const key = patch.method === "mobile" ? `mobile:${patch.provider || "bKash"}` : patch.method;
      if (usedMethodKeys(id).includes(key)) return; // block duplicate method selection
    }
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const availableFor = (row) => {
    if (!balances) return null;
    if (row.method === "cash") return balances.cash ?? null;
    if (row.method === "bank") return balances.bank?.[row.bankName] ?? null;
    if (row.method === "mobile") return balances.mobile?.[row.provider] ?? null;
    return null;
  };
  const updateAmount = (id, value) => {
    // No live clamp against maxTotal — only cap against a hard ceiling (maxTotal itself)
    // so the field doesn't fight the user mid-keystroke. Skipped entirely when allowOverpay.
    const n = Number(value);
    let safeVal = value;
    if (!allowOverpay && Number.isFinite(n) && maxTotal != null && n > Number(maxTotal)) safeVal = String(maxTotal);
    updateRow(id, { amount: safeVal });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      {rows.map((r) => {
        const avail = availableFor(r);
        return (
        <div key={r.id} className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <PaymentMethodSelect method={r.method} provider={r.provider} bankName={r.bankName} onChange={(patch) => updateRow(r.id, patch)} />
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <span className="px-2 text-xs text-slate-400">৳</span>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={r.amount}
                onChange={(e) => updateAmount(r.id, e.target.value)}
                onBlur={(e) => { if (avail != null && Number(e.target.value) > avail) updateRow(r.id, { amount: String(avail) }); }}
                className="w-24 px-1 py-1.5 text-xs font-semibold outline-none"
              />
            </div>
            <button type="button" onClick={() => removeRow(r.id)} className="ml-auto text-slate-300 hover:text-red-500"><FiX size={14} /></button>
          </div>
          {avail != null && (
            <p className={`text-[10px] font-semibold pl-1 ${Number(r.amount) > avail ? "text-red-500" : "text-slate-400"}`}>
              Available: {fmt(avail)}
            </p>
          )}
        </div>
        );
      })}
      <button type="button" onClick={addRow} className="text-xs font-bold rounded-lg py-2 border border-dashed border-slate-300 hover:bg-slate-50 text-slate-500">
        <FiPlus size={13} className="inline mr-1" /> Add Payment Method
      </button>
      {maxTotal != null && (
        <div className="flex justify-between text-xs font-bold px-1">
          <span className="text-slate-500">Total Entered: {fmt(total)}</span>
          <span className={remaining > 0 ? "text-orange-600" : "text-green-600"}>Remaining: {fmt(remaining)}</span>
        </div>
      )}
    </div>
  );
}