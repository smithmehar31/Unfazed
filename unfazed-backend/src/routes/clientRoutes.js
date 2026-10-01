const express = require("express");

const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  updateClientIntake,
  captureClientConsent,
  deleteClient,
} = require("../controllers/clientController");

const {
  generateClientPortalToken,
  getPortalClient,
  submitPortalIntake,
} = require("../controllers/clientPortalController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Therapist Client Management Routes
|--------------------------------------------------------------------------
*/

// Create a new client
router.post(
  "/",
  authMiddleware,
  createClient
);

// Get therapist's clients
router.get(
  "/",
  authMiddleware,
  getClients
);

// Get one client profile
router.get(
  "/:id",
  authMiddleware,
  getClientById
);

// Update client information
router.put(
  "/:id",
  authMiddleware,
  updateClient
);

// Update client intake from therapist dashboard
router.put(
  "/:id/intake",
  authMiddleware,
  updateClientIntake
);

// Capture consent from therapist dashboard
router.post(
  "/:id/consent",
  authMiddleware,
  captureClientConsent
);

// Delete client
router.delete(
  "/:id",
  authMiddleware,
  deleteClient
);

/*
|--------------------------------------------------------------------------
| Client Portal Routes
|--------------------------------------------------------------------------
|
| These routes use a signed temporary portal token instead
| of the therapist's JWT.
|
*/

// Therapist generates a client portal token
router.post(
  "/:id/portal-token",
  authMiddleware,
  generateClientPortalToken
);

// Client portal loads its own client information
router.get(
  "/portal/client",
  getPortalClient
);

// Client submits intake + consent
router.post(
  "/portal/intake",
  submitPortalIntake
);

module.exports = router;