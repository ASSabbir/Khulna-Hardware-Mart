// FILE: src/Components/Pagination.jsx (NEW) — reusable, consistent pagination UI
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Pagination({ page, totalPages, onChange, accent = "#1E3A8A", className = "" }) {
  if (totalPages <= 1) return null;
  const nums = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, start + 3);
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
      >
        <FiChevronLeft size={14} /> Prev
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} className="w-8 h-8 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">1</button>
          {start > 2 && <span className="text-gray-300 px-0.5">…</span>}
        </>
      )}
      {nums.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="w-8 h-8 rounded-lg text-sm font-semibold transition"
          style={n === page ? { background: accent, color: "#fff" } : { color: "#475569" }}
        >
          {n}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-gray-300 px-0.5">…</span>}
          <button onClick={() => onChange(totalPages)} className="w-8 h-8 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">{totalPages}</button>
        </>
      )}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
      >
        Next <FiChevronRight size={14} />
      </button>
    </div>
  );
}