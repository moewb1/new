import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AuthGateModal.module.css";
import type { AuthRole } from "@/utils/auth";

type AuthGateModalProps = {
  open: boolean;
  onClose: () => void;
  role?: AuthRole;
  title?: string;
  message?: string;
};

export default function AuthGateModal({
  open,
  onClose,
  role = "consumer",
  title = "Sign in to continue",
  message = "Create an account or sign in to finish this action.",
}: AuthGateModalProps) {
  const navigate = useNavigate();

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

  const createAuthPath = (base: string) => {
    if (!role) return base;
    const join = base.includes("?") ? "&" : "?";
    return `${base}${join}role=${encodeURIComponent(role)}`;
  };

  const handleLogin = () => {
    onClose();
    navigate(createAuthPath("/auth/login"));
  };

  const handleSignup = () => {
    onClose();
    navigate(createAuthPath("/auth/signup"));
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-gate-title"
        aria-describedby="auth-gate-message"
        onClick={(event) => event.stopPropagation()}
      >
        <button className={styles.close} type="button" onClick={onClose} aria-label="Close dialog">
          ×
        </button>
        <h2 id="auth-gate-title" className={styles.title}>
          {title}
        </h2>
        <p id="auth-gate-message" className={styles.message}>
          {message}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={handleLogin}>
            Log In
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={handleSignup}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
