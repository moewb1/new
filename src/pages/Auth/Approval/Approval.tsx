import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./Approval.module.css";
import colors from "@/styles/colors";
import ContactUsModal from "@/components/ContactUsModal/ContactUsModal";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_URL,
} from "@/constants/contact";

export default function Approval() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const resolvedRole = (search.get("role") || localStorage.getItem("role") || (() => {
    try { return (JSON.parse(localStorage.getItem("profile") || "{}") || {}).role; } catch { return ""; }
  })() || "").toLowerCase() as
    | "provider"
    | "consumer"
    | "";

  const [message, setMessage] = useState<string>("");
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const role = resolvedRole;
  const title = useMemo(() => (role ? `${capitalize(role)} – Awaiting Approval` : "Awaiting Approval"), [role]);

  const openContact = () => setContactModalOpen(true);
  const closeContact = () => setContactModalOpen(false);

  function capitalize(s: string) {
    return s ? s[0].toUpperCase() + s.slice(1) : s;
  }

  const onRejected = () => {
    setMessage(
      role === "consumer"
        ? "Your profile was rejected because the provided contact information could not be verified."
        : "Your profile was rejected due to incomplete identity details."
    );
  };
  const onRequestChanges = () => {
    setMessage(
      role === "consumer"
        ? "Please update your phone number and add a valid address."
        : "Please upload a clearer ID photo and confirm your bank details."
    );
  };
  const onAccepted = () => {
    const profile = JSON.parse(localStorage.getItem("profile") || "{}") || {};
    if (role) profile.role = role;
    profile.approved = true;
    localStorage.setItem("profile", JSON.stringify(profile));
    // Mark as authenticated for demo
    localStorage.setItem("auth", JSON.stringify({ authenticated: true, approvedAt: new Date().toISOString() }));
    navigate("/home");
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.card}>
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.sub}>Thanks for signing up. We’re reviewing your application.</p>
      </header>

      <div className={styles.empty}>
        <svg viewBox="0 0 24 24" className={styles.bigIcon} fill="currentColor" style={{ color: colors.accent }}>
          <path d="M12 2l8 4v6c0 5-3.6 9.4-8 10-4.4-.6-8-5-8-10V6l8-4z"/>
        </svg>
        <div className={styles.title}>Awaiting manual approval</div>
        <p className={styles.desc}>For now, use the controls below to simulate the outcomes.</p>
        <div className={styles.row}>
          <button className={styles.ghost} onClick={onRejected}>Rejected</button>
          <button className={styles.ghost} onClick={onRequestChanges}>Request Changes</button>
          <button className={styles.btn} onClick={onAccepted}>Accepted → Go to Home</button>
        </div>
        <div className={styles.contactBlock}>
          <p className={styles.contactText}>
            Need a hand? Email us at
            {" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            {" "}
            or message us on WhatsApp at
            {" "}
            <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              {CONTACT_PHONE_DISPLAY}
            </a>
            .
          </p>
          <button className={styles.contactButton} onClick={openContact}>
            Contact support
          </button>
        </div>
        {message && <div className={styles.info}>{message}</div>}
      </div>

      <ContactUsModal open={contactModalOpen} onClose={closeContact} />
    </section>
  );
}
