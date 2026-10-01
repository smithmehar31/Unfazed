const jwt = require("jsonwebtoken");

const Therapist = require("../models/Therapist");
const Client = require("../models/Client");

function createPortalToken(client) {
  return jwt.sign(
    {
      clientId: client._id.toString(),
      therapistId: client.therapist_id.toString(),
      purpose: "client_portal",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
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

// Therapist generates a temporary client portal access token.
const generateClientPortalToken = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    const client = await Client.findOne({
      _id: id,
      therapist_id: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const token = createPortalToken(client);

    return res.status(200).json({
      success: true,
      message: "Client portal link generated successfully",
      token,
      expires_in: "7 days",
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Public endpoint used by the client portal
// to load safe client information.
const getPortalClient = async (
  req,
  res,
  next
) => {
  try {
    const { token } = req.query;

    const decoded = verifyPortalToken(token);

    const client = await Client.findOne({
      _id: decoded.clientId,
      therapist_id: decoded.therapistId,
    })
      .select(
        "name email intake consent status"
      )
      .lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client portal record not found",
      });
    }

    const therapist = await Therapist.findById(
      decoded.therapistId
    )
      .select("name slug")
      .lean();

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    return res.status(200).json({
      success: true,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        status: client.status,
        intake: client.intake,
        consent: client.consent,
      },
      therapist: {
        name: therapist.name,
        slug: therapist.slug,
      },
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

    if (error.message === "Portal token is required") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// Public endpoint for submitting intake + consent.
const submitPortalIntake = async (
  req,
  res,
  next
) => {
  try {
    const {
      token,
      demographics,
      presenting_concern,
      history,
      consent_accepted,
    } = req.body;

    const decoded = verifyPortalToken(token);

    if (consent_accepted !== true) {
      return res.status(400).json({
        success: false,
        message:
          "Consent must be explicitly accepted before submitting intake",
      });
    }

    if (
      demographics !== undefined &&
      (typeof demographics !== "object" ||
        demographics === null ||
        Array.isArray(demographics))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid demographics data",
      });
    }

    if (
      presenting_concern !== undefined &&
      typeof presenting_concern !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Presenting concern must be a string",
      });
    }

    if (
      history !== undefined &&
      typeof history !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "History must be a string",
      });
    }

    const client = await Client.findOne({
      _id: decoded.clientId,
      therapist_id: decoded.therapistId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client portal record not found",
      });
    }

    const currentDemographics =
      client.intake?.demographics?.toObject?.() || {};

    if (demographics !== undefined) {
      client.intake.demographics = {
        ...currentDemographics,
        ...demographics,
      };
    }

    if (presenting_concern !== undefined) {
      client.intake.presenting_concern =
        presenting_concern.trim();
    }

    if (history !== undefined) {
      client.intake.history = history.trim();
    }

    client.consent.accepted = true;
    client.consent.accepted_at = new Date();

    await client.save();

    return res.status(200).json({
      success: true,
      message:
        "Intake and consent submitted successfully",
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        intake: client.intake,
        consent: client.consent,
      },
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

    if (error.message === "Portal token is required") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

module.exports = {
  generateClientPortalToken,
  getPortalClient,
  submitPortalIntake,
};