// FILE: server/models/PaymentMethodOption.js (NEW)
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    type: { type: String, enum: ["mobile", "bank"], required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    accountNumber: { type: String, trim: true, maxlength: 50, default: "" },
  },
  { timestamps: true }
);
schema.index({ type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("PaymentMethodOption", schema);