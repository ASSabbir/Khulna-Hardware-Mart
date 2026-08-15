// FILE: src/Pages/Products/PurchaseHistory.jsx (FULL REPLACEMENT) — grouped by date+supplier, eye + print
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiFilter,
  FiCalendar,
  FiTruck,
  FiEye,
  FiPrinter,
  FiX,
  FiMoreHorizontal,
  FiPackage,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";
import { openPrintWindow } from "../../Print/printUtils";
import Pagination from "../../Components/Pagination";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function buildGroupHTML(g) {
  const rows = g.items
    .map(
      (it, i) => `
    <tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${i + 1}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.productName}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.buyingPrice)}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.totalCost)}</td></tr>`,
    )
    .join("");
  const payRows = (g.payments || [])
    .map(
      (p) =>
        `${p.method === "mobile" ? p.provider : p.method}: ${fmt(p.amount)}`,
    )
    .join(" · ");
  return `<html><head><title>Purchase — ${g.supplierName} (${fmtDate(g.date)})</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1E293B;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}</style>
    </head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Purchase Record — ${fmtDate(g.date)}</p>
    <p><strong>Supplier:</strong> ${g.supplierName}</p>
    <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="text-align:right;margin-top:12px;">
      <strong style="font-size:18px;color:#F97316;">Total Cost: ${fmt(g.totalCost)}</strong><br/>
      Paid: ${fmt(g.paidThatDay)}<br/>
      ${g.duePortion > 0 ? `<strong style="color:#ef4444;">Due: ${fmt(g.duePortion)}</strong>` : `<strong style="color:#16a34a;">Fully Paid</strong>`}
    </p>
    ${payRows ? `<p style="color:#64748b;font-size:13px;">Payment: ${payRows}</p>` : ""}
    </body></html>`;
}

function GroupDetailModal({ group, onClose }) {
  if (!group) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[#1E3A8A]/30 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {group.supplierName}
            </h2>
            <p className="text-sm text-gray-500">{fmtDate(group.date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openPrintWindow(buildGroupHTML(group))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#16296B] text-white rounded-lg text-sm font-semibold"
            >
              <FiPrinter size={14} /> Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="text-left px-2 py-2">Product</th>
                <th className="text-center px-2 py-2">Qty</th>
                <th className="text-right px-2 py-2">Price</th>
                <th className="text-right px-2 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((it, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-2 py-2">{it.productName}</td>
                  <td className="px-2 py-2 text-center">{it.quantity}</td>
                  <td className="px-2 py-2 text-right">
                    {fmt(it.buyingPrice)}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">
                    {fmt(it.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex justify-between w-56">
              <span>Total Cost</span>
              <span className="font-bold">{fmt(group.totalCost)}</span>
            </div>
            <div className="flex justify-between w-56 text-[#16A34A]">
              <span>Paid</span>
              <span>{fmt(group.paidThatDay)}</span>
            </div>
            <div
              className={`flex justify-between w-56 font-bold ${group.duePortion > 0 ? "text-[#EF4444]" : "text-[#16A34A]"}`}
            >
              <span>{group.duePortion > 0 ? "Due" : "Status"}</span>
              <span>
                {group.duePortion > 0 ? fmt(group.duePortion) : "Fully Paid"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pure derived display helpers — no functionality, just how a group is presented
function groupStatus(g) {
  if (g.duePortion > 0 && g.paidThatDay > 0)
    return { label: "Partially Paid", cls: "bg-[#F59E0B]/15 text-[#B45309]" };
  if (g.duePortion > 0)
    return { label: "Due", cls: "bg-red-100 text-[#EF4444]" };
  return { label: "Fully Paid", cls: "bg-green-100 text-[#16A34A]" };
}
function paidPct(g) {
  if (!g.totalCost) return 0;
  return Math.min(100, Math.round((g.paidThatDay / g.totalCost) * 100));
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-10 bg-gray-100 rounded" />
            <div className="h-4 w-14 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full mb-4" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 bg-gray-100 rounded-xl" />
        <div className="h-9 flex-1 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

export default function PurchaseHistory() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailGroup, setDetailGroup] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/suppliers?limit=200")
      .then((res) => setSuppliers(res.data.suppliers || []))
      .catch(() => setSuppliers([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (supplierId) params.append("supplierId", supplierId);
      const res = await axios.get(
        `http://localhost:5000/api/purchase-history/grouped?${params}`,
      );
      setGroups(res.data.groups);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [from, to, supplierId, page]);

  useEffect(() => {
    setPage(1);
  }, [from, to, supplierId]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalCost = groups.reduce((s, g) => s + g.totalCost, 0);
  const totalPaid = groups.reduce((s, g) => s + g.paidThatDay, 0);
  const totalDue = groups.reduce((s, g) => s + g.duePortion, 0);
  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const totalQty = groups.reduce((s, g) => s + g.totalQty, 0);

  const supplierName = suppliers.find((s) => s._id === supplierId)?.companyName;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1E3A8A] rounded-2xl flex items-center justify-center text-white shrink-0">
              <FiTruck size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Purchase History
              </h1>
              <p className="text-gray-500 text-base mt-0.5">
                Track and manage your procurement records and supplier payments.
              </p>
            </div>
          </div>
          {(from || to) && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
              <FiCalendar size={15} className="text-[#1E3A8A]" />
              {from ? fmtDate(from) : "…"} - {to ? fmtDate(to) : "…"}
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 text-white bg-linear-to-br from-[#22C55E] to-[#16A34A] shadow-[0_8px_24px_rgba(34,197,94,0.25)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium opacity-90">
                Total Purchase Amount
              </p>
              <FiTrendingUp size={18} className="opacity-80" />
            </div>
            <p className="text-2xl font-bold mt-2">{fmt(totalCost)}</p>
          </div>
          <div className="rounded-2xl p-5 text-white bg-linear-to-br from-[#3B82F6] to-[#1E3A8A] shadow-[0_8px_24px_rgba(59,130,246,0.25)]">
            <p className="text-sm font-medium opacity-90">
              Total Purchase Orders
            </p>
            <p className="text-2xl font-bold mt-2">{groups.length}</p>
          </div>
          <div className="rounded-2xl p-5 text-white bg-linear-to-br from-[#F59E0B] to-[#D97706] shadow-[0_8px_24px_rgba(245,158,11,0.25)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium opacity-90">
                Total Products Purchased
              </p>
              <FiPackage size={18} className="opacity-80" />
            </div>
            <p className="text-2xl font-bold mt-2">{totalQty}</p>
          </div>
          <div className="rounded-2xl p-5 text-white bg-linear-to-br from-[#EF4444] to-[#DC2626] shadow-[0_8px_24px_rgba(239,68,68,0.25)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium opacity-90">Outstanding Due</p>
              <FiAlertCircle size={18} className="opacity-80" />
            </div>
            <p className="text-2xl font-bold mt-2">{fmt(totalDue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-center gap-3">
            <FiFilter className="text-gray-400" />
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.companyName}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-400" size={16} />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
            {(supplierId || from || to) && (
              <button
                onClick={() => {
                  setSupplierId("");
                  setFrom("");
                  setTo("");
                }}
                className="text-sm font-semibold text-[#EF4444] hover:text-[#DC2626] px-2"
              >
                Reset Filter
              </button>
            )}
            <div className="ml-auto bg-[#1E3A8A]/10 text-[#1E3A8A] font-bold px-4 py-2.5 rounded-xl text-sm">
              Total Cost: {fmt(totalCost)}
            </div>
          </div>

          {/* Active filter chips */}
          {(supplierId || from || to) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {supplierId && (
                <span className="flex items-center gap-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] text-sm font-semibold pl-3 pr-2 py-1.5 rounded-full">
                  Supplier: {supplierName}
                  <button
                    onClick={() => setSupplierId("")}
                    className="hover:text-[#0F2158]"
                  >
                    <FiX size={13} />
                  </button>
                </span>
              )}
              {from && (
                <span className="flex items-center gap-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] text-sm font-semibold pl-3 pr-2 py-1.5 rounded-full">
                  From: {fmtDate(from)}
                  <button
                    onClick={() => setFrom("")}
                    className="hover:text-[#0F2158]"
                  >
                    <FiX size={13} />
                  </button>
                </span>
              )}
              {to && (
                <span className="flex items-center gap-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] text-sm font-semibold pl-3 pr-2 py-1.5 rounded-full">
                  To: {fmtDate(to)}
                  <button
                    onClick={() => setTo("")}
                    className="hover:text-[#0F2158]"
                  >
                    <FiX size={13} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Purchase Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center text-gray-400 text-lg">
            No purchase records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {groups.map((g, i) => {
              const status = groupStatus(g);
              const pct = paidPct(g);
              const barColor =
                g.duePortion > 0
                  ? g.paidThatDay > 0
                    ? "bg-[#F59E0B]"
                    : "bg-[#EF4444]"
                  : "bg-[#22C55E]";
              return (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {g.supplierName}
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        Purchased: {fmtDate(g.date)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Product</p>
                      <p className="text-sm font-bold text-gray-900">
                        {g.items.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Quantity</p>
                      <p className="text-sm font-bold text-gray-900">
                        {g.totalQty} units
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Cost</p>
                      <p className="text-sm font-bold text-gray-900">
                        {fmt(g.totalCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">
                        {g.duePortion > 0 ? "Due" : "Paid"}
                      </p>
                      <p
                        className={`text-sm font-bold ${g.duePortion > 0 ? "text-[#EF4444]" : "text-[#16A34A]"}`}
                      >
                        {g.duePortion > 0
                          ? fmt(g.duePortion)
                          : fmt(g.paidThatDay)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-500 w-9 text-right">
                      {pct}%
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setDetailGroup(g)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition"
                    >
                      <FiEye size={15} /> View Details
                    </button>
                    <button
                      onClick={() => openPrintWindow(buildGroupHTML(g))}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#1E3A8A]/10 hover:bg-[#1E3A8A]/20 text-[#1E3A8A] font-semibold py-2.5 rounded-xl text-sm transition"
                    >
                      <FiPrinter size={15} /> Print
                    </button>
                    <button className="w-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition">
                      <FiMoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          className="pt-2"
        />
      </div>
      <GroupDetailModal
        group={detailGroup}
        onClose={() => setDetailGroup(null)}
      />
    </div>
  );
}
