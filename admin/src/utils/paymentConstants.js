// FILE: src/utils/paymentConstants.js (NEW) — single source of truth for payment methods everywhere
export const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
export const BANK_OPTIONS = ["Dutch-Bangla Bank", "Islami Bank Bangladesh", "City Bank Limited"];
export const PAYMENT_METHODS = ["cash", "mobile", "bank"];

export const fetchAvailableBalances = async () => {
  try {
    const axios = (await import("axios")).default;
    const res = await axios.get("http://localhost:5000/api/ledger/balances");
    return res.data;
  } catch {
    return null;
  }
};

export const clampToMax = (val, max) => {
  const n = Number(val);
  if (!Number.isFinite(n) || max == null) return val;
  return n > max ? String(max) : val;
};