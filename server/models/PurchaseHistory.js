// FILE: server/models/PurchaseHistory.js (NEW)
const mongoose = require("mongoose");

const purchaseHistorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", index: true },
    supplierName: { type: String, required: true, trim: true },
    buyingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalCost: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, default: Date.now, index: true },
    batchId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseHistory", purchaseHistorySchema);