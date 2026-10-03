const mongoose = require("mongoose");

const therapistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password_hash: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    specializations: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },

    // Therapist's local timezone
    timezone: {
      type: String,
      default: "Asia/Kolkata",
      trim: true,
    },

    // Current subscription tier
    subscription_tier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionTierConfig",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Therapist = mongoose.model(
  "Therapist",
  therapistSchema
);

module.exports = Therapist;