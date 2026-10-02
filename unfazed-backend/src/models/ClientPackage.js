const mongoose = require("mongoose");

const clientPackageSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },

    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      index: true,
    },

    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    total_sessions: {
      type: Number,
      required: true,
      min: 1,
    },

    used_sessions: {
      type: Number,
      default: 0,
      min: 0,
    },

    remaining_sessions: {
      type: Number,
      required: true,
      min: 0,
    },

    purchased_at: {
      type: Date,
      default: Date.now,
    },

    expires_at: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "exhausted",
        "expired",
        "cancelled",
      ],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ClientPackage = mongoose.model(
  "ClientPackage",
  clientPackageSchema
);

module.exports = ClientPackage;