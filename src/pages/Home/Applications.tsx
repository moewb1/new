import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Applications.module.css";

type Status = "pending" | "completed" | "requests" | "cancelled";

type Application = {
  id: string;
  title: string;      // job title you applied to
  service: string;    // category
  fromISO: string;    // interview/shift start (or application date)
  toISO: string;      // end time (if known)
  amountAED: number;  // expected/offer amount
  status: Status;
};

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

function loadApplications(): Application[] {
  try {
    const raw = localStorage.getItem("applications.items");
    if (raw) return JSON.parse(raw) as Application[];
  } catch {}
  const s1 = daysFromNow(-1, 11, 2);
  const s2 = daysFromNow(-4, 9, 6);
  const s3 = daysFromNow(2, 14, 3);
  const s4 = daysFromNow(-8, 8, 4);
  const seed: Application[] = [
    { id: "a1", title: "Barista (Morning)", service: "Barista", ...s1, amountAED: 160, status: "pending" },
    { id: "a2", title: "Event Planner Assistant", service: "Event Planner", ...s2, amountAED: 600, status: "completed" },
    { id: "a3", title: "Warehouse Merchandise", service: "Merchandise", ...s3, amountAED: 220, status: "requests" },
    { id: "a4", title: "Night Security", service: "Security", ...s4, amountAED: 380, status: "cancelled" },
  ];
  localStorage.setItem("applications.items", JSON.stringify(seed));
  return seed;
}

const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "requests", label: "Requests" },
  { key: "cancelled", label: "Cancelled" },
];

export default function Applications() {
  const navigate = useNavigate();
  const apps = useMemo(loadApplications, []);
  const [tab, setTab] = useState<Status>("pending");

  const counts = useMemo(() => {
    const c: Record<Status, number> = { pending: 0, completed: 0, requests: 0, cancelled: 0 };
    apps.forEach((a) => (c[a.status] += 1));
    return c;
  }, [apps]);

  const list = useMemo(() => apps.filter((a) => a.status === tab), [apps, tab]);

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
        <div>
          <h1 className={styles.h1}>Applications</h1>
          <p className={styles.sub}>Your job applications, mirrored by status.</p>
        </div>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Application status">
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`${styles.tab} ${styles[t.key]} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className={styles.count}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <ul className={styles.cardList} role="list">
        {list.map(a => (
          <li key={a.id} className={styles.card}>
            <div className={styles.rowTop}>
              <div className={styles.title}>{a.title}</div>
              <span className={`${styles.badge} ${styles[a.status]}`}>
                {a.status === "requests" ? "Request" : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              </span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Service</span>
              <span className={styles.value}>{a.service}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Date & time</span>
              <span className={styles.value}>{fmtRange(a.fromISO, a.toISO)}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.rowTotal}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{fmtAED(a.amountAED)}</span>
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
