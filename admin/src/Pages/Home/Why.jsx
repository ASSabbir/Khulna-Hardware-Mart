import React from 'react';

const Why = () => {
     
const WHY_US = [
  { icon: "🏪", title: "Specialized Showroom", desc: "Dedicated display area for washroom fittings, paints, and tools so you can see before you buy" },
  { icon: "✅", title: "Genuine Products Only", desc: "We stock 100% authentic products from certified brands — no imitations, no compromises" },
  { icon: "💬", title: "Free Consultation", desc: "Our experts help you choose the right pipe, tap, or paint for your project at no charge" },
  { icon: "🚚", title: "Fast Delivery in Dhaka", desc: "Same-day or next-day delivery to your site across Dhaka city" },
  { icon: "💰", title: "Competitive Pricing", desc: "Best price guaranteed on all products — bulk discounts available for contractors" },
  { icon: "🔁", title: "Easy Returns", desc: "Hassle-free 7-day return policy on all stocked items with valid receipt" },
];
    return (
         <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-3">Why choose us</span>
            <h2 className="text-3xl font-semibold text-gray-900">Built on trust & quality</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-md">Serving contractors, builders, and homeowners across Dhaka for over 15 years.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_US.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-sm transition">
                <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
};

export default Why;