const {
  canAccess,
} = require("../services/entitlementService");

// --------------------------------------------------
// Require access to a feature
// --------------------------------------------------
function requireFeature(featureKey) {
  return async (req, res, next) => {
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

      if (!featureKey) {
        return res.status(500).json({
          success: false,
          message:
            "Entitlement feature key is not configured.",
        });
      }

      const allowed =
        await canAccess(
          therapistId,
          featureKey
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "This feature is not available on your current subscription plan.",
          feature_key:
            featureKey,
          upgrade_required: true,
        });
      }

      next();
    } catch (error) {
      console.error(
        "Entitlement middleware error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify subscription access.",
      });
    }
  };
}

// --------------------------------------------------
// Require SOAP / DAP template access
// --------------------------------------------------
async function requireNoteTemplateAccess(
  req,
  res,
  next
) {
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

    const format =
      String(
        req.body?.format || ""
      )
        .trim()
        .toLowerCase();

    /*
     * Rich text and unknown/empty formats
     * do not require SOAP/DAP entitlement.
     */
    if (
      format !== "soap" &&
      format !== "dap"
    ) {
      return next();
    }

    const allowed =
      await canAccess(
        therapistId,
        "soap_dap_templates"
      );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "SOAP/DAP templates are not available on your current subscription plan.",
        feature_key:
          "soap_dap_templates",
        upgrade_required: true,
      });
    }

    next();
  } catch (error) {
    console.error(
      "Note template entitlement error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify note template access.",
    });
  }
}

// --------------------------------------------------
// Exports
// --------------------------------------------------
module.exports = {
  requireFeature,
  requireNoteTemplateAccess,
};