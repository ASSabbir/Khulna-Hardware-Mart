// FILE: src/utils/paymentConstants.js (NEW) — single source of truth for payment methods everywhere
export const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
export const BANK_OPTIONS = ["Dutch-Bangla Bank", "Islami Bank Bangladesh", "City Bank Limited"];
export const PAYMENT_METHODS = ["cash", "mobile", "bank"];

export const clampToMax = (val, max) => {
  const n = Number(val);
  if (!Number.isFinite(n) || max == null) return val;
  return n > max ? String(max) : val;
};