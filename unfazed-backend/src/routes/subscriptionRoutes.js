const express = require("express");

const {
  getSubscriptionTiers,
  getMySubscription,
} = require("../controllers/subscriptionController");

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

// Public: view available subscription tiers
router.get(
  "/tiers",
  getSubscriptionTiers
);

// Protected: view logged-in therapist subscription
router.get(
  "/me",
  authMiddleware,
  getMySubscription
);

module.exports = router;