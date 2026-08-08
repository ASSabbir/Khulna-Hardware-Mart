// FILE: src/Pages/Invoice/DueInvoice.jsx (FULL REPLACEMENT)
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiAlertCircle, FiSearch, FiCalendar, FiUser, FiPhone, FiFileText, FiDollarSign, FiSmartphone, FiCreditCard, FiLoader, FiPrinter, FiEye, FiX, FiPlus } from "react-icons/fi";
import InvoicePreviewModalEye from "./InvoicePreviewModalEye";
import { buildInvoiceReceiptHTML } from "../../Print/invoiceReceiptTemplate";
import { openPrintWindow } from "../../Print/printUtils";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const METHOD_ICON = { cash: FiDollarSign, mobile: FiSmartphone, bank: FiCreditCard };
const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const emptySplit = () => ({ id: Date.now() + Math.random(), method: "cash", amount: "", provider: "bKash" });

function PayNowModal({ invoice, onClose, onDone }) {
  const [rows, setRows] = useState([emptySplit()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const addRow = () => setRows((p) => [...p, emptySplit()]);
  const removeRow = (id) => setRows((p) => (p.length > 1 ? p.filter((r) => r.id !== id) : p));
  const updateRow = (id, field, value) => setRows((p) => p.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const submit = async () => {
    setError("");
    if (total <= 0) { setError("Enter at least one payment amount."); return; }
    if (total > invoice.dueAmount + 0.01) { setError(`Total cannot exceed due balance (${fmt(invoice.dueAmount)}).`); return; }
    setSaving(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/invoices/${invoice._id}/collect-due`, {
        payments: rows.filter((r) => (Number(r.amount) || 0) > 0).map((r) => ({ method: r.method, amount: Number(r.amount), provider: r.method === "mobile" ? r.provider : undefined })),
      });
      onDone(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><h2 className="text-lg font-bold text-gray-900">Pay Now</h2><p className="text-sm text-gray-500">{invoice.invoiceNumber} · Due: {fmt(invoice.dueAmount)}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={18} /></button>
        </div>
        <div className="p-6 space-y-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
              <select value={r.method} onChange={(e) => updateRow(r.id, "method", e.target.value)} className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                <option value="cash">Cash</option><option value="mobile">Mobile Banking</option><option value="bank">Bank</option>
              </select>
              {r.method === "mobile" && (
                <select value={r.provider} onChange={(e) => updateRow(r.id, "provider", e.target.value)} className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                  {MOBILE_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white"><span className="px-2 text-xs text-gray-400">৳</span><input type="number" min="0" step="0.01" value={r.amount} onChange={(e) => updateRow(r.id, "amount", e.target.value)} placeholder="0.00" className="w-24 px-1 py-1.5 text-xs font-semibold outline-none" /></div>
              <button onClick={() => removeRow(r.id)} className="ml-auto text-gray-300 hover:text-red-500"><FiX size={14} /></button>
            </div>
          ))}
          <button onClick={addRow} className="w-full text-xs font-bold text-blue-700 border border-dashed border-blue-300 rounded-lg py-2 hover:bg-blue-50 flex items-center justify-center gap-1"><FiPlus size={13} /> Add Payment Method</button>
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100"><span>Total</span><span className={total > invoice.dueAmount ? "text-red-600" : "text-green-600"}>{fmt(total)}</span></div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50">{saving ? "Saving..." : "Confirm Payment"}</button>
        </div>
      </div>
    </div>
  );
}

export default function DueInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [eyeId, setEyeId] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [toast, setToast] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, paymentStatus: "due" });
      if (search.trim()) params.append("search", search.trim());
      const res = await axios.get(`http://localhost:5000/api/invoices?${params}`);
      setInvoices(res.data.invoices);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const totalDueSum = invoices.reduce((s, i) => s + i.dueAmount, 0);

  const printInvoice = (inv) => openPrintWindow(buildInvoiceReceiptHTML(inv));

  const handlePaymentDone = (updatedInvoice) => {
    setPayModal(null);
    setToast(updatedInvoice.paymentStatus === "paid" ? "Fully paid — moved to Paid Invoices ✅" : "Payment recorded ✅");
    setTimeout(() => setToast(""), 3000);
    fetchData();
    printInvoice(updatedInvoice);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full space-y-6">
        {toast && <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium">{toast}</div>}

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white"><FiAlertCircle size={22} /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Due Invoices</h1><p className="text-gray-500">{total.toLocaleString()} invoices with outstanding balance</p></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2">
            <FiSearch size={16} className="text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer name, phone, or invoice number..." className="flex-1 text-sm outline-none" />
          </div>
          <div className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-xl text-sm">Page Due Total: {fmt(totalDueSum)}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-visible">
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Invoice #", "Date", "Customer", "Phone", "Items", "Grand Total", "Paid", "Due", "Payment So Far", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-16 text-gray-400"><FiLoader className="animate-spin inline mr-2" />Loading...</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-gray-400">No due invoices found.</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap"><span className="flex items-center gap-1.5"><FiFileText size={13} className="text-gray-300" />{inv.invoiceNumber}</span></td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap"><span className="flex items-center gap-1.5"><FiCalendar size={13} className="text-gray-300" />{fmtDate(inv.invoiceDate)}</span></td>
                    <td className="px-5 py-4 text-sm text-gray-700"><span className="flex items-center gap-1.5"><FiUser size={13} className="text-gray-300" />{inv.customer?.name || "Unknown"}</span></td>
                    <td className="px-5 py-4 text-sm text-gray-500"><span className="flex items-center gap-1.5"><FiPhone size={13} className="text-gray-300" />{inv.customer?.phone || "—"}</span></td>
                    <td className="px-5 py-4 text-sm text-gray-500">{inv.items?.length || 0}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">{fmt(inv.grandTotal)}</td>
                    <td className="px-5 py-4 text-sm text-green-600 font-semibold">{fmt(inv.paidAmount)}</td>
                    <td className="px-5 py-4 font-bold text-red-600">{fmt(inv.dueAmount)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(inv.payments || []).map((p, i) => { const Icon = METHOD_ICON[p.method] || FiDollarSign; return <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg"><Icon size={11} /> {p.method === "mobile" ? p.provider : p.method} {fmt(p.amount)}</span>; })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setPayModal(inv)} className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition">Pay Now</button>
                        <button onClick={() => setEyeId(inv._id)} title="View original invoice" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"><FiEye size={14} /></button>
                        <button onClick={() => printInvoice(inv)} title="Print invoice" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition"><FiPrinter size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-gray-100">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
      {eyeId && <InvoicePreviewModalEye invoiceId={eyeId} onClose={() => setEyeId(null)} />}
      {payModal && <PayNowModal invoice={payModal} onClose={() => setPayModal(null)} onDone={handlePaymentDone} />}
    </div>
  );
}