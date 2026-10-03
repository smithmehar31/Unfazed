import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post(
        "/auth/login",
        {
          email: email.trim().toLowerCase(),
          password,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to login."
        );
      }

      const therapist =
        response.data.therapist ||
        response.data.user;

      const token = response.data.token;

      if (!token || !therapist) {
        throw new Error(
          "Login response is missing account information."
        );
      }

      login(therapist, token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{css}</style>

      <div className="login-page">
        <div className="login-shell">
          <div className="brand">
            <div className="brand-mark">U</div>

            <div>
              <strong>Unfazed</strong>
              <span>Therapist workspace</span>
            </div>
          </div>

          <div className="login-grid">
            <section className="intro">
              <div className="eyebrow">WELCOME BACK</div>

              <h1>
                Your practice,
                <br />
                in one place.
              </h1>

              <p>
                Sign in to manage your clients, schedule, clinical
                notes, payments and practice insights.
              </p>

              <div className="feature-list">
                <div>
                  <span>✓</span>
                  Secure client management
                </div>

                <div>
                  <span>✓</span>
                  Simple scheduling & availability
                </div>

                <div>
                  <span>✓</span>
                  Clinical notes and analytics
                </div>
              </div>
            </section>

            <section className="login-card">
              <div className="card-top">
                <div className="eyebrow">THERAPIST LOGIN</div>
                <h2>Sign in</h2>
                <p>Enter your account details to continue.</p>
              </div>

              {error && (
                <div className="error-box">
                  <strong>Login failed</strong>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label>
                  Email
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </label>

                <button
                  className="login-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Login"}
                  <span>→</span>
                </button>
              </form>

              <div className="divider">
                <span>New to Unfazed?</span>
              </div>

              <button
                className="register-btn"
                type="button"
                onClick={() => navigate("/register")}
              >
                Create therapist account
              </button>
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
  .login-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 15% 15%, rgba(83,105,215,.11), transparent 30%),
      radial-gradient(circle at 85% 85%, rgba(83,105,215,.08), transparent 30%),
      #f4f6fa;
    color: #192338;
    padding: 24px;
    font-family: Inter, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .login-page * {
    box-sizing: border-box;
  }

  .login-shell {
    max-width: 1040px;
    margin: 0 auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e1e6ef;
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
    box-shadow: 0 7px 16px rgba(77,99,210,.18);
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

  .login-grid {
    min-height: calc(100vh - 155px);
    display: grid;
    grid-template-columns: 1.1fr .9fr;
    align-items: center;
    gap: 60px;
    padding: 40px 0;
  }

  .intro {
    padding-right: 20px;
  }

  .eyebrow {
    margin-bottom: 8px;
    color: #758096;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .intro h1 {
    margin: 0;
    color: #182238;
    font-size: clamp(38px, 5vw, 60px);
    line-height: 1.03;
    letter-spacing: -1.5px;
  }

  .intro > p {
    max-width: 520px;
    margin: 17px 0 0;
    color: #6b778a;
    font-size: 14px;
    line-height: 1.75;
  }

  .feature-list {
    display: grid;
    gap: 11px;
    margin-top: 25px;
  }

  .feature-list div {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #4f5b70;
    font-size: 11px;
  }

  .feature-list span {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #eaf7ef;
    color: #2f8757;
    font-size: 10px;
    font-weight: 800;
  }

  .login-card {
    padding: 29px;
    border: 1px solid #dfe5ee;
    border-radius: 21px;
    background: rgba(255,255,255,.97);
    box-shadow: 0 18px 45px rgba(29,39,67,.09);
  }

  .card-top h2 {
    margin: 0;
    color: #202b40;
    font-size: 28px;
  }

  .card-top p {
    margin: 6px 0 0;
    color: #7b8597;
    font-size: 11px;
  }

  .error-box {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin: 17px 0;
    padding: 11px 12px;
    border-radius: 10px;
    background: #fff2f2;
    border: 1px solid #efd5d5;
  }

  .error-box strong {
    color: #a23f3f;
    font-size: 10px;
  }

  .error-box span {
    color: #7f899b;
    font-size: 10px;
    line-height: 1.45;
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
    color: #263248;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  input:focus {
    border-color: #6073d8;
    box-shadow: 0 0 0 3px rgba(77,99,210,.1);
  }

  .login-btn,
  .register-btn {
    width: 100%;
    height: 44px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .login-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 14px;
    border: 1px solid #4d63d2;
    background: #4d63d2;
    color: #fff;
    box-shadow: 0 8px 18px rgba(77,99,210,.18);
  }

  .login-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .login-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 19px 0 13px;
    color: #98a0ae;
    font-size: 9px;
  }

  .divider::before,
  .divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e8ebf0;
  }

  .register-btn {
    border: 1px solid #d4dce7;
    background: #fff;
    color: #4d61c8;
  }

  .register-btn:hover {
    background: #f8f9fc;
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
    .login-page {
      padding: 15px;
    }

    .login-grid {
      grid-template-columns: 1fr;
      min-height: auto;
      gap: 30px;
      padding: 35px 0;
    }

    .intro {
      padding-right: 0;
    }

    .intro h1 {
      font-size: 40px;
    }

    footer {
      flex-direction: column;
    }
  }
`;
export default Login;