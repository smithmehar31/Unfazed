require("dotenv").config();

const mongoose = require("mongoose");

const Therapist = require("../models/Therapist");
const SubscriptionTierConfig = require(
  "../models/SubscriptionTierConfig"
);

async function assignDefaultSubscription() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log(
      "MongoDB connected successfully."
    );

    // Find the default starter tier.
    const starterTier =
      await SubscriptionTierConfig.findOne({
        name: "starter",
        is_active: true,
      });

    if (!starterTier) {
      throw new Error(
        "Starter subscription tier was not found."
      );
    }

    console.log(
      "Starter tier found:",
      starterTier._id.toString()
    );

    // Find therapists who do not have a subscription tier yet.
    const therapists =
      await Therapist.find({
        $or: [
          {
            subscription_tier_id: null,
          },
          {
            subscription_tier_id: {
              $exists: false,
            },
          },
        ],
      });

    console.log(
      `Therapists without a subscription tier: ${therapists.length}`
    );

    let updatedCount = 0;

    for (const therapist of therapists) {
      therapist.subscription_tier_id =
        starterTier._id;

      await therapist.save();

      updatedCount++;

      console.log(
        `Assigned starter tier to therapist: ${therapist.name}`
      );
    }

    console.log(
      `\nDefault subscription assignment completed. Updated: ${updatedCount}`
    );
  } catch (error) {
    console.error(
      "Default subscription assignment failed:",
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

assignDefaultSubscription();