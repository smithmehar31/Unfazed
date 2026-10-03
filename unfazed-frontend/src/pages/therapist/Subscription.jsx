import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import useEntitlement from "../../hooks/useEntitlement";

function Subscription() {
  const {
    tier,
    caps,
    featureFlags,
    loading: entitlementLoading,
    error: entitlementError,
    fetchEntitlements,
  } = useEntitlement();

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      setPlansLoading(true);
      setPlansError("");

      const response = await axiosInstance.get(
        "/subscriptions/tiers"
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to load subscription plans."
        );
      }

      setPlans(response.data.tiers || []);
    } catch (error) {
      console.error("Subscription plans error:", error);

      setPlansError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load subscription plans."
      );
    } finally {
      setPlansLoading(false);
    }
  }

  function formatLimit(value) {
    if (value === null) return "Unlimited";
    if (typeof value === "number") {
      return value.toLocaleString("en-IN");
    }
    return "Not configured";
  }

  function formatFeatureName(value) {
    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function isCurrentPlan(plan) {
    return (
      tier?.id?.toString() ===
      plan?._id?.toString()
    );
  }

  async function refreshAll() {
    await fetchPlans();
    await fetchEntitlements();
  }

  if (entitlementLoading || plansLoading) {
    return (
      <>
        <style>{css}</style>

        <div className="sub-page">
          <div className="state-card">
            <div className="state-icon">U</div>
            <h2>Loading subscription</h2>
            <p>Fetching your plan and feature details...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="sub-page">
        <div className="sub-shell">
          <header className="topbar">
            <div>
              <button
                className="back-link"
                onClick={() => window.history.back()}
              >
                ← Back
              </button>

              <div className="eyebrow">SUBSCRIPTION</div>

              <h1>Manage your plan</h1>

              <p>
                Review your current limits, enabled features and
                available subscription tiers.
              </p>
            </div>

            <button
              className="refresh-btn"
              onClick={refreshAll}
            >
              Refresh
            </button>
          </header>

          {entitlementError && (
            <div className="alert error">
              {entitlementError}
            </div>
          )}

          {plansError && (
            <div className="alert error">
              {plansError}
            </div>
          )}

          <section className="current-plan">
            <div className="current-top">
              <div>
                <div className="eyebrow light">CURRENT PLAN</div>

                <h2>
                  {tier?.display_name || "No plan assigned"}
                </h2>

                <p>
                  {tier?.description ||
                    "A subscription tier has not been assigned yet."}
                </p>
              </div>

              <span className="active-badge">Active</span>
            </div>

            <div className="limit-grid">
              <div>
                <span>Active Clients</span>
                <strong>{formatLimit(caps?.active_clients)}</strong>
              </div>

              <div>
                <span>Notes / Month</span>
                <strong>{formatLimit(caps?.notes_per_month)}</strong>
              </div>

              <div>
                <span>Sessions / Month</span>
                <strong>
                  {formatLimit(caps?.sessions_per_month)}
                </strong>
              </div>
            </div>

            <div className="feature-section">
              <h3>Included features</h3>

              {Object.keys(featureFlags || {}).length === 0 ? (
                <div className="empty-feature">
                  No feature configuration available.
                </div>
              ) : (
                <div className="feature-list">
                  {Object.entries(featureFlags || {}).map(
                    ([feature, enabled]) => (
                      <div className="feature-row" key={feature}>
                        <span>
                          {formatFeatureName(feature)}
                        </span>

                        <strong
                          className={
                            enabled ? "enabled" : "disabled"
                          }
                        >
                          {enabled
                            ? "Enabled"
                            : "Not included"}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="plans-section">
            <div className="section-head">
              <div>
                <div className="eyebrow">AVAILABLE PLANS</div>
                <h2>Subscription tiers</h2>
              </div>
            </div>

            {plans.length === 0 ? (
              <div className="empty-card">
                No subscription plans are currently available.
              </div>
            ) : (
              <div className="plans-grid">
                {plans.map((plan) => {
                  const current = isCurrentPlan(plan);

                  return (
                    <article
                      key={plan._id}
                      className={`plan-card ${
                        current ? "current" : ""
                      }`}
                    >
                      <div className="plan-head">
                        <div>
                          <h3>{plan.display_name}</h3>
                          <p>
                            {plan.description ||
                              "Configured subscription tier."}
                          </p>
                        </div>

                        {current && (
                          <span className="current-badge">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="plan-limits">
                        <div>
                          <span>Active Clients</span>
                          <strong>
                            {formatLimit(
                              plan.caps?.active_clients
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Notes / Month</span>
                          <strong>
                            {formatLimit(
                              plan.caps?.notes_per_month
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Sessions / Month</span>
                          <strong>
                            {formatLimit(
                              plan.caps?.sessions_per_month
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="plan-features">
                        {Object.entries(
                          plan.feature_flags || {}
                        ).map(([feature, enabled]) => (
                          <div
                            key={feature}
                            className="plan-feature"
                          >
                            <span>
                              {formatFeatureName(feature)}
                            </span>

                            <strong
                              className={
                                enabled
                                  ? "enabled"
                                  : "disabled"
                              }
                            >
                              {enabled ? "✓" : "—"}
                            </strong>
                          </div>
                        ))}
                      </div>

                      {!current && (
                        <div className="plan-note">
                          <strong>Plan information</strong>
                          <p>
                            This tier has its own configured
                            limits and feature access.
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="footer">
            <span>Unfazed Practice Management</span>
            <span>Therapist subscription workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .sub-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  .sub-page * {
    box-sizing: border-box;
  }

  .sub-shell {
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
    margin-bottom: 13px;
    border: 0;
    background: transparent;
    padding: 5px 0;
    color: #4f64ce;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .eyebrow {
    margin-bottom: 7px;
    color: #748097;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .eyebrow.light {
    color: rgba(255,255,255,.7);
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

  .refresh-btn {
    border: 1px solid #d6ddea;
    background: #fff;
    color: #4f5d76;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .alert {
    margin-top: 15px;
    padding: 12px 14px;
    border-radius: 11px;
    font-size: 11px;
  }

  .alert.error {
    background: #fff3f3;
    border: 1px solid #efd8d8;
    color: #a84242;
  }

  .current-plan {
    margin-top: 19px;
    padding: 27px;
    border-radius: 21px;
    background: linear-gradient(135deg,#243670 0%,#566bd8 100%);
    color: #fff;
    box-shadow: 0 12px 28px rgba(48,63,125,.14);
  }

  .current-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
  }

  .current-plan h2 {
    margin: 0;
    color: #fff;
    font-size: 29px;
    letter-spacing: -.4px;
  }

  .current-plan .current-top p {
    margin: 7px 0 0;
    max-width: 650px;
    color: rgba(255,255,255,.8);
    font-size: 12px;
    line-height: 1.6;
  }

  .active-badge {
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.14);
    border: 1px solid rgba(255,255,255,.2);
    color: #fff;
    font-size: 9px;
    font-weight: 800;
  }

  .limit-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 10px;
    margin-top: 24px;
  }

  .limit-grid > div {
    padding: 14px;
    border-radius: 13px;
    background: rgba(255,255,255,.1);
    border: 1px solid rgba(255,255,255,.12);
  }

  .limit-grid span {
    display: block;
    margin-bottom: 5px;
    color: rgba(255,255,255,.65);
    font-size: 9px;
  }

  .limit-grid strong {
    color: #fff;
    font-size: 19px;
  }

  .feature-section {
    margin-top: 22px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,.16);
  }

  .feature-section h3 {
    margin: 0 0 12px;
    color: #fff;
    font-size: 15px;
  }

  .feature-list {
    display: grid;
    grid-template-columns: repeat(2,1fr);
    gap: 7px;
  }

  .feature-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 10px 11px;
    border-radius: 9px;
    background: rgba(255,255,255,.08);
  }

  .feature-row span {
    color: rgba(255,255,255,.86);
    font-size: 10px;
  }

  .enabled {
    color: #258552 !important;
  }

  .disabled {
    color: #9aa3b2 !important;
  }

  .feature-row .enabled {
    color: #d7ffe4 !important;
    font-size: 9px;
  }

  .feature-row .disabled {
    color: rgba(255,255,255,.5) !important;
    font-size: 9px;
  }

  .empty-feature {
    padding: 12px;
    border-radius: 10px;
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.7);
    font-size: 10px;
  }

  .plans-section {
    margin-top: 28px;
  }

  .section-head {
    margin-bottom: 14px;
  }

  .section-head h2 {
    margin: 0;
    color: #202b40;
    font-size: 23px;
  }

  .plans-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 15px;
  }

  .plan-card {
    padding: 20px;
    border: 1px solid #e0e5ed;
    border-radius: 17px;
    background: #fff;
    box-shadow: 0 7px 20px rgba(22,31,54,.04);
  }

  .plan-card.current {
    border: 2px solid #596bd2;
    padding: 19px;
    box-shadow: 0 10px 24px rgba(77,99,210,.1);
  }

  .plan-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }

  .plan-head h3 {
    margin: 0;
    color: #202b40;
    font-size: 19px;
  }

  .plan-head p {
    margin: 6px 0 0;
    color: #778195;
    font-size: 10px;
    line-height: 1.5;
  }

  .current-badge {
    padding: 6px 8px;
    border-radius: 999px;
    background: #eef1ff;
    color: #4e62ca;
    font-size: 8px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .plan-limits {
    display: grid;
    gap: 7px;
    margin-top: 17px;
  }

  .plan-limits > div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 9px;
    background: #f7f8fb;
  }

  .plan-limits span {
    color: #7c8798;
    font-size: 9px;
  }

  .plan-limits strong {
    color: #354057;
    font-size: 10px;
  }

  .plan-features {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #edf0f4;
  }

  .plan-feature {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 0;
    color: #5f6b7f;
    font-size: 9px;
  }

  .plan-note {
    margin-top: 13px;
    padding: 11px;
    border-radius: 10px;
    background: #f7f8fb;
    border: 1px dashed #d9dfe8;
  }

  .plan-note strong {
    color: #344057;
    font-size: 10px;
  }

  .plan-note p {
    margin: 4px 0 0;
    color: #818b9b;
    font-size: 9px;
    line-height: 1.45;
  }

  .empty-card,
  .state-card {
    border: 1px solid #e0e5ed;
    border-radius: 17px;
    background: #fff;
    padding: 35px;
    text-align: center;
    color: #748096;
  }

  .state-card {
    max-width: 430px;
    margin: 100px auto;
  }

  .state-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: #eef1ff;
    color: #5166cf;
    font-weight: 800;
  }

  .state-card h2 {
    margin: 0 0 5px;
    color: #263148;
    font-size: 19px;
  }

  .state-card p {
    margin: 0;
    color: #798396;
    font-size: 11px;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 22px;
    padding: 16px 2px 0;
    border-top: 1px solid #e1e6ef;
    color: #8a94a5;
    font-size: 9px;
  }

  @media (max-width: 850px) {
    .plans-grid {
      grid-template-columns: 1fr;
    }

    .feature-list {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 650px) {
    .sub-page {
      padding: 15px;
    }

    .topbar,
    .current-top,
    .footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .refresh-btn {
      width: 100%;
    }

    .limit-grid {
      grid-template-columns: 1fr;
    }
  }
`;
export default Subscription;