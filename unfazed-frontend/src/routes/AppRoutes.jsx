import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

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

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <style>{css}</style>

      <div className="home-page">
        <div className="home-shell">
          <header className="home-topbar">
            <div className="brand">
              <div className="brand-mark">U</div>

              <div>
                <strong>Unfazed</strong>
                <span>Therapist practice management</span>
              </div>
            </div>

            <div className="top-link">
              Professional workspace
            </div>
          </header>

          <main className="home-grid">
            <section className="home-intro">
              <div className="eyebrow">
                THERAPIST PRACTICE PLATFORM
              </div>

              <h1>
                Everything your
                <br />
                practice needs.
              </h1>

              <p>
                Unfazed brings scheduling, clients, clinical notes,
                payments, communication and practice insights into
                one focused workspace.
              </p>

              <div className="home-actions">
                <button
                  className="primary-btn"
                  onClick={() => navigate("/login")}
                >
                  Therapist Login →
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => navigate("/register")}
                >
                  Create Account
                </button>
              </div>
            </section>

            <section className="home-card">
              <div className="card-kicker">UNFAZED WORKSPACE</div>

              <h2>Run your practice with clarity.</h2>

              <div className="feature-grid">
                <div>
                  <span>◷</span>
                  <strong>Scheduling</strong>
                  <p>Manage availability and sessions.</p>
                </div>

                <div>
                  <span>◉</span>
                  <strong>Clients</strong>
                  <p>Keep profiles and intake organized.</p>
                </div>

                <div>
                  <span>✎</span>
                  <strong>Clinical Notes</strong>
                  <p>Create private or shared notes.</p>
                </div>

                <div>
                  <span>₹</span>
                  <strong>Payments</strong>
                  <p>Manage packages and transactions.</p>
                </div>

                <div>
                  <span>💬</span>
                  <strong>Communication</strong>
                  <p>Stay connected with clients.</p>
                </div>

                <div>
                  <span>↗</span>
                  <strong>Analytics</strong>
                  <p>Understand your practice activity.</p>
                </div>
              </div>

              <div className="home-note">
                <span>✓</span>
                <div>
                  <strong>One focused workspace</strong>
                  <p>
                    Designed for therapists and their day-to-day
                    practice workflow.
                  </p>
                </div>
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
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/schedule"
            element={<Schedule />}
          />

          <Route
            path="/clients"
            element={<Clients />}
          />

          <Route
            path="/notes"
            element={<Notes />}
          />

          <Route
            path="/therapist/chat/:clientId"
            element={<Chat />}
          />

          <Route
            path="/subscription"
            element={<Subscription />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />
        </Route>

        <Route
          path="/book/:slug"
          element={<BookSession />}
        />

        <Route
          path="/portal"
          element={<ClientPortal />}
        />

        <Route
          path="/payment"
          element={<Payment />}
        />

        <Route
          path="/:slug"
          element={<PublicProfile />}
        />
      </Routes>
    </BrowserRouter>
  );
}

const css = `
  .home-page {
    min-height: 100vh;
    background:
      radial-gradient(
        circle at 10% 10%,
        rgba(77,99,210,.11),
        transparent 30%
      ),
      radial-gradient(
        circle at 90% 90%,
        rgba(77,99,210,.09),
        transparent 28%
      ),
      #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .home-page * {
    box-sizing: border-box;
  }

  .home-shell {
    max-width: 1120px;
    min-height: calc(100vh - 44px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }

  .home-topbar {
    min-height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding-bottom: 17px;
    border-bottom: 1px solid #e0e5ed;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-mark {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: #4d63d2;
    color: #fff;
    font-weight: 800;
    box-shadow: 0 8px 18px rgba(77,99,210,.18);
  }

  .brand strong {
    display: block;
    color: #1d283c;
    font-size: 15px;
  }

  .brand span {
    display: block;
    margin-top: 2px;
    color: #7f899a;
    font-size: 9px;
  }

  .top-link {
    color: #7f899a;
    font-size: 10px;
  }

  .home-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr .9fr;
    align-items: center;
    gap: 65px;
    padding: 60px 0;
  }

  .eyebrow,
  .card-kicker {
    color: #748097;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .home-intro h1 {
    margin: 10px 0 0;
    color: #182238;
    font-size: clamp(45px, 6vw, 67px);
    line-height: .98;
    letter-spacing: -1.8px;
  }

  .home-intro > p {
    max-width: 560px;
    margin: 20px 0 0;
    color: #69758a;
    font-size: 14px;
    line-height: 1.8;
  }

  .home-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 25px;
  }

  .primary-btn,
  .secondary-btn {
    border-radius: 10px;
    padding: 11px 15px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .primary-btn {
    border: 1px solid #4d63d2;
    background: #4d63d2;
    color: #fff;
    box-shadow: 0 8px 18px rgba(77,99,210,.16);
  }

  .secondary-btn {
    border: 1px solid #d5dce7;
    background: #fff;
    color: #506078;
  }

  .home-card {
    padding: 26px;
    border: 1px solid #dfe5ee;
    border-radius: 21px;
    background: rgba(255,255,255,.96);
    box-shadow: 0 18px 42px rgba(29,39,67,.08);
  }

  .home-card h2 {
    margin: 9px 0 0;
    color: #202b40;
    font-size: 25px;
    letter-spacing: -.4px;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
    margin-top: 21px;
  }

  .feature-grid > div {
    padding: 13px;
    border: 1px solid #e5e9ef;
    border-radius: 12px;
    background: #fafbfd;
  }

  .feature-grid span {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #eef1ff;
    color: #5065cf;
    font-size: 12px;
    font-weight: 800;
  }

  .feature-grid strong {
    display: block;
    margin-top: 9px;
    color: #2b364b;
    font-size: 11px;
  }

  .feature-grid p {
    margin: 3px 0 0;
    color: #818b9c;
    font-size: 9px;
    line-height: 1.45;
  }

  .home-note {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    padding: 13px;
    border-radius: 12px;
    background: #f2f5ff;
  }

  .home-note > span {
    width: 27px;
    height: 27px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 9px;
    background: #dfe5ff;
    color: #5064cc;
    font-weight: 800;
    font-size: 10px;
  }

  .home-note strong {
    color: #344057;
    font-size: 10px;
  }

  .home-note p {
    margin: 3px 0 0;
    color: #7d8798;
    font-size: 9px;
    line-height: 1.45;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 16px 2px 0;
    border-top: 1px solid #e1e6ef;
    color: #8a94a5;
    font-size: 9px;
  }

  @media (max-width: 800px) {
    .home-page {
      padding: 15px;
    }

    .home-grid {
      grid-template-columns: 1fr;
      gap: 35px;
      padding: 42px 0;
    }

    .home-intro h1 {
      font-size: 46px;
    }

    .home-card {
      padding: 21px;
    }

    .footer {
      flex-direction: column;
    }
  }

  @media (max-width: 520px) {
    .home-topbar {
      align-items: flex-start;
    }

    .top-link {
      display: none;
    }

    .feature-grid {
      grid-template-columns: 1fr;
    }

    .home-actions {
      flex-direction: column;
    }

    .home-actions button {
      width: 100%;
    }
  }
`;
export default AppRoutes;