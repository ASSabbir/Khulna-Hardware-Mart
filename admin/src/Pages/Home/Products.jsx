const CATEGORIES = [
    { image: "https://supremebathfitting.com/wp-content/uploads/2020/07/14-7.jpg", title: "Washroom Accessories", desc: "Showers, towel bars, soap dispensers, mirrors & more", tag: "Washroom", tagColor: "bg-blue-100 text-blue-700" },
    { image: "https://rakarabian.com/images/courses/2.jpg", title: "Pipes & Fittings", desc: "PVC, CPVC, GI pipes, valves, elbows & connectors", tag: "Plumbing", tagColor: "bg-green-100 text-green-700" },
    { image: "https://housing.com/news/wp-content/uploads/2024/02/How-to-choose-washbasin-taps-for-your-home-f.jpg", title: "Taps & Faucets", desc: "Kitchen, bathroom, wall-mount taps from top brands", tag: "Plumbing", tagColor: "bg-green-100 text-green-700" },
    { image: "https://horizongroup.ae/wp-content/uploads/2018/12/Coatings-_-Inks.jpeg", title: "Paints & Coatings", desc: "Interior, exterior, emulsion, primer & texture paints", tag: "Paint", tagColor: "bg-pink-100 text-pink-700" },
    { image: "https://www.saif.com/images/SafetyandHealth/CoreDocPages/handTools.PNG", title: "Hand Tools", desc: "Hammers, wrenches, screwdrivers, pliers & toolkits", tag: "Tools", tagColor: "bg-orange-100 text-orange-700" },
    { image: "https://sme.supply/uploads/products/1693176274.png", title: "Measuring Tools", desc: "Tape measures, levels, laser measures & squares", tag: "Tools", tagColor: "bg-orange-100 text-orange-700" },
    { image: "https://plelectricsupply.ca/cdn/shop/collections/latest.jpg?v=1750085414&width=1500", title: "Electrical Supplies", desc: "Wires, switches, sockets, MCBs & circuit breakers", tag: "Electrical", tagColor: "bg-yellow-100 text-yellow-700" },
    { image: "https://www.geya.net/wp-content/uploads/2025/06/Safety-and-protection-electrical-equipment-examples.png", title: "Power Tools", desc: "Drills, grinders, saws, sanders & cordless tools", tag: "Tools", tagColor: "bg-orange-100 text-orange-700" },
];

const Products = () => {
    return (
        <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-3">Product Categories</span>
                        <h2 className="text-3xl font-semibold text-gray-900">Shop by category</h2>
                        <p className="text-gray-500 mt-2 text-sm">Browse our wide range of hardware, plumbing, and home improvement products</p>
                    </div>
                    <button className="hidden md:inline-flex text-sm text-green-700 border border-green-200 px-5 py-2 rounded-lg hover:bg-green-50 transition font-medium">
                        View all →
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {CATEGORIES.map(({ image, title, desc, tag, tagColor }) => (
                        <div
                            key={title}
                            className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                        >
                            {/* Image Section */}
                            <div className="h-40 flex items-center justify-center bg-gray-50 group-hover:bg-green-50 transition-colors">
                                <img
                                    src={image}
                                    alt=""
                                    className="h-full w-full object-cover object-center"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                    {title}
                                </h3>
                                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                    {desc}
                                </p>
                                <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-md ${tagColor}`}
                                >
                                    {tag}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Products;