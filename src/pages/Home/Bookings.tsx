import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Bookings.module.css";

/* ---------- Types ---------- */
type BackendStatus =
  | "requested"
  | "paid"
  | "awaiting_payment"
  | "completed"
  | "cancelled"
  | "refunded";

type TabKey = "pending" | "completed" | "requests" | "cancelled";

type Booking = {
  id: string;
  title: string;
  services: string;
  fromISO: string;
  toISO: string;
  amountAED: number;
  status: BackendStatus;
};

/* ---------- Constants (mirror your mobile constants) ---------- */
const STATUS_LABELS: Record<BackendStatus, string> = {
  requested: "Requested",
  paid: "Paid",
  awaiting_payment: "Awaiting payment",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_TO_TAB: Record<BackendStatus, TabKey> = {
  requested: "requests",
  paid: "pending",
  awaiting_payment: "pending",
  completed: "completed",
  cancelled: "cancelled",
  refunded: "cancelled",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "requests", label: "Requests" },
  { key: "cancelled", label: "Cancelled" },
];

/* ---------- Helpers ---------- */
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

/* ---------- Seed to mirror your mobile STATIC_BOOKINGS ---------- */
function seedMobileLikeBookings(): Booking[] {
  const mk = (y: number, m: number, d: number, hh: number, mm = 0) =>
    new Date(Date.UTC(y, m - 1, d, hh, mm, 0)).toISOString();

  return [
    {
      id: "b1",
      title: "House Cleaning - 2BR",
      services: "Cleaner",
      fromISO: mk(2025, 9, 12, 7), // 10:00 AM local approx
      toISO: mk(2025, 9, 12, 10),  // 1:00 PM
      amountAED: 25000,
      status: "awaiting_payment",
    },
    {
      id: "b2",
      title: "Event Barista",
      services: "Barista",
      fromISO: mk(2025, 9, 14, 12), // 3:00 PM
      toISO: mk(2025, 9, 14, 18),   // 9:00 PM
      amountAED: 40000,
      status: "completed",
    },
    {
      id: "b3",
      title: "Electrical Fix",
      services: "Sockets replacement",
      fromISO: mk(2025, 8, 29, 8),  // 11:00 AM
      toISO: mk(2025, 8, 29, 10),   // 1:00 PM
      amountAED: 15000,
      status: "cancelled",
    },
    {
      id: "b4",
      title: "Deep Cleaning",
      services: "Cleaner x2, Floor polish",
      fromISO: mk(2025, 9, 2, 6),   // 9:00 AM
      toISO: mk(2025, 9, 2, 9, 30), // 12:30 PM
      amountAED: 35000,
      status: "refunded",
    },
    {
      id: "b5",
      title: "Booth Execution",
      services: "Setup",
      fromISO: mk(2025, 9, 20, 4),  // 7:00 AM
      toISO: mk(2025, 9, 20, 11),   // 2:00 PM
      amountAED: 70000,
      status: "paid",
    },
    {
      id: "b6",
      title: "Home Cleaning",
      services: "Cleaner",
      fromISO: mk(2025, 9, 9, 5),   // 8:00 AM
      toISO: mk(2025, 9, 9, 8),     // 11:00 AM
      amountAED: 22000,
      status: "requested",
    },
  ];
}

function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem("bookings.items.v2");
    if (raw) return JSON.parse(raw) as Booking[];
  } catch {}
  const seed = seedMobileLikeBookings();
  localStorage.setItem("bookings.items.v2", JSON.stringify(seed));
  return seed;
}

/* ---------- Component ---------- */
export default function Bookings() {
  const navigate = useNavigate();
  const bookings = useMemo(loadBookings, []);
  const [tab, setTab] = useState<TabKey>("pending");

  // Pagination + page-size tester
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(4);

  useEffect(() => { setPage(0); }, [tab, pageSize]);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { pending: 0, completed: 0, requests: 0, cancelled: 0 };
    bookings.forEach((b) => { c[STATUS_TO_TAB[b.status]] += 1; });
    return c;
  }, [bookings]);

  const list = useMemo(() => bookings.filter((b) => STATUS_TO_TAB[b.status] === tab), [bookings, tab]);

  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clamp = (n: number) => Math.min(Math.max(n, 0), pageCount - 1);
  const setPageSafe = (n: number) => setPage(clamp(n));

  const paged = useMemo(() => list.slice(page * pageSize, page * pageSize + pageSize), [list, page, pageSize]);

  const rangeStart = total ? page * pageSize + 1 : 0;
  const rangeEnd = Math.min((page + 1) * pageSize, total);

  const pageButtons = useMemo(() => {
    const btns: (number | "…")[] = [];
    if (pageCount <= 7) { for (let i = 0; i < pageCount; i++) btns.push(i); return btns; }
    const add = (n: number) => { if (!btns.includes(n)) btns.push(n); };
    add(0);
    if (page > 2) btns.push("…");
    for (let i = page - 1; i <= page + 1; i++) if (i > 0 && i < pageCount - 1) add(i);
    if (page < pageCount - 3) btns.push("…");
    add(pageCount - 1);
    return btns;
  }, [page, pageCount]);

  const stats = useMemo(() => {
    const spendStatuses: BackendStatus[] = ["paid", "completed"];
    const requestStatuses: BackendStatus[] = ["requested", "awaiting_payment"];
    const spend = bookings
      .filter((b) => spendStatuses.includes(b.status))
      .reduce((sum, b) => sum + b.amountAED, 0);
    const next = [...bookings]
      .filter((b) => requestStatuses.includes(b.status))
      .sort((a, b) => new Date(a.fromISO).getTime() - new Date(b.fromISO).getTime())[0] || null;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const awaiting = bookings.filter((b) => b.status === "awaiting_payment").length;
    return { spend, next, completed, awaiting };
  }, [bookings]);

  const handleRequestService = () => {
    navigate("/providers/s1?title=Deep%20Cleaning");
  };

  return (
    <section className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerL}>
          <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
          <div>
            <h1 className={styles.h1}>Bookings</h1>
          </div>
        </div>
      </div>

      {/* Tabs (neutral) */}
      <div className={styles.tabs} role="tablist" aria-label="Booking status">
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span className={styles.tabLabel}>{t.label}</span>
            <span className={styles.dot} />
            <span className={styles.count}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <ul className={styles.cardGrid} role="list">
        {paged.map(b => (
          <li key={b.id} className={styles.card} onClick={() => navigate(`/booking/${b.id}`)}>
            <div className={styles.cardTop}>
              <h3 className={styles.title}>{b.title}</h3>
              <span className={styles.badge}>
                <span className={`${styles.badgeDot} ${styles[`dot_${b.status}`]}`} />
                {STATUS_LABELS[b.status]}
              </span>
            </div>

            <div className={styles.meta}>
              <div className={styles.metaRow}>
                <span className={styles.k}>Service</span>
                <span className={styles.v}>{b.services}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.k}>Date & time</span>
                <span className={styles.v}>{fmtRange(b.fromISO, b.toISO)}</span>
              </div>
            </div>

            <div className={styles.footer}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalVal}>{fmtAED(b.amountAED)}</span>
            </div>
          </li>
        ))}

        {paged.length === 0 && (
          <li className={styles.empty}>No items in this status.</li>
        )}
      </ul>

      {/* Pagination */}
      {total > 0 && (
        <nav className={styles.pager} aria-label="Pagination">
          <div className={styles.pagerL}>
            <span className={styles.range}>{rangeStart}–{rangeEnd}</span>
            <span className={styles.of}>of</span>
            <span className={styles.total}>{total}</span>
            <span className={styles.sep}>•</span>
            <span className={styles.pgCount}>Page {page + 1} of {pageCount}</span>
          </div>

          <div className={styles.pagerR}>
            <button className={styles.pgBtn} onClick={() => setPageSafe(0)} disabled={page === 0} aria-label="First page">«</button>
            <button className={styles.pgBtn} onClick={() => setPageSafe(page - 1)} disabled={page === 0} aria-label="Previous page">‹</button>

            <div className={styles.pgNums}>
              {pageButtons.map((b, i) =>
                b === "…" ? (
                  <span key={`dots-${i}`} className={styles.ellipsis}>…</span>
                ) : (
                  <button
                    key={b}
                    className={`${styles.pgNum} ${b === page ? styles.pgNumActive : ""}`}
                    onClick={() => setPageSafe(b)}
                    aria-current={b === page ? "page" : undefined}
                  >
                    {b + 1}
                  </button>
                )
              )}
            </div>

            <button className={styles.pgBtn} onClick={() => setPageSafe(page + 1)} disabled={page >= pageCount - 1} aria-label="Next page">›</button>
            <button className={styles.pgBtn} onClick={() => setPageSafe(pageCount - 1)} disabled={page >= pageCount - 1} aria-label="Last page">»</button>
          </div>
        </nav>
      )}
    </section>
  );
}
