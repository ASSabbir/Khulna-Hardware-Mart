// FILE: src/Pages/Dashboard/RestoreCenter.jsx (NEW)
import { useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../Components/Nav";
import {
  FiUploadCloud, FiFile, FiX, FiCheckCircle, FiAlertTriangle, FiLoader,
  FiShield, FiRefreshCw, FiDatabase, FiInfo,
} from "react-icons/fi";

const API_BASE = "http://localhost:5000/api/backup";

const LABELS = {
  products: "Products", suppliers: "Suppliers", customers: "Customers",
  invoices: "Invoices", returns: "Returns", ledger: "Accounts Entries",
  partners: "Partners", supplierPayments: "Supplier Payments",
  purchaseHistory: "Purchase History", customProductSources: "Custom Product Sources",
  dynamicOptions: "Dynamic Options", counters: "Counters",
};

export default function RestoreCenter() {
  const { getAuthHeader } = useAuth();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [parseError, setParseError] = useState("");
  const [mode, setMode] = useState("merge");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const handleFile = (f) => {
    setResult(null);
    setParseError("");
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".json")) {
      setParseError("Please select a valid .json backup file.");
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const data = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
        const counts = {};
        Object.keys(LABELS).forEach((key) => {
          counts[key] = Array.isArray(data[key]) ? data[key].length : 0;
        });
        setPreview({ meta: parsed?.meta || null, counts });
      } catch {
        setParseError("This file isn't a valid backup — couldn't parse JSON.");
        setPreview(null);
      }
    };
    reader.readAsText(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setParseError("");
    setResult(null);
    setConfirmChecked(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitRestore = async () => {
    if (!file) return;
    setRestoring(true);
    setShowConfirm(false);
    try {
      const formData = new FormData();
      formData.append("backupFile", file);
      formData.append("mode", mode);
      const res = await axios.post(`${API_BASE}/restore`, formData, {
        headers: { ...getAuthHeader(), "Content-Type": "multipart/form-data" },
        timeout: 5 * 60 * 1000,
      });
      setResult(res.data);
      showToast("success", "Restore completed successfully.");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Restore failed.");
    } finally {
      setRestoring(false);
    }
  };

  const totalRecords = preview ? Object.values(preview.counts).reduce((s, n) => s + n, 0) : 0;

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

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#F97316] rounded-2xl flex items-center justify-center text-white shrink-0">
            <FiRefreshCw size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900">Restore Center</h1>
            <p className="text-slate-500 text-sm mt-0.5">Upload a database backup file to bring all your data back — no developer needed.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <FiShield size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-amber-800 text-sm">
            Restoring changes real data in this system. Only upload a backup file exported from this same Backup Center. When in doubt, use "Merge / Update" mode instead of "Replace All."
          </p>
        </div>

        {/* Upload zone */}
        {!file ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileRef.current.click()}
            className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-[#1E3A8A] hover:bg-blue-50/40 transition"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FiUploadCloud size={26} className="text-[#1E3A8A]" />
            </div>
            <p className="font-bold text-slate-800">Click to select or drag & drop your backup file</p>
            <p className="text-slate-400 text-sm mt-1">Only .json database backup files are accepted</p>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0"><FiFile size={18} /></span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={clearFile} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0"><FiX size={18} /></button>
            </div>

            {parseError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                <FiAlertTriangle size={16} /> {parseError}
              </div>
            )}

            {preview && (
              <>
                {preview.meta && (
                  <p className="text-xs text-slate-400">
                    Backup exported: {preview.meta.exportedAt ? new Date(preview.meta.exportedAt).toLocaleString("en-GB") : "unknown"}
                    {preview.meta.from || preview.meta.to ? ` · Range: ${preview.meta.from || "…"} to ${preview.meta.to || "…"}` : " · Full backup"}
                  </p>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Records found in this file — {totalRecords.toLocaleString()} total</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(preview.counts).map(([key, n]) => (
                      <div key={key} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500 truncate">{LABELS[key]}</span>
                        <span className="text-xs font-bold text-slate-800">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Restore Mode</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-start gap-2.5 border-2 rounded-xl p-3.5 cursor-pointer transition ${mode === "merge" ? "border-[#1E3A8A] bg-blue-50" : "border-slate-200"}`}>
                      <input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} className="mt-0.5 accent-[#1E3A8A]" />
                      <span>
                        <span className="block text-sm font-bold text-slate-800">Merge / Update</span>
                        <span className="block text-xs text-slate-500 mt-0.5">Adds missing records and updates existing ones by ID. Nothing already in the system is deleted.</span>
                      </span>
                    </label>
                    <label className={`flex items-start gap-2.5 border-2 rounded-xl p-3.5 cursor-pointer transition ${mode === "replace" ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
                      <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} className="mt-0.5 accent-red-500" />
                      <span>
                        <span className="block text-sm font-bold text-red-700">Replace All</span>
                        <span className="block text-xs text-red-600/80 mt-0.5">Wipes all current data first, then restores exactly what's in this file. Use for moving to fresh hosting.</span>
                      </span>
                    </label>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} className="mt-0.5 accent-[#1E3A8A]" />
                  I understand this will {mode === "replace" ? "delete all existing data and " : ""}restore data from this backup file.
                </label>

                <button
                  type="button"
                  disabled={!confirmChecked || restoring}
                  onClick={() => setShowConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-[#16296B] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition"
                >
                  {restoring ? <FiLoader className="animate-spin" size={18} /> : <FiDatabase size={18} />}
                  {restoring ? "Restoring..." : "Start Restore"}
                </button>
              </>
            )}
          </div>
        )}

        {result && (
          <div className="bg-white border border-green-200 rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-green-700 font-bold">
              <FiCheckCircle size={18} /> Restore completed ({result.mode === "replace" ? "Replace All" : "Merge / Update"})
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(result.results || {}).map(([key, r]) => (
                <div key={key} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-slate-500 truncate">{LABELS[key] || key}</p>
                  {r.error ? (
                    <p className="text-xs font-bold text-red-600">Error: {r.error}</p>
                  ) : (
                    <p className="text-xs font-bold text-slate-800">{r.restored} restored{r.skipped ? `, ${r.skipped} skipped` : ""}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <FiInfo size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-blue-800 text-sm">
            Moving to a new server? Deploy this same app on the new hosting, open this Restore Center there, and upload your latest database backup file — that's it.
          </p>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${mode === "replace" ? "bg-red-100" : "bg-blue-100"}`}>
              <FiAlertTriangle size={26} className={mode === "replace" ? "text-red-500" : "text-[#1E3A8A]"} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {mode === "replace" ? "Replace ALL existing data?" : "Proceed with restore?"}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {mode === "replace"
                ? "Every current record will be permanently deleted and replaced with the contents of this backup file. This cannot be undone."
                : "Records in this backup will be added or updated in the system. Existing records not in this file stay untouched."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50">Cancel</button>
              <button
                onClick={submitRestore}
                className={`flex-1 text-white font-bold py-3 rounded-xl ${mode === "replace" ? "bg-red-500 hover:bg-red-600" : "bg-[#1E3A8A] hover:bg-[#16296B]"}`}
              >
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}