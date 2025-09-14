import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BankDetails.module.css";
import colors from "@/styles/colors";

/** ----- IBAN helpers ----- **/

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

export default function BankDetails() {
  const navigate = useNavigate();
  const profile = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("profile") || "{}"); }
    catch { return {}; }
  }, []);

  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touchedIban, setTouchedIban] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem("onboardingFlow");
  }, []);

  const rawIban = normalizeIBAN(iban);
  const rules = ibanRuleChecks(iban);
  const checksumOk =
    rawIban.length >= 5 && rules.hasCountryAndCheck && rules.charsOk && rules.lengthOk
      ? isValidIBAN(iban)
      : false;

  const ibanOk = rules.hasCountryAndCheck && rules.lengthOk && rules.charsOk && checksumOk;
  const bankOk = bankName.trim().length >= 2;
  const holderOk = accountHolder.trim().length >= 2;
  const allOk = ibanOk && bankOk && holderOk;

  const showIbanError = (touchedIban || submitted) && !ibanOk;
  const detectedCountry = rawIban.slice(0, 2);
  const charCount = rawIban.length;

  const ibanInputRef = useRef<HTMLInputElement | null>(null);
  const onIbanChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const el = e.target;
    const prevCursor = el.selectionStart ?? el.value.length;

    const justAlnum = el.value.replace(/[^a-zA-Z0-9]/g, "");
    const formatted = formatIBANForInput(justAlnum);
    setIban(formatted);

    requestAnimationFrame(() => {
      if (ibanInputRef.current) {
        const len = ibanInputRef.current.value.length;
        // Keep cursor near where the user typed (simple heuristic)
        const nextPos = Math.min(len, prevCursor + 1);
        ibanInputRef.current.setSelectionRange(nextPos, nextPos);
      }
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!allOk) return;

    localStorage.setItem(
      "bank",
      JSON.stringify({
        iban: rawIban,
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        savedAt: new Date().toISOString(),
      })
    );

    if ((profile as any)?.role === "provider") {
      navigate("/auth/ProviderServices");
    } else {
      navigate("/home");
    }
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Bank Details</h1>
      </header>

      <form className={styles.box} onSubmit={onSubmit} noValidate>
        {/* Bank Name */}
        <div className={styles.row}>
          <label className={styles.label}>
            Bank Name
          </label>
          <input
            className={`${styles.input} ${submitted && !bankOk ? styles.inputError : ""}`}
            placeholder="e.g. Emirates NBD"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            autoComplete="organization"
            inputMode="text"
            required
          />
          {submitted && !bankOk && (
            <p className={styles.error}>Enter a valid bank name.</p>
          )}
        </div>

        {/* IBAN */}
        <div className={styles.row}>
          <div className={styles.labelRow}>
            <label className={styles.label}>
              IBAN
            </label>
            <span className={styles.badge}>
              {detectedCountry ? `Detected: ${detectedCountry}` : "—"}
            </span>
          </div>

          <input
            ref={ibanInputRef}
            className={`${styles.input} ${showIbanError ? styles.inputError : ""}`}
            placeholder="AE07 0331 2345 6789 0123 456"
            value={iban}
            onChange={onIbanChange}
            onBlur={() => setTouchedIban(true)}
            inputMode="text"                /* mobile-safe (keeps letters) */
            autoCapitalize="characters"
            autoComplete="off"
            enterKeyHint="done"
            aria-invalid={showIbanError || undefined}
            required
          />

          <div className={styles.helperRow}>
            <span className={styles.charCount}>{charCount}/34</span>
          </div>

          <ul className={styles.rules}>
            <li className={rules.hasCountryAndCheck ? styles.ruleOk : styles.ruleBad}>
              Starts with <b>2 letters</b> (country) + <b>2 digits</b> (check)
            </li>
            <li className={rules.lengthOk ? styles.ruleOk : styles.ruleBad}>
              Length between <b>15–34</b> characters (no spaces)
            </li>
            <li className={rules.charsOk ? styles.ruleOk : styles.ruleBad}>
              Only letters and digits (A–Z, 0–9)
            </li>
            <li className={checksumOk ? styles.ruleOk : styles.ruleBad}>
              <b>Checksum</b> (mod-97) is valid
            </li>
          </ul>

          {showIbanError && (
            <p className={styles.error}>
              Enter a valid IBAN. Example (UAE): <b>AE07 0331 2345 6789 0123 456</b>
            </p>
          )}
        </div>

        {/* Account Holder */}
        <div className={styles.row}>
          <label className={styles.label}>
            Account Holder Name
          </label>
          <input
            className={`${styles.input} ${submitted && !holderOk ? styles.inputError : ""}`}
            placeholder="Full legal name"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            autoComplete="name"
            inputMode="text"
            required
          />
          {submitted && !holderOk && (
            <p className={styles.error}>Enter the account holder’s full name.</p>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            className={styles.primary}
            style={{
              background: colors.accent,
              color: colors.white,
              opacity: allOk ? 1 : 0.6,
            }}
            disabled={!allOk}
            type="submit"
          >
            continue
          </button>
        </div>
      </form>
    </section>
  );
}
