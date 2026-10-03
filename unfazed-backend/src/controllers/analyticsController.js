const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const Client = require("../models/Client");
const Session = require("../models/Session");

// --------------------------------------------------
// Get analytics for logged-in therapist
// --------------------------------------------------
const getAnalytics = async (
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

    if (
      !mongoose.Types.ObjectId.isValid(
        therapistId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid therapist ID.",
      });
    }

    const therapistObjectId =
      new mongoose.Types.ObjectId(
        therapistId
      );

    // ------------------------------------------------
    // Revenue trend
    // ------------------------------------------------
    const revenueTrend =
      await Payment.aggregate([
        {
          $match: {
            therapist_id:
              therapistObjectId,

            status: "paid",
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$createdAt",
              },

              month: {
                $month: "$createdAt",
              },
            },

            revenue: {
              $sum: "$amount",
            },

            net_revenue: {
              $sum: "$net_amount",
            },

            transaction_count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },

        {
          $project: {
            _id: 0,

            year: "$_id.year",

            month: "$_id.month",

            revenue: 1,

            net_revenue: 1,

            transaction_count: 1,
          },
        },
      ]);

    // ------------------------------------------------
    // Total revenue summary
    // ------------------------------------------------
    const revenueSummaryResult =
      await Payment.aggregate([
        {
          $match: {
            therapist_id:
              therapistObjectId,

            status: "paid",
          },
        },

        {
          $group: {
            _id: null,

            total_revenue: {
              $sum: "$amount",
            },

            total_net_revenue: {
              $sum: "$net_amount",
            },

            paid_transactions: {
              $sum: 1,
            },
          },
        },
      ]);

    const revenueSummary =
      revenueSummaryResult[0] || {
        total_revenue: 0,
        total_net_revenue: 0,
        paid_transactions: 0,
      };

    // ------------------------------------------------
    // Active clients
    // ------------------------------------------------
    const activeClientResult =
      await Client.aggregate([
        {
          $match: {
            therapist_id:
              therapistObjectId,

            status: "active",
          },
        },

        {
          $count:
            "active_clients",
        },
      ]);

    const activeClients =
      activeClientResult[0]
        ?.active_clients || 0;

    // ------------------------------------------------
    // Total clients
    // ------------------------------------------------
    const totalClientResult =
      await Client.aggregate([
        {
          $match: {
            therapist_id:
              therapistObjectId,
          },
        },

        {
          $count:
            "total_clients",
        },
      ]);

    const totalClients =
      totalClientResult[0]
        ?.total_clients || 0;

    // ------------------------------------------------
    // Session status counts
    // ------------------------------------------------
    const sessionStatusResult =
      await Session.aggregate([
        {
          $match: {
            therapist_id:
              therapistObjectId,
          },
        },

        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,

            status: "$_id",

            count: 1,
          },
        },
      ]);

    // ------------------------------------------------
    // No-show rate
    // ------------------------------------------------
    const noShowResult =
      await Session.aggregate([
        {
          $match: {
            therapist_id:
              therapistObjectId,

            status: {
              $in: [
                "confirmed",
                "completed",
                "no_show",
                "cancelled",
              ],
            },
          },
        },

        {
          $group: {
            _id: null,

            total_sessions: {
              $sum: 1,
            },

            no_show_sessions: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "no_show",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

    const noShowData =
      noShowResult[0] || {
        total_sessions: 0,
        no_show_sessions: 0,
      };

    const noShowRate =
      noShowData.total_sessions > 0
        ? (
            (noShowData.no_show_sessions /
              noShowData.total_sessions) *
            100
          )
        : 0;

    // ------------------------------------------------
    // Session summary
    // ------------------------------------------------
    const completedSessionResult =
      await Session.aggregate([
        {
          $match: {
            therapist_id:
              therapistObjectId,

            status: "completed",
          },
        },

        {
          $count:
            "completed_sessions",
        },
      ]);

    const completedSessions =
      completedSessionResult[0]
        ?.completed_sessions || 0;

    // ------------------------------------------------
    // Response
    // ------------------------------------------------
    return res.status(200).json({
      success: true,

      analytics: {
        revenue: {
          total_revenue:
            revenueSummary.total_revenue ||
            0,

          total_net_revenue:
            revenueSummary.total_net_revenue ||
            0,

          paid_transactions:
            revenueSummary.paid_transactions ||
            0,

          trend: revenueTrend,
        },

        clients: {
          active_clients:
            activeClients,

          total_clients:
            totalClients,
        },

        sessions: {
          completed_sessions:
            completedSessions,

          total_sessions:
            noShowData.total_sessions,

          no_show_sessions:
            noShowData.no_show_sessions,

          no_show_rate:
            Number(
              noShowRate.toFixed(2)
            ),

          status_breakdown:
            sessionStatusResult,
        },
      },
    });
  } catch (error) {
    console.error(
      "Analytics error:",
      error.message
    );

    next(error);
  }
};

module.exports = {
  getAnalytics,
};