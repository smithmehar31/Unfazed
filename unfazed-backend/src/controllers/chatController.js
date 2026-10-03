const mongoose = require("mongoose");

const ChatMessage = require("../models/ChatMessage");
const Client = require("../models/Client");

function getTherapistId(req) {
  return (
    req.user?.id ||
    req.user?._id ||
    req.user?.therapist_id ||
    req.therapistId ||
    req.therapist?._id ||
    null
  );
};

const getTherapistChatMessages = async (req, res, next) => {
  try {
    const therapistId = getTherapistId(req);
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(therapistId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid therapist authentication.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const client = await Client.findOne({
      _id: clientId,
      therapist_id: therapistId,
    }).select("_id name email");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    const messages = await ChatMessage.find({
      therapist_id: therapistId,
      client_id: clientId,
    })
      .sort({ createdAt: 1 })
      .populate("therapist_id", "name email")
      .populate("client_id", "name email")
      .lean();

    return res.status(200).json({
      success: true,
      count: messages.length,
      client,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTherapistChatMessages,
};