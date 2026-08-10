// FILE: src/Components/PaymentSplitEditor.jsx (NEW)
import { FiPlus, FiX } from "react-icons/fi";
import PaymentMethodSelect from "./PaymentMethodSelect";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });

export default function PaymentSplitEditor({ rows, onChange, maxTotal, label = "Payment Method(s)" }) {
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const remaining = Math.max(0, (Number(maxTotal) || 0) - total);

  const addRow = () => onChange([...rows, { id: Date.now() + Math.random(), method: "cash", provider: "bKash", bankName: "Dutch-Bangla Bank", accountNumber: "", mobileNumber: "", amount: "" }]);
  const removeRow = (id) => onChange(rows.length > 1 ? rows.filter((r) => r.id !== id) : rows);
  const updateRow = (id, patch) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const updateAmount = (id, value) => {
    const others = rows.filter((r) => r.id !== id).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const cap = Math.max(0, (Number(maxTotal) || 0) - others);
    const n = Number(value);
    const safeVal = Number.isFinite(n) && maxTotal != null && n > cap ? String(cap) : value;
    updateRow(id, { amount: safeVal });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      {rows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <PaymentMethodSelect method={r.method} provider={r.provider} bankName={r.bankName} onChange={(patch) => updateRow(r.id, patch)} />
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
            <span className="px-2 text-xs text-slate-400">৳</span>
            <input
              type="number" min="0" step="0.01" placeholder="0.00"
              value={r.amount}
              onChange={(e) => updateAmount(r.id, e.target.value)}
              className="w-24 px-1 py-1.5 text-xs font-semibold outline-none"
            />
          </div>
          <button type="button" onClick={() => removeRow(r.id)} className="ml-auto text-slate-300 hover:text-red-500"><FiX size={14} /></button>
        </div>
      ))}
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