const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const Payment = require("../models/Payment");
const Therapist = require("../models/Therapist");
const Client = require("../models/Client");
const Package = require("../models/Package");

const {
  createInvoiceNumber,
  generateInvoicePdf,
} = require("../services/invoiceService");

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

// Therapist downloads invoice
const downloadTherapistInvoice = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;
    const { paymentId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        paymentId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment =
      await Payment.findOne({
        _id: paymentId,
        therapist_id: therapistId,
      }).lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({
        success: false,
        message:
          "Invoice is available only for paid payments",
      });
    }

    const therapist =
      await Therapist.findById(
        therapistId
      )
        .select("name slug email")
        .lean();

    const client = payment.client_id
      ? await Client.findById(
          payment.client_id
        )
          .select("name email phone")
          .lean()
      : null;

    const therapistPackage =
      payment.package_id
        ? await Package.findById(
            payment.package_id
          ).lean()
        : null;

    const pdfBuffer =
      await generateInvoicePdf({
        payment,
        therapist,
        client,
        therapistPackage,
      });

    const invoiceNumber =
      createInvoiceNumber(
        payment._id
      );

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoiceNumber}.pdf"`
    );

    return res.status(200).send(
      pdfBuffer
    );
  } catch (error) {
    next(error);
  }
};

// Client downloads their own invoice
const downloadClientInvoice = async (
  req,
  res,
  next
) => {
  try {
    const {
      token,
    } = req.query;

    const decoded =
      verifyPortalToken(token);

    const {
      paymentId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        paymentId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment =
      await Payment.findOne({
        _id: paymentId,
        client_id: decoded.clientId,
        therapist_id: decoded.therapistId,
      }).lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({
        success: false,
        message:
          "Invoice is available only for paid payments",
      });
    }

    const therapist =
      await Therapist.findById(
        decoded.therapistId
      )
        .select("name slug email")
        .lean();

    const client =
      await Client.findById(
        decoded.clientId
      )
        .select("name email phone")
        .lean();

    const therapistPackage =
      payment.package_id
        ? await Package.findById(
            payment.package_id
          ).lean()
        : null;

    const pdfBuffer =
      await generateInvoicePdf({
        payment,
        therapist,
        client,
        therapistPackage,
      });

    const invoiceNumber =
      createInvoiceNumber(
        payment._id
      );

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoiceNumber}.pdf"`
    );

    return res.status(200).send(
      pdfBuffer
    );
  } catch (error) {
    if (
      error.name ===
        "JsonWebTokenError" ||
      error.name ===
        "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          error.name ===
          "TokenExpiredError"
            ? "Client portal link has expired"
            : "Invalid client portal link",
      });
    }

    next(error);
  }
};

module.exports = {
  downloadTherapistInvoice,
  downloadClientInvoice,
};