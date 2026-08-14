// FILE: src/Pages/Dashboard/BackupCenter.jsx (NEW)
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../Components/Nav";
import {
  FiDatabase, FiDownload, FiCalendar, FiFileText, FiCheckCircle,
  FiAlertTriangle, FiLoader, FiPackage, FiUsers, FiTruck, FiFileMinus,
  FiDollarSign, FiRotateCcw, FiShield, FiInfo,
} from "react-icons/fi";

const API_BASE = "http://localhost:5000/api/backup";

const QUICK_RANGES = [
  { key: "month", label: "This Month" },
  { key: "lastmonth", label: "Last Month" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

const COUNT_CARDS = [
  { key: "products", label: "Products", icon: FiPackage },
  { key: "customers", label: "Customers", icon: FiUsers },
  { key: "suppliers", label: "Suppliers", icon: FiTruck },
  { key: "invoices", label: "Invoices", icon: FiFileText },
  { key: "returns", label: "Returns", icon: FiRotateCcw },
  { key: "ledger", label: "Accounts Entries", icon: FiDollarSign },
  { key: "purchaseHistory", label: "Purchases", icon: FiFileMinus },
  { key: "partners", label: "Partners", icon: FiUsers },
];

export default function BackupCenter() {
  const { getAuthHeader } = useAuth();
  const [counts, setCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeQuick, setActiveQuick] = useState("all");
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/summary`, { headers: getAuthHeader() })
      .then((res) => setCounts(res.data.counts || {}))
      .catch(() => setCounts({}))
      .finally(() => setLoadingCounts(false));
  }, []); // eslint-disable-line

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const applyQuick = (key) => {
    setActiveQuick(key);
    const now = new Date();
    if (key === "all") { setFrom(""); setTo(""); return; }
    if (key === "month") {
      setFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
      setTo(now.toISOString().slice(0, 10));
    } else if (key === "lastmonth") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFrom(start.toISOString().slice(0, 10));
      setTo(end.toISOString().slice(0, 10));
    } else if (key === "year") {
      setFrom(new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10));
      setTo(now.toISOString().slice(0, 10));
    }
  };

  const buildParams = () => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    return params;
  };

  const downloadFile = async (url, filename, setLoadingFn) => {
    setLoadingFn(true);
    try {
      const res = await axios.get(url, { headers: getAuthHeader(), responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      showToast("success", "Download started.");
    } catch (err) {
      showToast("error", "Failed to generate the backup file.");
    } finally {
      setLoadingFn(false);
    }
  };

  const downloadExcel = () => {
    const params = buildParams();
    downloadFile(
      `${API_BASE}/export/excel?${params}`,
      `khm-report-${from || "all"}-to-${to || "all"}.xlsx`,
      setDownloadingExcel
    );
  };

  const downloadJson = () => {
    const params = buildParams();
    downloadFile(
      `${API_BASE}/export/json?${params}`,
      `khm-database-backup-${new Date().toISOString().slice(0, 10)}.json`,
      setDownloadingJson
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Barlow',sans-serif] p-4 sm:p-6">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />} {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1E3A8A] rounded-2xl flex items-center justify-center text-white shrink-0">
            <FiDatabase size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900">Backup Center</h1>
            <p className="text-slate-500 text-sm mt-0.5">Export your data as a visual Excel report or a full database backup file.</p>
          </div>
        </div>

        {/* Live counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {COUNT_CARDS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase truncate">{label}</p>
                <p className="text-lg font-bold text-slate-900">
                  {loadingCounts ? <FiLoader className="animate-spin" size={16} /> : (counts[key] ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Date filter */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Report Date Range</h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => applyQuick(r.key)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                  activeQuick === r.key
                    ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                    : "bg-white border-slate-200 text-slate-500 hover:border-[#1E3A8A]/40"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                <FiCalendar size={12} /> From
              </label>
              <input
                type="date" value={from}
                onChange={(e) => { setFrom(e.target.value); setActiveQuick(""); }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                <FiCalendar size={12} /> To
              </label>
              <input
                type="date" value={to}
                onChange={(e) => { setTo(e.target.value); setActiveQuick(""); }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">Leave both blank (or choose "All Time") to include everything.</p>
        </div>

        {/* Export actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><FiFileText size={16} /></span>
              <h3 className="font-bold text-slate-900">Visual Excel Report</h3>
            </div>
            <p className="text-sm text-slate-500">
              Multi-sheet spreadsheet: Products, Customers, Suppliers, Paid &amp; Due Invoices, Returns, Accounts, Purchase History, Supplier Payments, Partners — for the selected date range.
            </p>
            <button
              type="button" onClick={downloadExcel} disabled={downloadingExcel}
              className="mt-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {downloadingExcel ? <FiLoader className="animate-spin" size={16} /> : <FiDownload size={16} />}
              {downloadingExcel ? "Generating..." : "Download Excel Report"}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center"><FiDatabase size={16} /></span>
              <h3 className="font-bold text-slate-900">Full Database Backup (JSON)</h3>
            </div>
            <p className="text-sm text-slate-500">
              A complete machine-readable backup of every record. Keep this safe — use it on the Restore page to move all your data to new hosting anytime.
            </p>
            <button
              type="button" onClick={downloadJson} disabled={downloadingJson}
              className="mt-auto flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-[#16296B] text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {downloadingJson ? <FiLoader className="animate-spin" size={16} /> : <FiDownload size={16} />}
              {downloadingJson ? "Generating..." : "Download Database Backup"}
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <FiShield size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-amber-800 text-sm">
            Store downloaded backup files somewhere safe (cloud drive / external storage). The full database backup contains sensitive business data — don't share it publicly.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <FiInfo size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-blue-800 text-sm">
            Need to move to a new hosting or recover lost data? Go to <strong>Restore Center</strong> and upload the JSON database backup file — everything comes back automatically, no developer needed.
          </p>
        </div>
      </div>
    </div>
  );
}