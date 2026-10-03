const {
  canAccess,
  getEntitlements,
} = require("../services/entitlementService");

// --------------------------------------------------
// Get complete entitlements for logged-in therapist
// --------------------------------------------------
const getMyEntitlements = async (
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

    const entitlements =
      await getEntitlements(
        therapistId
      );

    return res.status(200).json({
      success: true,
      entitlements,
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// Check access to one feature
// --------------------------------------------------
const checkFeatureAccess = async (
  req,
  res,
  next
) => {
  try {
    const therapistId =
      req.therapistId;

    const featureKey =
      String(
        req.params.featureKey || ""
      ).trim();

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated therapist ID is missing.",
      });
    }

    if (!featureKey) {
      return res.status(400).json({
        success: false,
        message:
          "Feature key is required.",
      });
    }

    const allowed =
      await canAccess(
        therapistId,
        featureKey
      );

    return res.status(200).json({
      success: true,
      feature_key:
        featureKey,
      allowed,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyEntitlements,
  checkFeatureAccess,
};