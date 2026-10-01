import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/therapists/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setTherapist(response.data.therapist);
      }
    } catch (error) {
      console.error("Dashboard profile error:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <p style={styles.loadingText}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>
            Unable to load dashboard
          </h2>

          <p style={styles.errorText}>{error}</p>

          <button
            type="button"
            onClick={fetchProfile}
            style={styles.primaryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.brand}>Unfazed</div>

            <p style={styles.headerSubtitle}>
              Therapist Practice Dashboard
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </header>

        <section style={styles.welcomeSection}>
          <div>
            <p style={styles.smallLabel}>DASHBOARD</p>

            <h1 style={styles.title}>
              Welcome, {therapist?.name}
            </h1>

            <p style={styles.subtitle}>
              Manage your practice, clients, schedule and public
              profile from one place.
            </p>
          </div>
        </section>

        <div style={styles.quickGrid}>
          <button
            type="button"
            onClick={() => navigate("/schedule")}
            style={styles.quickCard}
          >
            <div style={styles.quickIcon}>📅</div>

            <div>
              <h3 style={styles.quickTitle}>Schedule</h3>

              <p style={styles.quickText}>
                Manage availability and appointments.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/clients")}
            style={styles.quickCard}
          >
            <div style={styles.quickIcon}>👥</div>

            <div>
              <h3 style={styles.quickTitle}>Clients</h3>

              <p style={styles.quickText}>
                Manage clients, intake and consent.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={styles.quickCard}
          >
            <div style={styles.quickIcon}>👤</div>

            <div>
              <h3 style={styles.quickTitle}>Profile</h3>

              <p style={styles.quickText}>
                Update your professional information.
              </p>
            </div>
          </button>
        </div>

        <div style={styles.mainGrid}>
          <section style={styles.card}>
            <p style={styles.sectionLabel}>THERAPIST PROFILE</p>

            <h2 style={styles.cardTitle}>
              {therapist?.name}
            </h2>

            <div style={styles.infoList}>
              <div style={styles.infoRow}>
                <span>Email</span>

                <strong>{therapist?.email}</strong>
              </div>

              <div style={styles.infoRow}>
                <span>Public Slug</span>

                <strong>/{therapist?.slug}</strong>
              </div>

              <div style={styles.infoRow}>
                <span>Timezone</span>

                <strong>
                  {therapist?.timezone || "Asia/Kolkata"}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              style={styles.outlineButton}
            >
              Edit Profile
            </button>
          </section>

          <section style={styles.card}>
            <p style={styles.sectionLabel}>PRACTICE</p>

            <h2 style={styles.cardTitle}>
              Manage your practice
            </h2>

            <p style={styles.cardText}>
              Keep your availability up to date and manage the
              clients associated with your practice.
            </p>

            <div style={styles.actionStack}>
              <button
                type="button"
                onClick={() => navigate("/schedule")}
                style={styles.actionButton}
              >
                Manage Schedule
              </button>

              <button
                type="button"
                onClick={() => navigate("/clients")}
                style={styles.actionButton}
              >
                Manage Clients
              </button>
            </div>
          </section>
        </div>

        <section style={styles.publicCard}>
          <div style={styles.publicContent}>
            <p style={styles.sectionLabel}>BRANDED PROFILE</p>

            <h2 style={styles.publicTitle}>
              Your public profile
            </h2>

            <p style={styles.publicText}>
              Share this branded link with clients so they can
              view your profile and book a session.
            </p>

            <div style={styles.linkBox}>
              <span>
                {window.location.origin}/{therapist?.slug}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(`/${therapist?.slug}`)
            }
            style={styles.primaryButton}
          >
            View Public Profile
          </button>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    padding: "30px 18px 60px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    paddingBottom: "22px",
    borderBottom: "1px solid #e4e8ef",
  },

  brand: {
    color: "#4d63d2",
    fontSize: "23px",
    fontWeight: "800",
  },

  headerSubtitle: {
    margin: "4px 0 0",
    color: "#7b8495",
    fontSize: "12px",
  },

  logoutButton: {
    border: "1px solid #d5dbe7",
    background: "#ffffff",
    color: "#525f75",
    borderRadius: "10px",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  welcomeSection: {
    padding: "35px 0 25px",
  },

  smallLabel: {
    margin: "0 0 7px",
    color: "#778196",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.4px",
  },

  title: {
    margin: "0",
    fontSize: "32px",
    color: "#172033",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6d7788",
    fontSize: "14px",
    lineHeight: "1.6",
    maxWidth: "700px",
  },

  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
    marginBottom: "20px",
  },

  quickCard: {
    border: "1px solid #e1e6ef",
    borderRadius: "16px",
    background: "#ffffff",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 7px 20px rgba(23, 32, 51, 0.04)",
  },

  quickIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "13px",
    background: "#eef1ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },

  quickTitle: {
    margin: "0 0 4px",
    color: "#273248",
    fontSize: "15px",
  },

  quickText: {
    margin: "0",
    color: "#7a8495",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 7px 20px rgba(23, 32, 51, 0.04)",
  },

  sectionLabel: {
    margin: "0 0 6px",
    color: "#788397",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.2px",
  },

  cardTitle: {
    margin: "0",
    color: "#202b3f",
    fontSize: "21px",
  },

  infoList: {
    marginTop: "18px",
    borderTop: "1px solid #edf0f4",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "12px 0",
    borderBottom: "1px solid #edf0f4",
    color: "#727d90",
    fontSize: "12px",
  },

  outlineButton: {
    marginTop: "18px",
    border: "1px solid #4d63d2",
    background: "#ffffff",
    color: "#4d63d2",
    borderRadius: "10px",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  cardText: {
    margin: "10px 0 0",
    color: "#6f798b",
    fontSize: "13px",
    lineHeight: "1.7",
  },

  actionStack: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },

  actionButton: {
    border: "none",
    background: "#4d63d2",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "11px 15px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  publicCard: {
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "18px",
    padding: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "25px",
    boxShadow: "0 7px 20px rgba(23, 32, 51, 0.04)",
  },

  publicContent: {
    flex: 1,
  },

  publicTitle: {
    margin: "0",
    fontSize: "22px",
    color: "#202b3f",
  },

  publicText: {
    margin: "8px 0 14px",
    color: "#6f798b",
    fontSize: "13px",
    lineHeight: "1.6",
    maxWidth: "700px",
  },

  linkBox: {
    display: "inline-block",
    background: "#f6f7fa",
    border: "1px solid #e5e8ee",
    borderRadius: "9px",
    padding: "9px 12px",
    color: "#4d5870",
    fontSize: "12px",
  },

  primaryButton: {
    border: "none",
    borderRadius: "10px",
    background: "#4d63d2",
    color: "#ffffff",
    padding: "12px 17px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    flexShrink: 0,
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
    color: "#6d7789",
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

  errorTitle: {
    margin: "0 0 8px",
    color: "#273248",
  },

  errorText: {
    margin: "0 0 20px",
    color: "#707a8c",
  },
};

export default Dashboard;