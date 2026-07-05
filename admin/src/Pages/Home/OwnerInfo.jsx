import {
  FiAward, FiMapPin, FiPhone, FiMail,
  FiCalendar, FiStar, FiUsers, FiPackage,
} from "react-icons/fi";

// 👉 Replace this with the real image path when you have it
// import ownerImg from "../assets/abdus-sattar.jpg";
// then use:  src={ownerImg}
const OWNER_IMAGE = 'https://i.pinimg.com/736x/d0/dd/2c/d0dd2c8bb30ef5281ebb4472f1cc71fa.jpg'; // set to imported image when ready

const HIGHLIGHTS = [
  { icon: <FiCalendar size={18}/>, label: "Founded",          value: "1990"             },
  { icon: <FiAward size={18}/>,    label: "Experience",       value: "35+ Years"        },
  { icon: <FiPackage size={18}/>,  label: "Products",         value: "20,000+ SKUs"     },
  { icon: <FiUsers size={18}/>,    label: "Customers Served", value: "5,000+"           },
  { icon: <FiStar size={18}/>,     label: "Reputation",       value: "Khulna's Trusted" },
  { icon: <FiMapPin size={18}/>,   label: "Location",         value: "Khulna, BD"       },
];

export default function OwnerInfo() {
  return (
    <section className="bg-gray-50 py-20 px-5">
      <div className="max-w-6xl mx-auto">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-1 bg-blue-600 rounded-full" />
          <span className="text-blue-700 text-sm font-bold uppercase tracking-widest">
            Ownership
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* ── LEFT — Owner image + name card ── */}
          <div className="flex flex-col items-center lg:items-start gap-6">

            {/* Photo */}
            <div className="relative">
              <div className="w-64 h-72 sm:w-72 sm:h-80 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-blue-800 flex items-center justify-center">
                {OWNER_IMAGE ? (
                  <img
                    src={OWNER_IMAGE}
                    alt="MD Abdus Sattar"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  // Placeholder until real image is added
                  <div className="flex flex-col items-center gap-4 text-white/60 px-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">A</span>
                    </div>
                    <p className="text-sm">
                      Replace <code className="text-blue-300">OWNER_IMAGE</code> with<br />the actual photo import
                    </p>
                  </div>
                )}
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-blue-700 text-white rounded-2xl px-5 py-3 shadow-xl">
                <div className="text-xl font-bold leading-none">35+</div>
                <div className="text-blue-200 text-xs font-medium mt-0.5">Years in Business</div>
              </div>
            </div>

            {/* Name plate */}
            <div className="bg-white border border-gray-200 rounded-2xl px-7 py-5 shadow-sm w-full max-w-xs lg:max-w-full">
              <h3 className="text-2xl font-bold text-gray-900">MD Abdus Sattar</h3>
              <p className="text-blue-700 font-semibold text-base mt-0.5">Founder & Owner</p>
              <p className="text-gray-500 text-sm mt-1">Khulna Hardware Mart — Est. 1990</p>

              {/* Contact links */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <a href="tel:+8801931272839"
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-700 transition font-medium">
                  <FiPhone size={14} className="text-blue-600 flex-shrink-0" />
                  +880 1931-272839
                </a>
                <a href="tel:+8801679123205"
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-700 transition font-medium">
                  <FiPhone size={14} className="text-blue-600 flex-shrink-0" />
                  +880 1679-123205
                </a>
                <a href="mailto:sislamkhulna1990@gmail.com"
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-700 transition font-medium">
                  <FiMail size={14} className="text-blue-600 flex-shrink-0" />
                  sislamkhulna1990@gmail.com
                </a>
                <div className="flex items-center gap-2.5 text-sm text-gray-500 font-medium">
                  <FiMapPin size={14} className="text-blue-600 flex-shrink-0" />
                  280 Khanjahan Ali Road, Khulna
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT — Bio + highlights ── */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              The Man Behind<br />
              <span className="text-blue-700">35 Years of Trust</span>
            </h2>

            <p className="text-gray-600 text-lg leading-relaxed mb-5">
              MD Abdus Sattar founded Khulna Hardware Mart in 1990 with a single goal — to provide the people of Khulna with genuine, quality hardware products at honest prices. What started as a modest shop on Khanjahan Ali Road has grown into the region's most comprehensive hardware destination.
            </p>

            <p className="text-gray-600 text-lg leading-relaxed mb-5">
              With over three decades of hands-on experience in the hardware trade, he has built lasting relationships with top manufacturers and distributors across Bangladesh, ensuring that every product on the shelf is authentic and fairly priced.
            </p>

            <p className="text-gray-600 text-lg leading-relaxed mb-10">
              His philosophy has always been straightforward — treat every customer with respect, give honest advice, and never compromise on product quality. That philosophy is the foundation on which 5,000+ loyal customers have been built.
            </p>

            {/* Highlights grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {HIGHLIGHTS.map(({ icon, label, value }) => (
                <div key={label}
                  className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    {icon}
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                  </div>
                  <div className="text-base font-bold text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}