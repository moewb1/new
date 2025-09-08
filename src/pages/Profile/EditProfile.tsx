import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EditProfile.module.css";
import colors from "@/styles/colors";

type Profile = {
  role?: "provider" | "consumer";
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  email?: string;
};

export default function EditProfile() {
  const navigate = useNavigate();

  const storedProfile = useMemo<Profile>(() => {
    try { return JSON.parse(localStorage.getItem("profile") || "{}"); }
    catch { return {}; }
  }, []);

  const storedIdentity = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("kyc.identity") || "{}"); }
    catch { return {}; }
  }, []);

  const [firstName, setFirstName] = useState(storedProfile.firstName || "");
  const [lastName, setLastName]   = useState(storedProfile.lastName || "");
  const [phone, setPhone]         = useState(storedProfile.phone || storedIdentity.phone || "");
  const [email, setEmail]         = useState(storedProfile.email || "");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // hydration for "name" preview if only "name" existed
    if (!firstName && !lastName && storedProfile.name) {
      const [fn, ...rest] = storedProfile.name.split(" ");
      setFirstName(fn || "");
      setLastName(rest.join(" ").trim());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emailOk = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const phoneOk = useMemo(() => {
    if (!phone) return false;
    // Simple sanity check (allow +, digits, spaces, dashes, parentheses)
    const raw = phone.replace(/[^\d+]/g, "");
    return /^\+?\d{7,15}$/.test(raw);
  }, [phone]);

  const firstOk = (firstName || "").trim().length >= 2;
  const lastOk  = (lastName || "").trim().length >= 2;
  const allOk   = firstOk && lastOk && phoneOk && emailOk;

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!allOk) return;

    const next: Profile = {
      ...storedProfile,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName} ${lastName}`.trim(),
      phone: phone.trim(),
      email: email.trim(),
    };

    localStorage.setItem("profile", JSON.stringify(next));
    navigate("/home");
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
        <div>
          <h1 className={styles.h1}>Edit Profile</h1>
          <p className={styles.sub}>Update your basic details. Changes reflect across the app.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Form */}
        <form className={styles.card} onSubmit={onSave} noValidate>
          <div className={styles.row}>
            <label className={styles.label}>First name</label>
            <input
              className={`${styles.input} ${submitted && !firstOk ? styles.inputError : ""}`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Maya"
              autoComplete="given-name"
              required
            />
            {submitted && !firstOk && <p className={styles.error}>Enter at least 2 characters.</p>}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Last name</label>
            <input
              className={`${styles.input} ${submitted && !lastOk ? styles.inputError : ""}`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Khalid"
              autoComplete="family-name"
              required
            />
            {submitted && !lastOk && <p className={styles.error}>Enter at least 2 characters.</p>}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Mobile number</label>
            <input
              className={`${styles.input} ${submitted && !phoneOk ? styles.inputError : ""}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 5X XXX XXXX"
              inputMode="tel"
              autoComplete="tel"
              required
            />
            {submitted && !phoneOk && <p className={styles.error}>Enter a valid phone number.</p>}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Email</label>
            <input
              className={`${styles.input} ${submitted && !emailOk ? styles.inputError : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
            />
            {submitted && !emailOk && <p className={styles.error}>Enter a valid email address.</p>}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => navigate("/home")}>
              Cancel
            </button>
            <button
              className={styles.primary}
              style={{ background: colors.accent, color: colors.white, opacity: allOk ? 1 : 0.6 }}
              disabled={!allOk}
              type="submit"
            >
              Save changes
            </button>
          </div>
        </form>

        {/* Live Preview */}
        <aside className={styles.preview}>
          <div className={styles.previewHeader}>Preview</div>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>{(firstName || "U")[0].toUpperCase()}</div>
            <div className={styles.profileMeta}>
              <div className={styles.profileName}>
                {(firstName || lastName) ? `${firstName} ${lastName}`.trim() : "Your Name"}
              </div>
              <div className={styles.profileRow}>{email || "you@example.com"}</div>
              <div className={styles.profileRow}>{phone || "+971 5X XXX XXXX"}</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
