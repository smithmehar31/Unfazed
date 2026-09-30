import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const [therapist, setTherapist] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get("/therapists/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTherapist(response.data.therapist);
      } catch (error) {
        console.error("Failed to load therapist profile:", error);

        if (error.response?.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        setError(
          error.response?.data?.message ||
            "Failed to load therapist profile"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
      navigate("/login");
    }
  }, [token, navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.brand}>UNFAZED</p>
          <h1 style={styles.title}>
            Welcome, {therapist?.name || "Therapist"}
          </h1>
          <p style={styles.subtitle}>
            Manage your therapy practice from one place.
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

      <main style={styles.main}>
        <section style={styles.profileCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>My Profile</h2>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              style={styles.secondaryButton}
            >
              Edit Profile
            </button>
          </div>

          <div style={styles.profileContent}>
            <div style={styles.avatar}>
              {therapist?.name
                ? therapist.name.charAt(0).toUpperCase()
                : "T"}
            </div>

            <div>
              <h3 style={styles.name}>
                {therapist?.name || "Therapist"}
              </h3>

              <p style={styles.email}>
                {therapist?.email || "No email available"}
              </p>

              <p style={styles.bio}>
                {therapist?.bio || "No bio added yet."}
              </p>
            </div>
          </div>
        </section>

        <section style={styles.grid}>
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Specializations</h3>

            {therapist?.specializations?.length > 0 ? (
              <div style={styles.tagContainer}>
                {therapist.specializations.map((item) => (
                  <span key={item} style={styles.tag}>
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p style={styles.muted}>No specializations added.</p>
            )}
          </div>

          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Languages</h3>

            {therapist?.languages?.length > 0 ? (
              <div style={styles.tagContainer}>
                {therapist.languages.map((item) => (
                  <span key={item} style={styles.tag}>
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p style={styles.muted}>No languages added.</p>
            )}
          </div>
        </section>

        <section style={styles.slugCard}>
          <h2 style={styles.cardTitle}>Your Branded Profile</h2>

          <p style={styles.slugText}>
            Your profile slug:
          </p>

          <div style={styles.slugBox}>
            /{therapist?.slug || "your-slug"}
          </div>

          <p style={styles.muted}>
            Your public therapist page will use this branded link.
          </p>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },

  error: {
    color: "#dc2626",
  },

  header: {
    padding: "32px 40px",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  brand: {
    margin: "0 0 8px",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "2px",
  },

  title: {
    margin: "0",
    fontSize: "32px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
  },

  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 24px",
  },

  profileCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "22px",
  },

  profileContent: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },

  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "700",
  },

  name: {
    margin: "0 0 4px",
    fontSize: "24px",
  },

  email: {
    margin: "0 0 12px",
    color: "#64748b",
  },

  bio: {
    margin: 0,
    lineHeight: "1.6",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  },

  infoCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
  },

  infoTitle: {
    margin: "0 0 16px",
    fontSize: "18px",
  },

  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  tag: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#f1f5f9",
    fontSize: "14px",
  },

  slugCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
  },

  slugText: {
    marginBottom: "8px",
    color: "#64748b",
  },

  slugBox: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "#f1f5f9",
    fontWeight: "600",
    marginBottom: "12px",
  },

  muted: {
    color: "#64748b",
    margin: 0,
  },

  secondaryButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  logoutButton: {
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Dashboard;