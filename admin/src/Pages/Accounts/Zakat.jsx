// FILE: src/Pages/Accounts/Zakat.jsx (NEW) — #27

import { useState, useEffect } from "react";
import axios from "axios";
import { FiTrendingUp, FiInfo } from "react-icons/fi";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

export default function Zakat() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:5000/api/ledger/zakat")
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white"><FiTrendingUp size={22} /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Zakat Calculation</h1><p className="text-gray-500">Based on consistent baseline account balance</p></div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-7 text-white">
          <p className="text-gray-400 text-sm">Baseline Balance (Nisab basis)</p>
          <p className="text-4xl font-bold mt-1">{fmt(data?.baseline || 0)}</p>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-gray-400">Zakat (2.5%)</span>
            <span className="text-2xl font-bold text-green-400">{fmt(data?.zakatAmount || 0)}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <FiInfo className="text-blue-500 mt-0.5" size={18} />
          <p className="text-blue-800 text-sm">Baseline is the most consistent amount across your account's full daily closing history — the figure that repeats most, i.e. stays fixed for many days without change. This is an estimate; consult a scholar for exact Zakat rulings.</p>
        </div>

        {data?.dailyClosing?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 font-bold text-gray-900">Daily Closing Balance</div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {[...data.dailyClosing].reverse().slice(0, 60).map((d) => (
                <div key={d.date} className="flex justify-between px-5 py-2.5 text-sm">
                  <span className="text-gray-500">{d.date}</span>
                  <span className="font-semibold text-gray-800">{fmt(d.balance)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}