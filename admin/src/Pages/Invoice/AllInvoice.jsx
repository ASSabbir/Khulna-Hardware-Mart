// FILE: src/Pages/Invoice/AllInvoice.jsx (NEW)
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FiSearch, FiFilter, FiX, FiEye, FiDownload, FiCalendar,
  FiDollarSign, FiFileText,
} from "react-icons/fi";
import InvoicePreviewModalEye from "./InvoicePreviewModalEye";
import Pagination from "../../Components/Pagination";

const API_BASE = "http://localhost:5000/api/invoices";
const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function AllInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [eyeId, setEyeId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (search.trim()) params.append("search", search.trim());
      if (status === "paid" || status === "due") params.append("paymentStatus", status);
      const res = await axios.get(`${API_BASE}?${params}`);
      let list = res.data.invoices || [];
      if (from) list = list.filter((i) => i.invoiceDate >= from || new Date(i.createdAt).toISOString().slice(0, 10) >= from);
      if (to) list = list.filter((i) => i.invoiceDate <= to || new Date(i.createdAt).toISOString().slice(0, 10) <= to);
      setInvoices(list);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { setPage(1); }, [search, status, from, to]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCsv = () => {
    const headers = ["Invoice #", "Date", "Customer", "Phone", "Grand Total", "Paid", "Due", "Status"];
    const rows = invoices.map((i) => [i.invoiceNumber, i.invoiceDate, i.customer?.name, i.customer?.phone, i.grandTotal, i.paidAmount, i.dueAmount, i.paymentStatus]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? "")}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `all-invoices-page-${page}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const grandTotalSum = invoices.reduce((s, i) => s + i.grandTotal, 0);
  const paidSum = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const dueSum = invoices.reduce((s, i) => s + i.dueAmount, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-400 mx-auto space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">All Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">Complete list — paid and due, with filters</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold">Total (this page)</p>
            <p className="text-xl font-bold text-slate-900">{fmt(grandTotalSum)}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold">Paid (this page)</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(paidSum)}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold">Due (this page)</p>
            <p className="text-xl font-bold text-red-600">{fmt(dueSum)}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-55">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, phone, invoice #..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="due">Due</option>
          </select>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
            <FiCalendar size={14} className="text-slate-400" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="text-sm outline-none" />
            <span className="text-slate-300">–</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="text-sm outline-none" />
          </div>
          <button onClick={() => { setSearch(""); setStatus("all"); setFrom(""); setTo(""); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200">
            <FiX size={14} /> Clear
          </button>
          <button onClick={exportCsv} disabled={!invoices.length} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-40 ml-auto">
            <FiDownload size={14} /> Export CSV
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Invoice #", "Date", "Customer", "Phone", "Grand Total", "Paid", "Due", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-400">Loading...</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-400">No invoices found.</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{fmtDate(inv.invoiceDate)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{inv.customer?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{inv.customer?.phone || "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{fmt(inv.grandTotal)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 font-semibold">{fmt(inv.paidAmount)}</td>
                      <td className="px-4 py-3 text-sm text-red-600 font-semibold">{inv.dueAmount > 0 ? fmt(inv.dueAmount) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${inv.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                          {inv.paymentStatus === "paid" ? "Paid" : "Due"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEyeId(inv._id)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"><FiEye size={14} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">Total invoices: {total.toLocaleString()}</p>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} accent="#0F172A" />
          </div>
        </div>
      </div>
      {eyeId && <InvoicePreviewModalEye invoiceId={eyeId} onClose={() => setEyeId(null)} />}
    </div>
  );
}