const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    // Type of availability record
    type: {
      type: String,
      enum: ["weekly", "override", "blocked"],
      required: true,
    },

    // Day of week for recurring weekly availability
    day_of_week: {
      type: Number,
      min: 0,
      max: 6,
    },

    // Start and end time in HH:mm format
    start_time: {
      type: String,
    },

    end_time: {
      type: String,
    },

    // Used for one-time overrides and blocked dates
    date: {
      type: Date,
    },

    // Buffer after a session
    buffer_minutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Allowed session durations
    session_durations: {
      type: [Number],
      default: [30, 45, 60, 90],
      enum: [30, 45, 60, 90],
    },

    // Whether this slot/availability is active
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Availability = mongoose.model(
  "Availability",
  availabilitySchema
);

module.exports = Availability;