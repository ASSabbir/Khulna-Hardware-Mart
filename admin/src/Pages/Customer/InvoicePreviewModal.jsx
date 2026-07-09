// FILE: src/Pages/Customer/InvoicePreviewModal.jsx (NEW)
import { useEffect, useState } from "react";
import axios from "axios";
import { FiX, FiPrinter, FiLoader, FiAlertTriangle } from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InvoicePreviewModal({ invoiceId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`http://localhost:5000/api/invoices/${invoiceId}`);
        if (active) setInvoice(res.data);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load invoice.");
      } finally {
        if (active) setLoading(false);
      }
    };
    if (invoiceId) load();
    return () => { active = false; };
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-preview-print, #invoice-preview-print * { visibility: visible !important; }
          #invoice-preview-print { position: fixed; top: 0; left: 0; width: 100%; background: white; z-index: 9999; padding: 24px; }
        }
      `}</style>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 print:hidden">
          <h2 className="text-lg font-bold text-gray-900">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={!invoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              <FiPrinter size={14} /> Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={18} /></button>
          </div>
        </div>

        <div id="invoice-preview-print" className="p-6">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-blue-600">
              <FiLoader className="animate-spin" size={20} /> Loading invoice…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600 py-10 justify-center">
              <FiAlertTriangle size={18} /> {error}
            </div>
          )}
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
                  <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${invoice.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {invoice.paymentStatus === "paid" ? "PAID" : "DUE"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Customer</p>
                  <p className="font-semibold text-gray-800">{invoice.customer?.name || "—"}</p>
                  <p className="text-gray-500">{invoice.customer?.phone}</p>
                  <p className="text-gray-500">{invoice.customer?.address}</p>
                </div>
              </div>

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
                  {invoice.items.map((it, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-2 py-2">{it.name}</td>
                      <td className="px-2 py-2 text-center">{it.qty} <span className="text-gray-400 text-xs">{it.unit || "pcs"}</span></td>
                      <td className="px-2 py-2 text-right">{fmt(it.price)}</td>
                      <td className="px-2 py-2 text-right font-semibold">{fmt(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-col items-end gap-1 text-sm">
                <div className="flex justify-between w-48"><span>Subtotal</span><span>{fmt(invoice.subtotal)}</span></div>
                {invoice.discount > 0 && <div className="flex justify-between w-48 text-green-600"><span>Discount</span><span>-{fmt(invoice.discount)}</span></div>}
                {invoice.vat > 0 && <div className="flex justify-between w-48"><span>VAT</span><span>+{fmt(invoice.vat)}</span></div>}
                <div className="flex justify-between w-48 font-bold text-base border-t border-gray-300 pt-1">
                  <span>Grand Total</span><span>{fmt(invoice.grandTotal)}</span>
                </div>
                 {invoice.paymentStatus === "due" && (
                  <>
                    <div className="flex justify-between w-48"><span>Paid</span><span>{fmt(invoice.paidAmount)}</span></div>
                    <div className="flex justify-between w-48 text-red-600 font-semibold"><span>Due</span><span>{fmt(invoice.dueAmount)}</span></div>
                  </>
                )}
              </div>

              {invoice.payments?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-600 uppercase mb-2">Payment Breakdown</p>
                  {invoice.payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700">
                      <span>{p.method}{p.provider ? ` (${p.provider})` : ""}</span>
                      <span className="font-semibold">{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {invoice.collectionHistory?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-600 uppercase mb-2">Due Collection History</p>
                  {invoice.collectionHistory.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700">
                      <span>{c.method}{c.provider ? ` (${c.provider})` : ""} — {new Date(c.collectedAtBST).toLocaleString("en-GB")}</span>
                      <span className="font-semibold text-green-700">{fmt(c.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {invoice.returnedItems?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-600 uppercase mb-2">Returned Items</p>
                  {invoice.returnedItems.map((r, i) => (
                    <div key={i} className="flex justify-between text-sm text-red-600">
                      <span>{r.name} × {r.returnedQty}</span>
                      <span>-{fmt(r.returnAmount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold mt-1 text-sm">
                    <span>Net Sale</span>
                    <span>{fmt(invoice.netSaleAmount ?? invoice.grandTotal)}</span>
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