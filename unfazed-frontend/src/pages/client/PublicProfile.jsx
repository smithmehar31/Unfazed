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

      const response = await axiosInstance.get(
        `/therapists/${slug}`
      );

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
      <>
        <style>{css}</style>

        <div className="public-page">
          <div className="state-card">
            <div className="state-icon">U</div>
            <h2>Loading profile</h2>
            <p>Preparing therapist information...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !therapist) {
    return (
      <>
        <style>{css}</style>

        <div className="public-page">
          <div className="state-card">
            <div className="error-icon">!</div>

            <h2>Profile not found</h2>

            <p>
              {error ||
                "This therapist profile does not exist."}
            </p>

            <button
              className="primary-btn"
              onClick={() => navigate("/")}
            >
              Go Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const specializations =
    therapist.specializations || [];

  const languages = therapist.languages || [];

  return (
    <>
      <style>{css}</style>

      <div className="public-page">
        <div className="public-shell">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">U</div>

              <div>
                <strong>Unfazed</strong>
                <span>Therapist practice</span>
              </div>
            </div>

            <button
              className="header-book"
              onClick={handleBooking}
            >
              Book a session
            </button>
          </header>

          <main>
            <section className="hero">
              <div className="hero-glow" />

              <div className="avatar">
                {therapist.name
                  ?.charAt(0)
                  ?.toUpperCase() || "T"}
              </div>

              <div className="hero-content">
                <div className="eyebrow light">
                  THERAPIST
                </div>

                <h1>{therapist.name}</h1>

                <p className="hero-bio">
                  {therapist.bio ||
                    "Professional therapist providing a safe and supportive space for clients."}
                </p>

                <div className="hero-actions">
                  <button
                    className="primary-btn light-btn"
                    onClick={handleBooking}
                  >
                    Book a session →
                  </button>

                  <button
                    className="hero-link"
                    onClick={handleBooking}
                  >
                    View availability
                  </button>
                </div>
              </div>

              <div className="hero-side">
                <span>AVAILABLE SESSION TYPES</span>

                <strong>30 · 45 · 60 · 90 min</strong>

                <small>
                  Choose a time and duration that works
                  for you.
                </small>
              </div>
            </section>

            <section className="content-grid">
              <div className="main-column">
                <article className="card about-card">
                  <div className="eyebrow">
                    ABOUT THE THERAPIST
                  </div>

                  <h2>About {therapist.name}</h2>

                  <p>
                    {therapist.bio ||
                      "This therapist has not added an introduction yet."}
                  </p>
                </article>

                <article className="card">
                  <div className="eyebrow">
                    SPECIALIZATIONS
                  </div>

                  <h2>Areas of focus</h2>

                  {specializations.length ? (
                    <div className="tag-grid">
                      {specializations.map(
                        (item, index) => (
                          <span
                            className="tag"
                            key={`${item}-${index}`}
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="muted">
                      No specializations added yet.
                    </p>
                  )}
                </article>

                <article className="card">
                  <div className="eyebrow">
                    LANGUAGES
                  </div>

                  <h2>Languages spoken</h2>

                  {languages.length ? (
                    <div className="tag-grid">
                      {languages.map(
                        (language, index) => (
                          <span
                            className="language-tag"
                            key={`${language}-${index}`}
                          >
                            {language}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="muted">
                      No languages added yet.
                    </p>
                  )}
                </article>
              </div>

              <aside className="side-column">
                <div className="booking-card">
                  <div className="eyebrow">
                    THERAPY SESSION
                  </div>

                  <h2>One-to-one support</h2>

                  <p>
                    Schedule a session at a time that fits
                    your routine.
                  </p>

                  <div className="booking-detail">
                    <span>Session lengths</span>
                    <strong>
                      30 / 45 / 60 / 90 min
                    </strong>
                  </div>

                  <div className="booking-detail">
                    <span>Booking</span>
                    <strong>
                      Instant confirmation
                    </strong>
                  </div>

                  <button
                    className="primary-btn full"
                    onClick={handleBooking}
                  >
                    Check availability
                  </button>
                </div>

                <div className="trust-card">
                  <div className="trust-icon">✓</div>

                  <div>
                    <strong>Private & secure</strong>
                    <p>
                      Your booking and client information
                      are handled through the Unfazed
                      platform.
                    </p>
                  </div>
                </div>
              </aside>
            </section>
          </main>

          <footer className="footer">
            <span>Powered by Unfazed</span>
            <span>
              Professional therapist practice management
            </span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .public-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 18px;
    font-family: Inter, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .public-page * {
    box-sizing: border-box;
  }

  .public-shell {
    max-width: 1120px;
    margin: 0 auto;
  }

  .topbar {
    height: 65px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid #e0e5ed;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: #4d63d2;
    color: #fff;
    font-weight: 800;
  }

  .brand strong {
    display: block;
    color: #1d283c;
    font-size: 14px;
  }

  .brand span {
    display: block;
    margin-top: 2px;
    color: #8490a1;
    font-size: 9px;
  }

  .header-book {
    border: 1px solid #ced6e5;
    background: #fff;
    color: #4d60c8;
    border-radius: 10px;
    padding: 9px 13px;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
  }

  .hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: auto 1fr 260px;
    align-items: center;
    gap: 24px;
    margin-top: 22px;
    padding: 30px;
    border-radius: 23px;
    background: linear-gradient(
      135deg,
      #23366f 0%,
      #5268d6 100%
    );
    box-shadow: 0 14px 32px rgba(43,57,125,.15);
  }

  .hero-glow {
    position: absolute;
    width: 260px;
    height: 260px;
    right: -70px;
    top: -90px;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
  }

  .avatar {
    position: relative;
    z-index: 1;
    width: 88px;
    height: 88px;
    border-radius: 24px;
    display: grid;
    place-items: center;
    background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.22);
    color: #fff;
    font-size: 31px;
    font-weight: 800;
  }

  .hero-content {
    position: relative;
    z-index: 1;
  }

  .eyebrow {
    margin-bottom: 7px;
    color: #718096;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.6px;
  }

  .eyebrow.light {
    color: rgba(255,255,255,.7);
  }

  .hero h1 {
    margin: 0;
    color: #fff;
    font-size: 38px;
    letter-spacing: -.8px;
  }

  .hero-bio {
    margin: 9px 0 0;
    max-width: 650px;
    color: rgba(255,255,255,.82);
    font-size: 13px;
    line-height: 1.65;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 17px;
    flex-wrap: wrap;
  }

  .primary-btn {
    border: 1px solid #4d63d2;
    border-radius: 10px;
    padding: 11px 15px;
    background: #4d63d2;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .light-btn {
    background: #fff;
    color: #30459e;
    border-color: #fff;
  }

  .hero-link {
    border: 0;
    background: transparent;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .hero-side {
    position: relative;
    z-index: 1;
    padding: 17px;
    border-radius: 15px;
    background: rgba(255,255,255,.11);
    border: 1px solid rgba(255,255,255,.17);
  }

  .hero-side span {
    display: block;
    color: rgba(255,255,255,.62);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .hero-side strong {
    display: block;
    margin-top: 8px;
    color: #fff;
    font-size: 15px;
  }

  .hero-side small {
    display: block;
    margin-top: 7px;
    color: rgba(255,255,255,.75);
    font-size: 9px;
    line-height: 1.5;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 17px;
    margin-top: 17px;
    align-items: start;
  }

  .main-column {
    display: grid;
    gap: 15px;
  }

  .side-column {
    display: grid;
    gap: 13px;
    position: sticky;
    top: 18px;
  }

  .card,
  .booking-card,
  .trust-card,
  .state-card {
    background: #fff;
    border: 1px solid #e0e5ed;
    box-shadow: 0 8px 23px rgba(22,31,54,.04);
  }

  .card {
    padding: 23px;
    border-radius: 17px;
  }

  .card h2,
  .booking-card h2 {
    margin: 0 0 11px;
    color: #222d42;
    font-size: 20px;
  }

  .card p,
  .booking-card p {
    margin: 0;
    color: #6e798d;
    font-size: 12px;
    line-height: 1.7;
  }

  .about-card p {
    font-size: 13px;
  }

  .tag-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tag,
  .language-tag {
    padding: 8px 11px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
  }

  .tag {
    background: #eef1ff;
    color: #5264c7;
  }

  .language-tag {
    background: #f0f3f7;
    color: #5b667a;
  }

  .muted {
    color: #8b95a5 !important;
  }

  .booking-card {
    padding: 23px;
    border-radius: 17px;
  }

  .booking-card > p {
    margin-bottom: 15px;
  }

  .booking-detail {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 11px 0;
    border-top: 1px solid #edf0f4;
    font-size: 10px;
  }

  .booking-detail span {
    color: #7d8799;
  }

  .booking-detail strong {
    color: #334057;
    text-align: right;
  }

  .full {
    width: 100%;
    margin-top: 15px;
  }

  .trust-card {
    display: flex;
    gap: 11px;
    padding: 15px;
    border-radius: 15px;
    background: #f9fafc;
  }

  .trust-icon {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #eaf7ef;
    color: #2f8958;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .trust-card strong {
    display: block;
    color: #334057;
    font-size: 10px;
  }

  .trust-card p {
    margin: 3px 0 0;
    color: #808a9b;
    font-size: 9px;
    line-height: 1.5;
  }

  .state-card {
    max-width: 440px;
    margin: 100px auto;
    padding: 35px;
    border-radius: 18px;
    text-align: center;
  }

  .state-icon,
  .error-icon {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    margin: 0 auto 13px;
    border-radius: 14px;
  }

  .state-icon {
    background: #eef1ff;
    color: #4d63d2;
    font-weight: 800;
  }

  .error-icon {
    background: #fff0f0;
    color: #b34a4a;
    font-weight: 800;
  }

  .state-card h2 {
    margin: 0 0 6px;
    color: #283349;
    font-size: 20px;
  }

  .state-card p {
    margin: 0 0 18px;
    color: #788396;
    font-size: 11px;
    line-height: 1.5;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 22px;
    padding: 16px 2px 0;
    border-top: 1px solid #e0e5ed;
    color: #8a94a5;
    font-size: 9px;
  }

  @media (max-width: 850px) {
    .hero {
      grid-template-columns: auto 1fr;
    }

    .hero-side {
      grid-column: 1 / -1;
    }

    .content-grid {
      grid-template-columns: 1fr;
    }

    .side-column {
      position: static;
    }
  }

  @media (max-width: 580px) {
    .public-page {
      padding: 14px;
    }

    .topbar,
    .footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .header-book {
      width: 100%;
    }

    .hero {
      grid-template-columns: 1fr;
      padding: 22px;
    }

    .hero-side {
      grid-column: auto;
    }

    .hero h1 {
      font-size: 30px;
    }

    .card,
    .booking-card {
      padding: 19px;
    }
  }
`;
export default PublicProfile;