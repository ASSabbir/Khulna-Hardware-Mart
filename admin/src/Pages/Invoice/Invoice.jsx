import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiSearch, FiPlus, FiTrash2, FiPrinter, FiFileText,
  FiPackage, FiUser, FiPhone, FiHash, FiAlertTriangle,
  FiCheckCircle, FiX, FiEdit2, FiShoppingCart, FiLoader,
} from "react-icons/fi";

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = () => new Date().toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });

const invoiceNo = () => "INV-" + Date.now().toString().slice(-6);

/* ══════════════════════════════════════════════════════════════
   Invoice Component
══════════════════════════════════════════════════════════════ */
const Invoice = () => {
  /* ── State ──────────────────────────────────────────────── */
  const [products,  setProducts]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Memo (right side)
  const [memoItems,   setMemoItems]   = useState([]);
  const [customer,    setCustomer]    = useState({ name: "", phone: "", address: "" });
  const [invoiceNum,  setInvoiceNum]  = useState(invoiceNo());
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [discount,    setDiscount]    = useState("");
  const [priceType,   setPriceType]   = useState("retail"); // "holcell" | "retail" | "buying"
  const [toast,       setToast]       = useState(null);

  // Custom product modal
  const [showCustom,  setShowCustom]  = useState(false);
  const [custom, setCustom_] = useState({ name: "", company: "", price: "", qty: 1 });

  const printRef = useRef(null);

  /* ── Fetch products ─────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    axios.get("/JSON/Products.json")
      .then((res) => { setProducts(res.data); setFiltered(res.data); })
      .catch(() => setError("Failed to load products. Make sure Products.json is in /public/JSON/."))
      .finally(() => setLoading(false));
  }, []);

  /* ── Search filter ──────────────────────────────────────── */
  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q ? products.filter(p =>
      p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q)
    ) : products);
  }, [search, products]);

  /* ── Price selector ─────────────────────────────────────── */
  const getPrice = (p) => {
    const b = parseFloat(p.buyingPrice) || 0;
    if (priceType === "holcell") return +(b * 1.03).toFixed(2);
    if (priceType === "retail")  return +(b * 1.05).toFixed(2);
    return b;
  };

  /* ── Add product to memo ────────────────────────────────── */
  const addToMemo = (p) => {
    setMemoItems(prev => {
      const exists = prev.find(i => i.id === p.id);
      if (exists) {
        showToast("info", `${p.name} already in memo — adjust qty below.`);
        return prev;
      }
      return [...prev, {
        id:      p.id,
        name:    p.name,
        company: p.company,
        price:   getPrice(p),
        qty:     1,
        custom:  false,
      }];
    });
    showToast("success", `${p.name} added to memo.`);
  };

  /* ── Update memo item ───────────────────────────────────── */
  const updateItem = (id, field, value) => {
    setMemoItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id) => setMemoItems(prev => prev.filter(i => i.id !== id));

  /* ── Add custom product ─────────────────────────────────── */
  const addCustom = () => {
    if (!custom.name || !custom.price) { showToast("error", "Name and price are required."); return; }
    setMemoItems(prev => [...prev, {
      id:      "c-" + Date.now(),
      name:    custom.name,
      company: custom.company || "—",
      price:   parseFloat(custom.price) || 0,
      qty:     parseInt(custom.qty)     || 1,
      custom:  true,
    }]);
    setCustom_({ name: "", company: "", price: "", qty: 1 });
    setShowCustom(false);
    showToast("success", "Custom product added to memo.");
  };

  /* ── Totals ─────────────────────────────────────────────── */
  const subtotal  = memoItems.reduce((s, i) => s + (i.price * i.qty), 0);
  const discAmt   = Math.min(parseFloat(discount) || 0, subtotal);
  const grandTotal = subtotal - discAmt;

  /* ── Toast ──────────────────────────────────────────────── */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Print ──────────────────────────────────────────────── */
  const handlePrint = () => {
    if (memoItems.length === 0) { showToast("error", "Add at least one product to print."); return; }
    window.print();
  };

  const clearMemo = () => {
    setMemoItems([]);
    setCustomer({ name: "", phone: "", address: "" });
    setDiscount("");
    setInvoiceNum(invoiceNo());
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet" />

      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: fixed; top: 0; left: 0; width: 100%; background: white; z-index: 9999; padding: 24px; }
        }
        @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .toast-anim { animation: slideIn .25s ease; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 toast-anim flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold font-['Barlow',sans-serif] ${
          toast.type === "success" ? "bg-green-50 border-green-400 text-green-700" :
          toast.type === "error"   ? "bg-red-50 border-red-300 text-red-700" :
                                     "bg-blue-50 border-blue-300 text-blue-700"
        }`}>
          {toast.type === "success" ? <FiCheckCircle size={15}/> : <FiAlertTriangle size={15}/>}
          {toast.msg}
        </div>
      )}

      {/* Custom product modal */}
      {showCustom && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-[#F97316] w-full max-w-md p-6 font-['Barlow',sans-serif]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-lg uppercase tracking-wide">Add Custom Product</h3>
              <button onClick={() => setShowCustom(false)} className="text-slate-400 hover:text-slate-600"><FiX size={18}/></button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Product Name *", key: "name",    placeholder: "e.g. Custom Bolt Set" },
                { label: "Company",        key: "company", placeholder: "e.g. Local Supplier"  },
                { label: "Unit Price (৳) *", key: "price", placeholder: "0.00", type: "number" },
                { label: "Quantity",       key: "qty",     placeholder: "1",    type: "number" },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={custom[f.key]}
                    onChange={e => setCustom_(c => ({ ...c, [f.key]: e.target.value }))}
                    className="border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]"
                    min={f.type === "number" ? "0" : undefined}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCustom(false)} className="flex-1 py-2.5 rounded-lg border-2 border-slate-200 text-slate-600 text-sm font-semibold">Cancel</button>
              <button onClick={addCustom} className="flex-1 py-2.5 rounded-lg bg-[#F97316] border-2 border-[#F97316] text-white text-sm font-bold">Add to Memo</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-col xl:flex-row gap-5 font-['Barlow',sans-serif] min-h-[calc(100vh-80px)]">

        {/* ══════════════════════════════════════
             LEFT — Product Picker
        ══════════════════════════════════════ */}
        <div className="xl:w-[420px] flex-shrink-0 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1E3A8A] rounded-lg flex items-center justify-center flex-shrink-0">
                <FiPackage size={16} className="text-white"/>
              </div>
              <div>
                <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-base uppercase tracking-wide leading-tight">Products</h2>
                <p className="text-[10px] text-slate-400 font-medium">{filtered.length} items available</p>
              </div>
            </div>
            {/* Price type switcher */}
            <div className="flex items-center bg-white border-2 border-slate-200 rounded-lg overflow-hidden text-xs font-bold">
              {[["retail","Retail"], ["holcell","Holcell"], ["buying","Buying"]].map(([v, l]) => (
                <button key={v} onClick={() => setPriceType(v)}
                  className={`px-3 py-1.5 transition-colors ${priceType === v ? "bg-[#1E3A8A] text-white" : "text-slate-500 hover:text-[#1E3A8A]"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-[#1D4ED8] transition-colors">
            <FiSearch size={15} className="text-slate-400 flex-shrink-0"/>
            <input
              type="text"
              placeholder="Search product name or company…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none text-[#1E293B] placeholder-slate-400 bg-transparent font-['Barlow',sans-serif]"
            />
            {search && <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500"><FiX size={13}/></button>}
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[calc(100vh-260px)] pr-1">
            {loading && (
              <div className="flex items-center justify-center gap-3 py-16 text-[#1D4ED8]">
                <FiLoader size={20} className="animate-spin"/> <span className="text-sm font-semibold">Loading products…</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-semibold">
                <FiAlertTriangle size={15}/> {error}
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm font-medium">No products found.</div>
            )}
            {!loading && !error && filtered.map(p => {
              const price = getPrice(p);
              const inMemo = memoItems.some(i => i.id === p.id);
              const lowStock = p.quantity <= 10;
              return (
                <div key={p.id}
                  className={`group flex items-center gap-3 bg-white border-2 rounded-xl px-4 py-3 transition-all duration-150 ${
                    inMemo ? "border-[#F97316] bg-[#FFF7ED]" : "border-slate-200 hover:border-[#1D4ED8]"
                  }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E293B] truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] px-1.5 py-0.5 rounded border border-[#BFDBFE]">{p.company}</span>
                      <span className="text-[10px] font-bold text-[#F97316]">{fmt(price)}</span>
                      {lowStock && <span className="text-[10px] font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">Low: {p.quantity}</span>}
                      {p.quantity === 0 && <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Out</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => addToMemo(p)}
                    disabled={inMemo}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      inMemo
                        ? "border-[#F97316] bg-[#F97316] text-white cursor-default"
                        : "border-slate-200 text-slate-400 hover:border-[#1D4ED8] hover:text-[#1D4ED8] group-hover:border-[#1D4ED8]"
                    }`}>
                    <FiPlus size={14}/>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add custom product button */}
          <button
            onClick={() => setShowCustom(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-[#1D4ED8] text-[#1D4ED8] text-sm font-bold hover:bg-[#EFF6FF] transition-colors"
          >
            <FiEdit2 size={14}/> Add Custom Product
          </button>
        </div>

        {/* ══════════════════════════════════════
             RIGHT — Memo / Invoice
        ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Invoice header controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#F97316] rounded-lg flex items-center justify-center flex-shrink-0">
                <FiFileText size={16} className="text-white"/>
              </div>
              <div>
                <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-base uppercase tracking-wide leading-tight">Sales Memo</h2>
                <p className="text-[10px] text-slate-400 font-medium">{memoItems.length} item{memoItems.length !== 1 ? "s" : ""} · {fmt(grandTotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearMemo} className="px-3 py-1.5 border-2 border-slate-200 rounded-lg text-slate-500 text-xs font-semibold hover:border-slate-300 transition-colors">
                Clear
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#1E3A8A] border-2 border-[#1E3A8A] text-white rounded-lg text-xs font-bold hover:bg-[#1D4ED8] hover:border-[#1D4ED8] transition-colors"
              >
                <FiPrinter size={14}/> Print Memo
              </button>
            </div>
          </div>

          {/* ── PRINTABLE MEMO ── */}
          <div id="print-area" ref={printRef} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col flex-1">

            {/* Memo top bar */}
            <div className="bg-[#1E3A8A] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F97316] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">🔧</span>
                </div>
                <div>
                  <p className="font-['Barlow_Condensed',sans-serif] font-bold text-white text-sm uppercase tracking-widest leading-tight">
                    Khulna <span className="text-[#F97316]">Hardware</span> Mart
                  </p>
                  <p className="text-[#93C5FD] text-[10px] font-medium">280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna· 02477-721990 , +880 1931-272839 , +880 1679-123205 </p> 
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-xs font-bold">SALES MEMO</p>
                <div className="flex items-center gap-2 mt-1">
                  <FiHash size={10} className="text-[#93C5FD]"/>
                  <input
                    value={invoiceNum}
                    onChange={e => setInvoiceNum(e.target.value)}
                    className="bg-transparent text-[#FACC15] text-xs font-bold outline-none w-28 text-right font-['Barlow',sans-serif]"
                  />
                </div>
                <p className="text-[#93C5FD] text-[10px] mt-0.5">{invoiceDate}</p>
              </div>
            </div>

            {/* Customer info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 py-4 border-b-2 border-slate-100 bg-slate-50">
              {[
                { icon: <FiUser size={12}/>,  key: "name",    placeholder: "Customer Name",    label: "Customer" },
                { icon: <FiPhone size={12}/>, key: "phone",   placeholder: "Phone Number",     label: "Phone"    },
                { icon: <FiSearch size={12}/>,key: "address", placeholder: "Address (optional)", label: "Address" },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-lg px-3 py-2 focus-within:border-[#1D4ED8] transition-colors">
                  <span className="text-slate-400 flex-shrink-0">{f.icon}</span>
                  <input
                    placeholder={f.placeholder}
                    value={customer[f.key]}
                    onChange={e => setCustomer(c => ({ ...c, [f.key]: e.target.value }))}
                    className="flex-1 text-xs outline-none text-[#1E293B] placeholder-slate-400 bg-transparent font-['Barlow',sans-serif]"
                  />
                </div>
              ))}
            </div>

            {/* Items table */}
            <div className="flex-1 overflow-auto">
              {memoItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
                  <FiShoppingCart size={40}/>
                  <p className="text-sm font-semibold">Memo is empty</p>
                  <p className="text-xs">Search products on the left and click <strong>+</strong> to add</p>
                </div>
              ) : (
                <table className="w-full min-w-[600px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-4 py-2.5 text-left w-6">#</th>
                      <th className="px-4 py-2.5 text-left">Product</th>
                      <th className="px-4 py-2.5 text-center w-24">Qty</th>
                      <th className="px-4 py-2.5 text-right w-32">Unit Price</th>
                      <th className="px-4 py-2.5 text-right w-32">Total</th>
                      <th className="px-2 py-2.5 w-8 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {memoItems.map((item, idx) => (
                      <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}>
                        <td className="px-4 py-2.5 text-xs text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-[#1E293B] text-sm leading-tight">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.company}</p>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={e => updateItem(item.id, "qty", Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-center border-2 border-slate-200 rounded-lg py-1 text-sm font-semibold text-[#1E293B] outline-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-[#1D4ED8] transition-colors">
                            <span className="px-2 py-1 text-xs text-slate-400 bg-slate-50 border-r border-slate-200">৳</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={e => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-right text-sm font-semibold text-[#1E293B] outline-none bg-white font-['Barlow',sans-serif]"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-[#F97316] tabular-nums text-sm">
                          {fmt(item.price * item.qty)}
                        </td>
                        <td className="px-2 py-2.5 print:hidden">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <FiTrash2 size={13}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Totals */}
            {memoItems.length > 0 && (
              <div className="border-t-2 border-slate-100 px-5 py-4 bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  {/* Discount input */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider whitespace-nowrap">Discount (৳)</label>
                    <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-[#F97316] transition-colors">
                      <span className="px-2 py-2 text-xs text-slate-400 bg-white border-r border-slate-200">৳</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={discount}
                        onChange={e => setDiscount(e.target.value)}
                        className="w-24 px-2 py-2 text-sm font-semibold text-[#1E293B] outline-none bg-white font-['Barlow',sans-serif]"
                      />
                    </div>
                  </div>
                  {/* Summary */}
                  <div className="flex flex-col items-end gap-1 min-w-[200px]">
                    <div className="flex justify-between w-full text-xs text-slate-500 font-medium">
                      <span>Subtotal</span>
                      <span className="tabular-nums font-semibold text-slate-700">{fmt(subtotal)}</span>
                    </div>
                    {discAmt > 0 && (
                      <div className="flex justify-between w-full text-xs text-green-600 font-semibold">
                        <span>Discount</span>
                        <span className="tabular-nums">− {fmt(discAmt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-full pt-1.5 border-t-2 border-[#1E3A8A] mt-1">
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] uppercase tracking-wide text-sm">Grand Total</span>
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#F97316] text-lg tabular-nums leading-tight">{fmt(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Print footer line */}
                <p className="text-center text-[10px] text-slate-300 font-medium mt-3 tracking-widest uppercase">
                  Thank you for shopping at Khulna Hardware Mart · Centenary Est. 1924
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Invoice;