import {
  FiDroplet, FiTool, FiZap, FiShield,
  FiPackage, FiSettings, FiGrid, FiBox,
} from "react-icons/fi";

const CATEGORIES = [
  { icon: <FiDroplet size={18} />, label: "Plumbing & Pipes"     },
  { icon: <FiTool size={18} />,   label: "Hand Tools"            },
  { icon: <FiZap size={18} />,    label: "Electrical Supplies"   },
  { icon: <FiDroplet size={18} />, label: "Paints & Coatings"   },
  { icon: <FiPackage size={18} />, label: "Power Tools"          },
  { icon: <FiShield size={18} />, label: "Washroom Fittings"     },
  { icon: <FiSettings size={18} />,label: "Safety Equipment"     },
  { icon: <FiBox size={18} />,    label: "Adhesives & Sealants"  },
  { icon: <FiGrid size={18} />,   label: "Hardware Fasteners"    },
  { icon: <FiTool size={18} />,   label: "Measuring Tools"       },
];

const BRANDS = [
  "Berger Paints", "Asian Paints", "Bosch", "Stanley",
  "Jaquar", "Makita", "Supreme Pipes", "Black & Decker",
  "3M", "Nippon Paint", "Havells", "Anchor",
];

// duplicate for seamless loop
const CAT_LOOP   = [...CATEGORIES, ...CATEGORIES];
const BRAND_LOOP = [...BRANDS, ...BRANDS];

export default function Marque() {
  return (
    <div className="bg-blue-900 py-12 overflow-hidden space-y-5">

      {/* ── Row 1 — Categories (left to right) ── */}
      <div className="flex gap-4" style={{ animation: "marqueeLeft 30s linear infinite", whiteSpace: "nowrap" }}>
        {CAT_LOOP.map(({ icon, label }, i) => (
          <div key={i}
            className="inline-flex items-center gap-2.5 bg-white/6 border border-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-full flex-shrink-0 hover:bg-blue-700/40 hover:border-blue-600/50 transition-colors duration-300 cursor-default">
            <span className="text-blue-400">{icon}</span>
            {label}
          </div>
        ))}
      </div>

      {/* ── Row 2 — Brands (right to left) ── */}
      <div className="flex gap-4" style={{ animation: "marqueeRight 25s linear infinite", whiteSpace: "nowrap" }}>
        {BRAND_LOOP.map((brand, i) => (
          <div key={i}
            className="inline-flex items-center gap-2.5 bg-orange-500/30 border border-orange-500/30 text-orange-300 text-sm font-semibold px-5 py-2.5 rounded-full flex-shrink-0 hover:bg-orange-700/40 hover:text-white transition-colors duration-300 cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
            {brand}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marqueeLeft  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes marqueeRight { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}