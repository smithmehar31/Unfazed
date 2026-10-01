const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
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
    },

    start_at: {
      type: Date,
      required: true,
      index: true,
    },

    end_at: {
      type: Date,
      required: true,
      index: true,
    },

    client_timezone: {
      type: String,
      default: "Asia/Kolkata",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      default: "confirmed",
      index: true,
    },

    client_name: {
      type: String,
      default: "",
      trim: true,
    },

    client_email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    duration_minutes: {
      type: Number,
      enum: [30, 45, 60, 90],
      required: true,
    },

    /*
      Every booked minute is stored as a block.

      Example:
      09:00 - 10:00

      becomes minute blocks:
      09:00
      09:01
      09:02
      ...
      09:59

      This helps MongoDB prevent overlapping active sessions.
    */
    slot_blocks: {
      type: [String],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/*
  Database-level protection against overlapping
  active sessions for the same therapist.

  Cancelled/completed/no-show sessions are not
  considered active for this constraint.
*/
sessionSchema.index(
  {
    therapist_id: 1,
    slot_blocks: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ["pending", "confirmed"],
      },
    },
  }
);

const Session = mongoose.model(
  "Session",
  sessionSchema
);

module.exports = Session;