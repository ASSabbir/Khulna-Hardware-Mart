// FILE: src/Pages/Invoice/InvoiceReturn.jsx (FULL REPLACEMENT)
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiSearch, FiRotateCcw, FiAlertCircle, FiCheckCircle, FiPrinter, FiEye, FiX,
  FiPackage, FiFileText, FiPercent, FiTrendingUp, FiTrendingDown, FiUser, FiCalendar,
  FiChevronLeft, FiChevronRight, FiInbox, FiHash, FiClock, FiRefreshCw,
} from "react-icons/fi";
import ReturnPreviewModalEye from "./ReturnPreviewModalEye";
import { buildReturnHTML } from "../../Print/returnTemplate";
import { openPrintWindow } from "../../Print/printUtils";
import Pagination from "../../Components/Pagination";
import PaymentSplitEditor from "../../Components/PaymentSplitEditor";

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
  const [refundPayments, setRefundPayments] = useState([{ id: Date.now(), method: "cash", provider: "bKash", bankName: "Dutch-Bangla Bank", amount: "" }]);

  const [allReturns, setAllReturns] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(true);
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsTotalPages, setReturnsTotalPages] = useState(1);
  const [reasonPopup, setReasonPopup] = useState(null);
  const [eyeId, setEyeId] = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const fetchAllReturns = async (page = 1) => {
    setReturnsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/returns?page=${page}&limit=20`);
      setAllReturns(res.data.records || []);
      setReturnsTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) { setAllReturns([]); } finally { setReturnsLoading(false); }
  };

  useEffect(() => { fetchAllReturns(returnsPage); }, [returnsPage]);

  const searchInvoice = async () => {
    if (!invoiceNumber.trim()) { showToast("error", "Enter an invoice number."); return; }
    setLoading(true);
    setInvoice(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/invoices?limit=1000`);
      const found = res.data.invoices.find((inv) => inv.invoiceNumber.toLowerCase() === invoiceNumber.trim().toLowerCase());
      if (!found) { showToast("error", "Invoice not found."); return; }
      setInvoice(found); setReturnQtys({}); setReasons({});
    } catch (err) { showToast("error", err.response?.data?.message || "Failed to search invoice."); } finally { setLoading(false); }
  };

  const setQty = (itemName, val, max) => { const n = Math.max(0, Math.min(parseInt(val) || 0, max)); setReturnQtys((p) => ({ ...p, [itemName]: n })); };

  const printInvoiceWithReturns = () => { if (invoice) openPrintWindow(buildReturnHTML(invoice)); };

  const handleSubmitReturn = async () => {
    if (!invoice) return;
    const items = invoice.items.filter((it) => (returnQtys[it.name] || 0) > 0).map((it) => ({ productId: it.productId, name: it.name, returnedQty: returnQtys[it.name], unitPrice: it.price, reason: reasons[it.name] || "" }));
    if (items.length === 0) { showToast("error", "Enter at least one return quantity."); return; }
    const refundSum = refundPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    if (Math.abs(refundSum - requiredRefund) > 0.01) {
      showToast("error", `Refund payments must total ${fmt(requiredRefund)} — the portion of the return not already covered by due.`);
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post("http://localhost:5000/api/returns", {
        invoiceId: invoice._id, items,
        refundPayments: refundPayments.filter((p) => Number(p.amount) > 0).map((p) => ({ method: p.method, amount: Number(p.amount), provider: p.method === "mobile" ? p.provider : undefined, bankName: p.method === "bank" ? p.bankName : undefined })),
      });
      setInvoice(res.data.invoice); setReturnQtys({}); setReasons({});
      setRefundPayments([{ id: Date.now(), method: "cash", provider: "bKash", bankName: "Dutch-Bangla Bank", amount: "" }]);
      showToast("success", "Return processed successfully. Stock, due, refund and ledger all updated.");
      fetchAllReturns(1); setReturnsPage(1);
    } catch (err) { showToast("error", err.response?.data?.message || "Failed to process return."); } finally { setSaving(false); }
  };

  // Derived, display-only stats computed from the currently loaded returns page — no API/logic change.
  const kpiStats = useMemo(() => {
    let itemsReturned = 0;
    let refundValue = 0;
    const productMap = new Map();
    allReturns.forEach((r) => {
      (r.items || []).forEach((it) => {
        itemsReturned += it.returnedQty || 0;
        refundValue += it.returnAmount || 0;
        productMap.set(it.name, (productMap.get(it.name) || 0) + (it.returnedQty || 0));
      });
    });
    let mostReturned = null;
    productMap.forEach((qty, name) => {
      if (!mostReturned || qty > mostReturned.qty) mostReturned = { name, qty };
    });
    return {
      totalReturns: allReturns.length,
      itemsReturned,
      refundValue,
      mostReturned,
    };
  }, [allReturns]);

   const invoiceReturnedTotal = useMemo(
    () => (invoice?.returnedItems || []).reduce((s, r) => s + (r.returnAmount || 0), 0),
    [invoice]
  );

  const pendingReturnTotal = useMemo(() => {
    if (!invoice) return 0;
    return invoice.items.reduce((s, it) => s + ((returnQtys[it.name] || 0) * it.price), 0);
  }, [invoice, returnQtys]);

  const autoDueAdjustment = invoice ? Math.min(pendingReturnTotal, invoice.dueAmount || 0) : 0;
  const requiredRefund = Math.max(0, +(pendingReturnTotal - autoDueAdjustment).toFixed(2));

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {toast && (
        <div className={`fixed top-5 right-5 left-5 sm:left-auto z-50 px-5 py-3 rounded-2xl shadow-xl text-sm sm:text-base font-medium flex items-center gap-2 text-white ${toast.type === "success" ? "bg-teal-600" : "bg-rose-600"}`}>
          {toast.type === "success" ? <FiCheckCircle size={18} className="shrink-0" /> : <FiAlertCircle size={18} className="shrink-0" />} {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-700/30 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <FiPackage size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Returns Command Center</p>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate">Product Return</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Process invoice-linked returns and sync hardware inventory</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchAllReturns(returnsPage)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold self-start sm:self-auto shrink-0"
          >
            <FiRefreshCw size={13} className={returnsLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<FiRotateCcw size={18} />} iconBg="bg-slate-100 text-slate-600" label="Total Returns (page)" value={kpiStats.totalReturns} />
          <KpiCard icon={<FiPackage size={18} />} iconBg="bg-amber-50 text-amber-700" label="Units Returned" value={kpiStats.itemsReturned} />
          <KpiCard icon={<FiPercent size={18} />} iconBg="bg-rose-50 text-rose-600" label="Refund Value" value={fmt(kpiStats.refundValue)} valueClass="text-rose-600" />
          <KpiCard
            icon={<FiTrendingUp size={18} />}
            iconBg="bg-teal-50 text-teal-600"
            label="Most Returned"
            value={kpiStats.mostReturned ? kpiStats.mostReturned.name : "—"}
            sub={kpiStats.mostReturned ? `${kpiStats.mostReturned.qty} units` : null}
          />
        </div>

        {/* Smart search */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Smart Invoice Search</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchInvoice()}
                placeholder="Enter invoice number e.g. INV-123456"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
            <button
              onClick={searchInvoice}
              disabled={loading}
              className="px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Searching..." : "Find Invoice"}
            </button>
          </div>
        </div>

        {/* Invoice details + eligible line items */}
        {invoice && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FiHash size={15} className="text-amber-700 shrink-0" /> {invoice.invoiceNumber}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${invoice.paymentStatus === "paid" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>
                    {invoice.paymentStatus === "paid" ? "Paid" : "Due"}
                  </span>
                </p>
                <p className="text-sm text-slate-500 flex items-center gap-3 flex-wrap mt-1">
                  <span className="flex items-center gap-1"><FiUser size={12} /> {invoice.customer?.name}</span>
                  <span className="flex items-center gap-1"><FiCalendar size={12} /> {invoice.invoiceDate}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Grand Total</p>
                <p className="text-lg font-bold text-slate-900">{fmt(invoice.grandTotal)}</p>
              </div>
            </div>

            <div className="px-5 sm:px-6 pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Line Items Eligible for Return</p>
            </div>

            <div className="p-5 sm:p-6 space-y-3">
              {invoice.items.map((item) => {
                const alreadyReturned = item.returnedQty || 0;
                const maxReturnable = item.qty - alreadyReturned;
                return (
                  <div key={item.name} className="border border-slate-100 rounded-xl p-4 bg-slate-50/40">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                          <FiPackage size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            Sold: {item.qty} {item.unit || "pcs"} · Already returned: {alreadyReturned} · Unit Price: {fmt(item.price)}
                          </p>
                        </div>
                      </div>
                      {maxReturnable === 0 ? (
                        <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-3 py-1 rounded-full shrink-0">Fully Returned</span>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-sm font-semibold text-slate-600">Return Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={maxReturnable}
                            value={returnQtys[item.name] || ""}
                            onChange={(e) => setQty(item.name, e.target.value, maxReturnable)}
                            className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white"
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
                        className="w-full mt-2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {invoice.returnedItems?.length > 0 && (
              <div className="px-5 sm:px-6 pb-4">
                <p className="text-sm font-bold text-slate-700 mb-2">Return History</p>
                <div className="space-y-2">
                  {invoice.returnedItems.map((r, i) => (
                    <div key={i} className="flex justify-between text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                      <span>{r.name} × {r.returnedQty}</span>
                      <span className="font-semibold text-rose-600">-{fmt(r.returnAmount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-slate-100 font-bold text-sm">
                  <span className="text-slate-500">Refunded So Far</span>
                  <span className="text-rose-600">-{fmt(invoiceReturnedTotal)}</span>
                </div>
                <div className="flex justify-between mt-1 font-bold text-sm">
                  <span className="text-slate-500">Net Sale</span>
                  <span className="text-slate-900">{fmt(invoice.netSaleAmount ?? invoice.grandTotal)}</span>
                </div>
              </div>
            )}

            {pendingReturnTotal > 0 && (
              <div className="px-5 sm:px-6 pb-4">
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Return Settlement — {fmt(pendingReturnTotal)} total</p>
                  {autoDueAdjustment > 0 && (
                    <div className="flex justify-between text-sm bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <span className="text-amber-700 font-semibold">Auto-adjusted against due</span>
                      <span className="font-bold text-amber-700">-{fmt(autoDueAdjustment)}</span>
                    </div>
                  )}
                  {requiredRefund > 0 ? (
                    <PaymentSplitEditor rows={refundPayments} onChange={setRefundPayments} maxTotal={requiredRefund} label={`Refund to Customer (${fmt(requiredRefund)})`} />
                  ) : (
                    <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">Fully covered by due adjustment — no cash refund needed.</p>
                  )}
                </div>
              </div>
            )}

            <div className="px-5 sm:px-6 pb-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmitReturn}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                <FiRotateCcw size={18} /> {saving ? "Processing..." : "Process Return"}
              </button>
              <button
                onClick={printInvoiceWithReturns}
                className="flex items-center justify-center gap-2 border border-teal-600 text-teal-700 hover:bg-teal-50 font-bold px-6 py-3 rounded-xl transition"
              >
                <FiPrinter size={18} /> Print Preview
              </button>
            </div>
          </div>
        )}

        {/* Recent returns workflow */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Recent Returns Workflow</h2>
            <p className="text-sm text-slate-500">Full history of every product returned, with reason</p>
          </div>

          {returnsLoading ? (
            <div className="text-center py-16 text-slate-400 flex items-center justify-center gap-2">
              <FiClock className="animate-spin" /> Loading...
            </div>
          ) : allReturns.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FiInbox size={26} />
              </div>
              <p className="font-semibold text-slate-700">No returns recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {allReturns.flatMap((r) =>
                r.items.map((it, idx) => (
                  <div key={`${r._id}-${idx}`} className="px-5 sm:px-6 py-3 flex flex-wrap items-center gap-3 hover:bg-slate-50/60 transition">
                    <div className="flex items-center gap-2 min-w-[110px]">
                      <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <FiHash size={12} />
                      </span>
                      <span className="font-semibold text-slate-900 text-sm">{r.invoiceNumber}</span>
                    </div>
                    <div className="flex-1 min-w-[140px] text-sm text-slate-700">{it.name}</div>
                    <div className="text-sm text-slate-500 min-w-[60px]">Qty {it.returnedQty}</div>
                    <div className="text-sm text-slate-500 min-w-[90px]">{fmt(it.unitPrice)}</div>
                    <div className="font-bold text-rose-600 text-sm min-w-[100px]">-{fmt(it.returnAmount)}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 min-w-[100px]">
                      <FiCalendar size={11} /> {fmtDate(r.returnDateBST)}
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      {it.reason ? (
                        <button
                          onClick={() => setReasonPopup({ name: it.name, reason: it.reason })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-amber-600 hover:text-amber-700 transition"
                          title="View reason"
                        >
                          <FiEye size={14} />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-sm w-8 text-center">—</span>
                      )}
                      <button
                        onClick={() => setEyeId(r.invoiceId)}
                        title="View exact printed invoice"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500 transition"
                      >
                        <FiFileText size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="px-5 py-4 border-t border-slate-100">
            <Pagination page={returnsPage} totalPages={returnsTotalPages} onChange={setReturnsPage} accent="#B45309" />
          </div>
        </div>
      </div>

      {reasonPopup && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setReasonPopup(null); }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="font-bold text-slate-900 flex items-center gap-2"><FiAlertCircle size={16} className="text-rose-500" /> Return Reason</p>
              <button onClick={() => setReasonPopup(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><FiX size={16} /></button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-400 font-semibold mb-1">{reasonPopup.name}</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap break-words bg-slate-50 rounded-xl p-3">{reasonPopup.reason}</p>
            </div>
          </div>
        </div>
      )}
      {eyeId && <ReturnPreviewModalEye invoiceId={eyeId} onClose={() => setEyeId(null)} />}
    </div>
  );
}

function KpiCard({ icon, iconBg, label, value, valueClass = "text-slate-900", sub }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium truncate">{label}</p>
        <p className={`text-base font-bold truncate ${valueClass}`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}