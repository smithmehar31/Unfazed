import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function PublicProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTherapist();
  }, [slug]);

  async function fetchTherapist() {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(`/therapists/${slug}`);

      if (response.data.success) {
        setTherapist(response.data.therapist);
      } else {
        setError("Therapist profile not found.");
      }
    } catch (error) {
      console.error("Public profile error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load therapist profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleBooking() {
    navigate(`/book/${slug}`);
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <p style={styles.loadingText}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !therapist) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Profile not found</h2>

          <p style={styles.errorText}>
            {error || "This therapist profile does not exist."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            style={styles.primaryButton}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>Unfazed</div>
        </header>

        <section style={styles.hero}>
          <div style={styles.avatar}>
            {therapist.name?.charAt(0)?.toUpperCase() || "T"}
          </div>

          <div style={styles.heroContent}>
            <p style={styles.smallLabel}>THERAPIST</p>

            <h1 style={styles.name}>{therapist.name}</h1>

            <p style={styles.heroBio}>
              {therapist.bio ||
                "Professional therapist providing a safe and supportive space for clients."}
            </p>

            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={handleBooking}
                style={styles.primaryButton}
              >
                Book a Session
              </button>

              <button
                type="button"
                onClick={handleBooking}
                style={styles.secondaryButton}
              >
                View Availability
              </button>
            </div>
          </div>
        </section>

        <section style={styles.contentGrid}>
          <div style={styles.mainColumn}>
            <div style={styles.card}>
              <p style={styles.sectionLabel}>ABOUT</p>

              <h2 style={styles.sectionTitle}>About {therapist.name}</h2>

              <p style={styles.bodyText}>
                {therapist.bio ||
                  "This therapist has not added an introduction yet."}
              </p>
            </div>

            <div style={styles.card}>
              <p style={styles.sectionLabel}>SPECIALIZATIONS</p>

              <h2 style={styles.sectionTitle}>
                Areas of specialization
              </h2>

              {therapist.specializations?.length > 0 ? (
                <div style={styles.tags}>
                  {therapist.specializations.map((item, index) => (
                    <span key={index} style={styles.tag}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={styles.mutedText}>
                  No specializations added yet.
                </p>
              )}
            </div>

            <div style={styles.card}>
              <p style={styles.sectionLabel}>LANGUAGES</p>

              <h2 style={styles.sectionTitle}>Languages</h2>

              {therapist.languages?.length > 0 ? (
                <div style={styles.tags}>
                  {therapist.languages.map((language, index) => (
                    <span key={index} style={styles.languageTag}>
                      {language}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={styles.mutedText}>
                  No languages added yet.
                </p>
              )}
            </div>
          </div>

          <aside style={styles.sideColumn}>
            <div style={styles.serviceCard}>
              <p style={styles.sectionLabel}>SERVICES</p>

              <h2 style={styles.serviceTitle}>Therapy Session</h2>

              <p style={styles.serviceDescription}>
                Schedule a one-to-one session at a time that works for
                you.
              </p>

              <div style={styles.serviceInfo}>
                <div style={styles.infoRow}>
                  <span>Session types</span>
                  <strong>30 / 45 / 60 / 90 min</strong>
                </div>

                <div style={styles.infoRow}>
                  <span>Booking</span>
                  <strong>Instant confirmation</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBooking}
                style={styles.fullButton}
              >
                Check Availability
              </button>
            </div>
          </aside>
        </section>

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
  },

  container: {
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "0 20px 50px",
  },

  header: {
    height: "78px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #e6eaf0",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#4d63d2",
    letterSpacing: "-0.5px",
  },

  hero: {
    marginTop: "35px",
    background: "#ffffff",
    border: "1px solid #e3e8f0",
    borderRadius: "22px",
    padding: "38px",
    display: "flex",
    gap: "25px",
    alignItems: "center",
    boxShadow: "0 12px 35px rgba(23, 32, 51, 0.06)",
  },

  avatar: {
    width: "92px",
    height: "92px",
    borderRadius: "25px",
    background: "#e9edff",
    color: "#4d63d2",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "36px",
    fontWeight: "800",
    flexShrink: 0,
  },

  heroContent: {
    flex: 1,
  },

  smallLabel: {
    margin: "0 0 7px",
    color: "#738097",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.5px",
  },

  name: {
    margin: "0",
    fontSize: "36px",
    lineHeight: "1.15",
    color: "#172033",
  },

  heroBio: {
    margin: "12px 0 0",
    color: "#667085",
    fontSize: "15px",
    lineHeight: "1.65",
    maxWidth: "720px",
  },

  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "22px",
    flexWrap: "wrap",
  },

  primaryButton: {
    border: "none",
    borderRadius: "11px",
    background: "#4d63d2",
    color: "#ffffff",
    padding: "13px 20px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #d7deea",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#354158",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.8fr",
    gap: "22px",
    marginTop: "22px",
    alignItems: "start",
  },

  mainColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  sideColumn: {
    position: "sticky",
    top: "20px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e3e8f0",
    borderRadius: "18px",
    padding: "27px",
    boxShadow: "0 8px 24px rgba(23, 32, 51, 0.04)",
  },

  sectionLabel: {
    margin: "0 0 6px",
    color: "#768197",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.3px",
  },

  sectionTitle: {
    margin: "0 0 14px",
    fontSize: "21px",
    color: "#202b3f",
  },

  bodyText: {
    margin: "0",
    color: "#657084",
    fontSize: "14px",
    lineHeight: "1.75",
  },

  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
  },

  tag: {
    background: "#eef1ff",
    color: "#4d5fbe",
    borderRadius: "30px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "600",
  },

  languageTag: {
    background: "#f1f4f8",
    color: "#566176",
    borderRadius: "30px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "600",
  },

  mutedText: {
    margin: "0",
    color: "#8992a1",
    fontSize: "14px",
  },

  serviceCard: {
    background: "#ffffff",
    border: "1px solid #e3e8f0",
    borderRadius: "18px",
    padding: "27px",
    boxShadow: "0 8px 24px rgba(23, 32, 51, 0.04)",
  },

  serviceTitle: {
    margin: "0 0 8px",
    fontSize: "21px",
    color: "#202b3f",
  },

  serviceDescription: {
    margin: "0",
    color: "#687387",
    fontSize: "14px",
    lineHeight: "1.65",
  },

  serviceInfo: {
    marginTop: "20px",
    borderTop: "1px solid #edf0f4",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "12px 0",
    borderBottom: "1px solid #edf0f4",
    fontSize: "12px",
    color: "#707b8f",
  },

  fullButton: {
    width: "100%",
    border: "none",
    borderRadius: "11px",
    background: "#4d63d2",
    color: "#ffffff",
    padding: "13px",
    marginTop: "20px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  loadingCard: {
    maxWidth: "500px",
    margin: "100px auto",
    padding: "35px",
    background: "#ffffff",
    border: "1px solid #e3e8f0",
    borderRadius: "18px",
    textAlign: "center",
  },

  loadingText: {
    margin: "0",
    color: "#687387",
  },

  errorCard: {
    maxWidth: "500px",
    margin: "100px auto",
    padding: "35px",
    background: "#ffffff",
    border: "1px solid #e3e8f0",
    borderRadius: "18px",
    textAlign: "center",
  },

  errorTitle: {
    margin: "0 0 10px",
    color: "#202b3f",
  },

  errorText: {
    margin: "0 0 20px",
    color: "#6d7789",
  },

  footer: {
    padding: "35px 0 0",
    textAlign: "center",
    color: "#8a93a2",
    fontSize: "12px",
  },
};

export default PublicProfile;