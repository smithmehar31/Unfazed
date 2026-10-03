const mongoose = require("mongoose");

const sessionNoteSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },

    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["private", "shared"],
      required: true,
      default: "private",
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    content: {
      type: String,
      trim: true,
      default: "",
    },

    format: {
      type: String,
      enum: ["richtext", "soap", "dap"],
      default: "richtext",
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

// Helpful compound indexes for therapist/client/session lookups
sessionNoteSchema.index({
  therapist_id: 1,
  client_id: 1,
  createdAt: -1,
});

sessionNoteSchema.index({
  therapist_id: 1,
  session_id: 1,
  createdAt: -1,
});

sessionNoteSchema.index({
  client_id: 1,
  type: 1,
  createdAt: -1,
});

const SessionNote = mongoose.model(
  "SessionNote",
  sessionNoteSchema
);

module.exports = SessionNote;