// FILE: src/Pages/Invoice/InvoiceReturn.jsx (NEW)
import { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch, FiRotateCcw, FiAlertCircle, FiCheckCircle, FiPrinter, FiEye, FiX } from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function InvoiceReturn() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [returnQtys, setReturnQtys] = useState({});
  const [reasons, setReasons] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

 const [allReturns, setAllReturns] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(true);
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsTotalPages, setReturnsTotalPages] = useState(1);
  const [reasonPopup, setReasonPopup] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllReturns = async (page = 1) => {
    setReturnsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/returns?page=${page}&limit=20`);
      setAllReturns(res.data.records || []);
      setReturnsTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      setAllReturns([]);
    } finally {
      setReturnsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReturns(returnsPage);
  }, [returnsPage]);

  const searchInvoice = async () => {
    if (!invoiceNumber.trim()) { showToast("error", "Enter an invoice number."); return; }
    setLoading(true);
    setInvoice(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/invoices?limit=1000`);
      const found = res.data.invoices.find(
        (inv) => inv.invoiceNumber.toLowerCase() === invoiceNumber.trim().toLowerCase()
      );
      if (!found) { showToast("error", "Invoice not found."); return; }
      setInvoice(found);
      setReturnQtys({});
      setReasons({});
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to search invoice.");
    } finally {
      setLoading(false);
    }
  };

  const setQty = (itemName, val, max) => {
    const n = Math.max(0, Math.min(parseInt(val) || 0, max));
    setReturnQtys((p) => ({ ...p, [itemName]: n }));
  };

   const printInvoiceWithReturns = () => {
    if (!invoice) return;
    const itemRows = (invoice.items || []).map((it, idx) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${idx + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.name}${it.returnedQty ? ` <span style="color:#ef4444;font-size:11px;">(Returned: ${it.returnedQty})</span>` : ""}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.price)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.total)}</td>
      </tr>`).join("");
    const payments = (invoice.payments || []).map((p) =>
      `${p.method === "mobile" ? p.provider : p.method}: ${fmt(p.amount)}`
    ).join(" · ");
    const returnRows = (invoice.returnedItems || []).map((r, idx) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${idx + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${r.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #fecaca;text-align:center;">${r.returnedQty}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #fecaca;text-align:right;color:#ef4444;">-${fmt(r.returnAmount)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${r.reason || "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${fmtDate(r.returnDateBST)}</td>
      </tr>`).join("");
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>${invoice.invoiceNumber}</title>
      <style>
        body{font-family:sans-serif;padding:24px;color:#1E293B;}
        table{width:100%;border-collapse:collapse;margin-top:12px;}
        th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}
        .section-title{margin-top:28px;font-size:14px;font-weight:bold;color:#ef4444;text-transform:uppercase;letter-spacing:0.05em;border-top:2px dashed #cbd5e1;padding-top:16px;}
      </style>
      </head><body>
      <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
      <p style="color:#94a3b8;margin-top:4px;">Sales Memo — ${invoice.invoiceNumber}</p>
      <p><strong>Date:</strong> ${fmtDate(invoice.invoiceDate)}<br/>
      <strong>Customer:</strong> ${invoice.customer?.name || "Unknown"} ${invoice.customer?.phone ? "· " + invoice.customer.phone : ""}</p>

      <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${itemRows}</tbody></table>

      <p style="text-align:right;margin-top:12px;">Subtotal: ${fmt(invoice.subtotal)}<br/>
      ${invoice.discount > 0 ? `Discount: -${fmt(invoice.discount)}<br/>` : ""}
      ${invoice.vat > 0 ? `VAT: +${fmt(invoice.vat)}<br/>` : ""}
      <strong style="font-size:18px;color:#F97316;">Grand Total: ${fmt(invoice.grandTotal)}</strong></p>
      <p style="color:#64748b;font-size:13px;">Payment: ${payments}</p>

      ${returnRows ? `
        <p class="section-title">Return Section</p>
        <table><thead><tr><th>#</th><th>Product</th><th>Qty Returned</th><th>Return Amount</th><th>Reason</th><th>Return Date</th></tr></thead>
        <tbody>${returnRows}</tbody></table>
        <p style="text-align:right;margin-top:12px;">
          Total Returned: <span style="color:#ef4444;">-${fmt(invoice.totalReturnedAmount)}</span><br/>
          <strong style="font-size:16px;">Net Sale: ${fmt(invoice.netSaleAmount ?? invoice.grandTotal)}</strong>
        </p>
      ` : ""}
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleSubmitReturn = async () => {
    if (!invoice) return;
    const items = invoice.items
      .filter((it) => (returnQtys[it.name] || 0) > 0)
      .map((it) => ({
        productId: it.productId,
        name: it.name,
        returnedQty: returnQtys[it.name],
        unitPrice: it.price,
        reason: reasons[it.name] || "",
      }));

    if (items.length === 0) { showToast("error", "Enter at least one return quantity."); return; }

    setSaving(true);
    try {
      const res = await axios.post("http://localhost:5000/api/returns", {
        invoiceId: invoice._id,
        items,
      });
     setInvoice(res.data.invoice);
      setReturnQtys({});
      setReasons({});
      showToast("success", "Return processed successfully. Stock updated.");
      fetchAllReturns(1);
      setReturnsPage(1);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to process return.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-base font-medium flex items-center gap-2 text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          {toast.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Return</h1>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchInvoice()}
                placeholder="Enter invoice number e.g. INV-123456"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button onClick={searchInvoice} disabled={loading}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition disabled:opacity-50">
              {loading ? "Searching..." : "Find Invoice"}
            </button>
          </div>
        </div>

        {invoice && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-500">{invoice.customer?.name} · {invoice.invoiceDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Grand Total</p>
                <p className="text-lg font-bold text-gray-900">{fmt(invoice.grandTotal)}</p>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {invoice.items.map((item) => {
                const alreadyReturned = item.returnedQty || 0;
                const maxReturnable = item.qty - alreadyReturned;
                return (
                  <div key={item.name} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Sold: {item.qty} {item.unit || "pcs"} · Already returned: {alreadyReturned} · Unit Price: {fmt(item.price)}</p>
                      </div>
                      {maxReturnable === 0 ? (
                        <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">Fully Returned</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-gray-600">Return Qty</label>
                          <input
                            type="number" min="0" max={maxReturnable}
                            value={returnQtys[item.name] || ""}
                            onChange={(e) => setQty(item.name, e.target.value, maxReturnable)}
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      )}
                    </div>
                    {maxReturnable > 0 && (returnQtys[item.name] || 0) > 0 && (
                      <input
                        type="text"
                        value={reasons[item.name] || ""}
                        onChange={(e) => setReasons((p) => ({ ...p, [item.name]: e.target.value }))}
                        placeholder="Return reason (optional)"
                        className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {invoice.returnedItems?.length > 0 && (
              <div className="px-6 pb-4">
                <p className="text-sm font-bold text-gray-700 mb-2">Return History</p>
                <div className="space-y-2">
                  {invoice.returnedItems.map((r, i) => (
                    <div key={i} className="flex justify-between text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <span>{r.name} × {r.returnedQty}</span>
                      <span className="font-semibold text-red-600">-{fmt(r.returnAmount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 font-bold">
                  <span>Net Sale</span>
                  <span>{fmt(invoice.netSaleAmount ?? invoice.grandTotal)}</span>
                </div>
              </div>
            )}

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleSubmitReturn} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
                <FiRotateCcw size={18}/> {saving ? "Processing..." : "Process Return"}
              </button>
              <button onClick={printInvoiceWithReturns}
                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl transition">
                <FiPrinter size={18}/> Print
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">All Returned Products</h2>
            <p className="text-sm text-gray-500">Full history of every product returned, with reason</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Invoice", "Product", "Qty Returned", "Unit Price", "Return Amount", "Reason", "Date"].map((h) => (
                    // NOTE: "Reason" header kept as-is; cell now renders an eye button instead of raw text
                    <th key={h} className="text-left px-5 py-3 text-sm font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {returnsLoading ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400">Loading...</td></tr>
                ) : allReturns.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400">No returns recorded yet.</td></tr>
                ) : (
                  allReturns.flatMap((r) =>
                    r.items.map((it, idx) => (
                      <tr key={`${r._id}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-semibold text-gray-900">{r.invoiceNumber}</td>
                        <td className="px-5 py-3 text-gray-700">{it.name}</td>
                        <td className="px-5 py-3 text-gray-700">{it.returnedQty}</td>
                        <td className="px-5 py-3 text-gray-700">{fmt(it.unitPrice)}</td>
                        <td className="px-5 py-3 font-bold text-red-600">-{fmt(it.returnAmount)}</td>
                        <td className="px-5 py-3 text-center">
                          {it.reason ? (
                            <button
                              onClick={() => setReasonPopup({ name: it.name, reason: it.reason })}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-orange-500 hover:text-orange-500 transition"
                              title="View reason"
                            >
                              <FiEye size={14} />
                            </button>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-sm">{fmtDate(r.returnDateBST)}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
          {returnsTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-gray-100">
              <button disabled={returnsPage === 1} onClick={() => setReturnsPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-500">Page {returnsPage} of {returnsTotalPages}</span>
              <button disabled={returnsPage === returnsTotalPages} onClick={() => setReturnsPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>

      {reasonPopup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setReasonPopup(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-gray-900">Return Reason</p>
              <button onClick={() => setReasonPopup(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <FiX size={16} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-400 font-semibold mb-1">{reasonPopup.name}</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{reasonPopup.reason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}