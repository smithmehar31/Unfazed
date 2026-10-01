const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
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

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    last_session_at: {
      type: Date,
      default: null,
    },

    intake: {
      demographics: {
        age: {
          type: Number,
          min: 0,
        },

        gender: {
          type: String,
          trim: true,
          default: "",
        },

        occupation: {
          type: String,
          trim: true,
          default: "",
        },
      },

      presenting_concern: {
        type: String,
        trim: true,
        default: "",
      },

      history: {
        type: String,
        trim: true,
        default: "",
      },
    },

    consent: {
      accepted: {
        type: Boolean,
        default: false,
      },

      accepted_at: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;