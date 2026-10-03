const express = require("express");

const {
  getMyEntitlements,
  checkFeatureAccess,
} = require("../controllers/entitlementController");

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

// Get complete entitlement information
router.get(
  "/me",
  authMiddleware,
  getMyEntitlements
);

// Check access to a specific feature
router.get(
  "/check/:featureKey",
  authMiddleware,
  checkFeatureAccess
);

module.exports = router;