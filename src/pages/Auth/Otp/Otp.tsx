import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./Otp.module.css"; // ✅ match the file name's case
import colors from "@/styles/colors";
// ✅ type-only import for SlotProps (with verbatimModuleSyntax)
import { OTPInput, REGEXP_ONLY_DIGITS, type SlotProps } from "input-otp";

export default function Otp() {
  const [search] = useSearchParams();
  const email = search.get("email");
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const isComplete = otp.length === 6;

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

  const flowParam = (search.get("flow") || "").toLowerCase().trim();
  const flow = flowParam || (sessionStorage.getItem("onboardingFlow") || "login").toLowerCase().trim();
  const roleParam = search.get("role"); // "provider" | "consumer" | null
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
  
    // Save auth + role
    localStorage.setItem(
      "auth",
      JSON.stringify({ authenticated: true, verifiedAt: new Date().toISOString() })
    );
    if (roleParam) {
      const profile = JSON.parse(localStorage.getItem("profile") || "{}");
      profile.role = roleParam;
      localStorage.setItem("profile", JSON.stringify(profile));
    }
  
    if (flow === "signup") {
      navigate("/auth/LocationOnboarding");
    } else {
      navigate("/home");
    }
  };
  const handleResend = () => {
    if (secondsLeft > 0) return;
    // TODO: call resend API
    setMessage("We sent a new code to your email.");
    setSecondsLeft(60);
    setOtp("");
  };

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
            <button type="button" className={styles.resendBtn} onClick={handleResend}>
              Resend Code
            </button>
          )}
        </div>

        {message ? <p className={styles.info}>{message}</p> : null}
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
