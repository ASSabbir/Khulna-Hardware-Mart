// FILE: server/models/Counter.js (NEW)
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // category short code, e.g. "FUR"
  seq: { type: Number, default: 0 },
});

counterSchema.statics.getNextSequence = async function (categoryCode) {
  const doc = await this.findOneAndUpdate(
    { _id: categoryCode },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

module.exports = mongoose.model("Counter", counterSchema);