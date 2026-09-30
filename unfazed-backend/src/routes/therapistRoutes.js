const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
  getPublicTherapistProfile,
} = require("../controllers/therapistController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get logged-in therapist profile
router.get("/me", authMiddleware, getMyProfile);

// Update logged-in therapist profile
router.put("/me", authMiddleware, updateMyProfile);

// Get public therapist profile by slug
router.get("/:slug", getPublicTherapistProfile);

module.exports = router;