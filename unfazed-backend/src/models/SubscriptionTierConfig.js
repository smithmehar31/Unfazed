const mongoose = require("mongoose");

const subscriptionTierConfigSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },

      display_name: {
        type: String,
        required: true,
        trim: true,
      },

      caps: {
        active_clients: {
          type: Number,
          default: null,
          min: 0,
        },

        notes_per_month: {
          type: Number,
          default: null,
          min: 0,
        },

        sessions_per_month: {
          type: Number,
          default: null,
          min: 0,
        },
      },

      feature_flags: {
        rich_notes: {
          type: Boolean,
          default: false,
        },

        soap_dap_templates: {
          type: Boolean,
          default: false,
        },

        advanced_analytics: {
          type: Boolean,
          default: false,
        },

        basic_analytics: {
          type: Boolean,
          default: true,
        },

        chat: {
          type: Boolean,
          default: true,
        },

        packages: {
          type: Boolean,
          default: false,
        },
      },

      description: {
        type: String,
        trim: true,
        default: "",
      },

      is_active: {
        type: Boolean,
        default: true,
        index: true,
      },

      sort_order: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );

subscriptionTierConfigSchema.index({
  is_active: 1,
  sort_order: 1,
});

module.exports =
  mongoose.model(
    "SubscriptionTierConfig",
    subscriptionTierConfigSchema
  );