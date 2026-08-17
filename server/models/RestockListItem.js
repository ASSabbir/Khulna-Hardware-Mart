// FILE: server/models/RestockListItem.js (NEW)
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 10, min: 1 },
  },
  { timestamps: true }
);
schema.index({ productId: 1 }, { unique: true });

module.exports = mongoose.model("RestockListItem", schema);