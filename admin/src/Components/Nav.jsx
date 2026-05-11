import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome, FiAlertTriangle, FiGrid, FiUsers, FiDollarSign,
  FiFileText, FiPackage, FiLogIn, FiLogOut, FiTool,
  FiPhone, FiMail, FiMapPin, FiMenu, FiX
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

const Nav = () => {
  const [open, setOpen] = useState(false);

  const baseLink =
    "flex items-center gap-2 px-3 py-1.5 rounded-md text-[13.5px] font-semibold transition-all duration-150 whitespace-nowrap";

  const activeLink = "bg-orange-500 text-white border-2 border-orange-500";
  const normalLink = "text-slate-800 border-2 border-transparent hover:bg-gray-100";

  return (
    <>
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
            <button className="flex items-center gap-1 px-4 py-2 text-sm font-semibold border-2 border-blue-700 text-blue-700 rounded-md">
              <FiLogIn size={15} /> Login
            </button>
            <button className="flex items-center gap-1 px-4 py-2 text-sm font-semibold border-2 border-orange-500 text-orange-500 rounded-md">
              <FiLogOut size={15} /> Logout
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
              <button className="flex-1 flex items-center justify-center gap-1 px-4 py-2 text-sm font-semibold border-2 border-blue-700 text-blue-700 rounded-md">
                <FiLogIn size={15} /> Login
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 px-4 py-2 text-sm font-semibold border-2 border-orange-500 text-orange-500 rounded-md">
                <FiLogOut size={15} /> Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Nav;