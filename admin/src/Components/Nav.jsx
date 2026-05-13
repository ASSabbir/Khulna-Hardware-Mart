import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiHome, FiAlertTriangle, FiGrid, FiUsers, FiDollarSign,
  FiFileText, FiPackage, FiLogIn, FiTool,
  FiPhone, FiMail, FiMapPin, FiMenu, FiX, FiEye, FiEyeOff,
  FiLock, FiAlertCircle, FiUser, FiLogOut, FiSettings
} from "react-icons/fi";

/* ─── Auth Context ─── */
export const AuthContext = React.createContext(null);

export const useAuth = () => React.useContext(AuthContext);

/* ─── Auth Provider ─── */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on load
    const token = localStorage.getItem("adminToken");
    const savedAdmin = localStorage.getItem("adminData");

    if (token && savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
        // Verify token is still valid
        axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        }).then(() => {
          // Token is valid
        }).catch(() => {
          // Token invalid, logout
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminData");
          setAdmin(null);
        });
      } catch (e) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password
    });

    const { token, admin: adminData } = res.data;

    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminData", JSON.stringify(adminData));
    setAdmin(adminData);

    return adminData;
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setAdmin(null);
  };

  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`
  });

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, getAuthHeader }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Nav routes ─── */
const NAV_LINKS = [
  { to: "/", label: "Home", icon: <FiHome /> },
  { to: "/products-catalog", label: "Products", icon: <FiPackage />  },
  { to: "/stock-warning", label: "Stock Warning", icon: <FiAlertTriangle />, badge: 3 },
  { to: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
  { to: "/customer", label: "Customer", icon: <FiUsers /> },
  { to: "/accounts", label: "Accounts", icon: <FiDollarSign /> },
  { to: "/invoice", label: "Invoice", icon: <FiFileText /> },
  { to: "/products", label: "Inventory", icon: <FiPackage /> },
];

/* ─── Badge ─── */
const Badge = ({ count }) => (
  <span className="bg-yellow-400 text-slate-800 text-[10px] font-bold px-1.5 rounded-full">
    {count}
  </span>
);

/* ─── Login Modal ─── */
function LoginModal({ onClose }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Admin Login</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <FiAlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="px-7 pb-6 text-center">
          <p className="text-gray-500 text-sm">
            Admin access only. Contact developer for access.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── User Menu ─── */
function UserMenu({ admin, onLogout, onLoginClick }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded-xl transition"
      >
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
          {admin?.name?.charAt(0) || "A"}
        </div>
        <span className="text-sm font-semibold text-gray-800 hidden md:block">
          {admin?.name || "Admin"}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="font-semibold text-gray-900">{admin?.name}</div>
              <div className="text-xs text-gray-500">{admin?.email}</div>
            </div>
            <button
              onClick={() => { setOpen(false); navigate("/settings"); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FiSettings size={14} /> Settings
            </button>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <FiLogOut size={14} /> Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const Nav = () => {
  const [open, setOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { admin, logout, loading } = useAuth();

  const baseLink =
    "flex items-center gap-2 px-3 py-1.5 rounded-md text-[13.5px] font-semibold transition-all duration-150 whitespace-nowrap";

  const activeLink = "bg-orange-500 text-white border-2 border-orange-500";
  const normalLink = "text-slate-800 border-2 border-transparent hover:bg-gray-100";

  if (loading) return null;

  return (
    <>
      {/* ── Login Modal ── */}
      {loginModalOpen && (
        <LoginModal onClose={() => setLoginModalOpen(false)} />
      )}

      {/* ── TOP INFO STRIP (CENTERED ALWAYS) ── */}
      <div className="hidden md:block bg-blue-900 text-white text-xs font-medium tracking-wide py-1.5 font-primary">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap justify-center items-center gap-4 text-center">
          <span className="flex items-center gap-1 opacity-90">
            <FiMapPin size={13} />
            280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna
          </span>
          <span className="flex items-center gap-1 opacity-90">
            <FiPhone size={13} />
            02477-721990
          </span>
          <span className="flex items-center gap-1 opacity-90">
            <FiPhone size={13} />
            +880 1931-272839
          </span>
          <span className="flex items-center gap-1 opacity-90">
            <FiPhone size={13} />
            +880 1679-123205
          </span>
          <span className="flex items-center gap-1 opacity-90">
            <FiMail size={13} />
            sislamkhulna1990@gmail.com
          </span>
        </div>
      </div>

      {/* ── MAIN NAV ── */}
      <nav className="bg-white border-b-[3px] border-orange-500 sticky top-0 z-50 font-primary">
        <div className="max-w-[1400px] mx-auto px-6 h-[72px] flex items-center justify-between gap-4">

          {/* BRAND */}
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <FiTool size={26} />
            </div>
            <div className="flex flex-col leading-tight ">
              <span className="font-condensed md:text-[8px] lg:text-[18px] font-bold uppercase tracking-wide text-blue-900">
                Khulna <span className="text-orange-500">Hardware</span> Mart
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                Centenary · Est. 1976
              </span>
            </div>
          </NavLink>

          {/* DESKTOP MENU */}
          <ul className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(({ to, label, icon, badge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `${baseLink} ${isActive ? activeLink : normalLink}`
                  }
                >
                  {icon}
                  {label}
                  {badge && <Badge count={badge} />}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* AUTH */}
          <div className="hidden md:flex items-center gap-2">
            {admin ? (
              <UserMenu admin={admin} onLogout={logout} onLoginClick={() => setLoginModalOpen(true)} />
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-semibold bg-orange-500 text-white border-2 border-orange-500 rounded-md hover:bg-orange-600 transition"
              >
                <FiLogIn size={15} /> Login
              </button>
            )}
          </div>

          {/* HAMBURGER */}
          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {open && (
          <div className="md:hidden bg-white border-t px-6 py-4 flex flex-col gap-2">
            {NAV_LINKS.map(({ to, label, icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `${baseLink} w-full ${isActive ? activeLink : normalLink}`
                }
              >
                {icon}
                {label}
                {badge && <Badge count={badge} />}
              </NavLink>
            ))}

            <div className="border-t my-2"></div>

            {admin ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {admin.name?.charAt(0)}
                  </div>
                  <span className="font-semibold text-gray-800">{admin.name}</span>
                </div>
                <button
                  onClick={() => { setOpen(false); logout(); }}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-red-600"
                >
                  <FiLogOut size={15} /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setOpen(false); setLoginModalOpen(true); }}
                className="flex items-center justify-center gap-1 px-4 py-2 text-sm font-semibold bg-orange-500 text-white border-2 border-orange-500 rounded-md"
              >
                <FiLogIn size={15} /> Login
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Nav;