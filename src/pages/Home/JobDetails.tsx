import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./JobDetails.module.css";

/* ---------- Types ---------- */
type Service = { id: string; label: string };
type JobDetails = {
  id: string;
  title: string;
  customerName: string;
  image?: string;
  fromISO: string;
  toISO: string;
  priceAED: number;
  description: string;
  services: Service[];
  coords: { lat: number; lng: number };
  address: string;
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

const durationLabel = (fromISO: string, toISO: string) => {
  const ms = new Date(toISO).getTime() - new Date(fromISO).getTime();
  const h = Math.max(1, Math.round(ms / 3_600_000));
  return `${h}h`;
};

/* ---------- Fallbacks/Seeds ---------- */
const FALLBACK_IMAGES: Record<string, string> = {
  cleaning:
    "https://media.istockphoto.com/id/654153664/photo/cleaning-service-sponges-chemicals-and-mop.jpg?s=612x612&w=0&k=20&c=vHQzKbz7L8oEKEp5oQzfx8rwsOMAV3pHTV_1VPZsREA=",
  barista:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
  hostess:
    "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?q=80&w=1200&auto=format&fit=crop",
  security:
    "https://images.unsplash.com/photo-1544473244-f6895e69ad8b?q=80&w=1200&auto=format&fit=crop",
  driver:
    "https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1200&auto=format&fit=crop",
  default:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop",
};

const DEFAULT_SERVICES: Record<string, Service[]> = {
  cleaning: [
    { id: "basic", label: "Basic Cleaning" },
    { id: "deep", label: "Deep Cleaning" },
    { id: "kitchen", label: "Kitchen Focus" },
  ],
  barista: [
    { id: "bar-setup", label: "Bar Setup" },
    { id: "latte-art", label: "Latte Art" },
    { id: "closing", label: "Closing Shift" },
  ],
  hostess: [
    { id: "greeting", label: "Guest Greeting" },
    { id: "seating", label: "Seating & Flow" },
    { id: "vip", label: "VIP Desk" },
  ],
  security: [
    { id: "patrol", label: "Patrol & Access" },
    { id: "entry", label: "Entry Control" },
    { id: "night", label: "Night Shift" },
  ],
  driver: [
    { id: "city", label: "City Ride" },
    { id: "airport", label: "Airport Pickup" },
    { id: "vip-driver", label: "VIP Driver" },
  ],
  default: [{ id: "standard", label: "Standard" }],
};

/* ---------- Tiny deterministic RNG from id ---------- */
function hashString(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const pick = <T,>(arr: T[], seed: string) => arr[hashString(seed) % arr.length];

/* ---------- Build from Home list if present ---------- */
function deriveFromHomeList(id: string): JobDetails | null {
  try {
    const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    const j = Array.isArray(jobs) ? jobs.find((x: any) => x.id === id) : null;
    if (!j) return null;

    const from = new Date();
    from.setHours(from.getHours() + 48, 0, 0, 0);
    const to = new Date(from.getTime() + 3 * 3600_000);

    const cat: string = j.category || "default";
    const svcs = DEFAULT_SERVICES[cat] || DEFAULT_SERVICES.default;
    const img = j.image || FALLBACK_IMAGES[cat] || FALLBACK_IMAGES.default;

    const perHour = Number(localStorage.getItem(`price.hr.${id}`)) || 80;
    const price = Math.max(50, perHour * 3);

    return {
      id,
      title: j.title || "Job",
      customerName: j.consumerName || "Customer",
      image: img,
      fromISO: from.toISOString(),
      toISO: to.toISOString(),
      priceAED: price,
      description:
        "We’re looking for a reliable professional. Please review the details and pick the service that fits best. Supplies available on site unless noted otherwise.",
      services: svcs,
      coords: { lat: 25.08, lng: 55.14 },
      address: "Dubai Marina, Dubai, UAE",
    };
  } catch {
    return null;
  }
}

/* ---------- Guaranteed stub when nothing exists ---------- */
function makeStubJob(id: string): JobDetails {
  const categories = ["cleaning", "barista", "hostess", "security", "driver"] as const;
  const cat = pick(categories as unknown as string[], `cat:${id}`);
  const titleByCat: Record<string, string> = {
    cleaning: "House Cleaning - 2BR",
    barista: "Barista (Morning Shift)",
    hostess: "Event Hostess",
    security: "Night Security",
    driver: "Private Driver",
  };
  const customerByCat: Record<string, string> = {
    cleaning: "Acme Holdings LLC",
    barista: "Café Latté",
    hostess: "Blue Events",
    security: "Azure Mall",
    driver: "H. Mansour",
  };

  const from = new Date();
  from.setDate(from.getDate() + 2);
  from.setHours(10, 0, 0, 0);
  const to = new Date(from.getTime() + 3 * 3600_000);

  const basePerHour = [70, 80, 90, 100][hashString(`p:${id}`) % 4];
  const price = basePerHour * 3; // ~3h

  return {
    id,
    title: titleByCat[cat] || "Sample Job",
    customerName: customerByCat[cat] || "Customer",
    image: FALLBACK_IMAGES[cat] || FALLBACK_IMAGES.default,
    fromISO: from.toISOString(),
    toISO: to.toISOString(),
    priceAED: price,
    description:
      "We’re looking for a professional to help with this job. Focus on quality and punctuality. Supplies available on site unless noted.",
    services: DEFAULT_SERVICES[cat] || DEFAULT_SERVICES.default,
    coords: { lat: 25.0805 + (hashString(`lat:${id}`) % 1000) / 100000, lng: 55.141 + (hashString(`lng:${id}`) % 1000) / 100000 },
    address: "Dubai Marina, Dubai, UAE",
  };
}

/* ---------- Loader with persistence ---------- */
function loadJobDetails(id: string): JobDetails {
  try {
    const raw = localStorage.getItem(`job.details.${id}`);
    if (raw) return JSON.parse(raw) as JobDetails;
  } catch {}

  const derived = deriveFromHomeList(id) ?? makeStubJob(id);

  // persist so subsequent opens are instant
  try { localStorage.setItem(`job.details.${id}`, JSON.stringify(derived)); } catch {}
  return derived;
}

/* ---------- Service option (web analogue of ServiceCard) ---------- */
function ServiceOption({
  svc,
  selected,
  onSelect,
}: {
  svc: Service;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.svc} ${selected ? styles.svcActive : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className={`${styles.radio} ${selected ? styles.radioOn : ""}`} />
      <span className={styles.svcLabel}>{svc.label}</span>
    </button>
  );
}

/* ---------- Page ---------- */
export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const job = useMemo(() => (id ? loadJobDetails(id) : makeStubJob("demo")), [id]);
  const [selectedService, setSelectedService] = useState<string>("");

  const timeRange = fmtRange(job.fromISO, job.toISO);
  const duration = durationLabel(job.fromISO, job.toISO);

  const openMaps = () => {
    const addr = encodeURIComponent(job.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, "_blank", "noreferrer");
  };

  const apply = () => {
    if (!selectedService) return;
    const label = job.services.find(s => s.id === selectedService)?.label || selectedService;
    window.alert(`Application sent\n\nJob: ${job.title}\nWith: ${label}`);
  };

  return (
    <section className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>Job Details</h1>
          <p className={styles.sub}>{job.customerName}</p>
        </div>
      </header>

      {/* Hero */}
      <div className={styles.heroRow}>
        <img src={job.image} alt="" className={styles.cover} />
        <div className={styles.heroText}>
          <h2 className={styles.title}>{job.title}</h2>
          <p className={styles.customer}>{job.customerName}</p>
        </div>
      </div>

      {/* Meta */}
      <section className={styles.card}>
        <div className={styles.metaRow}>
          <span className={styles.metaIcon} aria-hidden>🗓️</span>
          <span className={styles.timeText}>{timeRange} — {duration}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaIcon} aria-hidden>💵</span>
          <span className={styles.priceText}>{fmtAED(job.priceAED)}</span>
        </div>
      </section>

      {/* Description */}
      <section className={styles.card}>
        <h3 className={styles.sectionLabel}>Description</h3>
        <p className={styles.body}>{job.description}</p>
      </section>

      {/* Services */}
      <section className={styles.card}>
        <h3 className={styles.sectionLabel}>Select a service</h3>
        <div className={styles.svcList}>
          {job.services.map((svc) => (
            <ServiceOption
              key={svc.id}
              svc={svc}
              selected={selectedService === svc.id}
              onSelect={() => setSelectedService(svc.id)}
            />
          ))}
        </div>
      </section>

      {/* Address */}
      <section className={styles.card}>
        <h3 className={styles.sectionLabel}>Address</h3>
        <div className={styles.mapWrap}>
          <iframe
            title="map"
            className={styles.map}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              `${job.coords.lat},${job.coords.lng}`
            )}&z=14&output=embed`}
          />
          <button className={styles.mapBtn} onClick={openMaps}>Open in Maps</button>
        </div>
        <p className={styles.body}>{job.address}</p>
      </section>

      {/* Sticky footer */}
      <div className={styles.footer}>
        <button
          className={styles.primaryBtn}
          onClick={apply}
          disabled={!selectedService}
          aria-disabled={!selectedService}
        >
          Apply for this job
        </button>
      </div>
    </section>
  );
}
