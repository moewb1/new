import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Bookings.module.css";

type Status = "pending" | "completed" | "requests" | "cancelled";

type Booking = {
  id: string;
  title: string;
  service: string;
  fromISO: string;
  toISO: string;
  amountAED: number;
  status: Status;
};

/* ---------- helpers ---------- */
const fmtAED = (v: number) =>
  `AED ${v.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const fmtRange = (fromISO: string, toISO: string) => {
  const a = new Date(fromISO);
  const b = new Date(toISO);
  const dA = a.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const dB = b.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const tA = a.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const tB = b.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return sameDay(a, b) ? `${dA} • ${tA} – ${tB}` : `${dA} ${tA} → ${dB} ${tB}`;
};

function daysFromNow(days: number, startHour = 10, durationHrs = 4) {
  const from = new Date();
  from.setDate(from.getDate() + days);
  from.setHours(startHour, 0, 0, 0);
  const to = new Date(from.getTime() + durationHrs * 3600_000);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}

/* ---------- storage with seed ---------- */
function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem("bookings.items");
    if (raw) return JSON.parse(raw) as Booking[];
  } catch {}
  const s1 = daysFromNow(1, 9, 3);
  const s2 = daysFromNow(-2, 12, 6);
  const s3 = daysFromNow(3, 18, 5);
  const s4 = daysFromNow(-6, 8, 4);
  const seed: Booking[] = [
    { id: "b1", title: "Apartment Deep Cleaning", service: "Cleaning", ...s1, amountAED: 260, status: "pending" },
    { id: "b2", title: "Private Driver – Morning", service: "Driver", ...s2, amountAED: 420, status: "completed" },
    { id: "b3", title: "Event Hostess – Gala", service: "Hostess", ...s3, amountAED: 520, status: "requests" },
    { id: "b4", title: "Night Security", service: "Security", ...s4, amountAED: 380, status: "cancelled" },
  ];
  localStorage.setItem("bookings.items", JSON.stringify(seed));
  return seed;
}

const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "requests", label: "Requests" },
  { key: "cancelled", label: "Cancelled" },
];

export default function Bookings() {
  const navigate = useNavigate();
  const bookings = useMemo(loadBookings, []);
  const [tab, setTab] = useState<Status>("pending");

  const counts = useMemo(() => {
    const c: Record<Status, number> = { pending: 0, completed: 0, requests: 0, cancelled: 0 };
    bookings.forEach((b) => (c[b.status] += 1));
    return c;
  }, [bookings]);

  const list = useMemo(() => bookings.filter((b) => b.status === tab), [bookings, tab]);

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
        <div>
          <h1 className={styles.h1}>Bookings</h1>
          <p className={styles.sub}>All your jobs, neatly grouped by status.</p>
        </div>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Booking status">
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className={styles.count}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <ul className={styles.cardList} role="list">
        {list.map(b => (
          <li key={b.id} className={styles.card}>
            <div className={styles.rowTop}>
              <div className={styles.title}>{b.title}</div>
              <span className={`${styles.badge} ${styles[b.status]}`}>
                {b.status === "requests" ? "Request" : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Service</span>
              <span className={styles.value}>{b.service}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Date & time</span>
              <span className={styles.value}>{fmtRange(b.fromISO, b.toISO)}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.rowTotal}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{fmtAED(b.amountAED)}</span>
            </div>
          </li>
        ))}

        {list.length === 0 && (
          <li className={styles.empty}>No items in this status.</li>
        )}
      </ul>
    </section>
  );
}
