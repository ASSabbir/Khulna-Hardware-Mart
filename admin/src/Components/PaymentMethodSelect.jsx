// FILE: src/Components/PaymentMethodSelect.jsx (NEW)
import { MOBILE_PROVIDERS, BANK_OPTIONS } from "../utils/paymentConstants";

export default function PaymentMethodSelect({ method, provider, bankName, onChange, size = "sm" }) {
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={method}
        onChange={(e) => onChange({ method: e.target.value, provider: MOBILE_PROVIDERS[0], bankName: BANK_OPTIONS[0] })}
        className={`${textSize} font-semibold border border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white`}
      >
        <option value="cash">Cash</option>
        <option value="mobile">Mobile Banking</option>
        <option value="bank">Bank</option>
      </select>
      {method === "mobile" && (
        <select
          value={provider || MOBILE_PROVIDERS[0]}
          onChange={(e) => onChange({ method, provider: e.target.value, bankName })}
          className={`${textSize} font-semibold border border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white`}
        >
          {MOBILE_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      )}
      {method === "bank" && (
        <select
          value={bankName || BANK_OPTIONS[0]}
          onChange={(e) => onChange({ method, provider, bankName: e.target.value })}
          className={`${textSize} font-semibold border border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white max-w-[160px]`}
        >
          {BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      )}
    </div>
  );
}