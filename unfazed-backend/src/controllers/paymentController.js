const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const razorpay = require("../config/razorpay");

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const Client = require("../models/Client");
const ClientPackage = require("../models/ClientPackage");

function buildReceipt(prefix, id) {
  const shortId = String(id)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-12);

  const timestamp = Date.now()
    .toString()
    .slice(-10);

  return `${prefix}_${timestamp}_${shortId}`.slice(0, 40);
}

function verifyPortalToken(token) {
  if (!token) {
    throw new Error("Portal token is required");
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  if (decoded.purpose !== "client_portal") {
    throw new Error("Invalid portal token");
  }

  return decoded;
}

// ---------------------------------------------------------
// Therapist-side package order
// ---------------------------------------------------------
const createPackageOrder = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;

    const {
      package_id,
      client_id,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(package_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(client_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const therapistPackage =
      await Package.findOne({
        _id: package_id,
        therapist_id: therapistId,
        is_active: true,
      });

    if (!therapistPackage) {
      return res.status(404).json({
        success: false,
        message: "Active package not found",
      });
    }

    const client = await Client.findOne({
      _id: client_id,
      therapist_id: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const amountInPaise = Math.round(
      therapistPackage.total_price * 100
    );

    if (amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Package price must be greater than zero",
      });
    }

    const receipt = buildReceipt(
      "pkg",
      therapistPackage._id
    );

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency:
          therapistPackage.currency || "INR",
        receipt,
        notes: {
          therapist_id:
            therapistId.toString(),
          client_id:
            client._id.toString(),
          package_id:
            therapistPackage._id.toString(),
        },
      });

    const payment = await Payment.create({
      therapist_id: therapistId,
      client_id: client._id,
      package_id:
        therapistPackage._id,
      gateway_order_id:
        razorpayOrder.id,
      amount:
        therapistPackage.total_price,
      platform_fee: 0,
      net_amount:
        therapistPackage.total_price,
      currency:
        therapistPackage.currency || "INR",
      status: "created",
      notes: `Package purchase: ${therapistPackage.name}`,
    });

    return res.status(201).json({
      success: true,
      message:
        "Razorpay order created successfully",
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency:
          razorpayOrder.currency,
      },
      payment: {
        id: payment._id,
        status: payment.status,
      },
      package: {
        id: therapistPackage._id,
        name: therapistPackage.name,
        session_count:
          therapistPackage.session_count,
        total_price:
          therapistPackage.total_price,
        validity_days:
          therapistPackage.validity_days,
        currency:
          therapistPackage.currency,
      },
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
      },
      razorpay_key_id:
        process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// Client portal package order
// ---------------------------------------------------------
const createPortalPackageOrder = async (
  req,
  res,
  next
) => {
  try {
    const {
      token,
      package_id,
    } = req.body;

    const decoded = verifyPortalToken(token);

    if (
      !mongoose.Types.ObjectId.isValid(
        package_id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const client = await Client.findOne({
      _id: decoded.clientId,
      therapist_id: decoded.therapistId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const therapistPackage =
      await Package.findOne({
        _id: package_id,
        therapist_id:
          decoded.therapistId,
        is_active: true,
      });

    if (!therapistPackage) {
      return res.status(404).json({
        success: false,
        message:
          "Active package not found",
      });
    }

    const amountInPaise = Math.round(
      therapistPackage.total_price * 100
    );

    if (amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Package price must be greater than zero",
      });
    }

    const receipt = buildReceipt(
      "portal",
      therapistPackage._id
    );

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency:
          therapistPackage.currency || "INR",
        receipt,
        notes: {
          therapist_id:
            decoded.therapistId,
          client_id:
            decoded.clientId,
          package_id:
            therapistPackage._id.toString(),
        },
      });

    const payment = await Payment.create({
      therapist_id:
        decoded.therapistId,
      client_id: client._id,
      package_id:
        therapistPackage._id,
      gateway_order_id:
        razorpayOrder.id,
      amount:
        therapistPackage.total_price,
      platform_fee: 0,
      net_amount:
        therapistPackage.total_price,
      currency:
        therapistPackage.currency || "INR",
      status: "created",
      notes: `Client portal package purchase: ${therapistPackage.name}`,
    });

    return res.status(201).json({
      success: true,
      message:
        "Razorpay order created successfully",
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency:
          razorpayOrder.currency,
      },
      payment: {
        id: payment._id,
        status: payment.status,
      },
      package: {
        id: therapistPackage._id,
        name: therapistPackage.name,
        session_count:
          therapistPackage.session_count,
        total_price:
          therapistPackage.total_price,
        validity_days:
          therapistPackage.validity_days,
        currency:
          therapistPackage.currency,
      },
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
      },
      razorpay_key_id:
        process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          error.name === "TokenExpiredError"
            ? "Client portal link has expired"
            : "Invalid client portal link",
      });
    }

    if (
      error.message ===
      "Portal token is required"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// ---------------------------------------------------------
// Successful payment verification
// ---------------------------------------------------------
const verifyPackagePayment = async (
  req,
  res,
  next
) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay payment verification fields are required",
      });
    }

    const payment =
      await Payment.findOne({
        gateway_order_id:
          razorpay_order_id,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment record not found",
      });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message:
          "Payment already verified",
        payment: {
          id: payment._id,
          order_id:
            payment.gateway_order_id,
          transaction_id:
            payment.gateway_transaction_id,
          status: payment.status,
        },
      });
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    const isValidSignature =
      crypto.timingSafeEqual(
        Buffer.from(
          expectedSignature,
          "utf8"
        ),
        Buffer.from(
          razorpay_signature,
          "utf8"
        )
      );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Razorpay payment signature",
      });
    }

    payment.gateway_transaction_id =
      razorpay_payment_id;

    payment.status = "paid";

    await payment.save();

    // Create the client package only after
    // successful payment verification.
    if (
      payment.package_id &&
      payment.client_id
    ) {
      const therapistPackage =
        await Package.findById(
          payment.package_id
        ).lean();

      if (therapistPackage) {
        const existingClientPackage =
          await ClientPackage.findOne({
            payment_id: payment._id,
          });

        if (!existingClientPackage) {
          const purchasedAt = new Date();

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
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Payment verified successfully",
      payment: {
        id: payment._id,
        order_id:
          payment.gateway_order_id,
        transaction_id:
          payment.gateway_transaction_id,
        status: payment.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// NEW: Failed payment handler
// ---------------------------------------------------------
const markPackagePaymentFailed = async (
  req,
  res,
  next
) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      error_code,
      error_description,
      error_reason,
      error_source,
      error_step,
    } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay order ID is required",
      });
    }

    const payment =
      await Payment.findOne({
        gateway_order_id:
          razorpay_order_id,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment record not found",
      });
    }

    // Never change an already successful payment
    // back to failed.
    if (payment.status === "paid") {
      return res.status(409).json({
        success: false,
        message:
          "Payment has already been marked as paid",
      });
    }

    // When a payment ID is available, confirm the
    // payment status with Razorpay before updating
    // our local record.
    if (razorpay_payment_id) {
      try {
        const razorpayPayment =
          await razorpay.payments.fetch(
            razorpay_payment_id
          );

        if (
          razorpayPayment.order_id !==
          razorpay_order_id
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Razorpay payment does not belong to this order",
          });
        }

        if (
          razorpayPayment.status !==
          "failed"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "Razorpay has not confirmed this payment as failed",
          });
        }

        payment.gateway_transaction_id =
          razorpay_payment_id;

        if (razorpayPayment.method) {
          payment.payment_method =
            razorpayPayment.method;
        }
      } catch (razorpayError) {
        console.error(
          "Razorpay failed-payment lookup error:",
          razorpayError.message
        );

        return res.status(502).json({
          success: false,
          message:
            "Unable to confirm failed payment with Razorpay",
        });
      }
    }

    payment.status = "failed";

    const failureNotes = [
      error_code,
      error_description,
      error_reason,
      error_source,
      error_step,
    ]
      .filter(Boolean)
      .join(" | ");

    if (failureNotes) {
      payment.notes = failureNotes;
    }

    await payment.save();

    return res.status(200).json({
      success: true,
      message:
        "Failed payment recorded successfully",
      payment: {
        id: payment._id,
        order_id:
          payment.gateway_order_id,
        transaction_id:
          payment.gateway_transaction_id,
        status: payment.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// Payment history
// ---------------------------------------------------------
const getMyPayments = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;

    const payments =
      await Payment.find({
        therapist_id: therapistId,
      })
        .populate(
          "client_id",
          "name email"
        )
        .populate(
          "package_id",
          "name session_count"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPackageOrder,
  createPortalPackageOrder,
  verifyPackagePayment,
  markPackagePaymentFailed,
  getMyPayments,
};