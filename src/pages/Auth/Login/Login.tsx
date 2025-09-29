import React from "react";
import styles from "./Login.module.css";
import { Link, useNavigate, useSearchParams, createSearchParams } from "react-router-dom";
import colors from "@/styles/colors";
import { startGuestSession } from "@/utils/auth";

/* reuse the same assets you added for signup */
import appleLogo from "@/assets/Apple_logo.svg";
import googleLogo from "@/assets/Google_logo.svg.webp";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Initialize role from URL on mount
  React.useEffect(() => {
    const r = searchParams.get("role");
    if (r === "provider" || r === "consumer") setRole(r);
  }, [searchParams]);

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
    const params: Record<string, string> = {
      email: email,
      flow: "login",
    };
    if (role) params.role = role;
    navigate(`/auth/otp?${createSearchParams(params).toString()}`);
  };

  const handleGuest = React.useCallback(() => {
    if (role !== "consumer") return;
    try {
      localStorage.removeItem("profile");
      localStorage.removeItem("location");
    } catch {}
    startGuestSession("consumer");
    navigate("/home", { replace: true });
  }, [navigate, role]);

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
            onClick={() => {
              const params: Record<string, string> = {};
              if (email) params.email = email;
              if (role) params.role = role;
              const qs = Object.keys(params).length
                ? `?${createSearchParams(params).toString()}`
                : "";
              navigate(`/auth/forgot-password${qs}`);
            }}
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

      {role === "consumer" ? (
        <div className={styles.guestBlock}>
          <p className={styles.guestNote}>Just browsing? Continue as a guest.</p>
          <button type="button" className={styles.guestBtn} onClick={handleGuest}>
            Continue as Guest
          </button>
        </div>
      ) : null}

      {/* Quick static login (provider / consumer) */}
      {/* Removed Quick Login (Demo) buttons to avoid static role shortcuts */}

      <p className={styles.foot}>
        Not Registered Yet?{" "}
        <Link
          to={`/auth/signup${role ? `?role=${role}` : ""}`}
          className={styles.link}
        >
          Sign Up
        </Link>
      </p>
    </section>
  );
}
