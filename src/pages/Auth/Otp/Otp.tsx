import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import styles from "./Otp.module.css"; // ✅ match the file name's case
import colors from "@/styles/colors";
import { persistAuthenticatedSession } from "@/utils/authSession";
import { clearAuthState } from "@/utils/auth";
// ✅ type-only import for SlotProps (with verbatimModuleSyntax)
import { OTPInput, REGEXP_ONLY_DIGITS, type SlotProps } from "input-otp";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resendOtp as resendOtpThunk,
  setSignupForm,
  setLoginForm,
  type SignupPayload,
  type LoginPayload,
  verifyOtp as verifyOtpThunk,
  logout as logoutThunk,
} from "@/store/slices/authSlice";

export default function Otp() {
  const [search] = useSearchParams();
  const email = search.get("email");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const flowParam = (search.get("flow") || "").toLowerCase().trim();
  const flow = (flowParam || sessionStorage.getItem("onboardingFlow") || "login")
    .toLowerCase()
    .trim();
  const roleParam = search.get("role");
  const normalisedRole = roleParam === "provider" || roleParam === "consumer" ? roleParam : undefined;

  useRedirectIfAuthenticated(flow === "logout" ? null : "/home");
  useEffect(() => {
    console.log("[Otp] active flow:", flow);
  }, [flow]);

  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const isComplete = otp.length === 6;

  const signupFormState = useAppSelector((state) => state.auth.signupForm);
  const loginFormState = useAppSelector((state) => state.auth.loginForm);
  const verifyRequest = useAppSelector((state) => state.auth.verifyOtp);
  const resendRequest = useAppSelector((state) => state.auth.resendOtp);
  const logoutRequest = useAppSelector((state) => state.auth.logout);

  const [signupFormData, setSignupFormData] = useState<SignupPayload | null>(() => {
    const locState = location.state as { signupForm?: SignupPayload } | null;
    return locState?.signupForm ?? null;
  });
  const [loginFormData, setLoginFormData] = useState<LoginPayload | null>(() => {
    const locState = location.state as { loginForm?: LoginPayload } | null;
    return locState?.loginForm ?? null;
  });

  useEffect(() => {
    const locState = location.state as { signupForm?: SignupPayload } | null;
    if (locState?.signupForm) {
      setSignupFormData(locState.signupForm);
      dispatch(setSignupForm(locState.signupForm));
    }
    if (locState?.loginForm) {
      setLoginFormData(locState.loginForm);
      dispatch(setLoginForm(locState.loginForm));
    }
  }, [location.state, dispatch]);

  useEffect(() => {
    if (signupFormState) {
      setSignupFormData(signupFormState);
    }
  }, [signupFormState]);

  useEffect(() => {
    if (loginFormState) {
      setLoginFormData(loginFormState);
    }
  }, [loginFormState]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  const isSignupFlow = flow === "signup";
  const isLoginFlow = flow === "login";
  const isLogoutFlow = flow === "logout";

  const submitting = isLogoutFlow
    ? logoutRequest.status === "loading"
    : verifyRequest.status === "loading";
  const resendLoading = resendRequest.status === "loading";
  const verifyError = verifyRequest.error ?? null;
  const logoutError = logoutRequest.error ?? null;
  const resendError = resendRequest.error ?? null;
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || submitting) return;
    setLocalError(null);
    setMessage("");

    if (isSignupFlow) {
      const form = signupFormData;
      const role = form?.role ?? normalisedRole;
      if (!form || !role) {
        setLocalError("We could not find your signup details. Please start the signup process again.");
        return;
      }

      const result = await dispatch(
        verifyOtpThunk({
          email: form.email,
          otp,
          fname: form.fname,
          lname: form.lname,
          password: form.password,
          role,
        })
      );
      if (!verifyOtpThunk.fulfilled.match(result)) return;

      await persistAuthenticatedSession({
        response: result.payload as unknown,
        email: form.email,
        role,
        fname: form.fname,
        lname: form.lname,
      });

      dispatch(setSignupForm(null));
      navigate("/home", { replace: true });
      return;
    }

    if (isLoginFlow) {
      const form = loginFormData;
      const role = form?.role ?? normalisedRole;
      if (!form) {
        setLocalError("We could not find your login details. Please start the login process again.");
        return;
      }

      const result = await dispatch(
        verifyOtpThunk({
          email: form.email,
          otp,
          password: form.password,
          role,
          fname: form.fname,
          lname: form.lname,
        })
      );
      if (!verifyOtpThunk.fulfilled.match(result)) return;

      await persistAuthenticatedSession({
        response: result.payload as unknown,
        email: form.email,
        role,
        fname: form.fname,
        lname: form.lname,
      });

      dispatch(setLoginForm(null));
      navigate("/home", { replace: true });
      return;
    }

    if (isLogoutFlow) {
      const fallbackEmail =
        email ??
        loginFormData?.email ??
        signupFormData?.email ??
        (typeof localStorage !== "undefined"
          ? (() => {
              try {
                const profile = JSON.parse(localStorage.getItem("profile") || "{}");
                return typeof profile.email === "string" ? profile.email : undefined;
              } catch {
                return undefined;
              }
            })()
          : undefined);

      if (!fallbackEmail) {
        setLocalError("We could not determine your account email. Please log in again.");
        return;
      }

      const action = await dispatch(
        logoutThunk({
          email: fallbackEmail,
          otp,
        })
      );
      if (!logoutThunk.fulfilled.match(action)) return;

      try {
        ["auth", "profile", "location", "auth.token", "auth.refresh"].forEach((key) =>
          localStorage.removeItem(key)
        );
      } catch {
        /* ignore storage failures */
      }
      clearAuthState();
      dispatch(setSignupForm(null));
      dispatch(setLoginForm(null));
      navigate("/", { replace: true });
      return;
    }

    setLocalError("Unsupported verification flow. Please try again.");
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resendLoading) return;
    setLocalError(null);
    const profile = (() => {
      try {
        return JSON.parse(localStorage.getItem("profile") || "{}") as Record<string, unknown>;
      } catch {
        return {};
      }
    })();

    const profileRoleRaw = profile?.role;
    const profileRole =
      profileRoleRaw === "provider" || profileRoleRaw === "consumer" ? profileRoleRaw : undefined;
    const profileFname = (() => {
      if (typeof profile?.fname === "string") return profile.fname as string;
      if (typeof profile?.firstName === "string") return profile.firstName as string;
      return undefined;
    })();
    const profileLname = (() => {
      if (typeof profile?.lname === "string") return profile.lname as string;
      if (typeof profile?.lastName === "string") return profile.lastName as string;
      return undefined;
    })();
    const profileEmail = typeof profile?.email === "string" ? (profile.email as string) : undefined;

    const targetSignup = signupFormData;
    const targetLogin = loginFormData;

    const baseEmail =
      (isSignupFlow && targetSignup ? targetSignup.email : undefined) ??
      targetLogin?.email ??
      signupFormData?.email ??
      email ??
      profileEmail;

    if (!baseEmail) {
      setLocalError("We could not determine an email to resend the code. Please restart the process.");
      return;
    }

    const resolvedFname =
      targetSignup?.fname ??
      targetLogin?.fname ??
      profileFname ??
      (typeof signupFormData?.fname === "string" ? signupFormData.fname : undefined);
    const resolvedLname =
      targetSignup?.lname ??
      targetLogin?.lname ??
      profileLname ??
      (typeof signupFormData?.lname === "string" ? signupFormData.lname : undefined);

    if (!resolvedFname || !resolvedLname) {
      setLocalError("We need your first and last name to resend the code. Please restart the process.");
      return;
    }

    const action = await dispatch(
      resendOtpThunk({
        email: baseEmail,
        fname: resolvedFname,
        lname: resolvedLname,
        role: targetSignup?.role ?? targetLogin?.role ?? normalisedRole ?? profileRole,
      })
    );
    if (resendOtpThunk.fulfilled.match(action)) {
      setMessage("We sent a new code to your email.");
      setSecondsLeft(60);
      setOtp("");
      setLocalError(null);
    }
  };

  useEffect(() => {
    if (resendError) {
      setLocalError(resendError);
    }
  }, [resendError]);

  useEffect(() => {
    const primaryError = isLogoutFlow ? logoutError : verifyError;
    if (primaryError) {
      setLocalError(primaryError);
    }
  }, [verifyError, logoutError, isLogoutFlow]);

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Verify Code</h1>
      </header>

      <div className={styles.intro}>
        <p className={styles.desc}>
          Enter the 6-digit code{" "}
          {email ? <>we sent to <b>{email}</b>.</> : "we sent to your email."}
        </p>
      </div>

      <form onSubmit={handleVerify} className={styles.box}>
        <div className={styles.otpWrap} aria-label="One time password input">
          {/* numeric only */}
          <OTPInput
            value={otp}
            onChange={setOtp}
            maxLength={6}
            inputMode="numeric"
            pattern={REGEXP_ONLY_DIGITS}
            containerClassName={styles.otpContainer}
            render={({ slots }) => (
              <div className={styles.slots}>
                {slots.map((slot, idx) => (
                  <Slot key={idx} {...slot} />
                ))}
              </div>
            )}
          />
        </div>

        <button
          type="submit"
          className={styles.cta}
          style={{ background: colors.accent, color: colors.white, opacity: isComplete && !submitting ? 1 : 0.6 }}
          disabled={!isComplete || submitting}
          aria-disabled={!isComplete || submitting}
        >
          {submitting ? "Verifying…" : "Verify"}
        </button>

        <div className={styles.resendRow}>
          {secondsLeft > 0 ? (
            <span className={styles.resendHint}>
              Resend available in <b>{mmss}</b>
            </span>
          ) : (
            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending…" : "Resend Code"}
            </button>
          )}
        </div>

        {message ? <p className={styles.info}>{message}</p> : null}
        {localError ? (
          <p className={styles.error} role="alert">
            {localError}
          </p>
        ) : null}
      </form>

      <p className={styles.foot}>
        Wrong email? <a className={styles.link} href="/auth/login">Back to Log In</a>
      </p>
    </section>
  );
}

function Slot({ char, isActive, hasFakeCaret, placeholderChar }: SlotProps) {
  return (
    <div className={`${styles.slot} ${isActive ? styles.active : ""}`}>
      <div className={char ? styles.char : styles.placeholder}>
        {char ?? placeholderChar}
      </div>
      {hasFakeCaret && <div className={styles.caret} />}
    </div>
  );
}
