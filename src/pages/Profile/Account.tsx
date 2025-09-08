import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Account.module.css";
import colors from "@/styles/colors";

/** IBAN helpers (same logic as your BankDetails screen) */
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
  const converted = rearranged.replace(/[A-Z]/g, (ch) =>
    (ch.charCodeAt(0) - 55).toString()
  );
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

type BankRec = {
  iban?: string;
  bankName?: string;
  accountHolder?: string;
  savedAt?: string;
};

export default function Account() {
  const navigate = useNavigate();

  const current: BankRec = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("bank") || "{}"); }
    catch { return {}; }
  }, []);

  // Editable copy
  const [iban, setIban]                 = useState(formatIBANForInput(current.iban || ""));
  const [bankName, setBankName]         = useState(current.bankName || "");
  const [accountHolder, setAccountHolder] = useState(current.accountHolder || "");
  const [submitted, setSubmitted]       = useState(false);
  const ibanInputRef = useRef<HTMLInputElement | null>(null);

  const rules = ibanRuleChecks(iban);
  const checksumOk =
    normalizeIBAN(iban).length >= 5 && rules.hasCountryAndCheck && rules.charsOk && rules.lengthOk
      ? isValidIBAN(iban)
      : false;

  const ibanOk   = rules.hasCountryAndCheck && rules.lengthOk && rules.charsOk && checksumOk;
  const bankOk   = bankName.trim().length >= 2;
  const holderOk = accountHolder.trim().length >= 2;
  const allOk    = ibanOk && bankOk && holderOk;

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

  const prettyCurrentIban = current.iban ? formatIBANForInput(current.iban) : "—";

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">←</button>
        <div>
          <h1 className={styles.h1}>Account</h1>
          <p className={styles.sub}>View your saved payout details and update them side-by-side.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* CURRENT (read) */}
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

        {/* EDIT (write) */}
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
            <button type="button" className={styles.secondary} onClick={() => navigate("/home")}>
              Back to Home
            </button>
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
