const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },

    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },

    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
      index: true,
    },

    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },

    gateway_order_id: {
      type: String,
      default: "",
      index: true,
    },

    gateway_transaction_id: {
      type: String,
      default: "",
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    platform_fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    net_amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "created",
      index: true,
    },

    payment_method: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;