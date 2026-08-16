// FILE: src/Pages/Products/SupplierPurchaseOrder.jsx (FULL REPLACEMENT — DESIGN ONLY, LOGIC UNCHANGED)
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiTruck,
  FiSearch,
  FiPlus,
  FiX,
  FiPrinter,
  FiCheckCircle,
  FiAlertTriangle,
  FiLoader,
  FiPhone,
  FiMail,
  FiMapPin,
  FiChevronRight,
  FiTrash2,
  FiCreditCard,
  FiPackage,
  FiTrendingUp,
  FiClock,
  FiBell,
  FiUser,
  FiShield,
  FiDollarSign,
} from "react-icons/fi";
import { openPrintWindow } from "../../Print/printUtils";
import PaymentSplitEditor from "../../Components/PaymentSplitEditor";

const NAVY = "#1E3A8A";
const BLUE = "#2563EB";
const ORANGE = "#F97316";
const RED = "#EF4444";
const GREEN = "#22C55E";

const fmt = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const emptyPayment = () => ({
  id: Date.now() + Math.random(),
  method: "cash",
  amount: "",
  provider: "bKash",
  bankName: "Dutch-Bangla Bank",
  accountNumber: "",
  mobileNumber: "",
});

function buildOrderHTML({
  supplierName,
  items,
  totalCost,
  credit,
  paidSum,
  dueRemaining,
  payments,
}) {
  const rows = items
    .map(
      (it, i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${i + 1}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.productName}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.buyingPrice)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.totalCost)}</td></tr>`,
    )
    .join("");
  const payRows = (payments || [])
    .filter((p) => Number(p.amount) > 0)
    .map(
      (p) =>
        `${p.method === "mobile" ? p.provider : p.method === "bank" ? p.bankName : p.method}: ${fmt(p.amount)}`,
    )
    .join(" · ");
  return `<html><head><title>Purchase Order — ${supplierName}</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1E293B;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}</style>
    </head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Purchase Order — ${new Date().toLocaleDateString("en-GB")}</p>
    <p><strong>Supplier:</strong> ${supplierName}</p>
    <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="text-align:right;margin-top:12px;">
      Subtotal: ${fmt(totalCost)}<br/>
      ${credit > 0 ? `Receivable Adjusted: -${fmt(credit)}<br/>` : ""}
      <strong style="font-size:18px;color:#F97316;">Amount Payable: ${fmt(totalCost - credit)}</strong><br/>
      Paid: ${fmt(paidSum)}<br/>
      ${dueRemaining > 0 ? `<strong style="color:#ef4444;">Due: ${fmt(dueRemaining)}</strong>` : `<strong style="color:#16a34a;">Fully Paid</strong>`}
    </p>
    ${payRows ? `<p style="color:#64748b;font-size:13px;">Payment: ${payRows}</p>` : ""}
    </body></html>`;
}

const SectionCard = ({ title, icon, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-visible ${className}`}
  >
    {title && (
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
        {icon && (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#EFF3FF" }}
          >
            {React.cloneElement ? icon : icon}
          </span>
        )}
        <h3 className="font-bold text-[13px] text-slate-700 uppercase tracking-wide">
          {title}
        </h3>
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const MiniSparkline = ({ color = BLUE }) => (
  <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
    <polyline
      points="0,22 15,18 30,20 45,10 60,14 75,6 90,9 100,4"
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
  </svg>
);

const MiniAreaChart = ({ color = BLUE }) => (
  <svg viewBox="0 0 200 60" className="w-full h-16" preserveAspectRatio="none">
    <polygon
      points="0,50 25,40 50,45 75,25 100,32 125,15 150,20 175,8 200,14 200,60 0,60"
      fill={color}
      opacity="0.12"
    />
    <polyline
      points="0,50 25,40 50,45 75,25 100,32 125,15 150,20 175,8 200,14"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
    />
  </svg>
);

const MiniBarChart = ({ values, labels, color = NAVY }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-2 h-20">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${Math.max(6, (v / max) * 100)}%`,
              background: i % 2 === 0 ? color : ORANGE,
            }}
          />
          <span className="text-[9px] text-slate-400 font-semibold">
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function SupplierPurchaseOrder() {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierBalance, setSupplierBalance] = useState(null);
  const [applyCredit, setApplyCredit] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([emptyPayment()]);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [poNumber] = useState(
    () =>
      `PO-KHM-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
  );
  const poDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/suppliers?limit=200")
      .then((res) => setSuppliers(res.data.suppliers || []))
      .catch(() => setSuppliers([]));
  }, []);

  useEffect(() => {
    if (!supplierId) {
      setSupplierBalance(null);
      setApplyCredit(false);
      return;
    }
    axios
      .get(`http://localhost:5000/api/supplier-payments/${supplierId}`)
      .then((res) => setSupplierBalance(res.data.balance))
      .catch(() => setSupplierBalance(null));
  }, [supplierId]);

  useEffect(() => {
    if (!productQuery.trim()) {
      setProductResults([]);
      return;
    }
    const t = setTimeout(() => {
      axios
        .get(
          `http://localhost:5000/api/products?search=${encodeURIComponent(productQuery.trim())}&limit=10`,
        )
        .then((res) => setProductResults(res.data.products || []))
        .catch(() => setProductResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery]);

  const addProductItem = (p) => {
    if (items.some((it) => it.productId === p._id)) {
      setToast({ type: "error", msg: "Already added." });
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: p._id,
        productId: p._id,
        name: p.name,
        image: p.images?.[0],
        sku: p.sku,
        buyingPrice: p.buyingPrice || "",
        quantity: "",
      },
    ]);
    setProductQuery("");
    setProductResults([]);
  };
  const removeItem = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));
  const updateItem = (id, field, value) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );

  const totalCost = items.reduce(
    (s, it) => s + (Number(it.buyingPrice) || 0) * (Number(it.quantity) || 0),
    0,
  );
  const totalQuantity = items.reduce(
    (s, it) => s + (Number(it.quantity) || 0),
    0,
  );
  const appliedCredit = applyCredit
    ? Math.min(supplierBalance?.receivableAmount || 0, totalCost)
    : 0;
  const costAfterCredit = Math.max(0, totalCost - appliedCredit);
  const paidSum = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const dueRemaining = Math.max(0, costAfterCredit - paidSum);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const selectedSupplier = suppliers.find((s) => s._id === supplierId);

  const submit = async () => {
    if (!supplierId) {
      showToast("error", "Select a supplier.");
      return;
    }
    if (items.length === 0) {
      showToast("error", "Add at least one product.");
      return;
    }
    for (const it of items) {
      if (!Number(it.buyingPrice) || Number(it.buyingPrice) < 0) {
        showToast("error", `Enter buying price for ${it.name}.`);
        return;
      }
      if (!Number(it.quantity) || Number(it.quantity) <= 0) {
        showToast("error", `Enter quantity for ${it.name}.`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/supplier-purchase-orders",
        {
          supplierId,
          items: items.map((it) => ({
            productId: it.productId,
            buyingPrice: Number(it.buyingPrice),
            quantity: Number(it.quantity),
          })),
          payments: payments
            .filter((p) => Number(p.amount) > 0)
            .map((p) => ({
              method: p.method,
              amount: Number(p.amount),
              provider: p.method === "mobile" ? p.provider : undefined,
              bankName: p.method === "bank" ? p.bankName : undefined,
            })),
          creditApplied: appliedCredit > 0 ? appliedCredit : undefined,
        },
      );
      setLastResult({ ...res.data, paymentsUsed: payments });
      setRecentActivity((prev) =>
        [
          {
            id: Date.now(),
            supplierName: res.data.supplierName,
            total: res.data.totalCost,
            date: new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          },
          ...prev,
        ].slice(0, 6),
      );
      setShowSuccessModal(true);
      setItems([]);
      setPayments([emptyPayment()]);
      setApplyCredit(false);
      axios
        .get(`http://localhost:5000/api/supplier-payments/${supplierId}`)
        .then((r) => setSupplierBalance(r.data.balance))
        .catch(() => {});
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message || "Failed to save purchase order.",
      );
    } finally {
      setSaving(false);
    }
  };

  const printOrder = () => {
    if (!lastResult) return;
    openPrintWindow(
      buildOrderHTML({
        supplierName: lastResult.supplierName,
        items: lastResult.purchasedItems,
        totalCost: lastResult.totalCost,
        credit: lastResult.credit,
        paidSum: lastResult.paidSum,
        dueRemaining: lastResult.dueRemaining,
        payments: lastResult.paymentsUsed || [],
      }),
    );
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}
        >
          {toast.type === "success" ? (
            <FiCheckCircle size={18} />
          ) : (
            <FiAlertTriangle size={18} />
          )}{" "}
          {toast.msg}
        </div>
      )}

      {showSuccessModal && lastResult && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Order Saved Successfully
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {lastResult.supplierName} · {fmt(lastResult.totalCost)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={printOrder}
                className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl"
                style={{ background: NAVY }}
              >
                <FiPrinter size={16} /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className=" mx-auto flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: NAVY }}
            >
              <FiTruck size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-[30px] font-extrabold text-slate-900 leading-tight">
                Supplier Purchase Order
              </h1>
              <p className="text-slate-400 text-sm font-medium mt-0.5">
                Buy multiple products from a single supplier in one go
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Purchase Order Number
              </p>
              <p className="text-sm font-bold text-slate-800">{poNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Date
              </p>
              <p className="text-sm font-bold text-slate-800">{poDate}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium -mt-2 flex-wrap">
          <span>Dashboard</span>
          <FiChevronRight size={10} />
          <span>Purchasing</span>
          <FiChevronRight size={10} />
          <span className="text-slate-600 font-semibold">Purchase Orders</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* MAIN COLUMN */}
          <div className="xl:col-span-3 flex flex-col gap-6">
            {/* Supplier + Due + Receivable */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <SectionCard
                title="Premium Supplier Information"
                icon={<FiTruck size={13} color={NAVY} />}
              >
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] mb-4"
                >
                  <option value="">— Select Supplier —</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.companyName}
                    </option>
                  ))}
                </select>
                {selectedSupplier ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shrink-0"
                        style={{ background: NAVY }}
                      >
                        {(selectedSupplier.companyName || "S")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">
                          {selectedSupplier.companyName}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF3FF] text-[#1E3A8A]">
                          Supplier
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-medium">
                      {selectedSupplier.phone && (
                        <span className="flex items-center gap-2">
                          <FiPhone size={12} className="text-slate-400" />
                          {selectedSupplier.phone}
                        </span>
                      )}
                      {selectedSupplier.email && (
                        <span className="flex items-center gap-2">
                          <FiMail size={12} className="text-slate-400" />
                          {selectedSupplier.email}
                        </span>
                      )}
                      {selectedSupplier.address && (
                        <span className="flex items-center gap-2">
                          <FiMapPin size={12} className="text-slate-400" />
                          {selectedSupplier.address}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">
                    Select a supplier to see their profile details.
                  </p>
                )}
              </SectionCard>

              <SectionCard title="Existing Due Widget">
                {supplierBalance?.payableAmount > 0 ? (
                  <div className="rounded-xl p-4 bg-red-50 border border-red-200 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-red-500">
                        Total Due
                      </span>
                      <FiAlertTriangle size={16} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-extrabold text-red-600">
                      {fmt(supplierBalance.payableAmount)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 bg-slate-50 border border-slate-200 text-center text-xs font-semibold text-slate-400">
                    No outstanding due
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Existing Receivable Widget">
                {supplierBalance?.receivableAmount > 0 ? (
                  <div className="rounded-xl p-4 bg-green-50 border border-green-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-green-600">
                        Available Credit
                      </span>
                      <FiCheckCircle size={16} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-extrabold text-green-700">
                      {fmt(supplierBalance.receivableAmount)}
                    </p>
                    <label className="flex items-center justify-between mt-1 cursor-pointer select-none">
                      <span className="text-xs font-bold text-green-800">
                        Credit Adjustment
                      </span>
                      <span
                        className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${applyCredit ? "bg-green-500 justify-end" : "bg-slate-300 justify-start"}`}
                        onClick={() => setApplyCredit((v) => !v)}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow" />
                      </span>
                    </label>
                    {applyCredit && (
                      <p className="text-[11px] font-semibold text-green-700 bg-white/60 rounded-lg px-2.5 py-1.5">
                        Auto: {fmt(appliedCredit)} applied ·{" "}
                        {fmt(
                          Math.max(
                            0,
                            supplierBalance.receivableAmount - appliedCredit,
                          ),
                        )}{" "}
                        remaining
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl p-4 bg-slate-50 border border-slate-200 text-center text-xs font-semibold text-slate-400">
                    No credit available
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Product Finder */}
            <SectionCard
              title="Modern Searchable Product Finder"
              icon={<FiSearch size={13} color={NAVY} />}
            >
              <div className="relative">
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search product by name..."
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A]"
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg text-white text-xs font-bold flex items-center"
                  style={{ background: BLUE }}
                >
                  <FiSearch size={14} />
                </button>
                {productResults.length > 0 && (
                  <div className="absolute z-10 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {productResults.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => addProductItem(p)}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#EFF3FF] text-left border-b border-slate-50 last:border-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FiPackage size={14} className="text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
                            >
                              {p.stock > 0 ? "In Stock" : "Out of Stock"}
                            </span>
                            {p.category && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                {p.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className="text-xs font-extrabold shrink-0"
                          style={{ color: ORANGE }}
                        >
                          {fmt(p.buyingPrice)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Items Table */}
            <SectionCard
              title="Purchase Items"
              icon={<FiPackage size={13} color={NAVY} />}
            >
              {items.length === 0 ? (
                <div className="text-center py-8 text-sm font-medium text-slate-400">
                  No products added yet — search above to add items.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-5">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {[
                          "Image",
                          "Product Name",
                          "SKU",
                          "Buying Price",
                          "Quantity",
                          "Total Cost",
                          "Action",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 px-5 py-2.5"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr
                          key={it.id}
                          className="border-b border-slate-50 hover:bg-slate-50/60"
                        >
                          <td className="px-5 py-2.5">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                              {it.image ? (
                                <img
                                  src={it.image}
                                  alt={it.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FiPackage
                                  size={14}
                                  className="text-slate-400"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-2.5 text-sm font-bold text-slate-800 whitespace-nowrap">
                            {it.name}
                          </td>
                          <td className="px-5 py-2.5 text-xs font-semibold text-slate-400">
                            {it.sku || "—"}
                          </td>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white w-28">
                              <span className="px-2 text-xs text-slate-400">
                                ৳
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={it.buyingPrice}
                                onChange={(e) =>
                                  updateItem(
                                    it.id,
                                    "buyingPrice",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-1 py-1.5 text-xs font-semibold outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) =>
                                updateItem(it.id, "quantity", e.target.value)
                              }
                              className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                            />
                          </td>
                          <td
                            className="px-5 py-2.5 text-sm font-extrabold"
                            style={{ color: ORANGE }}
                          >
                            {fmt(
                              (Number(it.buyingPrice) || 0) *
                                (Number(it.quantity) || 0),
                            )}
                          </td>
                          <td className="px-5 py-2.5">
                            <button
                              type="button"
                              onClick={() => removeItem(it.id)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* Financial Summary Panel */}
            {items.length > 0 && (
              <SectionCard
                title="Premium Financial Summary Panel"
                icon={<FiDollarSign size={13} color={NAVY} />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">
                        Subtotal
                      </p>
                      <p className="text-lg font-extrabold text-slate-800">
                        {fmt(totalCost)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-200 text-slate-600">
                      + Credit
                    </span>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-green-600 uppercase">
                        Receivable
                      </p>
                      <p className="text-lg font-extrabold text-green-700">
                        {fmt(appliedCredit)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-200 text-green-700">
                      - Credit
                    </span>
                  </div>
                  <div
                    className="rounded-xl border px-4 py-3.5 flex items-center justify-between"
                    style={{ background: "#FFF3E8", borderColor: "#FBDCC0" }}
                  >
                    <div>
                      <p
                        className="text-[11px] font-bold uppercase"
                        style={{ color: ORANGE }}
                      >
                        Amount Payable
                      </p>
                      <p
                        className="text-lg font-extrabold"
                        style={{ color: ORANGE }}
                      >
                        {fmt(costAfterCredit)}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full text-white"
                      style={{ background: ORANGE }}
                    >
                      Payable
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "#FFF3E8" }}
                  >
                    <p
                      className="text-[11px] font-bold uppercase mb-1"
                      style={{ color: ORANGE }}
                    >
                      Payable
                    </p>
                    <p className="text-xl font-extrabold text-slate-800 mb-2">
                      {fmt(costAfterCredit)}
                    </p>
                    <MiniSparkline color={ORANGE} />
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "#EFF3FF" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className="text-[11px] font-bold uppercase"
                        style={{ color: BLUE }}
                      >
                        Paid Amount
                      </p>
                      <FiCreditCard size={13} color={BLUE} />
                    </div>
                    <p className="text-xl font-extrabold text-slate-800">
                      {fmt(paidSum)}
                    </p>
                  </div>
                  <div className="rounded-xl p-4 bg-red-50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-bold uppercase text-red-500">
                        Remaining Due
                      </p>
                      <FiAlertTriangle size={13} className="text-red-500" />
                    </div>
                    <p className="text-xl font-extrabold text-red-600">
                      {fmt(dueRemaining)}
                    </p>
                  </div>
                </div>

                {/* Payment Methods — #1 shared standardized selector */}
                <PaymentSplitEditor
                  rows={payments}
                  onChange={setPayments}
                  maxTotal={costAfterCredit}
                  label="Payment Method(s)"
                />
              </SectionCard>
            )}

            {/* Action Area */}
            <SectionCard title="Action Area">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={submit}
                  disabled={saving || items.length === 0}
                  type="button"
                  className="w-full text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${BLUE}, ${NAVY})`,
                  }}
                >
                  {saving ? (
                    <FiLoader className="animate-spin" size={18} />
                  ) : (
                    <FiCheckCircle size={18} />
                  )}{" "}
                  Save Purchase Order
                </button>
                <button
                  onClick={printOrder}
                  disabled={!lastResult}
                  type="button"
                  className="w-full text-white font-bold py-3.5 rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: NAVY }}
                >
                  <FiPrinter size={18} /> Print Purchase Order
                </button>
              </div>
              <p
                className={`text-center text-xs font-bold mt-3 ${saving ? "text-blue-500" : lastResult ? "text-green-600" : "text-slate-300"}`}
              >
                {saving
                  ? "Loading State…"
                  : lastResult
                    ? "Success ✓"
                    : "Awaiting submission"}
              </p>
            </SectionCard>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="flex flex-col gap-6">
            <SectionCard title="Purchase Summary">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#EFF3FF] p-3.5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Total Products
                  </p>
                  <p className="text-xl font-extrabold" style={{ color: NAVY }}>
                    {items.length}
                  </p>
                </div>
                <div className="rounded-xl bg-[#EFF3FF] p-3.5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Total Quantity
                  </p>
                  <p className="text-xl font-extrabold" style={{ color: NAVY }}>
                    {totalQuantity}
                  </p>
                </div>
                <div className="rounded-xl bg-orange-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Supplier Balance
                  </p>
                  <p
                    className="text-base font-extrabold"
                    style={{ color: ORANGE }}
                  >
                    {fmt(
                      supplierBalance?.payableAmount ||
                        supplierBalance?.receivableAmount ||
                        0,
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-green-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Purchase Value
                  </p>
                  <p className="text-base font-extrabold text-green-600">
                    {fmt(totalCost)}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Purchase Statistics"
              icon={<FiTrendingUp size={13} color={NAVY} />}
            >
              <MiniAreaChart color={BLUE} />
              <p className="text-[10px] text-slate-400 font-semibold mt-1 text-center">
                Purchase volume trend
              </p>
            </SectionCard>

            <SectionCard title="Supplier Performance">
              <div className="flex flex-col gap-2.5">
                {[
                  {
                    label: "Total Due",
                    value: supplierBalance?.payableAmount || 0,
                    color: "text-red-500",
                  },
                  {
                    label: "Total Receivable",
                    value: supplierBalance?.receivableAmount || 0,
                    color: "text-green-600",
                  },
                  {
                    label: "Paid (this order)",
                    value: paidSum,
                    color: "text-blue-600",
                  },
                  {
                    label: "Remaining Due",
                    value: dueRemaining,
                    color: "text-orange-500",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-xs font-semibold border-b border-slate-50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`font-extrabold ${row.color}`}>
                      {fmt(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Purchase Activity"
              icon={<FiClock size={13} color={NAVY} />}
            >
              {recentActivity.length === 0 ? (
                <p className="text-xs font-medium text-slate-400 text-center py-4">
                  No purchases recorded yet this session.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "#EFF3FF" }}
                      >
                        <FiShield size={12} color={NAVY} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">
                          {a.supplierName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {a.date} · {fmt(a.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
