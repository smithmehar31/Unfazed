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
  }, [token]);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/therapists/me", {
        headers: { Authorization: `Bearer ${token}` },
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
      <>
        <style>{css}</style>
        <div className="dash-page">
          <div className="state-card">
            <div className="loader">U</div>
            <h2>Loading dashboard</h2>
            <p>Setting up your practice workspace...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{css}</style>
        <div className="dash-page">
          <div className="state-card">
            <div className="error-icon">!</div>
            <h2>Unable to load dashboard</h2>
            <p>{error}</p>
            <button className="btn primary" onClick={fetchProfile}>
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  const firstName = therapist?.name?.split(" ")[0] || "Therapist";
  const publicUrl = `${window.location.origin}/${therapist?.slug || ""}`;

  const quickLinks = [
    {
      icon: "◷",
      title: "Schedule",
      text: "Manage availability and appointments.",
      path: "/schedule",
    },
    {
      icon: "◉",
      title: "Clients",
      text: "Manage profiles, intake and consent.",
      path: "/clients",
    },
    {
      icon: "D",
      title: "Profile",
      text: "Update your professional information.",
      path: "/profile",
    },
    {
      icon: "✎",
      title: "Clinical Notes",
      text: "Create and manage session notes.",
      path: "/notes",
    },
    {
      icon: "↗",
      title: "Analytics",
      text: "View revenue and practice insights.",
      path: "/analytics",
    },
    {
      icon: "◇",
      title: "Subscription",
      text: "Review your plan and feature limits.",
      path: "/subscription",
    },
  ];

  return (
    <>
      <style>{css}</style>

      <div className="dash-page">
        <div className="dash-shell">
          <header className="topbar">
            <div className="brand-wrap">
              <div className="brand-mark">U</div>
              <div>
                <div className="brand-name">Unfazed</div>
                <div className="brand-sub">Therapist workspace</div>
              </div>
            </div>

            <div className="top-actions">
              <span className="status-pill">
                <span className="status-dot" />
                Practice active
              </span>

              <button className="btn ghost" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          <main>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow light">THERAPIST DASHBOARD</div>

                <h1>
                  Welcome back, <span>{firstName}</span>
                </h1>

                <p>
                  Run your practice from one focused workspace for
                  scheduling, clients, notes, payments and insights.
                </p>

                <div className="hero-actions">
                  <button
                    className="btn light-btn"
                    onClick={() => navigate("/schedule")}
                  >
                    Open Schedule
                  </button>

                  <button
                    className="btn hero-outline"
                    onClick={() => navigate("/clients")}
                  >
                    View Clients
                  </button>
                </div>
              </div>

              <div className="hero-card">
                <div className="hero-card-label">YOUR WORKSPACE</div>
                <strong>{therapist?.name || "Therapist"}</strong>
                <span>
                  Everything important for your practice, in one place.
                </span>
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">QUICK ACCESS</div>
                  <h2>Manage your practice</h2>
                </div>

                <span className="section-note">
                  Choose an area to continue
                </span>
              </div>

              <div className="quick-grid">
                {quickLinks.map((item) => (
                  <button
                    key={item.path}
                    className="quick-card"
                    onClick={() => navigate(item.path)}
                  >
                    <div className="quick-icon">{item.icon}</div>

                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>

                    <span className="arrow">→</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <div className="eyebrow">PROFILE</div>
                    <h2>Therapist profile</h2>
                  </div>

                  <div className="mini-icon">D</div>
                </div>

                <div className="profile-summary">
                  <div className="avatar">
                    {therapist?.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>

                  <div>
                    <h3>{therapist?.name || "Therapist"}</h3>
                    <p>
                      {therapist?.bio || "Licensed therapist"}
                    </p>
                  </div>
                </div>

                <div className="detail-list">
                  <div className="detail-row">
                    <span>Email</span>
                    <strong>{therapist?.email || "—"}</strong>
                  </div>

                  <div className="detail-row">
                    <span>Public profile</span>
                    <strong>/{therapist?.slug || "—"}</strong>
                  </div>

                  <div className="detail-row">
                    <span>Timezone</span>
                    <strong>
                      {therapist?.timezone || "Asia/Kolkata"}
                    </strong>
                  </div>
                </div>

                <button
                  className="btn outline full"
                  onClick={() => navigate("/profile")}
                >
                  Edit Profile
                  <span>→</span>
                </button>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div>
                    <div className="eyebrow">WORKSPACE</div>
                    <h2>Your practice</h2>
                  </div>

                  <div className="mini-icon">✦</div>
                </div>

                <p className="panel-copy">
                  Keep your practice organized with quick access to
                  your core tools.
                </p>

                <div className="action-list">
                  <button onClick={() => navigate("/schedule")}>
                    <span>Manage Schedule</span>
                    <span>→</span>
                  </button>

                  <button onClick={() => navigate("/clients")}>
                    <span>Manage Clients</span>
                    <span>→</span>
                  </button>

                  <button onClick={() => navigate("/notes")}>
                    <span>Manage Clinical Notes</span>
                    <span>→</span>
                  </button>

                  <button onClick={() => navigate("/analytics")}>
                    <span>View Analytics</span>
                    <span>→</span>
                  </button>

                  <button onClick={() => navigate("/subscription")}>
                    <span>Manage Subscription</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </section>

            <section className="public-card">
              <div>
                <div className="eyebrow">CLIENT-FACING</div>
                <h2>Your public profile</h2>

                <p>
                  Share your branded link so clients can view your
                  profile and book a session.
                </p>

                <div className="public-link">{publicUrl}</div>
              </div>

              <button
                className="btn primary public-btn"
                onClick={() => navigate(`/${therapist?.slug}`)}
              >
                View Public Profile →
              </button>
            </section>
          </main>

          <footer className="footer">
            <span>Unfazed Practice Management</span>
            <span>Professional workspace for therapists</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .dash-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 24px;
    box-sizing: border-box;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .dash-page * {
    box-sizing: border-box;
  }

  .dash-page h1,
  .dash-page h2,
  .dash-page h3,
  .dash-page p,
  .dash-page span,
  .dash-page strong {
    opacity: 1 !important;
  }

  .dash-page h1,
  .dash-page h2,
  .dash-page h3 {
    color: #192338 !important;
  }

  .dash-page p {
    color: #68748a !important;
  }

  .dash-shell {
    max-width: 1180px;
    margin: 0 auto;
  }

  .topbar {
    min-height: 70px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 0 4px 18px;
    border-bottom: 1px solid #e2e7ef;
  }

  .brand-wrap,
  .top-actions,
  .hero-actions {
    display: flex;
    align-items: center;
  }

  .brand-wrap {
    gap: 12px;
  }

  .brand-mark,
  .avatar,
  .mini-icon,
  .quick-icon,
  .loader,
  .error-icon {
    display: grid;
    place-items: center;
  }

  .brand-mark {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: #4d63d2;
    color: #fff;
    font-weight: 800;
    font-size: 18px;
  }

  .brand-name {
    color: #172033 !important;
    font-weight: 800;
    font-size: 16px;
  }

  .brand-sub {
    color: #7c8799 !important;
    font-size: 11px;
    margin-top: 2px;
  }

  .top-actions {
    gap: 10px;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 11px;
    border-radius: 999px;
    background: #eef8f2;
    border: 1px solid #d4ebdd;
    color: #2d7750 !important;
    font-size: 11px;
    font-weight: 700;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2d9b60;
  }

  .btn {
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: .2s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn.primary {
    background: #4d63d2;
    color: #fff !important;
    border: 1px solid #4d63d2;
  }

  .btn.ghost {
    background: #fff;
    color: #526078 !important;
    border: 1px solid #d9dfE8;
  }

  .btn.outline {
    background: #fff;
    color: #4d63d2 !important;
    border: 1px solid #bfc8ee;
  }

  .btn.light-btn {
    background: #fff;
    color: #2f439a !important;
    border: 1px solid rgba(255,255,255,.7);
  }

  .btn.hero-outline {
    background: transparent;
    color: #fff !important;
    border: 1px solid rgba(255,255,255,.35);
  }

  .full {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .hero {
    margin-top: 24px;
    padding: 34px;
    min-height: 260px;
    border-radius: 24px;
    background: linear-gradient(135deg, #22346f 0%, #5368d8 100%);
    display: grid;
    grid-template-columns: 1.5fr .8fr;
    align-items: center;
    gap: 26px;
    overflow: hidden;
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

  .hero h1 {
    margin: 0;
    color: #fff !important;
    font-size: clamp(30px, 5vw, 46px);
    line-height: 1.08;
    letter-spacing: -.8px;
  }

  .hero h1 span {
    color: #fff !important;
    font-style: italic;
  }

  .hero p {
    max-width: 650px;
    margin: 13px 0 0;
    color: rgba(255,255,255,.82) !important;
    font-size: 14px;
    line-height: 1.65;
  }

  .hero-actions {
    gap: 9px;
    margin-top: 20px;
    flex-wrap: wrap;
  }

  .hero-card {
    min-height: 155px;
    padding: 24px;
    border-radius: 18px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .hero-card-label {
    color: rgba(255,255,255,.64) !important;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.5px;
    margin-bottom: 9px;
  }

  .hero-card strong {
    color: #fff !important;
    font-size: 20px;
  }

  .hero-card span {
    color: rgba(255,255,255,.8) !important;
    font-size: 12px;
    line-height: 1.5;
    margin-top: 6px;
  }

  .section {
    margin-top: 28px;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 16px;
    margin-bottom: 14px;
  }

  .section-head h2,
  .panel-head h2,
  .public-card h2 {
    margin: 0;
    color: #192338 !important;
    font-size: 23px;
    letter-spacing: -.3px;
  }

  .section-note {
    color: #7b8699 !important;
    font-size: 12px;
  }

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
  }

  .quick-card {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 13px;
    text-align: left;
    padding: 17px;
    border: 1px solid #e0e5ed;
    border-radius: 16px;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(20,32,60,.035);
    transition: .2s ease;
  }

  .quick-card:hover {
    transform: translateY(-2px);
    border-color: #c8d0f0;
  }

  .quick-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: #eef1ff;
    color: #4d63d2 !important;
    font-size: 17px;
    font-weight: 800;
  }

  .quick-card h3 {
    margin: 0;
    color: #233047 !important;
    font-size: 14px;
  }

  .quick-card p {
    margin: 4px 0 0;
    color: #7a8597 !important;
    font-size: 11px;
    line-height: 1.45;
  }

  .arrow {
    color: #5265c8 !important;
    font-size: 16px;
    font-weight: 800;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 20px;
  }

  .panel,
  .public-card,
  .state-card {
    background: #fff;
    border: 1px solid #e0e5ed;
    box-shadow: 0 8px 24px rgba(20,32,60,.04);
  }

  .panel {
    padding: 23px;
    border-radius: 19px;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 18px;
  }

  .mini-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #eef1ff;
    color: #4d63d2 !important;
    font-weight: 800;
  }

  .profile-summary {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 16px;
    background: #f7f8fb;
    border-radius: 15px;
  }

  .avatar {
    width: 46px;
    height: 46px;
    border-radius: 13px;
    background: #dfe5ff;
    color: #4d63d2 !important;
    font-weight: 800;
    font-size: 17px;
    flex-shrink: 0;
  }

  .profile-summary h3 {
    margin: 0;
    color: #1f2a3e !important;
    font-size: 15px;
  }

  .profile-summary p {
    margin: 4px 0 0;
    color: #718096 !important;
    font-size: 11px;
  }

  .detail-list {
    margin: 15px 0 17px;
    border-top: 1px solid #edf0f4;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid #edf0f4;
    font-size: 11px;
  }

  .detail-row span {
    color: #7b8698 !important;
  }

  .detail-row strong {
    color: #263248 !important;
    text-align: right;
    word-break: break-word;
  }

  .panel-copy {
    margin: -4px 0 17px;
    color: #6d788b !important;
    font-size: 12px;
    line-height: 1.6;
  }

  .action-list {
    display: grid;
    gap: 8px;
  }

  .action-list button {
    width: 100%;
    border: 1px solid #e0e5ed;
    background: #fff;
    color: #263248 !important;
    border-radius: 10px;
    padding: 11px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    text-align: left;
  }

  .action-list button:hover {
    background: #f8f9fc;
    border-color: #c9d1ee;
  }

  .public-card {
    margin-top: 20px;
    padding: 22px 24px;
    border-radius: 19px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 22px;
  }

  .public-card p {
    margin: 8px 0 13px;
    color: #6c788b !important;
    max-width: 680px;
    font-size: 12px;
    line-height: 1.55;
  }

  .public-link {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 9px 11px;
    border-radius: 9px;
    border: 1px solid #e1e6ee;
    background: #f7f8fb;
    color: #4d5870 !important;
    font-size: 11px;
  }

  .public-btn {
    flex-shrink: 0;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 22px;
    padding: 16px 2px 0;
    border-top: 1px solid #e2e7ef;
    color: #8a94a5 !important;
    font-size: 10px;
  }

  .state-card {
    max-width: 430px;
    margin: 100px auto;
    padding: 34px;
    text-align: center;
    border-radius: 20px;
  }

  .state-card h2 {
    margin: 13px 0 6px;
    color: #192338 !important;
    font-size: 20px;
  }

  .state-card p {
    margin: 0 0 19px;
    color: #738095 !important;
    font-size: 12px;
  }

  .loader,
  .error-icon {
    width: 46px;
    height: 46px;
    margin: 0 auto;
    border-radius: 14px;
    font-weight: 800;
  }

  .loader {
    background: #eef1ff;
    color: #4d63d2 !important;
  }

  .error-icon {
    background: #fff0f0;
    color: #b43d3d !important;
  }

  @media (max-width: 800px) {
    .dash-page {
      padding: 16px;
    }

    .topbar,
    .section-head,
    .public-card {
      align-items: flex-start;
      flex-direction: column;
    }

    .topbar {
      gap: 14px;
    }

    .top-actions {
      width: 100%;
      justify-content: space-between;
    }

    .hero,
    .content-grid {
      grid-template-columns: 1fr;
    }

    .hero {
      padding: 25px;
    }

    .hero-card {
      min-height: auto;
    }

    .public-btn {
      width: 100%;
    }

    .footer {
      flex-direction: column;
    }
  }
`;
export default Dashboard;