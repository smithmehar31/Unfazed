const {
  notifyBookingConfirmed,
  notify24HourReminder,
  notifyPostSessionFollowUp,
} = require("./notificationService");

const EVENTS = {
  BOOKING_CONFIRMED:
    "booking.confirmed",

  SESSION_REMINDER_24H:
    "session.reminder_24h",

  SESSION_POST_FOLLOWUP:
    "session.post_followup",
};

const handleBookingConfirmed = async ({
  client,
  therapist,
  session,
}) => {
  try {
    console.log(
      `Domain event fired: ${EVENTS.BOOKING_CONFIRMED}`
    );

    const results =
      await notifyBookingConfirmed({
        client,
        therapist,
        session,
      });

    return {
      success: true,
      event:
        EVENTS.BOOKING_CONFIRMED,
      results,
    };
  } catch (error) {
    console.error(
      "Booking confirmed event error:",
      error.message
    );

    return {
      success: false,
      event:
        EVENTS.BOOKING_CONFIRMED,
      message:
        error.message ||
        "Unable to process booking confirmed event.",
    };
  }
};

const handle24HourReminder = async ({
  client,
  therapist,
  session,
}) => {
  try {
    console.log(
      `Domain event fired: ${EVENTS.SESSION_REMINDER_24H}`
    );

    const results =
      await notify24HourReminder({
        client,
        therapist,
        session,
      });

    return {
      success: true,
      event:
        EVENTS.SESSION_REMINDER_24H,
      results,
    };
  } catch (error) {
    console.error(
      "24 hour reminder event error:",
      error.message
    );

    return {
      success: false,
      event:
        EVENTS.SESSION_REMINDER_24H,
      message:
        error.message ||
        "Unable to process 24 hour reminder event.",
    };
  }
};

const handlePostSessionFollowUp = async ({
  client,
  therapist,
  session,
}) => {
  try {
    console.log(
      `Domain event fired: ${EVENTS.SESSION_POST_FOLLOWUP}`
    );

    const results =
      await notifyPostSessionFollowUp({
        client,
        therapist,
        session,
      });

    return {
      success: true,
      event:
        EVENTS.SESSION_POST_FOLLOWUP,
      results,
    };
  } catch (error) {
    console.error(
      "Post session follow-up event error:",
      error.message
    );

    return {
      success: false,
      event:
        EVENTS.SESSION_POST_FOLLOWUP,
      message:
        error.message ||
        "Unable to process post session follow-up event.",
    };
  }
};

const emitDomainEvent = async (
  eventName,
  payload
) => {
  switch (eventName) {
    case EVENTS.BOOKING_CONFIRMED:
      return handleBookingConfirmed(
        payload
      );

    case EVENTS.SESSION_REMINDER_24H:
      return handle24HourReminder(
        payload
      );

    case EVENTS.SESSION_POST_FOLLOWUP:
      return handlePostSessionFollowUp(
        payload
      );

    default:
      console.warn(
        `Unknown domain event: ${eventName}`
      );

      return {
        success: false,
        event: eventName,
        message:
          "Unsupported domain event.",
      };
  }
};

module.exports = {
  EVENTS,
  emitDomainEvent,
  handleBookingConfirmed,
  handle24HourReminder,
  handlePostSessionFollowUp,
};