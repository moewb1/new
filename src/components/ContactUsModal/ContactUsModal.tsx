import React, { useEffect } from "react";
import styles from "./ContactUsModal.module.css";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_URL,
} from "@/constants/contact";
import { GmailIcon, WhatsAppIcon } from "@/components/icons/ContactIcons";

type ContactUsModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ContactUsModal({ open, onClose }: ContactUsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        aria-describedby="contact-modal-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close contact dialog">
          ×
        </button>
        <h2 id="contact-modal-title" className={styles.title}>
          Contact Us
        </h2>
        <p id="contact-modal-desc" className={styles.description}>
          Reach our support team anytime. We usually reply within one business day.
        </p>

        <div className={styles.actions}>
          <a
            className={`${styles.actionPrimary} ${styles.action}`}
            href={`mailto:${CONTACT_EMAIL}`}
            onClick={onClose}
          >
            <GmailIcon className={styles.actionIcon} />
            <span>{CONTACT_EMAIL}</span>
          </a>
          <a
            className={`${styles.actionSecondary} ${styles.action}`}
            href={CONTACT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
          >
            <WhatsAppIcon className={styles.actionIcon} />
            <span>{CONTACT_PHONE_DISPLAY}</span>
          </a>
        </div>

        <div className={styles.meta}>
          Prefer calling? Dial
          {" "}
          <a
            href={CONTACT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
          {" "}
          on WhatsApp.
        </div>
      </div>
    </div>
  );
}
