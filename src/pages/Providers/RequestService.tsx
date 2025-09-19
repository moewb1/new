import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../Home/Home.module.css";
import {
  SERVICE_CATALOG,
  STATIC_PROVIDERS,
  PROVIDER_AVAILABILITY,
} from "./data";

function formatHoursLabel(hours: number) {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

const REQUESTS_KEY = "provider.serviceRequests";

type StoredRequest = {
  id: string;
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceTitle: string;
  date: string;
  slot: string;
  hours: number;
  notes?: string;
  totalMinor: number;
  createdAt: string;
};

function loadRequests(): StoredRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storeRequest(entry: StoredRequest) {
  try {
    const existing = loadRequests();
    existing.unshift(entry);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(existing));
  } catch {
    /* ignore */
  }
}

export default function RequestService() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const provider = id ? STATIC_PROVIDERS[id] : undefined;

  const providerServices = useMemo(() => {
    if (!provider) return [] as Array<{ id: string; title: string; hourlyRateMinor: number; description: string }>;
    return provider.serviceIds
      .map((sid) => SERVICE_CATALOG[sid])
      .filter(Boolean);
  }, [provider]);

  const availability = useMemo(() => (provider ? PROVIDER_AVAILABILITY[provider.id] || [] : []), [provider]);

  const [serviceId, setServiceId] = useState<string>(() => providerServices[0]?.id || "");
  const [hours, setHours] = useState<number>(2);
  const [date, setDate] = useState<string>(() => availability[0]?.date || "");
  const slotsForDate = useMemo(() => availability.find((entry) => entry.date === date)?.slots || [], [availability, date]);
  const [slot, setSlot] = useState<string>(() => slotsForDate[0] || "");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<StoredRequest | null>(null);

  const serviceInfo = serviceId ? SERVICE_CATALOG[serviceId] : undefined;
  const totalMinor = serviceInfo ? serviceInfo.hourlyRateMinor * hours : 0;

  useEffect(() => {
    if (slotsForDate.length === 0) {
      setSlot("");
    } else if (!slotsForDate.includes(slot)) {
      setSlot(slotsForDate[0]);
    }
  }, [slotsForDate, slot]);

  if (!provider) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div>
              <div className={styles.greeting}>Provider not found</div>
              <div className={styles.roleBadge}>Try another</div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const canSubmit = Boolean(serviceInfo && date && slot);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (success) {
      setSuccess(null);
    }
    if (!canSubmit || !serviceInfo) return;
    setSending(true);

    const entry: StoredRequest = {
      id: `req_${Date.now()}`,
      providerId: provider.id,
      providerName: provider.name,
      serviceId: serviceInfo.id,
      serviceTitle: serviceInfo.title,
      date,
      slot,
      hours,
      notes: notes.trim() || undefined,
      totalMinor: totalMinor || serviceInfo.hourlyRateMinor,
      createdAt: new Date().toISOString(),
    };

    storeRequest(entry);
    setSuccess(entry);
    setSending(false);
    setSubmitted(false);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.providerDetailHeader}>
        <div className={styles.providerDetailTop}>
          <img src={provider.avatar} alt="" className={styles.providerDetailAvatar} />
          <div>
            <h1 className={styles.providerDetailName}>Request {provider.name}</h1>
            <p className={styles.providerDetailMeta}>
              {provider.address ?? "Trusted provider"}
            </p>
          </div>
        </div>
        <div className={styles.providerDetailActions}>
          <button className={styles.secondaryBtn} type="button" onClick={() => navigate(-1)}>Back</button>
        </div>
      </header>

      {success ? (
        <div className={styles.centerRow}>
          <div className={styles.requestSuccessCard}>
          <div className={styles.requestSuccessIcon}>✓</div>
          <h2 className={styles.requestSuccessTitle}>Request sent</h2>
          <p className={styles.requestSuccessMessage}>
            {provider.name} will review your request for {success.serviceTitle}. We'll notify you once they respond.
          </p>
          <div className={styles.requestSuccessDetails}>
            <div>
              <span>Date</span>
              <strong>{success.date}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>{success.slot}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{formatHoursLabel(success.hours)}</strong>
            </div>
            <div>
              <span>Estimated</span>
              <strong>AED {(success.totalMinor / 100).toFixed(0)}</strong>
            </div>
          </div>
          <div className={styles.requestSuccessActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => navigate("/applications")}
            >
              View applications
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setSuccess(null)}
            >
              Send another request
            </button>
          </div>
          </div>
        </div>
      ) : (
        <form className={styles.centerRow} onSubmit={onSubmit}>
        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{ fontWeight: 900 }}>Choose a Service</span>
          </div>
          <div className={styles.listItem}>
            <div className={styles.providerServiceCards}>
              {providerServices.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  className={`${styles.providerServiceCard} ${svc.id === serviceId ? styles.serviceCardActive : ""}`}
                  onClick={() => setServiceId(svc.id)}
                >
                  <div className={styles.providerServiceTitle}>{svc.title}</div>
                  <div className={styles.providerServiceRate}>AED {(svc.hourlyRateMinor / 100).toFixed(0)}/hr</div>
                  <p className={styles.providerServiceDesc}>{svc.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{ fontWeight: 900 }}>Duration</span>
          </div>
          <div className={styles.listItem}>
            <div className={styles.hoursSliderRow}>
              <input
                type="range"
                min={1}
                max={8}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className={styles.hoursSlider}
              />
              <span className={styles.listText}>{formatHoursLabel(hours)}</span>
            </div>
          </div>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{ fontWeight: 900 }}>Availability</span>
          </div>
          <div className={styles.listItem}>
            <select
              className={styles.searchInput}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            >
              {availability.map((slotGroup) => (
                <option key={slotGroup.date} value={slotGroup.date}>
                  {slotGroup.date}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.listItem}>
            <select
              className={styles.searchInput}
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              {slotsForDate.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{ fontWeight: 900 }}>Notes (optional)</span>
          </div>
          <div className={styles.listItem}>
            <textarea
              className={styles.searchInput}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share any details or instructions for the provider"
              rows={3}
            />
          </div>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{ fontWeight: 900 }}>Summary</span>
          </div>
          <div className={styles.listItem}>
            <div className={styles.serviceSummary}>
              <span>{serviceInfo?.title ?? "Select a service"}</span>
              <span>{formatHoursLabel(hours)}</span>
              <span>{date || "Select date"} {slot ? `• ${slot}` : ""}</span>
            </div>
          </div>
          <div className={styles.listItem}>
            <span className={styles.listText}>Estimated total</span>
            <span className={styles.serviceCatalogRate}>
              {serviceInfo ? `AED ${(totalMinor / 100).toFixed(0)}` : "—"}
            </span>
          </div>
        </div>

        {submitted && !canSubmit && (
          <div className={styles.listGroup}>
            <div className={styles.listItem}>
              <span className={styles.listText}>Please choose a service and an available time slot.</span>
            </div>
          </div>
        )}

        <div className={styles.actionRow}>
          <button className={styles.primaryBtn} type="submit" disabled={!canSubmit || sending}>
            {sending ? "Sending…" : "Send request"}
          </button>
        </div>
      </form>
      )}
    </section>
  );
}
