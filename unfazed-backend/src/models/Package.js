const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    session_count: {
      type: Number,
      enum: [3, 6, 12],
      required: true,
    },

    price_per_session: {
      type: Number,
      required: true,
      min: 0,
    },

    total_price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    validity_days: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Package = mongoose.model("Package", packageSchema);

module.exports = Package;