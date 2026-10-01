const mongoose = require("mongoose");

const Client = require("../models/Client");
const Session = require("../models/Session");

// Create a new client for the logged-in therapist
const createClient = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;

    const { name, email, phone, status, tags } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Client name is required",
      });
    }

    if (email && typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email must be a valid string",
      });
    }

    const normalizedEmail = email?.trim().toLowerCase() || "";

    if (normalizedEmail) {
      const existingClient = await Client.findOne({
        therapist_id: therapistId,
        email: normalizedEmail,
      });

      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: "A client with this email already exists",
        });
      }
    }

    const client = await Client.create({
      therapist_id: therapistId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      status:
        status === "inactive"
          ? "inactive"
          : "active",
      tags: Array.isArray(tags)
        ? tags
            .map((tag) => String(tag).trim())
            .filter(Boolean)
        : [],
    });

    return res.status(201).json({
      success: true,
      message: "Client created successfully",
      client,
    });
  } catch (error) {
    next(error);
  }
};

// Get therapist's client list
// Supports:
// ?search=
// ?status=active
// ?tag=
// ?sort=name
// ?sort=last_session_at
// ?sort=createdAt
// ?order=asc
// ?order=desc
const getClients = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;

    const {
      search = "",
      status,
      tag,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {
      therapist_id: therapistId,
    };

    if (status) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client status",
        });
      }

      filter.status = status;
    }

    if (tag) {
      filter.tags = tag.trim();
    }

    if (search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const allowedSortFields = [
      "name",
      "email",
      "status",
      "last_session_at",
      "createdAt",
      "updatedAt",
    ];

    const sortField = allowedSortFields.includes(sort)
      ? sort
      : "createdAt";

    const sortDirection = order === "asc" ? 1 : -1;

    const clients = await Client.find(filter)
      .select("-__v")
      .sort({
        [sortField]: sortDirection,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: clients.length,
      clients,
    });
  } catch (error) {
    next(error);
  }
};

// Get one client's profile
// Includes session history belonging only to this therapist/client
const getClientById = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const client = await Client.findOne({
      _id: id,
      therapist_id: therapistId,
    })
      .select("-__v")
      .lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const sessions = await Session.find({
      therapist_id: therapistId,
      client_id: client._id,
    })
      .select(
        "start_at end_at status client_timezone duration_minutes"
      )
      .sort({ start_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      client: {
        ...client,
        session_history: sessions,
        session_count: sessions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update basic client information
const updateClient = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const {
      name,
      email,
      phone,
      status,
      tags,
      intake,
      consent,
    } = req.body;

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

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Client name cannot be empty",
        });
      }

      client.name = name.trim();
    }

    if (email !== undefined) {
      if (
        email !== null &&
        typeof email !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Email must be a valid string",
        });
      }

      const normalizedEmail =
        typeof email === "string"
          ? email.trim().toLowerCase()
          : "";

      if (normalizedEmail) {
        const duplicateClient = await Client.findOne({
          therapist_id: therapistId,
          email: normalizedEmail,
          _id: { $ne: id },
        });

        if (duplicateClient) {
          return res.status(409).json({
            success: false,
            message: "Another client already uses this email",
          });
        }
      }

      client.email = normalizedEmail;
    }

    if (phone !== undefined) {
      client.phone =
        typeof phone === "string"
          ? phone.trim()
          : "";
    }

    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client status",
        });
      }

      client.status = status;
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          message: "Tags must be an array",
        });
      }

      client.tags = tags
        .map((tag) => String(tag).trim())
        .filter(Boolean);
    }

    if (intake !== undefined) {
      if (
        typeof intake !== "object" ||
        intake === null ||
        Array.isArray(intake)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid intake data",
        });
      }

      if (intake.demographics !== undefined) {
        client.intake.demographics = {
          ...client.intake.demographics?.toObject?.(),
          ...intake.demographics,
        };
      }

      if (intake.presenting_concern !== undefined) {
        client.intake.presenting_concern =
          typeof intake.presenting_concern === "string"
            ? intake.presenting_concern.trim()
            : "";
      }

      if (intake.history !== undefined) {
        client.intake.history =
          typeof intake.history === "string"
            ? intake.history.trim()
            : "";
      }
    }

    if (consent !== undefined) {
      if (
        typeof consent !== "object" ||
        consent === null ||
        Array.isArray(consent)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid consent data",
        });
      }

      if (consent.accepted === true) {
        client.consent.accepted = true;

        if (!client.consent.accepted_at) {
          client.consent.accepted_at = new Date();
        }
      } else if (consent.accepted === false) {
        client.consent.accepted = false;
        client.consent.accepted_at = null;
      }
    }

    await client.save();

    return res.status(200).json({
      success: true,
      message: "Client updated successfully",
      client,
    });
  } catch (error) {
    next(error);
  }
};

// Update intake information specifically
const updateClientIntake = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const {
      demographics,
      presenting_concern,
      history,
    } = req.body;

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

    if (demographics !== undefined) {
      const currentDemographics =
        client.intake?.demographics?.toObject?.() || {};

      client.intake.demographics = {
        ...currentDemographics,
        ...demographics,
      };
    }

    if (presenting_concern !== undefined) {
      client.intake.presenting_concern =
        typeof presenting_concern === "string"
          ? presenting_concern.trim()
          : "";
    }

    if (history !== undefined) {
      client.intake.history =
        typeof history === "string"
          ? history.trim()
          : "";
    }

    await client.save();

    return res.status(200).json({
      success: true,
      message: "Client intake updated successfully",
      client,
    });
  } catch (error) {
    next(error);
  }
};

// Capture consent with timestamp
const captureClientConsent = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const { accepted } = req.body;

    if (accepted !== true) {
      return res.status(400).json({
        success: false,
        message: "Consent must be explicitly accepted",
      });
    }

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

    client.consent.accepted = true;
    client.consent.accepted_at = new Date();

    await client.save();

    return res.status(200).json({
      success: true,
      message: "Client consent recorded successfully",
      consent: client.consent,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a client
const deleteClient = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const client = await Client.findOneAndDelete({
      _id: id,
      therapist_id: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Prevent regex special characters from breaking search
function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  updateClientIntake,
  captureClientConsent,
  deleteClient,
};