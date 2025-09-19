import React from "react";
import styles from "./Login.module.css"; // OK to reuse
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import colors from "@/styles/colors";

// tiny helper to compose classNames safely
const cx = (...list: Array<string | false | null | undefined>) =>
  list.filter(Boolean).join(" ");

export default function ForgetPassword() {
  const [search] = useSearchParams();
  const prefillEmail = search.get("email") ?? "";
  const role = search.get("role");

  const navigate = useNavigate();
  const [email, setEmail] = React.useState(prefillEmail);
  const [touched, setTouched] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [info, setInfo] = React.useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showError = (touched || submitted) && !isValidEmail;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValidEmail || submitting) return;

    // TODO: call your real "send reset email" API
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setInfo("If an account exists, a reset link has been sent to your email.");
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Forgot Password</h1>
      </header>

      <div className={styles.intro}>
        <p className={styles.desc}>
          Enter your email and we’ll send you a reset link.
        </p>
      </div>

      <form className={styles.box} onSubmit={onSubmit} noValidate>
        <label className={cx(styles.inputWrap, showError && styles.inputError)}>
          <input
            className={styles.input}
            placeholder="Enter Your Mail"
            type="email"
            aria-label="Enter Your Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            autoComplete="email"
            aria-invalid={showError || undefined}
            aria-describedby={showError ? "fp-email-error" : undefined}
            required
          />
        </label>
        {showError && (
          <p id="fp-email-error" className={styles.error}>
            Please enter a valid email address.
          </p>
        )}

        <button
          className={styles.cta}
          type="submit"
          style={{
            // make sure tokens are strings at runtime
            background: String((colors as any).accent ?? "#000"),
            color: String((colors as any).white ?? "#fff"),
            opacity: isValidEmail && !submitting ? 1 : 0.6,
          }}
          disabled={!isValidEmail || submitting}
          aria-disabled={!isValidEmail || submitting}
        >
          {submitting ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      {info && <p className={styles.foot}>{info}</p>}

      <p className={styles.foot}>
        Remembered it?{" "}
        <Link to={`/auth/login${role ? `?role=${role}` : ""}`} className={styles.link}>Back to Log In</Link>
      </p>
    </section>
  );
}
