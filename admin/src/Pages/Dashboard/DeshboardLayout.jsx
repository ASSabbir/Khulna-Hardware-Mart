import { NavLink, Outlet } from "react-router-dom";
import { FiUsers, FiCheckCircle, FiAlertCircle, FiUserPlus, FiTruck, FiMenu, FiX, FiTool } from "react-icons/fi";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "overview", label: "Overview", icon: <FiAlertCircle size={16} /> },
  { to: "admin", label: "Admin", icon: <FiUsers size={16} /> },
  { to: "revenue", label: "Revenue", icon: <FiCheckCircle size={16} /> },
  { to: "book", label: "Book for a bug", icon: <FiAlertCircle size={16} /> },
  
  
];

const DeshboardLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen font-['Barlow',sans-serif] bg-slate-100 overflow-hidden">

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-60 bg-[#1E3A8A] flex flex-col border-r-4 border-[#F97316] transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b-2 border-[#1D4ED8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F97316] rounded-lg flex items-center justify-center">
              <FiTool size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-['Barlow_Condensed',sans-serif] font-bold text-white text-sm uppercase tracking-wide">
                Deshboard
              </span>
              <span className="text-[#93C5FD] text-[10px] uppercase tracking-widest">
                Management
              </span>
            </div>
          </div>

          {/* Close btn */}
          <button className="md:hidden text-white" onClick={() => setOpen(false)}>
            <FiX size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold border-2 transition-colors duration-150 ` +
                (isActive
                  ? "bg-[#F97316] text-white border-[#F97316]"
                  : "text-[#CBD5E1] border-transparent hover:bg-[#1D4ED8] hover:text-white hover:border-[#1D4ED8]")
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t-2 border-[#1D4ED8]">
          <p className="text-[#64748B] text-[10px] uppercase tracking-widest">
            Khulna Hardware Mart
          </p>
          <p className="text-[#93C5FD] text-[10px] mt-0.5">
            Centenary · Est. 1924
          </p>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <div className="h-12 bg-white flex items-center px-4 md:px-6 gap-3 flex-shrink-0">

          <button
            className="md:hidden text-[#1E3A8A]"
            onClick={() => setOpen(true)}
          >
            <FiMenu size={20} />
          </button>

          <span className="w-1.5 h-5 bg-[#F97316] rounded-full" />

          <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-base uppercase tracking-wide">
           Deshboard Panel
          </span>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>

      </div>

    </div>
  );
};

export default DeshboardLayout;
