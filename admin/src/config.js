// API Configuration
// Change VITE_API_URL when deploying to production

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://khulna-hardware-mart.vercel.app/api";

export default API_BASE_URL;


// Export auth endpoints
export const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  me: `${API_BASE_URL}/auth/me`,
  profile: `${API_BASE_URL}/auth/profile`,
  password: `${API_BASE_URL}/auth/password`,
  check: `${API_BASE_URL}/auth/check`,
  init: `${API_BASE_URL}/auth/init`,
};

// Export other endpoints
export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/products`,
  suppliers: `${API_BASE_URL}/suppliers`,
  partners: `${API_BASE_URL}/partners`,
  customers: `${API_BASE_URL}/customers`,
  invoices: `${API_BASE_URL}/invoices`,
};