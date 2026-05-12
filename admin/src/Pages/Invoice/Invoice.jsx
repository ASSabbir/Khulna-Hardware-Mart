import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  FiSearch, FiPlus, FiTrash2, FiPrinter, FiFileText,
  FiPackage, FiUser, FiPhone, FiHash, FiAlertTriangle,
  FiCheckCircle, FiX, FiEdit2, FiShoppingCart, FiLoader,
  FiSave, FiChevronRight, FiChevronsLeft, FiChevronsRight,
} from "react-icons/fi";

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = () => new Date().toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });

const invoiceNo = () => "INV-" + Date.now().toString().slice(-6);

// Debounce hook
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

/* ══════════════════════════════════════════════════════════════
   Invoice Component
══════════════════════════════════════════════════════════════════ */
const Invoice = () => {
  /* ── State ──────────────────────────────────────────────── */
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  // Memo (right side)
  const [memoItems, setMemoItems] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [invoiceNum, setInvoiceNum] = useState(invoiceNo());
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [discount, setDiscount] = useState("");
  const [priceType, setPriceType] = useState("retail");
  const [toast, setToast] = useState(null);

  const printRef = useRef(null);

  /* ── Fetch products ─────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        limit: 30,
        search: debouncedSearch,
      });
      const res = await axios.get(`http://localhost:5000/api/products?${params}`);
      setProducts(res.data.products);
      setTotalProducts(res.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Price selector ─────────────────────────────────────── */
  const getPrice = (p) => {
    const b = parseFloat(p.buyingPrice) || 0;
    if (priceType === "holcell") return p.holcellPrice || +(b * 1.03).toFixed(2);
    if (priceType === "retail") return p.retailPrice || +(b * 1.05).toFixed(2);
    return b;
  };

  /* ── Add product to memo ────────────────────────────────── */
  const addToMemo = (p) => {
    // Check stock
    if (p.stock <= 0) {
      showToast("error", `${p.name} is out of stock!`);
      return;
    }

    setMemoItems(prev => {
      const exists = prev.find(i => i.productId === p._id);
      if (exists) {
        showToast("info", `${p.name} already in memo — adjust qty below.`);
        return prev;
      }
      return [...prev, {
        productId: p._id,
        id: p._id,
        name: p.name,
        company: p.brand || p.company || "—",
        price: getPrice(p),
        qty: 1,
        stock: p.stock,
        custom: false,
      }];
    });
    showToast("success", `${p.name} added to memo.`);
  };

  /* ── Update memo item ───────────────────────────────────── */
  const updateItem = (id, field, value) => {
    setMemoItems(prev => prev.map(i => {
      if (i.id === id) {
        // Check stock limit
        if (field === "qty" && !i.custom) {
          const maxQty = i.stock || 999;
          const newQty = Math.min(parseInt(value) || 1, maxQty);
          return { ...i, [field]: newQty };
        }
        return { ...i, [field]: value };
      }
      return i;
    }));
  };

  const removeItem = (id) => setMemoItems(prev => prev.filter(i => i.id !== id));

  /* ── Totals ─────────────────────────────────────────────── */
  const subtotal = memoItems.reduce((s, i) => s + (i.price * i.qty), 0);
  const discAmt = Math.min(parseFloat(discount) || 0, subtotal);
  const grandTotal = subtotal - discAmt;

  /* ── Toast ──────────────────────────────────────────────── */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Complete Sale ──────────────────────────────────────── */
  const handleCompleteSale = async () => {
    if (memoItems.length === 0) {
      showToast("error", "Add at least one product to complete sale.");
      return;
    }
    if (!customer.name.trim()) {
      showToast("error", "Please enter customer name.");
      return;
    }

    setSaving(true);
    try {
      const items = memoItems.map(item => ({
        productId: item.custom ? null : item.productId,
        name: item.name,
        company: item.company,
        price: item.price,
        qty: item.qty,
        total: item.price * item.qty,
      }));

      // Create invoice
      await axios.post("http://localhost:5000/api/invoices", {
        invoiceNumber: invoiceNum,
        invoiceDate,
        customer,
        items,
        subtotal,
        discount: discAmt,
        grandTotal,
        priceType,
      });

      // Create or update customer in database
      try {
        const customerData = {
          name: customer.name,
          phone: customer.phone || "",
          email: "",
          address: customer.address || "",
          totalSpent: grandTotal,
          totalOrders: 1,
          totalDue: 0,
          lastOrderDate: new Date(),
          status: "active",
        };
        await axios.post("http://localhost:5000/api/customers", customerData);
      } catch (custErr) {
        // Customer might already exist, try to update instead
        if (custErr.response?.status === 500 && custErr.response?.data?.message?.includes("duplicate")) {
          // Find existing customer by name and update their stats
          try {
            const searchRes = await axios.get(`http://localhost:5000/api/customers?search=${encodeURIComponent(customer.name)}`);
            const existingCustomer = searchRes.data.customers.find(c => c.name.toLowerCase() === customer.name.toLowerCase());
            if (existingCustomer) {
              await axios.put(`http://localhost:5000/api/customers/${existingCustomer._id}`, {
                totalSpent: (existingCustomer.totalSpent || 0) + grandTotal,
                totalOrders: (existingCustomer.totalOrders || 0) + 1,
                lastOrderDate: new Date(),
              });
            }
          } catch (updateErr) {
            console.log("Customer update skipped:", updateErr.message);
          }
        }
      }

      showToast("success", "Sale completed! Stock & customer updated.");
      // Reset form
      setMemoItems([]);
      setCustomer({ name: "", phone: "", address: "" });
      setDiscount("");
      setInvoiceNum(invoiceNo());
      // Refresh products to show updated stock
      fetchProducts();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to complete sale.");
    } finally {
      setSaving(false);
    }
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

  /* ── Pagination ─────────────────────────────────────────── */
  const totalPages = Math.ceil(totalProducts / 30);
  const pageButtons = () => {
    const btns = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) btns.push(i);
    return btns;
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

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-col xl:flex-row gap-5 font-['Barlow',sans-serif] min-h-[calc(100vh-80px)]">

        {/* ══════════════════════════════════════
             LEFT — Product Picker
        ══════════════════════════════════════ */}
        <div className="xl:w-120 shrink-0 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1E3A8A] rounded-lg flex items-center justify-center shrink-0">
                <FiPackage size={16} className="text-white"/>
              </div>
              <div>
                <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-base uppercase tracking-wide leading-tight">Products</h2>
                <p className="text-[10px] text-slate-400 font-medium">{totalProducts.toLocaleString()} items</p>
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
            <FiSearch size={15} className="text-slate-400 shrink-0"/>
            <input
              type="text"
              placeholder="Search product name, brand, SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none text-[#1E293B] placeholder-slate-400 bg-transparent font-['Barlow',sans-serif]"
            />
            {search && <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500"><FiX size={13}/></button>}
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[calc(100vh-320px)] pr-1">
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
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm font-medium">No products found.</div>
            )}
            {!loading && !error && products.map(p => {
              const price = getPrice(p);
              const inMemo = memoItems.some(i => i.productId === p._id);
              const lowStock = p.stock <= 10;
              return (
                <div key={p._id}
                  className={`group flex items-center gap-3 bg-white border-2 rounded-xl px-4 py-3 transition-all duration-150 ${
                    inMemo ? "border-[#F97316] bg-[#FFF7ED]" : "border-slate-200 hover:border-[#1D4ED8]"
                  }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E293B] truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] px-1.5 py-0.5 rounded border border-[#BFDBFE]">{p.brand || p.company || "—"}</span>
                      <span className="text-[10px] font-bold text-[#F97316]">{fmt(price)}</span>
                      {lowStock && <span className="text-[10px] font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">Low: {p.stock}</span>}
                      {p.stock === 0 && <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Out</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => addToMemo(p)}
                    disabled={inMemo || p.stock === 0}
                    className={`shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      inMemo || p.stock === 0
                        ? "border-[#F97316] bg-[#F97316] text-white cursor-default"
                        : "border-slate-200 text-slate-400 hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                    }`}>
                    <FiPlus size={14}/>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-[#1E3A8A] disabled:opacity-40"
              >
                <FiChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-slate-200 text-slate-500 hover:text-[#1E3A8A] disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-slate-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-slate-200 text-slate-500 hover:text-[#1E3A8A] disabled:opacity-40"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-[#1E3A8A] disabled:opacity-40"
              >
                <FiChevronsRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
             RIGHT — Memo / Invoice
        ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Invoice header controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#F97316] rounded-lg flex items-center justify-center shrink-0">
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
                onClick={handleCompleteSale}
                disabled={saving || memoItems.length === 0}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 border-2 border-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 hover:border-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? <FiLoader size={14} className="animate-spin" /> : <FiSave size={14} />}
                Complete Sale
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#1E3A8A] border-2 border-[#1E3A8A] text-white rounded-lg text-xs font-bold hover:bg-[#1D4ED8] hover:border-[#1D4ED8] transition-colors"
              >
                <FiPrinter size={14}/> Print
              </button>
            </div>
          </div>

          {/* ── PRINTABLE MEMO ── */}
          <div id="print-area" ref={printRef} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col flex-1">

            {/* Memo top bar */}
            <div className="bg-[#1E3A8A] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F97316] rounded-lg flex items-center justify-center shrink-0">
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
                { icon: <FiUser size={12}/>, key: "name", placeholder: "Customer Name *", label: "Customer" },
                { icon: <FiPhone size={12}/>, key: "phone", placeholder: "Phone Number", label: "Phone" },
                { icon: <FiSearch size={12}/>, key: "address", placeholder: "Address (optional)", label: "Address" },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-lg px-3 py-2 focus-within:border-[#1D4ED8] transition-colors">
                  <span className="text-slate-400 shrink-0">{f.icon}</span>
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
                          {!item.custom && item.stock && (
                            <p className="text-[10px] text-slate-400 mt-0.5">Stock: {item.stock}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            max={item.custom ? 9999 : item.stock}
                            value={item.qty}
                            onChange={e => updateItem(item.id, "qty", e.target.value)}
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
                              onChange={e => updateItem(item.id, "price", e.target.value)}
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