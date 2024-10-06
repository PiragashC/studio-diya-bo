const { Schema, model } = require("mongoose");

const orderTypeSchema = new Schema(
  {
    orderType: { type: String, required: true, unique: true},
    unitPrice:{ type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = model("Order Type", orderTypeSchema);
