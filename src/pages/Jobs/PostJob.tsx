import React, { useEffect, useMemo, useState } from "react";
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

const defaultCoords = { latitude: 25.2048, longitude: 55.2708 };

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
  L.Marker.prototype.options.icon = icon;
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

export default function PostJob() {
  const navigate = useNavigate();
  const portalTarget = typeof document !== "undefined" ? document.body : undefined;

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
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([makeServiceRow()]);
  const [submitted, setSubmitted] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMapReady(true);
    }
  }, []);

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

  const canSubmit = () => {
    const titleValid = title.trim().length >= 4;
    const descValid = description.trim().length >= 12;
    const locationValid = line1.trim().length > 0 && city.trim().length > 0 && state.trim().length > 0;
    const scheduleValid = Boolean(start) && Boolean(end) && new Date(start) < new Date(end || start);
    const servicesValid =
      serviceRows.length > 0 &&
      serviceRows.every((row) => {
        const opt = serviceOptionMap.get(row.serviceId);
        return Boolean(opt) && parseProviders(row.providers) > 0 && row.allowedCountries.length > 0;
      });
    return titleValid && descValid && locationValid && scheduleValid && servicesValid;
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!canSubmit()) return;

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

    const payload: CreateJobInput = {
      title: title.trim(),
      description: description.trim(),
      category,
      image: imageData,
      schedule: {
        fromISO: new Date(start).toISOString(),
        toISO: new Date(end).toISOString(),
      },
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
              aria-invalid={submitted && title.trim().length < 4 || undefined}
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
              aria-invalid={submitted && description.trim().length < 12 || undefined}
              required
            />
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
          <div className={styles.listItem}><span className={styles.listText} style={{ fontWeight: 900 }}>Schedule</span></div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <label className={styles.listText} style={{ width: "100%" }}>
              Start
              <input
                type="datetime-local"
                className={styles.searchInput}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </label>
          </div>
          <div className={`${styles.listItem} ${styles.listItemBlock}`}>
            <label className={styles.listText} style={{ width: "100%" }}>
              End
              <input
                type="datetime-local"
                className={styles.searchInput}
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </label>
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
