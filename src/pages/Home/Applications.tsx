import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Applications.module.css";

/* -------- Status & Types -------- */
type Status = "pending" | "accepted" | "rejected" | "withdrawn" | "expired";

type Application = {
  id: string;
  title: string;
  services: string;
  fromISO: string;
  toISO: string;
  amountAED: number;
  status: Status;
  appliedAtISO: string;
};

/* -------- Utils -------- */
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

const fmtAppliedAt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/* -------- Seed (mirrors your mobile sample) -------- */
function seedMobileLikeData(): Application[] {
  const mk = (y: number, m: number, d: number, hh: number, mm = 0) =>
    new Date(Date.UTC(y, m - 1, d, hh, mm, 0)).toISOString();

  return [
    {
      id: "a1",
      title: "House Cleaning - 2BR",
      services: "Cleaner",
      fromISO: mk(2025, 9, 12, 7),
      toISO: mk(2025, 9, 12, 10),
      amountAED: 25000,
      status: "pending",
      appliedAtISO: mk(2025, 9, 10, 6, 40),
    },
    {
      id: "a2",
      title: "Event Barista",
      services: "Barista",
      fromISO: mk(2025, 9, 14, 12),
      toISO: mk(2025, 9, 14, 18),
      amountAED: 40000,
      status: "accepted",
      appliedAtISO: mk(2025, 9, 11, 11, 15),
    },
    {
      id: "a3",
      title: "Electrical Fix",
      services: "Sockets replacement",
      fromISO: mk(2025, 8, 29, 8),
      toISO: mk(2025, 8, 29, 10),
      amountAED: 15000,
      status: "rejected",
      appliedAtISO: mk(2025, 8, 26, 14, 2),
    },
    {
      id: "a4",
      title: "Deep Cleaning",
      services: "Cleaner x2, Floor polish",
      fromISO: mk(2025, 9, 2, 6),
      toISO: mk(2025, 9, 2, 9, 30),
      amountAED: 35000,
      status: "withdrawn",
      appliedAtISO: mk(2025, 8, 30, 7, 20),
    },
    {
      id: "a5",
      title: "Booth Execution",
      services: "Setup",
      fromISO: mk(2025, 9, 20, 4),
      toISO: mk(2025, 9, 20, 11),
      amountAED: 70000,
      status: "expired",
      appliedAtISO: mk(2025, 9, 1, 5, 5),
    },
  ];
}

function loadApplications(): Application[] {
  try {
    const raw = localStorage.getItem("applications.items.v2");
    if (raw) return JSON.parse(raw) as Application[];
  } catch {}
  const seed = seedMobileLikeData();
  localStorage.setItem("applications.items.v2", JSON.stringify(seed));
  return seed;
}

/* -------- Tabs -------- */
const TABS: { key: Status; label: string }[] = [
  { key: "pending",   label: "Pending" },
  { key: "accepted",  label: "Accepted" },
  { key: "rejected",  label: "Rejected" },
  { key: "withdrawn", label: "Withdrawn" },
  { key: "expired",   label: "Expired" },
];

export default function Applications() {
  const navigate = useNavigate();
  const apps = useMemo(loadApplications, []);
  const [tab, setTab] = useState<Status>("pending");

  // Details sheet (full-screen)
  const [selected, setSelected] = useState<Application | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(4);

  useEffect(() => { setPage(0); }, [tab, pageSize]);

  const counts = useMemo(() => {
    const c: Record<Status, number> =
      { pending: 0, accepted: 0, rejected: 0, withdrawn: 0, expired: 0 };
    apps.forEach(a => { c[a.status] += 1; });
    return c;
  }, [apps]);

  const summary = useMemo(() => {
    const pipeline = apps.filter((a) => a.status === "pending").reduce((sum, a) => sum + a.amountAED, 0);
    const won = apps.filter((a) => a.status === "accepted").reduce((sum, a) => sum + a.amountAED, 0);
    const responseTime = apps.length
      ? Math.round(
          apps.reduce((sum, a) => sum + (Date.now() - new Date(a.appliedAtISO).getTime()), 0) /
            apps.length /
            (3600_000 * 24)
        )
      : 0;
    return { pipeline, won, responseTime };
  }, [apps]);

  const requestMoreWork = () => {
    navigate("/jobs/post");
  };

  const list = useMemo(() => apps.filter(a => a.status === tab), [apps, tab]);

  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clamp = (n: number) => Math.min(Math.max(n, 0), pageCount - 1);
  const setPageSafe = (n: number) => setPage(clamp(n));

  const paged = useMemo(
    () => list.slice(page * pageSize, page * pageSize + pageSize),
    [list, page, pageSize]
  );

  const rangeStart = total ? page * pageSize + 1 : 0;
  const rangeEnd = Math.min((page + 1) * pageSize, total);

  const pageButtons = useMemo(() => {
    // elegant compact: show first, last, and current±1 with ellipses
    const btns: (number | "…")[] = [];
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) btns.push(i);
      return btns;
    }
    const add = (n: number) => { if (!btns.includes(n)) btns.push(n); };
    add(0);
    if (page > 2) btns.push("…");
    for (let i = page - 1; i <= page + 1; i++) if (i > 0 && i < pageCount - 1) add(i);
    if (page < pageCount - 3) btns.push("…");
    add(pageCount - 1);
    return btns;
  }, [page, pageCount]);

  return (
    <section className={styles.page}>
      {/* Header bar */}
      <div className={styles.header}>
        <div className={styles.headerL}>
          <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
          <div>
            <h1 className={styles.h1}>Applications</h1>
          </div>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Open pipeline</span>
          <strong className={styles.summaryValue}>{fmtAED(summary.pipeline)}</strong>
          <span className={styles.summaryHint}>{counts.pending} pending application{counts.pending === 1 ? "" : "s"}</span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Won this month</span>
          <strong className={styles.summaryValue}>{fmtAED(summary.won)}</strong>
          <span className={styles.summaryHint}>{counts.accepted} accepted</span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Response speed</span>
          <strong className={styles.summaryValue}>
            {summary.responseTime > 0 ? `${summary.responseTime}d` : "Fast"}
          </strong>
          <span className={styles.summaryHint}>Average since applied</span>
        </article>
      </div>

      <div className={styles.requestBanner}>
        <div className={styles.requestCopy}>
          <span className={styles.requestEyebrow}>Need more opportunities?</span>
          <p className={styles.requestTitle}>Post a job to attract providers or browse open roles.</p>
        </div>
        <button type="button" className={styles.requestButton} onClick={requestMoreWork}>
          Create job request
        </button>
      </div>

      {/* Neutral tabs (no background colors) */}
      <div className={styles.tabs} role="tablist" aria-label="Application status">
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

      {/* Responsive grid */}
      <ul className={styles.cardGrid} role="list">
        {paged.map(a => (
          <li key={a.id} className={styles.card} onClick={() => setSelected(a)}>
            <div className={styles.cardTop}>
              <h3 className={styles.title}>{a.title}</h3>
              <span className={styles.badge}>
                <span className={`${styles.badgeDot} ${styles[`dot_${a.status}`]}`} />
                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              </span>
            </div>

            <div className={styles.meta}>
              <div className={styles.metaRow}>
                <span className={styles.k}>Service</span>
                <span className={styles.v}>{a.services}</span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.k}>Date & time</span>
                <span className={styles.v}>{fmtRange(a.fromISO, a.toISO)}</span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.k}>Applied</span>
                <span className={styles.v}>{fmtAppliedAt(a.appliedAtISO)}</span>
              </div>
            </div>

            <div className={styles.footer}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalVal}>{fmtAED(a.amountAED)}</span>
            </div>
          </li>
        ))}

        {paged.length === 0 && (
          <li className={styles.empty}>
            No items in this status.
          </li>
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

      {/* Full-screen details */}
      {selected && (
        <>
          <div className={styles.scrim} onClick={() => setSelected(null)} />
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Application details">
            <header className={styles.sheetHead}>
              <button className={styles.iconBtn} onClick={() => setSelected(null)} aria-label="Close">←</button>
              <h2 className={styles.sheetTitle}>{selected.title}</h2>
              <span />
            </header>

            <main className={styles.sheetBody}>
              <div className={styles.infoRow}>
                <span className={styles.k}>Service</span>
                <span className={styles.v}>{selected.services}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.k}>Date & time</span>
                <span className={styles.v}>{fmtRange(selected.fromISO, selected.toISO)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.k}>Applied on</span>
                <span className={styles.v}>{fmtAppliedAt(selected.appliedAtISO)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.k}>Status</span>
                <span className={styles.badge}>
                  <span className={`${styles.badgeDot} ${styles[`dot_${selected.status}`]}`} />
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </span>
              </div>

              <hr className={styles.hr} />

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalVal}>{fmtAED(selected.amountAED)}</span>
              </div>
            </main>

            <footer className={styles.sheetFoot}>
              <button className={styles.primary} onClick={() => { setSelected(null); navigate(`/jobs/${selected.id}`); }}>
                Open Job
              </button>
              <button className={styles.secondary} onClick={() => setSelected(null)}>
                Close
              </button>
            </footer>
          </div>
        </>
      )}
    </section>
  );
}
