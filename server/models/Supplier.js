const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
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
    totalPurchaseAmount: { type: Number, default: 0 },
    productsSupplied: { type: Number, default: 0 },
    // Legacy fields (for backwards compatibility with seeded data)
    id: { type: String },
    type: { type: String },
    location: { type: String },
    whatsapp: { type: String },
    website: { type: String },
    deliveryDays: { type: Number },
    minOrderTaka: { type: Number },
    paymentTerms: { type: String },
    priceLevel: { type: String },
    speciality: [{ type: String }],
    brands: [{ type: String }],
    note: { type: String },
    bestChoiceFor: [{ type: Number }],
    bestChoiceReason: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);