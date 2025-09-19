import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./JobDetails.module.css";
import {
  CONSUMER_JOBS_UPDATED_EVENT,
  getJobById,
  listCountryMeta,
  type DemoApplication,
  type DemoJob,
} from "@/data/demoJobs";
import CountryFlag from "react-country-flag";

const formatCurrency = (minor: number, currency: string) => {
  const major = minor / 100;
  return `${currency} ${major.toLocaleString("en-AE", { minimumFractionDigits: 2 })}`;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatRange = (fromISO: string, toISO: string) => {
  const start = new Date(fromISO);
  const end = new Date(toISO);
  const dateA = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const dateB = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeA = start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const timeB = end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return isSameDay(start, end)
    ? `${dateA} • ${timeA} – ${timeB}`
    : `${dateA} ${timeA} → ${dateB} ${timeB}`;
};

const formatDuration = (fromISO: string, toISO: string) => {
  const diffMs = new Date(toISO).getTime() - new Date(fromISO).getTime();
  const minutes = Math.max(60, Math.round(diffMs / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!mins) return `${hours}h`;
  if (!hours) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

const formatSubmitted = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const jobStatusMeta: Record<DemoJob["status"], { label: string }> = {
  open: { label: "Active" },
  in_progress: { label: "In progress" },
  completed: { label: "Completed" },
  closed: { label: "Closed" },
  draft: { label: "Draft" },
};

const appStatusMeta: Record<DemoApplication["status"], { label: string; tone: "pending" | "accepted" | "rejected" }> = {
  pending: { label: "Pending", tone: "pending" },
  accepted: { label: "Accepted", tone: "accepted" },
  rejected: { label: "Rejected", tone: "rejected" },
};

type Profile = {
  role?: "provider" | "consumer";
  name?: string;
  firstName?: string;
  lastName?: string;
};

const APPLIED_JOBS_STORAGE_KEY = "provider.appliedJobs";

function loadAppliedJobs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPLIED_JOBS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string");
    }
  } catch {
    /* ignore */
  }
  return [];
}

function isJobAlreadyApplied(jobId: string): boolean {
  if (!jobId) return false;
  return loadAppliedJobs().includes(jobId);
}

function storeAppliedJob(jobId: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = new Set(loadAppliedJobs());
    existing.add(jobId);
    localStorage.setItem(APPLIED_JOBS_STORAGE_KEY, JSON.stringify(Array.from(existing)));
  } catch {
    /* ignore */
  }
}

function ApplicationCard({
  application,
  countryName,
  hourlyMinor,
  currency,
  onView,
}: {
  application: DemoApplication;
  countryName?: string;
  hourlyMinor?: number;
  currency: string;
  onView: () => void;
}) {
  const status = appStatusMeta[application.status];
  return (
    <article className={styles.appCard}>
      <header className={styles.appCardHeader}>
        <div className={styles.appProviderRow}>
          <img src={application.provider.avatar} alt="" className={styles.appAvatar} />
          <div className={styles.appProviderText}>
            <span className={styles.appProviderName}>{application.provider.name}</span>
            <span className={styles.appProviderMeta}>
              {application.provider.rating.toFixed(1)} ★ • {application.provider.jobsCompleted} jobs
            </span>
          </div>
        </div>
        <span className={`${styles.appStatus} ${styles[`appStatus_${status.tone}`]}`}>
          {status.label}
        </span>
      </header>

      <dl className={styles.appMetaList}>
        <div className={styles.appMetaRow}>
          <dt>Submitted</dt>
          <dd>{formatSubmitted(application.submittedAt)}</dd>
        </div>
        <div className={styles.appMetaRow}>
          <dt>Service</dt>
          <dd>{application.service.label}</dd>
        </div>
        {application.countryCode && (
          <div className={styles.appMetaRow}>
            <dt>Country</dt>
            <dd className={styles.appCountryCell}>
              <CountryFlag
                countryCode={application.countryCode}
                svg
                style={{ width: 18, height: 18, borderRadius: 4 }}
              />
              <span>{countryName || application.countryCode}</span>
            </dd>
          </div>
        )}
        {hourlyMinor ? (
          <div className={styles.appMetaRow}>
            <dt>Hourly rate</dt>
            <dd>{formatCurrency(hourlyMinor, currency)} / hr</dd>
          </div>
        ) : null}
        <div className={styles.appMetaRow}>
          <dt>Total cost</dt>
          <dd>{formatCurrency(application.priceMinor, application.currency)}</dd>
        </div>
      </dl>

      {application.note && <p className={styles.appNote}>{application.note}</p>}

      <footer className={styles.appActions}>
        <button type="button" className={styles.appBtn} onClick={onView}>
          View application
        </button>
      </footer>
    </article>
  );
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const profile = useMemo<Profile>(() => {
    try {
      return JSON.parse(localStorage.getItem("profile") || "{}") as Profile;
    } catch {
      return {};
    }
  }, []);
  const role = profile?.role ?? null;
  const isProvider = role === "provider";

  const [job, setJob] = useState<DemoJob | null>(() => (id ? getJobById(id) : null));
  const [hasApplied, setHasApplied] = useState(false);
  const countryMeta = useMemo(() => {
    const map = new Map<string, ReturnType<typeof listCountryMeta>[number]>();
    listCountryMeta().forEach((entry) => map.set(entry.code, entry));
    return map;
  }, []);

  const serviceStats = useMemo(() => {
    const stats = new Map<string, { total: number; accepted: number; countries: Set<string> }>();
    job?.applications.forEach((app) => {
      const svcId = app.service?.id;
      if (!svcId) return;
      const entry = stats.get(svcId) ?? { total: 0, accepted: 0, countries: new Set<string>() };
      entry.total += 1;
      if (app.status === "accepted") entry.accepted += 1;
      if (app.countryCode) entry.countries.add(app.countryCode);
      stats.set(svcId, entry);
    });
    return stats;
  }, [job]);

  const refresh = useCallback(() => {
    if (!id) return;
    setJob(getJobById(id));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(CONSUMER_JOBS_UPDATED_EVENT, handler);
    window.addEventListener("storage", handler);
    window.addEventListener("focus", handler);
    return () => {
      window.removeEventListener(CONSUMER_JOBS_UPDATED_EVENT, handler);
      window.removeEventListener("storage", handler);
      window.removeEventListener("focus", handler);
    };
  }, [refresh]);

  useEffect(() => {
    if (!job) {
      setHasApplied(false);
      return;
    }
    setHasApplied(isJobAlreadyApplied(job.id));
  }, [job]);

  const timeRange = useMemo(() => (job ? formatRange(job.schedule.fromISO, job.schedule.toISO) : ""), [job]);
  const duration = useMemo(
    () => (job ? formatDuration(job.schedule.fromISO, job.schedule.toISO) : ""),
    [job]
  );

  const jobDurationMinutes = useMemo(() => {
    if (!job) return null;
    const from = new Date(job.schedule.fromISO).getTime();
    const to = new Date(job.schedule.toISO).getTime();
    const diff = Math.max(0, to - from);
    return Math.round(diff / 60000);
  }, [job]);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const formatCategoryLabel = (value: string) =>
    value
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  useEffect(() => {
    setSelectedServiceId(null);
  }, [isProvider, job?.id]);

  const selectedService = useMemo(() => {
    if (!job || !selectedServiceId) return null;
    return job.services.find((svc) => svc.id === selectedServiceId) ?? null;
  }, [job, selectedServiceId]);

  const selectedServiceStats = useMemo(() => {
    if (!selectedServiceId) return null;
    return serviceStats.get(selectedServiceId) ?? null;
  }, [serviceStats, selectedServiceId]);

  const selectedCapacity = Math.max(1, selectedService?.providersRequired ?? 1);
  const selectedAccepted = selectedServiceStats?.accepted ?? 0;
  const selectedFull = selectedAccepted >= selectedCapacity;
  const canApply = isProvider && !hasApplied && !!selectedService && !selectedFull;

  const openMaps = () => {
    if (!job) return;
    if (job.locationLink) {
      window.open(job.locationLink, "_blank", "noreferrer");
      return;
    }
    const addr = encodeURIComponent(job.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, "_blank", "noreferrer");
  };

  const handleApply = useCallback(() => {
    if (!job || !canApply || !selectedService) return;
    setHasApplied(true);
    storeAppliedJob(job.id);
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("provider-job-applied", { detail: { jobId: job.id } }));
      } catch {
        /* ignore */
      }
    }
  }, [job, canApply, selectedService]);

  if (!job) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Back">
            ←
          </button>
          <div className={styles.headerText}>
            <h1 className={styles.h1}>Job Details</h1>
            <p className={styles.sub}>Not found</p>
          </div>
        </header>
        <div className={styles.missing}>Job not found.</div>
      </section>
    );
  }

  const status = jobStatusMeta[job.status];
  const categoryLabel = useMemo(() => formatCategoryLabel(job.category), [job.category]);
  const heroStats = useMemo(() => {
    const base = [
      { label: "Schedule", value: timeRange },
      { label: "Duration", value: duration },
      { label: "Posted", value: job.postedAt },
    ];
    if (!isProvider) {
      base.push({ label: "Applications", value: `${job.applications.length} total` });
    }
    return base.filter((item) => item.value);
  }, [timeRange, duration, job.postedAt, job.applications.length, isProvider]);
  const statusTone = styles[`jobHeroStatus_${job.status}`] || "";

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>Job Details</h1>
          <p className={styles.sub}>{status.label}</p>
        </div>
      </header>

      <section className={styles.jobHeroCard}>
        <div className={styles.jobHeroMedia}>
          <img src={job.image} alt="" className={styles.jobHeroImage} />
        </div>
        <div className={styles.jobHeroBody}>
          <div className={styles.jobHeroHeader}>
            <span className={styles.jobHeroCategory}>{categoryLabel}</span>
            <span className={`${styles.jobHeroStatus} ${statusTone}`}>{status.label}</span>
          </div>
          <h2 className={styles.jobHeroTitle}>{job.title}</h2>
          <p className={styles.jobHeroLocation}>{job.address}</p>
          <div className={styles.jobHeroStats}>
            {heroStats.map((stat) => (
              <div key={stat.label} className={styles.jobHeroStat}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.sectionLabel}>Description</h3>
        <p className={styles.body}>{job.description}</p>
      </section>

      {!!job.services.length && (
        <section className={styles.card}>
          <h3 className={styles.sectionLabel}>Services requested</h3>
          <div className={styles.serviceGrid}>
            {job.services.map((svc) => {
              const serviceDuration = jobDurationMinutes
                ? jobDurationMinutes >= 60
                  ? `${Math.round(jobDurationMinutes / 60)}h`
                  : `${jobDurationMinutes} min`
                : duration;
              const price = svc.priceMinor ? formatCurrency(svc.priceMinor, job.currency) : null;
              const countries = (svc.allowedCountries || []).map((code) => countryMeta.get(code)?.name ?? code);
              const stat = serviceStats.get(svc.id);
              const showApplicationInsights = !isProvider;
              const appliedCount = stat?.total ?? 0;
              const acceptedCount = stat?.accepted ?? 0;
              const pendingCount = Math.max(0, appliedCount - acceptedCount);
              const appliedCountryNames = stat
                ? Array.from(stat.countries).map((code) => countryMeta.get(code)?.name ?? code)
                : [];
              const capacity = Math.max(1, svc.providersRequired ?? 1);
              const spotsLeft = Math.max(0, capacity - acceptedCount);
              const isFull = acceptedCount >= capacity;
              const isSelected = selectedServiceId === svc.id;

              const cardClasses = [styles.serviceCard];
              if (isProvider) cardClasses.push(styles.serviceCardSelectable);
              if (isProvider && isSelected) cardClasses.push(styles.serviceCardSelected);
              if (isProvider && isFull) cardClasses.push(styles.serviceCardDisabled);

              return (
                <article
                  key={svc.id}
                  className={cardClasses.join(" ")}
                  role={isProvider ? "button" : undefined}
                  aria-pressed={isProvider ? isSelected : undefined}
                  onClick={() => {
                    if (!isProvider || isFull) return;
                    setSelectedServiceId(svc.id);
                  }}
                >
                  <header className={styles.serviceCardHeader}>
                    <div className={styles.serviceTitleRow}>
                      {isProvider ? (
                        <span className={styles.serviceRadio}>
                          <span className={styles.serviceRadioOuter}>
                            {isSelected && <span className={styles.serviceRadioInner} />}
                          </span>
                        </span>
                      ) : null}
                      <div>
                        <h4 className={styles.serviceName}>{svc.label}</h4>
                        <p className={styles.serviceDuration}>Duration • {serviceDuration}</p>
                      </div>
                    </div>
                    {price ? <span className={styles.servicePrice}>{price}</span> : null}
                  </header>

                  {showApplicationInsights && (
                    <dl className={styles.serviceStatsGrid}>
                      <div>
                        <dt>Need</dt>
                        <dd>{capacity || "—"}</dd>
                      </div>
                      <div>
                        <dt>Pending</dt>
                        <dd>{pendingCount}</dd>
                      </div>
                      <div>
                        <dt>Applied</dt>
                        <dd>{capacity ? `${appliedCount}/${capacity}` : appliedCount}</dd>
                      </div>
                      <div>
                        <dt>Spots left</dt>
                        <dd>{capacity ? (spotsLeft > 0 ? spotsLeft : "Full") : "—"}</dd>
                      </div>
                    </dl>
                  )}

                  {countries.length > 0 && (
                    <div className={styles.serviceCountries}>
                      {countries.map((name) => (
                        <span key={name} className={styles.serviceCountryBadge}>{name}</span>
                      ))}
                    </div>
                  )}

                  {isProvider && capacity ? (
                    <div className={styles.providerServiceStats}>
                      <div>
                        <span>Need</span>
                        <strong>{capacity}</strong>
                      </div>
                      <div>
                        <span>Accepted</span>
                        <strong>{acceptedCount}/{capacity}</strong>
                      </div>
                      <div>
                        <span>Pending</span>
                        <strong>{pendingCount}</strong>
                      </div>
                      <div>
                        <span>Spots left</span>
                        <strong>{spotsLeft > 0 ? spotsLeft : "Full"}</strong>
                      </div>
                    </div>
                  ) : null}

                  {(svc.allowedCountries || []).length > 0 && (
                    <div className={styles.serviceRateList}>
                      {(svc.allowedCountries || []).map((code) => {
                        const meta = countryMeta.get(code);
                        if (!meta) return null;
                        return (
                          <div key={code} className={styles.serviceRateRow}>
                            <CountryFlag
                              countryCode={code}
                              svg
                              style={{ width: 16, height: 16, borderRadius: 4 }}
                            />
                            <span>{meta.name}</span>
                            <span className={styles.serviceRateValue}>
                              {formatCurrency(meta.rateMinor, job.currency)} / hr
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showApplicationInsights && appliedCountryNames.length > 0 && (
                    <div className={styles.appliedCountries}>
                      <span className={styles.appliedLabel}>Applied from:</span>
                      {appliedCountryNames.map((name) => (
                        <span key={name} className={styles.serviceCountryBadge}>{name}</span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className={styles.card}>
        <h3 className={styles.sectionLabel}>Address</h3>
        <div className={styles.mapWrap}>
          <iframe
            title="Location"
            className={styles.map}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(`${job.coords.lat},${job.coords.lng}`)}&z=14&output=embed`}
          />
          <button type="button" className={styles.mapBtn} onClick={openMaps}>
            Open in Maps
          </button>
        </div>
        <p className={styles.body}>{job.address}</p>
        <p className={styles.body} style={{ opacity: 0.7 }}>
          Coordinates: {job.coords.lat.toFixed(5)}, {job.coords.lng.toFixed(5)}
        </p>
        {job.locationLink ? (
          <button
            type="button"
            className={styles.mapLinkBtn}
            onClick={() => job.locationLink && window.open(job.locationLink, "_blank", "noreferrer")}
          >
            View shared map link
          </button>
        ) : null}
      </section>

      {isProvider && (
        <section className={styles.card}>
          <h3 className={styles.sectionLabel}>Ready to apply?</h3>
          <p className={styles.body}>
            Submit your application to let the consumer know you're available.
          </p>
          <button
            type="button"
            className={styles.applyButton}
            onClick={handleApply}
            disabled={!canApply}
          >
            {hasApplied
              ? "Application sent"
              : canApply
              ? "Apply for the job!!"
              : selectedService && selectedFull
              ? "Service full"
              : "Select a service"}
          </button>
          {hasApplied && (
            <p className={styles.applyNote}>
              We'll keep you posted in the Applications tab.
            </p>
          )}
        </section>
      )}

      {!isProvider && (
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <h3 className={styles.sectionLabel}>Applications</h3>
            <span className={styles.badgeCounter}>{job.applications.length}</span>
          </div>
          <div className={styles.appList}>
            {job.applications.length === 0 ? (
              <div className={styles.noApplications}>No applications yet. We'll notify you when providers apply.</div>
            ) : (
              job.applications.map((application) => {
                const meta = application.countryCode ? countryMeta.get(application.countryCode) : undefined;
                const countryName = meta?.name;
                const hourlyMinor = meta?.rateMinor;
                const currency = meta?.currency ?? application.currency;
                return (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    countryName={countryName}
                    hourlyMinor={hourlyMinor}
                    currency={currency}
                    onView={() => navigate(`/applications/${application.id}?jobId=${job.id}`)}
                  />
                );
              })
            )}
          </div>
        </section>
      )}
    </section>
  );
}
