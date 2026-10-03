const {
  checkUpcomingSessionReminders,
  checkPostSessionFollowUps,
} = require("./reminderService");

const CHECK_INTERVAL_MS =
  5 * 60 * 1000;

const REMINDER_KEY_TTL_MS =
  26 * 60 * 60 * 1000;

const FOLLOW_UP_KEY_TTL_MS =
  2 * 60 * 60 * 1000;

let schedulerInterval = null;

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

function cleanupProcessedItems() {
  const now =
    Date.now();

  for (const [
    sessionId,
    timestamp,
  ] of processedReminderSessions.entries()) {
    if (
      now - timestamp >
      REMINDER_KEY_TTL_MS
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
      FOLLOW_UP_KEY_TTL_MS
    ) {
      processedFollowUpSessions.delete(
        sessionId
      );
    }
  }
}

async function runNotificationChecks() {
  try {
    cleanupProcessedItems();

    console.log(
      "Notification scheduler: running checks..."
    );

    const reminderResult =
      await checkUpcomingSessionReminders();

    if (
      reminderResult?.success &&
      Array.isArray(
        reminderResult.results
      )
    ) {
      for (const result of reminderResult.results) {
        if (
          result?.success &&
          result?.skipped === false &&
          result?.event ===
            "session.reminder_24h"
        ) {
          console.log(
            "24-hour reminder processed:",
            result
          );
        }
      }
    }

    console.log(
      "24-hour reminder check:",
      reminderResult
    );

    const followUpResult =
      await checkPostSessionFollowUps();

    if (
      followUpResult?.success &&
      Array.isArray(
        followUpResult.results
      )
    ) {
      for (const result of followUpResult.results) {
        if (
          result?.success &&
          result?.skipped === false &&
          result?.event ===
            "session.post_followup"
        ) {
          console.log(
            "Post-session follow-up processed:",
            result
          );
        }
      }
    }

    console.log(
      "Post-session follow-up check:",
      followUpResult
    );
  } catch (error) {
    console.error(
      "Notification scheduler error:",
      error.message
    );
  }
}

async function startNotificationScheduler() {
  if (schedulerInterval) {
    console.log(
      "Notification scheduler is already running."
    );

    return;
  }

  console.log(
    "Notification scheduler started."
  );

  console.log(
    "Notification checks will run every 5 minutes."
  );

  await runNotificationChecks();

  schedulerInterval = setInterval(
    () => {
      runNotificationChecks();
    },
    CHECK_INTERVAL_MS
  );
}

function stopNotificationScheduler() {
  if (!schedulerInterval) {
    return;
  }

  clearInterval(
    schedulerInterval
  );

  schedulerInterval = null;

  processedReminderSessions.clear();
  processedFollowUpSessions.clear();

  console.log(
    "Notification scheduler stopped."
  );
}

module.exports = {
  startNotificationScheduler,
  stopNotificationScheduler,
};