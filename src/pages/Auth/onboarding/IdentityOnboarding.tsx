import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./IdentityOnboarding.module.css";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import colors from "@/styles/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLanguages, fetchNationalities } from "@/store/slices/metaSlice";

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
  MultiValueProps,
  GroupBase,
  StylesConfig,
} from "react-select";
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

type StoredProfile = {
  role?: "provider" | "consumer";
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  email?: string;
  profilePhoto?: string;
  fullBodyPhoto?: string;
  standingPhoto?: string;
  sittingPhoto?: string;
  galleryPhotos?: string[];
  preferredLanguages?: string[];
  preferredLanguage?: string;
  preferredLanguageIds?: number[];
  nationalityId?: number;
  nationalityCode?: string;
};
type LanguageOption = {
  value: number;
  label: string;
  code?: string | null;
};

type PersonType = "individual" | "company";
type DocType = "passport" | "national_id" | "driver_license";

/** Option shape from react-select-country-list */
type CountryOption = { value: number; label: string; code: string };

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

function fileToDataUrl(file: File | null): Promise<string | null> {
  if (!file) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function filesToDataUrls(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const urls = await Promise.all(files.map((file) => fileToDataUrl(file)));
  return urls.filter((url): url is string => Boolean(url));
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
          countryCode={data.code}
          svg
          style={{ width: 18, height: 18, borderRadius: 4 }}
          aria-label={data.label}
        />
        <span className={styles.countryText}>{data.label}</span>
        <span style={{ marginLeft: "auto", opacity: 0.6, fontWeight: 700 }}>
          {data.code}
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
          countryCode={data.code}
          svg
          style={{ width: 18, height: 18, borderRadius: 4 }}
          aria-label={data.label}
        />
        <span className={styles.countryText}>{data.label}</span>
        <span style={{ marginLeft: 8, opacity: 0.6, fontWeight: 700 }}>
          ({data.code})
        </span>
      </div>
    </components.SingleValue>
  );
};

const LanguageOptionRow = (
  props: OptionProps<LanguageOption, true, GroupBase<LanguageOption>>
) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className={styles.languageRow}>
        {data.code ? (
          <CountryFlag
            countryCode={data.code}
            svg
            style={{ width: 18, height: 18, borderRadius: 4 }}
            aria-label={`${data.label} flag`}
          />
        ) : (
          <span className={styles.languagePlaceholder} aria-hidden="true" />
        )}
        <span className={styles.languageText}>{data.label}</span>
      </div>
    </components.Option>
  );
};

const LanguageMultiValueLabel = (
  props: MultiValueProps<LanguageOption, true, GroupBase<LanguageOption>>
) => {
  const { data } = props;
  return (
    <components.MultiValueLabel {...props}>
      <span className={styles.languageChip}>
        {data.code ? (
          <CountryFlag
            countryCode={data.code}
            svg
            style={{ width: 14, height: 14, borderRadius: 3 }}
            aria-label={`${data.label} flag`}
          />
        ) : null}
        <span>{data.label}</span>
      </span>
    </components.MultiValueLabel>
  );
};

export default function IdentityOnboarding() {
  useRedirectIfAuthenticated("/home");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const languagesState = useAppSelector((state) => state.meta.languages);
  const nationalitiesState = useAppSelector((state) => state.meta.nationalities);
  const languageOptions = useMemo<LanguageOption[]>(() => {
    const items = languagesState.data || [];
    return items.map((item) => ({
      value: item.id,
      label: item.name || item.code || `Language ${item.id}`,
      code: item.code ?? null,
    }));
  }, [languagesState.data]);
  const nationalityOptions = useMemo<CountryOption[]>(() => {
    const items = nationalitiesState.data || [];
    return items.map((item) => ({
      value: item.id,
      label: item.name,
      code: item.code,
    }));
  }, [nationalitiesState.data]);
  const profile = useMemo<StoredProfile>(() => {
    try {
      return JSON.parse(localStorage.getItem("profile") || "{}") as StoredProfile;
    } catch {
      return {};
    }
  }, []);
  const role = profile?.role ?? null;

  const [personType, setPersonType] = useState<PersonType>("individual");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [fullBodyPhotoFile, setFullBodyPhotoFile] = useState<File | null>(null);
  const [sittingPhotoFile, setSittingPhotoFile] = useState<File | null>(null);
  const [extraPhotoFiles, setExtraPhotoFiles] = useState<File[]>([]);
  const derivePreferredLanguageOptions = useCallback((): LanguageOption[] => {
    const byIds = Array.isArray(profile.preferredLanguageIds)
      ? profile.preferredLanguageIds
          .map((id) => languageOptions.find((opt) => opt.value === id) || null)
          .filter((opt): opt is LanguageOption => Boolean(opt))
      : [];
    if (byIds.length) {
      return byIds;
    }
    const storedLanguages = Array.isArray(profile.preferredLanguages)
      ? profile.preferredLanguages
      : [];
    const fallbackLanguages =
      typeof profile.preferredLanguage === "string" && profile.preferredLanguage
        ? profile.preferredLanguage.split(",").map((lang) => lang.trim()).filter(Boolean)
        : [];
    const merged = [...storedLanguages, ...fallbackLanguages];
    const seen = new Set<number>();
    return merged
      .map((lang) => {
        const normalised = lang.trim().toLowerCase();
        const match = languageOptions.find((opt) => {
          const labelMatch = opt.label.toLowerCase() === normalised;
          const codeMatch = opt.code ? opt.code.toLowerCase() === normalised : false;
          return labelMatch || codeMatch;
        });
        return match || null;
      })
      .filter((opt): opt is LanguageOption => {
        if (!opt) return false;
        if (seen.has(opt.value)) return false;
        seen.add(opt.value);
        return true;
      });
  }, [languageOptions, profile.preferredLanguage, profile.preferredLanguageIds, profile.preferredLanguages]);
  const [preferredLanguages, setPreferredLanguages] = useState<LanguageOption[]>([]);

  useEffect(() => {
    if (languagesState.status === "idle") {
      dispatch(fetchLanguages());
    }
    if (nationalitiesState.status === "idle") {
      dispatch(fetchNationalities());
    }
  }, [dispatch, languagesState.status, nationalitiesState.status]);

  useEffect(() => {
    if (preferredLanguages.length === 0 && languageOptions.length > 0) {
      const derived = derivePreferredLanguageOptions();
      if (derived.length) {
        setPreferredLanguages(derived);
      }
    }
  }, [derivePreferredLanguageOptions, languageOptions, preferredLanguages.length]);

  const existingProfilePhoto = profile.profilePhoto || null;
  const existingFullBodyPhoto = profile.fullBodyPhoto || profile.standingPhoto || null;
  const existingSittingPhoto = profile.sittingPhoto || null;
  const existingGallery = Array.isArray(profile.galleryPhotos) ? profile.galleryPhotos : [];

  const storedKycDocument = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("kyc.files") || "{}");
      return raw?.kycDocument ?? null;
    } catch {
      return null;
    }
  }, []);

  // DOB
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const eighteenYearsAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);
  const dobOk = isAdultDate(dobDate);

  const [nationality, setNationality] = useState<CountryOption | null>(null);

  useEffect(() => {
    if (!nationality && nationalityOptions.length > 0) {
      const storedId =
        typeof profile.nationalityId === "number" ? profile.nationalityId : undefined;
      const storedCode =
        typeof profile.nationalityCode === "string" ? profile.nationalityCode : undefined;
      const derived =
        (storedId
          ? nationalityOptions.find((opt) => opt.value === storedId)
          : undefined) ||
        (storedCode
          ? nationalityOptions.find(
              (opt) => opt.code.toLowerCase() === storedCode.toLowerCase()
            )
          : undefined) ||
        nationalityOptions.find((opt) => opt.code === "AE") ||
        nationalityOptions[0];
      if (derived) {
        setNationality(derived);
      }
    }
  }, [nationality, nationalityOptions, profile.nationalityCode, profile.nationalityId]);

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
      const countryLabel = iso2 || "this country";

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
  }, [phone, phoneTouched]);

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
  const [saving, setSaving] = useState(false);

  const requiresFullBody = role === "provider" && personType === "individual";
  const hasProfilePhoto = Boolean(profilePhotoFile || existingProfilePhoto);
  const hasStandingPhoto =
    !requiresFullBody || Boolean(fullBodyPhotoFile || existingFullBodyPhoto);
  const hasSittingPhoto =
    !requiresFullBody || Boolean(sittingPhotoFile || existingSittingPhoto);
  const languageOk = role === "provider" ? preferredLanguages.length > 0 : true;
  const languageInvalid = role === "provider" && submitted && !languageOk;
  const allOk =
    dobOk &&
    !!nationality &&
    !!docType &&
    !!file &&
    !!phone &&
    phoneValid &&
    hasProfilePhoto &&
    hasStandingPhoto &&
    hasSittingPhoto &&
    languageOk;

  const onContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setPhoneTouched(true); // ensure phone validation visible if invalid
    if (!allOk) return;

    setSaving(true);
    try {
      let latestProfile: StoredProfile = {};
      try {
        latestProfile = JSON.parse(localStorage.getItem("profile") || "{}") as StoredProfile;
      } catch {
        latestProfile = {};
      }

      const profilePhotoData =
        (await fileToDataUrl(profilePhotoFile)) ?? latestProfile.profilePhoto ?? null;

      let fullBodyPhotoData: string | null =
        latestProfile.fullBodyPhoto ?? latestProfile.standingPhoto ?? null;
      if (requiresFullBody) {
        fullBodyPhotoData =
          (await fileToDataUrl(fullBodyPhotoFile)) ??
          latestProfile.fullBodyPhoto ??
          latestProfile.standingPhoto ??
          null;
      }

      let sittingPhotoData: string | null = latestProfile.sittingPhoto ?? null;
      if (requiresFullBody) {
        sittingPhotoData =
          (await fileToDataUrl(sittingPhotoFile)) ?? latestProfile.sittingPhoto ?? null;
      }

      let latestKycFiles: Record<string, unknown> = {};
      try {
        latestKycFiles = JSON.parse(localStorage.getItem("kyc.files") || "{}") || {};
      } catch {
        latestKycFiles = {};
      }

      const kycDocumentDataUrl =
        (await fileToDataUrl(file)) ||
        (latestKycFiles as any)?.kycDocument?.dataUrl ||
        null;

      const kycDocumentRecord = kycDocumentDataUrl
        ? {
            dataUrl: kycDocumentDataUrl,
            name: file?.name ?? (latestKycFiles as any)?.kycDocument?.name ?? null,
            type: file?.type ?? (latestKycFiles as any)?.kycDocument?.type ?? null,
            lastModified:
              file?.lastModified ?? (latestKycFiles as any)?.kycDocument?.lastModified ?? null,
          }
        : null;

      const extraGalleryUrls = await filesToDataUrls(extraPhotoFiles);
      const mergedGallery = Array.isArray(latestProfile.galleryPhotos)
        ? [...latestProfile.galleryPhotos]
        : [];
      if (extraGalleryUrls.length > 0) {
        extraGalleryUrls.forEach((url) => {
          if (!mergedGallery.includes(url)) mergedGallery.push(url);
        });
      }

      const uniquePreferredLanguageIds = Array.from(
        new Set(preferredLanguages.map((opt) => opt.value))
      );
      const uniquePreferredLanguageLabels = uniquePreferredLanguageIds
        .map((id) => {
          const fromState =
            preferredLanguages.find((opt) => opt.value === id) ||
            languageOptions.find((opt) => opt.value === id);
          return fromState?.label ?? "";
        })
        .filter((label) => Boolean(label));
      const preferredLanguageDisplay = uniquePreferredLanguageLabels.join(", ");

      const normalizedStandingPhoto =
        requiresFullBody
          ? fullBodyPhotoData
          : latestProfile.standingPhoto ??
            latestProfile.fullBodyPhoto ??
            fullBodyPhotoData;

      const normalizedSittingPhoto =
        requiresFullBody ? sittingPhotoData : latestProfile.sittingPhoto ?? null;

      const nextProfile: StoredProfile = {
        ...latestProfile,
        profilePhoto: profilePhotoData || undefined,
        fullBodyPhoto: normalizedStandingPhoto || undefined,
        standingPhoto: normalizedStandingPhoto || undefined,
        sittingPhoto: normalizedSittingPhoto || undefined,
        preferredLanguages:
          uniquePreferredLanguageLabels.length > 0 ? uniquePreferredLanguageLabels : undefined,
        preferredLanguageIds:
          uniquePreferredLanguageIds.length > 0 ? uniquePreferredLanguageIds : undefined,
        preferredLanguage: preferredLanguageDisplay || undefined,
        nationalityId: nationality?.value ?? latestProfile.nationalityId,
        nationalityCode: nationality?.code ?? latestProfile.nationalityCode,
        galleryPhotos: mergedGallery.length > 0 ? mergedGallery : undefined,
      };

      localStorage.setItem("profile", JSON.stringify(nextProfile));

      if (kycDocumentRecord) {
        localStorage.setItem(
          "kyc.files",
          JSON.stringify({
            ...(latestKycFiles || {}),
            kycDocument: kycDocumentRecord,
          })
        );
      }

      const identity = {
        personType,
        dob: dobDate ? toISODateOnly(dobDate) : null,
        nationality: nationality?.label ?? null,
        nationalityCode: nationality?.code ?? null,
        nationalityId: nationality?.value ?? null,
        phone: normalizeE164(phone),
        docType,
        docName: kycDocumentRecord?.name || file?.name || null,
        preferredLanguages: nextProfile.preferredLanguages ?? [],
        preferredLanguage: nextProfile.preferredLanguage || null,
        preferredLanguageIds: nextProfile.preferredLanguageIds ?? [],
        profilePhotoSet: Boolean(nextProfile.profilePhoto),
        fullBodyPhotoSet: Boolean(nextProfile.fullBodyPhoto),
        standingPhotoSet: Boolean(nextProfile.standingPhoto),
        sittingPhotoSet: Boolean(nextProfile.sittingPhoto),
        galleryCount: nextProfile.galleryPhotos?.length ?? 0,
        savedAt: new Date().toISOString(),
        docDataUrl: kycDocumentRecord?.dataUrl || null,
        docMimeType: kycDocumentRecord?.type || null,
        docLastModified: kycDocumentRecord?.lastModified ?? null,
      };

      localStorage.setItem("kyc.identity", JSON.stringify(identity));

      if (role === "provider") {
        navigate("/auth/BankDetails");
      } else {
        navigate("/auth/approval?role=consumer");
      }
    } catch (error) {
      console.error("Failed to save identity data", error);
      if (typeof window !== "undefined") {
        window.alert("We couldn't save your details. Please try again.");
      }
    } finally {
      setSaving(false);
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

  const languageSelectStyles = useMemo<StylesConfig<LanguageOption, true>>(
    () => ({
      control: (base, state) => ({
        ...base,
        borderRadius: 12,
        borderColor: languageInvalid
          ? "rgba(198,40,40,0.5)"
          : state.isFocused
          ? "rgb(169, 174, 155)"
          : "rgba(0,0,0,0.08)",
        boxShadow: languageInvalid
          ? "0 0 0 3px rgba(198,40,40,0.12)"
          : state.isFocused
          ? "0 0 0 3px rgba(169,174,155,0.18)"
          : "none",
        padding: "2px 2px",
        minHeight: 46,
        background: "#fff",
        fontWeight: 600,
        ":hover": {
          borderColor: languageInvalid ? "rgba(198,40,40,0.5)" : "rgba(0,0,0,0.18)",
        },
      }),
      valueContainer: (base) => ({
        ...base,
        padding: "4px 8px",
        gap: 4,
        flexWrap: "wrap",
      }),
      placeholder: (base) => ({
        ...base,
        color: "rgba(0,0,0,0.4)",
      }),
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
      multiValue: (base) => ({
        ...base,
        borderRadius: 10,
        background: "rgba(169,174,155,0.14)",
        border: "1px solid rgba(169,174,155,0.35)",
        paddingRight: 2,
      }),
      multiValueLabel: (base) => ({
        ...base,
        fontWeight: 600,
        color: "#111",
        padding: "2px 6px",
      }),
      multiValueRemove: (base) => ({
        ...base,
        borderRadius: 8,
        color: "#555",
        ":hover": {
          backgroundColor: "rgba(0,0,0,0.08)",
          color: "#111",
        },
      }),
    }),
    [languageInvalid]
  );

  // Filter to search by country name OR ISO code
  const countryFilter = createFilter<CountryOption>({
    ignoreCase: true,
    stringify: (option) => `${option.label} ${option.code}`,
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
            options={nationalityOptions}
            value={nationality}
            onChange={(v) => setNationality(v ?? null)}
            components={{ Option: CountryOptionRow, SingleValue: CountrySingleValue }}
            styles={selectStyles}
            className={styles.selectWrapper}
            classNamePrefix="react-select"
            isSearchable
            isLoading={nationalitiesState.status === "loading"}
            isDisabled={nationalityOptions.length === 0}
            filterOption={countryFilter}
            placeholder={nationalitiesState.status === "loading" ? "Loading…" : "Search country…"}
            noOptionsMessage={() =>
              nationalitiesState.status === "loading" ? "Loading…" : "No countries found"
            }
            menuPlacement="auto"
            getOptionValue={(option) => option.value.toString()}
          />
          {nationalitiesState.status === "failed" ? (
            <p className={styles.error}>Unable to load nationalities. Please try again.</p>
          ) : submitted && !nationality ? (
            <p className={styles.error}>Please select a nationality.</p>
          ) : null}
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

        {/* Profile photo */}
        <div className={styles.row}>
          <label className={styles.label}>
            Profile photo{role === "provider" ? " (close-up)" : ""}
          </label>
          <div className={`${styles.pondWrap} ${(submitted && !hasProfilePhoto) ? styles.inputError : ""}`}>
            <FilePond
              allowMultiple={false}
              acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
              labelFileTypeNotAllowed="Only JPG, PNG, or WebP images"
              maxFileSize="8MB"
              labelMaxFileSizeExceeded="Image is too large"
              onupdatefiles={(items: FilePondFile[]) =>
                setProfilePhotoFile((items[0]?.file as File) ?? null)
              }
              credits={false}
              className={styles.pond}
              name="profilePhoto"
            />
          </div>
          {existingProfilePhoto && !profilePhotoFile ? (
            <div className={styles.previewRow}>
              <img src={existingProfilePhoto} alt="Current profile" className={styles.previewThumb} />
              <p className={styles.hint}>Existing photo will stay unless you replace it.</p>
            </div>
          ) : (
            <p className={styles.hint}>Upload a clear photo of your face.</p>
          )}
          {submitted && !hasProfilePhoto && <p className={styles.error}>Please upload a profile photo.</p>}
        </div>

        {/* Full body & sitting photos (provider individual) */}
        {role === "provider" && personType === "individual" && (
          <>
            <div className={styles.row}>
              <label className={styles.label}>Full body photo (standing)</label>
              <div className={`${styles.pondWrap} ${(submitted && !hasStandingPhoto) ? styles.inputError : ""}`}>
                <FilePond
                  allowMultiple={false}
                  acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                  labelFileTypeNotAllowed="Only JPG, PNG, or WebP images"
                  maxFileSize="8MB"
                  labelMaxFileSizeExceeded="Image is too large"
                  onupdatefiles={(items: FilePondFile[]) =>
                    setFullBodyPhotoFile((items[0]?.file as File) ?? null)
                  }
                  credits={false}
                  className={styles.pond}
                  name="standingPhoto"
                />
              </div>
              {existingFullBodyPhoto && !fullBodyPhotoFile ? (
                <div className={styles.previewRow}>
                  <img src={existingFullBodyPhoto} alt="Current standing photo" className={styles.previewThumb} />
                  <p className={styles.hint}>Existing photo will stay unless you replace it.</p>
                </div>
              ) : (
                <p className={styles.hint}>Upload a full-length standing photo so clients can see your presence.</p>
              )}
              {submitted && !hasStandingPhoto && (
                <p className={styles.error}>Please upload a standing full body photo.</p>
              )}
            </div>

            <div className={styles.row}>
              <label className={styles.label}>Sitting photo</label>
              <div className={`${styles.pondWrap} ${(submitted && !hasSittingPhoto) ? styles.inputError : ""}`}>
                <FilePond
                  allowMultiple={false}
                  acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                  labelFileTypeNotAllowed="Only JPG, PNG, or WebP images"
                  maxFileSize="8MB"
                  labelMaxFileSizeExceeded="Image is too large"
                  onupdatefiles={(items: FilePondFile[]) =>
                    setSittingPhotoFile((items[0]?.file as File) ?? null)
                  }
                  credits={false}
                  className={styles.pond}
                  name="sittingPhoto"
                />
              </div>
              {existingSittingPhoto && !sittingPhotoFile ? (
                <div className={styles.previewRow}>
                  <img src={existingSittingPhoto} alt="Current sitting photo" className={styles.previewThumb} />
                  <p className={styles.hint}>Existing photo will stay unless you replace it.</p>
                </div>
              ) : (
                <p className={styles.hint}>Upload a seated photo for identity verification.</p>
              )}
              {submitted && !hasSittingPhoto && (
                <p className={styles.error}>Please upload a sitting photo.</p>
              )}
            </div>
          </>
        )}

        {/* Additional gallery photos */}
        {role === "provider" && (
          <div className={styles.row}>
            <label className={styles.label}>Additional photos (optional)</label>
            <div className={styles.pondWrap}>
              <FilePond
                allowMultiple
                maxFiles={6}
                credits={false}
                className={styles.pond}
                acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                labelFileTypeNotAllowed="Only JPG, PNG, or WebP images"
                maxFileSize="8MB"
                labelMaxFileSizeExceeded="Image is too large"
                onupdatefiles={(items: FilePondFile[]) =>
                  setExtraPhotoFiles(
                    items
                      .map((item) => item.file as File | null)
                      .filter((file): file is File => Boolean(file))
                  )
                }
                name="galleryPhotos"
              />
            </div>
            {existingGallery.length > 0 ? (
              <p className={styles.hint}>
                {existingGallery.length} saved photo{existingGallery.length === 1 ? "" : "s"} will remain. Add more if you like.
              </p>
            ) : (
              <p className={styles.hint}>Add more photos to showcase your work.</p>
            )}
          </div>
        )}

        {role === "provider" && (
          <div className={styles.row}>
            <label className={styles.label}>
              Preferred languages (required)
            </label>
            <Select<LanguageOption, true>
              className={styles.selectWrapper}
              classNamePrefix="react-select"
              options={languageOptions}
              value={preferredLanguages}
              onChange={(selected) =>
                setPreferredLanguages((selected || []) as LanguageOption[])
              }
              components={{ Option: LanguageOptionRow, MultiValueLabel: LanguageMultiValueLabel }}
              styles={languageSelectStyles}
              isMulti
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              placeholder={
                languagesState.status === "loading" ? "Loading languages…" : "Select languages…"
              }
              noOptionsMessage={() =>
                languagesState.status === "loading" ? "Loading…" : "No languages found"
              }
              isClearable
              isSearchable
              isDisabled={languageOptions.length === 0}
              isLoading={languagesState.status === "loading"}
              menuPlacement="auto"
              aria-invalid={languageInvalid}
              getOptionValue={(option) => option.value.toString()}
            />
            {languagesState.status === "failed" ? (
              <p className={styles.error}>Unable to load languages. Please try again.</p>
            ) : submitted && !languageOk ? (
              <p className={styles.error}>Select at least one language.</p>
            ) : (
              <p className={styles.hint}>Pick every language you can confidently speak with clients.</p>
            )}
          </div>
        )}

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
          <div
            className={`${styles.pondWrap} ${
              submitted && !(file || storedKycDocument) ? styles.inputError : ""
            }`}
          >
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
          {!file && !storedKycDocument && submitted && (
            <p className={styles.error}>Please upload a document.</p>
          )}
          {file?.name ? (
            <p className={styles.hint}>
              Selected: <b>{file.name}</b>
            </p>
          ) : storedKycDocument?.name ? (
            <p className={styles.hint}>
              Current document: <b>{storedKycDocument.name}</b>
            </p>
          ) : null}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            className={styles.primary}
            style={{ background: colors.accent, color: colors.white, opacity: allOk && !saving ? 1 : 0.6 }}
            disabled={!allOk || saving}
            type="submit"
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </form>
    </section>
  );
}
