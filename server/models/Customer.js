const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    totalSpent: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalDue: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);