// FILE: src/Pages/Invoice/DueInvoicePaymentHistory.jsx (NEW) — #29 standalone payment-history addendum page

import { useState, useMemo } from "react";
import axios from "axios";
import {
  FiSearch, FiFileText, FiLoader, FiAlertTriangle, FiCalendar, FiDollarSign,
  FiUsers, FiClock, FiCheckCircle, FiUser, FiPackage, FiHash, FiPercent,
  FiTrendingUp, FiActivity, FiInbox,
} from "react-icons/fi";

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

  const trail = useMemo(() => (invoice ? buildTrail(invoice) : []), [invoice]);

  // Display-only derived metrics from existing invoice/trail data — no backend or logic change.
  const metrics = useMemo(() => {
    if (!invoice) return null;
    const collected = trail.reduce((s, e) => s + (e.amount || 0), 0);
    const completionPct = invoice.grandTotal > 0 ? Math.min(100, Math.round((collected / invoice.grandTotal) * 100)) : 0;
    const lastEvent = trail[trail.length - 1];
    const avgCollection = trail.length ? collected / trail.length : 0;
    return {
      collected,
      completionPct,
      collectionsCount: trail.length,
      lastCollectionAt: lastEvent?.at || null,
      avgCollection,
    };
  }, [invoice, trail]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dark hero */}
      <div className="w-full bg-slate-900 text-white px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <FiFileText size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-extrabold text-white truncate">Due Invoice Payment History &amp; Collection Timeline</h1>
                {invoice && (
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    Tracked Invoice: <span className="text-white font-semibold">{invoice.invoiceNumber}</span> ({invoice.paymentStatus === "paid" ? "Paid" : "Active"}, {invoice.invoiceDate})
                  </p>
                )}
              </div>
            </div>
            {metrics && (
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Total Collected</p>
                  <p className="text-lg font-bold text-emerald-400">{fmt(metrics.collected)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Remaining Due</p>
                  <p className="text-lg font-bold text-amber-400">{fmt(invoice.dueAmount)}</p>
                </div>
                <ProgressRing pct={metrics.completionPct} />
              </div>
            )}
          </div>

          {invoice && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <DarkKpi icon={<FiFileText size={14} />} label="Total Invoice" value={fmt(invoice.grandTotal)} />
              <DarkKpi icon={<FiDollarSign size={14} />} label="Amount Collected" value={fmt(metrics.collected)} accent="text-emerald-400" />
              <DarkKpi icon={<FiAlertTriangle size={14} />} label="Remaining Balance" value={fmt(invoice.dueAmount)} accent="text-amber-400" />
              <DarkKpi icon={<FiUsers size={14} />} label="# of Collections" value={metrics.collectionsCount} />
              <DarkKpi icon={<FiClock size={14} />} label="Completion %" value={`${metrics.completionPct}%`} />
              <DarkKpi icon={<FiCalendar size={14} />} label="Last Collection" value={metrics.lastCollectionAt ? fmtDate(metrics.lastCollectionAt) : "—"} />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6 min-w-0">
            {/* Smart search */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder="Invoice number, customer name or phone..."
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
              <button
                onClick={search}
                disabled={loading}
                className="w-full px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <FiLoader className="animate-spin" /> : <FiSearch size={16} />} Search
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm">
                <FiAlertTriangle size={18} className="shrink-0" /> {error}
              </div>
            )}

            {!invoice && !error && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <FiInbox size={26} />
                </div>
                <p className="text-sm text-slate-500 max-w-xs">
                  Search an invoice number or customer name above to view complete payment history and collection timeline.
                </p>
              </div>
            )}

            {invoice && (
              <>
                {/* Invoice overview: customer card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">{invoice.invoiceNumber}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${invoice.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                      {invoice.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 flex items-center gap-1.5"><FiUser size={14} className="text-slate-400" /> {invoice.customer?.name}</p>
                    <p className="text-sm text-slate-500">{invoice.customer?.phone}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1"><FiCalendar size={12} /> {invoice.invoiceDate}</span>
                    <span className="flex items-center gap-1"><FiPackage size={12} /> {invoice.items?.length || 0} products</span>
                  </div>
                </div>

                {/* Financial breakdown card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 text-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Financial Breakdown</p>
                  <Row label="Subtotal" value={fmt(invoice.subtotal)} />
                  <Row label="Discount" value={invoice.discount > 0 ? `-${fmt(invoice.discount)}` : "—"} />
                  <Row label="VAT" value={invoice.vat > 0 ? fmt(invoice.vat) : "—"} />
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold">
                    <span className="text-slate-700">Grand Total</span>
                    <span className="text-slate-900">{fmt(invoice.grandTotal)}</span>
                  </div>
                  <Row label="Total Paid" value={fmt(metrics.collected)} valueClass="text-emerald-600 font-semibold" />
                  <Row label="Remaining Due" value={fmt(invoice.dueAmount)} valueClass="text-amber-600 font-bold" />
                </div>

                {/* Itemized table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Items</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase text-slate-400">
                        <th className="text-left px-4 py-2">Product</th>
                        <th className="text-center px-4 py-2">Qty</th>
                        <th className="text-right px-4 py-2">Price</th>
                        <th className="text-right px-4 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((it, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-2 text-slate-700">{it.name}</td>
                          <td className="px-4 py-2 text-center text-slate-500">{it.qty} {it.unit || "pcs"}</td>
                          <td className="px-4 py-2 text-right text-slate-500">{fmt(it.price)}</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-800">{fmt(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Collection history table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Collection History</p>
                  </div>
                  {trail.length === 0 ? (
                    <p className="text-center text-slate-400 py-10 text-sm">No payment history recorded.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[480px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase text-slate-400">
                            <th className="text-left px-4 py-2">Date</th>
                            <th className="text-left px-4 py-2">Method</th>
                            <th className="text-right px-4 py-2">Amount</th>
                            <th className="text-right px-4 py-2">Balance After</th>
                          </tr>
                        </thead>
                        <tbody className="tabular-nums">
                          {trail.map((e, i) => (
                            <tr key={i} className="border-b border-slate-50 last:border-0">
                              <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{fmtDate(e.at)}</td>
                              <td className="px-4 py-2 text-slate-700">{e.label}</td>
                              <td className="px-4 py-2 text-right font-semibold text-emerald-600">+{fmt(e.amount)}</td>
                              <td className="px-4 py-2 text-right text-slate-500">{fmt(e.after)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between font-bold text-sm">
                    <span className="text-slate-600">Final Remaining Due</span>
                    <span className={invoice.dueAmount > 0 ? "text-amber-600" : "text-emerald-600"}>{fmt(invoice.dueAmount)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {invoice && (
            <div className="lg:col-span-7 space-y-6 min-w-0">
              {/* Payment timeline */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FiActivity size={16} /> Payment Timeline</h2>
                </div>
                {trail.length === 0 ? (
                  <p className="text-center text-slate-400 py-10 text-sm">No payment history recorded.</p>
                ) : (
                  <div className="space-y-0">
                    {[{ label: "Invoice Generated", amount: invoice.grandTotal, at: invoice.createdAt || invoice.invoiceDate, isGenesis: true }, ...trail].map((e, i, arr) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className={`w-3 h-3 rounded-full flex items-center justify-center ${e.isGenesis ? "bg-slate-400" : "bg-emerald-500"}`}>
                            {!e.isGenesis && <FiCheckCircle className="text-white" size={9} />}
                          </span>
                          {i !== arr.length - 1 && <span className="w-px flex-1 bg-slate-200 my-1" />}
                        </div>
                        <div className="pb-5 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {e.isGenesis ? "Invoice Generated" : e.label}
                          </p>
                          <p className="text-xs text-slate-400">{fmtDateTime(e.at)}</p>
                          <p className={`text-sm font-bold mt-0.5 ${e.isGenesis ? "text-slate-600" : "text-emerald-600"}`}>
                            {e.isGenesis ? fmt(e.amount) : `+${fmt(e.amount)}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Due reduction journey */}
              {trail.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><FiTrendingUp size={16} /> Due Reduction Journey</h2>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <JourneyPill label="Grand Total" value={fmt(invoice.grandTotal)} tone="dark" />
                    {trail.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-300">➔</span>
                        <JourneyPill label={`Payment ${i + 1}`} value={`-${fmt(e.amount)}`} tone="green" />
                        <span className="text-slate-300">➔</span>
                        <JourneyPill label="Balance" value={fmt(e.after)} tone={i === trail.length - 1 ? "final" : "slate"} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial insights */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><FiPercent size={16} /> Financial Insights</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center gap-2 bg-slate-50 rounded-xl p-4">
                    <ProgressRing pct={metrics.completionPct} size={56} light />
                    <p className="text-[11px] text-slate-400 text-center">Collection Efficiency</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-[11px] text-slate-400">Avg Collection</p>
                    <p className="text-lg font-bold text-slate-900">{fmt(metrics.avgCollection)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-[11px] text-slate-400">Collections Made</p>
                    <p className="text-lg font-bold text-slate-900">{metrics.collectionsCount}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-[11px] text-slate-400">Risk Level</p>
                    <span className={`inline-block mt-1 w-fit text-xs font-bold px-2 py-0.5 rounded-full ${invoice.dueAmount > (invoice.grandTotal * 0.5) ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
                      {invoice.dueAmount > (invoice.grandTotal * 0.5) ? "Moderate" : "Low"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DarkKpi({ icon, label, value, accent = "text-white" }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">{icon} {label}</p>
      <p className={`text-sm font-bold truncate ${accent}`}>{value}</p>
    </div>
  );
}

function Row({ label, value, valueClass = "text-slate-700" }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function JourneyPill({ label, value, tone }) {
  const toneCls = {
    dark: "bg-slate-900 text-white",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    slate: "bg-slate-100 text-slate-700",
    final: "bg-amber-50 text-amber-700 border border-amber-200",
  }[tone];
  return (
    <div className={`shrink-0 rounded-xl px-3 py-2 text-center ${toneCls}`}>
      <p className="text-[10px] opacity-70">{label}</p>
      <p className="text-xs font-bold">{value}</p>
    </div>
  );
}

function ProgressRing({ pct, size = 44, light = false }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={light ? "#E2E8F0" : "rgba(255,255,255,0.15)"} strokeWidth="5" />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="#10B981"
        strokeWidth="5"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className={`text-[11px] font-bold ${light ? "fill-slate-700" : "fill-white"}`}>
        {pct}%
      </text>
    </svg>
  );
}