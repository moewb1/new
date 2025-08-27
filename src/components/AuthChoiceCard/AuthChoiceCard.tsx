import React from "react";
import styles from "./AuthChoiceCard.module.css";
import colors from "@/styles/colors";

type Props = {
  title: "Provider" | "Consumer";
  emoji: string;
  selected?: boolean;
  onClick: () => void;
};

export default function AuthChoiceCard({ title, emoji, selected, onClick }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      onClick={onClick}
      onKeyDown={(e) => { 
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={styles.card}
      data-selected={selected ? "true" : "false"}
      style={{
        backgroundColor: selected ? colors.accent : colors.white,
        color: colors.black,
      }}
      aria-label={title}
    >
      <span className={styles.emoji} aria-hidden="true">{emoji}</span>
      <span className={styles.title}>{title}</span>
    </button>
  );
}
