import { useState, useEffect } from "react";
import axios from "axios";
import {
  FiMinusCircle, FiFileText, FiCalendar, FiTag,
  FiUser, FiCheckCircle, FiAlertCircle, FiList,
  FiTrendingDown,
} from "react-icons/fi";

// 👉 swap to real API when backend ready
const API_URL = "/accounts.json";

const fmt     = (n) => "৳" + Number(n).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const EXPENSE_CATEGORIES = ["Purchase", "Salary", "Rent", "Utilities", "Transport", "Marketing", "Maintenance", "Tax", "Loan Repayment", "Other"];

const INITIAL_FORM = { amount: "", category: "", description: "", date: new Date().toISOString().split("T")[0], addedBy: "" };

export default function AddExpense() {
  const [accounts, setAccounts] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(INITIAL_FORM);
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState("");

  useEffect(() => {
    axios.get(API_URL)
      .then((res) => {
        let d = res.data;
        if (Array.isArray(d)) d = { balance: 0, totalIncome: 0, totalExpense: 0, transactions: d };
        setAccounts(d);
      })
      .catch(() => setAccounts({ balance: 0, totalIncome: 0, totalExpense: 0, transactions: [] }))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.category)           e.category    = "Select a category";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.date)               e.date        = "Select a date";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    // 👉 real API: await axios.post("https://khulna-hardware-mart.vercel.app/api/accounts/expense", { ...form, type: "expense" });

    await new Promise((r) => setTimeout(r, 600));
    const newTx = {
      id: Date.now(),
      type: "expense",
      category: form.category,
      amount: Number(form.amount),
      description: form.description,
      date: form.date,
      addedBy: form.addedBy || "Admin",
    };
    setAccounts((prev) => ({
      ...prev,
      balance: prev.balance - Number(form.amount),
      totalExpense: prev.totalExpense + Number(form.amount),
      transactions: [newTx, ...prev.transactions],
    }));
    setForm(INITIAL_FORM);
    setSaving(false);
    showToast("Expense recorded successfully.");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const recentExpenses = (accounts?.transactions || []).filter((t) => t.type === "expense").slice(0, 6);

  // category breakdown for this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = (accounts?.transactions || []).filter((t) => t.type === "expense" && t.date?.startsWith(thisMonth));
  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: monthExpenses.filter((t) => t.category === cat).reduce((s, t) => s + t.amount, 0),
  })).filter((x) => x.total > 0);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-11 h-11 border-4 border-red-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl text-base font-semibold flex items-center gap-2">
          <FiCheckCircle size={18}/> {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-7">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
            <FiMinusCircle size={24}/>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Expense</h1>
            <p className="text-gray-500 text-base mt-0.5">Record purchases, salaries, rent or any outgoing payment</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Form ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Balance card */}
            <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-6 text-white">
              <p className="text-red-100 text-base font-medium">Current Balance</p>
              <p className="text-4xl font-bold mt-1">{fmt(accounts?.balance || 0)}</p>
              <div className="flex items-center gap-6 mt-4">
                <div>
                  <p className="text-red-200 text-sm">Total Expense</p>
                  <p className="text-white text-xl font-bold">{fmt(accounts?.totalExpense || 0)}</p>
                </div>
                <div className="w-px h-10 bg-white/20"/>
                <div>
                  <p className="text-red-200 text-sm">This Month</p>
                  <p className="text-white text-xl font-bold">{fmt(monthExpenses.reduce((s, t) => s + t.amount, 0))}</p>
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Expense Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Amount */}
                <div className="sm:col-span-2">
                  <label className="block text-base font-semibold text-gray-700 mb-2">Amount <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base font-semibold">৳</span>
                    <input type="number" value={form.amount} onChange={set("amount")} placeholder="0.00"
                      className={`w-full bg-gray-50 border ${errors.amount ? "border-red-400" : "border-gray-200"} rounded-xl pl-9 pr-4 py-3.5 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition`}/>
                  </div>
                  {errors.amount && <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1"><FiAlertCircle size={13}/>{errors.amount}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FiTag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <select value={form.category} onChange={set("category")}
                      className={`w-full bg-gray-50 border ${errors.category ? "border-red-400" : "border-gray-200"} rounded-xl pl-11 pr-4 py-3.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition appearance-none`}>
                      <option value="">Select category...</option>
                      {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {errors.category && <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1"><FiAlertCircle size={13}/>{errors.category}</p>}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FiCalendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="date" value={form.date} onChange={set("date")}
                      className={`w-full bg-gray-50 border ${errors.date ? "border-red-400" : "border-gray-200"} rounded-xl pl-11 pr-4 py-3.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition`}/>
                  </div>
                  {errors.date && <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1"><FiAlertCircle size={13}/>{errors.date}</p>}
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-base font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FiFileText size={16} className="absolute left-4 top-4 text-gray-400"/>
                    <textarea value={form.description} onChange={set("description")} rows={3}
                      placeholder="e.g. Monthly salary payment for staff..."
                      className={`w-full bg-gray-50 border ${errors.description ? "border-red-400" : "border-gray-200"} rounded-xl pl-11 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none`}/>
                  </div>
                  {errors.description && <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1"><FiAlertCircle size={13}/>{errors.description}</p>}
                </div>

                {/* Added By */}
                <div className="sm:col-span-2">
                  <label className="block text-base font-semibold text-gray-700 mb-2">Added By</label>
                  <div className="relative">
                    <FiUser size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" value={form.addedBy} onChange={set("addedBy")} placeholder="Your name (optional)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition"/>
                  </div>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={saving}
                className="w-full mt-6 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-4 rounded-xl text-lg transition flex items-center justify-center gap-2">
                {saving
                  ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>Processing...</>
                  : <><FiMinusCircle size={20}/> Record Expense</>
                }
              </button>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">
            {/* This month breakdown */}
            {byCategory.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <FiTrendingDown size={18} className="text-red-500"/>
                  <h3 className="text-base font-bold text-gray-900">This Month</h3>
                </div>
                <div className="p-5 space-y-3">
                  {byCategory.map(({ cat, total }) => (
                    <div key={cat}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-base text-gray-600">{cat}</span>
                        <span className="text-base font-bold text-red-600">{fmt(total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full"
                          style={{ width: `${Math.min((total / (accounts?.totalExpense || 1)) * 100, 100)}%` }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent expenses */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <FiList size={18} className="text-red-500"/>
                <h3 className="text-base font-bold text-gray-900">Recent Expenses</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {recentExpenses.length === 0 ? (
                  <p className="text-center text-gray-400 text-base py-10">No expense records yet</p>
                ) : recentExpenses.map((t) => (
                  <div key={t.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 truncate">{t.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{t.category}</span>
                          <span className="text-xs text-gray-400">{fmtDate(t.date)}</span>
                        </div>
                      </div>
                      <span className="text-base font-bold text-red-500 whitespace-nowrap">-{fmt(t.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}