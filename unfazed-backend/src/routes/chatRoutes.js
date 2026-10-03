const express = require("express");

const {
  getTherapistChatMessages,
} = require("../controllers/chatController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/clients/:clientId/messages",
  authMiddleware,
  getTherapistChatMessages
);

module.exports = router;