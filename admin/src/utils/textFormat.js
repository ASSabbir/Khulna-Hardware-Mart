// FILE: src/utils/textFormat.js (NEW)
export const capitalizeWords = (str) => {
  if (!str) return str;
  return str.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
};