import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Transactions.module.css";

type Tx = {
  id: string;
  title: string;
  category:
    | "cleaning" | "waitress" | "security" | "hostess" | "driver"
    | "babysitting" | "chef" | "barista" | "event_planner" | "merchandise";
  dateISO: string;
  amountAED: number; // consumer spends -> negative, refunds -> positive
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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
const fmtAED = (v: number) => `AED ${Math.abs(v).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
const fmtDateShort = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const fmtDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

function loadTransactions(): Tx[] {
  try {
    const raw = localStorage.getItem("consumer.transactions");
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed: Tx[] = [
    { id: "ct1", title: "Booked House Cleaners", category: "cleaning", dateISO: daysAgo(2), amountAED: -420 },
    { id: "ct2", title: "Refund – Driver", category: "driver", dateISO: daysAgo(5), amountAED: 120 },
    { id: "ct3", title: "Barista – Morning Shift", category: "barista", dateISO: daysAgo(7), amountAED: -260 },
    { id: "ct4", title: "Chef – Weekend", category: "chef", dateISO: daysAgo(9), amountAED: -540 },
    { id: "ct5", title: "Event Planner Deposit", category: "event_planner", dateISO: daysAgo(12), amountAED: -680 },
    { id: "ct6", title: "Security – Night shift", category: "security", dateISO: daysAgo(13), amountAED: -380 },
    { id: "ct7", title: "Refund – Merchandise", category: "merchandise", dateISO: daysAgo(15), amountAED: 210 },
    { id: "ct8", title: "Driver – Airport drop", category: "driver", dateISO: daysAgo(17), amountAED: -190 },
    { id: "ct9", title: "Waitress – Event", category: "waitress", dateISO: daysAgo(19), amountAED: -320 },
    { id: "ct10", title: "Babysitting – Evening", category: "babysitting", dateISO: daysAgo(23), amountAED: -260 },
    { id: "ct11", title: "Cleaning top-up", category: "cleaning", dateISO: daysAgo(26), amountAED: -210 },
    { id: "ct12", title: "Partial refund – Barista", category: "barista", dateISO: daysAgo(28), amountAED: 160 },
  ];
  localStorage.setItem("consumer.transactions", JSON.stringify(seed));
  return seed;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "payments", label: "Payments" },
  { key: "refunds", label: "Refunds" },
] as const;

const PAGE_SIZE = 6;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function Transactions() {
  const navigate = useNavigate();
  const transactions = useMemo(loadTransactions, []);
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()),
    [transactions]
  );

  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const filtered = useMemo(() => {
    if (filter === "payments") return sorted.filter((tx) => tx.amountAED < 0);
    if (filter === "refunds") return sorted.filter((tx) => tx.amountAED >= 0);
    return sorted;
  }, [sorted, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = useMemo(() => filtered.slice(startIndex, startIndex + PAGE_SIZE), [filtered, startIndex]);

  const totals = useMemo(() => {
    const spent = filtered.filter((tx) => tx.amountAED < 0).reduce((sum, tx) => sum + Math.abs(tx.amountAED), 0);
    const refunded = filtered.filter((tx) => tx.amountAED >= 0).reduce((sum, tx) => sum + tx.amountAED, 0);
    return {
      spent,
      refunded,
      net: filtered.reduce((sum, tx) => sum + tx.amountAED, 0),
    };
  }, [filtered]);

  const onExport = useCallback(() => {
    if (!filtered.length) return;
    const headers = ["Reference", "Title", "Category", "Date", "Amount (AED)"];
    const rows = filtered.map((tx) => [
      tx.id,
      tx.title,
      tx.category,
      fmtDateLong(tx.dateISO),
      (tx.amountAED / 1).toString(),
    ]);
    const csv = [headers, ...rows]
      .map((cols) =>
        cols
          .map((col) => {
            const safe = String(col).replace(/"/g, '""');
            return `"${safe}` + '"';
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/home")} aria-label="Back">←</button>
        <div>
          <h1 className={styles.h1}>Transactions</h1>
          <p className={styles.sub}>Your recent payments and refunds.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.exportBtn} type="button" onClick={onExport}>
            Export CSV
          </button>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Spent (last 30 days)</span>
          <strong className={styles.summaryValue}>-{fmtAED(totals.spent)}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Refunded</span>
          <strong className={styles.summaryValue}>{fmtAED(totals.refunded)}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Net balance</span>
          <strong className={`${styles.summaryValue} ${totals.net < 0 ? styles.negative : totals.net > 0 ? styles.positive : ""}`}>
            {totals.net >= 0 ? "+" : "-"}{fmtAED(totals.net)}
          </strong>
        </article>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterChips} role="tablist" aria-label="Filter transactions">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`${styles.filterChip} ${filter === f.key ? styles.filterChipActive : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className={styles.tableHint}>
          Showing {filtered.length ? startIndex + 1 : 0}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length}
        </span>
      </div>

      <div className={styles.tableWrap}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No transactions yet.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Date</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => {
                const img = FALLBACK_IMAGES[t.category] || FALLBACK_IMAGES.default;
                const isDebit = t.amountAED < 0;
                return (
                  <tr key={t.id}>
                    <td>
                      <div className={styles.serviceCell}>
                        <span className={styles.serviceAvatar}>
                          <img
                            src={img}
                            alt=""
                            loading="lazy"
                            onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_IMAGES.default)}
                          />
                        </span>
                        <div className={styles.serviceText}>
                          <span className={styles.serviceTitle}>{t.title}</span>
                          <span className={styles.serviceCategory}>{t.category.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.datePrimary}>{fmtDateShort(t.dateISO)}</span>
                      <span className={styles.dateSecondary}>{fmtDateLong(t.dateISO)}</span>
                    </td>
                    <td className={isDebit ? styles.amountNegative : styles.amountPositive}>
                      {isDebit ? "-" : "+"} {fmtAED(t.amountAED)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
