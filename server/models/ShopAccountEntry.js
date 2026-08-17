// FILE: server/models/ShopAccountEntry.js (NEW) — manual due/payment against a custom-source shop
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    shopName: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ["due", "payment"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: ["cash", "bank", "mobile"], default: "cash" },
    provider: { type: String, default: null },
    bankName: { type: String, default: "" },
    date: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopAccountEntry", schema);