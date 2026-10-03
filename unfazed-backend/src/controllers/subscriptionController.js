const Therapist = require("../models/Therapist");

const SubscriptionTierConfig = require(
  "../models/SubscriptionTierConfig"
);

// --------------------------------------------------
// Get all active subscription tiers
// --------------------------------------------------
const getSubscriptionTiers = async (
  req,
  res,
  next
) => {
  try {
    const tiers =
      await SubscriptionTierConfig.find({
        is_active: true,
      })
        .sort({
          sort_order: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: tiers.length,
      tiers,
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// Get current subscription for logged-in therapist
// --------------------------------------------------
const getMySubscription = async (
  req,
  res,
  next
) => {
  try {
    const therapistId =
      req.therapistId;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated therapist ID is missing.",
      });
    }

    const therapist =
      await Therapist.findById(
        therapistId
      )
        .populate({
          path: "subscription_tier_id",
        })
        .lean();

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found.",
      });
    }

    if (!therapist.subscription_tier_id) {
      return res.status(200).json({
        success: true,
        subscription: null,
        message:
          "No subscription tier is currently assigned.",
      });
    }

    return res.status(200).json({
      success: true,
      subscription: {
        therapist_id:
          therapist._id,

        tier:
          therapist.subscription_tier_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubscriptionTiers,
  getMySubscription,
};