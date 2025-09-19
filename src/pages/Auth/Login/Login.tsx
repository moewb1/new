import React from "react";
import styles from "./Login.module.css";
import { Link, useNavigate } from "react-router-dom";
import colors from "@/styles/colors";

/* reuse the same assets you added for signup */
import appleLogo from "@/assets/Apple_logo.svg";
import googleLogo from "@/assets/Google_logo.svg.webp";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"provider" | "consumer" | "">("");

  const [touchedEmail, setTouchedEmail] = React.useState(false);
  const [touchedPassword, setTouchedPassword] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPass = password.length >= 6;
  const formValid = isValidEmail && isValidPass;

  const showEmailError = (touchedEmail || submitted) && !isValidEmail;
  const showPassError = (touchedPassword || submitted) && !isValidPass;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!formValid || submitting) return;

    // TODO: call your real login API here
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700)); // simulate
    setSubmitting(false);

    // 2FA step -> go to OTP
    sessionStorage.setItem("onboardingFlow", "login");
    const roleQS = role ? `&role=${role}` : "";
    navigate(`/auth/otp?email=${encodeURIComponent(email)}&flow=login${roleQS}`);
  };

  return (
    <section className={styles.wrapper}>
      {/* Top title only */}
      <header className={styles.header}>
        <h1 className={styles.h1}>Log In</h1>
      </header>

      {/* Left-aligned intro sitting right above the form */}
      <div className={styles.intro}>
        <h2 className={styles.h2}>Welcome Back</h2>
        <p className={styles.desc}>
          Log in to find and book services that meet your needs
        </p>
      </div>

      <form className={styles.box} onSubmit={onSubmit} noValidate>
        {/* Optional role selection for login */}
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 800, opacity: .85 }}>Log in as</div>
          <div className={styles.segment} role="tablist" aria-label="Login role">
            <button
              type="button"
              role="tab"
              aria-selected={role === 'provider'}
              className={`${styles.segBtn} ${role === 'provider' ? styles.segActive : ''}`}
              onClick={() => setRole(role === 'provider' ? '' : 'provider')}
            >
              Provider
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === 'consumer'}
              className={`${styles.segBtn} ${role === 'consumer' ? styles.segActive : ''}`}
              onClick={() => setRole(role === 'consumer' ? '' : 'consumer')}
            >
              Consumer
            </button>
          </div>
        </div>
        <label className={`${styles.inputWrap} ${showEmailError ? styles.inputError : ""}`}>
          <input
            className={styles.input}
            placeholder="Enter Your Mail"
            type="email"
            aria-label="Enter Your Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouchedEmail(true)}
            autoComplete="email"
            aria-invalid={showEmailError || undefined}
            aria-describedby={showEmailError ? "email-error" : undefined}
            required
          />
        </label>
        {showEmailError && (
          <p id="email-error" className={styles.error}>Please enter a valid email address.</p>
        )}

        <label className={`${styles.inputWrap} ${showPassError ? styles.inputError : ""}`}>
          <input
            className={styles.input}
            placeholder="Enter Your Password"
            type="password"
            aria-label="Enter Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouchedPassword(true)}
            autoComplete="current-password"
            aria-invalid={showPassError || undefined}
            aria-describedby={showPassError ? "password-error" : undefined}
            required
          />
        </label>
        {showPassError && (
          <p id="password-error" className={styles.error}>Password must be at least 6 characters.</p>
        )}

        <div className={styles.forgotRow}>
          <button
            type="button"
            className={styles.forgotBtn}
            onClick={() => navigate(`/auth/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`)}
          >
            Forgot Password?
          </button>
        </div>

        <button
          className={styles.cta}
          type="submit"
          style={{
            background: colors.accent,
            color: colors.white,
            opacity: formValid && !submitting ? 1 : 0.6,
          }}
          disabled={!formValid || submitting}
          aria-disabled={!formValid || submitting}
        >
          {submitting ? "Logging In…" : "Log In"}
        </button>
      </form>

      <div className={styles.socialBlock}>
        <div className={styles.socialTitle}>Log In with</div>
        <div className={styles.socialRow}>
          <button type="button" className={styles.socialBtn} aria-label="Log In With Apple">
            <img src={appleLogo} alt="Apple" className={styles.logo} />
          </button>
          <button type="button" className={styles.socialBtn} aria-label="Log In With Google">
            <img src={googleLogo} alt="Google" className={styles.logo} />
          </button>
        </div>
      </div>

      {/* Quick static login (provider / consumer) */}
      <div className={styles.socialBlock}>
        <div className={styles.socialTitle}>Quick Login (Demo)</div>
        <div className={styles.socialRow}>
          <button
            type="button"
            className={styles.socialBtn}
            onClick={() => {
              localStorage.setItem("auth", JSON.stringify({ authenticated: true }));
              const p = JSON.parse(localStorage.getItem("profile") || "{}") || {};
              p.role = "provider";
              localStorage.setItem("profile", JSON.stringify(p));
              navigate("/home");
            }}
          >
            Provider
          </button>
          <button
            type="button"
            className={styles.socialBtn}
            onClick={() => {
              localStorage.setItem("auth", JSON.stringify({ authenticated: true }));
              const p = JSON.parse(localStorage.getItem("profile") || "{}") || {};
              p.role = "consumer";
              localStorage.setItem("profile", JSON.stringify(p));
              navigate("/home");
            }}
          >
            Consumer
          </button>
        </div>
      </div>

      <p className={styles.foot}>
        Not Registered Yet?{" "}
        <Link to="/auth/signup" className={styles.link}>Sign Up</Link>
      </p>
    </section>
  );
}
