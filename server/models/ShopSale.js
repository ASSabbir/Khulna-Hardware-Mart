// FILE: server/models/ShopSale.js (NEW) — selling OUR products to another shop
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ["cash", "bank", "mobile"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    provider: { type: String, default: null },
    bankName: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    unit: { type: String, default: "pcs" },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const shopSaleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    shopName: { type: String, required: true, trim: true },
    saleDate: { type: String, required: true },
    items: { type: [itemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["paid", "due"], default: "due" },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    payments: { type: [paymentSchema], default: [] },
  },
  { timestamps: true }
);

shopSaleSchema.index({ shopName: 1 });
shopSaleSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ShopSale", shopSaleSchema);