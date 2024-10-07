const { Schema, model } = require("mongoose");

const orderSchema = new Schema(
  {
    customerDetails: {
      name: { type: String, required: true },
      mobileNumber: { type: String, required: true },
    },
    orderDetails: [
      {
        id: {type: String, required: true},
        orderType: { type: String, required: true },
        unitPrice: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    total: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    orderDate: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: [
        "Paid",                // Fully paid, no balance due
        "Unpaid",              // No amount paid yet
        "Not Fully Paid",      // Partial payment made, but not the total amount
        "Overpaid - Balance Due", // Paid more than the total amount, balance needs to be refunded
        "Balance Settled"      // Overpayment balance has been refunded or adjusted
      ]
    },    
    orderId: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = model("Order", orderSchema);
