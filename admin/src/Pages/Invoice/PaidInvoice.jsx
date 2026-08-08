import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiCheckCircle, FiSearch, FiCalendar, FiUser, FiPhone,
  FiFileText, FiDollarSign, FiSmartphone, FiCreditCard, FiLoader, FiPrinter, FiEye,
} from "react-icons/fi";
import InvoicePreviewModalEye from "./InvoicePreviewModalEye";
import { buildInvoiceReceiptHTML } from "../../Print/invoiceReceiptTemplate";
import { openPrintWindow } from "../../Print/printUtils";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const METHOD_ICON = { cash: FiDollarSign, mobile: FiSmartphone, bank: FiCreditCard };

export default function PaidInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [eyeId, setEyeId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, paymentStatus: "paid" });
      if (search.trim()) params.append("search", search.trim());
      const res = await axios.get(`http://localhost:5000/api/invoices?${params}`);
      setInvoices(res.data.invoices);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const grandTotalSum = invoices.reduce((s, i) => s + i.grandTotal, 0);

  const printInvoice = (inv) => {
    openPrintWindow(buildInvoiceReceiptHTML(inv));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full space-y-6">

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shrink-0">
            <FiCheckCircle size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paid Invoices</h1>
            <p className="text-gray-500">{total.toLocaleString()} fully paid invoices</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2">
            <FiSearch size={16} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone, or invoice number..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <div className="bg-green-50 text-green-700 font-bold px-4 py-2 rounded-xl text-sm">
            Page Total: {fmt(grandTotalSum)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Invoice #", "Date", "Customer", "Phone", "Items", "Subtotal", "Discount", "VAT", "Grand Total", "Payment", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-16 text-gray-400"><FiLoader className="animate-spin inline mr-2" />Loading...</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-16 text-gray-400">No paid invoices found.</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><FiFileText size={13} className="text-gray-300" />{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><FiCalendar size={13} className="text-gray-300" />{fmtDate(inv.invoiceDate)}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      <span className="flex items-center gap-1.5"><FiUser size={13} className="text-gray-300" />{inv.customer?.name || "Unknown"}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><FiPhone size={13} className="text-gray-300" />{inv.customer?.phone || "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{inv.items?.length || 0}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{fmt(inv.subtotal)}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{inv.discount > 0 ? fmt(inv.discount) : "—"}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{inv.vat > 0 ? fmt(inv.vat) : "—"}</td>
                    <td className="px-5 py-4 font-bold text-green-600">{fmt(inv.grandTotal)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(inv.payments || []).map((p, i) => {
                          const Icon = METHOD_ICON[p.method] || FiDollarSign;
                          return (
                            <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                              <Icon size={11} /> {p.method === "mobile" ? p.provider : p.method} {fmt(p.amount)}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setEyeId(inv._id)} title="View original invoice"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition">
                          <FiEye size={14} />
                        </button>
                        <button onClick={() => printInvoice(inv)} title="Print invoice"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition">
                          <FiPrinter size={14} />
                        </button>
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
    </div>
  );
}