// FILE: server/models/SupplierPayment.js (NEW) — #19 Supplier Due Payment tracking
const mongoose = require("mongoose");

const supplierPaymentSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    type: { type: String, enum: ["payable", "receivable"], required: true }, // payable = we owe supplier, receivable = supplier owes us
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: ["cash", "mobile", "bank"], default: "cash" },
    provider: { type: String, enum: ["bKash", "Nagad", "Rocket", "Upay", null], default: null },
    note: { type: String, trim: true, maxlength: 300, default: "" },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupplierPayment", supplierPaymentSchema);