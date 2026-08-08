// FILE: server/models/Invoice.js (FULL REPLACEMENT)
const mongoose = require("mongoose");

const PAYMENT_METHODS = ["cash", "bank", "mobile"];
const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];
const BANK_OPTIONS = ["Dutch-Bangla Bank", "Islami Bank Bangladesh", "City Bank Limited"];

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    amount: { type: Number, required: true, min: [0.01, "Payment amount must be greater than 0"] },
    provider: { type: String, enum: [...MOBILE_PROVIDERS, null], default: null },
    bankName: { type: String, enum: [...BANK_OPTIONS, ""], default: "" },
    accountNumber: { type: String, trim: true, maxlength: 50, default: "" },
    mobileNumber: { type: String, trim: true, maxlength: 20, default: "" },
  },
  { _id: false }
);

const collectionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    provider: { type: String, enum: [...MOBILE_PROVIDERS, null], default: null },
    bankName: { type: String, enum: [...BANK_OPTIONS, ""], default: "" },
    accountNumber: { type: String, trim: true, maxlength: 50, default: "" },
    mobileNumber: { type: String, trim: true, maxlength: 20, default: "" },
    note: { type: String, trim: true, maxlength: 300, default: "" },
    collectedAtBST: { type: Date, required: true },
  },
  { _id: false }
);

const soldBatchSchema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String },
    buyingPrice: { type: Number, min: 0 },
    quantity: { type: Number, min: 0 },
  },
  { _id: false }
);

const returnedItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    returnedQty: { type: Number, required: true, min: 1 },
    returnAmount: { type: Number, required: true, min: 0 },
    returnDateBST: { type: Date, required: true },
    reason: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    invoiceDate: { type: String, required: true },
    customer: {
      name: { type: String, default: "", trim: true, maxlength: 200 },
      phone: { type: String, default: "", trim: true, maxlength: 30 },
      address: { type: String, default: "", trim: true, maxlength: 300 },
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        company: { type: String },
        unit: { type: String, default: "pcs" },
        price: { type: Number, required: true, min: 0 },
        qty: { type: Number, required: true, min: 1 },
        total: { type: Number, required: true, min: 0 },
        costTotal: { type: Number, default: 0, min: 0 },
        returnedQty: { type: Number, default: 0, min: 0 },
        soldBatches: { type: [soldBatchSchema], default: [] },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    vat: { type: Number, default: 0, min: 0 },
    transportCost: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    priceType: { type: String, default: "retail" },
    preparedBy: { type: String, trim: true, maxlength: 100, default: "" },
    status: { type: String, default: "completed" },

    paymentStatus: { type: String, enum: ["paid", "due"], default: "paid" },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },

    splitPayment: { type: Boolean, default: false },
    payments: {
      type: [paymentSchema],
      default: [],
      validate: { validator: (a) => a.length <= 20, message: "Too many payment entries" },
    },
    collectionHistory: {
      type: [collectionSchema],
      default: [],
      validate: { validator: (a) => a.length <= 50, message: "Too many collection entries" },
    },

    returnedItems: { type: [returnedItemSchema], default: [] },
    totalReturnedAmount: { type: Number, default: 0, min: 0 },
    netSaleAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ "payments.method": 1 });
invoiceSchema.index({ "payments.provider": 1 });
invoiceSchema.index({ "customer.name": 1 });
invoiceSchema.index({ "customer.phone": 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ paymentStatus: 1, createdAt: -1 }); // composite — matches DueInvoice/PaidInvoice list queries

module.exports = mongoose.model("Invoice", invoiceSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.MOBILE_PROVIDERS = MOBILE_PROVIDERS;
module.exports.BANK_OPTIONS = BANK_OPTIONS;