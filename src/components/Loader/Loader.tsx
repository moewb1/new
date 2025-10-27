import React from "react";
import styles from "./Loader.module.css";

type LoaderProps = {
  label?: string;
  subLabel?: string;
  fullScreen?: boolean;
};

const fallbackMessages = [
  "Finding perfect matches…",
  "Almost there…",
  "Rounding up the best…",
];

export default function Loader({
  label = "Where Talent Meets Opportunity",
  subLabel,
  fullScreen = false,
}: LoaderProps) {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    if (subLabel) return;
    const timer = window.setInterval(() => {
      setMessageIndex((idx) => (idx + 1) % fallbackMessages.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [subLabel]);

  const activeMessage = subLabel ?? fallbackMessages[messageIndex];

  return (
    <div className={styles.wrap} data-fullscreen={fullScreen ? "true" : "false"}>
      <div className={styles.logoScene} role="img" aria-label="Talent On Tap animated logo">
        <span className={styles.circleOne} />
        <span className={styles.circleTwo} />
        <span className={styles.circlePulse} />
        <span className={styles.logoMark}>
          <span className={styles.logoGlyphT}>t</span>
          <span className={styles.logoGlyphO}>o</span>
        </span>
      </div>
      <div className={styles.textBlock}>
        <p className={styles.title}>{label}</p>
        <p className={styles.sub}>{activeMessage}</p>
      </div>
    </div>
  );
}
