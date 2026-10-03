const Session = require("../models/Session");
const Client = require("../models/Client");
const Therapist = require("../models/Therapist");

const {
  EVENTS,
  emitDomainEvent,
} = require("./eventService");

const REMINDER_WINDOW_MINUTES = 10;
const FOLLOW_UP_WINDOW_MINUTES = 30;

const REMINDER_DEDUP_TTL_MS =
  26 * 60 * 60 * 1000;

const FOLLOW_UP_DEDUP_TTL_MS =
  2 * 60 * 60 * 1000;

// Temporary in-memory deduplication.
// This prevents the same notification from firing repeatedly
// during the lifetime of the running server.
const processedReminderSessions =
  new Map();

const processedFollowUpSessions =
  new Map();

function getSessionId(session) {
  if (!session) {
    return null;
  }

  return String(
    session._id ||
      session.id ||
      ""
  );
}

function cleanupProcessedNotifications() {
  const now =
    Date.now();

  for (const [
    sessionId,
    timestamp,
  ] of processedReminderSessions.entries()) {
    if (
      now - timestamp >
      REMINDER_DEDUP_TTL_MS
    ) {
      processedReminderSessions.delete(
        sessionId
      );
    }
  }

  for (const [
    sessionId,
    timestamp,
  ] of processedFollowUpSessions.entries()) {
    if (
      now - timestamp >
      FOLLOW_UP_DEDUP_TTL_MS
    ) {
      processedFollowUpSessions.delete(
        sessionId
      );
    }
  }
}

function getDateDifferenceInMinutes(
  fromDate,
  toDate
) {
  const from =
    new Date(fromDate).getTime();

  const to =
    new Date(toDate).getTime();

  return (
    (to - from) /
    (1000 * 60)
  );
}

async function findSessionRelations(
  session
) {
  const client =
    session.client_id?._id
      ? session.client_id
      : await Client.findById(
          session.client_id
        );

  const therapist =
    session.therapist_id?._id
      ? session.therapist_id
      : await Therapist.findById(
          session.therapist_id
        );

  return {
    client,
    therapist,
  };
}

async function process24HourReminder(
  session
) {
  try {
    cleanupProcessedNotifications();

    if (!session) {
      return {
        success: false,
        message:
          "Session is required.",
      };
    }

    const sessionId =
      getSessionId(session);

    if (!sessionId) {
      return {
        success: false,
        message:
          "Session ID is required.",
      };
    }

    if (
      ![
        "pending",
        "confirmed",
      ].includes(
        session.status
      )
    ) {
      return {
        success: true,
        skipped: true,
        reason:
          "Session is not active.",
        session_id:
          sessionId,
      };
    }

    if (
      processedReminderSessions.has(
        sessionId
      )
    ) {
      return {
        success: true,
        skipped: true,
        reason:
          "24-hour reminder has already been processed for this session.",
        session_id:
          sessionId,
      };
    }

    const now =
      new Date();

    const sessionStart =
      new Date(
        session.start_at
      );

    const minutesUntilSession =
      getDateDifferenceInMinutes(
        now,
        sessionStart
      );

    if (
      minutesUntilSession <
        24 * 60 -
          REMINDER_WINDOW_MINUTES ||
      minutesUntilSession >
        24 * 60 +
          REMINDER_WINDOW_MINUTES
    ) {
      return {
        success: true,
        skipped: true,
        reason:
          "Session is not currently within the 24-hour reminder window.",
        minutes_until_session:
          minutesUntilSession,
        session_id:
          sessionId,
      };
    }

    const {
      client,
      therapist,
    } =
      await findSessionRelations(
        session
      );

    if (!client) {
      return {
        success: false,
        message:
          "Client record not found.",
        session_id:
          sessionId,
      };
    }

    if (!therapist) {
      return {
        success: false,
        message:
          "Therapist record not found.",
        session_id:
          sessionId,
      };
    }

    const result =
      await emitDomainEvent(
        EVENTS.SESSION_REMINDER_24H,
        {
          client,
          therapist,
          session,
        }
      );

    if (result.success) {
      processedReminderSessions.set(
        sessionId,
        Date.now()
      );
    }

    return {
      success:
        result.success,
      event:
        EVENTS.SESSION_REMINDER_24H,
      skipped: false,
      session_id:
        sessionId,
      result,
    };
  } catch (error) {
    console.error(
      "24-hour reminder processing error:",
      error.message
    );

    return {
      success: false,
      message:
        error.message ||
        "Unable to process 24-hour reminder.",
      session_id:
        getSessionId(session),
    };
  }
}

async function processPostSessionFollowUp(
  session
) {
  try {
    cleanupProcessedNotifications();

    if (!session) {
      return {
        success: false,
        message:
          "Session is required.",
      };
    }

    const sessionId =
      getSessionId(session);

    if (!sessionId) {
      return {
        success: false,
        message:
          "Session ID is required.",
      };
    }

    if (
      ![
        "confirmed",
        "completed",
        "no_show",
      ].includes(
        session.status
      )
    ) {
      return {
        success: true,
        skipped: true,
        reason:
          "Session status is not eligible for follow-up.",
        session_id:
          sessionId,
      };
    }

    if (
      processedFollowUpSessions.has(
        sessionId
      )
    ) {
      return {
        success: true,
        skipped: true,
        reason:
          "Post-session follow-up has already been processed for this session.",
        session_id:
          sessionId,
      };
    }

    const now =
      new Date();

    const sessionEnd =
      new Date(
        session.end_at
      );

    const minutesSinceSessionEnded =
      getDateDifferenceInMinutes(
        sessionEnd,
        now
      );

    if (
      minutesSinceSessionEnded <
        0 ||
      minutesSinceSessionEnded >
        FOLLOW_UP_WINDOW_MINUTES
    ) {
      return {
        success: true,
        skipped: true,
        reason:
          "Session is not currently within the post-session follow-up window.",
        minutes_since_session_ended:
          minutesSinceSessionEnded,
        session_id:
          sessionId,
      };
    }

    const {
      client,
      therapist,
    } =
      await findSessionRelations(
        session
      );

    if (!client) {
      return {
        success: false,
        message:
          "Client record not found.",
        session_id:
          sessionId,
      };
    }

    if (!therapist) {
      return {
        success: false,
        message:
          "Therapist record not found.",
        session_id:
          sessionId,
      };
    }

    const result =
      await emitDomainEvent(
        EVENTS.SESSION_POST_FOLLOWUP,
        {
          client,
          therapist,
          session,
        }
      );

    if (result.success) {
      processedFollowUpSessions.set(
        sessionId,
        Date.now()
      );
    }

    return {
      success:
        result.success,
      event:
        EVENTS.SESSION_POST_FOLLOWUP,
      skipped: false,
      session_id:
        sessionId,
      result,
    };
  } catch (error) {
    console.error(
      "Post-session follow-up processing error:",
      error.message
    );

    return {
      success: false,
      message:
        error.message ||
        "Unable to process post-session follow-up.",
      session_id:
        getSessionId(session),
    };
  }
}

async function checkUpcomingSessionReminders() {
  try {
    cleanupProcessedNotifications();

    const now =
      new Date();

    const windowStart =
      new Date(
        now.getTime() +
          (
            24 * 60 -
            REMINDER_WINDOW_MINUTES
          ) *
            60 *
            1000
      );

    const windowEnd =
      new Date(
        now.getTime() +
          (
            24 * 60 +
            REMINDER_WINDOW_MINUTES
          ) *
            60 *
            1000
      );

    const sessions =
      await Session.find({
        status: {
          $in: [
            "pending",
            "confirmed",
          ],
        },

        start_at: {
          $gte: windowStart,
          $lte: windowEnd,
        },
      })
        .sort({
          start_at: 1,
        })
        .lean();

    const results = [];

    for (const session of sessions) {
      const result =
        await process24HourReminder(
          session
        );

      results.push(result);
    }

    return {
      success: true,
      checked:
        sessions.length,
      processed:
        results.filter(
          (result) =>
            result.success &&
            result.skipped === false
        ).length,
      skipped:
        results.filter(
          (result) =>
            result.skipped === true
        ).length,
      results,
    };
  } catch (error) {
    console.error(
      "Upcoming reminder check error:",
      error.message
    );

    return {
      success: false,
      message:
        error.message ||
        "Unable to check upcoming reminders.",
    };
  }
}

async function checkPostSessionFollowUps() {
  try {
    cleanupProcessedNotifications();

    const now =
      new Date();

    const windowStart =
      new Date(
        now.getTime() -
          FOLLOW_UP_WINDOW_MINUTES *
            60 *
            1000
      );

    const sessions =
      await Session.find({
        status: {
          $in: [
            "confirmed",
            "completed",
            "no_show",
          ],
        },

        end_at: {
          $gte: windowStart,
          $lte: now,
        },
      })
        .sort({
          end_at: 1,
        })
        .lean();

    const results = [];

    for (const session of sessions) {
      const result =
        await processPostSessionFollowUp(
          session
        );

      results.push(result);
    }

    return {
      success: true,
      checked:
        sessions.length,
      processed:
        results.filter(
          (result) =>
            result.success &&
            result.skipped === false
        ).length,
      skipped:
        results.filter(
          (result) =>
            result.skipped === true
        ).length,
      results,
    };
  } catch (error) {
    console.error(
      "Post-session follow-up check error:",
      error.message
    );

    return {
      success: false,
      message:
        error.message ||
        "Unable to check post-session follow-ups.",
    };
  }
}

function clearNotificationDeduplication() {
  processedReminderSessions.clear();
  processedFollowUpSessions.clear();

  console.log(
    "Notification deduplication cache cleared."
  );
}

module.exports = {
  process24HourReminder,
  processPostSessionFollowUp,
  checkUpcomingSessionReminders,
  checkPostSessionFollowUps,
  clearNotificationDeduplication,
};