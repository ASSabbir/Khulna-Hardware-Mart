import React, { useEffect, useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import img5 from "/public/Image/img5.png";
import img6 from "/public/Image/img6.jpg";
import img7 from "/public/Image/img7.png";
import img8 from "/public/Image/img8.jpg";
import img9 from "/public/Image/img9.jfif";
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// import './s';

// import required modules
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import axios from 'axios';
const Slider = () => {



    return (
        <>
            <Swiper
                spaceBetween={30}
                centeredSlides={true}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                }}
                navigation={true}
                modules={[Autoplay, Pagination, Navigation]}
                className="mySwiper"
            >
                {/* Slide 1 - Bathroom Essentials */}
                <SwiperSlide>
                    <div className="relative h-[380px] md:h-[450px] flex" style={{ background: "#1E3A8A" }}>
                        <div className="w-1/2 flex flex-col justify-center px-8 md:px-14 z-10">
                            <span className="text-white text-xs font-semibold tracking-wide bg-[#F97316] px-3 py-1 rounded-full w-fit mb-3">
                                Bathroom Essentials
                            </span>
                            <h2 className="text-white text-3xl md:text-5xl font-bold leading-tight ">
                                Modern Basin &{"\n"}Washroom Fittings
                            </h2>
                            <p className="text-white/80 text-sm md:text-base mt-3 leading-relaxed max-w-md whitespace-pre-line">
                                Premium quality basin mixers, taps and accessories.{"\n"}Durable, rust-proof and stylish design.
                            </p>
                            <button className="mt-5 w-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition" style={{ background: "#2563EB" }}>
                                Shop Basin Items
                            </button>
                        </div>
                        <div className="w-1/2 h-full relative">
                            <img src={img5} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                    </div>
                </SwiperSlide>

                {/* Slide 2 - Kitchen Upgrade */}
                <SwiperSlide>
                    <div className="relative h-[380px] md:h-[450px] flex" style={{ background: "#065F46" }}>
                        <div className="w-1/2 flex flex-col justify-center px-8 md:px-14 z-10">
                            <span className="text-white text-xs font-semibold tracking-wide bg-[#F97316] px-3 py-1 rounded-full w-fit mb-3">
                                Kitchen Upgrade
                            </span>
                            <h2 className="text-white text-3xl md:text-5xl font-bold leading-tight ">
                                Kitchen Sink &{"\n"}Faucet Collection
                            </h2>
                            <p className="text-white/80 text-sm md:text-base mt-3 leading-relaxed max-w-md whitespace-pre-line">
                                High-quality stainless steel sinks and faucets.{"\n"}Perfect for modern kitchens.
                            </p>
                            <button className="mt-5 w-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition" style={{ background: "#10B981" }}>
                                Explore Kitchen
                            </button>
                        </div>
                        <div className="w-1/2 h-full relative">
                            <img src={img6} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                    </div>
                </SwiperSlide>

                {/* Slide 3 - Hot Deal */}
                <SwiperSlide>
                    <div className="relative h-[380px] md:h-[450px] flex" style={{ background: "#7C2D12" }}>
                        <div className="w-1/2 flex flex-col justify-center px-8 md:px-14 z-10">
                            <span className="text-white text-xs font-semibold tracking-wide bg-[#F97316] px-3 py-1 rounded-full w-fit mb-3">
                                Hot Deal
                            </span>
                            <h2 className="text-white text-3xl md:text-5xl font-bold leading-tight ">
                                PVC & CPVC{"\n"}Pipes and Fittings
                            </h2>
                            <p className="text-white/80 text-sm md:text-base mt-3 leading-relaxed max-w-md whitespace-pre-line">
                                Strong, leak-proof pipes for home and industry use.{"\n"}Best price guaranteed.
                            </p>
                            <button className="mt-5 w-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition" style={{ background: "#EA580C" }}>
                                View Pipes
                            </button>
                        </div>
                        <div className="w-1/2 h-full relative">
                            <img src={img7} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                    </div>
                </SwiperSlide>

                {/* Slide 4 - Shower Solutions */}
                <SwiperSlide>
                    <div className="relative h-[380px] md:h-[450px] flex" style={{ background: "#312E81" }}>
                        <div className="w-1/2 flex flex-col justify-center px-8 md:px-14 z-10">
                            <span className="text-white text-xs font-semibold tracking-wide bg-[#F97316] px-3 py-1 rounded-full w-fit mb-3">
                                Shower Solutions
                            </span>
                            <h2 className="text-white text-3xl md:text-5xl font-bold leading-tight ">
                                Shower Sets &{"\n"}Bathroom Accessories
                            </h2>
                            <p className="text-white/80 text-sm md:text-base mt-3 leading-relaxed max-w-md whitespace-pre-line">
                                Rain showers, hand showers & complete sets.{"\n"}Comfort meets elegance.
                            </p>
                            <button className="mt-5 w-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition" style={{ background: "#6366F1" }}>
                                Browse Showers
                            </button>
                        </div>
                        <div className="w-1/2 h-full relative">
                            <img src={img8} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                    </div>
                </SwiperSlide>

                {/* Slide 5 - New Arrival */}
                <SwiperSlide>
                    <div className="relative h-[380px] md:h-[450px] flex" style={{ background: "#78350F" }}>
                        <div className="w-1/2 flex flex-col justify-center px-8 md:px-14 z-10">
                            <span className="text-white text-xs font-semibold tracking-wide bg-[#F97316] px-3 py-1 rounded-full w-fit mb-3">
                                New Arrival
                            </span>
                            <h2 className="text-white text-3xl md:text-5xl font-bold  leading-tight ">
                                Angle Valve &{"\n"}Tap Accessories
                            </h2>
                            <p className="text-white/80 text-sm md:text-base mt-3 leading-relaxed max-w-md whitespace-pre-line">
                                Complete fitting solutions for every corner.{"\n"}Reliable and long-lasting.
                            </p>
                            <button className="mt-5 w-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition" style={{ background: "#F59E0B" }}>
                                See Accessories
                            </button>
                        </div>
                        <div className="w-1/2 h-full relative">
                            <img src={img9} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                    </div>
                </SwiperSlide>


            </Swiper>
        </>
    );
}

export default Slider;