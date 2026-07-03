import { useState, useEffect } from "react";
import axios from "axios";
import {
  FiUsers, FiSearch, FiX, FiEye, FiTrash2,
  FiPhone, FiMail, FiMapPin, FiShoppingBag,
} from "react-icons/fi";

const API_URL = "/customers.json";

const fmt      = (n) => "৳" + Number(n || 0).toLocaleString();
const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const COLORS   = ["bg-blue-600","bg-teal-600","bg-indigo-600","bg-cyan-600","bg-sky-600"];
const avatarBg = (id) => COLORS[id % COLORS.length];

function Drawer({ c, onClose }) {
  if (!c) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Customer Info</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><FiX size={20} className="text-gray-500" /></button>
        </div>
        <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${avatarBg(c.id)}`}>{initials(c.name)}</div>
          <div>
            <div className="text-xl font-bold text-gray-900">{c.name}</div>
            <span className="inline-flex items-center gap-1.5 text-sm px-3 py-0.5 rounded-full font-semibold mt-1 bg-blue-100 text-blue-700">
              <FiUsers size={12} /> Retail
            </span>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { icon: <FiPhone size={15} />,  label: "Phone",   val: c.phone },
            { icon: <FiMail size={15} />,   label: "Email",   val: c.email || "Not provided" },
            { icon: <FiMapPin size={15} />, label: "Address", val: c.address || "—" },
          ].map(({ icon, label, val }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">{icon}</div>
              <div>
                <div className="text-xs text-gray-400">{label}</div>
                <div className={`text-base font-medium ${val === "Not provided" ? "text-gray-400 italic" : "text-gray-800"}`}>{val}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mx-6" />
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="text-blue-700 text-xl font-bold">{fmt(c.totalSpent)}</div>
            <div className="text-blue-600 text-sm mt-0.5">Total spent</div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="text-gray-800 text-xl font-bold">{c.totalOrders}</div>
            <div className="text-gray-500 text-sm mt-0.5">Orders</div>
          </div>
        </div>
        <div className="mt-auto px-6 pb-6">
          <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl text-base transition">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function RetailCustomer() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [drawer,  setDrawer]  = useState(null);
  const [delId,   setDelId]   = useState(null);

  useEffect(() => {
    axios.get(API_URL)
      .then((res) => {
        const all = Array.isArray(res.data) ? res.data : res.data.data;
        // Only retail customers (customerType 1)
        setData(all.filter((c) => (c.customerType || 1) === 1));
      })
      .finally(() => setLoading(false));
  }, []);

  const rows = search
    ? data.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search))
    : data;

  const handleDelete = () => {
    setData((p) => p.filter((c) => c.id !== delId));
    setDelId(null);
    setDrawer(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-11 h-11 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {delId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove customer?</h3>
            <p className="text-gray-500 text-base mb-6"><strong>{data.find((c) => c.id === delId)?.name}</strong> will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition">Remove</button>
            </div>
          </div>
        </div>
      )}

      <Drawer c={drawer} onClose={() => setDrawer(null)} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><FiUsers size={24} /></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Retail Customers</h1>
            <p className="text-gray-500 text-base mt-0.5">Individual, walk-in customers</p>
          </div>
          <div className="ml-auto bg-blue-100 text-blue-700 text-xl font-bold px-5 py-2 rounded-2xl">{data.length}</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-5">
        {/* Search */}
        <div className="relative">
          <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><FiX size={16} /></button>}
        </div>

        <p className="text-gray-400 text-base">{rows.length} result{rows.length !== 1 ? "s" : ""}</p>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Customer", "Phone", "Orders", "Total Spent", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-base font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-lg">No retail customers found</td></tr>
                ) : rows.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarBg(c.id)}`}>{initials(c.name)}</div>
                        <div className="text-base font-semibold text-gray-900 whitespace-nowrap">{c.name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-base text-gray-700 whitespace-nowrap"><span className="flex items-center gap-1.5"><FiPhone size={13} className="text-gray-400" />{c.phone}</span></td>
                    <td className="px-5 py-4"><span className="flex items-center gap-1.5 text-base font-semibold text-gray-800"><FiShoppingBag size={13} className="text-gray-400" />{c.totalOrders}</span></td>
                    <td className="px-5 py-4 text-base font-semibold text-gray-800 whitespace-nowrap">{fmt(c.totalSpent)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDrawer(c)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"><FiEye size={16} /></button>
                        <button onClick={() => setDelId(c.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-100">
            {rows.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-lg">No retail customers found</div>
            ) : rows.map((c) => (
              <div key={c.id} className="p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold ${avatarBg(c.id)}`}>{initials(c.name)}</div>
                  <div>
                    <div className="text-base font-bold text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1"><FiPhone size={12} />{c.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDrawer(c)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FiEye size={15} /></button>
                  <button onClick={() => setDelId(c.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl"><FiTrash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-400 text-base pb-4">Khulna Hardware Mart · Retail Customers</p>
      </div>
    </div>
  );
}