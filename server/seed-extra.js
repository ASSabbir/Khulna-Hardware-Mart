const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");

dotenv.config();

// Additional products to reach 100+ total
const additionalProducts = [
  // More Power Tools
  { name: "Impact Driver 18V", sku: "BSH-IMP-18V", category: "Power Tools", brand: "Bosch", buyingPrice: 4200, stock: 18, unit: "pcs", status: "active", description: "18V cordless impact driver with 180Nm torque. Brushless motor.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack B-5" },
  { name: "Circular Saw 7.25\"", sku: "DWT-CIR-725", category: "Power Tools", brand: "DeWalt", buyingPrice: 5500, stock: 12, unit: "pcs", status: "active", description: "7.25\" circular saw with 15A motor. Includes blade and guide.", holcellMargin: 3, retailMargin: 5, reorderLevel: 3, location: "Rack B-6" },
  { name: "Heat Gun 2000W", sku: "BSH-HTG-2KW", category: "Power Tools", brand: "Bosch", buyingPrice: 1800, stock: 25, unit: "pcs", status: "active", description: "2000W heat gun with variable temp control. LCD display.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack B-7" },
  { name: "Orbital Sander 5\"", sku: "MAK-ORB-5IN", category: "Power Tools", brand: "Makita", buyingPrice: 2100, stock: 20, unit: "pcs", status: "active", description: "5\" random orbital sander with variable speed. Includes dust bag.", holcellMargin: 3, retailMargin: 5, reorderLevel: 4, location: "Rack B-8" },

  // More Hand Tools
  { name: "Claw Hammer 16oz", sku: "STN-CLW-16", category: "Hand Tools", brand: "Stanley", buyingPrice: 320, stock: 80, unit: "pcs", status: "active", description: "16oz claw hammer with fiberglass handle. Shock-absorbing grip.", holcellMargin: 3, retailMargin: 5, reorderLevel: 12, location: "Rack A-21" },
  { name: "Ball Peen Hammer 12oz", sku: "STN-BPH-12", category: "Hand Tools", brand: "Stanley", buyingPrice: 280, stock: 65, unit: "pcs", status: "active", description: "12oz ball peen hammer. For shaping metal and setting rivets.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack A-22" },
  { name: "Lock Grip Pliers 10\"", sku: "KPX-LGP-10", category: "Hand Tools", brand: "Knipex", buyingPrice: 480, stock: 45, unit: "pcs", status: "active", description: "10\" lock grip pliers with push-button adjustment.", holcellMargin: 3, retailMargin: 5, reorderLevel: 8, location: "Rack A-23" },
  { name: "Water Pump Pliers 10\"", sku: "BHC-WPP-10", category: "Hand Tools", brand: "Bahco", buyingPrice: 380, stock: 50, unit: "pcs", status: "active", description: "10\" water pump pliers with 9-step adjustment. Chrome vanadium.", holcellMargin: 3, retailMargin: 5, reorderLevel: 8, location: "Rack A-24" },
  { name: "Needle Nose Pliers 6\"", sku: "KPX-NNP-6", category: "Hand Tools", brand: "Knipex", buyingPrice: 350, stock: 55, unit: "pcs", status: "active", description: "6\" needle nose pliers with smooth jaws. For precision work.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack A-25" },
  { name: "Slip Joint Pliers 8\"", sku: "TAP-SJP-8", category: "Hand Tools", brand: "Taparia", buyingPrice: 180, stock: 100, unit: "pcs", status: "active", description: "8\" slip joint pliers. Zinc plated. Basic tool.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack A-26" },

  // More Electrical
  { name: "Digital Multimeter", sku: "FLK-DMM-PRO", category: "Electrical", brand: "Fluke", buyingPrice: 2800, stock: 15, unit: "pcs", status: "active", description: "True RMS digital multimeter. CAT III rated. Auto ranging.", holcellMargin: 3, retailMargin: 5, reorderLevel: 4, location: "Rack C-9" },
  { name: "Wire Stripper 6\"", sku: "KPX-WSP-6", category: "Electrical", brand: "Knipex", buyingPrice: 680, stock: 40, unit: "pcs", status: "active", description: "6\" precision wire stripper. Self-adjusting. For 0.5-6mm².", holcellMargin: 3, retailMargin: 5, reorderLevel: 8, location: "Rack C-10" },
  { name: "Cable Cutter 4\"", sku: "KPX-CBC-4", category: "Electrical", brand: "Knipex", buyingPrice: 750, stock: 35, unit: "pcs", status: "active", description: "4\" cable cutter for copper and aluminum. Precision ground.", holcellMargin: 3, retailMargin: 5, reorderLevel: 6, location: "Rack C-11" },
  { name: "Circuit Tester 110V", sku: "STN-CKT-110", category: "Electrical", brand: "Stanley", buyingPrice: 120, stock: 150, unit: "pcs", status: "active", description: "110V circuit tester with neon indicator. Screwdriver type.", holcellMargin: 3, retailMargin: 5, reorderLevel: 20, location: "Rack C-12" },

  // More Plumbing
  { name: "Pipe Cutters 1\"-3\"", sku: "RID-PCM-3IN", category: "Pipes & Fittings", brand: "Ridgid", buyingPrice: 1200, stock: 25, unit: "pcs", status: "active", description: "1\"-3\" pipe cutter with spare wheel. For steel pipes.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack D-7" },
  { name: "PVC Cutter 42mm", sku: "RTB-PVC-42", category: "Pipes & Fittings", brand: "Rothenberger", buyingPrice: 850, stock: 30, unit: "pcs", status: "active", description: "42mm PVC pipe cutter. Ratchet mechanism. Spare blade included.", holcellMargin: 3, retailMargin: 5, reorderLevel: 6, location: "Rack D-8" },
  { name: "Pipe Reamer 1/2\"-2\"", sku: "RID-RMA-2IN", category: "Pipes & Fittings", brand: "Ridgid", buyingPrice: 680, stock: 20, unit: "pcs", status: "active", description: "1/2\"-2\" pipe reamer. Removes internal burrs. Spiral blade.", holcellMargin: 3, retailMargin: 5, reorderLevel: 4, location: "Rack D-9" },
  { name: "Teflon Tape 1/2\" x 50m", sku: "LCL-TFN-HALF", category: "Pipes & Fittings", brand: "Local", buyingPrice: 25, stock: 500, unit: "roll", status: "active", description: "1/2\" PTFE tape, 50 meter roll. White. For threading seal.", holcellMargin: 3, retailMargin: 5, reorderLevel: 80, location: "Rack D-10" },
  { name: "Pipe Thread Die Set 1/2\"-2\"", sku: "RID-THD-SET", category: "Pipes & Fittings", brand: "Ridgid", buyingPrice: 2200, stock: 8, unit: "set", status: "active", description: "1/2\"-2\" pipe thread die set. Complete with holder.", holcellMargin: 3, retailMargin: 5, reorderLevel: 2, location: "Rack D-11" },

  // More Fasteners
  { name: "Wood Screws 3\" (100pcs)", sku: "LCL-WSC-3IN", category: "Fasteners & Hardware", brand: "Local", buyingPrice: 85, stock: 400, unit: "box", status: "active", description: "3\" wood screws, No.8. Zinc plated. Box of 100 pieces.", holcellMargin: 3, retailMargin: 5, reorderLevel: 60, location: "Rack E-7" },
  { name: "Concrete Anchors 8mm (50pcs)", sku: "LCL-CAN-8MM", category: "Fasteners & Hardware", brand: "Local", buyingPrice: 120, stock: 300, unit: "box", status: "active", description: "8mm concrete anchors with bolts. Pack of 50.", holcellMargin: 3, retailMargin: 5, reorderLevel: 50, location: "Rack E-8" },
  { name: "Wall Plugs 8mm (100pcs)", sku: "LCL-WPL-8MM", category: "Fasteners & Hardware", brand: "Local", buyingPrice: 45, stock: 600, unit: "bag", status: "active", description: "8mm nylon wall plugs. Pack of 100. Universal use.", holcellMargin: 3, retailMargin: 5, reorderLevel: 100, location: "Rack E-9" },

  // More Safety
  { name: "Safety Goggles (Clear)", sku: "MSA-SGZ-CLR", category: "Safety Equipment", brand: "MSA", buyingPrice: 180, stock: 80, unit: "pcs", status: "active", description: "Clear safety goggles with anti-fog coating. ANSI Z87.1.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack G-4" },
  { name: "Ear Plugs (100pairs)", sku: "3M-EAR-100", category: "Safety Equipment", brand: "3M", buyingPrice: 250, stock: 120, unit: "box", status: "active", description: "Disposable ear plugs. NRR 32dB. Box of 100 pairs.", holcellMargin: 3, retailMargin: 5, reorderLevel: 20, location: "Rack G-5" },
  { name: "Dust Mask N95 (20pcs)", sku: "3M-MSK-N95", category: "Safety Equipment", brand: "3M", buyingPrice: 320, stock: 200, unit: "box", status: "active", description: "N95 particulate respirator. Box of 20. Adjustable nose clip.", holcellMargin: 3, retailMargin: 5, reorderLevel: 30, location: "Rack G-6" },
  { name: "Safety Vest (Hi-Vis)", sku: "HNK-SVH-ORG", category: "Safety Equipment", brand: "Honeywell", buyingPrice: 280, stock: 50, unit: "pcs", status: "active", description: "Hi-vis safety vest, orange. Reflective strips. One size fits all.", holcellMargin: 3, retailMargin: 5, reorderLevel: 10, location: "Rack G-7" },

  // More Building Materials
  { name: "Plaster of Paris (25kg)", sku: "BPC-POP-25K", category: "Building Materials", brand: "BPC", buyingPrice: 380, stock: 150, unit: "bag", status: "active", description: "Plaster of Paris, 25kg bag. For ceiling and wall finishing.", holcellMargin: 3, retailMargin: 5, reorderLevel: 25, location: "Rack F-8" },
  { name: "Gypsum Board 12mm (4x8 ft)", sku: "BPC-GYP-12M", category: "Building Materials", brand: "BPC", buyingPrice: 850, stock: 100, unit: "pcs", status: "active", description: "12mm gypsum board, 4x8 feet. For interior walls and ceilings.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack F-9" },
  { name: "MS Rod 10mm (20ft)", sku: "BSR-MSR-10M", category: "Building Materials", brand: "BSRM", buyingPrice: 450, stock: 200, unit: "pcs", status: "active", description: "10mm MS rod, 20 feet length. For reinforcement.", holcellMargin: 3, retailMargin: 5, reorderLevel: 30, location: "Rack F-10" },

  // More Measuring
  { name: "Digital Caliper 150mm", sku: "STR-CAL-150", category: "Measuring & Marking", brand: "Starrett", buyingPrice: 1800, stock: 15, unit: "pcs", status: "active", description: "150mm digital caliper. 0.01mm resolution. Stainless steel.", holcellMargin: 3, retailMargin: 5, reorderLevel: 4, location: "Rack C-13" },
  { name: "Micrometer 0-25mm", sku: "STR-MIC-025", category: "Measuring & Marking", brand: "Starrett", buyingPrice: 2500, stock: 10, unit: "pcs", status: "active", description: "0-25mm outside micrometer. 0.01mm accuracy. Ratchet stop.", holcellMargin: 3, retailMargin: 5, reorderLevel: 3, location: "Rack C-14" },
  { name: "Combination Square 12\"", sku: "STN-CSQ-12", category: "Measuring & Marking", brand: "Stanley", buyingPrice: 480, stock: 25, unit: "pcs", status: "active", description: "12\" combination square with spirit level. Metric and inch.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack C-15" },
  { name: "Measuring Wheel 6\"", sku: "STN-MWH-6IN", category: "Measuring & Marking", brand: "Stanley", buyingPrice: 650, stock: 20, unit: "pcs", status: "active", description: "6\" measuring wheel. Counter up to 9999m. Foldable handle.", holcellMargin: 3, retailMargin: 5, reorderLevel: 5, location: "Rack C-16" },

  // More Paints
  { name: "Roller Brush 9\" (5pcs)", sku: "NIP-ROL-9IN", category: "Paints & Coatings", brand: "Nippon", buyingPrice: 180, stock: 100, unit: "pack", status: "active", description: "9\" roller brush set, 5 pieces. Includes handle and tray.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack H-3" },
  { name: "Paint Tray Metal 14\"", sku: "NIP-TRY-14M", category: "Paints & Coatings", brand: "Nippon", buyingPrice: 120, stock: 80, unit: "pcs", status: "active", description: "14\" metal paint tray. For roller and brush painting.", holcellMargin: 3, retailMargin: 5, reorderLevel: 12, location: "Rack H-4" },
  { name: "Enamel Paint 1L (White)", sku: "BRG-ENM-WHT", category: "Paints & Coatings", brand: "Berger", buyingPrice: 350, stock: 100, unit: "can", status: "active", description: "Synthetic enamel paint, 1 liter. White. High gloss finish.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack H-5" },

  // More Adhesives
  { name: "Wood Adhesive 500ml", sku: "FEV-WAD-500", category: "Adhesives & Sealants", brand: "Fevicol", buyingPrice: 180, stock: 120, unit: "bottle", status: "active", description: "PVA wood adhesive, 500ml. Water resistant. Fast setting.", holcellMargin: 3, retailMargin: 5, reorderLevel: 20, location: "Rack I-4" },
  { name: "Contact Adhesive 500ml", sku: "FEV-CON-500", category: "Adhesives & Sealants", brand: "Fevicol", buyingPrice: 220, stock: 90, unit: "can", status: "active", description: "Contact adhesive, 500ml. For wood, leather, rubber.", holcellMargin: 3, retailMargin: 5, reorderLevel: 15, location: "Rack I-5" },
  { name: "Thread Lock Blue 50ml", sku: "LCT-TLB-50", category: "Adhesives & Sealants", brand: "Loctite", buyingPrice: 480, stock: 45, unit: "bottle", status: "active", description: "Thread locker blue, 50ml. Medium strength. Removable.", holcellMargin: 3, retailMargin: 5, reorderLevel: 8, location: "Rack I-6" },
  { name: "Super Glue 20g (3pcs)", sku: "LCT-SGL-20G", category: "Adhesives & Sealants", brand: "Loctite", buyingPrice: 180, stock: 150, unit: "pack", status: "active", description: "Instant super glue, 20g tubes. Pack of 3. Gel formula.", holcellMargin: 3, retailMargin: 5, reorderLevel: 25, location: "Rack I-7" },
];

const seedExtra = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Calculate prices
    const processed = additionalProducts.map(p => ({
      ...p,
      holcellPrice: p.buyingPrice * (1 + p.holcellMargin / 100),
      retailPrice: p.buyingPrice * (1 + p.retailMargin / 100),
    }));

    await Product.insertMany(processed);
    console.log(`Added ${processed.length} products. Total should be ~100 now.`);

    // Count total
    const count = await Product.countDocuments();
    console.log(`Total products in DB: ${count}`);

    await mongoose.connection.close();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

seedExtra();