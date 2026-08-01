// FILE: server/scripts/checkCustomProducts.js (NEW - run once)
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const customProducts = await Product.find({ isCustom: true }).select("name isCustom stock createdAt").sort({ createdAt: -1 }).lean();
  console.log(`Found ${customProducts.length} custom products:`);
  console.log(customProducts);
  process.exit(0);
})();