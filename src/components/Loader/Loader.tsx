import React from "react";
import styles from "./Loader.module.css";
import colors from "@/styles/colors";
import { RingLoader } from "react-spinners";

type LoaderProps = {
  label?: string;
  subLabel?: string;
  /** Keep true if you want it centered in the viewport, still no bg. */
  fullScreen?: boolean;
  /** Adjust size if you want it even bigger */
  size?: number; // px
};

export default function Loader({
  label = "Loading",
  subLabel,
  fullScreen = false,
  size = 110, // BIG by default
}: LoaderProps) {
  return (
    <div
      className={styles.wrap}
      data-fullscreen={fullScreen ? "true" : "false"}
    >
      <RingLoader
        size={size}
        speedMultiplier={0.9}
        color={String((colors as any).accent ?? "#6b8e23")}
        aria-label="Loading indicator"
      />
      <div className={styles.textBlock}>
        <p className={styles.title} style={{ color: String((colors as any).black ?? "#000") }}>
          {label}
        </p>
        {subLabel ? (
          <p className={styles.sub} style={{ color: String((colors as any).black ?? "#000") }}>
            {subLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
