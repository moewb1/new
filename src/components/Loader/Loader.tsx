import React from "react";
import styles from "./Loader.module.css";
import colors from "../../styles/colors";

type LoaderProps = {
  label?: string;
  fullScreen?: boolean;
};

export default function Loader({ label = "Getting Things Ready…", fullScreen = false }: LoaderProps) {
  return (
    <div
      className={styles.wrap}
      data-fullscreen={fullScreen ? "true" : "false"}
      style={{ color: colors.accent }} // spinner uses currentColor
    >
      <div className={styles.card} role="status" aria-live="polite" aria-busy="true">
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.text} style={{ color: colors.black }}>
          {label}
        </p>
      </div>
    </div>
  );
}
