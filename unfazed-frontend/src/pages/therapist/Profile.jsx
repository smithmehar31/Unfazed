import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

function Profile() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    specializations: "",
    languages: "",
  });

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load therapist profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get("/therapists/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const therapist = response.data.therapist;

        setEmail(therapist.email || "");

        setFormData({
          name: therapist.name || "",
          bio: therapist.bio || "",
          specializations:
            therapist.specializations?.join(", ") || "",
          languages: therapist.languages?.join(", ") || "",
        });
      } catch (error) {
        console.error("Failed to load profile:", error);

        if (error.response?.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        setError(
          error.response?.data?.message ||
            "Failed to load profile"
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const specializations = formData.specializations
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const languages = formData.languages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await axiosInstance.put(
        "/therapists/me",
        {
          name: formData.name,
          bio: formData.bio,
          specializations,
          languages,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Profile updated successfully");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Failed to update profile:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <p style={styles.brand}>UNFAZED</p>
            <h1 style={styles.title}>Edit Profile</h1>
            <p style={styles.subtitle}>
              Update your professional profile information.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={styles.backButton}
          >
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.card}>
          <div style={styles.field}>
            <label htmlFor="name" style={styles.label}>
              Name
            </label>

            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              disabled
              style={styles.disabledInput}
            />

            <p style={styles.helpText}>
              Email cannot be changed from this page.
            </p>
          </div>

          <div style={styles.field}>
            <label htmlFor="bio" style={styles.label}>
              Bio
            </label>

            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell clients about yourself..."
              rows="5"
              style={styles.textarea}
            />
          </div>

          <div style={styles.field}>
            <label
              htmlFor="specializations"
              style={styles.label}
            >
              Specializations
            </label>

            <input
              id="specializations"
              type="text"
              name="specializations"
              value={formData.specializations}
              onChange={handleChange}
              placeholder="Anxiety, Stress, Depression"
              style={styles.input}
            />

            <p style={styles.helpText}>
              Separate multiple specializations with commas.
            </p>
          </div>

          <div style={styles.field}>
            <label htmlFor="languages" style={styles.label}>
              Languages
            </label>

            <input
              id="languages"
              type="text"
              name="languages"
              value={formData.languages}
              onChange={handleChange}
              placeholder="Hindi, English, Marathi"
              style={styles.input}
            />

            <p style={styles.helpText}>
              Separate multiple languages with commas.
            </p>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.success}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "800px",
    margin: "0 auto",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
  },

  brand: {
    margin: "0 0 8px",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#475569",
  },

  title: {
    margin: "0",
    fontSize: "34px",
    color: "#0f172a",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
  },

  backButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "28px",
    boxSizing: "border-box",
  },

  field: {
    marginBottom: "22px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#0f172a",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
  },

  disabledInput: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
    background: "#f1f5f9",
    color: "#64748b",
  },

  textarea: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
  },

  helpText: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  error: {
    marginBottom: "18px",
    padding: "12px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#b91c1c",
  },

  success: {
    marginBottom: "18px",
    padding: "12px",
    borderRadius: "8px",
    background: "#dcfce7",
    color: "#15803d",
  },

  saveButton: {
    width: "100%",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "13px 18px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Profile;