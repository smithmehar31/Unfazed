const express = require("express");

const {
  createPackageOrder,
  createPortalPackageOrder,
  verifyPackagePayment,
  markPackagePaymentFailed,
  getMyPayments,
} = require("../controllers/paymentController");

const {
  downloadTherapistInvoice,
  downloadClientInvoice,
} = require("../controllers/invoiceController");

const {
  handleRazorpayWebhook,
} = require("../controllers/webhookController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Razorpay webhook
router.post(
  "/webhook/razorpay",
  handleRazorpayWebhook
);

// Client portal invoice
router.get(
  "/portal/invoice/:paymentId",
  downloadClientInvoice
);

// Client portal package order
router.post(
  "/portal/packages/order",
  createPortalPackageOrder
);

// Therapist package order
router.post(
  "/packages/order",
  authMiddleware,
  createPackageOrder
);

// Successful payment verification
router.post(
  "/packages/verify",
  verifyPackagePayment
);

// Failed payment handling
router.post(
  "/packages/failed",
  markPackagePaymentFailed
);

// Therapist payment history
router.get(
  "/",
  authMiddleware,
  getMyPayments
);

// Therapist invoice
router.get(
  "/:paymentId/invoice",
  authMiddleware,
  downloadTherapistInvoice
);

module.exports = router;