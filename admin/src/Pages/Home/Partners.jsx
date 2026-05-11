import React from 'react';

const Partners = () => {
    const BRANDS = ["Berger Paints", "Asian Paints", "Stanley Tools", "Bosch", "Supreme Pipes", "Jaquar", "Makita", "Black & Decker"];
    return (
        <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-3">Trusted brands</span>
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">We carry the best brands</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {BRANDS.map((brand) => (
              <span key={brand} className="bg-gray-100 text-gray-600 text-sm font-medium px-6 py-3 rounded-xl hover:bg-green-100 hover:text-green-700 transition cursor-pointer">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>
    );
};

export default Partners;