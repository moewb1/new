import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProviderServices.module.css";
import colors from "@/styles/colors";

const ALL_SERVICES = [
  { key: "waitress", label: "Waitress" },
  { key: "security", label: "Security" },
  { key: "hostess", label: "Hostess",  },
  { key: "merchandise", label: "Merchandise" },
  { key: "cleaning", label: "Cleaning"},
  { key: "driver", label: "Driver"},
  { key: "babysitting", label: "Babysitting" },
  { key: "chef", label: "Chef"},
  { key: "event_planner", label: "Event Planner" },
];

export default function ProviderServices() {
  const navigate = useNavigate();
  const profile = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("profile") || "{}"); }
    catch { return {}; }
  }, []);

  // Guard: if not provider, skip to bank
  useEffect(() => {
    if (profile?.role !== "provider") {
      navigate("/auth/BankDetails");
    }
  }, [profile, navigate]);

  const [selected, setSelected] = useState<string[]>(
    JSON.parse(localStorage.getItem("provider.services") || "[]")
  );
  const [submitted, setSubmitted] = useState(false);

  const toggle = (key: string) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const onContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (selected.length === 0) return;
    localStorage.setItem("provider.services", JSON.stringify(selected));
    navigate("/auth/BankDetails");
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Select Your Services</h1>
        <p className={styles.sub}>
          Choose what you provide. You can edit later from your profile.
        </p>
      </header>

      <form className={styles.box} onSubmit={onContinue} noValidate>
        <div className={styles.grid} role="group" aria-labelledby="services-legend">
          <span id="services-legend" className={styles.visuallyHidden}>
            Services list (select one or more)
          </span>

          {ALL_SERVICES.map((s) => {
            const isOn = selected.includes(s.key);
            return (
              <label
                key={s.key}
                className={`${styles.card} ${isOn ? styles.on : ""}`}
              >
                {/* Hidden checkbox keeps correct multi-select semantics & keyboard toggling */}
                <input
                  type="checkbox"
                  className={styles.srOnly}
                  checked={isOn}
                  onChange={() => toggle(s.key)}
                  aria-checked={isOn}
                  aria-label={s.label}
                />

                <span className={styles.pillContent}>
                  <span className={styles.emoji} aria-hidden="true">{s.emoji}</span>
                  <span className={styles.title}>{s.label}</span>
                </span>

                {/* Radio-style visual indicator (circular) */}
                <span
                  className={`${styles.radio} ${isOn ? styles.radioOn : ""}`}
                  aria-hidden="true"
                />
              </label>
            );
          })}
        </div>

        {submitted && selected.length === 0 && (
          <p className={styles.error} aria-live="polite">Pick at least one service.</p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            className={styles.primary}
            style={{ background: colors.accent, color: colors.white, opacity: selected.length ? 1 : 0.6 }}
            disabled={!selected.length}
            type="submit"
          >
            Continue
          </button>
        </div>
      </form>
    </section>
  );
}
