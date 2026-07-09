

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiCheckCircle, FiSearch, FiCalendar, FiUser, FiPhone,
  FiFileText, FiDollarSign, FiSmartphone, FiCreditCard, FiLoader, FiPrinter,
} from "react-icons/fi";

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
    const rows = (inv.items || []).map((it, idx) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${idx + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.price)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.total)}</td>
      </tr>`).join("");
    const payments = (inv.payments || []).map((p) =>
      `${p.method === "mobile" ? p.provider : p.method}: ${fmt(p.amount)}`
    ).join(" · ");
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>${inv.invoiceNumber}</title>
      <style>body{font-family:sans-serif;padding:24px;color:#1E293B;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}</style>
      </head><body>
      <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
      <p style="color:#94a3b8;margin-top:4px;">Sales Memo — ${inv.invoiceNumber}</p>
      <p><strong>Date:</strong> ${fmtDate(inv.invoiceDate)}<br/>
      <strong>Customer:</strong> ${inv.customer?.name || "Unknown"} ${inv.customer?.phone ? "· " + inv.customer.phone : ""}</p>
      <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="text-align:right;margin-top:12px;">Subtotal: ${fmt(inv.subtotal)}<br/>
      ${inv.discount > 0 ? `Discount: -${fmt(inv.discount)}<br/>` : ""}
      ${inv.vat > 0 ? `VAT: +${fmt(inv.vat)}<br/>` : ""}
      <strong style="font-size:18px;color:#F97316;">Grand Total: ${fmt(inv.grandTotal)}</strong></p>
      <p style="color:#64748b;font-size:13px;">Payment: ${payments}</p>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

 return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full space-y-6">

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white">
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
          <div className="overflow-visible">
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                   {["Invoice #", "Date", "Customer", "Phone", "Items", "Subtotal", "Discount", "VAT", "Grand Total", "Payment", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-16 text-gray-400"><FiLoader className="animate-spin inline mr-2" />Loading...</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-16 text-gray-400">No paid invoices found.</td></tr>
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
                      <button onClick={() => printInvoice(inv)} title="Print invoice"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition">
                        <FiPrinter size={14} />
                      </button>
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
    </div>
  );
}