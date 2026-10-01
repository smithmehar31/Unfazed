const Availability = require("../models/Availability");

// Create availability
const createAvailability = async (req, res, next) => {
  try {
    const {
      type,
      day_of_week,
      start_time,
      end_time,
      date,
      buffer_minutes = 0,
      session_durations = [30, 45, 60, 90],
    } = req.body;

    // Basic validation
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Availability type is required",
      });
    }

    // Validate type-specific fields
    if (type === "weekly" && day_of_week === undefined) {
      return res.status(400).json({
        success: false,
        message: "day_of_week is required for weekly availability",
      });
    }

    if (
      type === "weekly" ||
      type === "override"
    ) {
      if (!start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: "start_time and end_time are required",
        });
      }
    }

    if (
      (type === "override" || type === "blocked") &&
      !date
    ) {
      return res.status(400).json({
        success: false,
        message: "date is required for this availability type",
      });
    }

    const availability = await Availability.create({
      therapist_id: req.therapistId,
      type,
      day_of_week,
      start_time,
      end_time,
      date,
      buffer_minutes,
      session_durations,
    });

    res.status(201).json({
      success: true,
      message: "Availability created successfully",
      availability,
    });
  } catch (error) {
    next(error);
  }
};

// Get therapist availability
const getMyAvailability = async (req, res, next) => {
  try {
    const availability = await Availability.find({
      therapist_id: req.therapistId,
      is_active: true,
    }).sort({
      day_of_week: 1,
      start_time: 1,
      date: 1,
    });

    res.status(200).json({
      success: true,
      availability,
    });
  } catch (error) {
    next(error);
  }
};

// Delete availability
const deleteAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    const availability = await Availability.findOne({
      _id: id,
      therapist_id: req.therapistId,
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    await availability.deleteOne();

    res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAvailability,
  getMyAvailability,
  deleteAvailability,
};