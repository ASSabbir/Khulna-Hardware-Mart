// FILE: server/models/Product.js (FULL REPLACEMENT)
const mongoose = require("mongoose");

const supplierPriceSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierName: { type: String, required: true, trim: true },
    buyingPrice: { type: Number, required: true, min: 0 },
    lastPurchaseDate: { type: Date, default: Date.now },
    availableQuantity: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String, trim: true },
    buyingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 }, // remaining qty in this batch
    originalQuantity: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    sku: { type: String, unique: true, sparse: true, index: true },
    category: { type: String, index: true, trim: true },
    brand: { type: String, index: true, trim: true },
    origin: { type: String, trim: true },
   unit: { type: String, default: "pcs" },
    unitValue: { type: Number, min: 0, default: null },
    description: { type: String, maxlength: 2000 },
    quality: { type: String, trim: true, maxlength: 100 },
    material: { type: String, trim: true, maxlength: 100 },

    buyingPrice: { type: Number, required: true, min: 0 },
    holcellPrice: { type: Number, min: 0 },
    retailPrice: { type: Number, min: 0 },
    holcellMargin: { type: Number, min: 0 },
    retailMargin: { type: Number, min: 0 },

     stock: { type: Number, default: 0, index: true, min: 0 },
    location: { type: String, trim: true },
    status: { type: String, default: "active", index: true, enum: ["active", "inactive", "discontinued"] },
    images: [{ type: String }],

    // Legacy single-supplier fields (kept for backwards compatibility)
    supplierId: { type: String },
    supplierName: { type: String },
    supplierContact: { type: String },

    // Multi-supplier support
    suppliers: { type: [supplierPriceSchema], default: [] },

    // FIFO batch tracking
    batches: { type: [batchSchema], default: [] },

    // Custom product flag — created directly from Invoice, not from Add Product form
    isCustom: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", brand: "text", sku: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);