import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiPackage, FiShoppingCart, FiUsers, FiDollarSign,
  FiTrendingUp, FiTool, FiArrowRight, FiCheckCircle,
  FiStar, FiShield, FiClock
} from 'react-icons/fi';

const Home = () => {
  const features = [
    {
      icon: <FiPackage size={28} />,
      title: "Product Management",
      desc: "Track 30,000+ products with advanced search, categories, and real-time stock tracking.",
      color: "bg-blue-500"
    },
    {
      icon: <FiShoppingCart size={28} />,
      title: "Smart Invoicing",
      desc: "Generate professional invoices instantly with automatic stock deduction and customer tracking.",
      color: "bg-orange-500"
    },
    {
      icon: <FiUsers size={28} />,
      title: "Customer Database",
      desc: "Manage customers, partners, and suppliers all in one place with complete transaction history.",
      color: "bg-green-500"
    },
    {
      icon: <FiDollarSign size={28} />,
      title: "Financial Tracking",
      desc: "Monitor revenue, expenses, and profit margins with detailed financial reports.",
      color: "bg-purple-500"
    }
  ];

  const stats = [
    { value: "30K+", label: "Products", icon: <FiPackage /> },
    { value: "10K+", label: "Customers", icon: <FiUsers /> },
    { value: "50K+", label: "Invoices", icon: <FiShoppingCart /> },
    { value: "৳100M+", label: "Revenue", icon: <FiTrendingUp /> },
  ];

  const testimonials = [
    {
      name: "Rahim Enterprise",
      text: "Best hardware management system in Khulna. Very fast and reliable.",
      rating: 5
    },
    {
      name: "Karim Trading",
      text: "The stock warning feature saved us multiple times. Highly recommended!",
      rating: 5
    },
    {
      name: "Bhai Bhai Hardware",
      text: "Customer management is so easy now. Love the professional invoice design.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <FiTool size={16} />
                Since 1976 · Centenary Established
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Khulna Hardware Mart
                <span className="block text-orange-400">Management System</span>
              </h1>
              <p className="text-lg text-blue-100 mb-8 max-w-xl">
                Complete inventory management, invoicing, customer & supplier tracking,
                and financial reporting — all in one powerful system built for hardware businesses.
              </p>
              <div className="flex flex-wrap gap-4">
                <NavLink to="/dashboard" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all transform hover:scale-105">
                  Go to Dashboard <FiArrowRight />
                </NavLink>
                <NavLink to="/products" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all">
                  View Products
                </NavLink>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, i) => (
                      <div key={i} className="bg-white/10 rounded-2xl p-6 text-center">
                        <div className="text-orange-400 mb-2 flex justify-center">{stat.icon}</div>
                        <div className="text-3xl font-bold">{stat.value}</div>
                        <div className="text-blue-200 text-sm">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete business management solution tailored for hardware stores
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-blue-200 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Why Khulna Hardware Mart Trusts Our System?
              </h2>
              <div className="space-y-6">
                {[
                  { icon: <FiShield />, title: "Secure & Reliable", desc: "Your data is protected with enterprise-grade security" },
                  { icon: <FiClock />, title: "24/7 Available", desc: "Access your business data anytime, anywhere" },
                  { icon: <FiTrendingUp />, title: "Growth Analytics", desc: "Track performance and grow your business with insights" },
                  { icon: <FiStar />, title: "Free Support", desc: "Dedicated support team ready to help you" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-md">
                  <div className="flex gap-1 mb-3">
                    {[...Array(t.rating)].map((_, r) => (
                      <FiStar key={r} className="text-amber-400 fill-amber-400" size={16} />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-900">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-orange-100 text-lg mb-8">
            Join thousands of happy hardware businesses using our management system
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <NavLink to="/dashboard" className="bg-white text-orange-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition">
              Get Started Now
            </NavLink>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <FiTool size={24} />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold">Khulna Hardware Mart</div>
              <div className="text-gray-400 text-sm">Since 1976 · Centenary Established</div>
            </div>
          </div>
          <p className="text-gray-400">
            280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna · 02477-721990
          </p>
          <p className="text-gray-500 text-sm mt-4">
            © 2024 Khulna Hardware Mart. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;