import React, { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./IdentityOnboarding.module.css";
import colors from "@/styles/colors";

/* 📱 Phone with flags + formatting */
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import {
  parsePhoneNumberFromString,
} from "libphonenumber-js/max";
import getNumberInvalidReason from "libphonenumber-js/max"
/* 🗓️ One-month classic calendar (react-datepicker) */
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enUS, ar } from "date-fns/locale";

/* 🌍 Nationality with flags (react-select) */
import Select, { components, createFilter } from "react-select";
import type {
  OptionProps,
  SingleValueProps,
  GroupBase,
  StylesConfig,
} from "react-select";
import countryList from "react-select-country-list";
import CountryFlag from "react-country-flag";

/* 📤 File upload (polished UI) */
import { FilePond, registerPlugin } from "react-filepond";
import type { FilePondFile } from "filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize,
  FilePondPluginImagePreview
);

type PersonType = "individual" | "company";
type DocType = "passport" | "national_id" | "driver_license";

/** Option shape from react-select-country-list */
type CountryOption = { value: string; label: string };

/* --- utils --- */
function isAdultDate(d: Date | null) {
  if (!d) return false;
  const today = new Date();
  const age =
    today.getFullYear() -
    d.getFullYear() -
    (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  return age >= 18;
}
function toISODateOnly(d: Date) {
  // Store YYYY-MM-DD (UTC-safe)
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return utc.toISOString().slice(0, 10);
}

function normalizeE164(input: string) {
  try {
    const p = parsePhoneNumberFromString(input || "");
    return p ? p.number : (input || "").trim();
  } catch {
    return (input || "").trim();
  }
}
function formatInternational(input: string) {
  try {
    const p = parsePhoneNumberFromString(input || "");
    return p ? p.formatInternational() : input || "";
  } catch {
    return input || "";
  }
}

const localeIsArabic = (navigator.language || "").toLowerCase().startsWith("ar");
const dateLocale = localeIsArabic ? ar : enUS;

/* --- react-select custom renderers --- */
const CountryOptionRow = (
  props: OptionProps<CountryOption, false, GroupBase<CountryOption>>
) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className={styles.countryRow}>
        <CountryFlag
          countryCode={data.value}
          svg
          style={{ width: 18, height: 18, borderRadius: 4 }}
          aria-label={data.label}
        />
        <span className={styles.countryText}>{data.label}</span>
        <span style={{ marginLeft: "auto", opacity: 0.6, fontWeight: 700 }}>
          {data.value}
        </span>
      </div>
    </components.Option>
  );
};

const CountrySingleValue = (
  props: SingleValueProps<CountryOption, false, GroupBase<CountryOption>>
) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div className={styles.countryRow}>
        <CountryFlag
          countryCode={data.value}
          svg
          style={{ width: 18, height: 18, borderRadius: 4 }}
          aria-label={data.label}
        />
        <span className={styles.countryText}>{data.label}</span>
        <span style={{ marginLeft: 8, opacity: 0.6, fontWeight: 700 }}>
          ({data.value})
        </span>
      </div>
    </components.SingleValue>
  );
};

export default function IdentityOnboarding() {
  const navigate = useNavigate();
  const profile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("profile") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [personType, setPersonType] = useState<PersonType>("individual");

  // DOB
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const eighteenYearsAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);
  const dobOk = isAdultDate(dobDate);

  // Nationality (keyboard-searchable react-select)
  const countries = useMemo<CountryOption[]>(() => countryList().getData(), []);
  const defaultNationality =
    countries.find((c) => c.value === "AE") ??
    ({ value: "AE", label: "United Arab Emirates" } as CountryOption);
  const [nationality, setNationality] = useState<CountryOption>(
    defaultNationality
  );

  // Phone — smart handling with country-aware length limiting.
  const [phone, setPhone] = useState<string>("+971 ");
  const [phoneTouched, setPhoneTouched] = useState(false); // do not show error immediately
  const lastAcceptedRef = useRef<string>(phone);

  // Compute validity (memo for perf)
  const { phoneValid, phoneMessage } = useMemo(() => {
    try {
      const parsed = parsePhoneNumberFromString(phone || "");
      const valid = !!parsed && parsed.isValid();
      const reason = getNumberInvalidReason(phone || "") as
        | "TOO_SHORT"
        | "TOO_LONG"
        | "INVALID_COUNTRY"
        | undefined;

      const iso2 = parsed?.country;
      const countryLabel =
        (iso2 && countries.find((c) => c.value === iso2)?.label) || "this country";

      let message = "";
      if (!valid && (phoneTouched || !phone.trim())) {
        // Show message only after blur OR if user cleared input
        if (reason === "TOO_SHORT") message = `Number is too short for ${countryLabel}.`;
        else if (reason === "TOO_LONG") message = `Number is too long for ${countryLabel}.`;
        else if (reason === "INVALID_COUNTRY") message = "Invalid country calling code.";
        else if (phone.trim()) message = "Enter a valid phone number.";
      }
      return { phoneValid: valid, phoneMessage: message };
    } catch {
      return { phoneValid: false, phoneMessage: phoneTouched ? "Enter a valid phone number." : "" };
    }
  }, [phone, phoneTouched, countries]);

  // Hard-limit input when TOO_LONG by trimming last character(s)
  const handlePhoneChange = (val: string) => {
    let next = val || "";
    // Trim until libphonenumber no longer says TOO_LONG
    // This keeps UX smooth and prevents "typing past" country rules.
    while (getNumberInvalidReason(next) === "TOO_LONG" && next.length > 0) {
      next = next.slice(0, -1);
    }
    setPhone(next);
    lastAcceptedRef.current = next;
  };

  const onPhoneBlur = () => {
    setPhoneTouched(true);
    // Pretty formatting on blur
    setPhone((p) => formatInternational(p));
  };

  const [docType, setDocType] = useState<DocType>("passport");
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const allOk = dobOk && !!nationality && !!docType && !!file && !!phone && phoneValid;

  const onContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setPhoneTouched(true); // ensure phone validation visible if invalid
    if (!allOk) return;

    const identity = {
      personType,
      dob: dobDate ? toISODateOnly(dobDate) : null,
      nationality: nationality.label,
      nationalityCode: nationality.value,
      phone: normalizeE164(phone),
      docType,
      docName: file?.name || null,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("kyc.identity", JSON.stringify(identity));

    if ((profile as any)?.role === "provider") {
      navigate("/auth/ProviderServices");
    } else {
      navigate("/auth/BankDetails");
    }
  };

  /* react-select inline styles */
  const selectStyles: StylesConfig<CountryOption, false> = {
    control: (base, state) => ({
      ...base,
      borderRadius: 12,
      borderColor: state.isFocused ? "rgb(169, 174, 155)" : "rgba(0,0,0,0.08)",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(169,174,155,0.18)" : "none",
      padding: "2px 2px",
      minHeight: 46,
      background: "#fff",
      ":hover": { borderColor: "rgba(0,0,0,0.18)" },
      fontWeight: 600,
    }),
    valueContainer: (base) => ({ ...base, padding: "0 8px" }),
    option: (base, state) => ({
      ...base,
      fontWeight: 600,
      backgroundColor: state.isFocused ? "rgba(0,0,0,0.04)" : "#fff",
      color: "#111",
      padding: "8px 10px",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
    }),
  };

  // Filter to search by country name OR ISO code
  const countryFilter = createFilter<CountryOption>({
    ignoreCase: true,
    stringify: (option) => `${option.label} ${option.value}`,
    trim: true,
    matchFrom: "any",
  });

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Identity verification</h1>
        <p className={styles.sub}>
          {(profile as any)?.role ? (
            <>Signing up as <b>{(profile as any).role}</b>.</>
          ) : (
            "Tell us about you."
          )}
        </p>
      </header>

      <form className={styles.box} onSubmit={onContinue} noValidate>
        {/* Person Type */}
        <div className={styles.row}>
          <label className={styles.label}>Account type</label>
          <div className={styles.segment}>
            <button
              type="button"
              className={`${styles.segmentBtn} ${
                personType === "individual" ? styles.active : ""
              }`}
              onClick={() => setPersonType("individual")}
            >
              Individual
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${
                personType === "company" ? styles.active : ""
              }`}
              onClick={() => setPersonType("company")}
            >
              Company
            </button>
          </div>
        </div>

        {/* DOB (react-datepicker, single month) */}
        <div className={styles.row}>
          <label className={styles.label}>Date of birth</label>
          <ReactDatePicker
            selected={dobDate}
            onChange={(d) => setDobDate(d)}
            placeholderText="Select your date of birth"
            className={`${styles.input} ${
              (submitted && !dobOk) ? styles.inputError : ""
            }`}
            calendarClassName={styles.dpCalendar}
            popperClassName={styles.dpPopper}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            scrollableYearDropdown
            yearDropdownItemNumber={110}
            minDate={new Date(1900, 0, 1)}
            maxDate={eighteenYearsAgo}
            openToDate={dobDate ?? eighteenYearsAgo}
            dateFormat="yyyy-MM-dd"
            isClearable
            showPopperArrow
            popperPlacement="bottom-start"
            locale={dateLocale}
            onChangeRaw={(e) => e.preventDefault()} // no free text
          />
          {submitted && !dobOk && (
            <p className={styles.error}>You must be at least 18 years old.</p>
          )}
        </div>

        {/* Nationality (keyboard-searchable) */}
        <div className={styles.row}>
          <label className={styles.label}>Nationality</label>
          <Select<CountryOption, false>
            options={countries}
            value={nationality}
            onChange={(v) => v && setNationality(v)}
            components={{ Option: CountryOptionRow, SingleValue: CountrySingleValue }}
            styles={selectStyles}
            className={styles.selectWrapper}
            classNamePrefix="react-select"
            isSearchable
            filterOption={countryFilter}
            placeholder="Search country…"
            noOptionsMessage={() => "No countries found"}
            menuPlacement="auto"
          />
        </div>

        {/* Phone (country-aware, no immediate error) */}
        <div className={styles.row}>
          <label className={styles.label}>Mobile number</label>

          <div
            className={`${styles.phoneWrap} ${
              ((submitted || phoneTouched) && !phoneValid) ? styles.inputError : ""
            }`}
          >
            <PhoneInput
              defaultCountry="ae"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={onPhoneBlur}
              onFocus={() => {/* do not set touched here – no error on first keystroke */}}
              placeholder="Mobile number"
              forceDialCode
              smartCaret
              disableDialCodePrefill={false}
              preferredCountries={["ae","sa","qa","kw","bh","om","lb","eg","jo","pk","in"]}
              inputClassName={styles.phoneInner}
              countrySelectorClassName={styles.phoneCountry}
              charAfterDialCode=" "
              // Enable keyboard search inside the country selector
              // (cast to any in case of older type defs)
              countrySelectorProps={{ searchable: true, searchPlaceholder: "Search…" } as any}
              aria-invalid={((submitted || phoneTouched) && !phoneValid) ? "true" : "false"}
            />
          </div>

          {/* Helper/error text – appears ONLY after blur or submit */}
          {((submitted || phoneTouched) && !phoneValid) && (
            <p className={styles.error}>{phoneMessage || "Enter a valid phone number."}</p>
          )}
        </div>

        {/* Doc Type */}
        <div className={styles.row}>
          <label className={styles.label}>Document type</label>
          <div className={styles.segment}>
            {(["passport", "national_id", "driver_license"] as DocType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.segmentBtn} ${docType === t ? styles.active : ""}`}
                onClick={() => setDocType(t)}
              >
                {t === "passport" ? "Passport" : t === "national_id" ? "National ID" : "Driver License"}
              </button>
            ))}
          </div>
          <p>
            {personType === "company"
              ? "For now, company accounts use the same document types."
              : "Accepted: Passport, National ID, or Driver License."}
          </p>
        </div>

        {/* Upload (FilePond) */}
        <div className={styles.row}>
          <label className={styles.label}>Upload document (JPG, PNG, or PDF)</label>
          <div className={`${styles.pondWrap} ${submitted && !file ? styles.inputError : ""}`}>
            <FilePond
              allowMultiple={false}
              onupdatefiles={(items: FilePondFile[]) => setFile((items[0]?.file as File) ?? null)}
              acceptedFileTypes={["image/jpeg","image/png","application/pdf","image/webp"]}
              labelFileTypeNotAllowed="Only JPG, PNG, WebP or PDF"
              maxFileSize="10MB"
              labelMaxFileSizeExceeded="File is too large"
              credits={false}
              className={styles.pond}
              name="kycDocument"
            />
          </div>
          {!file && submitted && <p className={styles.error}>Please upload a document.</p>}
          {file?.name ? <p className={styles.hint}>Selected: <b>{file.name}</b></p> : null}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            className={styles.primary}
            style={{ background: colors.accent, color: colors.white, opacity: allOk ? 1 : 0.6 }}
            disabled={!allOk}
            type="submit"
          >
            Continue
          </button>
        </div>
      </form>
    </section>
  );
}
