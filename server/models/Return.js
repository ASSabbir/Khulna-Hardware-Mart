// FILE: server/models/Return.js (NEW)
const mongoose = require("mongoose");

const BST_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC+6

const returnItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    originalQty: { type: Number, required: true, min: 1 },
    returnedQty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    returnAmount: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { _id: false }
);

const refundPaymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ["cash", "mobile", "bank"], required: true },
    provider: { type: String, enum: ["bKash", "Nagad", "Rocket", "Upay", null], default: null },
    bankName: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0.01 },
  },
  { _id: false }
);

const returnSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    invoiceNumber: { type: String, required: true },
    items: { type: [returnItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
    totalReturnAmount: { type: Number, required: true, min: 0 },
    returnDateBST: { type: Date, required: true },
    refundPayments: { type: [refundPaymentSchema], default: [] },
    dueAdjustment: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

returnSchema.statics.nowBST = function () {
  return new Date(Date.now() + BST_OFFSET_MS);
};

module.exports = mongoose.model("Return", returnSchema);