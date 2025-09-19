import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./Home.module.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CONSUMER_JOBS_UPDATED_EVENT,
  getApplicationById,
  listCountryMeta,
  updateApplicationStatus,
  type DemoApplication,
  type DemoJob,
} from "@/data/demoJobs";

const formatRange = (fromISO: string, toISO: string) => {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  const sameDay =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate();
  const dayA = from.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const dayB = to.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeA = from.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const timeB = to.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `${dayA} • ${timeA} – ${timeB}` : `${dayA} ${timeA} → ${dayB} ${timeB}`;
};

const formatCurrency = (minor: number, currency: string) => {
  const major = minor / 100;
  return `${currency} ${major.toLocaleString("en-AE", { minimumFractionDigits: 2 })}`;
};

const statusCopy: Record<DemoApplication["status"], { label: string; tone: "pending" | "accepted" | "rejected" }> = {
  pending: { label: "Pending", tone: "pending" },
  accepted: { label: "Accepted", tone: "accepted" },
  rejected: { label: "Rejected", tone: "rejected" },
};

type RecordShape = { job: DemoJob; application: DemoApplication } | null;

export default function ApplicationDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [record, setRecord] = useState<RecordShape>(() => (id ? getApplicationById(id) : null));
  const [processing, setProcessing] = useState<"accept" | "reject" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!id) return;
    setRecord(getApplicationById(id));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(CONSUMER_JOBS_UPDATED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CONSUMER_JOBS_UPDATED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  const job = record?.job;
  const application = record?.application;
  const appStatus = application ? statusCopy[application.status] : null;
  const countryMetaMap = useMemo(() => {
    const map = new Map<string, (ReturnType<typeof listCountryMeta>)[number]>();
    listCountryMeta().forEach((meta) => map.set(meta.code, meta));
    return map;
  }, []);
  const applicationCountryName = application?.countryCode
    ? countryMetaMap.get(application.countryCode)?.name ?? application.countryCode
    : null;
  const applicationCountryMeta = application?.countryCode
    ? countryMetaMap.get(application.countryCode) ?? null
    : null;

  const timeRange = useMemo(() => {
    if (!job) return "";
    return formatRange(job.schedule.fromISO, job.schedule.toISO);
  }, [job]);

  if (!record || !job || !application) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div>
              <div className={styles.greeting}>Application Details</div>
              <div className={styles.roleBadge}>Application not found</div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const decisionTaken = application.status !== "pending";
  const statusClass = appStatus ? styles[`badge_${appStatus.tone}`] : "";
  const checkoutParams = new URLSearchParams({
    applicationId: application.id,
    jobId: job.id,
  }).toString();

  const onReject = async () => {
    if (decisionTaken || processing) return;
    setProcessing("reject");
    const updated = updateApplicationStatus(job.id, application.id, "rejected");
    if (updated) {
      setRecord(updated);
      setBanner("Application rejection sent");
    }
    setProcessing(null);
  };

  const onAccept = async () => {
    if (decisionTaken || processing) return;
    setProcessing("accept");
    navigate(`/payments/checkout?${checkoutParams}`, {
      state: {
        returnTo: `/applications/${application.id}?jobId=${job.id}`,
      },
    });
  };

  useEffect(() => {
    if (!decisionTaken) {
      setBanner(null);
    }
  }, [decisionTaken]);

  useEffect(() => {
    const stateBanner = (location.state as { banner?: string } | null)?.banner;
    if (stateBanner) {
      setBanner(stateBanner);
    }
  }, [location.state]);

  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <div className={styles.greeting}>Application Details</div>
            <div className={styles.roleBadge}>{job.title}</div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>

      <div className={styles.centerRow}>
        {banner && <div className={styles.banner}>{banner}</div>}

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{ fontWeight: 900 }}>
              Summary
            </span>
          </div>
          <div className={styles.listItem}>
            <span className={styles.listText}>Status</span>
            <span className={`${styles.badge} ${statusClass}`}>
              {appStatus?.label ?? "—"}
            </span>
          </div>
          <div className={styles.listItem}>
            <span className={styles.listText}>Service</span>
            <span className={styles.listText}>{application.service.label}</span>
          </div>
          <div className={styles.listItem}>
            <span className={styles.listText}>Date &amp; time</span>
            <span className={styles.listText}>{timeRange}</span>
          </div>
          {applicationCountryName && (
            <div className={styles.listItem}>
              <span className={styles.listText}>Country</span>
              <span className={styles.listText}>{applicationCountryName}</span>
            </div>
          )}
          {applicationCountryMeta ? (
            <div className={styles.listItem}>
              <span className={styles.listText}>Hourly rate</span>
              <span className={styles.listText}>
                {formatCurrency(applicationCountryMeta.rateMinor, applicationCountryMeta.currency)} / hr
              </span>
            </div>
          ) : null}
          <div className={styles.listItem}>
            <span className={styles.listText}>Total cost</span>
            <span className={styles.listText}>{formatCurrency(application.priceMinor, application.currency)}</span>
          </div>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{ fontWeight: 900 }}>
              Provider
            </span>
          </div>
          <div className={styles.providerCard}>
            <div className={styles.providerRow}>
              <img src={application.provider.avatar} alt="" className={styles.providerAvatar} />
              <div className={styles.providerText}>
                <span className={styles.providerName}>{application.provider.name}</span>
                <span className={styles.providerMeta}>
                  {application.provider.rating.toFixed(1)} ★ • {application.provider.jobsCompleted} jobs completed
                </span>
              </div>
            </div>
            <button
              type="button"
              className={styles.providerLink}
              onClick={() => navigate(`/provider/${application.provider.id}`)}
            >
              View profile
            </button>
          </div>
        </div>

        {application.note && (
          <div className={styles.listGroup}>
            <div className={styles.listItem}>
              <span className={styles.listText} style={{ fontWeight: 900 }}>
                Message
              </span>
            </div>
            <div className={styles.listItem}>
              <span className={styles.listText}>{application.note}</span>
            </div>
          </div>
        )}

        <div className={styles.actionRow}>
          <button
            className={styles.secondaryBtn}
            onClick={onReject}
            disabled={decisionTaken || !!processing}
            aria-disabled={decisionTaken || !!processing}
          >
            {processing === "reject" ? "Rejecting…" : "Reject"}
          </button>
          <button
            className={styles.primaryBtn}
            onClick={onAccept}
            disabled={decisionTaken || !!processing}
            aria-disabled={decisionTaken || !!processing}
          >
            {processing === "accept" ? "Opening payment…" : "Accept & Pay"}
          </button>
        </div>
      </div>
    </section>
  );
}
