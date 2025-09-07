import React from "react";
import styles from "./AuthChoiceCard.module.css";
import colors from "@/styles/colors";

type Props = {
  title: "Provider" | "Consumer";
  imgSrc: string;            // using hand.png for both
  selected?: boolean;
  onClick: () => void;
};

export default function AuthChoiceCard({ title, imgSrc, selected, onClick }: Props) {
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
      aria-label={title}
      style={{
        backgroundColor: selected ? colors.accent : "#fff",
        color: "#000",
      }}
    >
      <div className={styles.mediaWrap} aria-hidden="true">
        <img src={imgSrc} alt="" className={styles.img} />
      </div>
      <span className={styles.title}>{title}</span>
    </button>
  );
}
