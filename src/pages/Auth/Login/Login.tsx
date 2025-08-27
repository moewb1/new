import React from "react";
import styles from "./Login.module.css";
import { Link } from "react-router-dom";
import colors from "@/styles/colors";

/* reuse the same assets you added for signup */
import appleLogo from "@/assets/Apple_logo.svg";
import googleLogo from "@/assets/Google_logo.svg.webp";

export default function Login() {
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

      <form className={styles.box} onSubmit={(e) => e.preventDefault()}>
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

        <div className={styles.forgotRow}>
          <button type="button" className={styles.forgotBtn}>
            Forget Your Password?
          </button>
        </div>

        <button
          className={styles.cta}
          type="submit"
          style={{ background: colors.accent, color: colors.white }}
        >
          Log In
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

      <p className={styles.foot}>
        Not Registrar Yet?{" "}
        <Link to="/auth/signup" className={styles.link}>Sign Up</Link>
      </p>
    </section>
  );
}
