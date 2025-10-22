import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProviderServices.module.css";
import colors from "@/styles/colors";
import { createOrUpdateProfile } from "@/services/profileService";
import { buildProfileSubmissionPayload } from "@/utils/profileSubmission";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchServices,
  type Service,
} from "@/store/slices/metaSlice";

export default function ProviderServices() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const servicesState = useAppSelector((state) => state.meta.services);
  const services = servicesState.data;

  const profile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("profile") || "{}");
    } catch {
      return {};
    }
  }, []);

  // Guard: if not provider, skip to bank
  useEffect(() => {
    if (profile?.role !== "provider") {
      navigate("/home");
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (servicesState.status === "idle") {
      dispatch(fetchServices());
    }
  }, [dispatch, servicesState.status]);

  const inferLegacySelection = React.useCallback((serviceList: Service[]) => {
    try {
      const raw = JSON.parse(localStorage.getItem("provider.services") || "[]");
      if (!Array.isArray(raw)) return [];

      const numeric = raw.filter((value): value is number => typeof value === "number");
      const convertedFromStrings = raw
        .filter((value): value is string => typeof value === "string")
        .map((value) => {
          const normalised = value.replace(/_/g, " ").toLowerCase();
          const match = serviceList.find((svc) => svc.name.toLowerCase() === normalised);
          return match?.id ?? null;
        })
        .filter((value): value is number => value !== null);

      return Array.from(new Set([...numeric, ...convertedFromStrings]));
    } catch {
      return [];
    }
  }, []);

  const [selected, setSelected] = useState<number[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("provider.services") || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .map((value) => {
          if (typeof value === "number" && Number.isFinite(value)) return value;
          const numeric = Number(value);
          return Number.isFinite(numeric) ? numeric : null;
        })
        .filter((value): value is number => value !== null);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (services.length > 0) {
      const legacy = inferLegacySelection(services);
      if (legacy.length && legacy.some((id) => !selected.includes(id))) {
        setSelected((prev) => Array.from(new Set([...prev, ...legacy])));
      }
    }
  }, [services, inferLegacySelection, selected]);

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (serviceId: number) => {
    setSelected((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const onContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (selected.length === 0 || saving) return;

    setError(null);
    localStorage.setItem("provider.services", JSON.stringify(selected));

    setSaving(true);
    try {
      const payload = buildProfileSubmissionPayload({
        serviceIds: selected,
        requireMedia: true,
      });

      const response = await createOrUpdateProfile(payload);
      if (response && response.success === false) {
        throw new Error(response.message || "Profile submission failed.");
      }

      setSaving(false);
      navigate("/auth/approval?role=provider");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't submit your profile. Please try again.";
      setError(message);
      setSaving(false);
    }
  };

  const isLoading = servicesState.status === "loading";
  const hasError = servicesState.status === "failed";

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Select Your Services</h1>
        <p className={styles.sub}>
          Choose what you provide. You can edit later from your profile.
        </p>
      </header>

      <form className={styles.box} onSubmit={onContinue} noValidate>
        <div className={styles.grid} role="group" aria-labelledby="services-legend">
          <span id="services-legend" className={styles.visuallyHidden}>
            Services list (select one or more)
          </span>

          {services.map((service) => {
            const isOn = selected.includes(service.id);
            return (
              <label
                key={service.id}
                className={`${styles.card} ${isOn ? styles.on : ""}`}
              >
                <input
                  type="checkbox"
                  className={styles.srOnly}
                  checked={isOn}
                  onChange={() => toggle(service.id)}
                  aria-checked={isOn}
                  aria-label={service.name}
                />

                <span className={styles.pillContent}>
                  <span className={styles.title}>{service.name}</span>
                </span>

                <span
                  className={`${styles.radio} ${isOn ? styles.radioOn : ""}`}
                  aria-hidden="true"
                />
              </label>
            );
          })}
        </div>

        {isLoading ? (
          <p className={styles.info}>Loading services…</p>
        ) : null}

        {!isLoading && servicesState.status === "succeeded" && services.length === 0 ? (
          <p className={styles.info}>No services are currently available.</p>
        ) : null}

        {hasError ? (
          <p className={styles.error} role="alert">
            {servicesState.error ?? "Unable to load services. Please try again."}
          </p>
        ) : null}

        {submitted &&
          selected.length === 0 &&
          servicesState.status === "succeeded" && (
            <p className={styles.error} aria-live="polite">
              Pick at least one service.
            </p>
          )}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            className={styles.primary}
            style={{
              background: colors.accent,
              color: colors.white,
              opacity: selected.length && !saving ? 1 : 0.6,
            }}
            disabled={!selected.length || saving}
            type="submit"
            aria-disabled={!selected.length || saving}
          >
            {saving ? "Submitting…" : "Finish"}
          </button>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
