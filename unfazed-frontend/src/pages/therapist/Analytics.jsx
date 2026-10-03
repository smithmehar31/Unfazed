import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import useEntitlement from "../../hooks/useEntitlement";
import UpgradePrompt from "../../components/common/UpgradePrompt";

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function monthLabel(year, month) {
  if (!year || !month) return "—";

  const value = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function Analytics() {
  const { token, logout } = useAuth();

  const {
    tier,
    loading: entitlementLoading,
    hasAccess,
  } = useEntitlement();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(
    async (refresh = false) => {
      if (!token) {
        setLoading(false);
        setError("Authentication token is required.");
        return;
      }

      try {
        refresh ? setRefreshing(true) : setLoading(true);
        setError("");

        const response = await axiosInstance.get("/analytics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Unable to load analytics."
          );
        }

        setAnalytics(response.data.analytics || null);
      } catch (requestError) {
        console.error("Analytics error:", requestError);

        if (requestError.response?.status === 401) {
          logout();
          return;
        }

        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load analytics."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, logout]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const revenueTrend = useMemo(() => {
    return (analytics?.revenue?.trend || []).map((item) => ({
      ...item,
      label: monthLabel(item.year, item.month),
      revenue: Number(item.revenue || 0),
      net_revenue: Number(item.net_revenue || 0),
    }));
  }, [analytics]);

  const totalRevenue = analytics?.revenue?.total_revenue || 0;
  const totalNetRevenue =
    analytics?.revenue?.total_net_revenue || 0;
  const paidTransactions =
    analytics?.revenue?.paid_transactions || 0;

  const activeClients =
    analytics?.clients?.active_clients || 0;
  const totalClients =
    analytics?.clients?.total_clients || 0;

  const completedSessions =
    analytics?.sessions?.completed_sessions || 0;
  const totalSessions =
    analytics?.sessions?.total_sessions || 0;
  const noShowSessions =
    analytics?.sessions?.no_show_sessions || 0;
  const noShowRate =
    analytics?.sessions?.no_show_rate || 0;

  const statusBreakdown =
    analytics?.sessions?.status_breakdown || [];

  const basicAnalyticsEnabled =
    hasAccess("basic_analytics");

  const advancedAnalyticsEnabled =
    hasAccess("advanced_analytics");

  if (loading || entitlementLoading) {
    return (
      <>
        <style>{css}</style>

        <div className="analytics-page">
          <div className="state-card">
            <div className="state-icon">↗</div>
            <h2>Loading analytics</h2>
            <p>
              Preparing your practice insights...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{css}</style>

        <div className="analytics-page">
          <div className="state-card">
            <div className="error-icon">!</div>

            <h2>Unable to load analytics</h2>

            <p>{error}</p>

            <button
              className="primary-btn"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Try Again"}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!basicAnalyticsEnabled) {
    return (
      <>
        <style>{css}</style>

        <div className="analytics-page">
          <div className="analytics-shell">
            <header className="topbar">
              <div>
                <div className="eyebrow">ANALYTICS</div>
                <h1>Practice analytics</h1>
                <p>
                  View revenue, client and session insights
                  from your practice.
                </p>
              </div>
            </header>

            <div className="upgrade-card">
              <UpgradePrompt
                featureName="Basic Analytics"
                currentPlan={
                  tier?.display_name || "Current plan"
                }
                message="Analytics are not included in your current subscription. Upgrade your plan to access practice insights."
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="analytics-page">
        <div className="analytics-shell">
          <header className="topbar">
            <div>
              <button
                className="back-link"
                onClick={() => window.history.back()}
              >
                ← Back
              </button>

              <div className="eyebrow">PRACTICE INSIGHTS</div>

              <h1>Analytics</h1>

              <p>
                Track revenue, clients, attendance and session
                outcomes from one dashboard.
              </p>
            </div>

            <button
              className="refresh-btn"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          <section className="summary-grid">
            <div className="stat-card">
              <div className="stat-icon blue">₹</div>
              <div>
                <span>Total Revenue</span>
                <strong>{money(totalRevenue)}</strong>
                <small>
                  {paidTransactions} paid transaction
                  {paidTransactions === 1 ? "" : "s"}
                </small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">◉</div>
              <div>
                <span>Active Clients</span>
                <strong>{activeClients}</strong>
                <small>
                  {totalClients} total client
                  {totalClients === 1 ? "" : "s"}
                </small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">%</div>
              <div>
                <span>No-show Rate</span>
                <strong>
                  {Number(noShowRate).toFixed(2)}%
                </strong>
                <small>
                  {noShowSessions} no-show session
                  {noShowSessions === 1 ? "" : "s"}
                </small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">✓</div>
              <div>
                <span>Completed Sessions</span>
                <strong>{completedSessions}</strong>
                <small>
                  {totalSessions} tracked session
                  {totalSessions === 1 ? "" : "s"}
                </small>
              </div>
            </div>
          </section>

          <section className="chart-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">REVENUE</div>
                <h2>Revenue trend</h2>
                <p>
                  Monthly paid revenue generated by the practice.
                </p>
              </div>

              <div className="net-box">
                <span>Net revenue</span>
                <strong>{money(totalNetRevenue)}</strong>
              </div>
            </div>

            {revenueTrend.length === 0 ? (
              <div className="empty-chart">
                No revenue data is available yet.
              </div>
            ) : (
              <div className="chart">
                <ResponsiveContainer width="100%" height={330}>
                  <LineChart
                    data={revenueTrend}
                    margin={{
                      top: 15,
                      right: 20,
                      left: 5,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                    />

                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) =>
                        `₹${Number(value || 0).toLocaleString(
                          "en-IN"
                        )}`
                      }
                    />

                    <Tooltip
                      formatter={(value) => money(value)}
                    />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#4d63d2"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="two-column">
            <div className="data-card">
              <div className="section-head">
                <div>
                  <div className="eyebrow">CLIENTS</div>
                  <h2>Client overview</h2>
                </div>
              </div>

              <div className="metric-list">
                <div>
                  <span>Active clients</span>
                  <strong>{activeClients}</strong>
                </div>

                <div>
                  <span>Total clients</span>
                  <strong>{totalClients}</strong>
                </div>

                <div>
                  <span>Inactive clients</span>
                  <strong>
                    {Math.max(
                      totalClients - activeClients,
                      0
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="data-card">
              <div className="section-head">
                <div>
                  <div className="eyebrow">SESSIONS</div>
                  <h2>Session outcomes</h2>
                </div>
              </div>

              {statusBreakdown.length === 0 ? (
                <div className="empty-inline">
                  No session outcome data available.
                </div>
              ) : (
                <div className="breakdown-list">
                  {statusBreakdown.map((item) => (
                    <div key={item.status}>
                      <span>
                        {String(item.status || "unknown").replace(
                          /_/g,
                          " "
                        )}
                      </span>

                      <strong>{Number(item.count || 0)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="attendance-card">
            <div>
              <div className="eyebrow">ATTENDANCE</div>
              <h2>No-show monitoring</h2>
              <p>
                Current no-show rate across tracked sessions.
              </p>
            </div>

            <div className="attendance-value">
              <strong>
                {Number(noShowRate).toFixed(2)}%
              </strong>

              <span>
                {noShowSessions} of {totalSessions} tracked
                session{totalSessions === 1 ? "" : "s"}
              </span>
            </div>
          </section>

          {!advancedAnalyticsEnabled ? (
            <section className="advanced-card">
              <UpgradePrompt
                featureName="Advanced Analytics"
                currentPlan={
                  tier?.display_name || "Current plan"
                }
                message="Upgrade your plan to unlock deeper practice insights."
                compact
              />
            </section>
          ) : (
            <section className="advanced-enabled">
              <div className="eyebrow">ADVANCED ANALYTICS</div>
              <h2>Advanced analytics enabled</h2>
              <p>
                Your current subscription includes advanced
                practice analytics.
              </p>
            </section>
          )}

          <footer className="footer">
            <span>Unfazed Practice Management</span>
            <span>Practice analytics workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .analytics-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .analytics-page * {
    box-sizing: border-box;
  }

  .analytics-shell {
    max-width: 1180px;
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    padding-bottom: 22px;
    border-bottom: 1px solid #e1e6ef;
  }

  .back-link {
    display: block;
    border: 0;
    background: transparent;
    padding: 5px 0;
    margin-bottom: 13px;
    color: #4f63cc;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .eyebrow {
    margin-bottom: 7px;
    color: #738097;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .topbar h1 {
    margin: 0;
    color: #192338;
    font-size: 36px;
    letter-spacing: -.8px;
  }

  .topbar p {
    margin: 8px 0 0;
    color: #6c788b;
    font-size: 13px;
    line-height: 1.6;
  }

  .refresh-btn,
  .primary-btn {
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .refresh-btn {
    border: 1px solid #d6ddea;
    background: #fff;
    color: #526079;
  }

  .primary-btn {
    border: 1px solid #4d63d2;
    background: #4d63d2;
    color: #fff;
  }

  .refresh-btn:disabled,
  .primary-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin: 19px 0;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 17px;
    border: 1px solid #e0e5ed;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 7px 20px rgba(22,31,54,.035);
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    font-size: 16px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .stat-icon.blue {
    background: #ebf2ff;
    color: #4169b7;
  }

  .stat-icon.green {
    background: #eaf8f0;
    color: #2e8758;
  }

  .stat-icon.orange {
    background: #fff4e6;
    color: #b77622;
  }

  .stat-icon.purple {
    background: #efedff;
    color: #6959c4;
  }

  .stat-card span,
  .stat-card small {
    display: block;
  }

  .stat-card span {
    color: #7d889a;
    font-size: 9px;
    margin-bottom: 4px;
  }

  .stat-card strong {
    display: block;
    color: #243047;
    font-size: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stat-card small {
    margin-top: 4px;
    color: #98a0ad;
    font-size: 8px;
  }

  .chart-card,
  .data-card,
  .attendance-card,
  .advanced-enabled {
    border: 1px solid #e0e5ed;
    border-radius: 19px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(22,31,54,.04);
  }

  .chart-card {
    padding: 23px;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
  }

  .section-head h2,
  .attendance-card h2,
  .advanced-enabled h2 {
    margin: 0;
    color: #243047;
    font-size: 20px;
  }

  .section-head p,
  .attendance-card p,
  .advanced-enabled p {
    margin: 5px 0 0;
    color: #7a8598;
    font-size: 10px;
    line-height: 1.5;
  }

  .net-box {
    padding: 10px 12px;
    border-radius: 10px;
    background: #f7f8fb;
    border: 1px solid #e3e7ee;
    text-align: right;
  }

  .net-box span {
    display: block;
    color: #8a94a5;
    font-size: 8px;
    margin-bottom: 4px;
  }

  .net-box strong {
    color: #253149;
    font-size: 15px;
  }

  .chart {
    width: 100%;
    height: 330px;
    margin-top: 15px;
  }

  .empty-chart {
    height: 300px;
    display: grid;
    place-items: center;
    color: #8993a5;
    font-size: 11px;
  }

  .two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 16px;
  }

  .data-card {
    padding: 22px;
  }

  .metric-list {
    display: grid;
    gap: 8px;
    margin-top: 16px;
  }

  .metric-list > div,
  .breakdown-list > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    background: #f8f9fb;
  }

  .metric-list span,
  .breakdown-list span {
    color: #697589;
    font-size: 10px;
  }

  .metric-list strong,
  .breakdown-list strong {
    color: #2b364c;
    font-size: 13px;
  }

  .breakdown-list {
    display: grid;
    gap: 8px;
    margin-top: 16px;
  }

  .breakdown-list span {
    text-transform: capitalize;
  }

  .empty-inline {
    padding: 35px 10px 15px;
    color: #8a94a4;
    text-align: center;
    font-size: 10px;
  }

  .attendance-card {
    margin-top: 16px;
    padding: 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }

  .attendance-value {
    text-align: right;
  }

  .attendance-value strong {
    display: block;
    color: #172033;
    font-size: 31px;
    line-height: 1;
  }

  .attendance-value span {
    display: block;
    margin-top: 6px;
    color: #8a94a5;
    font-size: 9px;
  }

  .advanced-card {
    margin-top: 16px;
  }

  .advanced-enabled {
    margin-top: 16px;
    padding: 22px;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 22px;
    padding: 16px 2px 0;
    border-top: 1px solid #e1e6ef;
    color: #8b95a5;
    font-size: 9px;
  }

  .upgrade-card,
  .state-card {
    margin-top: 20px;
    border: 1px solid #e0e5ed;
    border-radius: 18px;
    background: #fff;
    padding: 28px;
  }

  .state-card {
    max-width: 440px;
    margin: 100px auto;
    text-align: center;
  }

  .state-icon,
  .error-icon {
    width: 50px;
    height: 50px;
    margin: 0 auto 13px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    font-weight: 800;
  }

  .state-icon {
    background: #eef1ff;
    color: #5065cf;
  }

  .error-icon {
    background: #fff0f0;
    color: #b34848;
  }

  .state-card h2 {
    margin: 0 0 7px;
    color: #29344a;
    font-size: 19px;
  }

  .state-card p {
    margin: 0 0 18px;
    color: #7a8598;
    font-size: 11px;
  }

  @media (max-width: 950px) {
    .summary-grid {
      grid-template-columns: 1fr 1fr;
    }

    .two-column {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 650px) {
    .analytics-page {
      padding: 15px;
    }

    .topbar,
    .attendance-card,
    .footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .refresh-btn {
      width: 100%;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .section-head {
      flex-direction: column;
    }

    .net-box {
      width: 100%;
      text-align: left;
    }

    .chart {
      height: 270px;
    }

    .attendance-value {
      text-align: left;
    }
  }
`;
export default Analytics;