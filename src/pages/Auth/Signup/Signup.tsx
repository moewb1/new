import React from "react";
import styles from "./Signup.module.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import colors from "@/styles/colors";
import { startGuestSession } from "@/utils/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetAuthRequests,
  signup as signupThunk,
  type SignupPayload,
} from "@/store/slices/authSlice";

/* your assets */
import appleLogo from "@/assets/Apple_logo.svg";
import googleLogo from "@/assets/Google_logo.svg.webp";

// safe className combiner
const cx = (...list: Array<string | false | null | undefined>) =>
  list.filter(Boolean).join(" ");

export default function Signup() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const signupRequest = useAppSelector((state) => state.auth.signup);

  const role = search.get("role"); // "provider" | "consumer" | null
  const roleLabel =
    role === "provider" ? "Service Provider" :
    role === "consumer" ? "Consumer" :
    null;
  const cta = roleLabel ? `Sign Up As ${roleLabel}` : "Sign Up";

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName]   = React.useState("");
  const [email, setEmail]         = React.useState("");
  const [password, setPassword]   = React.useState("");

  const [tFirst, setTFirst]   = React.useState(false);
  const [tLast, setTLast]     = React.useState(false);
  const [tEmail, setTEmail]   = React.useState(false);
  const [tPass, setTPass]     = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // --- validation rules ---
  const isValidFirst = firstName.trim().length >= 2;
  const isValidLast  = lastName.trim().length >= 2;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPass  = password.length >= 6;

  const showFirstErr = (tFirst  || submitted) && !isValidFirst;
  const showLastErr  = (tLast   || submitted) && !isValidLast;
  const showEmailErr = (tEmail  || submitted) && !isValidEmail;
  const showPassErr  = (tPass   || submitted) && !isValidPass;

  const isFormValid = isValidFirst && isValidLast && isValidEmail && isValidPass;

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

    const normalisedRole =
      role === "provider" || role === "consumer" ? role : undefined;

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
      { state: { signupForm: payload } }
    );
  };

  const isSubmitting = signupRequest.status === "loading";
  const signupError = signupRequest.error;

  return (
    <section className={styles.wrapper}>
      {/* Top title only */}
      <header className={styles.header}>
        <h1 className={styles.h1}>Sign Up</h1>
      </header>

      {/* Left-aligned intro right above the form */}
      <div className={styles.intro}>
        <p className={styles.desc}>Please Enter your Information and create your account</p>
      </div>

      <form className={styles.box} onSubmit={onSubmit} noValidate>
        {/* First name */}
        <label className={cx(styles.inputWrap, showFirstErr && styles.inputError)}>
          <input
            className={styles.input}
            placeholder="First Name"
            aria-label="First Name"
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

        {/* Last name */}
        <label className={cx(styles.inputWrap, showLastErr && styles.inputError)}>
          <input
            className={styles.input}
            placeholder="Last Name"
            aria-label="Last Name"
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

        {/* Email */}
        <label className={cx(styles.inputWrap, showEmailErr && styles.inputError)}>
          <input
            className={styles.input}
            placeholder="Enter Your Mail"
            type="email"
            aria-label="Enter Your Mail"
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

        {/* Password */}
        <label className={cx(styles.inputWrap, showPassErr && styles.inputError)}>
          <input
            className={styles.input}
            placeholder="Enter Your Password"
            type="password"
            aria-label="Enter Your Password"
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

        <button
          className={styles.cta}
          type="submit"
          style={{
            background: colors.accent,
            color: colors.white,
            opacity: isFormValid && !isSubmitting ? 1 : 0.6,
          }}
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
        <div className={styles.socialTitle}>Sign Up with</div>
        <div className={styles.socialRow}>
          <button type="button" className={styles.socialBtn} aria-label="Sign Up With Apple">
            <img src={appleLogo} alt="Apple" className={styles.logo} />
          </button>
          <button type="button" className={styles.socialBtn} aria-label="Sign Up With Google">
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
        Already have an Account?{" "}
        <Link to={`/auth/login${role ? `?role=${role}` : ""}`} className={styles.link}>Log In</Link>
      </p>
    </section>
  );
}
