import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post(
        "/auth/register",
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to create account."
        );
      }

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 900);
    } catch (error) {
      console.error("Register error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{css}</style>

      <div className="register-page">
        <div className="register-shell">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">U</div>

              <div>
                <strong>Unfazed</strong>
                <span>Therapist workspace</span>
              </div>
            </div>

            <button
              className="back-link"
              onClick={() => navigate("/")}
            >
              ← Home
            </button>
          </header>

          <div className="register-grid">
            <section className="intro">
              <div className="eyebrow">GET STARTED</div>

              <h1>
                Build your
                <br />
                practice workspace.
              </h1>

              <p>
                Create your therapist account and start managing
                your profile, availability, clients, notes and
                practice activity through Unfazed.
              </p>

              <div className="steps">
                <div>
                  <span>01</span>
                  Create your therapist account
                </div>

                <div>
                  <span>02</span>
                  Set up your professional profile
                </div>

                <div>
                  <span>03</span>
                  Start managing your practice
                </div>
              </div>
            </section>

            <section className="register-card">
              <div className="card-head">
                <div className="eyebrow">
                  THERAPIST REGISTRATION
                </div>

                <h2>Create account</h2>

                <p>
                  Set up your practice workspace in a few simple
                  steps.
                </p>
              </div>

              {error && (
                <div className="notice error">
                  <strong>Registration failed</strong>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="notice success">
                  <strong>Success</strong>
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label>
                  Full name
                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Dr. Sharma"
                    autoComplete="name"
                  />
                </label>

                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                </label>

                <button
                  className="register-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Register"}
                  <span>→</span>
                </button>
              </form>

              <div className="login-link">
                <span>Already have an account?</span>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
              </div>
            </section>
          </div>

          <footer>
            <span>Unfazed Practice Management</span>
            <span>Professional therapist workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .register-page {
    min-height: 100vh;
    background:
      radial-gradient(
        circle at 85% 15%,
        rgba(83,105,215,.11),
        transparent 30%
      ),
      radial-gradient(
        circle at 15% 85%,
        rgba(83,105,215,.08),
        transparent 30%
      ),
      #f4f6fa;
    color: #192338;
    padding: 24px;
    font-family: Inter, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .register-page * {
    box-sizing: border-box;
  }

  .register-shell {
    max-width: 1050px;
    margin: 0 auto;
  }

  .topbar {
    min-height: 62px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid #e1e6ef;
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
    box-shadow: 0 7px 16px rgba(77,99,210,.17);
  }

  .brand strong {
    display: block;
    color: #1d283d;
    font-size: 15px;
  }

  .brand span {
    display: block;
    margin-top: 2px;
    color: #7f899b;
    font-size: 9px;
  }

  .back-link {
    border: 0;
    background: transparent;
    color: #5064cf;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
  }

  .register-grid {
    min-height: calc(100vh - 145px);
    display: grid;
    grid-template-columns: 1.05fr .95fr;
    align-items: center;
    gap: 65px;
    padding: 42px 0;
  }

  .intro {
    max-width: 560px;
  }

  .eyebrow {
    margin-bottom: 8px;
    color: #748097;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .intro h1 {
    margin: 0;
    color: #182238;
    font-size: clamp(40px, 5vw, 61px);
    line-height: 1.02;
    letter-spacing: -1.6px;
  }

  .intro > p {
    max-width: 520px;
    margin: 18px 0 0;
    color: #6b778a;
    font-size: 14px;
    line-height: 1.75;
  }

  .steps {
    display: grid;
    gap: 11px;
    margin-top: 26px;
  }

  .steps div {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #4f5b70;
    font-size: 11px;
  }

  .steps span {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #eef1ff;
    color: #5165ce;
    font-size: 8px;
    font-weight: 800;
  }

  .register-card {
    padding: 30px;
    border: 1px solid #dfe5ee;
    border-radius: 21px;
    background: rgba(255,255,255,.97);
    box-shadow: 0 18px 45px rgba(29,39,67,.09);
  }

  .card-head h2 {
    margin: 0;
    color: #202b40;
    font-size: 28px;
  }

  .card-head p {
    margin: 6px 0 0;
    color: #7b8597;
    font-size: 11px;
    line-height: 1.5;
  }

  .notice {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 17px;
    padding: 11px 12px;
    border-radius: 10px;
  }

  .notice strong {
    font-size: 10px;
  }

  .notice span {
    font-size: 10px;
    line-height: 1.45;
  }

  .notice.error {
    background: #fff2f2;
    border: 1px solid #efd6d6;
  }

  .notice.error strong {
    color: #a13f3f;
  }

  .notice.error span {
    color: #7b8598;
  }

  .notice.success {
    background: #eef9f2;
    border: 1px solid #d4eadc;
  }

  .notice.success strong {
    color: #2f8254;
  }

  .notice.success span {
    color: #6f7e75;
  }

  form {
    margin-top: 21px;
  }

  label {
    display: block;
    margin-bottom: 15px;
    color: #344057;
    font-size: 10px;
    font-weight: 800;
  }

  input {
    width: 100%;
    height: 44px;
    margin-top: 7px;
    padding: 0 12px;
    border: 1px solid #d6dde8;
    border-radius: 10px;
    background: #fff;
    color: #273249;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  input:focus {
    border-color: #6073d8;
    box-shadow: 0 0 0 3px rgba(77,99,210,.1);
  }

  .register-btn {
    width: 100%;
    height: 44px;
    margin-top: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 14px;
    border: 1px solid #4d63d2;
    border-radius: 10px;
    background: #4d63d2;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(77,99,210,.16);
  }

  .register-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .register-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .login-link {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    margin-top: 19px;
    font-size: 10px;
  }

  .login-link span {
    color: #8a94a5;
  }

  .login-link button {
    border: 0;
    background: transparent;
    padding: 0;
    color: #4d61c8;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
  }

  footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding-top: 16px;
    border-top: 1px solid #e1e6ef;
    color: #8a94a5;
    font-size: 9px;
  }

  @media (max-width: 800px) {
    .register-page {
      padding: 15px;
    }

    .register-grid {
      grid-template-columns: 1fr;
      min-height: auto;
      gap: 32px;
      padding: 35px 0;
    }

    .intro h1 {
      font-size: 41px;
    }

    footer {
      flex-direction: column;
    }
  }
`;
export default Register;