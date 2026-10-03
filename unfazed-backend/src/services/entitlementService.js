const Therapist = require("../models/Therapist");
const SubscriptionTierConfig = require(
  "../models/SubscriptionTierConfig"
);
const Client = require("../models/Client");

// --------------------------------------------------
// Get therapist with subscription tier
// --------------------------------------------------
async function getTherapistWithTier(
  therapistId
) {
  if (!therapistId) {
    throw new Error(
      "Therapist ID is required."
    );
  }

  const therapist =
    await Therapist.findById(
      therapistId
    )
      .populate("subscription_tier_id")
      .lean();

  if (!therapist) {
    throw new Error(
      "Therapist not found."
    );
  }

  return therapist;
}

// --------------------------------------------------
// Get subscription configuration
// --------------------------------------------------
async function getSubscriptionConfig(
  therapistId
) {
  const therapist =
    await getTherapistWithTier(
      therapistId
    );

  let tier =
    therapist.subscription_tier_id;

  /*
   * Safety fallback:
   * if therapist has no assigned tier,
   * use the active starter configuration.
   */
  if (!tier) {
    tier =
      await SubscriptionTierConfig.findOne({
        name: "starter",
        is_active: true,
      }).lean();
  }

  if (!tier) {
    throw new Error(
      "No active subscription configuration is available."
    );
  }

  return {
    therapist,
    tier,
  };
}

// --------------------------------------------------
// Central feature access function
// --------------------------------------------------
async function canAccess(
  therapistId,
  featureKey
) {
  try {
    if (!featureKey) {
      return false;
    }

    const {
      therapist,
      tier,
    } =
      await getSubscriptionConfig(
        therapistId
      );

    // ----------------------------------------------
    // Active client cap
    // ----------------------------------------------
    if (
      featureKey ===
      "active_client"
    ) {
      const maxClients =
        tier.caps
          ?.active_clients;

      /*
       * null means unlimited.
       */
      if (maxClients === null) {
        return true;
      }

      if (
        typeof maxClients !==
          "number"
      ) {
        return false;
      }

      const activeClientCount =
        await Client.countDocuments({
          therapist_id:
            therapist._id,

          status: "active",
        });

      return (
        activeClientCount <
        maxClients
      );
    }

    // ----------------------------------------------
    // Feature flag based access
    // ----------------------------------------------

    const featureMap = {
      rich_notes:
        "rich_notes",

      soap_dap_templates:
        "soap_dap_templates",

      advanced_analytics:
        "advanced_analytics",

      basic_analytics:
        "basic_analytics",

      chat:
        "chat",

      packages:
        "packages",
    };

    const flagName =
      featureMap[featureKey];

    if (!flagName) {
      return false;
    }

    return (
      tier.feature_flags?.[
        flagName
      ] === true
    );
  } catch (error) {
    console.error(
      "Entitlement check error:",
      error.message
    );

    return false;
  }
}

// --------------------------------------------------
// Get complete entitlement information
// --------------------------------------------------
async function getEntitlements(
  therapistId
) {
  const {
    tier,
  } =
    await getSubscriptionConfig(
      therapistId
    );

  return {
    tier: {
      id: tier._id,
      name: tier.name,
      display_name:
        tier.display_name,
      description:
        tier.description,
    },

    caps: tier.caps,

    feature_flags:
      tier.feature_flags,
  };
}

module.exports = {
  canAccess,
  getEntitlements,
  getSubscriptionConfig,
};