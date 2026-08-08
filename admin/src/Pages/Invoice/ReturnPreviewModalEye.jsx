// FILE: src/Pages/Invoice/ReturnPreviewModalEye.jsx (NEW) — #eye on return list shows the RETURN invoice (original + return section), printable

import { useEffect, useState } from "react";
import axios from "axios";
import { FiX, FiPrinter, FiLoader, FiAlertTriangle } from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function ReturnPreviewModalEye({ invoiceId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    axios.get(`http://localhost:5000/api/invoices/${invoiceId}`)
      .then((res) => { if (active) setInvoice(res.data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Failed to load invoice."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <style>{`@media print { body * { visibility: hidden !important; } #return-print, #return-print * { visibility: visible !important; } #return-print { position: fixed; top:0; left:0; width:100%; background:white; z-index:9999; padding:24px; } }`}</style>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 print:hidden">
          <h2 className="text-lg font-bold text-gray-900">Return Invoice</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} disabled={!invoice} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"><FiPrinter size={14} /> Print</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={18} /></button>
          </div>
        </div>
        <div id="return-print" className="p-6">
          {loading && <div className="flex items-center justify-center gap-2 py-16 text-blue-600"><FiLoader className="animate-spin" size={20} /> Loading…</div>}
          {error && <div className="flex items-center gap-2 text-red-600 py-10 justify-center"><FiAlertTriangle size={18} /> {error}</div>}
          {invoice && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xl font-bold text-gray-900">Khulna Hardware Mart</p>
                  <p className="text-xs text-gray-500">280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{invoice.invoiceDate}</p>
                </div>
              </div>
              <div className="mb-4 text-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase">Customer</p>
                <p className="font-semibold text-gray-800">{invoice.customer?.name || "—"}</p>
                <p className="text-gray-500">{invoice.customer?.phone}</p>
              </div>
              <table className="w-full text-sm border-collapse mb-4">
                <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="text-left px-2 py-2">Product</th><th className="text-center px-2 py-2">Qty</th><th className="text-right px-2 py-2">Price</th><th className="text-right px-2 py-2">Total</th>
                </tr></thead>
                <tbody>
                  {invoice.items.map((it, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-2 py-2">{it.name}{it.returnedQty ? <span className="text-red-500 text-xs ml-1">(Returned: {it.returnedQty})</span> : null}</td>
                      <td className="px-2 py-2 text-center">{it.qty} {it.unit || "pcs"}</td>
                      <td className="px-2 py-2 text-right">{fmt(it.price)}</td>
                      <td className="px-2 py-2 text-right font-semibold">{fmt(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mb-4">
                <p className="text-lg font-bold text-gray-900">Grand Total: {fmt(invoice.grandTotal)}</p>
              </div>

              {invoice.returnedItems?.length > 0 && (
                <div className="border-t-4 border-dashed border-red-200 pt-4">
                  <p className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">Return Section</p>
                  <table className="w-full text-sm border-collapse mb-3">
                    <thead><tr className="bg-red-50 border-b border-red-100 text-xs uppercase text-red-500">
                      <th className="text-left px-2 py-2">Product</th><th className="text-center px-2 py-2">Qty Returned</th><th className="text-right px-2 py-2">Return Amount</th><th className="text-left px-2 py-2">Reason</th><th className="text-left px-2 py-2">Date</th>
                    </tr></thead>
                    <tbody>
                      {invoice.returnedItems.map((r, i) => (
                        <tr key={i} className="border-b border-red-50">
                          <td className="px-2 py-2">{r.name}</td>
                          <td className="px-2 py-2 text-center">{r.returnedQty}</td>
                          <td className="px-2 py-2 text-right text-red-600">-{fmt(r.returnAmount)}</td>
                          <td className="px-2 py-2 text-gray-600">{r.reason || "—"}</td>
                          <td className="px-2 py-2 text-gray-500">{fmtDate(r.returnDateBST)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-gray-700">
                      Previous Grand Total: <span className="font-bold">{fmt(invoice.grandTotal)}</span>,{" "}
                      Returned Amount: <span className="font-bold text-red-600">{fmt(invoice.totalReturnedAmount || 0)}</span>,{" "}
                      Final Amount: <span className="font-bold text-green-700">{fmt(invoice.netSaleAmount ?? invoice.grandTotal)}</span>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}