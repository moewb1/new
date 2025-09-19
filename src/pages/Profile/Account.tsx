import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Account.module.css";
import colors from "@/styles/colors";

/** ---------- IBAN helpers (unchanged) ---------- */
function normalizeIBAN(input: string) {
  return (input || "").replace(/\s+/g, "").toUpperCase();
}
function formatIBANForInput(input: string) {
  const raw = normalizeIBAN(input);
  return raw.replace(/(.{4})/g, "$1 ").trim();
}
function isValidIBAN(ibanInput: string) {
  const iban = normalizeIBAN(ibanInput);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const converted = rearranged.replace(/[A-Z]/g, (ch) => (ch.charCodeAt(0) - 55).toString());
  let remainder = 0;
  for (let i = 0; i < converted.length; i += 7) {
    const part = remainder.toString() + converted.substring(i, i + 7);
    remainder = Number(part) % 97;
  }
  return remainder === 1;
}
function ibanRuleChecks(ibanInput: string) {
  const raw = normalizeIBAN(ibanInput);
  return {
    hasCountryAndCheck: /^[A-Z]{2}\d{2}/.test(raw),
    lengthOk: raw.length >= 15 && raw.length <= 34,
    charsOk: /^[A-Z0-9]*$/.test(raw),
  };
}

/** ---------- Local data ---------- */
type BankRec = {
  iban?: string;
  bankName?: string;
  accountHolder?: string;
  savedAt?: string;
};

type Payout = {
  id: string;
  dateISO: string;
  amountMinor: number;
  status: "paid" | "processing" | "scheduled";
};

type Preferences = {
  emailPayout: boolean;
  smsPayout: boolean;
  weeklyDigest: boolean;
};

const PREF_KEY = "account.preferences";
const PAYOUT_KEY = "account.payoutHistory";

const fmtAED = (minor: number) => `AED ${(minor / 100).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
const fmtDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

const statusLabel: Record<Payout["status"], string> = {
  paid: "Paid",
  processing: "Processing",
  scheduled: "Scheduled",
};

const daysUntil = (iso: string) => {
  const target = new Date(iso).getTime();
  const diff = Math.round((target - Date.now()) / (24 * 3600_000));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `In ${diff} days`;
  const abs = Math.abs(diff);
  if (abs === 1) return "1 day ago";
  return `${abs} days ago`;
};

const loadPreferences = (): Preferences => {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        emailPayout: parsed.emailPayout !== false,
        smsPayout: Boolean(parsed.smsPayout),
        weeklyDigest: parsed.weeklyDigest !== false,
      };
    }
  } catch {}
  return { emailPayout: true, smsPayout: false, weeklyDigest: true };
};

const loadPayoutHistory = (): Payout[] => {
  try {
    const raw = localStorage.getItem(PAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Payout[];
    }
  } catch {}
  const seed: Payout[] = [
    { id: "pt1", dateISO: new Date().toISOString(), amountMinor: 23500, status: "processing" },
    { id: "pt2", dateISO: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(), amountMinor: 42000, status: "paid" },
    { id: "pt3", dateISO: new Date(Date.now() - 9 * 24 * 3600_000).toISOString(), amountMinor: 31800, status: "paid" },
    { id: "pt4", dateISO: new Date(Date.now() + 5 * 24 * 3600_000).toISOString(), amountMinor: 50000, status: "scheduled" },
  ];
  localStorage.setItem(PAYOUT_KEY, JSON.stringify(seed));
  return seed;
};

export default function Account() {
  const navigate = useNavigate();

  const current: BankRec = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("bank") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [iban, setIban] = useState(formatIBANForInput(current.iban || ""));
  const [bankName, setBankName] = useState(current.bankName || "");
  const [accountHolder, setAccountHolder] = useState(current.accountHolder || "");
  const [submitted, setSubmitted] = useState(false);
  const ibanInputRef = useRef<HTMLInputElement | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences());
  const payoutHistory = useMemo(() => {
    const list = loadPayoutHistory();
    return [...list].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }, []);

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const rules = ibanRuleChecks(iban);
  const checksumOk =
    normalizeIBAN(iban).length >= 5 && rules.hasCountryAndCheck && rules.charsOk && rules.lengthOk
      ? isValidIBAN(iban)
      : false;

  const ibanOk = rules.hasCountryAndCheck && rules.lengthOk && rules.charsOk && checksumOk;
  const bankOk = bankName.trim().length >= 2;
  const holderOk = accountHolder.trim().length >= 2;
  const allOk = ibanOk && bankOk && holderOk;

  const onIbanChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const el = e.target;
    const prevCursor = el.selectionStart ?? el.value.length;
    const justAlnum = el.value.replace(/[^a-zA-Z0-9]/g, "");
    const formatted = formatIBANForInput(justAlnum);
    setIban(formatted);
    requestAnimationFrame(() => {
      if (ibanInputRef.current) {
        const len = ibanInputRef.current.value.length;
        const nextPos = Math.min(len, prevCursor + 1);
        ibanInputRef.current.setSelectionRange(nextPos, nextPos);
      }
    });
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!allOk) return;

    localStorage.setItem(
      "bank",
      JSON.stringify({
        iban: normalizeIBAN(iban),
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        savedAt: new Date().toISOString(),
      })
    );
    navigate("/home");
  };

  const togglePref = (key: keyof Preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const prettyCurrentIban = current.iban ? formatIBANForInput(current.iban) : "—";
  const nextPayout = payoutHistory.find((p) => p.status === "processing" || p.status === "scheduled") ?? payoutHistory[0];
  const lastPayout = payoutHistory.find((p) => p.status === "paid");
  const payoutFrequency = "Weekly (Mondays)";

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
        <div>
          <h1 className={styles.h1}>Account</h1>
          <p className={styles.sub}>Manage your payout details, preferences, and history in one place.</p>
        </div>
      </header>

      <div className={styles.overviewGrid}>
        <article className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Next payout</span>
          <strong className={styles.overviewValue}>{nextPayout ? fmtAED(nextPayout.amountMinor) : "AED 0"}</strong>
          <span className={styles.overviewMeta}>
            {nextPayout ? `${fmtDateLong(nextPayout.dateISO)} • ${statusLabel[nextPayout.status]}` : "No payouts scheduled"}
          </span>
          <span className={styles.overviewHint}>{nextPayout ? daysUntil(nextPayout.dateISO) : "Add a payout method to get started."}</span>
        </article>
        <article className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Last payout</span>
          <strong className={styles.overviewValue}>{lastPayout ? fmtAED(lastPayout.amountMinor) : "AED 0"}</strong>
          <span className={styles.overviewMeta}>{lastPayout ? fmtDateLong(lastPayout.dateISO) : "Awaiting first payout"}</span>
          <span className={styles.overviewHint}>{payoutFrequency}</span>
        </article>
        <article className={styles.overviewCard}>
          <span className={styles.overviewLabel}>Account holder</span>
          <strong className={styles.overviewValue}>{current.accountHolder || "—"}</strong>
          <span className={styles.overviewMeta}>{prettyCurrentIban}</span>
          <span className={styles.overviewHint}>{current.bankName || "No bank saved"}</span>
        </article>
      </div>

      <div className={styles.grid}>
        <aside className={styles.card}>
          <div className={styles.cardTitle}>Current</div>

          <div className={styles.kv}>
            <span className={styles.k}>IBAN</span>
            <span className={styles.v}>{prettyCurrentIban}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.k}>Bank name</span>
            <span className={styles.v}>{current.bankName || "—"}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.k}>Account holder</span>
            <span className={styles.v}>{current.accountHolder || "—"}</span>
          </div>

          <div className={styles.meta}>
            {current.savedAt ? `Updated ${new Date(current.savedAt).toLocaleString()}` : "No details saved yet"}
          </div>
        </aside>

        <form className={styles.card} onSubmit={onSave} noValidate>
          <div className={styles.cardTitle}>Edit details</div>

          <div className={styles.row}>
            <label className={styles.label}>IBAN</label>
            <input
              ref={ibanInputRef}
              className={`${styles.input} ${submitted && !ibanOk ? styles.inputError : ""}`}
              placeholder="AE07 0331 2345 6789 0123 456"
              value={iban}
              onChange={onIbanChange}
              autoCapitalize="characters"
              autoComplete="off"
              inputMode="text"
              required
            />
            {submitted && !ibanOk && (
              <p className={styles.error}>Enter a valid IBAN (country+check, length, characters & checksum).</p>
            )}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Bank name</label>
            <input
              className={`${styles.input} ${submitted && !bankOk ? styles.inputError : ""}`}
              placeholder="e.g. Emirates NBD"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
            {submitted && !bankOk && <p className={styles.error}>Enter a valid bank name.</p>}
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Account holder</label>
            <input
              className={`${styles.input} ${submitted && !holderOk ? styles.inputError : ""}`}
              placeholder="Full legal name"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              required
            />
            {submitted && !holderOk && <p className={styles.error}>Enter the account holder’s full name.</p>}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => navigate("/home")}>Back to Home</button>
            <button
              className={styles.primary}
              style={{ background: colors.accent, color: colors.white, opacity: allOk ? 1 : 0.6 }}
              disabled={!allOk}
              type="submit"
            >
              Save
            </button>
          </div>
        </form>
      </div>

    </section>
  );
}
