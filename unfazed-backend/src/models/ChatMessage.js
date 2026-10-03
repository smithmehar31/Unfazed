const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
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

    sender_type: {
      type: String,
      enum: ["therapist", "client"],
      required: true,
      index: true,
    },

    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    read_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({
  therapist_id: 1,
  client_id: 1,
  createdAt: 1,
});

chatMessageSchema.index({
  client_id: 1,
  createdAt: 1,
});

const ChatMessage = mongoose.model(
  "ChatMessage",
  chatMessageSchema
);

module.exports = ChatMessage;