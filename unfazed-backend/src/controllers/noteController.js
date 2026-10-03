const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const SessionNote = require("../models/SessionNote");
const Session = require("../models/Session");
const Client = require("../models/Client");

// ---------------------------------------------------------
// Helper: verify client portal token
// ---------------------------------------------------------
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
// Create a therapist note
// ---------------------------------------------------------
const createNote = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;

    const {
      client_id,
      session_id,
      type = "private",
      title = "",
      content = "",
      format = "richtext",
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(client_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(session_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    if (
      !["private", "shared"].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Note type must be private or shared",
      });
    }

    if (
      !["richtext", "soap", "dap"].includes(format)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Note format must be richtext, soap or dap",
      });
    }

    if (
      typeof content !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Note content must be a string",
      });
    }

    const client = await Client.findOne({
      _id: client_id,
      therapist_id: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message:
          "Client not found for this therapist",
      });
    }

    const session = await Session.findOne({
      _id: session_id,
      therapist_id: therapistId,
      client_id: client_id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Session not found for this therapist and client",
      });
    }

    const note = await SessionNote.create({
      therapist_id: therapistId,
      client_id,
      session_id,
      type,
      title:
        typeof title === "string"
          ? title.trim()
          : "",
      content: content.trim(),
      format,
      is_active: true,
    });

    return res.status(201).json({
      success: true,
      message:
        "Session note created successfully",
      note,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// Get all therapist notes
// ---------------------------------------------------------
const getMyNotes = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;

    const {
      client_id,
      session_id,
      type,
      format,
    } = req.query;

    const filter = {
      therapist_id: therapistId,
      is_active: true,
    };

    if (client_id !== undefined) {
      if (
        !mongoose.Types.ObjectId.isValid(client_id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid client ID",
        });
      }

      filter.client_id = client_id;
    }

    if (session_id !== undefined) {
      if (
        !mongoose.Types.ObjectId.isValid(session_id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID",
        });
      }

      filter.session_id = session_id;
    }

    if (type !== undefined) {
      if (
        !["private", "shared"].includes(type)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Note type must be private or shared",
        });
      }

      filter.type = type;
    }

    if (format !== undefined) {
      if (
        !["richtext", "soap", "dap"].includes(format)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Note format must be richtext, soap or dap",
        });
      }

      filter.format = format;
    }

    const notes = await SessionNote.find(filter)
      .populate(
        "client_id",
        "name email"
      )
      .populate(
        "session_id",
        "start_at end_at status duration_minutes"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// Get one therapist-owned note
// ---------------------------------------------------------
const getNoteById = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await SessionNote.findOne({
      _id: id,
      therapist_id: therapistId,
      is_active: true,
    })
      .populate(
        "client_id",
        "name email"
      )
      .populate(
        "session_id",
        "start_at end_at status duration_minutes"
      )
      .lean();

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// Update therapist-owned note
// ---------------------------------------------------------
const updateNote = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await SessionNote.findOne({
      _id: id,
      therapist_id: therapistId,
      is_active: true,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const {
      type,
      title,
      content,
      format,
    } = req.body;

    if (type !== undefined) {
      if (
        !["private", "shared"].includes(type)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Note type must be private or shared",
        });
      }

      note.type = type;
    }

    if (title !== undefined) {
      if (
        typeof title !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Note title must be a string",
        });
      }

      note.title = title.trim();
    }

    if (content !== undefined) {
      if (
        typeof content !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Note content must be a string",
        });
      }

      note.content = content.trim();
    }

    if (format !== undefined) {
      if (
        !["richtext", "soap", "dap"].includes(format)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Note format must be richtext, soap or dap",
        });
      }

      note.format = format;
    }

    await note.save();

    return res.status(200).json({
      success: true,
      message:
        "Session note updated successfully",
      note,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// Soft-delete a therapist note
// ---------------------------------------------------------
const deleteNote = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await SessionNote.findOne({
      _id: id,
      therapist_id: therapistId,
      is_active: true,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    note.is_active = false;

    await note.save();

    return res.status(200).json({
      success: true,
      message:
        "Session note archived successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// CLIENT PORTAL
// Get ONLY shared notes
//
// Critical security rule:
// type: "shared" is enforced directly in the database query.
// There is no way for a client request to ask for private notes.
// ---------------------------------------------------------
const getPortalSharedNotes = async (
  req,
  res,
  next
) => {
  try {
    const { token } = req.query;

    const decoded =
      verifyPortalToken(token);

    const client = await Client.findOne({
      _id: decoded.clientId,
      therapist_id: decoded.therapistId,
    })
      .select("_id name")
      .lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message:
          "Client portal record not found",
      });
    }

    // IMPORTANT:
    // type is hardcoded to "shared".
    // The client cannot override this through query params.
    const notes = await SessionNote.find({
      client_id: client._id,
      therapist_id:
        decoded.therapistId,
      type: "shared",
      is_active: true,
    })
      .select(
        "_id client_id session_id type title content format createdAt updatedAt"
      )
      .populate(
        "session_id",
        "start_at end_at status duration_minutes"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      client: {
        id: client._id,
        name: client.name,
      },
      count: notes.length,
      notes,
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
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

module.exports = {
  createNote,
  getMyNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getPortalSharedNotes,
};