const sendNotification = async ({
  channel,
  recipient,
  subject,
  message,
  metadata = {},
}) => {
  try {
    if (!channel) {
      throw new Error(
        "Notification channel is required."
      );
    }

    if (!recipient) {
      throw new Error(
        "Notification recipient is required."
      );
    }

    if (!message) {
      throw new Error(
        "Notification message is required."
      );
    }

    const notification = {
      channel,
      recipient,
      subject: subject || "",
      message,
      metadata,
      created_at: new Date(),
    };

    console.log(
      "NotificationService:",
      JSON.stringify(
        notification,
        null,
        2
      )
    );

    return {
      success: true,
      notification,
    };
  } catch (error) {
    console.error(
      "NotificationService error:",
      error.message
    );

    return {
      success: false,
      message:
        error.message ||
        "Unable to send notification.",
    };
  }
};

const sendEmailNotification = async ({
  recipient,
  subject,
  message,
  metadata = {},
}) => {
  return sendNotification({
    channel: "email",
    recipient,
    subject,
    message,
    metadata,
  });
};

const sendWhatsAppNotification = async ({
  recipient,
  message,
  metadata = {},
}) => {
  console.log(
    "WhatsApp stub:",
    {
      recipient,
      message,
      metadata,
      queued_at: new Date(),
    }
  );

  return {
    success: true,
    channel: "whatsapp",
    stub: true,
    recipient,
    message,
    metadata,
  };
};

const notifyBookingConfirmed = async ({
  client,
  therapist,
  session,
}) => {
  const results = [];

  if (client?.email) {
    results.push(
      await sendEmailNotification({
        recipient: client.email,

        subject:
          "Session Booking Confirmed - Unfazed",

        message:
          `Hello ${client.name || "Client"}, ` +
          `your session with ${
            therapist?.name ||
            "your therapist"
          } has been confirmed.`,

        metadata: {
          event:
            "booking.confirmed",

          session_id:
            session?._id ||
            session?.id ||
            null,

          therapist_id:
            therapist?._id ||
            therapist?.id ||
            null,

          client_id:
            client?._id ||
            client?.id ||
            null,
        },
      })
    );
  }

  if (client?.phone) {
    results.push(
      await sendWhatsAppNotification({
        recipient: client.phone,

        message:
          `Your session with ${
            therapist?.name ||
            "your therapist"
          } has been confirmed.`,

        metadata: {
          event:
            "booking.confirmed",

          session_id:
            session?._id ||
            session?.id ||
            null,
        },
      })
    );
  }

  return results;
};

const notify24HourReminder = async ({
  client,
  therapist,
  session,
}) => {
  const results = [];

  if (client?.email) {
    results.push(
      await sendEmailNotification({
        recipient: client.email,

        subject:
          "Session Reminder - Unfazed",

        message:
          `Hello ${client.name || "Client"}, ` +
          `this is a reminder that your session with ${
            therapist?.name ||
            "your therapist"
          } is scheduled in approximately 24 hours.`,

        metadata: {
          event:
            "session.reminder_24h",

          session_id:
            session?._id ||
            session?.id ||
            null,
        },
      })
    );
  }

  if (client?.phone) {
    results.push(
      await sendWhatsAppNotification({
        recipient: client.phone,

        message:
          `Reminder: your session with ${
            therapist?.name ||
            "your therapist"
          } is scheduled in approximately 24 hours.`,

        metadata: {
          event:
            "session.reminder_24h",

          session_id:
            session?._id ||
            session?.id ||
            null,
        },
      })
    );
  }

  return results;
};

const notifyPostSessionFollowUp = async ({
  client,
  therapist,
  session,
}) => {
  const results = [];

  if (client?.email) {
    results.push(
      await sendEmailNotification({
        recipient: client.email,

        subject:
          "Session Follow-up - Unfazed",

        message:
          `Hello ${client.name || "Client"}, ` +
          `thank you for attending your session with ${
            therapist?.name ||
            "your therapist"
          }. Please follow any next steps discussed during your session.`,

        metadata: {
          event:
            "session.post_followup",

          session_id:
            session?._id ||
            session?.id ||
            null,
        },
      })
    );
  }

  if (client?.phone) {
    results.push(
      await sendWhatsAppNotification({
        recipient: client.phone,

        message:
          `Thank you for attending your session with ${
            therapist?.name ||
            "your therapist"
          }. Please follow the next steps discussed during your session.`,

        metadata: {
          event:
            "session.post_followup",

          session_id:
            session?._id ||
            session?.id ||
            null,
        },
      })
    );
  }

  return results;
};

module.exports = {
  sendNotification,
  sendEmailNotification,
  sendWhatsAppNotification,
  notifyBookingConfirmed,
  notify24HourReminder,
  notifyPostSessionFollowUp,
};