// FILE: src/Components/PaymentMethodSelect.jsx (FULL REPLACEMENT)
import { useState, useEffect } from "react";
import axios from "axios";
import { MOBILE_PROVIDERS, BANK_OPTIONS } from "../utils/paymentConstants";

export default function PaymentMethodSelect({ method, provider, bankName, onChange, size = "sm" }) {
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const [mobileOptions, setMobileOptions] = useState(MOBILE_PROVIDERS);
  const [bankOptions, setBankOptions] = useState(BANK_OPTIONS);

  useEffect(() => {
    axios.get("http://localhost:5000/api/payment-methods?type=mobile")
      .then((res) => { const names = (res.data.options || []).map((o) => o.name); if (names.length) setMobileOptions(names); })
      .catch(() => {});
    axios.get("http://localhost:5000/api/payment-methods?type=bank")
      .then((res) => { const names = (res.data.options || []).map((o) => o.name); if (names.length) setBankOptions(names); })
      .catch(() => {});
  }, []);

  return (
    <>
      <select
        value={method}
        onChange={(e) => onChange({ method: e.target.value, provider: mobileOptions[0], bankName: bankOptions[0] })}
        className={`${textSize} font-semibold border border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white`}
      >
        <option value="cash">Cash</option>
        <option value="mobile">Mobile Banking</option>
        <option value="bank">Bank</option>
      </select>

      {method === "mobile" && (
        <select
          value={provider || mobileOptions[0]}
          onChange={(e) => onChange({ method, provider: e.target.value, bankName })}
          className={`${textSize} font-semibold border border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white`}
        >
          {mobileOptions.map((p) => (<option key={p} value={p}>{p}</option>))}
        </select>
      )}

      {method === "bank" && (
        <select
          value={bankName || bankOptions[0]}
          onChange={(e) => onChange({ method, provider, bankName: e.target.value })}
          className={`${textSize} font-semibold border border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white max-w-[160px]`}
        >
          {bankOptions.map((b) => (<option key={b} value={b}>{b}</option>))}
        </select>
      )}
    </>
  );
}