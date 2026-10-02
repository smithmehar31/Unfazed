const express = require("express");

const {
  createPackage,
  getMyPackages,
  getPublicPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require("../controllers/packageController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public active packages
router.get("/public/:slug", getPublicPackages);

// Therapist package management
router.post("/", authMiddleware, createPackage);

router.get("/", authMiddleware, getMyPackages);

router.get("/:id", authMiddleware, getPackageById);

router.put("/:id", authMiddleware, updatePackage);

router.delete("/:id", authMiddleware, deletePackage);

module.exports = router;