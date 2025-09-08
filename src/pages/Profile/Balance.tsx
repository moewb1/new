import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Balance.module.css";

/* ---- Types ---- */
type Tx = {
  id: string;
  title: string;
  category:
    | "cleaning" | "waitress" | "security" | "hostess" | "driver"
    | "babysitting" | "chef" | "barista" | "event_planner" | "merchandise";
  dateISO: string;
  amountAED: number; // positive earning
};

/* ---- Helpers ---- */
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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
const fmtAED = (v: number) =>
  `AED ${v.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/* ---- Storage loaders (seed once) ---- */
function loadTransactions(): Tx[] {
  try {
    const raw = localStorage.getItem("wallet.transactions");
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed: Tx[] = [
    { id: "t1", title: "Event Hostess Shift", category: "hostess", dateISO: daysAgo(1), amountAED: 320 },
    { id: "t2", title: "House Cleaners", category: "cleaning", dateISO: daysAgo(3), amountAED: 180 },
    { id: "t3", title: "Private Driver", category: "driver", dateISO: daysAgo(2), amountAED: 450 },
    { id: "t4", title: "Barista (morning)", category: "barista", dateISO: daysAgo(5), amountAED: 150 },
    { id: "t5", title: "Night Security", category: "security", dateISO: daysAgo(4), amountAED: 400 },
  ];
  localStorage.setItem("wallet.transactions", JSON.stringify(seed));
  return seed;
}
type Payout = { id: string; title: string; category: Tx["category"]; dateISO: string; amountAED: number };
function loadPayouts(): Payout[] {
  try {
    const raw = localStorage.getItem("wallet.payouts");
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed: Payout[] = [
    { id: "p1001", title: "Payout – Event Hostess", category: "hostess", dateISO: daysAgo(2), amountAED: 320 },
    { id: "p1000", title: "Payout – House Cleaners", category: "cleaning", dateISO: daysAgo(6), amountAED: 180 },
  ];
  localStorage.setItem("wallet.payouts", JSON.stringify(seed));
  return seed;
}

export default function Balance() {
  const navigate = useNavigate();
  const transactions = useMemo(loadTransactions, []);
  const payouts = useMemo(loadPayouts, []);

  const totalEarnings = useMemo(
    () => transactions.reduce((s, t) => s + (t.amountAED || 0), 0),
    [transactions]
  );
  const totalPaidOut = useMemo(
    () => payouts.reduce((s, p) => s + (p.amountAED || 0), 0),
    [payouts]
  );
  const currentBalance = Math.max(0, totalEarnings - totalPaidOut);

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/home")} aria-label="Back">←</button>
        <div>
          <h1 className={styles.h1}>Balance</h1>
          <p className={styles.sub}>Track your earnings across jobs.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.linkBtn} onClick={() => navigate("/profile/Payouts")}>View Payouts →</button>
        </div>
      </header>

      {/* Stat card */}
      <div className={styles.statCard}>
        <div className={styles.statLabel}>Balance (AED)</div>
        <div className={styles.statValue}>{fmtAED(currentBalance)}</div>
        <div className={styles.statSub}>Your current balance</div>
      </div>

      {/* List */}
      <div className={styles.listHeader}>
        <h2 className={styles.h2}>Recent earnings</h2>
        <span className={styles.count}>{transactions.length}</span>
      </div>
      <ul className={styles.list} role="list">
        {transactions.map((t) => {
          const img = FALLBACK_IMAGES[t.category] || FALLBACK_IMAGES.default;
          return (
            <li key={t.id} className={styles.item}>
              <div className={styles.avatar}>
                <img src={img} alt="" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_IMAGES.default)} />
              </div>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{t.title}</div>
                <div className={styles.itemSub}>{fmtDate(t.dateISO)}</div>
              </div>
              <div className={styles.itemAmount}>+ {fmtAED(t.amountAED)}</div>
            </li>
          );
        })}
        {transactions.length === 0 && (
          <li className={styles.empty}>No earnings yet.</li>
        )}
      </ul>
    </section>
  );
}
