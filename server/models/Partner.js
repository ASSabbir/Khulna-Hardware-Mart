const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    category: { type: String },
    rating: { type: Number, default: 5 },
    notes: { type: String },
    status: { type: String, default: "active" },
    totalBusinessAmount: { type: Number, default: 0 },
    productsSupplied: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Partner", partnerSchema);