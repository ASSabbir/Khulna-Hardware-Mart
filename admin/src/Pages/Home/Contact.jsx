import React from 'react';

const Contact = () => {
    return (
         <section className="bg-orange-500 py-14 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">Need bulk materials for your project?</h2>
            <p className="text-green-200 text-sm max-w-lg">Get special contractor pricing on orders above ৳10,000. Our team will help you plan your material list.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button className="bg-white text-green-800 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-green-50 transition">
              📞 Call us now
            </button>
            <button className="border border-white/40 text-white px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition">
              💬 WhatsApp
            </button>
          </div>
        </div>
      </section>
    );
};

export default Contact;