// FILE: src/Pages/Invoice/Invoice.jsx (FULL REPLACEMENT)
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  FiSearch, FiPlus, FiTrash2, FiPrinter, FiFileText,
  FiPackage, FiUser, FiPhone, FiHash, FiAlertTriangle,
  FiCheckCircle, FiX, FiEdit2, FiShoppingCart, FiLoader,
  FiSave, FiChevronsLeft, FiChevronsRight,
  FiDollarSign, FiSmartphone, FiCreditCard, FiPlusCircle,
} from "react-icons/fi";
import { loadDraft, saveDraft, clearDraft as clearAutosave, loadAllDrafts, saveAllDrafts, deleteDraftById, upsertDraft } from "../../utils/draftStorage";
import { buildChallanHTML } from "../../Print/challanTemplate";
import { openPrintWindow } from "../../Print/printUtils";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
const invoiceNo = () => "INV-" + Date.now().toString().slice(-6);

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const handler = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(handler); }, [value, delay]);
  return debounced;
};

const MOBILE_BANKING_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const BANK_OPTIONS = ["Dutch-Bangla Bank", "Islami Bank Bangladesh", "City Bank Limited"];
const PREPARED_BY_OPTIONS = ["Salesman 1", "Salesman 2", "Sakib", "Admin"];

const Invoice = () => {
  const draft = loadDraft() || {};
  const restoreParam = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("restore");
  let incomingDraft = null;
  if (restoreParam) {
    try { incomingDraft = JSON.parse(sessionStorage.getItem("khm_restore_draft") || "null"); } catch { incomingDraft = null; }
    sessionStorage.removeItem("khm_restore_draft");
  }
  const initialDraft = incomingDraft ? { ...draft, ...incomingDraft, invoiceNum: incomingDraft.draftNum || incomingDraft.invoiceNum, invoiceDate: incomingDraft.draftDate || incomingDraft.invoiceDate } : draft;

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const debouncedSearch = useDebounce(search, 300);

  const [memoItems, setMemoItems] = useState(initialDraft.memoItems || []);
  const [customer, setCustomer] = useState(initialDraft.customer || { name: "", phone: "", address: "" });
  const [invoiceNum, setInvoiceNum] = useState(initialDraft.invoiceNum || invoiceNo());
  const [invoiceDate, setInvoiceDate] = useState(initialDraft.invoiceDate || today());
  const [discount, setDiscount] = useState(initialDraft.discount || "");
  const [priceType, setPriceType] = useState(initialDraft.priceType || "retail");
  const [toast, setToast] = useState(null);

  const [vatEnabled, setVatEnabled] = useState(initialDraft.vatEnabled || false);
  const [customerType, setCustomerType] = useState(initialDraft.customerType || "retail");
  const [transportEnabled, setTransportEnabled] = useState(initialDraft.transportEnabled || false);
  const [transportCost, setTransportCost] = useState(initialDraft.transportCost || "");
  const [preparedBy, setPreparedBy] = useState(initialDraft.preparedBy || PREPARED_BY_OPTIONS[0]);
  const [isPreparedByOther, setIsPreparedByOther] = useState(initialDraft.isPreparedByOther || false);
  const [customPreparedBy, setCustomPreparedBy] = useState(initialDraft.customPreparedBy || "");

  const [paymentMethod, setPaymentMethod] = useState(initialDraft.paymentMethod || "cash");
  const [mobileProvider, setMobileProvider] = useState(initialDraft.mobileProvider || MOBILE_BANKING_PROVIDERS[0]);
  const [mobileNumber, setMobileNumber] = useState(initialDraft.mobileNumber || "");
  const [bankName, setBankName] = useState(initialDraft.bankName || BANK_OPTIONS[0]);
  const [bankAccountNumber, setBankAccountNumber] = useState(initialDraft.bankAccountNumber || "");

  const [paymentStatus, setPaymentStatus] = useState(initialDraft.paymentStatus || "paid");
  const [paidNowAmount, setPaidNowAmount] = useState(initialDraft.paidNowAmount || "");

  const [splitPayment, setSplitPayment] = useState(initialDraft.splitPayment || false);
  const emptySplitRow = () => ({ id: Date.now() + Math.random(), method: "cash", amount: "", provider: MOBILE_BANKING_PROVIDERS[0], bankName: BANK_OPTIONS[0], accountNumber: "", mobileNumber: "" });
  const [splitRows, setSplitRows] = useState(Array.isArray(initialDraft.splitRows) && initialDraft.splitRows.length > 0 ? initialDraft.splitRows : [emptySplitRow()]);

  const [customProduct, setCustomProduct] = useState({ name: "", qty: 1, unitPrice: "", shopName: "" });
  const [addingCustom, setAddingCustom] = useState(false);

  const [customerLookupStatus, setCustomerLookupStatus] = useState("");
  const debouncedPhone = useDebounce(customer.phone, 500);
  const printRef = useRef(null);

  const [savedDrafts, setSavedDrafts] = useState(loadAllDrafts());
  const refreshSavedDrafts = () => setSavedDrafts(loadAllDrafts());

  useEffect(() => {
    saveDraft({
      memoItems, customer, invoiceNum, invoiceDate, discount, priceType, vatEnabled,
      paymentMethod, mobileProvider, mobileNumber, bankName, bankAccountNumber,
      paymentStatus, paidNowAmount, splitPayment, splitRows,
      customerType, transportEnabled, transportCost, preparedBy, isPreparedByOther, customPreparedBy,
    });
  }, [memoItems, customer, invoiceNum, invoiceDate, discount, priceType, vatEnabled, paymentMethod, mobileProvider, mobileNumber, bankName, bankAccountNumber, paymentStatus, paidNowAmount, splitPayment, splitRows, customerType, transportEnabled, transportCost, preparedBy, isPreparedByOther, customPreparedBy]);

  useEffect(() => {
    const phone = (debouncedPhone || "").trim();
    if (phone.length < 6) { setCustomerLookupStatus(""); return; }
    let cancelled = false;
    axios.get(`http://localhost:5000/api/customers?search=${encodeURIComponent(phone)}`)
      .then((res) => {
        if (cancelled) return;
        const match = (res.data.customers || []).find((c) => c.phone === phone);
        if (match) {
          setCustomer((c) => ({ ...c, name: c.name?.trim() ? c.name : (match.name || ""), address: c.address?.trim() ? c.address : (match.address || "") }));
          setCustomerLookupStatus("found");
        } else setCustomerLookupStatus("notfound");
      }).catch(() => { if (!cancelled) setCustomerLookupStatus(""); });
    return () => { cancelled = true; };
  }, [debouncedPhone]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30, search: debouncedSearch });
      const res = await axios.get(`http://localhost:5000/api/products?${params}`);
      setProducts(res.data.products);
      setTotalProducts(res.data.pagination.total);
    } catch (err) { setError(err.response?.data?.message || "Failed to load products"); }
    finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const getPriceForType = (p, type) => {
    const b = parseFloat(p.buyingPrice) || 0;
    if (type === "holcell") return p.holcellPrice || +(b * 1.03).toFixed(2);
    if (type === "retail") return p.retailPrice || +(b * 1.05).toFixed(2);
    return b;
  };
  const getPrice = (p) => getPriceForType(p, priceType);

  const addToMemo = (p) => {
    if (p.stock <= 0) { showToast("error", `${p.name} is out of stock!`); return; }
    setMemoItems((prev) => {
      const exists = prev.find((i) => i.productId === p._id);
      if (exists) { showToast("info", `${p.name} already in memo — adjust qty below.`); return prev; }
      return [...prev, {
        productId: p._id, id: p._id, name: p.name, company: p.brand || p.company || "—", unit: p.unit || "pcs",
        price: customerType === "wholesale" ? getPriceForType(p, "holcell") : getPriceForType(p, "retail"),
        retailPriceValue: getPriceForType(p, "retail"), holcellPriceValue: getPriceForType(p, "holcell"),
        qty: 1, stock: p.stock, suppliers: p.suppliers || [], preferredSupplierId: "", custom: false,
      }];
    });
    showToast("success", `${p.name} added to memo.`);
  };

  // #15/#22/write-conflict fix — custom product now created in DB immediately (real productId),
  // appears in left product list right away, and uses the normal stock-deduction path at sale time.
  const addCustomProductToMemo = async () => {
    const name = customProduct.name.trim();
    const qty = parseInt(customProduct.qty) || 1;
    const unitPrice = parseFloat(customProduct.unitPrice) || 0;
    if (!name) { showToast("error", "Enter a product name first."); return; }
    if (unitPrice <= 0) { showToast("error", "Enter a valid unit price."); return; }

    setAddingCustom(true);
    try {
      const res = await axios.post("http://localhost:5000/api/products/custom-quick", { name, unitPrice, qty, shopName: customProduct.shopName.trim() });
      const product = res.data;
      setProducts((prev) => [product, ...prev.filter((p) => p._id !== product._id)]);
      setTotalProducts((t) => t + 1);
      setMemoItems((prev) => {
        const exists = prev.find((i) => i.productId === product._id);
        if (exists) return prev.map((i) => (i.productId === product._id ? { ...i, qty: i.qty + qty } : i));
        return [...prev, { productId: product._id, id: product._id, name: product.name, company: "Custom", unit: "pcs", price: unitPrice, retailPriceValue: unitPrice, holcellPriceValue: unitPrice, qty, stock: product.stock, suppliers: [], preferredSupplierId: "", custom: false }];
      });
      showToast("success", `${name} added to memo and saved to catalog.`);
      setCustomProduct({ name: "", qty: 1, unitPrice: "", shopName: "" });
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to add custom product.");
    } finally {
      setAddingCustom(false);
    }
  };

  useEffect(() => {
    setMemoItems((prev) => prev.map((i) => {
      if (i.custom) return i;
      const newPrice = customerType === "wholesale" ? (i.holcellPriceValue ?? i.price) : (i.retailPriceValue ?? i.price);
      return { ...i, price: newPrice };
    }));
  }, [customerType]); // eslint-disable-line

  const updateItem = (id, field, value) => {
    setMemoItems((prev) => prev.map((i) => {
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
  const removeItem = (id) => setMemoItems((prev) => prev.filter((i) => i.id !== id));

  const getMaxQtyForItem = (item, itemsList) => {
    if (item.custom) return 9999;
    const others = itemsList.filter((i) => i.id !== item.id && i.productId === item.productId);
    if (item.preferredSupplierId) {
      const sup = (item.suppliers || []).find((s) => s.supplierId === item.preferredSupplierId);
      const supStock = sup ? sup.availableQuantity : 0;
      const usedBySameSupplier = others.filter((i) => (i.preferredSupplierId || "") === item.preferredSupplierId).reduce((s, i) => s + i.qty, 0);
      return Math.max(0, supStock - usedBySameSupplier);
    }
    const usedTotal = others.reduce((s, i) => s + i.qty, 0);
    return Math.max(0, (item.stock || 0) - usedTotal);
  };
  const getSupplierRemaining = (item, supplierId) => {
    const sup = (item.suppliers || []).find((s) => s.supplierId === supplierId);
    if (!sup) return 0;
    const usedElsewhere = memoItems.filter((i) => i.id !== item.id && i.productId === item.productId && (i.preferredSupplierId || "") === supplierId).reduce((s, i) => s + i.qty, 0);
    return Math.max(0, sup.availableQuantity - usedElsewhere);
  };
  const addSupplierLine = (item) => setMemoItems((prev) => [...prev, { ...item, id: item.productId + "-" + Date.now(), preferredSupplierId: "", qty: 1 }]);

  const subtotal = memoItems.reduce((s, i) => s + i.price * i.qty, 0);
  const discAmt = Math.min(parseFloat(discount) || 0, subtotal);
  const vatAmt = vatEnabled ? +((subtotal - discAmt) * 0.05).toFixed(2) : 0;
  const transportAmt = transportEnabled ? Math.max(0, parseFloat(transportCost) || 0) : 0;
  const grandTotal = +(subtotal - discAmt + vatAmt + transportAmt).toFixed(2);

  const splitTotal = +splitRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0).toFixed(2);

  // #B — Paying Now auto-syncs from split total when split payment is used on a due invoice
  useEffect(() => {
    if (paymentStatus === "due" && splitPayment) setPaidNowAmount(String(splitTotal));
  }, [splitTotal, splitPayment, paymentStatus]);

  const expectedPaidAmount = paymentStatus === "due" ? Math.min(Math.max(parseFloat(paidNowAmount) || 0, 0), grandTotal) : grandTotal;
  const dueBalance = Math.max(0, +(grandTotal - expectedPaidAmount).toFixed(2));
  const splitMismatch = splitPayment && Math.abs(splitTotal - expectedPaidAmount) > 0.01;

  const addSplitRow = () => setSplitRows((prev) => [...prev, emptySplitRow()]);
  const removeSplitRow = (id) => setSplitRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  const updateSplitRow = (id, field, value) => setSplitRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const buildPayments = () => {
    if (splitPayment) {
      return splitRows.filter((r) => (parseFloat(r.amount) || 0) > 0).map((r) => ({
        method: r.method, amount: +parseFloat(r.amount).toFixed(2), provider: r.method === "mobile" ? r.provider : null,
        accountNumber: r.method === "bank" ? r.accountNumber : "", bankName: r.method === "bank" ? r.bankName : "", mobileNumber: r.method === "mobile" ? r.mobileNumber : "",
      }));
    }
    return [{ method: paymentMethod, amount: +expectedPaidAmount.toFixed(2), provider: paymentMethod === "mobile" ? mobileProvider : null, accountNumber: paymentMethod === "bank" ? bankAccountNumber : "", bankName: paymentMethod === "bank" ? bankName : "", mobileNumber: paymentMethod === "mobile" ? mobileNumber : "" }];
  };

  const handleCompleteSale = async () => {
    if (memoItems.length === 0) { showToast("error", "Add at least one product to complete sale."); return; }
    for (const item of memoItems) {
      if (item.custom) continue;
      const max = getMaxQtyForItem(item, memoItems);
      if (item.qty > max) { showToast("error", `${item.name}: quantity exceeds available stock (max ${max}).`); return; }
    }
    if (!customer.name.trim()) { showToast("error", "Please enter customer name."); return; }
    if (isPreparedByOther ? !customPreparedBy.trim() : !preparedBy) { showToast("error", "Prepared By is required."); return; }
    if (paymentStatus === "due" && expectedPaidAmount <= 0) { showToast("error", "Enter the amount the customer is paying now."); return; }
    if (paymentStatus === "due" && expectedPaidAmount >= grandTotal) { showToast("error", "Paid amount must be less than the grand total for a Due invoice."); return; }
    if (splitPayment && splitMismatch) { showToast("error", `Split payment total (৳${splitTotal}) must equal ৳${expectedPaidAmount.toFixed(2)}.`); return; }
    if (!splitPayment) {
      if (paymentMethod === "mobile" && !mobileNumber.trim()) { showToast("error", "Enter the mobile banking number."); return; }
      if (paymentMethod === "bank" && !bankAccountNumber.trim()) { showToast("error", "Enter the bank account number."); return; }
    }

    setSaving(true);
    try {
      const items = memoItems.map((item) => ({
        productId: item.productId || null, custom: false, name: item.name, company: item.company, unit: item.unit || "pcs",
        price: item.price, qty: item.qty, total: item.price * item.qty, preferredSupplierId: item.preferredSupplierId || null,
      }));
      const payments = buildPayments();

      await axios.post("http://localhost:5000/api/invoices", {
        invoiceNumber: invoiceNum, invoiceDate, customer, items, subtotal, discount: discAmt, vat: vatAmt, transportCost: transportAmt,
        grandTotal, priceType, paymentStatus, paidAmount: expectedPaidAmount, splitPayment, payments,
        preparedBy: isPreparedByOther ? customPreparedBy.trim() : preparedBy,
      });

      try {
        await axios.post("http://localhost:5000/api/customers", { name: customer.name, phone: customer.phone || "", email: "", address: customer.address || "", totalSpent: grandTotal, totalOrders: 1, totalDue: 0, lastOrderDate: new Date(), status: "active" });
      } catch (custErr) {
        try {
          const searchRes = await axios.get(`http://localhost:5000/api/customers?search=${encodeURIComponent(customer.name)}`);
          const existingCustomer = searchRes.data.customers.find((c) => c.name.toLowerCase() === customer.name.toLowerCase());
          if (existingCustomer) await axios.put(`http://localhost:5000/api/customers/${existingCustomer._id}`, { totalSpent: (existingCustomer.totalSpent || 0) + grandTotal, totalOrders: (existingCustomer.totalOrders || 0) + 1, lastOrderDate: new Date() });
        } catch {}
      }

      showToast("success", "Sale completed! Stock & customer updated.");
      deleteDraftById(invoiceNum);
      refreshSavedDrafts();
      clearAutosave();
      resetForm();
      fetchProducts();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to complete sale.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setMemoItems([]); setCustomer({ name: "", phone: "", address: "" }); setDiscount(""); setVatEnabled(false);
    setPaymentMethod("cash"); setMobileNumber(""); setBankName(BANK_OPTIONS[0]); setBankAccountNumber("");
    setPaymentStatus("paid"); setPaidNowAmount(""); setSplitPayment(false); setSplitRows([emptySplitRow()]); setInvoiceNum(invoiceNo());
    setCustomerType("retail"); setTransportEnabled(false); setTransportCost(""); setPreparedBy(PREPARED_BY_OPTIONS[0]); setIsPreparedByOther(false); setCustomPreparedBy("");
  };

  const handlePrint = () => { if (memoItems.length === 0) { showToast("error", "Add at least one product to print."); return; } window.print(); };
  const printChallan = () => {
    if (memoItems.length === 0) { showToast("error", "Add at least one product to print a challan."); return; }
    openPrintWindow(buildChallanHTML({ invoiceNum, customer, items: memoItems }));
  };

  const clearMemo = () => { clearAutosave(); resetForm(); };

  // #31 — Save/load draft directly from the main Invoice page
  const saveCurrentAsDraft = () => {
    if (memoItems.length === 0) { showToast("error", "Add at least one product before saving a draft."); return; }
    upsertDraft({ id: invoiceNum, draftNum: invoiceNum, draftDate: invoiceDate, memoItems, customer, discount, priceType, savedAt: new Date().toISOString() });
    refreshSavedDrafts();
    showToast("success", "Draft saved.");
  };
  const loadSavedDraft = (d) => {
    setMemoItems(d.memoItems || []); setCustomer(d.customer || { name: "", phone: "", address: "" });
    setDiscount(d.discount || ""); setPriceType(d.priceType || "retail"); setInvoiceNum(d.draftNum || invoiceNo());
    showToast("success", "Draft loaded.");
  };

  const totalPages = Math.ceil(totalProducts / 30);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow_Condensed:wght@600;700&display=swap" rel="stylesheet" />
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: fixed; top: 0; left: 0; width: 100%; background: white; z-index: 9999; padding: 24px; }
          @page { margin: 16mm 12mm 20mm 12mm; @bottom-right { content: "${invoiceNum} (Page " counter(page) " of " counter(pages) ")"; font-size: 9px; color: #64748b; } }
        }
        @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .toast-anim { animation: slideIn .25s ease; }
      `}</style>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 toast-anim flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold font-['Barlow',sans-serif] ${toast.type === "success" ? "bg-green-50 border-green-400 text-green-700" : toast.type === "error" ? "bg-red-50 border-red-300 text-red-700" : "bg-blue-50 border-blue-300 text-blue-700"}`}>
          {toast.type === "success" ? <FiCheckCircle size={15} /> : <FiAlertTriangle size={15} />} {toast.msg}
        </div>
      )}

      {savedDrafts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 font-['Barlow',sans-serif]">
          {savedDrafts.map((d) => (
            <div key={d.id} className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-xs">
              <button onClick={() => loadSavedDraft(d)} className="font-bold text-[#1E3A8A] hover:underline">{d.draftNum} · {d.memoItems.length} items · {d.customer?.name || "No customer"}</button>
              <button onClick={() => { deleteDraftById(d.id); refreshSavedDrafts(); }} className="text-red-400 hover:text-red-600"><FiX size={12} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-5 font-['Barlow',sans-serif] min-h-[calc(100vh-80px)]">
        {/* LEFT — sticky, independently scrolling product picker */}
        <div className="xl:w-120 shrink-0 flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-32px)]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1E3A8A] rounded-lg flex items-center justify-center shrink-0"><FiPackage size={16} className="text-white" /></div>
              <div><h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-base uppercase tracking-wide leading-tight">Products</h2><p className="text-[10px] text-slate-400 font-medium">{totalProducts.toLocaleString()} items</p></div>
            </div>
            <div className="flex items-center bg-white border-2 border-slate-200 rounded-lg overflow-hidden text-xs font-bold">
              {[["retail", "Retail"], ["holcell", "Wholesale"], ["buying", "Buying"]].map(([v, l]) => (
                <button key={v} onClick={() => setPriceType(v)} className={`px-3 py-1.5 transition-colors ${priceType === v ? "bg-[#1E3A8A] text-white" : "text-slate-500 hover:text-[#1E3A8A]"}`}>{l}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-[#1D4ED8] transition-colors">
            <FiSearch size={15} className="text-slate-400 shrink-0" />
            <input type="text" placeholder="Search product name, brand, SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 text-sm outline-none text-[#1E293B] placeholder-slate-400 bg-transparent font-['Barlow',sans-serif]" />
            {search && <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500"><FiX size={13} /></button>}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {loading && <div className="flex items-center justify-center gap-3 py-16 text-[#1D4ED8]"><FiLoader size={20} className="animate-spin" /> <span className="text-sm font-semibold">Loading products…</span></div>}
            {error && <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-semibold"><FiAlertTriangle size={15} /> {error}</div>}
            {!loading && !error && products.length === 0 && <div className="text-center py-16 text-slate-400 text-sm font-medium">No products found.</div>}
            {!loading && !error && products.map((p) => {
              const price = getPrice(p);
              const inMemo = memoItems.some((i) => i.productId === p._id);
              const lowStock = p.stock <= 10;
              return (
                <div key={p._id} className={`group flex items-center gap-3 bg-white border-2 rounded-xl px-4 py-3 transition-all duration-150 ${inMemo ? "border-[#F97316] bg-[#FFF7ED]" : "border-slate-200 hover:border-[#1D4ED8]"}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E293B] truncate">{p.name}{p.isCustom && <span className="ml-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded">CUSTOM</span>}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] px-1.5 py-0.5 rounded border border-[#BFDBFE]">{p.brand || p.company || "—"}</span>
                      <span className="text-[10px] font-bold text-[#F97316]">{fmt(price)}</span>
                      {lowStock && p.stock > 0 && <span className="text-[10px] font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">Low: {p.stock}</span>}
                      {p.stock === 0 && <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Out</span>}
                    </div>
                  </div>
                  <button onClick={() => addToMemo(p)} disabled={inMemo || p.stock === 0} className={`shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${inMemo || p.stock === 0 ? "border-[#F97316] bg-[#F97316] text-white cursor-default" : "border-slate-200 text-slate-400 hover:border-[#1D4ED8] hover:text-[#1D4ED8]"}`}><FiPlus size={14} /></button>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-[#1E3A8A] disabled:opacity-40"><FiChevronsLeft size={14} /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-slate-200 text-slate-500 hover:text-[#1E3A8A] disabled:opacity-40">Prev</button>
              <span className="text-slate-500 font-medium">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border border-slate-200 text-slate-500 hover:text-[#1E3A8A] disabled:opacity-40">Next</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-[#1E3A8A] disabled:opacity-40"><FiChevronsRight size={14} /></button>
            </div>
          )}

          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2"><FiPlusCircle size={15} className="text-[#1E3A8A]" /><h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-sm uppercase tracking-wide">Add Custom Product</h3></div>
            <input type="text" placeholder="Product name" value={customProduct.name} onChange={(e) => setCustomProduct((c) => ({ ...c, name: e.target.value }))} className="w-full text-sm border-2 border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]" />
            <input type="text" placeholder="Shop Name (source of this product)" value={customProduct.shopName} onChange={(e) => setCustomProduct((c) => ({ ...c, shopName: e.target.value }))} className="w-full text-sm border-2 border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="1" placeholder="Quantity" value={customProduct.qty} onChange={(e) => setCustomProduct((c) => ({ ...c, qty: e.target.value }))} className="w-full text-sm border-2 border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]" />
              <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-[#1D4ED8] transition-colors">
                <span className="px-2 text-xs text-slate-400 bg-slate-50 border-r border-slate-200 h-full flex items-center">৳</span>
                <input type="number" min="0" step="0.01" placeholder="Unit price" value={customProduct.unitPrice} onChange={(e) => setCustomProduct((c) => ({ ...c, unitPrice: e.target.value }))} className="w-full text-sm px-2 py-2 outline-none font-['Barlow',sans-serif]" />
              </div>
            </div>
            <button onClick={addCustomProductToMemo} disabled={addingCustom} className="flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {addingCustom ? <FiLoader size={14} className="animate-spin" /> : <FiPlus size={14} />} Add to Invoice
            </button>
          </div>
        </div>

        {/* RIGHT — independently scrolling invoice memo */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#F97316] rounded-lg flex items-center justify-center shrink-0"><FiFileText size={16} className="text-white" /></div>
              <div><h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-base uppercase tracking-wide leading-tight">Sales Memo</h2><p className="text-[10px] text-slate-400 font-medium">{memoItems.length} item{memoItems.length !== 1 ? "s" : ""} · {fmt(grandTotal)}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveCurrentAsDraft} className="px-3 py-1.5 border-2 border-[#1D4ED8] rounded-lg text-[#1D4ED8] text-xs font-semibold hover:bg-blue-50 transition-colors">Save Draft</button>
              <button onClick={clearMemo} className="px-3 py-1.5 border-2 border-slate-200 rounded-lg text-slate-500 text-xs font-semibold hover:border-slate-300 transition-colors">Clear</button>
            </div>
          </div>

          <div id="print-area" ref={printRef} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col">
            <div className="hidden print:flex flex-col items-center gap-2 pt-2 pb-4 border-b-2 border-slate-100">
              <div className="w-14 h-14 bg-[#F97316] rounded-xl flex items-center justify-center"><span className="text-white text-2xl">🔧</span></div>
              <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] text-xl uppercase tracking-widest leading-tight text-center">Khulna <span className="text-[#F97316]">Hardware</span> Mart</p>
              <p className="text-slate-400 text-[10px] font-medium text-center max-w-md">280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna · 02477-721990, +880 1931-272839, +880 1679-123205</p>
            </div>

            <div className="bg-[#1E3A8A] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F97316] rounded-lg flex items-center justify-center shrink-0"><span className="text-white text-lg">🔧</span></div>
                <div>
                  <p className="font-['Barlow_Condensed',sans-serif] font-bold text-white text-sm uppercase tracking-widest leading-tight">Khulna <span className="text-[#F97316]">Hardware</span> Mart</p>
                  <p className="text-[#93C5FD] text-[10px] font-medium">280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna· 02477-721990 , +880 1931-272839 , +880 1679-123205 </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-xs font-bold">SALES MEMO</p>
                <div className="flex items-center gap-2 mt-1"><FiHash size={10} className="text-[#93C5FD]" /><input value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} className="bg-transparent text-[#FACC15] text-xs font-bold outline-none w-28 text-right font-['Barlow',sans-serif]" /></div>
                <p className="text-[#93C5FD] text-[10px] mt-0.5">{invoiceDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 py-4 border-b-2 border-slate-100 bg-slate-50">
              {[{ icon: <FiUser size={12} />, key: "name", placeholder: "Customer Name *" }, { icon: <FiPhone size={12} />, key: "phone", placeholder: "Phone Number (auto-fills name)" }, { icon: <FiSearch size={12} />, key: "address", placeholder: "Address (optional)" }].map((f) => (
                <div key={f.key} className={`flex items-center gap-2 bg-white border-2 rounded-lg px-3 py-2 focus-within:border-[#1D4ED8] transition-colors ${f.key === "phone" && customerLookupStatus === "found" ? "border-green-400" : "border-slate-200"}`}>
                  <span className="text-slate-400 shrink-0">{f.icon}</span>
                  <input placeholder={f.placeholder} value={customer[f.key]} onChange={(e) => { setCustomer((c) => ({ ...c, [f.key]: e.target.value })); if (f.key === "phone") setCustomerLookupStatus(""); }} className="flex-1 text-xs outline-none text-[#1E293B] placeholder-slate-400 bg-transparent font-['Barlow',sans-serif]" />
                  {f.key === "phone" && customerLookupStatus === "found" && <FiCheckCircle size={13} className="text-green-500 shrink-0" title="Existing customer found" />}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b-2 border-slate-100 bg-white print:hidden">
              <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">Customer Type</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCustomerType("retail")} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${customerType === "retail" ? "border-[#F97316] bg-[#F97316] text-white" : "border-slate-200 text-slate-500"}`}>Retail</button>
                <button type="button" onClick={() => setCustomerType("wholesale")} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${customerType === "wholesale" ? "border-[#1D4ED8] bg-[#1D4ED8] text-white" : "border-slate-200 text-slate-500"}`}>Wholesale</button>
              </div>
              <span className="text-[10px] text-slate-400">Switching updates item prices automatically. Not printed on invoice.</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b-2 border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider print:hidden">Prepared By <span className="text-red-500">*</span></span>
              <div className="flex items-center gap-2 print:hidden">
                <select value={isPreparedByOther ? "__others__" : preparedBy} onChange={(e) => { const val = e.target.value; if (val === "__others__") setIsPreparedByOther(true); else { setIsPreparedByOther(false); setPreparedBy(val); } }} className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-2 outline-none bg-white">
                  {PREPARED_BY_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  <option value="__others__">Others</option>
                </select>
                {isPreparedByOther && <input type="text" value={customPreparedBy} onChange={(e) => setCustomPreparedBy(e.target.value)} placeholder="Type name" className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-2 outline-none bg-white" />}
              </div>
              <span className="text-xs font-semibold text-slate-700">Prepared by: {isPreparedByOther ? (customPreparedBy || "—") : preparedBy}</span>
            </div>

            <div className="flex-1">
              {memoItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
                  <FiShoppingCart size={40} /><p className="text-sm font-semibold">Memo is empty</p><p className="text-xs">Search products on the left and click <strong>+</strong> to add</p>
                </div>
              ) : (
                <table className="w-full min-w-[600px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-4 py-2.5 text-left w-6">#</th><th className="px-4 py-2.5 text-left">Product</th><th className="px-4 py-2.5 text-center w-24">Qty</th><th className="px-4 py-2.5 text-right w-32">Unit Price</th><th className="px-4 py-2.5 text-right w-32">Total</th><th className="px-2 py-2.5 w-8 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {memoItems.map((item, idx) => (
                      <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}>
                        <td className="px-4 py-2.5 text-xs text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-[#1E293B] text-sm leading-tight">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.company}</p>
                          {item.stock != null && <p className="text-[10px] text-slate-400 mt-0.5">Stock: {item.stock}</p>}
                          {Array.isArray(item.suppliers) && item.suppliers.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <select value={item.preferredSupplierId || ""} onChange={(e) => updateItem(item.id, "preferredSupplierId", e.target.value)} className="text-[10px] font-semibold border border-slate-200 rounded px-1.5 py-1 outline-none bg-slate-50 focus:border-[#1D4ED8] max-w-[180px] font-['Barlow',sans-serif]">
                                <option value="">Auto (FIFO)</option>
                                {item.suppliers.map((s) => { const remaining = getSupplierRemaining(item, s.supplierId); if (remaining <= 0 && s.supplierId !== item.preferredSupplierId) return null; return <option key={s.supplierId} value={s.supplierId} disabled={remaining <= 0}>{s.supplierName} — ৳{s.buyingPrice} ({remaining} left)</option>; })}
                              </select>
                              {item.suppliers.some((s) => s.supplierId !== item.preferredSupplierId && getSupplierRemaining(item, s.supplierId) > 0) && (
                                <button type="button" onClick={() => addSupplierLine(item)} className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:border-[#1D4ED8] hover:text-[#1D4ED8] shrink-0"><FiPlus size={10} /></button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input type="number" min="1" max={getMaxQtyForItem(item, memoItems)} value={item.qty} onChange={(e) => updateItem(item.id, "qty", e.target.value)} className="w-16 text-center border-2 border-slate-200 rounded-lg py-1 text-sm font-semibold text-[#1E293B] outline-none focus:border-[#1D4ED8] transition-colors font-['Barlow',sans-serif]" />
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5">{item.unit || "pcs"}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-[#1D4ED8] transition-colors">
                            <span className="px-2 py-1 text-xs text-slate-400 bg-slate-50 border-r border-slate-200">৳</span>
                            <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(item.id, "price", e.target.value)} className="w-20 px-2 py-1 text-right text-sm font-semibold text-[#1E293B] outline-none bg-white font-['Barlow',sans-serif]" />
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-[#F97316] tabular-nums text-sm">{fmt(item.price * item.qty)}</td>
                        <td className="px-2 py-2.5 print:hidden"><button onClick={() => removeItem(item.id)} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"><FiTrash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {memoItems.length > 0 && (
              <div className="border-t-2 border-slate-100 px-5 py-4 bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider whitespace-nowrap">Discount (৳)</label>
                      <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-[#F97316] transition-colors">
                        <span className="px-2 py-2 text-xs text-slate-400 bg-white border-r border-slate-200">৳</span>
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-24 px-2 py-2 text-sm font-semibold text-[#1E293B] outline-none bg-white font-['Barlow',sans-serif]" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A] uppercase tracking-wider cursor-pointer print:cursor-default select-none">
                      <input type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} className="w-4 h-4 accent-[#1E3A8A]" /> Add VAT (5%)
                    </label>
                    <div className="flex items-center gap-3 print:hidden">
                      <label className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A] uppercase tracking-wider cursor-pointer select-none">
                        <input type="checkbox" checked={transportEnabled} onChange={(e) => setTransportEnabled(e.target.checked)} className="w-4 h-4 accent-[#1E3A8A]" /> Transport Cost
                      </label>
                      {transportEnabled && (
                        <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-[#F97316] transition-colors">
                          <span className="px-2 py-2 text-xs text-slate-400 bg-white border-r border-slate-200">৳</span>
                          <input type="number" min="0" step="0.01" placeholder="0.00" value={transportCost} onChange={(e) => setTransportCost(e.target.value)} className="w-24 px-2 py-2 text-sm font-semibold text-[#1E293B] outline-none bg-white font-['Barlow',sans-serif]" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[200px]">
                    <div className="flex justify-between w-full text-xs text-slate-500 font-medium"><span>Subtotal</span><span className="tabular-nums font-semibold text-slate-700">{fmt(subtotal)}</span></div>
                    {discAmt > 0 && <div className="flex justify-between w-full text-xs text-green-600 font-semibold"><span>Discount</span><span className="tabular-nums">− {fmt(discAmt)}</span></div>}
                    {vatEnabled && <div className="flex justify-between w-full text-xs text-slate-500 font-semibold"><span>VAT (5%)</span><span className="tabular-nums">+ {fmt(vatAmt)}</span></div>}
                    {transportEnabled && transportAmt > 0 && <div className="flex justify-between w-full text-xs text-slate-500 font-semibold"><span>Transportation Cost</span><span className="tabular-nums">+ {fmt(transportAmt)}</span></div>}
                    <div className="flex justify-between w-full pt-1.5 border-t-2 border-[#1E3A8A] mt-1"><span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#1E3A8A] uppercase tracking-wide text-sm">Grand Total</span><span className="font-['Barlow_Condensed',sans-serif] font-bold text-[#F97316] text-lg tabular-nums leading-tight">{fmt(grandTotal)}</span></div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 print:hidden">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">Payment Status</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPaymentStatus("paid")} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentStatus === "paid" ? "border-green-600 bg-green-600 text-white" : "border-slate-200 text-slate-500"}`}>Paid</button>
                      <button type="button" onClick={() => setPaymentStatus("due")} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentStatus === "due" ? "border-red-500 bg-red-500 text-white" : "border-slate-200 text-slate-500"}`}>Due</button>
                    </div>
                  </div>
                  {paymentStatus === "due" && (
                    <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-lg px-3 py-2">
                      <label className="text-xs font-bold text-red-600 whitespace-nowrap">Paying Now (৳)</label>
                      <input type="number" min="0" max={grandTotal} step="0.01" value={paidNowAmount} onChange={(e) => setPaidNowAmount(e.target.value)} disabled={splitPayment} placeholder="0.00" className="flex-1 border-2 border-red-200 rounded-lg px-2 py-1.5 text-sm font-semibold outline-none focus:border-red-500 bg-white font-['Barlow',sans-serif] disabled:bg-red-100" />
                      <span className="text-xs font-bold text-red-600 whitespace-nowrap">Due: ৳{dueBalance.toFixed(2)}</span>
                    </div>
                  )}
                  {splitPayment && paymentStatus === "due" && <p className="text-[10px] text-slate-400 mt-1">Auto-filled from split payment total below.</p>}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 print:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">Payment Method</label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A] uppercase tracking-wider cursor-pointer select-none">
                      <input type="checkbox" checked={splitPayment} onChange={(e) => setSplitPayment(e.target.checked)} className="w-4 h-4 accent-[#1E3A8A]" /> Split Payment
                    </label>
                  </div>
                  {!splitPayment ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setPaymentMethod("cash")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentMethod === "cash" ? "border-green-600 bg-green-600 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}><FiDollarSign size={13} /> Cash</button>
                        <button type="button" onClick={() => setPaymentMethod("mobile")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentMethod === "mobile" ? "border-[#1D4ED8] bg-[#1D4ED8] text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}><FiSmartphone size={13} /> Mobile Banking</button>
                        <button type="button" onClick={() => setPaymentMethod("bank")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors ${paymentMethod === "bank" ? "border-purple-600 bg-purple-600 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}><FiCreditCard size={13} /> Bank</button>
                      </div>
                      {paymentMethod === "mobile" && (
                        <div className="flex flex-wrap gap-2">
                          <select value={mobileProvider} onChange={(e) => setMobileProvider(e.target.value)} className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#1D4ED8] bg-white font-['Barlow',sans-serif]">{MOBILE_BANKING_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
                          <input type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="Payment number e.g. 01711-000000" className="flex-1 min-w-[180px] text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#1D4ED8] bg-white font-['Barlow',sans-serif]" />
                        </div>
                      )}
                      {paymentMethod === "bank" && (
                        <div className="flex flex-wrap gap-2">
                          <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-purple-600 bg-white font-['Barlow',sans-serif]">{BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
                          <input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Bank account number" className="flex-1 min-w-[180px] text-xs font-semibold border-2 border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-purple-600 bg-white font-['Barlow',sans-serif]" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {splitRows.map((row) => (
                        <div key={row.id} className="flex flex-wrap items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-lg p-2">
                          <select value={row.method} onChange={(e) => updateSplitRow(row.id, "method", e.target.value)} className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]">
                            <option value="cash">Cash</option><option value="mobile">Mobile Banking</option><option value="bank">Bank</option>
                          </select>
                          <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden bg-white"><span className="px-2 text-xs text-slate-400">৳</span><input type="number" min="0" step="0.01" value={row.amount} onChange={(e) => updateSplitRow(row.id, "amount", e.target.value)} placeholder="0.00" className="w-24 px-1 py-1.5 text-xs font-semibold outline-none font-['Barlow',sans-serif]" /></div>
                          {row.method === "mobile" && (<><select value={row.provider} onChange={(e) => updateSplitRow(row.id, "provider", e.target.value)} className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]">{MOBILE_BANKING_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}</select><input type="text" value={row.mobileNumber} onChange={(e) => updateSplitRow(row.id, "mobileNumber", e.target.value)} placeholder="Mobile number" className="flex-1 min-w-[120px] text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]" /></>)}
                          {row.method === "bank" && (<><select value={row.bankName} onChange={(e) => updateSplitRow(row.id, "bankName", e.target.value)} className="text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]">{BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}</select><input type="text" value={row.accountNumber} onChange={(e) => updateSplitRow(row.id, "accountNumber", e.target.value)} placeholder="Account number" className="flex-1 min-w-[120px] text-xs font-semibold border-2 border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white font-['Barlow',sans-serif]" /></>)}
                          <button type="button" onClick={() => removeSplitRow(row.id)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"><FiX size={14} /></button>
                        </div>
                      ))}
                      <button type="button" onClick={addSplitRow} className="flex items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 rounded-lg py-2 text-xs font-bold text-slate-500 hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors"><FiPlus size={13} /> Add Payment Method</button>
                      <div className={`flex items-center justify-between text-xs font-bold px-1 ${splitMismatch ? "text-red-600" : "text-green-600"}`}><span>Split Total: ৳{splitTotal.toFixed(2)}</span><span>Required: ৳{expectedPaidAmount.toFixed(2)}</span></div>
                    </div>
                  )}
                </div>

                <div className="hidden print:block mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-2">Payment Details</p>
                  <div className="space-y-1">
                    {buildPayments().map((p, i) => (
                      <div key={i} className="flex justify-between text-sm text-slate-700">
                        <span>{p.method === "mobile" ? `Mobile Banking (${p.provider}${p.mobileNumber ? " - " + p.mobileNumber : ""})` : p.method === "bank" ? `Bank (${p.bankName}${p.accountNumber ? " - " + p.accountNumber : ""})` : "Cash"}</span>
                        <span className="font-semibold">{fmt(p.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100"><span>Total Paid</span><span>{fmt(expectedPaidAmount)}</span></div>
                    {paymentStatus === "due" && dueBalance > 0 && <div className="flex justify-between text-sm font-bold text-red-600"><span>Due</span><span>{fmt(dueBalance)}</span></div>}
                  </div>
                </div>

                <p className="text-center text-[10px] text-slate-300 font-medium mt-3 tracking-widest uppercase">Thank you for shopping at Khulna Hardware Mart · Centenary Est. 1924</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 print:hidden">
            <button onClick={handleCompleteSale} disabled={saving || memoItems.length === 0} className="flex items-center gap-2 px-6 py-3 bg-green-600 border-2 border-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 hover:border-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? <FiLoader size={16} className="animate-spin" /> : <FiSave size={16} />} Complete Sale
            </button>
            <button onClick={printChallan} className="flex items-center gap-2 px-6 py-3 bg-slate-600 border-2 border-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 hover:border-slate-700 transition-colors"><FiFileText size={16} /> Challan Print</button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] border-2 border-[#1E3A8A] text-white rounded-lg text-sm font-bold hover:bg-[#1D4ED8] hover:border-[#1D4ED8] transition-colors"><FiPrinter size={16} /> Print</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Invoice;