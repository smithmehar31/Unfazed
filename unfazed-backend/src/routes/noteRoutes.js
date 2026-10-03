const express = require("express");

const {
  createNote,
  getMyNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getPortalSharedNotes,
} = require("../controllers/noteController");

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const {
  requireNoteTemplateAccess,
} = require(
  "../middleware/entitlementMiddleware"
);

const router = express.Router();

// --------------------------------------------------
// Client portal: shared notes only
// --------------------------------------------------
router.get(
  "/portal/shared",
  getPortalSharedNotes
);

// --------------------------------------------------
// Therapist: create note
// --------------------------------------------------
router.post(
  "/",
  authMiddleware,
  requireNoteTemplateAccess,
  createNote
);

// --------------------------------------------------
// Therapist: get own notes
// --------------------------------------------------
router.get(
  "/",
  authMiddleware,
  getMyNotes
);

// --------------------------------------------------
// Therapist: get one note
// --------------------------------------------------
router.get(
  "/:id",
  authMiddleware,
  getNoteById
);

// --------------------------------------------------
// Therapist: update note
// --------------------------------------------------
router.put(
  "/:id",
  authMiddleware,
  requireNoteTemplateAccess,
  updateNote
);

// --------------------------------------------------
// Therapist: archive note
// --------------------------------------------------
router.delete(
  "/:id",
  authMiddleware,
  deleteNote
);

module.exports = router;