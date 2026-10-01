const express = require("express");

const {
  createAvailability,
  getMyAvailability,
  deleteAvailability,
} = require("../controllers/availabilityController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create availability
router.post(
  "/",
  authMiddleware,
  createAvailability
);

// Get logged-in therapist availability
router.get(
  "/",
  authMiddleware,
  getMyAvailability
);

// Delete availability
router.delete(
  "/:id",
  authMiddleware,
  deleteAvailability
);

module.exports = router;