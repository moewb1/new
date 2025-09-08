import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Payouts.module.css";

/* ---- Types + helpers ---- */
type Payout = {
  id: string;
  title: string;
  category:
    | "cleaning" | "waitress" | "security" | "hostess" | "driver"
    | "babysitting" | "chef" | "barista" | "event_planner" | "merchandise";
  dateISO: string;
  amountAED: number; // amount paid to user
};

const FALLBACK_IMAGES: Record<string, string> = {
  cleaning: "https://images.unsplash.com/photo-1581578017420-1660e4c4d6a5?q=80&w=300&auto=format&fit=crop",
  barista: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=300&auto=format&fit=crop",
  hostess: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?q=80&w=300&auto=format&fit=crop",
  security: "https://images.unsplash.com/photo-1544473244-f6895e69ad8b?q=80&w=300&auto=format&fit=crop",
  driver: "https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=300&auto=format&fit=crop",
  babysitting: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=300&auto=format&fit=crop",
  chef: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=300&auto=format&fit=crop",
  event_planner: "https://images.unsplash.com/photo-1521335629791-ce4aec67dd53?q=80&w=300&auto=format&fit=crop",
  merchandise: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=300&auto=format&fit=crop",
  waitress: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=300&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=300&auto=format&fit=crop",
};

const fmtAED = (v: number) =>
  `AED ${v.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function loadPayouts(): Payout[] {
  try {
    const raw = localStorage.getItem("wallet.payouts");
    if (raw) return JSON.parse(raw);
  } catch {}
  // Seed exists in Balance loader; fallback here as well
  const seed: Payout[] = [
    { id: "p1001", title: "Payout – Event Hostess", category: "hostess", dateISO: new Date().toISOString(), amountAED: 320 },
    { id: "p1000", title: "Payout – House Cleaners", category: "cleaning", dateISO: new Date(Date.now() - 6*864e5).toISOString(), amountAED: 180 },
  ];
  localStorage.setItem("wallet.payouts", JSON.stringify(seed));
  return seed;
}

export default function Payouts() {
  const navigate = useNavigate();
  const payouts = useMemo(loadPayouts, []);
  const totalPaid = useMemo(
    () => payouts.reduce((s, p) => s + (p.amountAED || 0), 0),
    [payouts]
  );

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
      <button className={styles.backBtn} onClick={() => navigate("/home")} aria-label="Back">←</button>
        <div>
          <h1 className={styles.h1}>Payouts</h1>
          <p className={styles.sub}>Money sent to your bank account.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.linkBtn} onClick={() => navigate("/profile/Balance")}>View Balance →</button>
        </div>
      </header>

      {/* Stat card */}
      <div className={styles.statCard}>
        <div className={styles.statLabel}>Payouts (AED)</div>
        <div className={styles.statValue}>{fmtAED(totalPaid)}</div>
        <div className={styles.statSub}>Total paid out to you</div>
      </div>

      <div className={styles.listHeader}>
        <h2 className={styles.h2}>Recent payouts</h2>
        <span className={styles.count}>{payouts.length}</span>
      </div>

      <ul className={styles.list} role="list">
        {payouts.map((p) => {
          const img = FALLBACK_IMAGES[p.category] || FALLBACK_IMAGES.default;
          return (
            <li key={p.id} className={styles.item}>
              <div className={styles.avatar}>
                <img src={img} alt="" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_IMAGES.default)} />
              </div>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{p.title}</div>
                <div className={styles.itemSub}>{fmtDate(p.dateISO)}</div>
              </div>
              <div className={styles.itemAmount}>{fmtAED(p.amountAED)}</div>
            </li>
          );
        })}
        {payouts.length === 0 && (
          <li className={styles.empty}>No payouts yet.</li>
        )}
      </ul>
    </section>
  );
}
