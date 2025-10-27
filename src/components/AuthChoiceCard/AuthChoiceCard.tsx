import React from "react";
import styles from "./AuthChoiceCard.module.css";

type Role = "provider" | "consumer";

type Props = {
  role: Role;
  label: string;
  description: string;
  highlight: string;
  roleBadge: string;
  selected?: boolean;
  onSelect: (role: Role) => void;
};

export default function AuthChoiceCard({
  role,
  label,
  description,
  highlight,
  roleBadge,
  selected,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      onClick={() => onSelect(role)}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          onSelect(role);
        }
      }}
      className={`${styles.card} brand-spotlight`}
      data-selected={selected ? "true" : "false"}
      aria-label={label}
    >
      <span className={styles.roleBadge}>{roleBadge}</span>
      <span className={styles.highlight}>{highlight}</span>
      <h3 className={styles.title}>{label}</h3>
      <p className={styles.description}>{description}</p>
      <span className={styles.cta} aria-hidden="true">
        {selected ? "Selected" : "Tap to choose"}
      </span>
    </button>
  );
}
