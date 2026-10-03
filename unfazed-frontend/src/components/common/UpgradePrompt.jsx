function UpgradePrompt({
  featureName = "This feature",
  currentPlan = "your current plan",
  message,
  compact = false,
}) {
  const defaultMessage =
    "This feature is not available on your current plan. Upgrade your subscription to access it.";

  return (
    <div
      style={{
        ...styles.container,
        ...(compact
          ? styles.compactContainer
          : {}),
      }}
      role="status"
    >
      <div
        style={{
          ...styles.icon,
          ...(compact
            ? styles.compactIcon
            : {}),
        }}
      >
        🔒
      </div>

      <div style={styles.content}>
        <div style={styles.titleRow}>
          <h3
            style={{
              ...styles.title,
              ...(compact
                ? styles.compactTitle
                : {}),
            }}
          >
            Upgrade required
          </h3>

          {!compact && (
            <span style={styles.badge}>
              {currentPlan}
            </span>
          )}
        </div>

        <p
          style={{
            ...styles.featureText,
            ...(compact
              ? styles.compactFeatureText
              : {}),
          }}
        >
          {featureName}
        </p>

        <p
          style={{
            ...styles.message,
            ...(compact
              ? styles.compactMessage
              : {}),
          }}
        >
          {message || defaultMessage}
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/subscription";
            }}
            style={{
              ...styles.primaryButton,
              ...(compact
                ? styles.compactButton
                : {}),
            }}
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    width: "100%",
    boxSizing: "border-box",
    padding: "20px",
    borderRadius: "16px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    boxShadow:
      "0 6px 24px rgba(15, 23, 42, 0.06)",
  },

  compactContainer: {
    padding: "14px",
    gap: "12px",
    borderRadius: "12px",
  },

  icon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    fontSize: "20px",
  },

  compactIcon: {
    width: "34px",
    height: "34px",
    minWidth: "34px",
    borderRadius: "9px",
    fontSize: "16px",
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "6px",
  },

  title: {
    margin: "0",
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  compactTitle: {
    fontSize: "15px",
  },

  badge: {
    flexShrink: 0,
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "capitalize",
  },

  featureText: {
    margin: "0 0 7px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },

  compactFeatureText: {
    fontSize: "13px",
  },

  message: {
    margin: "0",
    maxWidth: "720px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  compactMessage: {
    fontSize: "13px",
  },

  actions: {
    marginTop: "14px",
  },

  primaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  compactButton: {
    padding: "8px 12px",
    fontSize: "12px",
    borderRadius: "8px",
  },
};

export default UpgradePrompt;