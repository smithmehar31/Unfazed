const express = require("express");

const {
  registerTherapist,
} = require("../controllers/therapistController");

const {
  loginTherapist,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerTherapist);
router.post("/login", loginTherapist);

router.get("/protected", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route accessed successfully",
    therapistId: req.therapistId,
  });
});

module.exports = router;