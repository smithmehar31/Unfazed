import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function ClientPortal() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [client, setClient] = useState(null);
  const [therapist, setTherapist] = useState(null);

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [presentingConcern, setPresentingConcern] = useState("");
  const [history, setHistory] = useState("");

  const [consentAccepted, setConsentAccepted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      setError("This client portal link is missing its access token.");
      setLoading(false);
      return;
    }

    fetchPortalData();
  }, [token]);

  async function fetchPortalData() {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(
        "/clients/portal/client",
        {
          params: {
            token,
          },
        }
      );

      if (response.data.success) {
        const portalClient = response.data.client;

        setClient(portalClient);
        setTherapist(response.data.therapist);

        setAge(
          portalClient.intake?.demographics?.age ?? ""
        );

        setGender(
          portalClient.intake?.demographics?.gender || ""
        );

        setOccupation(
          portalClient.intake?.demographics?.occupation || ""
        );

        setPresentingConcern(
          portalClient.intake?.presenting_concern || ""
        );

        setHistory(
          portalClient.intake?.history || ""
        );

        setConsentAccepted(
          portalClient.consent?.accepted || false
        );
      }
    } catch (error) {
      console.error("Portal load error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load the client portal."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!consentAccepted) {
      setError(
        "Please accept the consent checkbox before submitting."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await axiosInstance.post(
        "/clients/portal/intake",
        {
          token,
          demographics: {
            age:
              age === ""
                ? undefined
                : Number(age),
            gender: gender.trim(),
            occupation: occupation.trim(),
          },
          presenting_concern:
            presentingConcern.trim(),
          history: history.trim(),
          consent_accepted: true,
        }
      );

      if (response.data.success) {
        setClient((currentClient) => ({
          ...currentClient,
          intake: response.data.client.intake,
          consent: response.data.client.consent,
        }));

        setSuccess(
          response.data.message ||
            "Your intake and consent have been submitted successfully."
        );

        setConsentAccepted(true);
      }
    } catch (error) {
      console.error("Portal submit error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to submit your intake information."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <p style={styles.loadingText}>
            Loading your client portal...
          </p>
        </div>
      </div>
    );
  }

  if (!token || error && !client) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>

          <h2 style={styles.errorTitle}>
            Client portal unavailable
          </h2>

          <p style={styles.errorText}>
            {error || "Unable to open this portal link."}
          </p>

          <p style={styles.helpText}>
            Please contact your therapist if you received this
            link incorrectly or it has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.brand}>Unfazed</div>

          <div style={styles.therapistInfo}>
            <span>Therapist</span>
            <strong>{therapist?.name}</strong>
          </div>
        </header>

        <section style={styles.hero}>
          <p style={styles.smallLabel}>CLIENT PORTAL</p>

          <h1 style={styles.title}>
            Welcome, {client?.name}
          </h1>

          <p style={styles.subtitle}>
            Please complete your intake information and consent
            before your session.
          </p>
        </section>

        {success && (
          <div style={styles.successBanner}>
            <div style={styles.successIcon}>✓</div>

            <div>
              <strong style={styles.successTitle}>
                Submitted successfully
              </strong>

              <p style={styles.successText}>
                {success}
              </p>
            </div>
          </div>
        )}

        {error && client && (
          <div style={styles.errorBanner}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <p style={styles.sectionLabel}>
                01
              </p>

              <div>
                <h2 style={styles.sectionTitle}>
                  About you
                </h2>

                <p style={styles.sectionDescription}>
                  Provide some basic information.
                </p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Full Name
                </label>

                <input
                  type="text"
                  value={client?.name || ""}
                  disabled
                  style={styles.disabledInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Email
                </label>

                <input
                  type="email"
                  value={client?.email || ""}
                  disabled
                  style={styles.disabledInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Age
                </label>

                <input
                  type="number"
                  min="0"
                  value={age}
                  onChange={(event) =>
                    setAge(event.target.value)
                  }
                  placeholder="Your age"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Gender
                </label>

                <input
                  type="text"
                  value={gender}
                  onChange={(event) =>
                    setGender(event.target.value)
                  }
                  placeholder="Gender"
                  style={styles.input}
                />
              </div>

              <div
                style={{
                  ...styles.formGroup,
                  gridColumn: "1 / -1",
                }}
              >
                <label style={styles.label}>
                  Occupation
                </label>

                <input
                  type="text"
                  value={occupation}
                  onChange={(event) =>
                    setOccupation(event.target.value)
                  }
                  placeholder="Occupation"
                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <p style={styles.sectionLabel}>
                02
              </p>

              <div>
                <h2 style={styles.sectionTitle}>
                  Your intake
                </h2>

                <p style={styles.sectionDescription}>
                  Help your therapist understand what brings
                  you to the session.
                </p>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Presenting Concern
              </label>

              <textarea
                value={presentingConcern}
                onChange={(event) =>
                  setPresentingConcern(
                    event.target.value
                  )
                }
                placeholder="Please describe what you would like support with..."
                rows={6}
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Relevant History
              </label>

              <textarea
                value={history}
                onChange={(event) =>
                  setHistory(event.target.value)
                }
                placeholder="Share any relevant background or history..."
                rows={7}
                style={styles.textarea}
              />
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <p style={styles.sectionLabel}>
                03
              </p>

              <div>
                <h2 style={styles.sectionTitle}>
                  Consent
                </h2>

                <p style={styles.sectionDescription}>
                  Review and confirm your consent before submitting.
                </p>
              </div>
            </div>

            <label style={styles.consentBox}>
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(event) =>
                  setConsentAccepted(
                    event.target.checked
                  )
                }
                style={styles.checkbox}
              />

              <span style={styles.consentText}>
                I confirm that the information I have provided is
                accurate to the best of my knowledge, and I consent
                to sharing this intake information with my therapist
                for the purpose of my session and practice management.
              </span>
            </label>

            {client?.consent?.accepted &&
              client?.consent?.accepted_at && (
                <p style={styles.previousConsent}>
                  Consent previously recorded on{" "}
                  {new Date(
                    client.consent.accepted_at
                  ).toLocaleString()}
                </p>
              )}
          </section>

          <div style={styles.submitArea}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.submitButton,
                ...(submitting
                  ? styles.submitButtonDisabled
                  : {}),
              }}
            >
              {submitting
                ? "Submitting..."
                : "Submit Intake & Consent"}
            </button>

            <p style={styles.footerNote}>
              Your information will be shared with{" "}
              <strong>{therapist?.name}</strong>.
            </p>
          </div>
        </form>

        <footer style={styles.footer}>
          <p>Powered by Unfazed</p>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    padding: "28px 18px 60px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "820px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    paddingBottom: "20px",
    borderBottom: "1px solid #e4e8ef",
  },

  brand: {
    color: "#4d63d2",
    fontSize: "22px",
    fontWeight: "800",
  },

  therapistInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
    fontSize: "11px",
    color: "#7a8496",
  },

  hero: {
    padding: "35px 0 24px",
  },

  smallLabel: {
    margin: "0 0 7px",
    color: "#778297",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.4px",
  },

  title: {
    margin: "0",
    color: "#172033",
    fontSize: "32px",
    lineHeight: "1.2",
  },

  subtitle: {
    margin: "9px 0 0",
    maxWidth: "670px",
    color: "#6c7688",
    fontSize: "14px",
    lineHeight: "1.65",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "18px",
    padding: "25px",
    marginBottom: "18px",
    boxShadow: "0 8px 24px rgba(23,32,51,0.04)",
  },

  sectionHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "21px",
  },

  sectionLabel: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    background: "#eef1ff",
    color: "#4d63d2",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "11px",
    fontWeight: "800",
    margin: "0",
    flexShrink: 0,
  },

  sectionTitle: {
    margin: "0",
    color: "#202b3f",
    fontSize: "20px",
  },

  sectionDescription: {
    margin: "4px 0 0",
    color: "#7a8495",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  formGroup: {
    marginBottom: "5px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#3c475b",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d6dde8",
    borderRadius: "10px",
    padding: "11px 12px",
    fontSize: "14px",
    color: "#172033",
    background: "#ffffff",
    outline: "none",
  },

  disabledInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e0e4eb",
    borderRadius: "10px",
    padding: "11px 12px",
    fontSize: "14px",
    color: "#7a8495",
    background: "#f6f7f9",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d6dde8",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "14px",
    color: "#172033",
    background: "#ffffff",
    outline: "none",
    resize: "vertical",
    lineHeight: "1.6",
  },

  consentBox: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    background: "#f7f8fb",
    border: "1px solid #e2e6ed",
    borderRadius: "12px",
    padding: "15px",
    cursor: "pointer",
  },

  checkbox: {
    width: "18px",
    height: "18px",
    marginTop: "2px",
    flexShrink: 0,
    cursor: "pointer",
  },

  consentText: {
    color: "#59657a",
    fontSize: "13px",
    lineHeight: "1.65",
  },

  previousConsent: {
    margin: "12px 0 0",
    color: "#3c7b4e",
    fontSize: "12px",
  },

  submitArea: {
    textAlign: "center",
    padding: "4px 0 10px",
  },

  submitButton: {
    border: "none",
    borderRadius: "11px",
    background: "#4d63d2",
    color: "#ffffff",
    padding: "14px 24px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  submitButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  footerNote: {
    margin: "10px 0 0",
    color: "#7c8697",
    fontSize: "11px",
  },

  successBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "#edf9f1",
    border: "1px solid #c4e5cc",
    borderRadius: "13px",
    padding: "14px",
    marginBottom: "18px",
  },

  successIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#2f9754",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "800",
    flexShrink: 0,
  },

  successTitle: {
    color: "#2f7044",
    fontSize: "14px",
  },

  successText: {
    margin: "4px 0 0",
    color: "#4d775a",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  errorBanner: {
    background: "#fff1f1",
    border: "1px solid #edcaca",
    color: "#9a3737",
    borderRadius: "12px",
    padding: "13px 15px",
    marginBottom: "18px",
    fontSize: "13px",
  },

  loadingCard: {
    maxWidth: "450px",
    margin: "100px auto",
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "18px",
    padding: "35px",
    textAlign: "center",
  },

  loadingText: {
    margin: "0",
    color: "#6f798b",
  },

  errorCard: {
    maxWidth: "500px",
    margin: "100px auto",
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "18px",
    padding: "35px",
    textAlign: "center",
  },

  errorIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    background: "#fff0f0",
    color: "#b33d3d",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 12px",
    fontWeight: "800",
  },

  errorTitle: {
    margin: "0 0 8px",
    color: "#29354b",
    fontSize: "20px",
  },

  errorText: {
    margin: "0",
    color: "#6f798b",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  helpText: {
    margin: "12px 0 0",
    color: "#8a93a2",
    fontSize: "12px",
    lineHeight: "1.6",
  },

  footer: {
    textAlign: "center",
    color: "#9098a6",
    fontSize: "11px",
    paddingTop: "18px",
  },
};

export default ClientPortal;