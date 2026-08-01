// FILE: server/models/Ledger.js (NEW)
const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    date: { type: String, required: true }, // YYYY-MM-DD, user-selected
    method: { type: String, enum: ["cash", "mobile", "bank"], default: "cash" },
    provider: { type: String, enum: ["bKash", "Nagad", "Rocket", "Upay", null], default: null },
    addedBy: { type: String, trim: true, maxlength: 100, default: "Admin" },
  },
  { timestamps: true }
);

ledgerSchema.index({ type: 1, date: 1 });

module.exports = mongoose.model("Ledger", ledgerSchema);