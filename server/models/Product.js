const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String },
    category: { type: String, index: true },
    brand: { type: String, index: true },
    origin: { type: String },
    unit: { type: String, default: "pcs" },
    description: { type: String },
    buyingPrice: { type: Number, required: true },
    holcellPrice: { type: Number },
    retailPrice: { type: Number },
    holcellMargin: { type: Number },
    retailMargin: { type: Number },
    stock: { type: Number, default: 0, index: true },
    reorderLevel: { type: Number, default: 0 },
    location: { type: String },
    status: { type: String, default: "active", index: true },
    images: [{ type: String }],
    supplierId: { type: String },
    supplierName: { type: String },
    supplierContact: { type: String },
  },
  { timestamps: true }
);

// Text index for fast search across multiple fields
productSchema.index({ name: "text", brand: "text", sku: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);