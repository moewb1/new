import React from "react";
import styles from "./Login.module.css";
import { Link, createSearchParams, useNavigate, useSearchParams } from "react-router-dom";
import { startGuestSession } from "@/utils/auth";
import { persistAuthenticatedSession } from "@/utils/authSession";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  login as loginThunk,
  type LoginPayload,
  resetAuthRequests,
} from "@/store/slices/authSlice";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";

import appleLogo from "@/assets/Apple_logo.svg";
import googleLogo from "@/assets/Google_logo.svg.webp";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const loginRequest = useAppSelector((state) => state.auth.login);

  useRedirectIfAuthenticated("/home");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"provider" | "consumer" | "">("");

  const [touchedEmail, setTouchedEmail] = React.useState(false);
  const [touchedPassword, setTouchedPassword] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPass = password.length >= 6;
  const formValid = isValidEmail && isValidPass;

  const showEmailError = (touchedEmail || submitted) && !isValidEmail;
  const showPassError = (touchedPassword || submitted) && !isValidPass;
  const isSubmitting = loginRequest.status === "loading";
  const loginError = loginRequest.error;

  React.useEffect(() => {
    const r = searchParams.get("role");
    if (r === "provider" || r === "consumer") setRole(r);
  }, [searchParams]);

  React.useEffect(() => {
    dispatch(resetAuthRequests());
  }, [dispatch]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!formValid || loginRequest.status === "loading") return;

    const payload: LoginPayload = {
      email: email.trim(),
      password,
    };
    if (role) payload.role = role;

    const result = await dispatch(loginThunk(payload));
    if (!loginThunk.fulfilled.match(result)) return;

    await persistAuthenticatedSession({
      response: result.payload as unknown,
      email: payload.email,
      role: payload.role ?? (role === "" ? undefined : role),
    });

    navigate("/home", { replace: true });
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
      <header className={styles.header}>
        <h1 className={styles.h1}>Back to Business</h1>
        <p className={styles.sub}>Log in to keep your crew and bookings moving.</p>
      </header>

      <form className={styles.box} onSubmit={onSubmit} noValidate>
        <div className={styles.roleToggle} role="tablist" aria-label="Select account type">
          <button
            type="button"
            className={styles.roleButton}
            data-active={role === "consumer" ? "true" : "false"}
            onClick={() => setRole("consumer")}
          >
            Client
          </button>
          <button
            type="button"
            className={styles.roleButton}
            data-active={role === "provider" ? "true" : "false"}
            onClick={() => setRole("provider")}
          >
            Service Provider
          </button>
        </div>

        <label className={`${styles.inputWrap} ${showEmailError ? styles.inputError : ""}`}>
          <span className="visually-hidden">Work email</span>
          <input
            className={styles.input}
            placeholder="Work email"
            type="email"
            aria-label="Work email"
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
          <p id="email-error" className={styles.error}>
            Please enter a valid email address.
          </p>
        )}

        <label className={`${styles.inputWrap} ${showPassError ? styles.inputError : ""}`}>
          <span className="visually-hidden">Password</span>
          <input
            className={styles.input}
            placeholder="Password"
            type="password"
            aria-label="Password"
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
          <p id="password-error" className={styles.error}>
            Password must be at least 6 characters.
          </p>
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
            Forgot password?
          </button>
        </div>

        <button
          className={styles.cta}
          type="submit"
          disabled={!formValid || isSubmitting}
          aria-disabled={!formValid || isSubmitting}
        >
          {isSubmitting ? "Signing you in…" : "Enter the dashboard"}
        </button>
        {loginError ? (
          <p className={styles.error} role="alert">
            {loginError}
          </p>
        ) : null}
      </form>

      <div className={styles.socialBlock}>
        <div className={styles.socialTitle}>Or continue with</div>
        <div className={styles.socialRow}>
          <button type="button" className={styles.socialBtn} aria-label="Log in with Apple">
            <img src={appleLogo} alt="Apple" className={styles.logo} />
          </button>
          <button type="button" className={styles.socialBtn} aria-label="Log in with Google">
            <img src={googleLogo} alt="Google" className={styles.logo} />
          </button>
        </div>
      </div>

      {role === "consumer" ? (
        <div className={styles.guestBlock}>
          <p className={styles.guestNote}>Need a quick preview? Continue as a guest.</p>
          <button type="button" className={styles.guestBtn} onClick={handleGuest}>
            Guest view
          </button>
        </div>
      ) : null}

      <p className={styles.foot}>
        New here?{" "}
        <Link to={`/auth/signup${role ? `?role=${role}` : ""}`} className={styles.link}>
          Create an account
        </Link>
      </p>

      <p className={styles.supportFoot}>Securely encrypted • Trusted by UAE venues • WhatsApp +971 50 123 4567</p>
    </section>
  );
}
