require("dotenv").config();

const mongoose = require("mongoose");

const SubscriptionTierConfig = require(
  "../models/SubscriptionTierConfig"
);

const tiers = [
  {
    name: "starter",
    display_name: "Starter",

    caps: {
      active_clients: 25,
      notes_per_month: 50,
      sessions_per_month: 50,
    },

    feature_flags: {
      rich_notes: false,
      soap_dap_templates: false,
      advanced_analytics: false,
      basic_analytics: true,
      chat: true,
      packages: false,
    },

    description:
      "Starter tier for therapists beginning their private practice.",

    is_active: true,
    sort_order: 1,
  },

  {
    name: "practice",
    display_name: "Practice",

    caps: {
      active_clients: 100,
      notes_per_month: 250,
      sessions_per_month: 250,
    },

    feature_flags: {
      rich_notes: true,
      soap_dap_templates: true,
      advanced_analytics: false,
      basic_analytics: true,
      chat: true,
      packages: true,
    },

    description:
      "Practice tier for therapists managing a growing client base.",

    is_active: true,
    sort_order: 2,
  },

  {
    name: "growth",
    display_name: "Growth",

    caps: {
      active_clients: null,
      notes_per_month: null,
      sessions_per_month: null,
    },

    feature_flags: {
      rich_notes: true,
      soap_dap_templates: true,
      advanced_analytics: true,
      basic_analytics: true,
      chat: true,
      packages: true,
    },

    description:
      "Growth tier with expanded limits and advanced analytics.",

    is_active: true,
    sort_order: 3,
  },
];

async function seedSubscriptionTiers() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    for (const tier of tiers) {
      const existingTier =
        await SubscriptionTierConfig.findOne({
          name: tier.name,
        });

      if (existingTier) {
        await SubscriptionTierConfig.updateOne(
          { name: tier.name },
          { $set: tier }
        );

        console.log(
          `Updated subscription tier: ${tier.name}`
        );
      } else {
        await SubscriptionTierConfig.create(tier);

        console.log(
          `Created subscription tier: ${tier.name}`
        );
      }
    }

    console.log(
      "Subscription tier seeding completed successfully."
    );
  } catch (error) {
    console.error(
      "Subscription tier seeding failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log("MongoDB connection closed.");
  }
}

seedSubscriptionTiers();