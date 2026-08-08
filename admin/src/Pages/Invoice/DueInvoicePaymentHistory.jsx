// FILE: src/Pages/Invoice/DueInvoicePaymentHistory.jsx (NEW) — #29 standalone payment-history addendum page

import { useState } from "react";
import axios from "axios";
import { FiSearch, FiFileText, FiLoader, FiAlertTriangle, FiCalendar } from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (d) => new Date(d).toLocaleString("en-GB");

export default function DueInvoicePaymentHistory() {
  const [query, setQuery] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setInvoice(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/invoices?limit=1000&search=${encodeURIComponent(query.trim())}`);
      const found = res.data.invoices?.[0];
      if (!found) { setError("No invoice found."); return; }
      setInvoice(found);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search invoice.");
    } finally {
      setLoading(false);
    }
  };

  // Build the chronological "remaining balance" trail: Grand Total -> minus each payment/collection in order
  const buildTrail = (inv) => {
    if (!inv) return [];
    const events = [
      ...(inv.payments || []).map((p, i) => ({
        kind: "initial",
        label: `Initial Payment${p.provider ? ` — ${p.provider}` : ""} (${p.method})`,
        amount: p.amount,
        at: inv.createdAt,
        idx: i,
      })),
    ];
    (inv.collectionHistory || []).forEach((c, i) => {
      events.push({
        kind: "collection",
        label: `Due Collected — ${c.method}${c.provider ? ` (${c.provider})` : ""}`,
        amount: c.amount,
        at: c.collectedAtBST,
        idx: i,
      });
    });
    events.sort((a, b) => new Date(a.at) - new Date(b.at));

    let running = inv.grandTotal;
    return events.map((e) => {
      const before = running;
      running = +(running - e.amount).toFixed(2);
      return { ...e, before, after: running };
    });
  };

  const trail = invoice ? buildTrail(invoice) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white"><FiFileText size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Due Invoice — Payment History</h1>
            <p className="text-gray-500">Original invoice with chronological partial-payment addendum</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Invoice number, customer name or phone..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button onClick={search} disabled={loading} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition disabled:opacity-50">
            {loading ? <FiLoader className="animate-spin" /> : "Search"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <FiAlertTriangle size={18} /> {error}
          </div>
        )}

        {invoice && (
          <>
            {/* Original invoice — exact same design */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
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
              <div className="mb-4 text-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase">Customer</p>
                <p className="font-semibold text-gray-800">{invoice.customer?.name}</p>
                <p className="text-gray-500">{invoice.customer?.phone}</p>
              </div>
              <table className="w-full text-sm border-collapse mb-4">
                <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="text-left px-2 py-2">Product</th><th className="text-center px-2 py-2">Qty</th><th className="text-right px-2 py-2">Price</th><th className="text-right px-2 py-2">Total</th>
                </tr></thead>
                <tbody>
                  {invoice.items.map((it, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-2 py-2">{it.name}</td>
                      <td className="px-2 py-2 text-center">{it.qty} {it.unit || "pcs"}</td>
                      <td className="px-2 py-2 text-right">{fmt(it.price)}</td>
                      <td className="px-2 py-2 text-right font-semibold">{fmt(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Grand Total</p>
                  <p className="text-2xl font-bold text-gray-900">{fmt(invoice.grandTotal)}</p>
                </div>
              </div>
            </div>

            {/* Chronological payment addendum */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Payment Timeline</h2>
                <p className="text-sm text-gray-500">Each payment shown as it happened, with remaining balance after</p>
              </div>
              <div className="divide-y divide-gray-50">
                {trail.length === 0 ? (
                  <p className="text-center text-gray-400 py-10">No payment history recorded.</p>
                ) : trail.map((e, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <FiCalendar size={15} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{e.label}</p>
                        <p className="text-xs text-gray-400">{fmtDateTime(e.at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{fmt(e.amount)}</p>
                      <p className="text-xs text-gray-400">Remaining: {fmt(e.after)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between font-bold">
                <span>Final Remaining Due</span>
                <span className={invoice.dueAmount > 0 ? "text-red-600" : "text-green-600"}>{fmt(invoice.dueAmount)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}