const mongoose = require("mongoose");

// Legacy documents (from the original seed script) were saved with a `name`
// field instead of `companyName`. This pre-save hook keeps both in sync so
// old records display correctly everywhere (dropdowns, cards, search) without
// needing a manual data migration.
function backfillCompanyName(doc) {
  if (!doc.companyName && doc.name) doc.companyName = doc.name;
  if (!doc.name && doc.companyName) doc.name = doc.companyName;
}

const supplierSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, maxlength: 200 },
    contactPerson: { type: String, required: true, trim: true, maxlength: 200, default: "N/A" },
    phone: { type: String, required: true, trim: true, maxlength: 30, default: "N/A" },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    category: { type: String, trim: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    notes: { type: String, maxlength: 1000 },
    status: { type: String, default: "active" },

    totalPurchaseAmount: { type: Number, default: 0, min: 0 },
    totalPurchaseCount: { type: Number, default: 0, min: 0 },
    totalPurchasedQuantity: { type: Number, default: 0, min: 0 },
    lastPurchasePrice: { type: Number, default: null, min: 0 },
    lastPurchaseDate: { type: Date, default: null },
    productsSupplied: { type: Number, default: 0, min: 0 },

    autoCreated: { type: Boolean, default: false },

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
    bestChoiceReason: { type: String },
  },
  { timestamps: true }
);

supplierSchema.pre("validate", function () {
  backfillCompanyName(this);
});

module.exports = mongoose.model("Supplier", supplierSchema);