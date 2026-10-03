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
  const [slug, setSlug] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [token]);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/therapists/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const therapist = response.data.therapist;

      setEmail(therapist?.email || "");
      setSlug(therapist?.slug || "");

      setFormData({
        name: therapist?.name || "",
        bio: therapist?.bio || "",
        specializations:
          therapist?.specializations?.join(", ") || "",
        languages: therapist?.languages?.join(", ") || "",
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
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await axiosInstance.put(
        "/therapists/me",
        {
          name: formData.name.trim(),
          bio: formData.bio.trim(),
          specializations: formData.specializations
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          languages: formData.languages
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Profile updated successfully.");

      setTimeout(() => {
        navigate("/dashboard");
      }, 900);
    } catch (error) {
      console.error("Failed to update profile:", error);

      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const publicUrl = `${window.location.origin}/${slug}`;

  const checks = [
    ["Name", Boolean(formData.name.trim())],
    ["Bio", Boolean(formData.bio.trim())],
    [
      "Specializations",
      Boolean(formData.specializations.trim()),
    ],
    ["Languages", Boolean(formData.languages.trim())],
  ];

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="profile-page">
          <div className="state-card">
            <div className="state-mark">U</div>
            <h2>Loading profile</h2>
            <p>Preparing your account settings...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="profile-page">
        <div className="profile-shell">
          <header className="topbar">
            <button
              className="back-link"
              onClick={() => navigate("/dashboard")}
            >
              ← Dashboard
            </button>

            <div className="brand">
              <div className="brand-mark">U</div>
              <div>
                <div className="brand-name">Unfazed</div>
                <div className="brand-sub">
                  Therapist workspace
                </div>
              </div>
            </div>
          </header>

          <section className="page-heading">
            <div>
              <div className="eyebrow">ACCOUNT SETTINGS</div>
              <h1>Professional profile</h1>
              <p>
                Keep your therapist information accurate,
                professional and client-ready.
              </p>
            </div>

            <div className="profile-status">
              <span className="status-dot" />
              Profile active
            </div>
          </section>

          {error && <div className="alert error">{error}</div>}
          {success && (
            <div className="alert success">{success}</div>
          )}

          <div className="profile-grid">
            <main className="main-card">
              <div className="profile-hero">
                <div className="avatar">
                  {formData.name?.charAt(0)?.toUpperCase() || "T"}
                </div>

                <div>
                  <div className="eyebrow light">
                    THERAPIST PROFILE
                  </div>
                  <h2>{formData.name || "Your name"}</h2>
                  <p>{email || "Account email"}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <div className="section-title">
                    <span>01</span>
                    <div>
                      <h3>Professional details</h3>
                      <p>
                        These details appear across your therapist
                        workspace and public profile.
                      </p>
                    </div>
                  </div>

                  <div className="field-grid">
                    <label className="field full">
                      <span>Full name</span>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Dr. Sharma"
                      />
                    </label>

                    <label className="field full">
                      <span>Account email</span>
                      <input value={email} disabled />
                      <small>
                        Email is connected to your account and cannot
                        be changed here.
                      </small>
                    </label>

                    <label className="field full">
                      <span>Professional bio</span>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell clients about your experience and approach..."
                        rows="5"
                      />
                    </label>

                    <label className="field">
                      <span>Specializations</span>
                      <input
                        name="specializations"
                        value={formData.specializations}
                        onChange={handleChange}
                        placeholder="Anxiety, Stress, Depression"
                      />
                      <small>Separate multiple items with commas.</small>
                    </label>

                    <label className="field">
                      <span>Languages spoken</span>
                      <input
                        name="languages"
                        value={formData.languages}
                        onChange={handleChange}
                        placeholder="Hindi, English, Marathi"
                      />
                      <small>Separate multiple languages with commas.</small>
                    </label>
                  </div>
                </div>

                <div className="form-section preview-section">
                  <div className="section-title">
                    <span>02</span>
                    <div>
                      <h3>Public profile</h3>
                      <p>
                        This is the branded page your clients can
                        open before booking.
                      </p>
                    </div>
                  </div>

                  <div className="public-preview">
                    <div className="preview-avatar">
                      {formData.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>

                    <div className="preview-info">
                      <strong>
                        {formData.name || "Therapist name"}
                      </strong>
                      <span>
                        {formData.bio ||
                          "Professional therapist profile"}
                      </span>

                      <div className="preview-url">
                        {publicUrl}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn outline"
                      disabled={!slug}
                      onClick={() => navigate(`/${slug}`)}
                    >
                      Preview →
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => navigate("/dashboard")}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn primary"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </main>

            <aside className="side-column">
              <section className="side-card">
                <div className="eyebrow">PROFILE CHECK</div>
                <h2>Keep it complete</h2>
                <p className="side-intro">
                  A complete profile gives clients the information
                  they need before booking.
                </p>

                <div className="check-list">
                  {checks.map(([label, complete]) => (
                    <div className="check-row" key={label}>
                      <div
                        className={`check-icon ${
                          complete ? "done" : ""
                        }`}
                      >
                        {complete ? "✓" : "–"}
                      </div>

                      <div>
                        <strong>{label}</strong>
                        <span>
                          {complete ? "Completed" : "Add information"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="side-card accent-card">
                <div className="accent-icon">↗</div>

                <div>
                  <div className="eyebrow">CLIENT-FACING</div>
                  <h3>Your branded link</h3>
                  <p>
                    Clients can use this page to learn about you
                    and book a session.
                  </p>
                </div>

                <button
                  className="btn primary full"
                  disabled={!slug}
                  onClick={() => navigate(`/${slug}`)}
                >
                  Open Public Profile
                </button>
              </section>

              <section className="security-note">
                <span>✓</span>
                <div>
                  <strong>Account protected</strong>
                  <p>
                    Your profile updates are saved to your therapist
                    account.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <footer className="footer">
            <span>Unfazed Practice Management</span>
            <span>Professional therapist workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .profile-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  .profile-page * {
    box-sizing: border-box;
  }

  .profile-page h1,
  .profile-page h2,
  .profile-page h3,
  .profile-page p,
  .profile-page span,
  .profile-page strong {
    opacity: 1 !important;
  }

  .profile-shell {
    max-width: 1160px;
    margin: auto;
  }

  .topbar {
    min-height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    border-bottom: 1px solid #e1e6ef;
    padding-bottom: 16px;
  }

  .brand,
  .back-link {
    display: flex;
    align-items: center;
  }

  .brand {
    gap: 10px;
  }

  .brand-mark,
  .state-mark,
  .avatar,
  .preview-avatar,
  .accent-icon,
  .check-icon {
    display: grid;
    place-items: center;
  }

  .brand-mark,
  .state-mark {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #4d63d2;
    color: #fff !important;
    font-weight: 800;
  }

  .brand-name {
    color: #192338 !important;
    font-size: 15px;
    font-weight: 800;
  }

  .brand-sub {
    color: #7a8698 !important;
    font-size: 10px;
    margin-top: 2px;
  }

  .back-link {
    border: 0;
    background: transparent;
    color: #4d63d2 !important;
    padding: 8px 0;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .page-heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 20px;
    padding: 34px 4px 24px;
  }

  .eyebrow {
    margin-bottom: 7px;
    color: #718096 !important;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .eyebrow.light {
    color: rgba(255,255,255,.72) !important;
  }

  .page-heading h1 {
    margin: 0;
    color: #192338 !important;
    font-size: 36px;
    letter-spacing: -.7px;
  }

  .page-heading p {
    margin: 9px 0 0;
    color: #69758a !important;
    font-size: 13px;
  }

  .profile-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 12px;
    background: #eef8f2;
    border: 1px solid #d7ebdf;
    border-radius: 999px;
    color: #2f7750 !important;
    font-size: 11px;
    font-weight: 700;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #32a565;
  }

  .alert {
    padding: 12px 14px;
    border-radius: 11px;
    margin-bottom: 16px;
    font-size: 12px;
    font-weight: 600;
  }

  .alert.error {
    color: #9c3737 !important;
    background: #fff2f2;
    border: 1px solid #f0d5d5;
  }

  .alert.success {
    color: #2d7750 !important;
    background: #eef8f2;
    border: 1px solid #d4eadc;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 18px;
    align-items: start;
  }

  .main-card,
  .side-card,
  .security-note {
    background: #fff;
    border: 1px solid #e0e5ed;
    box-shadow: 0 8px 24px rgba(20,32,60,.04);
  }

  .main-card {
    border-radius: 20px;
    overflow: hidden;
  }

  .profile-hero {
    padding: 25px;
    display: flex;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, #243670, #5269d8);
  }

  .avatar {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    border-radius: 18px;
    background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.2);
    color: #fff !important;
    font-size: 24px;
    font-weight: 800;
  }

  .profile-hero h2 {
    margin: 0;
    color: #fff !important;
    font-size: 22px;
  }

  .profile-hero p {
    margin: 5px 0 0;
    color: rgba(255,255,255,.78) !important;
    font-size: 12px;
  }

  form {
    padding: 25px;
  }

  .form-section {
    padding-bottom: 25px;
    border-bottom: 1px solid #edf0f4;
  }

  .preview-section {
    padding-top: 25px;
  }

  .section-title {
    display: flex;
    gap: 12px;
    margin-bottom: 19px;
  }

  .section-title > span {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #eef1ff;
    color: #4d63d2 !important;
    font-size: 10px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .section-title h3 {
    margin: 0;
    color: #202b3f !important;
    font-size: 17px;
  }

  .section-title p {
    margin: 4px 0 0;
    color: #758095 !important;
    font-size: 11px;
    line-height: 1.5;
  }

  .field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .field.full {
    grid-column: 1 / -1;
  }

  .field > span {
    color: #354158 !important;
    font-size: 12px;
    font-weight: 700;
  }

  .field small {
    color: #8a94a5 !important;
    font-size: 10px;
  }

  input,
  textarea {
    width: 100%;
    border: 1px solid #d8dfe9;
    background: #fff;
    color: #202b3f !important;
    border-radius: 10px;
    padding: 11px 12px;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  input {
    height: 42px;
  }

  textarea {
    min-height: 120px;
    resize: vertical;
    line-height: 1.55;
  }

  input:focus,
  textarea:focus {
    border-color: #6173d7;
    box-shadow: 0 0 0 3px rgba(77,99,210,.1);
  }

  input:disabled {
    background: #f5f7fa;
    color: #8b94a5 !important;
    cursor: not-allowed;
  }

  .public-preview {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 13px;
    padding: 15px;
    background: #f7f8fb;
    border: 1px solid #e7ebf1;
    border-radius: 14px;
  }

  .preview-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #e6ebff;
    color: #4d63d2 !important;
    font-weight: 800;
  }

  .preview-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .preview-info strong {
    color: #202b3f !important;
    font-size: 13px;
  }

  .preview-info > span {
    color: #748095 !important;
    font-size: 10px;
  }

  .preview-url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 4px;
    color: #526078 !important;
    font-size: 10px;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    padding-top: 22px;
  }

  .btn {
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .btn.primary {
    border: 1px solid #4d63d2;
    background: #4d63d2;
    color: #fff !important;
  }

  .btn.ghost {
    border: 1px solid #d8dfe8;
    background: #fff;
    color: #546178 !important;
  }

  .btn.outline {
    border: 1px solid #bdc7ec;
    background: #fff;
    color: #4d63d2 !important;
  }

  .btn.full {
    width: 100%;
  }

  .side-column {
    display: grid;
    gap: 15px;
    position: sticky;
    top: 18px;
  }

  .side-card {
    padding: 21px;
    border-radius: 17px;
  }

  .side-card h2 {
    margin: 0;
    color: #202b3f !important;
    font-size: 20px;
  }

  .side-intro,
  .accent-card p,
  .security-note p {
    color: #758095 !important;
    font-size: 11px;
    line-height: 1.6;
  }

  .side-intro {
    margin: 7px 0 17px;
  }

  .check-list {
    border-top: 1px solid #edf0f4;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid #edf0f4;
  }

  .check-icon {
    width: 28px;
    height: 28px;
    border-radius: 9px;
    background: #f0f2f6;
    color: #929baa !important;
    font-size: 12px;
    font-weight: 800;
  }

  .check-icon.done {
    background: #eaf7ef;
    color: #2d8a58 !important;
  }

  .check-row strong {
    display: block;
    color: #283349 !important;
    font-size: 11px;
  }

  .check-row span {
    display: block;
    margin-top: 2px;
    color: #8a94a5 !important;
    font-size: 10px;
  }

  .accent-card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: start;
  }

  .accent-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #eef1ff;
    color: #4d63d2 !important;
    font-size: 15px;
    font-weight: 800;
  }

  .accent-card h3 {
    margin: 0;
    color: #202b3f !important;
    font-size: 14px;
  }

  .accent-card p {
    margin: 5px 0 14px;
  }

  .accent-card .btn {
    grid-column: 1 / -1;
  }

  .security-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
    border-radius: 13px;
    background: #f9fafc;
    box-shadow: none;
  }

  .security-note > span {
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #eaf7ef;
    color: #2d8a58 !important;
    font-size: 11px;
    font-weight: 800;
  }

  .security-note strong {
    display: block;
    color: #344057 !important;
    font-size: 11px;
  }

  .security-note p {
    margin: 3px 0 0;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 17px 3px 0;
    margin-top: 22px;
    border-top: 1px solid #e1e6ef;
    color: #8b95a5 !important;
    font-size: 10px;
  }

  .state-card {
    max-width: 430px;
    margin: 110px auto;
    padding: 35px;
    border-radius: 20px;
    text-align: center;
  }

  .state-card h2 {
    margin: 13px 0 5px;
    color: #202b3f !important;
  }

  .state-card p {
    margin: 0;
    color: #758095 !important;
    font-size: 12px;
  }

  @media (max-width: 850px) {
    .profile-page {
      padding: 15px;
    }

    .page-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .profile-grid {
      grid-template-columns: 1fr;
    }

    .side-column {
      position: static;
    }

    .field-grid {
      grid-template-columns: 1fr;
    }

    .field.full {
      grid-column: auto;
    }
  }

  @media (max-width: 560px) {
    .topbar,
    .footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .profile-hero {
      padding: 20px;
    }

    form {
      padding: 19px;
    }

    .public-preview {
      grid-template-columns: auto 1fr;
    }

    .public-preview .btn {
      grid-column: 1 / -1;
      width: 100%;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .form-actions .btn {
      width: 100%;
    }
  }
`;
export default Profile;