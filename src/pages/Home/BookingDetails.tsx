import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./BookingDetails.module.css";

/* ---------- Types (matching your list) ---------- */
type BackendStatus =
  | "requested"
  | "paid"
  | "awaiting_payment"
  | "completed"
  | "cancelled"
  | "refunded";

type Booking = {
  id: string;
  title: string;
  services: string;
  fromISO: string;
  toISO: string;
  amountAED: number;
  status: BackendStatus;
};

/* ---------- Labels ---------- */
const STATUS_LABELS: Record<BackendStatus, string> = {
  requested: "Requested",
  paid: "Paid",
  awaiting_payment: "Awaiting payment",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

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

function loadBookingById(id: string): Booking | null {
  try {
    const raw = localStorage.getItem("bookings.items.v2");
    if (!raw) return null;
    const list = JSON.parse(raw) as Booking[];
    return list.find(b => b.id === id) ?? null;
  } catch {
    return null;
  }
}

function deriveBookedOn(fromISO: string): string {
  const d = new Date(new Date(fromISO).getTime() - 2 * 24 * 3600_000);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function getAddress(b: Booking | null): string {
  if (!b) return "";
  if (b.id === "b1") return "6391 Elgin St. Celina, Delaware";
  return "Dubai, United Arab Emirates";
}

/* ---------- Component ---------- */
export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const booking = useMemo(() => (id ? loadBookingById(id) : null), [id]);

  if (!booking) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
          <h1 className={styles.h1}>Booking</h1>
        </header>
        <div className={styles.missing}>Booking not found.</div>
      </section>
    );
  }

  const bookedOn = deriveBookedOn(booking.fromISO);
  const address = getAddress(booking);

  // Payout calc (mirrors mobile sample)
  const gross = booking.amountAED;
  const platformFeeRate = 0.12;
  const withholdingRate = 0.05;
  const platformFee = Math.round(gross * platformFeeRate);
  const withholding = Math.round(gross * withholdingRate);
  const net = Math.max(0, gross - platformFee - withholding);

  return (
    <section className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>Booking</h1>
          <p className={styles.sub}>#{booking.id}</p>
        </div>
      </header>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span className={`${styles.badgeDot} ${styles[`dot_${booking.status}`]}`} />
        <span className={styles.statusText}>{STATUS_LABELS[booking.status]}</span>
        <span className={styles.sep}>•</span>
        <span className={styles.statusHint}>You’ll receive updates by email</span>
      </div>

      {/* Congrats / info card */}
      <section className={styles.softCard}>
        <div className={styles.softMain}>
          <h2 className={styles.softTitle}>Congratulations!</h2>
          <p className={styles.softSub}>Your booking is active.</p>
        </div>
        <div className={styles.kvRow}>
          <span className={styles.kvKey}>Booked on</span>
          <span className={styles.kvVal}>{bookedOn}</span>
        </div>
      </section>

      {/* Booking Details */}
      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Booking Details</h3>
        <div className={styles.infoRow}>
          <span className={styles.k}>Package</span>
          <span className={styles.v}>{booking.title}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.k}>Service</span>
          <span className={styles.v}>{booking.services}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.k}>Time</span>
          <span className={styles.v}>{fmtRange(booking.fromISO, booking.toISO)}</span>
        </div>
      </section>

      {/* Payout Summary */}
      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Payout Summary</h3>
        <div className={styles.moneyRow}>
          <span className={styles.moneyLabel}>You receive</span>
          <span className={styles.moneyValue}>{fmtAED(net)}</span>
        </div>
        <div className={styles.breakdown}>
          <div className={styles.brItem}><span>Gross</span><span>{fmtAED(gross)}</span></div>
          <div className={styles.brItem}><span>Platform fee (12%)</span><span>-{fmtAED(platformFee)}</span></div>
          <div className={styles.brItem}><span>Withholding (5%)</span><span>-{fmtAED(withholding)}</span></div>
        </div>
      </section>

      {/* Location */}
      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Service Location</h3>
        <div className={styles.address}>{address}</div>
        <a
          className={styles.mapBtn}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noreferrer"
        >
          Open in Maps
        </a>
      </section>
    </section>
  );
}
