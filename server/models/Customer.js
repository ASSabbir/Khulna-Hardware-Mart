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
    // 1 = Retail, 2 = Wholesale — defaults to Retail; update via customer edit UI if needed
    customerType: { type: Number, enum: [1, 2], default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);