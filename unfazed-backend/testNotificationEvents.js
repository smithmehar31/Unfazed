require("dotenv").config();

const mongoose = require("mongoose");

const Client = require("./src/models/Client");
const Therapist = require("./src/models/Therapist");

const {
  process24HourReminder,
  processPostSessionFollowUp,
} = require("./src/services/reminderService");

async function main() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    /*
     * Find a client who definitely has a usable phone number.
     * This is required to test the WhatsApp stub.
     */
    const client = await Client.findOne({
      phone: {
        $exists: true,
        $type: "string",
        $regex: /\S+/,
      },
    }).lean();

    if (!client) {
      throw new Error(
        "No client with a valid phone number was found."
      );
    }

    /*
     * Find the therapist linked to this client.
     */
    const therapist = await Therapist.findById(
      client.therapist_id
    ).lean();

    if (!therapist) {
      throw new Error(
        "Therapist for the selected client was not found."
      );
    }

    console.log("Using test client:", client.name);
    console.log("Client phone:", client.phone);
    console.log("Client email:", client.email || "Not available");
    console.log("Using therapist:", therapist.name);

    const now = new Date();

    // ==================================================
    // TEST 1: 24-HOUR REMINDER
    // ==================================================

    const reminderSession = {
      _id: new mongoose.Types.ObjectId(),

      client_id: client._id,

      therapist_id: therapist._id,

      start_at: new Date(
        now.getTime() +
          24 * 60 * 60 * 1000
      ),

      end_at: new Date(
        now.getTime() +
          25 * 60 * 60 * 1000
      ),

      status: "confirmed",

      client_name: client.name,

      client_email: client.email || "",

      client_timezone: "Asia/Kolkata",
    };

    console.log(
      "\n=================================================="
    );

    console.log(
      "TEST 1: 24-HOUR REMINDER"
    );

    console.log(
      "=================================================="
    );

    const reminderResult =
      await process24HourReminder(
        reminderSession
      );

    console.log(
      "\nFirst reminder result:"
    );

    console.log(
      JSON.stringify(
        reminderResult,
        null,
        2
      )
    );

    /*
     * Run the same reminder again.
     * Deduplication should skip it.
     */
    const secondReminderResult =
      await process24HourReminder(
        reminderSession
      );

    console.log(
      "\nSecond reminder result:"
    );

    console.log(
      JSON.stringify(
        secondReminderResult,
        null,
        2
      )
    );

    // ==================================================
    // TEST 2: POST-SESSION FOLLOW-UP
    // ==================================================

    const followUpSession = {
      _id: new mongoose.Types.ObjectId(),

      client_id: client._id,

      therapist_id: therapist._id,

      start_at: new Date(
        now.getTime() -
          65 * 60 * 1000
      ),

      end_at: new Date(
        now.getTime() -
          5 * 60 * 1000
      ),

      status: "completed",

      client_name: client.name,

      client_email: client.email || "",

      client_timezone: "Asia/Kolkata",
    };

    console.log(
      "\n=================================================="
    );

    console.log(
      "TEST 2: POST-SESSION FOLLOW-UP"
    );

    console.log(
      "=================================================="
    );

    const followUpResult =
      await processPostSessionFollowUp(
        followUpSession
      );

    console.log(
      "\nFirst follow-up result:"
    );

    console.log(
      JSON.stringify(
        followUpResult,
        null,
        2
      )
    );

    /*
     * Run the same follow-up again.
     * Deduplication should skip it.
     */
    const secondFollowUpResult =
      await processPostSessionFollowUp(
        followUpSession
      );

    console.log(
      "\nSecond follow-up result:"
    );

    console.log(
      JSON.stringify(
        secondFollowUpResult,
        null,
        2
      )
    );

    // ==================================================
    // FINAL TEST SUMMARY
    // ==================================================

    console.log(
      "\n=================================================="
    );

    console.log(
      "NOTIFICATION EVENT TESTING COMPLETED"
    );

    console.log(
      "=================================================="
    );

    console.log(
      "\n24-hour reminder first run:",
      reminderResult.success &&
      reminderResult.skipped === false
        ? "PASS"
        : "FAIL"
    );

    console.log(
      "24-hour reminder duplicate prevention:",
      secondReminderResult.success &&
      secondReminderResult.skipped === true
        ? "PASS"
        : "FAIL"
    );

    console.log(
      "Post-session follow-up first run:",
      followUpResult.success &&
      followUpResult.skipped === false
        ? "PASS"
        : "FAIL"
    );

    console.log(
      "Post-session follow-up duplicate prevention:",
      secondFollowUpResult.success &&
      secondFollowUpResult.skipped === true
        ? "PASS"
        : "FAIL"
    );

    console.log(
      "\nAll notification tests finished."
    );
  } catch (error) {
    console.error(
      "\nNotification event test failed:"
    );

    console.error(
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log(
      "MongoDB connection closed."
    );
  }
}

main();