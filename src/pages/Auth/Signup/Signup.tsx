import React from "react";
import styles from "./Signup.module.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { startGuestSession } from "@/utils/auth";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetAuthRequests,
  signup as signupThunk,
  type SignupPayload,
} from "@/store/slices/authSlice";

import appleLogo from "@/assets/Apple_logo.svg";
import googleLogo from "@/assets/Google_logo.svg.webp";

const cx = (...list: Array<string | false | null | undefined>) => list.filter(Boolean).join(" ");

const languageOptions = ["English", "العربية", "हिन्दी"] as const;
type LanguageOption = (typeof languageOptions)[number];

export default function Signup() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const signupRequest = useAppSelector((state) => state.auth.signup);

  const role = search.get("role");
  useRedirectIfAuthenticated("/home");

  const roleLabel =
    role === "provider" ? "Service Provider" : role === "consumer" ? "Client" : null;
  const cta = roleLabel ? `Create account as ${roleLabel}` : "Create your account";

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [preferredLanguage, setPreferredLanguage] = React.useState<LanguageOption>("English");
  const [acceptTerms, setAcceptTerms] = React.useState(false);

  const [tFirst, setTFirst] = React.useState(false);
  const [tLast, setTLast] = React.useState(false);
  const [tEmail, setTEmail] = React.useState(false);
  const [tPass, setTPass] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const isValidFirst = firstName.trim().length >= 2;
  const isValidLast = lastName.trim().length >= 2;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPass = password.length >= 6;

  const showFirstErr = (tFirst || submitted) && !isValidFirst;
  const showLastErr = (tLast || submitted) && !isValidLast;
  const showEmailErr = (tEmail || submitted) && !isValidEmail;
  const showPassErr = (tPass || submitted) && !isValidPass;

  const isFormValid = isValidFirst && isValidLast && isValidEmail && isValidPass && acceptTerms;

  const handleGuest = React.useCallback(() => {
    if (role !== "consumer") return;
    try {
      localStorage.removeItem("profile");
      localStorage.removeItem("location");
    } catch {}
    startGuestSession("consumer");
    navigate("/home", { replace: true });
  }, [navigate, role]);

  React.useEffect(() => {
    dispatch(resetAuthRequests());
  }, [dispatch]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isFormValid || signupRequest.status === "loading") return;

    const normalisedRole = role === "provider" || role === "consumer" ? role : undefined;

    const payload: SignupPayload = {
      fname: firstName.trim(),
      lname: lastName.trim(),
      email: email.trim(),
      password,
      role: normalisedRole,
    };

    const result = await dispatch(signupThunk(payload));
    if (!signupThunk.fulfilled.match(result)) return;

    sessionStorage.setItem("onboardingFlow", "signup");

    navigate(
      `/auth/otp?email=${encodeURIComponent(payload.email)}&flow=signup${
        normalisedRole ? `&role=${normalisedRole}` : ""
      }`,
      { state: { signupForm: payload, preferredLanguage } }
    );
  };

  const isSubmitting = signupRequest.status === "loading";
  const signupError = signupRequest.error;

  return (
    <section className={styles.wrapper}>
      <div className={styles.progressHeader}>
        <div className={styles.progressCopy}>
          <span className={styles.progressLabel}>Step 1 of 3</span>
          <h1 className={styles.h1}>Join the Network</h1>
          <p className={styles.desc}>Takes 3 minutes. Start earning today.</p>
        </div>
        <div className={styles.progressBar}>
          <span className={styles.progressFill} aria-hidden="true" />
        </div>
      </div>

      <form className={styles.box} onSubmit={onSubmit} noValidate>
        <div className={styles.languageField}>
          <label htmlFor="signup-language">Preferred language</label>
          <select
            id="signup-language"
            className={styles.select}
            value={preferredLanguage}
            onChange={(event) => setPreferredLanguage(event.target.value as LanguageOption)}
          >
            {languageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <label className={cx(styles.inputWrap, showFirstErr && styles.inputError)}>
          <span className="visually-hidden">First Name</span>
          <input
            className={styles.input}
            placeholder="First name"
            aria-label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => setTFirst(true)}
            aria-invalid={showFirstErr || undefined}
            aria-describedby={showFirstErr ? "first-error" : undefined}
            required
          />
        </label>
        {showFirstErr && (
          <p id="first-error" className={styles.error}>
            First name must be at least 2 characters.
          </p>
        )}

        <label className={cx(styles.inputWrap, showLastErr && styles.inputError)}>
          <span className="visually-hidden">Last Name</span>
          <input
            className={styles.input}
            placeholder="Last name"
            aria-label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => setTLast(true)}
            aria-invalid={showLastErr || undefined}
            aria-describedby={showLastErr ? "last-error" : undefined}
            required
          />
        </label>
        {showLastErr && (
          <p id="last-error" className={styles.error}>
            Last name must be at least 2 characters.
          </p>
        )}

        <label className={cx(styles.inputWrap, showEmailErr && styles.inputError)}>
          <span className="visually-hidden">Email</span>
          <input
            className={styles.input}
            placeholder="Work email"
            type="email"
            aria-label="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTEmail(true)}
            autoComplete="email"
            aria-invalid={showEmailErr || undefined}
            aria-describedby={showEmailErr ? "email-error" : undefined}
            required
          />
        </label>
        {showEmailErr && (
          <p id="email-error" className={styles.error}>
            Please enter a valid email address.
          </p>
        )}

        <label className={cx(styles.inputWrap, showPassErr && styles.inputError)}>
          <span className="visually-hidden">Password</span>
          <input
            className={styles.input}
            placeholder="Create password"
            type="password"
            aria-label="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTPass(true)}
            autoComplete="new-password"
            aria-invalid={showPassErr || undefined}
            aria-describedby={showPassErr ? "password-error" : undefined}
            required
          />
        </label>
        {showPassErr && (
          <p id="password-error" className={styles.error}>
            Password must be at least 6 characters.
          </p>
        )}

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            required
          />
          <span>
            I agree to the
            {" "}
            <a href="#terms">Terms & Conditions</a>
            {" "}and
            {" "}
            <a href="#privacy">Privacy Policy</a>.
          </span>
        </label>

        <button
          className={styles.cta}
          type="submit"
          disabled={!isFormValid || isSubmitting}
          aria-disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Creating account…" : cta}
        </button>
        {signupError ? (
          <p className={styles.error} role="alert">
            {signupError}
          </p>
        ) : null}
      </form>

      <div className={styles.socialBlock}>
        <div className={styles.socialTitle}>Or sign up with</div>
        <div className={styles.socialRow}>
          <button type="button" className={styles.socialBtn} aria-label="Sign up with Apple">
            <img src={appleLogo} alt="Apple" className={styles.logo} />
          </button>
          <button type="button" className={styles.socialBtn} aria-label="Sign up with Google">
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

      <p className={styles.foot}>
        Already have an account?{" "}
        <Link to={`/auth/login${role ? `?role=${role}` : ""}`} className={styles.link}>
          Back to Business
        </Link>
      </p>

      <p className={styles.supportFoot}>Need help? WhatsApp our business line at +971 50 123 4567.</p>
    </section>
  );
}
