// FILE: server/models/DynamicOption.js (NEW) 
const mongoose = require("mongoose");

const dynamicOptionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["productCategory", "unit", "accountCategory"], index: true },
    value: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { timestamps: true }
);

dynamicOptionSchema.index({ type: 1, value: 1 }, { unique: true });

module.exports = mongoose.model("DynamicOption", dynamicOptionSchema);