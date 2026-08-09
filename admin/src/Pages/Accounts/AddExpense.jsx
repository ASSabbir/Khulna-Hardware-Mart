import { useState, useEffect } from "react";
import axios from "axios";
import {
  FiMinusCircle, FiFileText, FiCalendar, FiTag, FiUser,
  FiCheckCircle, FiAlertCircle, FiSearch, FiSliders,
  FiChevronRight, FiChevronDown, FiZap, FiArrowDownRight,
  FiActivity, FiBarChart2,
} from "react-icons/fi";
import { MOBILE_PROVIDERS as MOBILE_BANKING_PROVIDERS, BANK_OPTIONS } from "../../utils/paymentConstants";

const API_URL = "http://localhost:5000/api/ledger";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateShort = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
  " · " +
  new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const EXPENSE_CATEGORIES = ["Withdraw", "Purchase", "Salary", "Rent", "Utilities", "Transport", "Marketing", "Maintenance", "Tax", "Loan Repayment"];

const INITIAL_FORM = {
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  addedBy: "",
  method: "cash",
  provider: "bKash",
  bankName: BANK_OPTIONS[0],
};

function Sparkline({ points, color, fillId }) {
  return (
    <svg viewBox="0 0 120 40" className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,40 ${points} 120,40`} fill={`url(#${fillId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CircularProgress({ value, size = 72, stroke = 8, color = "#EF4444", track = "#FEE2E2", children }) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export default function AddExpense() {
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isCategoryOther, setIsCategoryOther] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [showActivitySearch, setShowActivitySearch] = useState(true);
  const [activityFilterOpen, setActivityFilterOpen] = useState(false);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState("");

  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => setAccounts(res.data))
      .catch(() => setAccounts({ balance: 0, totalIncome: 0, totalExpense: 0, transactions: [] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/options/accountCategory")
      .then((res) => setCategoryOptions((res.data.options || []).filter((c) => !EXPENSE_CATEGORIES.includes(c))))
      .catch(() => setCategoryOptions([]));
  }, []);

  useEffect(() => {
    if (!categoryOpen && !activityFilterOpen) return;
    const close = () => {
      setCategoryOpen(false);
      setActivityFilterOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [categoryOpen, activityFilterOpen]);

  const handleCategoryPick = (val) => {
    if (val === "__others__") {
      setIsCategoryOther(true);
      setForm((f) => ({ ...f, category: "" }));
    } else {
      setIsCategoryOther(false);
      setForm((f) => ({ ...f, category: val }));
    }
    setErrors((p) => ({ ...p, category: "" }));
    setCategoryOpen(false);
    setCategorySearch("");
  };

  const saveCustomCategory = async () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    try {
      const res = await axios.post("http://localhost:5000/api/options/accountCategory", { value: trimmed });
      setForm((f) => ({ ...f, category: res.data.value }));
      if (res.data.created) setCategoryOptions((prev) => [...prev, res.data.value]);
    } catch {
      setForm((f) => ({ ...f, category: trimmed }));
    }
  };

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const getAvailableBalance = (method, provider) => {
    const txns = accounts?.transactions || [];
    return txns.reduce((sum, t) => {
      const sameMethod = t.method === method && (method !== "mobile" || t.provider === provider);
      if (!sameMethod) return sum;
      return sum + (t.type === "income" ? t.amount : -t.amount);
    }, 0);
  };

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.category) e.category = "Select a category";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.date) e.date = "Select a date";
    if (form.category === "Withdraw" && !form.method) e.method = "Select a withdraw method";
    if (form.category === "Withdraw" && form.method && Number(form.amount) > getAvailableBalance(form.method, form.provider)) {
      e.amount = `Insufficient balance — only ৳${getAvailableBalance(form.method, form.provider).toLocaleString()} available`;
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(API_URL, {
        type: "expense",
        category: form.category,
        amount: Number(form.amount),
        description: form.description,
        date: form.date,
        addedBy: form.addedBy || "Admin",
        method: form.category === "Withdraw" ? form.method : "cash",
        provider: form.category === "Withdraw" && form.method === "mobile" ? form.provider : null,
        bankName: form.category === "Withdraw" && form.method === "bank" ? form.bankName : null,
      });
      const newTx = res.data;
      setAccounts((prev) => ({
        ...prev,
        balance: prev.balance - Number(form.amount),
        totalExpense: prev.totalExpense + Number(form.amount),
        transactions: [newTx, ...prev.transactions],
      }));
      setForm(INITIAL_FORM);
      showToast("Expense Recorded Successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to record expense.");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const allCategories = [...EXPENSE_CATEGORIES, ...categoryOptions, "Others"];
  const filteredCategories = allCategories.filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()));

  const withdrawAvailable = form.category === "Withdraw" ? getAvailableBalance(form.method, form.provider) : null;

  const recentExpenses = (accounts?.transactions || []).filter((t) => t.type === "expense").slice(0, 8);
  const filteredActivity = recentExpenses.filter((t) => {
    const matchesSearch =
      !activitySearch ||
      t.description?.toLowerCase().includes(activitySearch.toLowerCase()) ||
      t.category?.toLowerCase().includes(activitySearch.toLowerCase());
    const matchesFilter = !activityCategoryFilter || t.category === activityCategoryFilter;
    return matchesSearch && matchesFilter;
  });
  const activityFilterCategories = [...new Set(recentExpenses.map((t) => t.category).filter(Boolean))];

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = (accounts?.transactions || []).filter((t) => t.type === "expense" && t.date?.startsWith(thisMonth));
  const monthTotal = monthExpenses.reduce((s, t) => s + t.amount, 0);
  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: monthExpenses.filter((t) => t.category === cat).reduce((s, t) => s + t.amount, 0),
  }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  const todayStr = new Date().toDateString();
  const todaysExpense = (accounts?.transactions || [])
    .filter((t) => t.type === "expense" && new Date(t.date).toDateString() === todayStr)
    .reduce((s, t) => s + t.amount, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyTotal = (accounts?.transactions || [])
    .filter((t) => t.type === "expense" && new Date(t.date) >= sevenDaysAgo)
    .reduce((s, t) => s + t.amount, 0);
  const weeklyPct = monthTotal > 0 ? Math.min(Math.round((weeklyTotal / monthTotal) * 100), 100) : 0;

  const expenseRatio = accounts?.totalIncome > 0
    ? Math.min(Math.round((accounts.totalExpense / accounts.totalIncome) * 100), 100)
    : 0;
  const ratioStatus = expenseRatio < 50 ? "Good" : expenseRatio < 80 ? "Watch" : "High";
  const ratioColor = expenseRatio < 50 ? "#10B981" : expenseRatio < 80 ? "#F59E0B" : "#EF4444";

  const fundsUsedPct = accounts?.totalIncome > 0
    ? Math.min(Math.round((accounts.totalExpense / accounts.totalIncome) * 100), 100)
    : 0;

  const healthScore = Math.max(0, Math.min(100, 100 - expenseRatio));

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#EF4444] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {toast && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 bg-white border border-[#E2E8F0] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] rounded-2xl px-4 py-3 sm:px-5 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <FiCheckCircle className="text-[#EF4444]" size={16} />
          </span>
          <div>
            <p className="text-[#0F172A] font-semibold text-sm leading-tight">Success Notification</p>
            <p className="text-[#64748B] text-xs mt-0.5">{toast}</p>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-[13px] text-[#64748B] mb-2">
              <span>Accounting</span>
              <FiChevronRight size={12} />
              <span>Expenses</span>
              <FiChevronRight size={12} />
              <span className="text-[#0F172A] font-semibold">Add Expense</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-tight">Add Expense</h1>
            <p className="text-[#64748B] text-sm sm:text-[15px] mt-1">Record purchases, salaries, rent, operational costs and outgoing payments</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] px-4 py-2.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
              <p className="text-[11px] text-[#64748B] font-medium">Today's Outflow</p>
              <p className="text-sm font-bold text-[#EF4444]">{fmt(todaysExpense)}</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] px-4 py-2.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
              <p className="text-[11px] text-[#64748B] font-medium">This Month</p>
              <p className="text-sm font-bold text-[#0F172A]">{fmt(monthTotal)}</p>
            </div>
            <button
              type="button"
              onClick={() => window.open("/reports", "_blank", "noopener,noreferrer")}
              className="flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold px-4 py-2.5 rounded-[10px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] transition hover:border-[#CBD5E1]"
            >
              <FiBarChart2 size={16} className="text-[#64748B]" /> View Reports
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
          {/* Current Balance */}
          <div className="rounded-[12px] p-5 bg-white border border-[#E2E8F0] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <p className="text-[#64748B] text-sm font-medium">Current Balance</p>
            <p className="text-[24px] sm:text-[26px] font-bold text-[#0F172A] mt-2 tracking-tight">{fmt(accounts?.balance || 0)}</p>
            <p className="text-[11px] text-[#94A3B8] mt-2">Available funds indicator</p>
            <div className="h-1.5 bg-[#FEF2F2] rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-[#EF4444] rounded-full" style={{ width: `${fundsUsedPct}%` }} />
            </div>
            <p className="text-[11px] text-[#EF4444] font-semibold mt-1">{fundsUsedPct}% used</p>
          </div>

          {/* Total Expenses */}
          <div className="rounded-[12px] p-5 bg-white border border-[#E2E8F0] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <p className="text-[#64748B] text-sm font-medium">Total Expenses</p>
            <p className="text-[24px] sm:text-[26px] font-bold text-[#0F172A] mt-2 tracking-tight">{fmt(accounts?.totalExpense || 0)}</p>
            <p className="text-[11px] text-[#94A3B8] mt-1">Lifetime expense amount</p>
            <Sparkline fillId="expTotalFill" color="#EF4444" points="0,10 15,18 30,14 45,24 60,20 75,28 90,24 105,32 120,30" />
          </div>

          {/* Monthly Expenses */}
          <div className="rounded-[12px] p-5 bg-white border border-[#E2E8F0] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <p className="text-[#64748B] text-sm font-medium">Monthly Expenses</p>
            <p className="text-[24px] sm:text-[26px] font-bold text-[#0F172A] mt-2 tracking-tight">{fmt(monthTotal)}</p>
            <p className="text-[11px] text-[#94A3B8] mt-1">Current month spending</p>
            <Sparkline fillId="expMonthFill" color="#F87171" points="0,26 15,22 30,28 45,18 60,20 75,10 90,16 105,8 120,14" />
          </div>

          {/* Expense Ratio */}
          <div className="rounded-[12px] p-5 bg-white border border-[#E2E8F0] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between gap-3">
            <div>
              <p className="text-[#64748B] text-sm font-medium">Expense Ratio</p>
              <p className="text-[24px] sm:text-[26px] font-bold text-[#0F172A] mt-2 tracking-tight">{expenseRatio}%</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">Health indicator</p>
              <span
                className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: ratioColor, backgroundColor: `${ratioColor}1A` }}
              >
                {ratioStatus}
              </span>
            </div>
            <CircularProgress value={expenseRatio} color={ratioColor} track="#F1F5F9">
              <span className="text-xs font-bold" style={{ color: ratioColor }}>{expenseRatio}%</span>
            </CircularProgress>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 sm:gap-6">
          {/* Left: Expense Entry Workspace */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] p-5 sm:p-7">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] mb-5 sm:mb-6">Expense Entry Workspace</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Amount */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] text-base font-bold">৳</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (form.category === "Withdraw" && form.method) {
                        const cap = getAvailableBalance(form.method, form.provider);
                        if (raw !== "" && Number(raw) > cap) {
                          setForm((p) => ({ ...p, amount: String(cap) }));
                          setErrors((p) => ({ ...p, amount: "" }));
                          return;
                        }
                      }
                      set("amount")(e);
                    }}
                    max={form.category === "Withdraw" && form.method ? getAvailableBalance(form.method, form.provider) : undefined}
                    placeholder="0.00"
                    className={`w-full bg-[#F8FAFC] border ${
                      errors.amount ? "border-red-400" : "border-[#E2E8F0]"
                    } rounded-[10px] pl-9 pr-4 py-3.5 text-lg font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 focus:border-[#EF4444] transition`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} />
                    {errors.amount}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="sm:col-span-2 relative" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Expense Category <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCategoryOpen((o) => !o)}
                  className={`w-full flex items-center justify-between bg-[#F8FAFC] border ${
                    errors.category ? "border-red-400" : "border-[#E2E8F0]"
                  } rounded-[10px] pl-4 pr-3 py-3.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 transition`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <FiTag size={14} className="text-[#94A3B8]" />
                    {isCategoryOther ? "Others" : form.category || "Select category..."}
                  </span>
                  <FiChevronDown size={14} className="text-[#94A3B8]" />
                </button>

                {categoryOpen && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] overflow-hidden">
                    <div className="p-2 border-b border-[#F1F5F9]">
                      <div className="relative">
                        <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                        <input
                          autoFocus
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Search category..."
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredCategories.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleCategoryPick(c === "Others" ? "__others__" : c)}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-red-50 transition ${
                            form.category === c ? "bg-red-50 text-[#EF4444] font-semibold" : "text-[#334155]"
                          }`}
                        >
                          {c}
                          {form.category === c && <FiCheckCircle size={14} />}
                        </button>
                      ))}
                      {filteredCategories.length === 0 && <p className="text-center text-xs text-[#94A3B8] py-4">No matches</p>}
                    </div>
                  </div>
                )}

                {isCategoryOther && (
                  <input
                    type="text"
                    autoFocus
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    onBlur={saveCustomCategory}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveCustomCategory();
                      }
                    }}
                    placeholder="Type new category name"
                    className="mt-2 w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 transition"
                  />
                )}
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} />
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Smart Withdraw Module */}
              {form.category === "Withdraw" && (
                <div className="sm:col-span-2 bg-[#FEF2F2] border border-red-100 rounded-[12px] p-4 sm:p-5">
                  <p className="text-sm font-bold text-[#0F172A] mb-1">Smart Withdraw Module</p>
                  <p className="text-xs text-[#64748B] mb-3">Choose the source this withdrawal will be deducted from</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {[["cash", "Cash Account"], ["bank", "Bank Account"], ["mobile", "Mobile Banking"]].map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, method: v }))}
                        className={`px-4 py-2 rounded-[8px] border-2 text-sm font-bold transition ${
                          form.method === v ? "border-[#EF4444] bg-[#EF4444] text-white" : "border-[#E2E8F0] text-[#475569] bg-white"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  {form.method === "mobile" && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {MOBILE_BANKING_PROVIDERS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, provider: p }))}
                          className={`px-3.5 py-2 rounded-[8px] border-2 text-sm font-semibold transition ${
                            form.provider === p ? "border-[#EF4444] bg-white text-[#EF4444]" : "border-[#E2E8F0] text-[#475569] bg-white"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  {form.method === "bank" && (
                    <select
                      value={form.bankName}
                      onChange={set("bankName")}
                      className="w-full bg-white border border-[#E2E8F0] rounded-[10px] px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 transition mb-3"
                    >
                      {BANK_OPTIONS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  )}

                  {errors.method && (
                    <p className="text-red-500 text-xs mb-2 flex items-center gap-1">
                      <FiAlertCircle size={12} />
                      {errors.method}
                    </p>
                  )}

                  {form.method && (
                    <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-3.5 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-[11px] text-[#64748B] font-medium">Available balance</p>
                        <p className="text-sm font-bold text-[#10B981]">{fmt(withdrawAvailable)}</p>
                      </div>
                      <div className="w-px h-8 bg-[#E2E8F0] hidden sm:block" />
                      <div>
                        <p className="text-[11px] text-[#64748B] font-medium">Remaining after this</p>
                        <p className="text-sm font-bold text-[#0F172A]">
                          {fmt(Math.max(withdrawAvailable - (Number(form.amount) || 0), 0))}
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-[#94A3B8] mt-2">This amount only reduces your Accounts balance — total sales figures stay unchanged.</p>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiCalendar size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="date"
                    value={form.date}
                    onChange={set("date")}
                    className={`w-full bg-[#F8FAFC] border ${
                      errors.date ? "border-red-400" : "border-[#E2E8F0]"
                    } rounded-[10px] pl-11 pr-4 py-3.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 transition`}
                  />
                </div>
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} />
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Added By */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">Added By</label>
                <div className="relative">
                  <FiUser size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={form.addedBy}
                    onChange={set("addedBy")}
                    placeholder="Your name (optional)"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] pl-11 pr-4 py-3.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiFileText size={15} className="absolute left-4 top-4 text-[#94A3B8]" />
                  <textarea
                    value={form.description}
                    onChange={set("description")}
                    rows={3}
                    placeholder="Payment for office rent October"
                    className={`w-full bg-[#F8FAFC] border ${
                      errors.description ? "border-red-400" : "border-[#E2E8F0]"
                    } rounded-[10px] pl-11 pr-4 py-3.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 transition resize-none`}
                  />
                </div>
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} />
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full mt-6 sm:mt-7 bg-[#EF4444] hover:bg-[#DC2626] disabled:bg-red-300 text-white font-bold py-3.5 sm:py-4 rounded-[10px] text-base transition flex items-center justify-center gap-2 shadow-[0_4px_14px_-2px_rgba(239,68,68,0.4)]"
            >
              {saving ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <FiMinusCircle size={18} /> Record Expense
                </>
              )}
            </button>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-5">
            {/* Monthly Expense Analytics */}
            {byCategory.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] p-5">
                <h3 className="text-sm font-bold text-[#0F172A] mb-4">Monthly Expense Analytics</h3>
                <div className="space-y-3.5">
                  {byCategory.map(({ cat, total }) => {
                    const pct = monthTotal > 0 ? Math.round((total / monthTotal) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[13px] text-[#475569]">{cat}</span>
                          <span className="text-[13px] font-bold text-[#EF4444]">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#FEF2F2] rounded-full overflow-hidden">
                          <div className="h-full bg-[#EF4444] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Expense Activity */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A]">Recent Expense Activity</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowActivitySearch((s) => !s)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${
                      showActivitySearch ? "bg-red-50 text-[#EF4444]" : "hover:bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    <FiSearch size={14} />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActivityFilterOpen((o) => !o); }}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${
                        activityCategoryFilter ? "bg-red-50 text-[#EF4444]" : "hover:bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      <FiSliders size={14} />
                    </button>
                    {activityFilterOpen && (
                      <div
                        className="absolute z-20 right-0 mt-2 w-44 bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => { setActivityCategoryFilter(""); setActivityFilterOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold ${!activityCategoryFilter ? "text-[#EF4444] bg-red-50" : "text-[#334155] hover:bg-[#F8FAFC]"}`}
                        >
                          All categories
                        </button>
                        {activityFilterCategories.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { setActivityCategoryFilter(c); setActivityFilterOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-xs ${activityCategoryFilter === c ? "text-[#EF4444] bg-red-50 font-semibold" : "text-[#334155] hover:bg-[#F8FAFC]"}`}
                          >
                            {c}
                          </button>
                        ))}
                        {activityFilterCategories.length === 0 && <p className="text-center text-[11px] text-[#94A3B8] py-3">No categories yet</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {showActivitySearch && (
                <div className="px-4 pt-3">
                  <input
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30"
                  />
                </div>
              )}
              <div className="divide-y divide-[#F1F5F9] max-h-[340px] overflow-y-auto mt-1">
                {filteredActivity.length === 0 ? (
                  <p className="text-center text-[#94A3B8] text-sm py-8">No expense records yet</p>
                ) : (
                  filteredActivity.map((t) => (
                    <div key={t.id} className="px-5 py-3.5 flex items-start gap-3">
                      <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiArrowDownRight size={14} className="text-[#EF4444]" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">{t.description}</p>
                          <span className="text-sm font-bold text-[#EF4444] whitespace-nowrap">-{fmt(t.amount)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] bg-red-50 text-[#EF4444] px-2 py-0.5 rounded-full font-semibold">{t.category}</span>
                          <span className="text-[11px] text-[#94A3B8]">{fmtDate(t.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Today's Expenses */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] p-5">
              <p className="text-sm font-bold text-[#0F172A] mb-1">Today's Expenses</p>
              <p className="text-2xl font-bold text-[#EF4444]">{fmt(todaysExpense)}</p>
            </div>

            {/* Weekly Spending Summary */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-[#0F172A]">Weekly Spending Summary</p>
                <span className="text-[11px] font-bold text-[#EF4444] bg-red-50 px-2 py-0.5 rounded-full">{weeklyPct}%</span>
              </div>
              <p className="text-2xl font-bold text-[#0F172A] mt-1">{fmt(weeklyTotal)}</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">Share of this month's total spend</p>
            </div>

            {/* Financial Health Score */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] p-5 flex items-center gap-4">
              <CircularProgress value={healthScore} color="#10B981" track="#F1F5F9" size={64} stroke={7}>
                <FiActivity size={18} className="text-[#10B981]" />
              </CircularProgress>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">Financial Health Score</p>
                <p className="text-xl font-bold text-[#0F172A] mt-0.5">{healthScore}/100</p>
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-[12px] p-5 flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-white border border-red-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <FiZap size={16} className="text-[#EF4444]" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">Smart Recommendations</p>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {byCategory[0]
                    ? `${byCategory[0].cat} is your top expense category this month — review it for savings.`
                    : "Track categories consistently to unlock personalized spending insights."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}