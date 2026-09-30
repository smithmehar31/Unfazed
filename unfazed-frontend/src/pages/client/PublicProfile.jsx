import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import axiosInstance from "../../api/axiosInstance";

function PublicProfile() {
  const { slug } = useParams();

  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTherapist = async () => {
      try {
        const response = await axiosInstance.get(
          `/therapists/${slug}`
        );

        setTherapist(response.data.therapist);
      } catch (error) {
        console.error("Failed to load therapist profile:", error);

        setError(
          error.response?.data?.message ||
            "Therapist profile not found"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTherapist();
  }, [slug]);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>
          Loading therapist profile...
        </p>
      </div>
    );
  }

  if (error || !therapist) {
    return (
      <div style={styles.center}>
        <div style={styles.errorCard}>
          <h1 style={styles.errorTitle}>Profile Not Found</h1>
          <p style={styles.errorText}>
            {error || "This therapist profile does not exist."}
          </p>
        </div>
      </div>
    );
  }

  const firstLetter =
    therapist.name?.charAt(0).toUpperCase() || "T";

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>UNFAZED</div>

          <div style={styles.headerRight}>
            <span style={styles.headerBadge}>
              Therapist Profile
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main>
        {/* Hero */}
        <section style={styles.heroSection}>
          <div style={styles.heroInner}>
            <div style={styles.avatarLarge}>
              {firstLetter}
            </div>

            <div style={styles.heroContent}>
              <span style={styles.eyebrow}>
                PROFESSIONAL THERAPIST
              </span>

              <h1 style={styles.name}>
                {therapist.name}
              </h1>

              <p style={styles.heroBio}>
                {therapist.bio ||
                  "Professional therapist dedicated to helping clients improve their wellbeing."}
              </p>

              <div style={styles.heroActions}>
                <button style={styles.primaryButton}>
                  Book a Session
                </button>

                <span style={styles.availableText}>
                  Professional consultation
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Content */}
        <div style={styles.contentContainer}>
          {/* About */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionNumber}>01</span>
              <h2 style={styles.sectionTitle}>About</h2>
            </div>

            <div style={styles.aboutCard}>
              <p style={styles.description}>
                {therapist.bio ||
                  "No information has been added yet."}
              </p>
            </div>
          </section>

          {/* Specializations */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionNumber}>02</span>
              <h2 style={styles.sectionTitle}>
                Specializations
              </h2>
            </div>

            {therapist.specializations?.length > 0 ? (
              <div style={styles.tagsGrid}>
                {therapist.specializations.map((item) => (
                  <div
                    key={item}
                    style={styles.tagCard}
                  >
                    <span style={styles.tagDot}></span>
                    <span style={styles.tagText}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.muted}>
                No specializations listed.
              </p>
            )}
          </section>

          {/* Languages */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionNumber}>03</span>
              <h2 style={styles.sectionTitle}>Languages</h2>
            </div>

            {therapist.languages?.length > 0 ? (
              <div style={styles.tagsGrid}>
                {therapist.languages.map((item) => (
                  <div
                    key={item}
                    style={styles.tagCard}
                  >
                    <span style={styles.tagText}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.muted}>
                No languages listed.
              </p>
            )}
          </section>

          {/* Services */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionNumber}>04</span>
              <h2 style={styles.sectionTitle}>Services</h2>
            </div>

            <div style={styles.serviceCard}>
              <div style={styles.serviceInfo}>
                <span style={styles.serviceLabel}>
                  THERAPY
                </span>

                <h3 style={styles.serviceTitle}>
                  Therapy Session
                </h3>

                <p style={styles.serviceDescription}>
                  Book a professional therapy session with{" "}
                  {therapist.name}.
                </p>

                <div style={styles.serviceMeta}>
                  <span>Professional Session</span>
                  <span>•</span>
                  <span>Online Booking</span>
                </div>
              </div>

              <button style={styles.primaryButton}>
                View Availability
              </button>
            </div>
          </section>

          {/* CTA */}
          <section style={styles.ctaSection}>
            <div>
              <span style={styles.ctaEyebrow}>
                READY TO GET STARTED?
              </span>

              <h2 style={styles.ctaTitle}>
                Take the next step toward better wellbeing.
              </h2>
            </div>

            <button style={styles.ctaButton}>
              Book a Session
            </button>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div>
            <div style={styles.footerBrand}>UNFAZED</div>

            <p style={styles.footerText}>
              Practice management made simple.
            </p>
          </div>

          <div style={styles.footerRight}>
            <p style={styles.footerPowered}>
              Powered by <strong>Unfazed</strong>
            </p>

            <p style={styles.footerSlug}>
              unfazed.in/{therapist.slug}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f8fafc",
  },

  loader: {
    width: "34px",
    height: "34px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #0f172a",
    borderRadius: "50%",
    marginBottom: "16px",
  },

  loadingText: {
    color: "#64748b",
    fontSize: "15px",
  },

  errorCard: {
    maxWidth: "500px",
    width: "100%",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "40px",
    textAlign: "center",
    boxSizing: "border-box",
  },

  errorTitle: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "30px",
  },

  errorText: {
    margin: 0,
    color: "#64748b",
    lineHeight: "1.6",
  },

  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },

  headerInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box",
  },

  logo: {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "800",
    letterSpacing: "3px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
  },

  headerBadge: {
    color: "#475569",
    background: "#f1f5f9",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
  },

  heroSection: {
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },

  heroInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "80px 24px",
    display: "flex",
    alignItems: "center",
    gap: "42px",
    boxSizing: "border-box",
  },

  avatarLarge: {
    width: "130px",
    height: "130px",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0f172a",
    fontSize: "52px",
    fontWeight: "700",
    flexShrink: 0,
  },

  heroContent: {
    maxWidth: "720px",
  },

  eyebrow: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "2px",
  },

  name: {
    margin: "10px 0 16px",
    color: "#0f172a",
    fontSize: "48px",
    lineHeight: "1.08",
    fontWeight: "800",
  },

  heroBio: {
    margin: "0 0 26px",
    color: "#475569",
    fontSize: "18px",
    lineHeight: "1.75",
  },

  heroActions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  primaryButton: {
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "9px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  availableText: {
    color: "#64748b",
    fontSize: "13px",
  },

  contentContainer: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "45px 24px",
    boxSizing: "border-box",
  },

  section: {
    marginBottom: "48px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  sectionNumber: {
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "27px",
    fontWeight: "750",
  },

  aboutCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
  },

  description: {
    margin: 0,
    color: "#475569",
    lineHeight: "1.8",
    fontSize: "16px",
  },

  tagsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },

  tagCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  tagDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#0f172a",
  },

  tagText: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: "500",
  },

  muted: {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
  },

  serviceCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "26px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    boxSizing: "border-box",
  },

  serviceInfo: {
    maxWidth: "700px",
  },

  serviceLabel: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",
  },

  serviceTitle: {
    margin: "8px 0 8px",
    color: "#0f172a",
    fontSize: "21px",
  },

  serviceDescription: {
    margin: "0 0 12px",
    color: "#64748b",
    lineHeight: "1.6",
  },

  serviceMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    color: "#94a3b8",
    fontSize: "12px",
  },

  ctaSection: {
    marginTop: "10px",
    background: "#0f172a",
    color: "#ffffff",
    borderRadius: "18px",
    padding: "34px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    boxSizing: "border-box",
  },

  ctaEyebrow: {
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",
  },

  ctaTitle: {
    margin: "8px 0 0",
    maxWidth: "620px",
    color: "#ffffff",
    fontSize: "24px",
    lineHeight: "1.4",
  },

  ctaButton: {
    border: "none",
    background: "#ffffff",
    color: "#0f172a",
    padding: "12px 20px",
    borderRadius: "9px",
    fontWeight: "700",
    cursor: "pointer",
    flexShrink: 0,
  },

  footer: {
    marginTop: "20px",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
  },

  footerInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "28px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    boxSizing: "border-box",
  },

  footerBrand: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "800",
    letterSpacing: "2px",
  },

  footerText: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  footerRight: {
    textAlign: "right",
  },

  footerPowered: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  footerSlug: {
    margin: "5px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
  },
};

export default PublicProfile;