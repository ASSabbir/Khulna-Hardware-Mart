import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  FiSearch, FiPlus, FiTrash2, FiPrinter, FiFileText,
  FiPackage, FiUser, FiPhone, FiHash, FiAlertTriangle,
  FiCheckCircle, FiX, FiEdit2, FiShoppingCart, FiLoader,
  FiSave, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiDollarSign, FiSmartphone, FiCreditCard, FiPlusCircle,
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

// 👉 New: mobile banking providers + banks for the payment method section
const MOBILE_BANKING_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const BANK_OPTIONS = ["Dutch-Bangla Bank", "Islami Bank Bangladesh", "City Bank Limited"];

// 👉 localStorage persistence key + helpers
const DRAFT_KEY = "khm_invoice_draft_v1";

const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveDraft = (data) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // ignore quota/serialization errors
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
};

// 👉 New: partner logos printed at the bottom of the invoice.
// Replace `src` with your real partner logo file paths/URLs when ready.
const PARTNER_LOGOS = [
  { name: "Partner 1", src: "" },
  { name: "Partner 2", src: "" },
  { name: "Partner 3", src: "" },
];

/* ══════════════════════════════════════════════════════════════
   Invoice Component
══════════════════════════════════════════════════════════════════ */
const Invoice = () => {
  /* ── Load persisted draft once (runs before first render of dependent state) ── */
  const draft = loadDraft() || {};

  /* ── State ──────────────────────────────────────────────── */
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  // Memo (right side) — restored from localStorage if present
  const [memoItems, setMemoItems] = useState(draft.memoItems || []);
  const [customer, setCustomer] = useState(draft.customer || { name: "", phone: "", address: "" });
  const [invoiceNum, setInvoiceNum] = useState(draft.invoiceNum || invoiceNo());
  const [invoiceDate, setInvoiceDate] = useState(draft.invoiceDate || today());
  const [discount, setDiscount] = useState(draft.discount || "");
  const [priceType, setPriceType] = useState(draft.priceType || "retail");
  const [toast, setToast] = useState(null);

  // VAT toggle
  const [vatEnabled, setVatEnabled] = useState(draft.vatEnabled || false);

  // Payment method (single / non-split flow) — card removed, bank uses dropdown
  const [paymentMethod, setPaymentMethod] = useState(draft.paymentMethod || "cash"); // cash | mobile | bank
  const [mobileProvider, setMobileProvider] = useState(draft.mobileProvider || MOBILE_BANKING_PROVIDERS[0]);
  const [mobileNumber, setMobileNumber] = useState(draft.mobileNumber || "");
  const [bankName, setBankName] = useState(draft.bankName || BANK_OPTIONS[0]);
  const [bankAccountNumber, setBankAccountNumber] = useState(draft.bankAccountNumber || "");

  // Payment status: paid (default) or due
  const [paymentStatus, setPaymentStatus] = useState(draft.paymentStatus || "paid"); // paid | due
  const [paidNowAmount, setPaidNowAmount] = useState(draft.paidNowAmount || "");

  // Split payment toggle
  const [splitPayment, setSplitPayment] = useState(draft.splitPayment || false);
  const emptySplitRow = () => ({
    id: Date.now() + Math.random(),
    method: "cash",
    amount: "",
    provider: MOBILE_BANKING_PROVIDERS[0],
    bankName: BANK_OPTIONS[0],
    accountNumber: "",
    mobileNumber: "",
  });
  const [splitRows, setSplitRows] = useState(
    Array.isArray(draft.splitRows) && draft.splitRows.length > 0 ? draft.splitRows : [emptySplitRow()]
  );

  // Custom product form (left panel, below the product list) — not persisted (transient input)
  const [customProduct, setCustomProduct] = useState({ name: "", qty: 1, unitPrice: "" });

  // Auto-fill customer name/address when a matching phone number is found
  const [customerLookupStatus, setCustomerLookupStatus] = useState(""); // "" | "found" | "notfound"
  const debouncedPhone = useDebounce(customer.phone, 500);

  const printRef = useRef(null);

  /* ── Persist draft to localStorage whenever relevant state changes ── */
  useEffect(() => {
    saveDraft({
      memoItems,
      customer,
      invoiceNum,
      invoiceDate,
      discount,
      priceType,
      vatEnabled,
      paymentMethod,
      mobileProvider,
      mobileNumber,
      bankName,
      bankAccountNumber,
      paymentStatus,
      paidNowAmount,
      splitPayment,
      splitRows,
    });
  }, [
    memoItems, customer, invoiceNum, invoiceDate, discount, priceType, vatEnabled,
    paymentMethod, mobileProvider, mobileNumber, bankName, bankAccountNumber,
    paymentStatus, paidNowAmount, splitPayment, splitRows,
  ]);

  /* ── Auto-fill customer by phone number ─────────────────── */
  useEffect(() => {
    const phone = (debouncedPhone || "").trim();
    if (phone.length < 6) { setCustomerLookupStatus(""); return; }

    let cancelled = false;
    axios.get(`http://localhost:5000/api/customers?search=${encodeURIComponent(phone)}`)
      .then((res) => {
        if (cancelled) return;
        const match = (res.data.customers || []).find((c) => c.phone === phone);
        if (match) {
          setCustomer((c) => ({
            ...c,
            name: c.name?.trim() ? c.name : (match.name || ""),
            address: c.address?.trim() ? c.address : (match.address || ""),
          }));
          setCustomerLookupStatus("found");
        } else {
          setCustomerLookupStatus("notfound");
        }
      })
      .catch(() => { if (!cancelled) setCustomerLookupStatus(""); });

    return () => { cancelled = true; };
  }, [debouncedPhone]);

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
        unit: p.unit || "pcs",
        price: getPrice(p),
        qty: 1,
        stock: p.stock,
        suppliers: p.suppliers || [],
        preferredSupplierId: "",
        custom: false,
      }];
    });
    showToast("success", `${p.name} added to memo.`);
  };

  /* ── New: Add a custom (off-catalog) product from the form below the product list ── */
  const addCustomProductToMemo = () => {
    const name = customProduct.name.trim();
    const qty = parseInt(customProduct.qty) || 1;
    const unitPrice = parseFloat(customProduct.unitPrice) || 0;

    if (!name) { showToast("error", "Enter a product name first."); return; }
    if (unitPrice <= 0) { showToast("error", "Enter a valid unit price."); return; }

    setMemoItems(prev => [...prev, {
      productId: null,
      id: "custom-" + Date.now(),
      name,
      company: "Custom",
      unit: "pcs",
      price: unitPrice,
      qty,
      stock: null,
      custom: true,
    }]);
    showToast("success", `${name} added to memo.`);
    setCustomProduct({ name: "", qty: 1, unitPrice: "" });
  };

  /* ── Update memo item ───────────────────────────────────── */
 const updateItem = (id, field, value) => {
    setMemoItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      if (field === "preferredSupplierId") {
        const updated = { ...i, preferredSupplierId: value };
        const max = getMaxQtyForItem(updated, prev);
        return { ...updated, qty: max > 0 ? Math.min(i.qty, max) : 0 };
      }
      if (field === "qty" && !i.custom) {
        const max = getMaxQtyForItem(i, prev);
        const parsed = parseInt(value) || 0;
        const newQty = max > 0 ? Math.max(1, Math.min(parsed, max)) : 0;
        return { ...i, qty: newQty };
      }
      return { ...i, [field]: value };
    }));
  };

   const removeItem = (id) => setMemoItems(prev => prev.filter(i => i.id !== id));

  const getMaxQtyForItem = (item, itemsList) => {
    if (item.custom) return 9999;
    const others = itemsList.filter(i => i.id !== item.id && i.productId === item.productId);
    if (item.preferredSupplierId) {
      const sup = (item.suppliers || []).find(s => s.supplierId === item.preferredSupplierId);
      const supStock = sup ? sup.availableQuantity : 0;
      const usedBySameSupplier = others
        .filter(i => (i.preferredSupplierId || "") === item.preferredSupplierId)
        .reduce((s, i) => s + i.qty, 0);
      return Math.max(0, supStock - usedBySameSupplier);
    }
    const usedTotal = others.reduce((s, i) => s + i.qty, 0);
    return Math.max(0, (item.stock || 0) - usedTotal);
  };

  const getSupplierRemaining = (item, supplierId) => {
    const sup = (item.suppliers || []).find(s => s.supplierId === supplierId);
    if (!sup) return 0;
    const usedElsewhere = memoItems
      .filter(i => i.id !== item.id && i.productId === item.productId && (i.preferredSupplierId || "") === supplierId)
      .reduce((s, i) => s + i.qty, 0);
    return Math.max(0, sup.availableQuantity - usedElsewhere);
  };

  const addSupplierLine = (item) => {
    setMemoItems(prev => [...prev, {
      ...item,
      id: item.productId + "-" + Date.now(),
      preferredSupplierId: "",
      qty: 1,
    }]);
  };

  /* ── Totals ─────────────────────────────────────────────── */
  const subtotal = memoItems.reduce((s, i) => s + (i.price * i.qty), 0);
  const discAmt = Math.min(parseFloat(discount) || 0, subtotal);
  // 👉 New: VAT is 5% of the post-discount amount, added on top when enabled
  const vatAmt = vatEnabled ? +((subtotal - discAmt) * 0.05).toFixed(2) : 0;
  const grandTotal = +(subtotal - discAmt + vatAmt).toFixed(2);

  // Amount expected to be collected right now
  const expectedPaidAmount = paymentStatus === "due"
    ? Math.min(Math.max(parseFloat(paidNowAmount) || 0, 0), grandTotal)
    : grandTotal;
  const dueBalance = Math.max(0, +(grandTotal - expectedPaidAmount).toFixed(2));

  const splitTotal = +splitRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0).toFixed(2);
  const splitMismatch = splitPayment && Math.abs(splitTotal - expectedPaidAmount) > 0.01;

  const addSplitRow = () => setSplitRows((prev) => [...prev, emptySplitRow()]);
  const removeSplitRow = (id) => setSplitRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);
  const updateSplitRow = (id, field, value) =>
    setSplitRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const validateSplitAmounts = () => {
    for (const r of splitRows) {
      const amt = parseFloat(r.amount);
      if (isNaN(amt) || amt < 0) return "Split payment amounts must be valid non-negative numbers.";
    }
    return null;
  };

  /* ── Toast ──────────────────────────────────────────────── */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Complete Sale ──────────────────────────────────────── */
 const buildPayments = () => {
    if (splitPayment) {
      return splitRows
        .filter((r) => (parseFloat(r.amount) || 0) > 0)
        .map((r) => ({
          method: r.method,
          amount: +parseFloat(r.amount).toFixed(2),
          provider: r.method === "mobile" ? r.provider : null,
          accountNumber: r.method === "bank" ? r.accountNumber : "",
          bankName: r.method === "bank" ? r.bankName : "",
          mobileNumber: r.method === "mobile" ? r.mobileNumber : "",
        }));
    }
    return [{
      method: paymentMethod,
      amount: +expectedPaidAmount.toFixed(2),
      provider: paymentMethod === "mobile" ? mobileProvider : null,
      accountNumber: paymentMethod === "bank" ? bankAccountNumber : "",
      bankName: paymentMethod === "bank" ? bankName : "",
      mobileNumber: paymentMethod === "mobile" ? mobileNumber : "",
    }];
  };

  const handleCompleteSale = async () => {
     if (memoItems.length === 0) {
      showToast("error", "Add at least one product to complete sale.");
      return;
    }
    for (const item of memoItems) {
      if (item.custom) continue;
      const max = getMaxQtyForItem(item, memoItems);
      if (item.qty > max) {
        const supName = item.preferredSupplierId
          ? ((item.suppliers || []).find(s => s.supplierId === item.preferredSupplierId)?.supplierName || "selected supplier")
          : "available stock";
        showToast("error", `${item.name}: quantity exceeds ${supName} (max ${max}).`);
        return;
      }
    }
    if (!customer.name.trim()) {
      showToast("error", "Please enter customer name.");
      return;
    }
    if (paymentStatus === "due" && expectedPaidAmount <= 0) {
      showToast("error", "Enter the amount the customer is paying now.");
      return;
    }
    if (paymentStatus === "due" && expectedPaidAmount >= grandTotal) {
      showToast("error", "Paid amount must be less than the grand total for a Due invoice.");
      return;
    }
    if (splitPayment && splitMismatch) {
      showToast("error", `Split payment total (৳${splitTotal}) must equal ৳${expectedPaidAmount.toFixed(2)}.`);
      return;
    }
    if (splitPayment) {
      const splitAmtError = validateSplitAmounts();
      if (splitAmtError) { showToast("error", splitAmtError); return; }
      const invalidMobile = splitRows.some((r) => (parseFloat(r.amount) || 0) > 0 && r.method === "mobile" && !r.mobileNumber.trim());
      if (invalidMobile) { showToast("error", "Enter mobile number for each mobile banking split."); return; }
      const invalidBank = splitRows.some((r) => (parseFloat(r.amount) || 0) > 0 && r.method === "bank" && !r.accountNumber.trim());
      if (invalidBank) { showToast("error", "Enter bank account number for each bank split."); return; }
    } else {
      if (paymentMethod === "mobile" && !mobileNumber.trim()) { showToast("error", "Enter the mobile banking number."); return; }
      if (paymentMethod === "bank" && !bankAccountNumber.trim()) { showToast("error", "Enter the bank account number."); return; }
    }

    setSaving(true);
    try {
     const items = memoItems.map(item => ({
        productId: item.custom ? null : item.productId,
        custom: Boolean(item.custom),
        name: item.name,
        company: item.company,
        unit: item.unit || "pcs",
        price: item.price,
        qty: item.qty,
        total: item.price * item.qty,
        preferredSupplierId: item.custom ? null : (item.preferredSupplierId || null),
      }));

      const payments = buildPayments();

      // Create invoice
      await axios.post("http://localhost:5000/api/invoices", {
        invoiceNumber: invoiceNum,
        invoiceDate,
        customer,
        items,
        subtotal,
        discount: discAmt,
        vat: vatAmt,
        grandTotal,
        priceType,
        paymentStatus,
        paidAmount: expectedPaidAmount,
        splitPayment,
        payments,
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
      // Reset form + clear persisted draft since the sale is finalized
      clearDraft();
      setMemoItems([]);
      setCustomer({ name: "", phone: "", address: "" });
      setDiscount("");
      setVatEnabled(false);
      setPaymentMethod("cash");
      setMobileNumber("");
      setBankName(BANK_OPTIONS[0]);
      setBankAccountNumber("");
      setPaymentStatus("paid");
      setPaidNowAmount("");
      setSplitPayment(false);
      setSplitRows([emptySplitRow()]);
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
    clearDraft();
    setMemoItems([]);
    setCustomer({ name: "", phone: "", address: "" });
    setDiscount("");
    setVatEnabled(false);
    setPaymentMethod("cash");
    setMobileNumber("");
    setBankName(BANK_OPTIONS[0]);
    setBankAccountNumber("");
    setPaymentStatus("paid");
    setPaidNowAmount("");
    setSplitPayment(false);
    setSplitRows([emptySplitRow()]);
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

          {/* ══════════════════════════════════════
               NEW — Custom Product section
               (very bottom of the left/product column)
          ══════════════════════════════════════ */}
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FiPlusCircle size={15} className="text-[#1E3A8A]"/>
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-sm uppercase tracking-wide">Add Custom Product</h3>
            </div>
            <input
              type="text"
              placeholder="Product name"
              value={customProduct.name}
              onChange={e => setCustomProduct(c => ({ ...c, name: e.target.value }))}
              className="w-full text-sm border-2 border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={customProduct.qty}
                onChange={e => setCustomProduct(c => ({ ...c, qty: e.target.value }))}
                className="w-full text-sm border-2 border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]"
              />
              <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-[#1D4ED8] transition-colors">
                <span className="px-2 text-xs text-slate-400 bg-slate-50 border-r border-slate-200 h-full flex items-center">৳</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Unit price"
                  value={customProduct.unitPrice}
                  onChange={e => setCustomProduct(c => ({ ...c, unitPrice: e.target.value }))}
                  className="w-full text-sm px-2 py-2 outline-none font-['Barlow',sans-serif]"
                />
              </div>
            </div>
            <button
              onClick={addCustomProductToMemo}
              className="flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
            >
              <FiPlus size={14}/> Add to Invoice
            </button>
          </div>
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

            {/* NEW — Print-only centered logo + shop name header (hidden on screen, shown only when printing) */}
            <div className="hidden print:flex flex-col items-center gap-2 pt-2 pb-4 border-b-2 border-slate-100">
              <div className="w-14 h-14 bg-[#F97316] rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🔧</span>
              </div>
              <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-xl uppercase tracking-widest leading-tight text-center">
                Khulna <span className="text-[#F97316]">Hardware</span> Mart
              </p>
              <p className="text-slate-400 text-[10px] font-medium text-center max-w-md">
                280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna · 02477-721990, +880 1931-272839, +880 1679-123205
              </p>
            </div>

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
                { icon: <FiPhone size={12}/>, key: "phone", placeholder: "Phone Number (auto-fills name)", label: "Phone" },
                { icon: <FiSearch size={12}/>, key: "address", placeholder: "Address (optional)", label: "Address" },
              ].map(f => (
                <div key={f.key} className={`flex items-center gap-2 bg-white border-2 rounded-lg px-3 py-2 focus-within:border-[#1D4ED8] transition-colors ${f.key === "phone" && customerLookupStatus === "found" ? "border-green-400" : "border-slate-200"}`}>
                  <span className="text-slate-400 shrink-0">{f.icon}</span>
                  <input
                    placeholder={f.placeholder}
                    value={customer[f.key]}
                    onChange={e => {
                      setCustomer(c => ({ ...c, [f.key]: e.target.value }));
                      if (f.key === "phone") setCustomerLookupStatus("");
                    }}
                    className="flex-1 text-xs outline-none text-[#1E293B] placeholder-slate-400 bg-transparent font-['Barlow',sans-serif]"
                  />
                  {f.key === "phone" && customerLookupStatus === "found" && (
                    <FiCheckCircle size={13} className="text-green-500 shrink-0" title="Existing customer found" />
                  )}
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
                          {!item.custom && Array.isArray(item.suppliers) && item.suppliers.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <select
                                value={item.preferredSupplierId || ""}
                                onChange={e => updateItem(item.id, "preferredSupplierId", e.target.value)}
                                title="Sell from a specific supplier's stock, or leave Auto for FIFO"
                                className="text-[10px] font-semibold border border-slate-200 rounded px-1.5 py-1 outline-none bg-slate-50 focus:border-[#1D4ED8] max-w-[180px] font-['Barlow',sans-serif]"
                              >
                                <option value="">Auto (FIFO)</option>
                                {item.suppliers.map(s => {
                                  const remaining = getSupplierRemaining(item, s.supplierId);
                                  if (remaining <= 0 && s.supplierId !== item.preferredSupplierId) return null;
                                  return (
                                    <option key={s.supplierId} value={s.supplierId} disabled={remaining <= 0}>
                                      {s.supplierName} — ৳{s.buyingPrice} ({remaining} left)
                                    </option>
                                  );
                                })}
                              </select>
                              {item.suppliers.some(s => s.supplierId !== item.preferredSupplierId && getSupplierRemaining(item, s.supplierId) > 0) && (
                                <button
                                  type="button"
                                  onClick={() => addSupplierLine(item)}
                                  title="Add another line for this product from a different supplier"
                                  className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:border-[#1D4ED8] hover:text-[#1D4ED8] shrink-0"
                                >
                                  <FiPlus size={10}/>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            max={getMaxQtyForItem(item, memoItems)}
                            value={item.qty}
                            onChange={e => updateItem(item.id, "qty", e.target.value)}
                            className="w-16 text-center border-2 border-slate-200 rounded-lg py-1 text-sm font-semibold text-[#1E293B] outline-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]"
                          />
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5">{item.unit || "pcs"}</p>
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
                  {/* Discount input + NEW VAT checkbox */}
                  <div className="flex flex-col gap-3">
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
                    {/* NEW — VAT (5%) checkbox */}
                    <label className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A] uppercase tracking-wider cursor-pointer print:cursor-default select-none">
                      <input
                        type="checkbox"
                        checked={vatEnabled}
                        onChange={e => setVatEnabled(e.target.checked)}
                        className="w-4 h-4 accent-[#1E3A8A]"
                      />
                      Add VAT (5%)
                    </label>
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
                    {vatEnabled && (
                      <div className="flex justify-between w-full text-xs text-slate-500 font-semibold">
                        <span>VAT (5%)</span>
                        <span className="tabular-nums">+ {fmt(vatAmt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-full pt-1.5 border-t-2 border-[#1E3A8A] mt-1">
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] uppercase tracking-wide text-sm">Grand Total</span>
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#F97316] text-lg tabular-nums leading-tight">{fmt(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Status: Paid / Due */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">Payment Status</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPaymentStatus("paid")}
                        className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentStatus === "paid" ? "border-green-600 bg-green-600 text-white" : "border-slate-200 text-slate-500"}`}>
                        Paid
                      </button>
                      <button type="button" onClick={() => setPaymentStatus("due")}
                        className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentStatus === "due" ? "border-red-500 bg-red-500 text-white" : "border-slate-200 text-slate-500"}`}>
                        Due
                      </button>
                    </div>
                  </div>
                  {paymentStatus === "due" && (
                    <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-lg px-3 py-2">
                      <label className="text-xs font-bold text-red-600 whitespace-nowrap">Paying Now (৳)</label>
                      <input
                        type="number" min="0" max={grandTotal} step="0.01"
                        value={paidNowAmount}
                        onChange={e => setPaidNowAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 border-2 border-red-200 rounded-lg px-2 py-1.5 text-sm font-semibold outline-none focus:border-red-500 bg-white font-['Barlow',sans-serif]"
                      />
                      <span className="text-xs font-bold text-red-600 whitespace-nowrap">Due: ৳{dueBalance.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Payment Method / Split Payment */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">Payment Method</label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A] uppercase tracking-wider cursor-pointer select-none">
                      <input type="checkbox" checked={splitPayment} onChange={e => setSplitPayment(e.target.checked)} className="w-4 h-4 accent-[#1E3A8A]" />
                      Split Payment
                    </label>
                  </div>

                  {!splitPayment ? (
                    <div className="flex flex-col gap-2">
                       <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setPaymentMethod("cash")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentMethod === "cash" ? "border-green-600 bg-green-600 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                          <FiDollarSign size={13}/> Cash
                        </button>
                        <button type="button" onClick={() => setPaymentMethod("mobile")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentMethod === "mobile" ? "border-[#1D4ED8] bg-[#1D4ED8] text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                          <FiSmartphone size={13}/> Mobile Banking
                        </button>
                        <button type="button" onClick={() => setPaymentMethod("bank")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentMethod === "bank" ? "border-purple-600 bg-purple-600 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                          <FiCreditCard size={13}/> Bank
                        </button>
                      </div>

                      {paymentMethod === "mobile" && (
                        <div className="flex flex-wrap gap-2">
                          <select value={mobileProvider} onChange={e => setMobileProvider(e.target.value)}
                            className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#1D4ED8] bg-white font-['Barlow',sans-serif]">
                            {MOBILE_BANKING_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <input type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)}
                            placeholder="Payment number e.g. 01711-000000"
                            className="flex-1 min-w-[180px] text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#1D4ED8] bg-white font-['Barlow',sans-serif]" />
                        </div>
                      )}
                      {paymentMethod === "bank" && (
                        <div className="flex flex-wrap gap-2">
                          <select value={bankName} onChange={e => setBankName(e.target.value)}
                            className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-purple-600 bg-white font-['Barlow',sans-serif]">
                            {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                          <input type="text" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)}
                            placeholder="Bank account number"
                            className="flex-1 min-w-[180px] text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-purple-600 bg-white font-['Barlow',sans-serif]" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {splitRows.map((row) => (
                        <div key={row.id} className="flex flex-wrap items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-lg p-2">
                          <select value={row.method} onChange={e => updateSplitRow(row.id, "method", e.target.value)}
                            className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]">
                            <option value="cash">Cash</option>
                            <option value="mobile">Mobile Banking</option>
                            <option value="bank">Bank</option>
                          </select>
                          <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
                            <span className="px-2 text-xs text-slate-400">৳</span>
                            <input type="number" min="0" step="0.01" value={row.amount}
                              onChange={e => updateSplitRow(row.id, "amount", e.target.value)}
                              placeholder="0.00" className="w-24 px-1 py-1.5 text-xs font-semibold outline-none font-['Barlow',sans-serif]" />
                          </div>
                          {row.method === "mobile" && (
                            <>
                              <select value={row.provider} onChange={e => updateSplitRow(row.id, "provider", e.target.value)}
                                className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]">
                                {MOBILE_BANKING_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                              <input type="text" value={row.mobileNumber} onChange={e => updateSplitRow(row.id, "mobileNumber", e.target.value)}
                                placeholder="Mobile number"
                                className="flex-1 min-w-[120px] text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]" />
                            </>
                          )}
                         {row.method === "bank" && (
                            <>
                              <select value={row.bankName} onChange={e => updateSplitRow(row.id, "bankName", e.target.value)}
                                className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]">
                                {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                              <input type="text" value={row.accountNumber} onChange={e => updateSplitRow(row.id, "accountNumber", e.target.value)}
                                placeholder="Account number"
                                className="flex-1 min-w-[120px] text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]" />
                            </>
                          )}
                          <button type="button" onClick={() => removeSplitRow(row.id)}
                            className="ml-auto w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <FiX size={14}/>
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addSplitRow}
                        className="flex items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 rounded-lg py-2 text-xs font-bold text-slate-500 hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors">
                        <FiPlus size={13}/> Add Payment Method
                      </button>
                      <div className={`flex items-center justify-between text-xs font-bold px-1 ${splitMismatch ? "text-red-600" : "text-green-600"}`}>
                        <span>Split Total: ৳{splitTotal.toFixed(2)}</span>
                        <span>Required: ৳{expectedPaidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Print footer line */}
                <p className="text-center text-[10px] text-slate-300 font-medium mt-3 tracking-widest uppercase">
                  Thank you for shopping at Khulna Hardware Mart · Centenary Est. 1924
                </p>
              </div>
            )}

            {/* NEW — Print-only partner logos footer (hidden on screen, shown only when printing) */}
            <div className="hidden print:flex flex-col items-center gap-2 px-5 pb-4 pt-2 border-t border-slate-100">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Our Partners</p>
              <div className="flex items-center justify-center gap-4">
                {PARTNER_LOGOS.map(partner => (
                  <div key={partner.name} className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {partner.src ? (
                      <img src={partner.src} alt={partner.name} className="w-full h-full object-contain p-1"/>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-semibold text-center px-1">{partner.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Invoice;