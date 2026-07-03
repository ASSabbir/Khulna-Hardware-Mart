import {
  FiMapPin, FiPhone, FiMail, FiClock,
  FiAward, FiPackage, FiUsers, FiStar,
} from "react-icons/fi";
import img from '../../../public/Image/banner.jpeg'
 
const STATS = [
  { value: "1990", label: "Established",        icon: <FiAward size={20}/>   },
  { value: "35+",  label: "Years of Trust",     icon: <FiStar size={20}/>    },
  { value: "20K+", label: "Products in Stock",  icon: <FiPackage size={20}/> },
  { value: "5K+",  label: "Happy Customers",    icon: <FiUsers size={20}/>   },
];
 
const CONTACT = [
  { icon: <FiMapPin size={18}/>,  label: "Address", value: "280 Khanjahan Ali Road, Rahmania Madrasha Complex, Khulna" },
  { icon: <FiPhone size={18}/>,   label: "Phone",   value: "02477-721990  ·  +880 1931-272839  ·  +880 1679-123205"   },
  { icon: <FiMail size={18}/>,    label: "Email",   value: "sislamkhulna1990@gmail.com"                               },
  { icon: <FiClock size={18}/>,   label: "Hours",   value: "Saturday – Thursday  |  8:00 AM – 8:00 PM"               },
];
 
const Marketing = () => {
 return (
    <section className="bg-white py-20 px-5">
      <div className="max-w-6xl mx-auto">
 
        {/* Section label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-1 bg-blue-600 rounded-full" />
          <span className="text-blue-500 text-sm font-bold uppercase tracking-widest">About Us</span>
        </div>
 
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
 
          {/* ── LEFT — text content ── */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Khulna's Most Trusted<br />
              <span className="text-orange-500">Hardware Store</span>
            </h2>
 
            <p className="text-gray-600 text-lg leading-relaxed mb-5">
              Established in 1990, Khulna Hardware Mart has spent over three decades building a reputation that every contractor, builder, and homeowner in Khulna can rely on. Located at 280 Khanjahan Ali Road inside the Rahmania Madrasha Complex, our showroom carries more than 20,000 products across plumbing, paints, tools, electrical, and more.
            </p>
 
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              We are not an online store — we believe the best hardware experience happens in person. Walk into our showroom, speak with our expert staff, see the products yourself, and leave with exactly what your project needs.
            </p>
 
            {/* Quote / motto */}
            <div className="border-l-4 border-blue-500 bg-orange-50 rounded-r-2xl px-6 py-5 mb-10">
              <p className="text-blue-500 text-xl font-semibold italic leading-snug">
                "Quality products. Fair prices. Honest advice — for 35 years."
              </p>
            </div>
 
            {/* Contact info */}
            <div className="space-y-4">
              {CONTACT.map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-orange-700 flex-shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-base font-semibold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
 
          {/* ── RIGHT — stat cards + visual ── */}
          <div className="flex flex-col gap-6">
 
            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map(({ value, label, icon }, i) => (
                <div key={label}
                  className={`rounded-2xl p-6 flex flex-col gap-3
                    ${i === 0 ? "bg-orange-500 text-white"
                    : i === 1 ? "bg-gray-900 text-white"
                    : "bg-gray-50 border border-gray-200 text-gray-900"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${i === 0 ? "bg-white/15 text-white"
                    : i === 1 ? "bg-white/10 text-orange-400"
                    : "bg-orange-100 text-orange-500"}`}>
                    {icon}
                  </div>
                  <div>
                    <div className="text-3xl font-bold leading-none">{value}</div>
                    <div className={`text-sm mt-1 font-medium ${i < 2 ? "opacity-70" : "text-gray-500"}`}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
 
            {/* Visit us card */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-7 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <FiMapPin size={20} className="text-white"/>
                </div>
                <h3 className="text-xl font-bold">Visit Our Showroom</h3>
              </div>
              <p className="text-orange-100 text-base leading-relaxed mb-5">
                We are an in-store experience. Come see our full range of 20,000+ products, get expert advice from our team, and leave with exactly what you need.
              </p>
              <img src={img} className="rounded-2xl mb-5" alt="" />
              <div className="bg-white/15 rounded-xl px-4 py-3 text-sm font-semibold text-orange-100">
                280 Khanjahan Ali Road, Rahmania Madrasha Complex, Khulna
              </div>
            </div>
 
          </div>
        </div>
      </div>
    </section>
  );
}
 
export default Marketing;