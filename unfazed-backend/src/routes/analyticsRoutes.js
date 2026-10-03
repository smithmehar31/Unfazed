const express = require("express");

const {
  getAnalytics,
} = require("../controllers/analyticsController");

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

// Get analytics for logged-in therapist
router.get(
  "/",
  authMiddleware,
  getAnalytics
);

module.exports = router;