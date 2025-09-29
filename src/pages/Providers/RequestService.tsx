import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../Home/Home.module.css";
import {
  SERVICE_CATALOG,
  STATIC_PROVIDERS,
  PROVIDER_AVAILABILITY,
} from "./data";
import AuthGateModal from "@/components/AuthGateModal/AuthGateModal";
import { useAuthState } from "@/hooks/useAuthState";
import { isGuestConsumer } from "@/utils/auth";

function formatHoursLabel(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return "--";
  const rounded = Math.abs(hours % 1) < 0.01 ? hours.toFixed(0) : hours.toFixed(1);
  const value = Number(rounded);
  return `${rounded} ${value === 1 ? "hour" : "hours"}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

function minutesToTimeString(totalMinutes: number) {
  const clamped = Math.min(Math.max(totalMinutes, 0), 23 * 60 + 59);
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function getDateRange(startISO: string, endISO: string) {
  if (!startISO) return [] as string[];
  const start = parseISODate(startISO);
  if (!start) return [] as string[];
  const end = endISO ? parseISODate(endISO) : start;
  if (!end) return [startISO];
  const result: string[] = [];
  const cursor = new Date(start.getTime());
  while (cursor.getTime() <= end.getTime()) {
    result.push(formatISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function formatDateLabel(dateISO: string, options?: Intl.DateTimeFormatOptions) {
  const formatter = new Intl.DateTimeFormat(
    undefined,
    Object.assign(
      {
        weekday: "short",
        month: "short",
        day: "numeric",
      },
      options ?? {}
    )
  );
  const parsedDate = parseISODate(dateISO);
  return parsedDate ? formatter.format(parsedDate) : dateISO;
}

const REQUESTS_KEY = "provider.serviceRequests";

const toTimeLabel = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

type DaySchedule = {
  date: string;
  startTime: string;
  endTime: string;
};

type DayConfig = DaySchedule & {
  enabled: boolean;
  customTimes: boolean;
};

function formatScheduleRangeFromDays(days: DaySchedule[]) {
  if (!days.length) return "Select dates";
  const first = days[0];
  const last = days[days.length - 1];
  if (first.date === last.date) {
    return formatDateLabel(first.date, { month: "short", day: "numeric", year: "numeric" });
  }
  const firstLabel = formatDateLabel(first.date, { month: "short", day: "numeric", year: "numeric" });
  const lastLabel = formatDateLabel(last.date, { month: "short", day: "numeric", year: "numeric" });
  return `${firstLabel} → ${lastLabel}`;
}

function formatScheduleDetails(days: DaySchedule[]) {
  if (!days.length) return "--";
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return days
    .map((day) => {
      const parsedDate = parseISODate(day.date);
      const label = parsedDate ? formatter.format(parsedDate) : day.date;
      return `${label} ${toTimeLabel(day.startTime)} – ${toTimeLabel(day.endTime)}`;
    })
    .join(" • ");
}

function parseISODate(value: string | null | undefined) {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(year, month - 1, day);
}

function formatISODate(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysISO(baseISO: string, amount: number) {
  const base = parseISODate(baseISO);
  if (!base) return baseISO;
  const copy = new Date(base.getTime());
  copy.setDate(copy.getDate() + amount);
  return formatISODate(copy);
}

function compareISODateStrings(a: string, b: string) {
  const left = parseISODate(a);
  const right = parseISODate(b);
  if (!left || !right) return 0;
  const diff = left.getTime() - right.getTime();
  if (diff === 0) return 0;
  return diff > 0 ? 1 : -1;
}

type StoredRequest = {
  id: string;
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceTitle: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  hours: number;
  notes?: string;
  totalMinor: number;
  createdAt: string;
  preferredLanguages?: string[];
  scheduleDays?: DaySchedule[];
};

function loadRequests(): StoredRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce<StoredRequest[]>((acc, rawEntry) => {
      if (!rawEntry || typeof rawEntry !== "object") return acc;
      const entry = rawEntry as Record<string, unknown>;

      const fallbackDate = typeof entry.date === "string" ? entry.date : "";
      const fallbackTime = typeof entry.slot === "string" ? entry.slot : "";

      const rawScheduleDays = Array.isArray(entry.scheduleDays)
        ? (entry.scheduleDays as unknown[])
        : [];

      const scheduleDays = rawScheduleDays
        .map((rawDay) => {
          if (!rawDay || typeof rawDay !== "object") return null;
          const dayRecord = rawDay as Record<string, unknown>;
          const dateValue = dayRecord.date;
          const startValue = dayRecord.startTime;
          const endValue = dayRecord.endTime;
          if (
            typeof dateValue !== "string" ||
            typeof startValue !== "string" ||
            typeof endValue !== "string"
          ) {
            return null;
          }
          return { date: dateValue, startTime: startValue, endTime: endValue };
        })
        .filter((value): value is DaySchedule => value !== null);

      const preferredLanguages = Array.isArray(entry.preferredLanguages)
        ? (entry.preferredLanguages as unknown[]).filter((lang): lang is string => typeof lang === "string")
        : [];

      const mapped: StoredRequest = {
        ...(entry as Record<string, unknown>),
        startDate: typeof entry.startDate === "string" ? entry.startDate : fallbackDate,
        endDate: typeof entry.endDate === "string" ? entry.endDate : fallbackDate,
        startTime: typeof entry.startTime === "string" ? entry.startTime : fallbackTime,
        endTime: typeof entry.endTime === "string" ? entry.endTime : fallbackTime,
        scheduleDays,
        preferredLanguages,
      } as StoredRequest;

      acc.push(mapped);
      return acc;
    }, []);
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
  const auth = useAuthState();
  const guestConsumer = isGuestConsumer(auth);

  const providerPreferredLanguages = useMemo(() => {
    if (!provider?.preferredLanguage) return [] as string[];
    return [provider.preferredLanguage];
  }, [provider]);

  const providerServices = useMemo(() => {
    if (!provider) return [] as Array<{ id: string; title: string; hourlyRateMinor: number; description: string }>;
    return provider.serviceIds
      .map((sid) => SERVICE_CATALOG[sid])
      .filter(Boolean);
  }, [provider]);

  const availability = useMemo(() => (provider ? PROVIDER_AVAILABILITY[provider.id] || [] : []), [provider]);

  const [serviceId, setServiceId] = useState<string>(() => providerServices[0]?.id || "");
  const todayISO = useMemo(() => formatISODate(new Date()), []);
  const [startDate, setStartDate] = useState<string>(todayISO);
  const [endDate, setEndDate] = useState<string>(todayISO);
  const dateRange = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);
  const maxSelectableEndDate = useMemo(() => addDaysISO(startDate, 6), [startDate]);
  const slotsForStartDate = useMemo(
    () => availability.find((entry) => entry.date === startDate)?.slots || [],
    [availability, startDate]
  );
  const defaultStartTimeFallback = slotsForStartDate[0] || "09:00";
  const [defaultStartTime, setDefaultStartTime] = useState<string>(defaultStartTimeFallback);
  const [defaultEndTime, setDefaultEndTime] = useState<string>(() =>
    minutesToTimeString(timeToMinutes(defaultStartTimeFallback) + 120)
  );
  const [dayConfigs, setDayConfigs] = useState<Record<string, DayConfig>>({});
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<StoredRequest | null>(null);

  const serviceInfo = serviceId ? SERVICE_CATALOG[serviceId] : undefined;

  const scheduleDays = useMemo(() => {
    return dateRange
      .map((date) => {
        const config = dayConfigs[date];
        if (!config || !config.enabled) return null;
        return { date, startTime: config.startTime, endTime: config.endTime };
      })
      .filter(Boolean) as DaySchedule[];
  }, [dateRange, dayConfigs]);

  const invalidScheduleDates = useMemo(
    () =>
      dateRange.filter((date) => {
        const config = dayConfigs[date];
        if (!config || !config.enabled) return false;
        return config.startTime >= config.endTime;
      }),
    [dateRange, dayConfigs]
  );

  const defaultTimesValid = defaultStartTime < defaultEndTime;
  const scheduleValid = scheduleDays.length > 0 && invalidScheduleDates.length === 0;

  const totalHours = useMemo(
    () =>
      scheduleDays.reduce((acc, day) => {
        const diffMinutes = timeToMinutes(day.endTime) - timeToMinutes(day.startTime);
        if (diffMinutes <= 0) return acc;
        return acc + diffMinutes / 60;
      }, 0),
    [scheduleDays]
  );

  const totalMinor = serviceInfo ? Math.round(serviceInfo.hourlyRateMinor * totalHours) : 0;

  const timesConsistent = useMemo(() => {
    if (scheduleDays.length < 2) return true;
    const [first] = scheduleDays;
    return scheduleDays.every((day) => day.startTime === first.startTime && day.endTime === first.endTime);
  }, [scheduleDays]);

  const scheduleRangeLabel = useMemo(() => formatScheduleRangeFromDays(scheduleDays), [scheduleDays]);

  const timesSummaryLabel = useMemo(() => {
    if (!scheduleDays.length) return "Set times";
    if (!timesConsistent) return "Times vary by day";
    const [first] = scheduleDays;
    return `${toTimeLabel(first.startTime)} – ${toTimeLabel(first.endTime)}`;
  }, [scheduleDays, timesConsistent]);

  useEffect(() => {
    if (compareISODateStrings(endDate, startDate) < 0) {
      setEndDate(startDate);
    } else if (compareISODateStrings(endDate, maxSelectableEndDate) > 0) {
      setEndDate(maxSelectableEndDate);
    }
  }, [startDate, endDate, maxSelectableEndDate]);

  useEffect(() => {
    if (!slotsForStartDate.length) return;
    if (!slotsForStartDate.includes(defaultStartTime)) {
      const nextStart = slotsForStartDate[0];
      setDefaultStartTime(nextStart);
      if (defaultEndTime <= nextStart) {
        setDefaultEndTime(minutesToTimeString(timeToMinutes(nextStart) + 120));
      }
    }
  }, [slotsForStartDate, defaultStartTime, defaultEndTime]);

  // Rebuild configs for the current range.
  // IMPORTANT: Start/end dates are ALWAYS enabled (unremovable).
  useEffect(() => {
    setDayConfigs((prev) => {
      let changed = false;
      const next: Record<string, DayConfig> = {};
      dateRange.forEach((date) => {
        const isBoundary = date === startDate || date === endDate;
        const existing = prev[date];
        if (existing) {
          const baseEnabled = isBoundary ? true : existing.enabled; // force boundary enabled
          const baseStart = existing.customTimes ? existing.startTime : defaultStartTime;
          const baseEnd = existing.customTimes ? existing.endTime : defaultEndTime;
          const needsUpdate =
            existing.enabled !== baseEnabled ||
            existing.startTime !== baseStart ||
            existing.endTime !== baseEnd;

          next[date] = needsUpdate
            ? {
                ...existing,
                enabled: baseEnabled,
                startTime: baseStart,
                endTime: baseEnd,
              }
            : existing;

          if (needsUpdate) changed = true;
        } else {
          next[date] = {
            date,
            startTime: defaultStartTime,
            endTime: defaultEndTime,
            enabled: true, // new days start as enabled
            customTimes: false,
          };
          changed = true;
        }
      });

      // If keys differ, mark changed
      if (Object.keys(prev).length !== dateRange.length) {
        changed = true;
      } else {
        Object.keys(prev).forEach((key) => {
          if (!next[key]) changed = true;
        });
      }

      return changed ? next : prev;
    });
  }, [dateRange, defaultStartTime, defaultEndTime, startDate, endDate]);

  const endDateSummary = useMemo(() => {
    if (!scheduleDays.length) return "";
    const last = scheduleDays[scheduleDays.length - 1];
    const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
    const parsedDate = parseISODate(last.date);
    const label = parsedDate ? formatter.format(parsedDate) : last.date;
    return `${label} • ${toTimeLabel(last.startTime)} – ${toTimeLabel(last.endTime)}`;
  }, [scheduleDays]);

  const successScheduleDays = useMemo(() => {
    if (!success) return [] as DaySchedule[];
    if (success.scheduleDays?.length) return success.scheduleDays;
    return [
      {
        date: success.startDate,
        startTime: success.startTime,
        endTime: success.endTime,
      },
    ];
  }, [success]);

  const successDaysCount = successScheduleDays.length;
  const successScheduleRange = successDaysCount ? formatScheduleRangeFromDays(successScheduleDays) : "--";
  const successScheduleDetails = successDaysCount ? formatScheduleDetails(successScheduleDays) : "--";

  const normalizeDateInput = (value: string | null | undefined, fallback: string) => {
    if (!value) return fallback;
    const parsed = parseISODate(value);
    return parsed ? formatISODate(parsed) : fallback;
  };

  const handleStartDateChange = (raw: string) => {
    const normalizedStart = normalizeDateInput(raw, todayISO);
    const maxEnd = addDaysISO(normalizedStart, 6);
    setStartDate(normalizedStart);
    setEndDate((prev) => {
      const prevNormalized = normalizeDateInput(prev, normalizedStart);
      if (compareISODateStrings(prevNormalized, normalizedStart) < 0) return normalizedStart;
      if (compareISODateStrings(prevNormalized, maxEnd) > 0) return maxEnd;
      return prevNormalized;
    });
  };

  const handleEndDateChange = (raw: string) => {
    const normalizedEnd = normalizeDateInput(raw, startDate);
    const maxEnd = addDaysISO(startDate, 6);
    if (compareISODateStrings(normalizedEnd, startDate) < 0) {
      setEndDate(startDate);
    } else if (compareISODateStrings(normalizedEnd, maxEnd) > 0) {
      setEndDate(maxEnd);
    } else {
      setEndDate(normalizedEnd);
    }
  };

  const handleDayConfigChange = (date: string, field: "startTime" | "endTime", value: string) => {
    setDayConfigs((prev) => {
      const existing = prev[date];
      if (!existing) return prev;
      const updated: DayConfig = {
        ...existing,
        [field]: value,
      };
      const matchesDefault =
        updated.startTime === defaultStartTime && updated.endTime === defaultEndTime;
      updated.customTimes = !matchesDefault;
      if (
        updated.startTime === existing.startTime &&
        updated.endTime === existing.endTime &&
        updated.customTimes === existing.customTimes
      ) {
        return prev;
      }
      return { ...prev, [date]: updated };
    });
  };

  const resetDayTimes = (date: string) => {
    setDayConfigs((prev) => {
      const existing = prev[date];
      if (!existing) return prev;
      if (
        !existing.customTimes &&
        existing.startTime === defaultStartTime &&
        existing.endTime === defaultEndTime
      ) {
        return prev;
      }
      const updated: DayConfig = {
        ...existing,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        customTimes: false,
      };
      return { ...prev, [date]: updated };
    });
  };

  // BLOCK removing start/end dates
  const toggleDayEnabled = (date: string) => {
    if (date === startDate || date === endDate) {
      return; // boundary dates are required
    }
    setDayConfigs((prev) => {
      const existing = prev[date];
      if (!existing) return prev;
      const nextEnabled = !existing.enabled;
      const updated: DayConfig = {
        ...existing,
        enabled: nextEnabled,
      };
      if (nextEnabled && !existing.customTimes) {
        updated.startTime = defaultStartTime;
        updated.endTime = defaultEndTime;
      }
      if (
        updated.enabled === existing.enabled &&
        updated.startTime === existing.startTime &&
        updated.endTime === existing.endTime
      ) {
        return prev;
      }
      return { ...prev, [date]: updated };
    });
  };

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

  const datesValid = Boolean(startDate) && Boolean(endDate) && compareISODateStrings(endDate, startDate) >= 0;
  const canSubmit = Boolean(serviceInfo && datesValid && defaultTimesValid && scheduleValid);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (guestConsumer) {
      setGuestPromptOpen(true);
      return;
    }
    setSubmitted(true);
    if (success) {
      setSuccess(null);
    }
    if (!canSubmit || !serviceInfo) return;
    setSending(true);

    const firstScheduledDay = scheduleDays[0];
    const lastScheduledDay = scheduleDays[scheduleDays.length - 1] ?? firstScheduledDay;

    const entry: StoredRequest = {
      id: `req_${Date.now()}`,
      providerId: provider.id,
      providerName: provider.name,
      serviceId: serviceInfo.id,
      serviceTitle: serviceInfo.title,
      startDate: firstScheduledDay?.date ?? startDate,
      endDate: lastScheduledDay?.date ?? endDate,
      startTime: firstScheduledDay?.startTime ?? defaultStartTime,
      endTime: firstScheduledDay?.endTime ?? defaultEndTime,
      hours: totalHours,
      preferredLanguages: [...providerPreferredLanguages],
      scheduleDays: scheduleDays.map((day) => ({ ...day })),
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
                <span>Dates</span>
                <strong>
                  {successScheduleRange}
                  {successDaysCount > 1 ? ` (${successDaysCount} days)` : ""}
                </strong>
              </div>
              <div>
                <span>Total hours</span>
                <strong>{formatHoursLabel(success.hours)}</strong>
              </div>
              <div>
                <span>Schedule</span>
                <strong>{successScheduleDetails}</strong>
              </div>
              <div>
                <span>Estimated</span>
                <strong>AED {(success.totalMinor / 100).toFixed(0)}</strong>
              </div>
              {success.preferredLanguages?.length ? (
                <div>
                  <span>Languages</span>
                  <strong>{success.preferredLanguages.join(", ")}</strong>
                </div>
              ) : null}
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
              <span className={styles.listText} style={{ fontWeight: 900 }}>Preferred language</span>
            </div>
            <div className={styles.listItem}>
              {providerPreferredLanguages.length ? (
                <div className={styles.languageCheckboxGrid}>
                  {providerPreferredLanguages.map((language) => (
                    <div key={language} className={styles.languageCheckbox} style={{ cursor: "default" }}>
                      <span>{language}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className={styles.inputHint}>This provider has not shared a preferred language.</span>
              )}
            </div>
          </div>

          <div className={styles.listGroup}>
            <div className={styles.listItem}>
              <span className={styles.listText} style={{ fontWeight: 900 }}>Schedule</span>
            </div>
            <div className={`${styles.listItem} ${styles.listItemBlock}`}>
              <div className={styles.scheduleBaseGrid}>
                <label className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Start date</span>
                  <input
                    className={styles.searchInput}
                    type="date"
                    value={startDate}
                    min={todayISO}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    required
                  />
                </label>
                <label className={styles.inlineField}>
                  <span className={styles.inlineLabel}>End date</span>
                  <input
                    className={styles.searchInput}
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={maxSelectableEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    required
                  />
                </label>
              </div>
              {submitted && !(Boolean(startDate) && Boolean(endDate) && compareISODateStrings(endDate, startDate) >= 0) && (
                <span className={styles.formError}>End date must be on or after the start date.</span>
              )}
            </div>
            <div className={`${styles.listItem} ${styles.listItemBlock}`}>
              <div className={styles.scheduleBaseGrid}>
                <label className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Default start time</span>
                  <input
                    className={styles.searchInput}
                    type="time"
                    value={defaultStartTime}
                    onChange={(e) => {
                      const next = e.target.value;
                      setDefaultStartTime(next);
                      if (defaultEndTime <= next) {
                        const duration = Math.max(60, timeToMinutes(defaultEndTime) - timeToMinutes(defaultStartTime));
                        setDefaultEndTime(minutesToTimeString(timeToMinutes(next) + duration));
                      }
                    }}
                    required
                  />
                </label>
                <label className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Default end time</span>
                  <input
                    className={styles.searchInput}
                    type="time"
                    value={defaultEndTime}
                    onChange={(e) => {
                      setDefaultEndTime(e.target.value);
                    }}
                    required
                  />
                </label>
              </div>
              {submitted && !(defaultStartTime < defaultEndTime) ? (
                <span className={styles.formError}>End time must be after start time.</span>
              ) : null}
              <span className={styles.inputHint}>These times apply to all days by default. You can fine-tune each day below.</span>
              {endDateSummary && (
                <span className={styles.inputHint}>Schedule ends {endDateSummary}</span>
              )}
            </div>
            {slotsForStartDate.length ? (
              <div className={`${styles.listItem} ${styles.listItemBlock}`}>
                <span className={styles.inlineLabel}>Suggested start times</span>
                <div className={styles.languageCheckboxGrid}>
                  {slotsForStartDate.map((value) => {
                    const active = value === defaultStartTime;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`${styles.suggestionChip} ${active ? styles.suggestionChipActive : ""}`}
                        onClick={() => {
                          const duration = Math.max(
                            60,
                            timeToMinutes(defaultEndTime) - timeToMinutes(defaultStartTime)
                          );
                          setDefaultStartTime(value);
                          setDefaultEndTime(minutesToTimeString(timeToMinutes(value) + duration));
                        }}
                      >
                        {toTimeLabel(value)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div className={`${styles.listItem} ${styles.listItemBlock}`}>
              <div className={styles.scheduleDaysGrid}>
                {dateRange.length ? (
                  dateRange.map((date) => {
                    const config = dayConfigs[date];
                    if (!config) return null;
                    const label = formatDateLabel(date);
                    const isBoundary = date === startDate || date === endDate;
                    const disabled = !config.enabled;
                    const invalid = config.enabled && config.startTime >= config.endTime;
                    return (
                      <div key={date} className={styles.scheduleDayCard}>
                        <div className={styles.scheduleDayHeader}>
                          <span className={styles.scheduleDayLabel}>{label}</span>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            {config.customTimes ? (
                              <button type="button" className={styles.scheduleResetBtn} onClick={() => resetDayTimes(date)}>
                                Reset times
                              </button>
                            ) : null}
                            {/* Start/End are required: no toggle button */}
                            {isBoundary ? (
                              <span className={styles.suggestionChip} style={{ cursor: "default" }}>
                                Required day
                              </span>
                            ) : (
                              <button type="button" className={styles.scheduleResetBtn} onClick={() => toggleDayEnabled(date)}>
                                {config.enabled ? "Remove day" : "Include day"}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className={styles.scheduleDayInputs}>
                          <label className={styles.inlineField}>
                            <span className={styles.inlineLabel}>Start</span>
                            <input
                              className={styles.searchInput}
                              type="time"
                              value={config.startTime}
                              onChange={(e) => handleDayConfigChange(date, "startTime", e.target.value)}
                              disabled={disabled}
                              required
                            />
                          </label>
                          <label className={styles.inlineField}>
                            <span className={styles.inlineLabel}>End</span>
                            <input
                              className={styles.searchInput}
                              type="time"
                              value={config.endTime}
                              onChange={(e) => handleDayConfigChange(date, "endTime", e.target.value)}
                              disabled={disabled}
                              required
                            />
                          </label>
                        </div>
                        {disabled ? (
                          <span className={styles.inputHint}>Excluded from this request.</span>
                        ) : invalid ? (
                          <span className={styles.formError}>End time must be after start time.</span>
                        ) : config.customTimes ? (
                          <span className={styles.inputHint}>Custom time for this day.</span>
                        ) : (
                          <span className={styles.inputHint}>Uses the default time.</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <span className={styles.inputHint}>Pick a start and end date to configure days.</span>
                )}
              </div>
              {submitted && !scheduleValid ? (
                <span className={styles.formError}>Select at least one valid day between your dates.</span>
              ) : (
                <span className={styles.inputHint}>Remove days in the range or adjust individual times as needed.</span>
              )}
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
                <span>
                  {scheduleRangeLabel}
                  {scheduleDays.length
                    ? ` (${scheduleDays.length} ${scheduleDays.length === 1 ? "day" : "days"})`
                    : ""}
                </span>
                <span>{timesSummaryLabel}</span>
                <span>{formatHoursLabel(totalHours)}</span>
                {providerPreferredLanguages.length ? (
                  <span>Language: {providerPreferredLanguages.join(", ")}</span>
                ) : null}
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
                <span className={styles.listText}>
                  Please choose a service and make sure your schedule covers at least one valid day with start and end times.
                </span>
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

      <AuthGateModal
        open={guestPromptOpen}
        onClose={() => setGuestPromptOpen(false)}
        role="consumer"
        title="Sign in to request a provider"
        message="Log in or create a free account to send service requests."
      />
    </section>
  );
}
