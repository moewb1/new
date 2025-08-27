import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AuthEntry.module.css";
import AuthChoiceCard from "@/components/AuthChoiceCard/AuthChoiceCard";
import colors from "@/styles/colors";

type Role = "provider" | "consumer";

export default function AuthEntry() {
  const [role, setRole] = useState<Role | null>(null); // ⬅️ default: none selected
  const navigate = useNavigate();

  const onNext = () => {
    if (!role) return;
    navigate(`/auth/signup?role=${role}`);
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <h1 className={styles.h1}>Please Choose Once</h1>
        <p className={styles.tagline}>Select One And Tell Us Who Are You, Thanks!!</p>
      </div>

      {/* ARIA radio group for accessibility */}
      <div className={styles.grid} role="radiogroup" aria-label="Choose Your Role">
        <AuthChoiceCard
          title="Provider"
          emoji="🧰"
          selected={role === "provider"}
          onClick={() => setRole(role === "provider" ? null : "provider")} // ⬅️ toggle
        />
        <AuthChoiceCard
          title="Consumer"
          emoji="🛒"
          selected={role === "consumer"}
          onClick={() => setRole(role === "consumer" ? null : "consumer")} // ⬅️ toggle
        />
      </div>

      <div className={styles.infoList}>
        <div className={styles.infoItem}>
          <span className={styles.infoEmoji} aria-hidden>📝</span>
          <div>
            <h3 className={styles.infoTitle}>Explanation Of Available Services</h3>
            <p className={styles.infoDesc}>Waitress, Security, Hostess, Merchandise, Etc</p>
          </div>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoEmoji} aria-hidden>🧩</span>
          <div>
            <h3 className={styles.infoTitle}>We Offer You A Systems</h3>
            <p className={styles.infoDesc}>There Will Be Systems Of Payment Process, Chat Support, And Ratings</p>
          </div>
        </div>
      </div>

      <button
        className={styles.nextBtn}
        onClick={onNext}
        disabled={!role}
        type="button"
        style={{ background: colors.accent, color: colors.white }}
        aria-disabled={!role}
      >
        Next
      </button>
    </section>
  );
}
