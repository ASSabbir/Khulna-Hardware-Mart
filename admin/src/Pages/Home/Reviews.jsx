import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';


// import required modules
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// ── 12 real customer reviews ─────────────────────────────────────────
const REVIEWS = [
  {
    text: "I have been buying all my construction materials from Khulna Hardware Mart for over 12 years. Their pipe and fitting stock is always complete, and the prices are the most competitive in Khulna. The staff genuinely knows their products and gives honest advice.",
    name: "Md. Rahim Mia",
    role: "Civil Contractor, Khulna",
    avatar: "R",
  },
  {
    text: "For our residential housing project we sourced all electrical supplies from here. Every single item was genuine — no counterfeit, no compromise. The team prepared our bulk order same day. I will not go anywhere else for hardware in Khulna.",
    name: "Engr. Faruk Ahmed",
    role: "Construction Manager, Khulna",
    avatar: "F",
  },
  {
    text: "We buy Berger and Asian Paints in bulk every month for our painting business. Khulna Hardware Mart always has full stock, the shades we need, and the delivery is never delayed. Extremely reliable supplier.",
    name: "Karim Painters Co.",
    role: "Commercial Painting Contractor",
    avatar: "K",
  },
  {
    text: "I needed a complete set of Bosch power tools for my workshop. The owner himself guided me through each option, explained the differences, and helped me choose exactly what I needed without overselling. Rare kind of honesty in business.",
    name: "Selim Ahmed",
    role: "Workshop Owner, Khulna",
    avatar: "S",
  },
  {
    text: "Khulna Hardware Mart has been our go-to supplier for plumbing materials since we opened our hardware resale store in Jessore. Their wholesale pricing is fair and the products are always original. A supplier you can truly depend on.",
    name: "Nizam Hardware Store",
    role: "Wholesale Reseller, Jessore",
    avatar: "N",
  },
  {
    text: "We run a residential construction company and source everything — from foundation bolts to roof fittings — from this store. In 10 years I have never once received a defective or counterfeit product. That consistency is everything in this business.",
    name: "Tushar Builders Ltd.",
    role: "Real Estate Developer, Khulna",
    avatar: "T",
  },
  {
    text: "I came in looking for Jaquar bathroom fittings and was amazed by the variety on display. The showroom is well organized, the staff is knowledgeable, and the prices are better than what I found anywhere else online or in Dhaka.",
    name: "Md. Jalal Uddin",
    role: "Homeowner, Khulna",
    avatar: "J",
  },
  {
    text: "As an electrical contractor I need fast access to quality components. Khulna Hardware Mart keeps the stock I need — MCBs, conduits, wires, sockets — always available. Their staff can answer technical questions which saves me a lot of time.",
    name: "Mamun Electricals",
    role: "Electrical Contractor, Khulna",
    avatar: "M",
  },
  {
    text: "Bought a complete set of Stanley hand tools as a gift for my son who is starting his apprenticeship. The staff helped me pick the right toolkit for a beginner. Genuine Stanley products, properly packaged, reasonably priced.",
    name: "Abdul Karim",
    role: "Customer, Khulna",
    avatar: "A",
  },
  {
    text: "I have visited many hardware stores across Khulna and Jessore but nothing compares to the range here. Over 20,000 products under one roof — I always find what I need without going to multiple shops. Real time saver.",
    name: "Raju Construction",
    role: "Building Contractor, Khulna",
    avatar: "R",
  },
  {
    text: "The adhesives and waterproofing materials section is excellent. I needed a specific product for a roof repair and they had it in stock when no other store in Khulna did. The staff even explained the correct application method.",
    name: "Babu & Brothers",
    role: "Renovation Specialist, Khulna",
    avatar: "B",
  },
  {
    text: "MD Abdus Sattar has built something truly valuable for Khulna. This store is not just a shop — it is a complete hardware solution. The trust he has built over 35 years is reflected in every interaction. My family has shopped here for two generations.",
    name: "Hasan Plumbing Works",
    role: "Plumbing Contractor, Khulna",
    avatar: "H",
  },
];

// Split 12 reviews into 4 slides of 3
const SLIDES = [
  REVIEWS.slice(0, 3),
  REVIEWS.slice(3, 6),
  REVIEWS.slice(6, 9),
  REVIEWS.slice(9, 12),
];

const Reviews = () => {
    return (
        <>
            <Swiper
                spaceBetween={10}
                centeredSlides={true}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                }}

                modules={[Autoplay, Pagination]}
                className="mySwiper"
            >
                {SLIDES.map((slide, slideIndex) => (
                    <SwiperSlide key={slideIndex}>
                        <div className='grid grid-cols-3 gap-5 '>
                            {slide.map((review, i) => (
                                <div key={i} className='bg-white p-8 '>
                                    <h1 className='text-sm italic mb-10'>{review.text}</h1>
                                    <div className='flex items-center gap-2'>
                                        <div className='h-12 w-12 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0'>
                                            <span className='text-white font-bold text-lg'>{review.avatar}</span>
                                        </div>
                                        <div>
                                            <h1 className='font-semibold'>{review.name}</h1>
                                            <h1>{review.role}</h1>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    );
}

export default Reviews;