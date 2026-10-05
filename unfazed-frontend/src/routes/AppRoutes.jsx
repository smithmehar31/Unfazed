import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";

import Dashboard from "../pages/therapist/Dashboard";
import Profile from "../pages/therapist/Profile";
import Schedule from "../pages/therapist/Schedule";
import Clients from "../pages/therapist/Clients";
import Notes from "../pages/therapist/Notes";
import Chat from "../pages/therapist/Chat";
import Subscription from "../pages/therapist/Subscription";
import Analytics from "../pages/therapist/Analytics";

import PublicProfile from "../pages/client/PublicProfile";
import BookSession from "../pages/client/BookSession";
import ClientPortal from "../pages/client/ClientPortal";
import Payment from "../pages/client/Payment";

import ProtectedRoute from "./ProtectedRoute";

function FeatureIcon({ type }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "schedule") {
    return (
      <svg {...props}>
        <rect x="3" y="4.5" width="18" height="17" rx="3" />
        <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
        <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
      </svg>
    );
  }

  if (type === "clients") {
    return (
      <svg {...props}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.6-3.1 2.5-5 5.5-5s4.9 1.9 5.5 5" />
        <path d="M16 5.5a2.7 2.7 0 0 1 0 5.2M17 15c2.2.4 3.6 2 4 4.5" />
      </svg>
    );
  }

  if (type === "notes") {
    return (
      <svg {...props}>
        <path d="M6 3.5h9l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V5A1.5 1.5 0 0 1 6.5 3.5Z" />
        <path d="M14 3.5V8h5M8.5 12h7M8.5 16h5" />
      </svg>
    );
  }

  if (type === "payments") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3 9h18M7 14h4M7 16.5h2" />
      </svg>
    );
  }

  if (type === "communication") {
    return (
      <svg {...props}>
        <path d="M20 11.5a7 7 0 0 1-7 7H8l-4 2 .9-4.1A7 7 0 1 1 20 11.5Z" />
        <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M4 19.5V14M10 19.5V10M16 19.5V6M22 19.5V3" />
      <path d="M4 10l5-4 5 2 6-5" />
    </svg>
  );
}

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      type: "schedule",
      title: "Scheduling",
      text: "Manage availability and sessions.",
    },
    {
      type: "clients",
      title: "Clients",
      text: "Keep profiles and intake organized.",
    },
    {
      type: "notes",
      title: "Clinical Notes",
      text: "Create private or shared notes.",
    },
    {
      type: "payments",
      title: "Payments",
      text: "Manage packages and transactions.",
    },
    {
      type: "communication",
      title: "Communication",
      text: "Stay connected with clients.",
    },
    {
      type: "analytics",
      title: "Analytics",
      text: "Understand your practice activity.",
    },
  ];

  return (
    <>
      <style>{css}</style>

      <div className="home-page">
        <div className="home-shell">
          <header className="home-topbar">
            <div className="brand">
              <div className="brand-mark">U</div>

              <div className="brand-copy">
                <strong>Unfazed</strong>
                <span>Therapist practice management</span>
              </div>
            </div>

            <div className="top-status">
              <span className="status-dot" />
              Professional workspace
            </div>
          </header>

          <main className="hero">
            <section className="hero-left">
              <div className="eyebrow">
                <span />
                THERAPIST PRACTICE PLATFORM
              </div>

              <h1>
                Everything your
                <br />
                <em>practice needs.</em>
              </h1>

              <p className="hero-text">
                Unfazed brings scheduling, client management, clinical notes,
                payments, communication and practice insights into one focused
                workspace.
              </p>

              <div className="home-actions">
                <button
                  className="primary-btn"
                  onClick={() => navigate("/login")}
                >
                  Therapist Login
                  <span>→</span>
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => navigate("/register")}
                >
                  Create Account
                </button>
              </div>

              <div className="trust-row">
                <div className="trust-item">
                  <b>06</b>
                  <span>Core tools</span>
                </div>

                <div className="trust-divider" />

                <div className="trust-item">
                  <b>01</b>
                  <span>Focused workspace</span>
                </div>

                <div className="trust-divider" />

                <div className="trust-item">
                  <b>∞</b>
                  <span>Practice flexibility</span>
                </div>
              </div>
            </section>

            <section className="workspace-card">
              <div className="workspace-head">
                <div>
                  <div className="card-kicker">UNFAZED WORKSPACE</div>
                  <h2>Run your practice with clarity.</h2>
                </div>

                <div className="workspace-badge">LIVE</div>
              </div>

              <div className="feature-grid">
                {features.map((feature) => (
                  <div className="feature-card" key={feature.title}>
                    <span className="feature-icon">
                      <FeatureIcon type={feature.type} />
                    </span>

                    <strong>{feature.title}</strong>

                    <p>{feature.text}</p>
                  </div>
                ))}
              </div>

              <div className="workspace-note">
                <span className="note-check">✓</span>

                <div>
                  <strong>One focused workspace</strong>
                  <p>
                    Designed for therapists and their day-to-day practice
                    workflow.
                  </p>
                </div>

                <span className="note-arrow">↗</span>
              </div>
            </section>
          </main>

          <footer className="footer">
            <span>Unfazed Practice Management</span>
            <span>Professional therapist workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/therapist/chat/:clientId" element={<Chat />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        <Route path="/book/:slug" element={<BookSession />} />
        <Route path="/portal" element={<ClientPortal />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/:slug" element={<PublicProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

const css = `
  .home-page {
    min-height: 100vh;
    padding: 24px;
    background:
      radial-gradient(
        circle at 12% 15%,
        rgba(91, 109, 220, 0.14),
        transparent 30%
      ),
      radial-gradient(
        circle at 90% 82%,
        rgba(104, 123, 224, 0.1),
        transparent 28%
      ),
      linear-gradient(135deg, #f7f9fc 0%, #eef2f9 100%);
    color: #182338;
    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .home-page * {
    box-sizing: border-box;
  }

  .home-shell {
    width: min(1180px, 100%);
    min-height: calc(100vh - 48px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }

  .home-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 4px 2px 18px;
    border-bottom: 1px solid #dfe5ee;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-mark {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: linear-gradient(145deg, #5870df, #465dcc);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    box-shadow: 0 10px 22px rgba(76, 97, 206, 0.22);
  }

  .brand-copy strong {
    display: block;
    color: #202b40;
    font-size: 15px;
    letter-spacing: -.2px;
  }

  .brand-copy span {
    display: block;
    margin-top: 3px;
    color: #818c9f;
    font-size: 9px;
  }

  .top-status {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #7f8999;
    font-size: 10px;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #54aa7a;
    box-shadow: 0 0 0 4px rgba(84, 170, 122, 0.1);
  }

  .hero {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.04fr) minmax(420px, .96fr);
    align-items: center;
    gap: 70px;
    padding: 68px 0 58px;
  }

  .hero-left {
    padding-left: 6px;
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #68758b;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.8px;
  }

  .eyebrow span {
    width: 18px;
    height: 1px;
    background: #5970d8;
  }

  .hero h1 {
    margin: 14px 0 0;
    color: #172138;
    font-size: clamp(48px, 6vw, 74px);
    line-height: .95;
    letter-spacing: -3px;
    font-weight: 750;
  }

  .hero h1 em {
    color: #5268d1;
    font-style: normal;
  }

  .hero-text {
    max-width: 575px;
    margin: 23px 0 0;
    color: #6d798d;
    font-size: 14px;
    line-height: 1.8;
  }

  .home-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 28px;
  }

  .primary-btn,
  .secondary-btn {
    border-radius: 11px;
    padding: 12px 17px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .primary-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid #5067d4;
    background: linear-gradient(135deg, #5870de, #475ecb);
    color: #fff;
    box-shadow: 0 10px 22px rgba(77, 99, 210, .22);
  }

  .primary-btn span {
    font-size: 15px;
  }

  .secondary-btn {
    border: 1px solid #d5dce7;
    background: rgba(255,255,255,.9);
    color: #536178;
  }

  .primary-btn:hover,
  .secondary-btn:hover {
    transform: translateY(-1px);
  }

  .trust-row {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 38px;
  }

  .trust-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .trust-item b {
    color: #2b3851;
    font-size: 14px;
  }

  .trust-item span {
    color: #8a94a5;
    font-size: 8px;
  }

  .trust-divider {
    width: 1px;
    height: 28px;
    background: #dbe1ea;
  }

  .workspace-card {
    padding: 28px;
    border: 1px solid #dce3ee;
    border-radius: 24px;
    background: rgba(255,255,255,.95);
    box-shadow:
      0 24px 55px rgba(32, 44, 77, .09),
      0 3px 10px rgba(32, 44, 77, .03);
  }

  .workspace-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
  }

  .card-kicker {
    color: #7a879c;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1.8px;
  }

  .workspace-card h2 {
    margin: 9px 0 0;
    color: #202c42;
    font-size: 24px;
    line-height: 1.2;
    letter-spacing: -.5px;
  }

  .workspace-badge {
    padding: 5px 8px;
    border: 1px solid #d9ebdf;
    border-radius: 99px;
    background: #f0faf4;
    color: #498161;
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 11px;
    margin-top: 22px;
  }

  .feature-card {
    min-height: 125px;
    padding: 15px;
    border: 1px solid #e1e7ef;
    border-radius: 14px;
    background: #fbfcfe;
    text-align: center;
    transition:
      transform .18s ease,
      border-color .18s ease,
      box-shadow .18s ease;
  }

  .feature-card:hover {
    transform: translateY(-2px);
    border-color: #ccd5ea;
    box-shadow: 0 9px 20px rgba(35, 47, 79, .06);
  }

  .feature-icon {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    margin: 0 auto;
    border-radius: 10px;
    background: #eef1ff;
    color: #5268d0;
  }

  .feature-card strong {
    display: block;
    margin-top: 11px;
    color: #2a354a;
    font-size: 11px;
  }

  .feature-card p {
    margin: 5px 0 0;
    color: #8791a1;
    font-size: 9px;
    line-height: 1.5;
  }

  .workspace-note {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-top: 14px;
    padding: 14px;
    border: 1px solid #e0e7fb;
    border-radius: 14px;
    background: linear-gradient(135deg, #f4f6ff, #eef2ff);
  }

  .note-check {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 9px;
    background: #dfe5ff;
    color: #5066cf;
    font-size: 11px;
    font-weight: 800;
  }

  .workspace-note strong {
    color: #334058;
    font-size: 10px;
  }

  .workspace-note p {
    margin: 3px 0 0;
    color: #7e899d;
    font-size: 8px;
    line-height: 1.5;
  }

  .note-arrow {
    margin-left: auto;
    color: #8190b7;
    font-size: 14px;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 16px 2px 0;
    border-top: 1px solid #dfe5ee;
    color: #8a94a5;
    font-size: 9px;
  }

  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
      gap: 40px;
      padding: 48px 0;
    }

    .hero-left {
      padding-left: 0;
    }

    .workspace-card {
      max-width: 650px;
    }
  }

  @media (max-width: 560px) {
    .home-page {
      padding: 15px;
    }

    .top-status {
      display: none;
    }

    .hero {
      padding: 38px 0;
    }

    .hero h1 {
      font-size: 46px;
      letter-spacing: -2px;
    }

    .hero-text {
      font-size: 13px;
    }

    .home-actions {
      flex-direction: column;
    }

    .primary-btn,
    .secondary-btn {
      width: 100%;
      justify-content: center;
    }

    .trust-row {
      gap: 12px;
    }

    .workspace-card {
      padding: 20px;
      border-radius: 19px;
    }

    .feature-grid {
      grid-template-columns: 1fr;
    }

    .footer {
      flex-direction: column;
    }
  }
`;

export default AppRoutes;
