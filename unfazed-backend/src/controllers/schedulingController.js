const mongoose = require("mongoose");

const Therapist = require("../models/Therapist");
const Availability = require("../models/Availability");
const Session = require("../models/Session");
const Client = require("../models/Client");

function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    }).format();

    return true;
  } catch (error) {
    return false;
  }
}

function getTimezoneParts(dateValue, timezone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date(dateValue));

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

// Convert a local date/time in a named timezone into a UTC Date.
function zonedDateTimeToUTC(dateString, timeString, timezone) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const [hour, minute] = timeString
    .split(":")
    .map(Number);

  const naiveTimestamp = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );

  let utcTimestamp = naiveTimestamp;

  for (let i = 0; i < 3; i += 1) {
    const localParts = getTimezoneParts(
      new Date(utcTimestamp),
      timezone
    );

    const representedAsUTC = Date.UTC(
      localParts.year,
      localParts.month - 1,
      localParts.day,
      localParts.hour,
      localParts.minute,
      localParts.second
    );

    const offset = representedAsUTC - utcTimestamp;

    utcTimestamp = naiveTimestamp - offset;
  }

  return new Date(utcTimestamp);
}

function formatDateTimeInTimezone(dateValue, timezone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateValue));
}

function getDateStringInTimezone(dateValue, timezone) {
  const parts = getTimezoneParts(dateValue, timezone);

  return [
    String(parts.year).padStart(4, "0"),
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-");
}

function getDayOfWeekFromDateString(dateString) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(year, month - 1, day)
  ).getUTCDay();
}

function shiftDateString(dateString, dayOffset) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const shifted = new Date(
    Date.UTC(
      year,
      month - 1,
      day + dayOffset
    )
  );

  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, "0"),
    String(shifted.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function isValidDateString(dateString) {
  if (
    typeof dateString !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return false;
  }

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidTimeString(timeString) {
  if (
    typeof timeString !== "string" ||
    !/^\d{2}:\d{2}$/.test(timeString)
  ) {
    return false;
  }

  const [hour, minute] = timeString
    .split(":")
    .map(Number);

  return (
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

function timeToMinutes(timeString) {
  const [hour, minute] = timeString
    .split(":")
    .map(Number);

  return hour * 60 + minute;
}

function minutesToTime(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")}`;
}

function buildSlotBlocks(startAt, endAt) {
  const blocks = [];

  let cursor = new Date(startAt).getTime();
  const endTimestamp = new Date(endAt).getTime();

  while (cursor < endTimestamp) {
    const iso = new Date(cursor)
      .toISOString()
      .slice(0, 16);

    blocks.push(iso);

    cursor += 60 * 1000;
  }

  return blocks;
}

async function getBookedSessionsForWindow(
  therapistId,
  windowStart,
  windowEnd
) {
  return Session.find({
    therapist_id: therapistId,
    status: {
      $in: ["pending", "confirmed"],
    },
    start_at: {
      $lt: windowEnd,
    },
    end_at: {
      $gt: windowStart,
    },
  })
    .select("start_at end_at")
    .lean();
}

function slotOverlapsBooking(
  slotStart,
  slotEnd,
  bookedSessions
) {
  const start = new Date(slotStart).getTime();
  const end = new Date(slotEnd).getTime();

  return bookedSessions.some((session) => {
    const bookedStart = new Date(
      session.start_at
    ).getTime();

    const bookedEnd = new Date(
      session.end_at
    ).getTime();

    return start < bookedEnd && end > bookedStart;
  });
}

async function generateSlotsForTherapist({
  therapist,
  date,
  duration,
  clientTimezone,
}) {
  const therapistTimezone =
    therapist.timezone || "Asia/Kolkata";

  const generatedSlots = [];

  // A client date can overlap therapist dates around it
  // when the two timezones are different.
  const candidateTherapistDates = [
    shiftDateString(date, -2),
    shiftDateString(date, -1),
    date,
    shiftDateString(date, 1),
    shiftDateString(date, 2),
  ];

  for (const therapistDate of candidateTherapistDates) {
    const blockedEntry = await Availability.findOne({
      therapist_id: therapist._id,
      type: "blocked",
      date: therapistDate,
      is_active: true,
    }).lean();

    if (blockedEntry) {
      continue;
    }

    const overrides = await Availability.find({
      therapist_id: therapist._id,
      type: "override",
      date: therapistDate,
      is_active: true,
    })
      .sort({
        start_time: 1,
      })
      .lean();

    let availabilityEntries = overrides;

    if (availabilityEntries.length === 0) {
      const dayOfWeek =
        getDayOfWeekFromDateString(
          therapistDate
        );

      availabilityEntries = await Availability.find({
        therapist_id: therapist._id,
        type: "weekly",
        day_of_week: dayOfWeek,
        is_active: true,
      })
        .sort({
          start_time: 1,
        })
        .lean();
    }

    for (const availability of availabilityEntries) {
      if (
        !isValidTimeString(
          availability.start_time
        ) ||
        !isValidTimeString(
          availability.end_time
        )
      ) {
        continue;
      }

      if (
        !Array.isArray(
          availability.session_durations
        ) ||
        !availability.session_durations.includes(
          duration
        )
      ) {
        continue;
      }

      const startMinutes = timeToMinutes(
        availability.start_time
      );

      const endMinutes = timeToMinutes(
        availability.end_time
      );

      if (endMinutes <= startMinutes) {
        continue;
      }

      const bufferMinutes =
        Number(availability.buffer_minutes) || 0;

      const windowStart = zonedDateTimeToUTC(
        therapistDate,
        availability.start_time,
        therapistTimezone
      );

      const windowEnd = zonedDateTimeToUTC(
        therapistDate,
        availability.end_time,
        therapistTimezone
      );

      const bookedSessions =
        await getBookedSessionsForWindow(
          therapist._id,
          windowStart,
          windowEnd
        );

      let currentMinutes = startMinutes;

      while (
        currentMinutes + duration <=
        endMinutes
      ) {
        const slotStartTime =
          minutesToTime(currentMinutes);

        const slotEndTime = minutesToTime(
          currentMinutes + duration
        );

        const slotStart =
          zonedDateTimeToUTC(
            therapistDate,
            slotStartTime,
            therapistTimezone
          );

        const slotEnd =
          zonedDateTimeToUTC(
            therapistDate,
            slotEndTime,
            therapistTimezone
          );

        const clientLocalDate =
          getDateStringInTimezone(
            slotStart,
            clientTimezone
          );

        if (clientLocalDate === date) {
          const isBooked = slotOverlapsBooking(
            slotStart,
            slotEnd,
            bookedSessions
          );

          if (!isBooked) {
            generatedSlots.push({
              therapist_date: therapistDate,
              therapist_start_time: slotStartTime,
              therapist_end_time: slotEndTime,
              start_at: slotStart.toISOString(),
              end_at: slotEnd.toISOString(),
              client_start:
                formatDateTimeInTimezone(
                  slotStart,
                  clientTimezone
                ),
              client_end:
                formatDateTimeInTimezone(
                  slotEnd,
                  clientTimezone
                ),
              duration_minutes: duration,
              therapist_timezone:
                therapistTimezone,
              client_timezone:
                clientTimezone,
            });
          }
        }

        currentMinutes +=
          duration + bufferMinutes;
      }
    }
  }

  const uniqueSlots = new Map();

  for (const slot of generatedSlots) {
    const key = `${slot.start_at}-${slot.end_at}`;

    if (!uniqueSlots.has(key)) {
      uniqueSlots.set(key, slot);
    }
  }

  return Array.from(uniqueSlots.values()).sort(
    (a, b) =>
      new Date(a.start_at).getTime() -
      new Date(b.start_at).getTime()
  );
}

// Protected therapist-side slot endpoint
const getAvailableSlots = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;

    const {
      date,
      duration = 60,
      timezone = "Asia/Kolkata",
    } = req.query;

    const durationNumber = Number(duration);

    if (!isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message:
          "A valid date in YYYY-MM-DD format is required",
      });
    }

    if (
      ![30, 45, 60, 90].includes(
        durationNumber
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be 30, 45, 60 or 90 minutes",
      });
    }

    if (!isValidTimezone(timezone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timezone",
      });
    }

    const therapist =
      await Therapist.findById(therapistId);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const slots =
      await generateSlotsForTherapist({
        therapist,
        date,
        duration: durationNumber,
        clientTimezone: timezone,
      });

    return res.status(200).json({
      success: true,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        slug: therapist.slug,
      },
      date,
      therapist_timezone:
        therapist.timezone ||
        "Asia/Kolkata",
      client_timezone: timezone,
      duration: durationNumber,
      slots,
    });
  } catch (error) {
    next(error);
  }
};

// Public client-side slot endpoint
const getPublicAvailableSlots = async (
  req,
  res,
  next
) => {
  try {
    const { slug } = req.params;

    const {
      date,
      duration = 60,
      timezone = "Asia/Kolkata",
    } = req.query;

    const durationNumber = Number(duration);

    if (!isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message:
          "A valid date in YYYY-MM-DD format is required",
      });
    }

    if (
      ![30, 45, 60, 90].includes(
        durationNumber
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be 30, 45, 60 or 90 minutes",
      });
    }

    if (!isValidTimezone(timezone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timezone",
      });
    }

    const therapist =
      await Therapist.findOne({
        slug: slug.toLowerCase(),
      });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const slots =
      await generateSlotsForTherapist({
        therapist,
        date,
        duration: durationNumber,
        clientTimezone: timezone,
      });

    return res.status(200).json({
      success: true,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        slug: therapist.slug,
      },
      date,
      therapist_timezone:
        therapist.timezone ||
        "Asia/Kolkata",
      client_timezone: timezone,
      duration: durationNumber,
      slots,
    });
  } catch (error) {
    next(error);
  }
};

// Public booking endpoint
const bookSession = async (
  req,
  res,
  next
) => {
  try {
    const { slug } = req.params;

    const {
      date,
      start_at,
      duration_minutes,
      client_name,
      client_email,
      client_timezone = "Asia/Kolkata",
      phone = "",
    } = req.body;

    const duration = Number(
      duration_minutes
    );

    if (!isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message:
          "A valid date in YYYY-MM-DD format is required",
      });
    }

    if (
      ![30, 45, 60, 90].includes(duration)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be 30, 45, 60 or 90 minutes",
      });
    }

    if (!start_at) {
      return res.status(400).json({
        success: false,
        message: "Start time is required",
      });
    }

    const requestedStart =
      new Date(start_at);

    if (Number.isNaN(requestedStart.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start_at value",
      });
    }

    if (
      !client_name ||
      typeof client_name !== "string" ||
      !client_name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Client name is required",
      });
    }

    if (
      !client_email ||
      typeof client_email !== "string" ||
      !client_email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Client email is required",
      });
    }

    if (!isValidTimezone(client_timezone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client timezone",
      });
    }

    const normalizedEmail =
      client_email.trim().toLowerCase();

    const therapist =
      await Therapist.findOne({
        slug: slug.toLowerCase(),
      });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const availableSlots =
      await generateSlotsForTherapist({
        therapist,
        date,
        duration,
        clientTimezone:
          client_timezone,
      });

    const selectedSlot =
      availableSlots.find((slot) => {
        return (
          new Date(
            slot.start_at
          ).getTime() ===
          requestedStart.getTime()
        );
      });

    if (!selectedSlot) {
      return res.status(409).json({
        success: false,
        message:
          "Selected slot is no longer available",
      });
    }

    const sessionStart =
      new Date(selectedSlot.start_at);

    const sessionEnd =
      new Date(selectedSlot.end_at);

    if (
      Number.isNaN(sessionStart.getTime()) ||
      Number.isNaN(sessionEnd.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid session time",
      });
    }

    // Find an existing client for this therapist.
    let client = await Client.findOne({
      therapist_id: therapist._id,
      email: normalizedEmail,
    });

    // Create the client automatically when the booking
    // comes from a new client.
    if (!client) {
      try {
        client = await Client.create({
          therapist_id: therapist._id,
          name: client_name.trim(),
          email: normalizedEmail,
          phone:
            typeof phone === "string"
              ? phone.trim()
              : "",
          status: "active",
        });
      } catch (error) {
        // If another request created the same client
        // at the same time, use that client.
        if (error.code === 11000) {
          client = await Client.findOne({
            therapist_id: therapist._id,
            email: normalizedEmail,
          });
        } else {
          throw error;
        }
      }
    }

    if (!client) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to create or find client record",
      });
    }

    // Keep basic contact information current.
    let clientChanged = false;

    if (
      client_name.trim() &&
      client.name !== client_name.trim()
    ) {
      client.name = client_name.trim();
      clientChanged = true;
    }

    if (
      typeof phone === "string" &&
      phone.trim() &&
      client.phone !== phone.trim()
    ) {
      client.phone = phone.trim();
      clientChanged = true;
    }

    if (clientChanged) {
      await client.save();
    }

    const slotBlocks = buildSlotBlocks(
      sessionStart,
      sessionEnd
    );

    try {
      const session = await Session.create({
        therapist_id: therapist._id,
        client_id: client._id,
        start_at: sessionStart,
        end_at: sessionEnd,
        client_timezone,
        status: "confirmed",
        client_name: client.name,
        client_email: client.email,
        duration_minutes: duration,
        slot_blocks: slotBlocks,
      });

      return res.status(201).json({
        success: true,
        message:
          "Session booked successfully",
        session: {
          id: session._id,
          client_id: session.client_id,
          therapist_id:
            session.therapist_id,
          start_at: session.start_at,
          end_at: session.end_at,
          status: session.status,
          client_name:
            session.client_name,
          client_email:
            session.client_email,
          duration_minutes:
            session.duration_minutes,
          client_timezone:
            session.client_timezone,
        },
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
        },
      });
    } catch (error) {
      // Unique slot_blocks index protects the system
      // from concurrent double booking.
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "This slot was just booked by someone else",
        });
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableSlots,
  getPublicAvailableSlots,
  bookSession,
  zonedDateTimeToUTC,
  formatDateTimeInTimezone,
  buildSlotBlocks,
  generateSlotsForTherapist,
};