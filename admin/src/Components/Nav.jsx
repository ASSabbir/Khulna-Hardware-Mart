import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome, FiAlertTriangle, FiGrid, FiUsers, FiDollarSign,
  FiFileText, FiPackage, FiLogIn, FiLogOut, FiTool,
  FiPhone, FiMail, FiMapPin, FiMenu, FiX, FiEye, FiEyeOff,
  FiUser, FiLock, FiMail as FiMailIcon, FiAlertCircle
} from "react-icons/fi";

/* ─── Nav routes ─── */
const NAV_LINKS = [
  { to: "/", label: "Home", icon: <FiHome /> },
  { to: "/stock-warning", label: "Stock Warning", icon: <FiAlertTriangle />, badge: 3 },
  { to: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
  { to: "/customer", label: "Customer", icon: <FiUsers /> },
  { to: "/accounts", label: "Accounts", icon: <FiDollarSign /> },
  { to: "/invoice", label: "Invoice", icon: <FiFileText /> },
  { to: "/products", label: "Products", icon: <FiPackage /> },
];

/* ─── Badge ─── */
const Badge = ({ count }) => (
  <span className="bg-yellow-400 text-slate-800 text-[10px] font-bold px-1.5 rounded-full">
    {count}
  </span>
);

/* ─── Login Modal ─── */
function LoginModal({ onClose, onSwitchToSignup }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    // Simulate login - in real app, call API
    setTimeout(() => {
      setLoading(false);
      onClose();
      alert("Login successful! (Demo)");
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
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
              <FiMailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
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

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" className="rounded border-gray-300" />
              Remember me
            </label>
            <a href="#" className="text-orange-600 font-semibold hover:underline">Forgot password?</a>
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
          <p className="text-gray-600">
            Don't have an account?{" "}
            <button onClick={onSwitchToSignup} className="text-orange-600 font-semibold hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Signup Modal ─── */
function SignupModal({ onClose, onSwitchToLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError("");
    // Simulate signup - in real app, call API
    setTimeout(() => {
      setLoading(false);
      onClose();
      alert("Account created successfully! (Demo)");
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <FiMailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="px-7 pb-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="text-orange-600 font-semibold hover:underline">
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const Nav = () => {
  const [open, setOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null); // null, "login", "signup"

  const baseLink =
    "flex items-center gap-2 px-3 py-1.5 rounded-md text-[13.5px] font-semibold transition-all duration-150 whitespace-nowrap";

  const activeLink = "bg-orange-500 text-white border-2 border-orange-500";
  const normalLink = "text-slate-800 border-2 border-transparent hover:bg-gray-100";

  return (
    <>
      {/* ── Auth Modals ── */}
      {authModal === "login" && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSwitchToSignup={() => setAuthModal("signup")}
        />
      )}
      {authModal === "signup" && (
        <SignupModal
          onClose={() => setAuthModal(null)}
          onSwitchToLogin={() => setAuthModal("login")}
        />
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
            <button
              onClick={() => setAuthModal("login")}
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold border-2 border-blue-700 text-blue-700 rounded-md hover:bg-blue-50 transition"
            >
              <FiLogIn size={15} /> Login
            </button>
            <button
              onClick={() => setAuthModal("signup")}
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold bg-orange-500 text-white border-2 border-orange-500 rounded-md hover:bg-orange-600 transition"
            >
              <FiLogOut size={15} /> Sign Up
            </button>
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

            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setAuthModal("login"); }}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 text-sm font-semibold border-2 border-blue-700 text-blue-700 rounded-md"
              >
                <FiLogIn size={15} /> Login
              </button>
              <button
                onClick={() => { setOpen(false); setAuthModal("signup"); }}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 text-sm font-semibold bg-orange-500 text-white border-2 border-orange-500 rounded-md"
              >
                <FiLogOut size={15} /> Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Nav;