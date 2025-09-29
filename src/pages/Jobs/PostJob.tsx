import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select, {
  components,
  type MultiValueProps,
  type OptionProps,
  type SingleValueProps,
  type StylesConfig,
} from "react-select";
import CountryFlag from "react-country-flag";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import styles from "../Home/Home.module.css";
import {
  createConsumerJob,
  listCountryMeta,
  type CreateJobInput,
} from "@/data/demoJobs";

import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

type ServiceOption = {
  id: string;
  label: string;
  category: string;
  durationMinutes?: number;
};

type CountryMeta = ReturnType<typeof listCountryMeta>[number];

type Option = { value: string; label: string };

type DaySlot = {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  custom?: boolean;   // user changed time or date manually
};

type ServiceRow = {
  key: string;
  serviceId: string;
  providers: string;
  allowedCountries: string[];
};

const SERVICE_OPTIONS: ServiceOption[] = [
  { id: "svc-clean-deep", label: "Deep Cleaning Crew", category: "cleaning", durationMinutes: 180 },
  { id: "svc-clean-standard", label: "Standard Apartment Cleaning", category: "cleaning", durationMinutes: 150 },
  { id: "svc-barista", label: "Event Barista", category: "barista", durationMinutes: 240 },
  { id: "svc-hostess", label: "Event Hostess", category: "hostess", durationMinutes: 300 },
  { id: "svc-security", label: "Venue Security", category: "security", durationMinutes: 360 },
  { id: "svc-driver", label: "Private Driver", category: "driver", durationMinutes: 240 },
  { id: "svc-electrical", label: "Electrical Maintenance", category: "electrical", durationMinutes: 180 },
  { id: "svc-painting", label: "Interior Painting", category: "painting", durationMinutes: 420 },
  { id: "svc-plumbing", label: "Kitchen Plumbing", category: "plumbing", durationMinutes: 150 },
  { id: "svc-ac", label: "AC Maintenance", category: "ac", durationMinutes: 210 },
];

const COUNTRY_META = listCountryMeta();
const COUNTRY_OPTIONS: Option[] = COUNTRY_META.map((c) => ({ value: c.code, label: c.name }));

const LANGUAGE_OPTIONS: Option[] = [
  { value: "Arabic", label: "Arabic" },
  { value: "English", label: "English" },
  { value: "French", label: "French" },
  { value: "Hindi", label: "Hindi" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Tagalog", label: "Tagalog" },
  { value: "Urdu", label: "Urdu" },
];

const defaultCoords = { latitude: 25.2048, longitude: 55.2708 };

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "17:00";

const makeServiceRow = (): ServiceRow => ({
  key: `svc-${Math.random().toString(36).slice(2, 10)}`,
  serviceId: "",
  providers: "",
  allowedCountries: ["AE"],
});

const iconUrlsReady = typeof window !== "undefined";
let leafletIconReady = false;
if (iconUrlsReady && !leafletIconReady) {
  const icon = L.icon({
    iconUrl: markerIconUrl,
    iconRetinaUrl: markerIcon2xUrl,
    shadowUrl: markerShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    popupAnchor: [1, -34],
  });
  (L.Marker.prototype as any).options.icon = icon;
  leafletIconReady = true;
}

const CountryOptionRow = (props: OptionProps<Option, boolean>) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className={styles.countryRow}>
        <CountryFlag countryCode={data.value} svg style={{ width: 18, height: 18, borderRadius: 4 }} />
        <span className={styles.countryText}>{data.label}</span>
        <span style={{ marginLeft: "auto", opacity: 0.55, fontWeight: 700 }}>{data.value}</span>
      </div>
    </components.Option>
  );
};

const CountrySingleValue = (props: SingleValueProps<Option, false>) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div className={styles.countryRow}>
        <CountryFlag countryCode={data.value} svg style={{ width: 18, height: 18, borderRadius: 4 }} />
        <span className={styles.countryText}>{data.label}</span>
        <span style={{ marginLeft: 8, opacity: 0.6, fontWeight: 700 }}>({data.value})</span>
      </div>
    </components.SingleValue>
  );
};

const CountryMultiValue = (props: MultiValueProps<Option>) => {
  const { data } = props;
  return (
    <components.MultiValue {...props}>
      <div className={styles.multiValueChip}>
        <CountryFlag countryCode={data.value} svg style={{ width: 14, height: 14, borderRadius: 3 }} />
        <span>{data.value}</span>
      </div>
    </components.MultiValue>
  );
};

const selectBase: StylesConfig<Option, false> = {
  control: (base) => ({ ...base, minHeight: 44, borderRadius: 12 }),
  menu: (base) => ({ ...base, zIndex: 20 }),
  menuPortal: (base) => ({ ...base, zIndex: 20 }),
};

const multiSelectBase: StylesConfig<Option, true> = {
  control: (base) => ({ ...base, minHeight: 44, borderRadius: 12 }),
  menu: (base) => ({ ...base, zIndex: 20 }),
  menuPortal: (base) => ({ ...base, zIndex: 20 }),
  multiValue: (base) => ({ ...base, background: "transparent" }),
  multiValueRemove: (base) => ({ ...base, display: "none" }),
};

const languageSelectStyles: StylesConfig<Option, true> = {
  ...multiSelectBase,
  multiValueRemove: (base) => ({ ...base, display: "flex" }),
};

type LocationMarkerProps = {
  position: { lat: number; lng: number };
  onSelect: (lat: number, lng: number) => void;
};

function LocationMarker({ position, onSelect }: LocationMarkerProps) {
  useMapEvents({
    click: ({ latlng }) => onSelect(latlng.lat, latlng.lng),
  });
  return <Marker position={position} />;
}

function formatCurrency(minor: number, currency: string) {
  if (!minor) return "TBD";
  return `${currency} ${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function parseLinkCoords(link: string): { lat: number; lng: number } | null {
  if (!link) return null;
  const at = link.match(/@(\-?\d+\.\d+),(\-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  const q = link.match(/q=(\-?\d+\.\d+),(\-?\d+\.\d+)/);
  if (q) return { lat: Number(q[1]), lng: Number(q[2]) };
  const plain = link.match(/(\-?\d+\.\d+)\s*,\s*(\-?\d+\.\d+)/);
  if (plain) return { lat: Number(plain[1]), lng: Number(plain[2]) };
  return null;
}

const toTimeLabel = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

/** ---------- Local-date helpers to avoid UTC off-by-one ---------- */
function formatYYYYMMDDLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysISO(baseISO: string, delta: number) {
  // local-time add (no timezone shift)
  const d = new Date(`${baseISO}T00:00:00`);
  d.setHours(12, 0, 0, 0); // stabilize around noon
  d.setDate(d.getDate() + delta);
  return formatYYYYMMDDLocal(d);
}

function compareISODate(a: string, b: string) {
  const left = new Date(`${a}T00:00:00`);
  const right = new Date(`${b}T00:00:00`);
  left.setHours(12, 0, 0, 0);
  right.setHours(12, 0, 0, 0);
  const diff = left.getTime() - right.getTime();
  if (diff === 0) return 0;
  return diff > 0 ? 1 : -1;
}

function daysInRange(startISO: string, endISO: string): string[] {
  if (!startISO || !endISO) return [];
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  // stabilize both at noon to avoid DST/UTC off-by-one
  const dir = start <= end ? 1 : -1;
  const out: string[] = [];

  const cur = new Date(start);
  cur.setHours(12, 0, 0, 0);

  const endNoon = new Date(end);
  endNoon.setHours(12, 0, 0, 0);

  while ((dir === 1 && cur.getTime() <= endNoon.getTime()) ||
         (dir === -1 && cur.getTime() >= endNoon.getTime())) {
    out.push(formatYYYYMMDDLocal(cur));
    cur.setDate(cur.getDate() + dir);
  }
  return dir === 1 ? out : out.reverse();
}

export default function PostJob() {
  const navigate = useNavigate();
  const portalTarget = typeof document !== "undefined" ? document.body : undefined;
  const todayISO = useMemo(() => formatYYYYMMDDLocal(new Date()), []);

  // Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageData, setImageData] = useState<string | undefined>();
  const [countryCode, setCountryCode] = useState<string>("AE");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [building, setBuilding] = useState("");
  const [apartment, setApartment] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: defaultCoords.latitude,
    lng: defaultCoords.longitude,
  });
  const [locationLink, setLocationLink] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  // Range-based scheduling
  const [rangeStartDate, setRangeStartDate] = useState(todayISO);
  const [rangeEndDate, setRangeEndDate] = useState(todayISO);
  const [baseStartTime, setBaseStartTime] = useState(DEFAULT_START_TIME);
  const [baseEndTime, setBaseEndTime] = useState(DEFAULT_END_TIME);

  // keep per-day slots + preserve custom edits by date
  const [daySlots, setDaySlots] = useState<DaySlot[]>([
    { date: todayISO, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME, custom: false },
  ]);

  // dates excluded from the current range
  const [excludedDates, setExcludedDates] = useState<Set<string>>(new Set());

  // map of custom-edited slots keyed by date to preserve across range changes
  const [customSlots, setCustomSlots] = useState<Map<string, DaySlot>>(new Map());

  const [preferredLanguages, setPreferredLanguages] = useState<Option[]>([]);
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([makeServiceRow()]);
  const [submitted, setSubmitted] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMapReady(true);
    }
  }, []);

  // Base slot factory for a given date
  const makeBaseSlotForDate = useCallback(
    (dateISO: string): DaySlot => ({
      date: dateISO,
      startTime: baseStartTime,
      endTime: baseEndTime,
      custom: false,
    }),
    [baseStartTime, baseEndTime]
  );

  // Ensure start/end boundaries are never excluded
  useEffect(() => {
    setExcludedDates((prev) => {
      const next = new Set(prev);
      next.delete(rangeStartDate);
      next.delete(rangeEndDate);
      return next;
    });
  }, [rangeStartDate, rangeEndDate]);

  // Recompute daySlots whenever range / times / exclusions change
  useEffect(() => {
    const allDates = daysInRange(rangeStartDate, rangeEndDate);
    const next: DaySlot[] = [];

    for (const dateISO of allDates) {
      if (excludedDates.has(dateISO)) continue;

      const custom = customSlots.get(dateISO);
      if (custom) {
        next.push({ ...custom, date: dateISO, custom: true });
      } else {
        next.push(makeBaseSlotForDate(dateISO));
      }
    }
    setDaySlots(next);
  }, [rangeStartDate, rangeEndDate, baseStartTime, baseEndTime, excludedDates, customSlots, makeBaseSlotForDate]);

  // Handle change on a visible day card (by index)
  const handleDaySlotChange = (index: number, field: keyof DaySlot, value: string) => {
    setDaySlots((prev) => {
      const copy = [...prev];
      const target = copy[index];
      if (!target) return prev;
      const updated: DaySlot = { ...target, [field]: value, custom: true };

      setCustomSlots((map) => {
        const next = new Map(map);
        next.set(updated.date, updated);
        return next;
      });

      copy[index] = updated;
      return copy;
    });
  };

  // Reset one day back to base (and clear its custom record)
  const resetDaySlot = (index: number) => {
    setDaySlots((prev) => {
      const copy = [...prev];
      const target = copy[index];
      if (!target) return prev;

      const base = makeBaseSlotForDate(target.date);
      copy[index] = base;

      setCustomSlots((map) => {
        const next = new Map(map);
        next.delete(target.date);
        return next;
      });

      return copy;
    });
  };

  // Exclude a day from the range (hide its card) – but never boundaries
  const excludeDay = (dateISO: string) => {
    if (dateISO === rangeStartDate || dateISO === rangeEndDate) return;
    setExcludedDates((s) => new Set([...s, dateISO]));
  };

  // Restore an excluded day
  const restoreDay = (dateISO: string) => {
    setExcludedDates((s) => {
      const next = new Set(s);
      next.delete(dateISO);
      return next;
    });
  };

  // Ensure end date is within [start .. start+6] and not before start
  const onChangeStartDate = (raw: string) => {
    const nextValue = raw || todayISO;
    const startDateObj = new Date(`${nextValue}T00:00:00`);
    startDateObj.setHours(12, 0, 0, 0);
    const normalized = formatYYYYMMDDLocal(startDateObj);
    setRangeStartDate(normalized);
    const maxEnd = addDaysISO(normalized, 6); // max 7 days inclusive
    setRangeEndDate((prev) => {
      const previous = prev || normalized;
      if (compareISODate(previous, normalized) < 0) return normalized;
      if (compareISODate(previous, maxEnd) > 0) return maxEnd;
      return previous;
    });
  };

  const onChangeEndDate = (raw: string) => {
    const nextValue = raw || rangeStartDate;
    const clampedMax = addDaysISO(rangeStartDate, 6);
    if (compareISODate(nextValue, rangeStartDate) < 0) {
      setRangeEndDate(rangeStartDate);
    } else if (compareISODate(nextValue, clampedMax) > 0) {
      setRangeEndDate(clampedMax);
    } else {
      setRangeEndDate(nextValue);
    }
  };

  const serviceOptionMap = useMemo(() => {
    const map = new Map<string, ServiceOption>();
    SERVICE_OPTIONS.forEach((opt) => map.set(opt.id, opt));
    return map;
  }, []);

  const countryMap = useMemo(() => {
    const map = new Map<string, CountryMeta>();
    COUNTRY_META.forEach((meta) => map.set(meta.code, meta));
    return map;
  }, []);

  const withUpdatedRow = (key: string, updater: (row: ServiceRow) => ServiceRow) => {
    setServiceRows((rows) => rows.map((row) => (row.key === key ? updater(row) : row)));
  };

  const addRow = () => setServiceRows((rows) => [...rows, makeServiceRow()]);
  const removeRow = (key: string) => setServiceRows((rows) => rows.filter((row) => row.key !== key));

  const parseProviders = (value: string) => {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
  };

  const rowPrices = useMemo(
    () =>
      serviceRows.map((row) => {
        const providers = parseProviders(row.providers);
        if (!providers) return 0;
        const option = serviceOptionMap.get(row.serviceId);
        if (!option) return 0;
        const rates = row.allowedCountries
          .map((code) => countryMap.get(code)?.rateMinor ?? 0)
          .filter(Boolean);
        if (!rates.length) return 0;
        const averageRate = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
        return averageRate * providers;
      }),
    [serviceRows, serviceOptionMap, countryMap]
  );

  const totalPriceMinor = useMemo(
    () => rowPrices.reduce((acc, price) => acc + price, 0),
    [rowPrices]
  );

  const category = useMemo(() => {
    const firstRow = serviceRows.find((row) => serviceOptionMap.get(row.serviceId));
    return firstRow ? serviceOptionMap.get(firstRow.serviceId)!.category : "cleaning";
  }, [serviceRows, serviceOptionMap]);

  const languagesValid = preferredLanguages.length > 0;
  const baseTimesValid = baseStartTime < baseEndTime;
  const slotsValid =
    daySlots.length > 0 &&
    daySlots.length <= 7 && // defensive: never more than 7 visible days
    daySlots.every((slot) => {
      if (!slot.date || !slot.startTime || !slot.endTime) return false;
      const startStamp = Date.parse(`${slot.date}T${slot.startTime}`);
      const endStamp = Date.parse(`${slot.date}T${slot.endTime}`);
      if (!Number.isFinite(startStamp) || !Number.isFinite(endStamp)) return false;
      return endStamp > startStamp;
    });

  const endDateSummary = useMemo(() => {
    if (!daySlots.length) return "";
    const sorted = [...daySlots].sort((a, b) => a.date.localeCompare(b.date));
    const last = sorted[sorted.length - 1];
    const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
    const dateLabel = formatter.format(new Date(`${last.date}T00:00:00`));
    return `${dateLabel} • ${toTimeLabel(last.startTime)} – ${toTimeLabel(last.endTime)}`;
  }, [daySlots]);

  const canSubmit = () => {
    const titleValid = title.trim().length >= 4;
    const descValid = description.trim().length >= 12;
    const locationValid = line1.trim().length > 0 && city.trim().length > 0 && state.trim().length > 0;
    const servicesValid =
      serviceRows.length > 0 &&
      serviceRows.every((row) => {
        const opt = serviceOptionMap.get(row.serviceId);
        return Boolean(opt) && parseProviders(row.providers) > 0 && row.allowedCountries.length > 0;
      });
    const rangeValid =
      new Date(`${rangeStartDate}T00:00:00`) <= new Date(`${rangeEndDate}T00:00:00`);
    return (
      titleValid &&
      descValid &&
      locationValid &&
      languagesValid &&
      baseTimesValid &&
      slotsValid &&
      servicesValid &&
      rangeValid
    );
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!canSubmit()) return;

    const scheduleDaysPayload = daySlots
      .map((slot) => ({
        dateISO: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))
      .sort((a, b) => {
        const dateCompare = a.dateISO.localeCompare(b.dateISO);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

    const startMs = scheduleDaysPayload
      .map((slot) => Date.parse(`${slot.dateISO}T${slot.startTime}`))
      .filter((value) => Number.isFinite(value));
    const endMs = scheduleDaysPayload
      .map((slot) => Date.parse(`${slot.dateISO}T${slot.endTime}`))
      .filter((value) => Number.isFinite(value));

    const earliestStart = startMs.length ? Math.min(...startMs) : Date.now();
    const latestEnd = endMs.length ? Math.max(...endMs) : earliestStart + 60 * 60000;
    const scheduleFromISO = new Date(earliestStart).toISOString();
    const scheduleToISO = new Date(Math.max(latestEnd, earliestStart + 60 * 60000)).toISOString();

    const services: CreateJobInput["services"] = serviceRows.map((row, index) => {
      const option = serviceOptionMap.get(row.serviceId)!;
      return {
        id: row.serviceId,
        label: option.label,
        providersRequired: parseProviders(row.providers),
        allowedCountries: row.allowedCountries,
        durationMinutes: option.durationMinutes,
        priceMinor: rowPrices[index],
      };
    });

    const preferredLanguageValues = preferredLanguages.map((opt) => opt.value);

    const payload: CreateJobInput = {
      title: title.trim(),
      description: description.trim(),
      category,
      image: imageData,
      schedule: {
        fromISO: scheduleFromISO,
        toISO: scheduleToISO,
      },
      scheduleDays: scheduleDaysPayload,
      preferredLanguages: preferredLanguageValues,
      address: {
        line1: line1.trim(),
        city: city.trim(),
        state: state.trim(),
        building: building.trim() || undefined,
        apartment: apartment.trim() || undefined,
        countryCode,
        latitude: position.lat,
        longitude: position.lng,
        mapLink: locationLink.trim() || undefined,
      },
      services,
    };

    const created = createConsumerJob(payload);
    navigate(`/jobs/${created.id}`);
  };

  const selectedCountry = countryMap.get(countryCode);
  const currency = selectedCountry?.currency ?? "AED";

  const serviceOptionsForSelect: Option[] = SERVICE_OPTIONS.map((svc) => ({
    value: svc.id,
    label: svc.label,
  }));

  const applyLocationLink = () => {
    if (!locationLink.trim()) {
      setLocationError(null);
      return;
    }
    const coords = parseLinkCoords(locationLink.trim());
    if (!coords) {
      setLocationError("Could not extract coordinates from this link");
      return;
    }
    setPosition({ lat: coords.lat, lng: coords.lng });
    setLocationError(null);
  };

  const excludedDatesList = useMemo(
    () =>
      Array.from(excludedDates)
        .filter((d) => d !== rangeStartDate && d !== rangeEndDate) // hide boundaries
        .sort(),
    [excludedDates, rangeStartDate, rangeEndDate]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageData(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(typeof reader.result === "string" ? reader.result : undefined);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <div className={styles.greeting}>Post a Job</div>
            <div className={styles.roleBadge}>Consumer</div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryBtn} onClick={() => navigate("/home")}>Cancel</button>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className={styles.centerRow}>
        <div className={styles.listGroup}>
          <div className={styles.listItem}><span className={styles.listText} style={{ fontWeight: 900 }}>Job details</span></div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <input
              className={styles.searchInput}
              placeholder="Job title (e.g., Deep Cleaning Crew)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={(submitted && title.trim().length < 4) || undefined}
              required
            />
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <textarea
              className={styles.searchInput}
              style={{ minHeight: 120, resize: "vertical", paddingTop: 12 }}
              placeholder="Describe the job, expectations, and any supplies provided"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={(submitted && description.trim().length < 12) || undefined}
              required
            />
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <Select<Option, true>
              styles={languageSelectStyles}
              isMulti
              closeMenuOnSelect={false}
              options={LANGUAGE_OPTIONS}
              value={preferredLanguages}
              placeholder="Preferred communication languages"
              onChange={(values) => setPreferredLanguages((values || []) as Option[])}
              menuPortalTarget={portalTarget}
              menuPosition="fixed"
            />
            {submitted && preferredLanguages.length === 0 ? (
              <span className={styles.formError}>Select at least one language.</span>
            ) : (
              <span className={styles.inputHint}>Tell providers which language you prefer to communicate in.</span>
            )}
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <label className={styles.uploadBox}>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <div className={styles.uploadContent}>
                <span role="img" aria-label="Upload">📤</span>
                <div className={styles.uploadText}>Click to upload a cover image</div>
                <div className={styles.uploadHint}>PNG, JPG up to 5MB</div>
              </div>
            </label>
          </div>
          {imageData && (
            <div className={styles.uploadPreview}>
              <img src={imageData} alt="Preview" />
            </div>
          )}
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{ fontWeight: 900 }}>Schedule</span>
          </div>

          {/* Base range */}
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <div className={styles.scheduleBaseGrid}>
              <label className={styles.inlineField}>
                <span className={styles.inlineLabel}>Start date</span>
                <input
                  className={styles.searchInput}
                  type="date"
                  value={rangeStartDate}
                  onChange={(e) => onChangeStartDate(e.target.value)}
                  required
                />
              </label>
              <label className={styles.inlineField}>
                <span className={styles.inlineLabel}>End date</span>
                <input
                  className={styles.searchInput}
                  type="date"
                  value={rangeEndDate}
                  min={rangeStartDate}
                  max={addDaysISO(rangeStartDate, 6)}  // cap to 7 days total
                  onChange={(e) => onChangeEndDate(e.target.value)}
                  required
                />
              </label>
            </div>
          </div>

          {/* Base times */}
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <div className={styles.scheduleBaseGrid}>
              <label className={styles.inlineField}>
                <span className={styles.inlineLabel}>Start time</span>
                <input
                  className={styles.searchInput}
                  type="time"
                  value={baseStartTime}
                  onChange={(e) => setBaseStartTime(e.target.value)}
                  required
                />
              </label>
              <label className={styles.inlineField}>
                <span className={styles.inlineLabel}>End time</span>
                <input
                  className={styles.searchInput}
                  type="time"
                  value={baseEndTime}
                  onChange={(e) => setBaseEndTime(e.target.value)}
                  required
                />
              </label>
            </div>
            {submitted && !baseTimesValid && (
              <span className={styles.formError}>End time must be after start time.</span>
            )}
            <span className={styles.inputHint}>
              These times apply to all days by default. You can fine-tune each day below.
            </span>
            {endDateSummary && (
              <span className={styles.inputHint}>Schedule ends {endDateSummary}</span>
            )}
          </div>

          {/* Excluded days quick panel */}
          {excludedDatesList.length > 0 && (
            <div className={`${styles.listItem} ${styles.listItemBlock}`} style={{ display: "grid", gap: 8 }}>
              <div className={styles.listText} style={{ fontWeight: 700 }}>Excluded days</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {excludedDatesList.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => restoreDay(d)}
                    title="Add this day back"
                  >
                    {d} — Add back
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Per-day controls */}
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
              <span className={styles.inputHint}>
                Remove days in the range or adjust individual times as needed.
              </span>
            <div className={styles.scheduleDaysGrid}>
              {daySlots.map((slot, index) => {
                const isBoundary = slot.date === rangeStartDate || slot.date === rangeEndDate;
                {/* Right below the three inputs */}
                {(() => {
                  const invalid = slot.startTime >= slot.endTime;
                  if (invalid) return <span className={styles.formError}>End time must be after start time.</span>;
                  if (excludedDates.has(slot.date)) return <span className={styles.inputHint}>Excluded from this request.</span>;
                  if (slot.custom) return <span className={styles.inputHint}>Custom time for this day.</span>;
                  return <span className={styles.inputHint}>Uses the default time.</span>;
                })()}
                return (
                  <div key={`slot-${slot.date}`} className={styles.scheduleDayCard}>
                    <div className={styles.scheduleDayHeader}>
                      <span className={styles.scheduleDayLabel}>
                        {new Date(`${slot.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        {slot.custom ? (
                          <button type="button" className={styles.scheduleResetBtn} onClick={() => resetDaySlot(index)}>
                            Reset times
                          </button>
                        ) : null}
                        {!isBoundary && (
                          <button
                            type="button"
                            className={styles.scheduleResetBtn}   // <-- unify style
                            onClick={() => excludeDay(slot.date)}
                          >
                            Remove day
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={styles.scheduleDayInputs}>
                      <label className={styles.inlineField}>
                        <span className={styles.inlineLabel}>Date</span>
                        <input
                          className={styles.searchInput}
                          type="date"
                          value={slot.date}
                          onChange={(e) => handleDaySlotChange(index, "date", e.target.value)}
                          required
                          min={rangeStartDate}
                          max={rangeEndDate}
                        />
                      </label>
                      <label className={styles.inlineField}>
                        <span className={styles.inlineLabel}>Start</span>
                        <input
                          className={styles.searchInput}
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleDaySlotChange(index, "startTime", e.target.value)}
                          required
                        />
                      </label>
                      <label className={styles.inlineField}>
                        <span className={styles.inlineLabel}>End</span>
                        <input
                          className={styles.searchInput}
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleDaySlotChange(index, "endTime", e.target.value)}
                          required
                        />
                      </label>
                    </div>
                    {/* 🔹 Per-day state line (right below the inputs) */}
                      {(() => {
                        const invalid = slot.startTime >= slot.endTime;
                        if (invalid) return <span className={styles.formError}>End time must be after start time.</span>;
                        // Note: in PostJob, excluded days are not rendered (they’re filtered out of daySlots),
                        // so the following branch typically won't hit. Safe to keep for parity with RequestService.
                        if (excludedDates.has(slot.date)) return <span className={styles.inputHint}>Excluded from this request.</span>;
                        if (slot.custom) return <span className={styles.inputHint}>Custom time for this day.</span>;
                        return <span className={styles.inputHint}>Uses the default time.</span>;
                      })()}
                  </div>
                );
              })}
            </div>
            {submitted && !slotsValid && (
              <span className={styles.formError}>Check each day – end time must be after start time (max 7 days).</span>
            )}
            {submitted && daySlots.length === 0 && (
              <span className={styles.formError}>Your range excludes all days. Add back at least one day.</span>
            )}
          </div>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}><span className={styles.listText} style={{ fontWeight: 900 }}>Location</span></div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <Select<Option, false>
              styles={selectBase}
              options={COUNTRY_OPTIONS}
              value={COUNTRY_OPTIONS.find((opt) => opt.value === countryCode) || null}
              onChange={(option) => setCountryCode(option?.value || "AE")}
              components={{ Option: CountryOptionRow, SingleValue: CountrySingleValue }}
              placeholder="Select country"
              menuPortalTarget={portalTarget}
              menuPosition="fixed"
            />
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <input
              className={styles.searchInput}
              placeholder="Address line 1"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              required
            />
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <input
              className={styles.searchInput}
              placeholder="Building (optional)"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
            />
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <input
              className={styles.searchInput}
              placeholder="Apartment (optional)"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
            />
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
              <input
                className={styles.searchInput}
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <input
                className={styles.searchInput}
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`} style={{ display: "grid", gap: 6 }}>
            <input
              className={styles.searchInput}
              placeholder="Paste a Google Maps link (optional)"
              value={locationLink}
              onChange={(e) => setLocationLink(e.target.value)}
            />
            <button
              type="button"
              className={styles.secondaryBtn}
              style={{ width: "fit-content" }}
              onClick={applyLocationLink}
            >
              Use this link
            </button>
            {locationError && <span className={styles.listText} style={{ color: "#b91c1c" }}>{locationError}</span>}
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <div className={styles.coordRow}>Pin location: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}</div>
          </div>
          {mapReady && (
            <div className={`${styles.listItem} ${styles.listItemBlock}`}>
              <div className={styles.mapCard}>
                <MapContainer
                  key={`${position.lat}-${position.lng}`}
                  center={position}
                  zoom={13}
                  style={{ height: 260, width: "100%" }}
                  scrollWheelZoom
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  <LocationMarker position={position} onSelect={(lat, lng) => setPosition({ lat, lng })} />
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        <div className={styles.listGroup}>
          <div className={`${styles.listItem} ${styles.listItemBlock}`} style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className={styles.listText} style={{ fontWeight: 900, paddingRight:12 }}>Services</span>
            <button type="button" className={styles.addServicePill} onClick={addRow}>
              + Add service
            </button>
          </div>

          <div className={`${styles.listItem} ${styles.listItemBlock}`} style={{ display: "grid", gap: 16 }}>
            {serviceRows.map((row, index) => {
              const option = serviceOptionMap.get(row.serviceId);
              const priceMinor = rowPrices[index];
              const capacity = parseProviders(row.providers);
              return (
                <div key={row.key} className={styles.serviceCardNew}>
                  <div className={styles.serviceHeader}>
                    <div>
                      <div className={styles.serviceTitle}>Service {index + 1}</div>
                      <div className={styles.serviceSubtitle}>
                        {option ? option.label : "Select a service"}
                      </div>
                      <div className={styles.serviceMiniMeta}>
                        <span className={styles.serviceMiniBadge}>
                          {capacity > 0 ? `${capacity} provider${capacity > 1 ? "s" : ""}` : "Set capacity"}
                        </span>
                        {priceMinor ? (
                          <span className={styles.serviceMiniBadge}>
                            {`Est. ${formatCurrency(priceMinor, currency)}`}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {serviceRows.length > 1 && (
                      <button type="button" className={styles.removeServiceBtn} onClick={() => removeRow(row.key)}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className={styles.serviceBody}>
                    <Select<Option, false>
                      styles={selectBase}
                      options={serviceOptionsForSelect}
                      value={serviceOptionsForSelect.find((opt) => opt.value === row.serviceId) || null}
                      placeholder="Select a service"
                      onChange={(opt) =>
                        withUpdatedRow(row.key, (prev) => ({
                          ...prev,
                          serviceId: opt?.value || "",
                        }))
                      }
                      menuPortalTarget={portalTarget}
                      menuPosition="fixed"
                    />

                    <div className={styles.serviceInputsRow}>
                      <label className={styles.inlineField}>
                        <span className={styles.inlineLabel}>Capacity</span>
                        <input
                          className={styles.searchInput}
                          type="number"
                          min={1}
                          placeholder="Number of providers"
                          value={row.providers}
                          onChange={(e) =>
                            withUpdatedRow(row.key, (prev) => ({
                              ...prev,
                              providers: e.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                    </div>

                    <Select<Option, true>
                      styles={multiSelectBase}
                      isMulti
                      closeMenuOnSelect={false}
                      options={COUNTRY_OPTIONS}
                      value={COUNTRY_OPTIONS.filter((opt) => row.allowedCountries.includes(opt.value))}
                      placeholder="Allowed countries"
                      onChange={(opts) =>
                        withUpdatedRow(row.key, (prev) => ({
                          ...prev,
                          allowedCountries: (opts || []).map((opt) => opt.value),
                        }))
                      }
                      components={{
                        Option: CountryOptionRow,
                        MultiValue: CountryMultiValue,
                        SingleValue: CountrySingleValue,
                      }}
                      menuPortalTarget={portalTarget}
                      menuPosition="fixed"
                    />

                    {row.allowedCountries.length > 0 && (
                      <div className={styles.serviceRateList}>
                        {row.allowedCountries.map((code) => {
                          const meta = countryMap.get(code);
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
                                {formatCurrency(meta.rateMinor, currency)} / provider
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.actionRow}>
          <button className={styles.primaryBtn} type="submit" disabled={submitted && !canSubmit()}>
            Post Job
          </button>
        </div>
      </form>
    </section>
  );
}
