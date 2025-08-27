import React from "react";
import styles from "./Signup.module.css";
import { Link, useSearchParams } from "react-router-dom";
import colors from "@/styles/colors";

/* your assets */
import appleLogo from "@/assets/Apple_logo.svg";
import googleLogo from "@/assets/Google_logo.svg.webp";

export default function Signup() {
  const [search] = useSearchParams();
  const role = search.get("role"); // "provider" | "consumer" | null

  const roleLabel =
    role === "provider" ? "Service Provider" :
    role === "consumer" ? "Consumer" :
    null;

  const cta = roleLabel ? `Sign Up As ${roleLabel}` : "Sign Up";

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

      <form className={styles.box} onSubmit={(e) => e.preventDefault()}>
        <label className={styles.inputWrap}>
          <input
            className={styles.input}
            placeholder="Enter Your Name"
            aria-label="Enter Your Name"
          />
        </label>

        <label className={styles.inputWrap}>
          <input
            className={styles.input}
            placeholder="Enter Your Mail"
            type="email"
            aria-label="Enter Your Mail"
          />
        </label>

        <label className={styles.inputWrap}>
          <input
            className={styles.input}
            placeholder="Enter Your Password"
            type="password"
            aria-label="Enter Your Password"
          />
        </label>

        <button
          className={styles.cta}
          type="submit"
          style={{ background: colors.accent, color: colors.white }}
        >
          {cta}
        </button>
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

      <p className={styles.foot}>
        Already have an Account?{" "}
        <Link to="/auth/login" className={styles.link}>Log In</Link>
      </p>
    </section>
  );
}
