const express = require("express");

const {
  getAvailableSlots,
  getPublicAvailableSlots,
  bookSession,
} = require("../controllers/schedulingController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Therapist-side protected slot API
*/
router.get(
  "/slots",
  authMiddleware,
  getAvailableSlots
);

/*
  Public client slot API
  Example:
  /api/scheduling/dr-sharma/slots
*/
router.get(
  "/:slug/slots",
  getPublicAvailableSlots
);

/*
  Public booking API
  Example:
  /api/scheduling/dr-sharma/book
*/
router.post(
  "/:slug/book",
  bookSession
);

module.exports = router;