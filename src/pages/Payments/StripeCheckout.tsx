import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./StripeCheckout.module.css";
import {
  getApplicationById,
  updateApplicationStatus,
} from "@/data/demoJobs";

export default function StripeCheckout() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const applicationId = search.get("applicationId") || "";

  const record = useMemo(() => (applicationId ? getApplicationById(applicationId) : null), [applicationId]);
  const application = record?.application ?? null;
  const job = record?.job ?? null;

  const [processing, setProcessing] = useState(false);
  const [cardBrand, setCardBrand] = useState("visa");
  const [last4, setLast4] = useState("");

  useEffect(() => {
    if (!application || !job) return;
    setCardBrand("visa");
    setLast4("4242");
  }, [application, job]);

  if (!application || !job) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div>
              <div className={styles.greeting}>Stripe Checkout</div>
              <div className={styles.roleBadge}>Application not found</div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const amountMajor = (application.priceMinor / 100).toFixed(2);

  const onComplete = () => {
    if (processing) return;
    setProcessing(true);
    const updated = updateApplicationStatus(job.id, application.id, "accepted");
    if (updated) {
      navigate(`/applications/${application.id}?jobId=${job.id}`, {
        replace: true,
        state: {
          banner: "Payment captured. Application accepted.",
        },
      });
      return;
    }
    setProcessing(false);
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <div className={styles.greeting}>Stripe Checkout</div>
            <div className={styles.roleBadge}>{job.title}</div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.centerRow}>
          <div className={styles.listGroup}>
            <div className={styles.listItem}>
              <span className={styles.listText} style={{ fontWeight: 900 }}>Payment summary</span>
            </div>
            <div className={styles.listItem}>
              <span className={styles.listText}>Amount</span>
              <span className={styles.listText}><strong>{application.currency} {amountMajor}</strong></span>
            </div>
            <div className={styles.listItem}>
              <span className={styles.listText}>Service</span>
              <span className={styles.listText}>{application.service.label}</span>
            </div>
            <div className={styles.listItem}>
              <span className={styles.listText}>Provider</span>
              <span className={styles.listText}>{application.provider.name}</span>
            </div>
          </div>

          <div className={styles.listGroup}>
            <div className={styles.listItem}>
              <span className={styles.listText} style={{ fontWeight: 900 }}>Payment method</span>
            </div>
            <div className={styles.listItem}>
              <select
                className={styles.selectInput}
                value={cardBrand}
                onChange={(event) => setCardBrand(event.target.value)}
              >
                <option value="visa">Visa ••••4242</option>
                <option value="mastercard">Mastercard ••••4444</option>
                <option value="amex">Amex ••••0005</option>
              </select>
            </div>
            <div className={styles.listItem}>
              <input
                className={styles.searchInput}
                placeholder="Last four digits"
                value={last4}
                onChange={(event) => setLast4(event.target.value.replace(/[^0-9]/g, ""))}
                maxLength={4}
              />
            </div>
            <div className={styles.listItem}>
              <span className={styles.note}>Stripe test mode. No real charges will be made.</span>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={processing || !last4 || last4.length < 4}
              onClick={onComplete}
            >
              {processing ? "Processing…" : "Complete payment"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
