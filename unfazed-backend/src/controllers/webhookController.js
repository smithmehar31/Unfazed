const crypto = require("crypto");

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const ClientPackage = require("../models/ClientPackage");

function verifyWebhookSignature(
  rawBody,
  signature
) {
  if (!rawBody || !signature) {
    return false;
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
      .update(rawBody)
      .digest("hex");

  const expectedBuffer =
    Buffer.from(expectedSignature, "utf8");

  const receivedBuffer =
    Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

async function activateClientPackage(
  payment
) {
  if (
    !payment.package_id ||
    !payment.client_id
  ) {
    return;
  }

  const therapistPackage =
    await Package.findById(
      payment.package_id
    ).lean();

  if (!therapistPackage) {
    return;
  }

  const existingClientPackage =
    await ClientPackage.findOne({
      payment_id: payment._id,
    });

  if (existingClientPackage) {
    return;
  }

  const purchasedAt =
    new Date();

  const expiresAt =
    new Date(purchasedAt);

  expiresAt.setDate(
    expiresAt.getDate() +
      therapistPackage.validity_days
  );

  await ClientPackage.create({
    client_id:
      payment.client_id,

    therapist_id:
      payment.therapist_id,

    package_id:
      payment.package_id,

    payment_id:
      payment._id,

    total_sessions:
      therapistPackage.session_count,

    used_sessions: 0,

    remaining_sessions:
      therapistPackage.session_count,

    purchased_at:
      purchasedAt,

    expires_at:
      expiresAt,

    status: "active",
  });
}

const handleRazorpayWebhook = async (
  req,
  res,
  next
) => {
  try {
    const signature =
      req.headers[
        "x-razorpay-signature"
      ];

    const rawBody = req.rawBody;

    const isValid =
      verifyWebhookSignature(
        rawBody,
        signature
      );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Razorpay webhook signature",
      });
    }

    const event = req.body;

    const eventName =
      event?.event || "";

    const paymentEntity =
      event?.payload?.payment?.entity;

    const orderEntity =
      event?.payload?.order?.entity;

    const razorpayOrderId =
      paymentEntity?.order_id ||
      orderEntity?.id;

    const razorpayPaymentId =
      paymentEntity?.id || "";

    if (!razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message:
          "Webhook payment order ID is missing",
      });
    }

    const payment =
      await Payment.findOne({
        gateway_order_id:
          razorpayOrderId,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Local payment record not found",
      });
    }

    if (
      eventName ===
        "payment.captured" ||
      eventName ===
        "payment.authorized" ||
      eventName ===
        "order.paid"
    ) {
      payment.status = "paid";

      if (razorpayPaymentId) {
        payment.gateway_transaction_id =
          razorpayPaymentId;
      }

      if (
        paymentEntity?.method
      ) {
        payment.payment_method =
          paymentEntity.method;
      }

      await payment.save();

      await activateClientPackage(
        payment
      );
    } else if (
      eventName ===
      "payment.failed"
    ) {
      // Never downgrade an already-paid payment.
      if (payment.status !== "paid") {
        payment.status = "failed";

        if (razorpayPaymentId) {
          payment.gateway_transaction_id =
            razorpayPaymentId;
        }

        if (
          paymentEntity?.method
        ) {
          payment.payment_method =
            paymentEntity.method;
        }

        await payment.save();
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Webhook processed successfully",
      event: eventName,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleRazorpayWebhook,
};