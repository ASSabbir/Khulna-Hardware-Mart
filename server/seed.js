const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");
const Supplier = require("./models/Supplier");

dotenv.config();

const products = [
  // Hand Tools
  { name: "Heavy Duty Hammer 16oz", sku: "STN-HAM-016", category: "Hand Tools", brand: "Stanley", buyingPrice: 350, stock: 120, unit: "pcs", status: "active", description: "Professional grade claw hammer with fiberglass handle. Shock-absorbing grip for comfort.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack A-1" },
  { name: "Adjustable Wrench 12\"", sku: "BHC-WRN-012", category: "Hand Tools", brand: "Bahco", buyingPrice: 620, stock: 60, unit: "pcs", status: "active", description: "High-quality adjustable wrench with precision jaw settings. Chrome vanadium steel.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack A-2" },
  { name: "Pliers Combination 8\"", sku: "KPX-PLR-008", category: "Hand Tools", brand: "Knipex", buyingPrice: 410, stock: 55, unit: "pcs", status: "active", description: "German-engineered combination pliers with induction hardened cutting edges.", holcellMargin: 3, retailMargin: 5, reorderLevel: 8, location: "Rack A-3" },
  { name: "Screwdriver Set (8pcs)", sku: "WRA-SDR-008", category: "Hand Tools", brand: "Wera", buyingPrice: 760, stock: 35, unit: "set", status: "active", description: "Premium screwdriver set with Kraftform handles. Includes Phillips, flat, and Torx.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack A-4" },
  { name: "Wire Cutter 6\"", sku: "KPX-CUT-006", category: "Hand Tools", brand: "Knipex", buyingPrice: 340, stock: 65, unit: "pcs", status: "active", description: "Precision wire cutters with induction hardened blades. Ergonomic handles.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack A-5" },
  { name: "Hacksaw Frame + Blade", sku: "STN-HSK-FRM", category: "Hand Tools", brand: "Stanley", buyingPrice: 185, stock: 90, unit: "pcs", status: "active", description: "Adjustable hacksaw frame with quick-release blade change mechanism.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack A-6" },
  { name: "Rubber Mallet 24oz", sku: "VAU-MLT-024", category: "Hand Tools", brand: "Vaughan", buyingPrice: 295, stock: 42, unit: "pcs", status: "active", description: "Split head rubber mallet with fiberglass handle. Non-marring for delicate work.", holcellMargin: 3, retailMargin: 5, reorderLevel: 8, location: "Rack A-7" },
  { name: "Spirit Level 24\"", sku: "STN-LVL-024", category: "Measuring & Marking", brand: "Stanley", buyingPrice: 390, stock: 28, unit: "pcs", status: "active", description: "24-inch aluminum box beam level with vial views on all sides.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack A-8" },

  // Power Tools
  { name: "Cordless Drill Machine 18V", sku: "BSH-DRL-18V", category: "Power Tools", brand: "Bosch", buyingPrice: 4800, stock: 22, unit: "pcs", status: "active", description: "18V lithium-ion cordless drill with 2-speed gearbox. Includes 2 batteries.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack B-1" },
  { name: "Angle Grinder 4\" 720W", sku: "MAK-AGD-4IN", category: "Power Tools", brand: "Makita", buyingPrice: 3200, stock: 15, unit: "pcs", status: "active", description: "720W angle grinder with side handle and disc guard. spindle lock included.", holcellMargin: 3, retailMargin: 5, reorderLevel: 3, location: "Rack B-2" },
  { name: "Jigsaw 500W", sku: "BSH-JIG-500W", category: "Power Tools", brand: "Bosch", buyingPrice: 3800, stock: 18, unit: "pcs", status: "active", description: "500W jigsaw with variable speed control and dust blower.", holcellMargin: 3, retailMargin: 5, reorderLevel: 4, location: "Rack B-3" },

  // Measuring & Marking
  { name: "Steel Measuring Tape 10m", sku: "KML-TPE-10M", category: "Measuring & Marking", brand: "Komelon", buyingPrice: 280, stock: 85, unit: "pcs", status: "active", description: "Professional 10-meter measuring tape with automatic rewind. Metric & inch markings.", holcellMargin: 3, retailMargin: 5, reorderLevel: 12, location: "Rack C-1" },
  { name: "Steel Ruler 300mm", sku: "STR-RLR-300", category: "Measuring & Marking", brand: "Starrett", buyingPrice: 210, stock: 60, unit: "pcs", status: "active", description: "Stainless steel ruler with decimal & fraction markings. High visibility.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack C-2" },
  { name: "Chalk Line Reel 30m", sku: "TMJ-CLK-30M", category: "Measuring & Marking", brand: "Tajima", buyingPrice: 340, stock: 45, unit: "pcs", status: "active", description: "30-meter chalk line reel with 4:1 gear ratio. Includes blue chalk.", holcellMargin: 3, retailMargin: 5, reorderLevel: 8, location: "Rack C-3" },
  { name: "Voltage Tester Pen", sku: "FLK-VLT-PEN", category: "Electrical", brand: "Fluke", buyingPrice: 890, stock: 20, unit: "pcs", status: "active", description: "Non-contact voltage tester pen with audible alert. CAT III rated.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack C-4" },
  { name: "Extension Cord 10m 16A", sku: "MKE-EXT-10M", category: "Electrical", brand: "MK Electric", buyingPrice: 650, stock: 35, unit: "pcs", status: "active", description: "10-meter heavy duty extension cord with 16A socket. Weather resistant.", holcellMargin: 3, retailMargin: 5, reorderLevel: 6, location: "Rack C-5" },

  // Pipes & Fittings
  { name: "PVC Pipe 1\" x 20ft", sku: "BPC-PVC-1IN", category: "Pipes & Fittings", brand: "Bengal PVC", buyingPrice: 190, stock: 300, unit: "pcs", status: "active", description: "1-inch diameter PVC pipe, 20 feet length. SDR 13.5 pressure rated.", holcellMargin: 3, retailMargin: 5, reorderLevel: 50, location: "Rack D-1" },
  { name: "HDPE Pipe 2\" x 50m", sku: "PRN-HDP-2IN", category: "Pipes & Fittings", brand: "Pran", buyingPrice: 3600, stock: 12, unit: "roll", status: "active", description: "2-inch HDPE pipe, 50 meter roll. PN16 pressure rating. Black.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack D-2" },
  { name: "PVC Ball Valve 1\"", sku: "WAV-BLV-1IN", category: "Pipes & Fittings", brand: "Wavin", buyingPrice: 165, stock: 130, unit: "pcs", status: "active", description: "1-inch PVC ball valve with lever handle. Solvent weld ends.", holcellMargin: 3, retailMargin: 5, reorderLevel: 20, location: "Rack D-3" },
  { name: "Hose Clamp 2\" (10pcs)", sku: "JUB-HCL-2IN", category: "Pipes & Fittings", brand: "Jubilee", buyingPrice: 130, stock: 220, unit: "pack", status: "active", description: "Stainless steel hose clamps, 2-inch size. Pack of 10 pieces.", holcellMargin: 3, retailMargin: 5, reorderLevel: 30, location: "Rack D-4" },

  // Fasteners & Hardware
  { name: "Nut Bolt Set M10 (50pcs)", sku: "LCL-NBS-M10", category: "Fasteners & Hardware", brand: "Local", buyingPrice: 120, stock: 600, unit: "pack", status: "active", description: "M10 zinc-plated nut and bolt set. 50 complete sets per pack.", holcellMargin: 3, retailMargin: 5, reorderLevel: 100, location: "Rack E-1" },
  { name: "Cable Tie 200mm (100pcs)", sku: "HLM-CT-200", category: "Fasteners & Hardware", brand: "Hellermann", buyingPrice: 95, stock: 400, unit: "pack", status: "active", description: "Black nylon cable ties, 200mm length. Pack of 100 pieces. UV resistant.", holcellMargin: 3, retailMargin: 5, reorderLevel: 50, location: "Rack E-2" },
  { name: "Sanding Disc 5\" 80G (50pcs)", sku: "3M-SND-5IN-80", category: "Fasteners & Hardware", brand: "3M", buyingPrice: 55, stock: 500, unit: "pack", status: "active", description: "5-inch sanding discs, 80 grit. Aluminum oxide. Hook and loop.", holcellMargin: 3, retailMargin: 5, reorderLevel: 80, location: "Rack E-3" },
  { name: "Masking Tape 2\" x 50m", sku: "3M-MSK-2IN", category: "Fasteners & Hardware", brand: "3M", buyingPrice: 175, stock: 110, unit: "roll", status: "active", description: "2-inch masking tape, 50 meter roll. Cream colored, medium adhesion.", holcellMargin: 3, retailMargin: 5, reorderLevel: 20, location: "Rack E-4" },

  // Building Materials
  { name: "Cement Bag (50kg)", sku: "BSH-CEM-50K", category: "Building Materials", brand: "Bashundhara", buyingPrice: 480, stock: 200, unit: "bag", status: "active", description: "OPC Cement, 50kg bag. Strength: 52.5 MPa. Grey color.", holcellMargin: 3, retailMargin: 5, reorderLevel: 30, location: "Rack F-1" },
  { name: "Wall Putty (20kg)", sku: "BRG-PUT-20K", category: "Building Materials", brand: "Berger", buyingPrice: 850, stock: 60, unit: "bag", status: "active", description: "Ready-mix wall putty, 20kg bag. White. For interior walls.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack F-2" },
  { name: "Tile Adhesive (20kg)", sku: "WBR-TAD-20K", category: "Building Materials", brand: "Weber", buyingPrice: 720, stock: 55, unit: "bag", status: "active", description: "Premium tile adhesive, 20kg bag. For ceramic and porcelain tiles.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack F-3" },
  { name: "Flush Door (7x3 ft)", sku: "PTX-DOR-7X3", category: "Building Materials", brand: "Partex", buyingPrice: 2400, stock: 30, unit: "pcs", status: "active", description: "Flush door, 7 feet x 3 feet. Commercial grade. Timber frame.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack F-4" },
  { name: "Roofing Sheet GI 26G", sku: "BSR-RFG-26G", category: "Building Materials", brand: "BSRM", buyingPrice: 1200, stock: 40, unit: "pcs", status: "active", description: "26 gauge galvanized iron roofing sheet. 10 feet length. Corrugated.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack F-5" },
  { name: "Angle Iron 1.5\" (20ft)", sku: "BSR-ANG-1.5", category: "Building Materials", brand: "BSRM", buyingPrice: 680, stock: 80, unit: "pcs", status: "active", description: "1.5-inch angle iron, 20 feet length. MS material. Equal leg.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack F-6" },

  // Safety Equipment
  { name: "Safety Helmet (White)", sku: "MSA-HLM-WHT", category: "Safety Equipment", brand: "MSA", buyingPrice: 320, stock: 40, unit: "pcs", status: "active", description: "Industrial safety helmet, white. ANSI Z89.1 certified. 4-point suspension.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack G-1" },
  { name: "Work Gloves (Leather)", sku: "HNK-GLV-LTH", category: "Safety Equipment", brand: "Honeywell", buyingPrice: 180, stock: 200, unit: "pair", status: "active", description: "Premium leather work gloves. Gunn cut pattern. Yellow cuff.", holcellMargin: 3, retailMargin: 5, reorderLevel: 30, location: "Rack G-2" },
  { name: "Scaffolding Clamp (5pcs)", sku: "SGB-SCF-CLM", category: "Safety Equipment", brand: "SGB", buyingPrice: 560, stock: 25, unit: "pack", status: "active", description: "Steel scaffolding clamp, 5 pieces per pack. Load tested. Hot dipped galvanized.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack G-3" },

  // Paints & Coatings
  { name: "Paint Brush Set (5pcs)", sku: "NIP-BRS-SET", category: "Paints & Coatings", brand: "Nippon", buyingPrice: 220, stock: 75, unit: "set", status: "active", description: "5-piece paint brush set. Sizes: 1\", 2\", 3\", 4\", 6\". Natural bristles.", holcellMargin: 3, retailMargin: 5, reorderLevel: 12, location: "Rack H-1" },
  { name: "Metal Primer (1L)", sku: "RST-PRM-MTL", category: "Paints & Coatings", brand: "Rust-Oleum", buyingPrice: 420, stock: 55, unit: "can", status: "active", description: "Corroseal metal primer, 1 liter can. Converts rust to primer. Grey finish.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack H-2" },

  // Adhesives & Sealants
  { name: "Silicone Sealant Clear (300ml)", sku: "WCK-SIL-CLR", category: "Adhesives & Sealants", brand: "Wacker", buyingPrice: 310, stock: 90, unit: "tube", status: "active", description: "Neutral cure silicone sealant, clear. 300ml cartridge. Weather resistant.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack I-1" },
  { name: "Epoxy Adhesive (500ml)", sku: "LCT-EPX-500", category: "Adhesives & Sealants", brand: "Loctite", buyingPrice: 540, stock: 45, unit: "tube", status: "active", description: "Two-part epoxy adhesive, 500ml. Sets in 5 minutes. Clear bonds.", holcellMargin: 3, retailMargin: 5, reorderLevel: 8, location: "Rack I-2" },
  { name: "Caulking Gun 10oz", sku: "NBR-CLG-10Z", category: "Adhesives & Sealants", brand: "Newborn", buyingPrice: 240, stock: 48, unit: "pcs", status: "active", description: "Professional caulking gun, 10oz capacity. Smooth rod design. Steel frame.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack I-3" },

  // Additional tools
  { name: "Chipping Chisel 1\"", sku: "TAP-CHS-1IN", category: "Hand Tools", brand: "Taparia", buyingPrice: 95, stock: 200, unit: "pcs", status: "active", description: "1-inch chipping chisel with SDS-plus shank. For concrete breaking.", holcellMargin: 3, retailMargin: 5, reorderLevel: 30, location: "Rack A-9" },
  { name: "Flat Chisel 3/4\"", sku: "BHC-FLT-3/4", category: "Hand Tools", brand: "Bahco", buyingPrice: 85, stock: 180, unit: "pcs", status: "active", description: "3/4-inch flat chisel. Hex shank. For metalwork and finishing.", holcellMargin: 3, retailMargin: 5, reorderLevel: 25, location: "Rack A-10" },
  { name: "Cold Chisel 1/2\" x 6\"", sku: "BHC-CLD-1/2", category: "Hand Tools", brand: "Bahco", buyingPrice: 115, stock: 160, unit: "pcs", status: "active", description: "1/2-inch cold chisel, 6-inch length. Carbon steel. Bright finish.", holcellMargin: 3, retailMargin: 5, reorderLevel: 20, location: "Rack A-11" },
  { name: "Round File 8\"", sku: "BHC-RND-8IN", category: "Hand Tools", brand: "Bahco", buyingPrice: 110, stock: 70, unit: "pcs", status: "active", description: "8-inch mill bastard round file. American pattern. For metal shaping.", holcellMargin: 3, retailMargin: 5, reorderLevel: 12, location: "Rack A-12" },
  { name: "Sandpaper Sheet 120 Grit (50pcs)", sku: "NRT-SND-120", category: "Fasteners & Hardware", brand: "Norton", buyingPrice: 35, stock: 800, unit: "ream", status: "active", description: "120 grit sandpaper sheets, 9\"x11\". Aluminum oxide. Pack of 50.", holcellMargin: 3, retailMargin: 5, reorderLevel: 100, location: "Rack E-5" },
  { name: "Pipe Wrench 14\"", sku: "RID-PWR-14IN", category: "Hand Tools", brand: "Ridgid", buyingPrice: 920, stock: 18, unit: "pcs", status: "active", description: "14-inch pipe wrench. Cast iron. Drop forged jaws. 450mm.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack A-13" },
  { name: "Pipe Bender 1/2\"", sku: "RTB-PBN-1/2", category: "Pipes & Fittings", brand: "Rothenberger", buyingPrice: 1650, stock: 8, unit: "pcs", status: "active", description: "Hydraulic pipe bender for 1/2-inch copper and steel tubes. Includes dies.", holcellMargin: 3, retailMargin: 5, reorderLevel: 2, location: "Rack D-5" },
  { name: "Drill Bit Set HSS 13pcs", sku: "BSH-DBS-HSS", category: "Power Tools", brand: "Bosch", buyingPrice: 980, stock: 25, unit: "set", status: "active", description: "13-piece HSS drill bit set. Sizes: 1-13mm. Metal case. TiN coated.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack B-4" },
  { name: "Socket Set 1/2\" 24pcs", sku: "FCM-SOC-24P", category: "Hand Tools", brand: "Facom", buyingPrice: 2800, stock: 10, unit: "set", status: "active", description: "24-piece 1/2\" socket set. Metric sizes 8-24mm. Chrome vanadium.", holcellMargin: 3, retailMargin: 5, reorderLevel: 3, location: "Rack A-14" },
  { name: "Hex Key Set 9pcs", sku: "WRA-HEX-9PC", category: "Hand Tools", brand: "Wera", buyingPrice: 480, stock: 38, unit: "set", status: "active", description: "9-piece hex key set. Sizes: 1.5-10mm. Ball end. Fold-up design.", holcellMargin: 3, retailMargin: 5, reorderLevel: 6, location: "Rack A-15" },
  { name: "Waterproof Tape 4\" x 5m", sku: "DNS-TAP-WP4", category: "Pipes & Fittings", brand: "Denso", buyingPrice: 380, stock: 55, unit: "roll", status: "active", description: "4-inch width, 5 meter roll. Butyl rubber. Self-fusing. Cold applied.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack D-6" },
  { name: "Builder's Line Reel 50m", sku: "IRW-BLR-50M", category: "Measuring & Marking", brand: "Irwin", buyingPrice: 175, stock: 70, unit: "pcs", status: "active", description: "50-meter chalk line reel. 4:1 gear ratio. Blue chalk included.", holcellMargin: 3, retailMargin: 5, reorderLevel: 12, location: "Rack C-6" },
  { name: "Plumb Bob 8oz", sku: "IRW-PLB-8OZ", category: "Measuring & Marking", brand: "Irwin", buyingPrice: 195, stock: 50, unit: "pcs", status: "active", description: "8oz plumb bob with steel tip. String included. High-visibility orange.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack C-7" },
  { name: "Floor Scraper 10\"", sku: "RDD-SCR-10IN", category: "Hand Tools", brand: "Red Devil", buyingPrice: 310, stock: 30, unit: "pcs", status: "active", description: "10-inch floor scraper with replaceable blade. Long handle. For linoleum.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack A-16" },
  { name: "Saw Horse Pair", sku: "DWT-SHP-STD", category: "Hand Tools", brand: "DeWalt", buyingPrice: 1900, stock: 6, unit: "pair", status: "active", description: "Saw horse pair with 1000kg capacity. Foldable. Steel construction.", holcellMargin: 3, retailMargin: 5, reorderLevel: 2, location: "Rack A-17" },
  { name: "Grouting Float 12\"", sku: "MST-GRF-12IN", category: "Hand Tools", brand: "Marshalltown", buyingPrice: 280, stock: 35, unit: "pcs", status: "active", description: "12-inch grouting float. Carbon steel blade. Wood handle. For tiling.", holcellMargin: 3, retailMargin: 5, reorderLevel: 6, location: "Rack A-18" },
  { name: "Trowel Plastering 11\"", sku: "MST-TRW-11IN", category: "Hand Tools", brand: "Marshalltown", buyingPrice: 260, stock: 50, unit: "pcs", status: "active", description: "11-inch plastering trowel. London pattern. Carbon steel blade.", holcellMargin: 3, retailMargin: 5, reorderLevel: 8, location: "Rack A-19" },
  { name: "Rivet Gun Set", sku: "STN-RVT-SET", category: "Hand Tools", brand: "Stanley", buyingPrice: 680, stock: 22, unit: "set", status: "active", description: "Pop rivet gun set with 100 rivets. 3mm-6.4mm capacity. Aluminum body.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack A-20" },
  { name: "Grease Cartridge 400g", sku: "SHL-GRS-400", category: "Building Materials", brand: "Shell", buyingPrice: 290, stock: 95, unit: "tube", status: "active", description: "400g grease cartridge. Multi-purpose EP2. Lithium complex.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack F-7" },
  { name: "Electrical Wire 2.5mm (90m)", sku: "BSR-WIR-2.5", category: "Electrical", brand: "BSRM", buyingPrice: 1800, stock: 150, unit: "roll", status: "active", description: "2.5mm single core copper wire, 90 meter roll. 1100V rated.", holcellMargin: 3, retailMargin: 5, reorderLevel: 25, location: "Rack C-8" },
  { name: "GI Wire 20 Gauge (1kg)", sku: "BRB-GIW-20G", category: "Fasteners & Hardware", brand: "BRB Group", buyingPrice: 145, stock: 500, unit: "kg", status: "active", description: "20 gauge galvanized iron wire, 1kg bundle. For binding and fencing.", holcellMargin: 3, retailMargin: 5, reorderLevel: 80, location: "Rack E-6" },
];

const suppliers = [
  { id: "sup-001", name: "BD Power Tools Ltd", type: "Authorised Distributor", location: "Dhaka, Mirpur-10", phone: "+880 1722-222222", whatsapp: "+880 1722-222223", email: "bdpt@mail.com", website: "www.bdpowertools.com.bd", contactPerson: "Rahim Uddin", rating: 5, deliveryDays: 2, minOrderTaka: 5000, paymentTerms: "Cash / bKash / Bank Transfer", priceLevel: "fixed", speciality: ["Power Tools", "Cordless Tools", "Accessories"], brands: ["Bosch", "Makita", "DeWalt", "Stanley"], note: "Fastest & most reliable. Authorised distributor for Bosch, Makita, DeWalt. Consistent stock, warranty support." },
  { id: "sup-002", name: "Electro Mart BD", type: "Retail Distributor", location: "Dhaka, Elephant Road", phone: "+880 1733-333333", whatsapp: "+880 1733-333334", email: "em@mail.com", website: "www.electromart.com.bd", contactPerson: "Karim Hossain", rating: 3, deliveryDays: 4, minOrderTaka: 3000, paymentTerms: "Cash / bKash", priceLevel: "higher", speciality: ["Electrical", "Meters", "Testers"], brands: ["Fluke", "Bosch"], note: "Good backup for electrical items. Prices slightly higher but always has Fluke in stock." },
  { id: "sup-003", name: "Pro Hardware Dhaka", type: "Wholesale Supplier", location: "Dhaka, Nayabazar", phone: "+880 1744-444444", whatsapp: "+880 1744-444445", email: "phd@mail.com", website: "N/A", contactPerson: "Jalal Ahmed", rating: 4, deliveryDays: 3, minOrderTaka: 2000, paymentTerms: "Cash / Cheque", priceLevel: "competitive", speciality: ["Hand Tools", "Cutting Tools", "Files"], brands: ["Bahco", "Knipex", "Taparia"], note: "Best for Bahco and Knipex hand tools. Competitive pricing, good margins. Regular monthly shipments." },
  { id: "sup-004", name: "German Tools BD", type: "Premium Importer", location: "Dhaka, Gulshan", phone: "+880 1755-555555", whatsapp: "+880 1755-555556", email: "gtbd@mail.com", website: "www.germantoolsbd.com", contactPerson: "Nadia Islam", rating: 5, deliveryDays: 3, minOrderTaka: 10000, paymentTerms: "Bank Transfer / Credit (30 days)", priceLevel: "fixed", speciality: ["Premium Hand Tools", "Precision Tools"], brands: ["Wera", "Facom", "Knipex"], note: "Direct import from Germany. Best quality assurance, COO certificates available. Higher minimum order." },
  { id: "sup-005", name: "Plumb Supply BD", type: "Plumbing Specialist", location: "Chittagong, Agrabad", phone: "+880 1766-666666", whatsapp: "+880 1766-666667", email: "psbd@mail.com", website: "N/A", contactPerson: "Sumon Das", rating: 4, deliveryDays: 4, minOrderTaka: 3000, paymentTerms: "Cash / bKash / Bank", priceLevel: "competitive", speciality: ["Pipe Tools", "Plumbing", "Pipe Fittings"], brands: ["Ridgid", "Rothenberger", "Wavin"], note: "Plumbing tools specialist. Best price on Ridgid and Rothenberger. Ships from Chittagong, allow 4 days." },
  { id: "sup-006", name: "Khulna Build Depot", type: "Local Wholesale", location: "Khulna, Shibbari", phone: "+880 1777-777777", whatsapp: "+880 1777-777778", email: "kbd@mail.com", website: "N/A", contactPerson: "Fazlur Rahman", rating: 4, deliveryDays: 1, minOrderTaka: 1000, paymentTerms: "Cash / bKash", priceLevel: "competitive", speciality: ["Building Materials", "Steel", "Pipes"], brands: ["BSRM", "Partex", "Bengal PVC"], note: "Fastest local delivery (1 day). BSRM authorised dealer. Ideal for heavy/bulk items like cement, rods, sheets." },
  { id: "sup-007", name: "Safety First BD", type: "Safety Equipment Specialist", location: "Dhaka, Uttara", phone: "+880 1799-999999", whatsapp: "+880 1799-999998", email: "sfbd@mail.com", website: "www.safetyfirstbd.com", contactPerson: "Tania Akter", rating: 4, deliveryDays: 3, minOrderTaka: 2000, paymentTerms: "Cash / Bank Transfer", priceLevel: "competitive", speciality: ["Safety Equipment", "Scaffolding", "PPE"], brands: ["MSA", "SGB", "Honeywell"], note: "Safety & scaffolding specialist. MSA helmet certified. SGB scaffolding clamps with load certificates." },
  { id: "sup-008", name: "Local PVC Depot", type: "Pipe & Fitting Supplier", location: "Khulna, Khalishpur", phone: "+880 1788-888888", whatsapp: "+880 1788-888889", email: "lpd@mail.com", website: "N/A", contactPerson: "Babul Mia", rating: 3, deliveryDays: 2, minOrderTaka: 2000, paymentTerms: "Cash", priceLevel: "competitive", speciality: ["PVC Pipes", "HDPE Pipes", "Fittings"], brands: ["Pran", "Bengal PVC"], note: "Large local stock of PVC and HDPE pipes. Good backup for Pran pipes. Prices negotiable on bulk orders." },
  { id: "sup-009", name: "Dhaka Tool Hub", type: "General Hardware Wholesaler", location: "Dhaka, Old Dhaka", phone: "+880 1711-111111", whatsapp: "+880 1711-111112", email: "dth@mail.com", website: "N/A", contactPerson: "Mokhles Mia", rating: 4, deliveryDays: 2, minOrderTaka: 1500, paymentTerms: "Cash / bKash", priceLevel: "competitive", speciality: ["Hand Tools", "Fasteners", "General Hardware"], brands: ["Stanley", "Komelon", "Local", "3M"], note: "Wide product range, good for general hardware restocking. Stanley authorised. Fast 2-day Dhaka dispatch." },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await Product.deleteMany({});
    await Supplier.deleteMany({});
    console.log("Cleared existing data");

    // Calculate holcellPrice and retailPrice for each product
    const processedProducts = products.map(p => ({
      ...p,
      holcellPrice: p.buyingPrice * (1 + p.holcellMargin / 100),
      retailPrice: p.buyingPrice * (1 + p.retailMargin / 100),
    }));

    await Product.insertMany(processedProducts);
    await Supplier.insertMany(suppliers);
    console.log(`Seeded ${processedProducts.length} products and ${suppliers.length} suppliers`);

    await mongoose.connection.close();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

seedDB();