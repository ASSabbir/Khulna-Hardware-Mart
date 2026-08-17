// FILE: server/models/SupplierPayment.js (NEW) — #19 Supplier Due Payment tracking
const mongoose = require("mongoose");

const supplierPaymentSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
   type: { type: String, enum: ["payable", "receivable", "manual_due"], required: true }, // payable = we owe supplier, receivable = supplier owes us, manual_due = manually recorded due
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => v !== 0,
        message: "Amount cannot be zero.",
      },
      min: [-100000000, "Amount out of range."],
      max: [100000000, "Amount out of range."],
    },
    method: { type: String, enum: ["cash", "mobile", "bank"], default: "cash" },
    provider: { type: String, default: null },
    note: { type: String, trim: true, maxlength: 300, default: "" },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupplierPayment", supplierPaymentSchema);