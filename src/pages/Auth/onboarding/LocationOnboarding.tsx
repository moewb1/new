import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LocationOnboarding.module.css";
import { ClipLoader } from "react-spinners";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import * as L from "leaflet";
import colors from "@/styles/colors";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";

// ---- Marker icon fix for bundlers ----
const DefaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Types
type LatLng = { lat: number; lng: number };
type Suggestion = { display_name: string; lat: string; lon: string };

// ✅ Dubai as the friendly default
const DEFAULT_CENTER: LatLng = { lat: 25.2048, lng: 55.2708 };

// --- helpers ---
function clampLatLng(v: LatLng): LatLng {
  let lat = Math.max(-90, Math.min(90, v.lat));
  let lng = Math.max(-180, Math.min(180, v.lng));
  return { lat, lng };
}
function isValidLat(n: number) {
  return Number.isFinite(n) && n >= -90 && n <= 90;
}
function isValidLng(n: number) {
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

function parseLatLngFromText(text: string): LatLng | null {
  if (!text) return null;
  // Accept: "lat,lng", "lat lng", or "...?q=lat,lng"
  const mUrl = text.match(
    /[?&]q=(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/i
  );
  if (mUrl) {
    const lat = parseFloat(mUrl[1]),
      lng = parseFloat(mUrl[3]);
    return isValidLat(lat) && isValidLng(lng) ? { lat, lng } : null;
  }
  const raw = text.replace(/[^\d.\-\s,]+/g, " ").trim();
  const parts = raw.split(/[,\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isValidLat(lat) && isValidLng(lng)) return { lat, lng };
  }
  return null;
}

async function reverseGeocode({ lat, lng }: LatLng): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": navigator.language || "en" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.display_name || null;
  } catch {
    return null;
  }
}

async function forwardGeocode(q: string): Promise<Suggestion[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(
      q
    )}`;
    const res = await fetch(url, {
      headers: { "Accept-Language": navigator.language || "en" },
    });
    if (!res.ok) return [];
    return (await res.json()) as Suggestion[];
  } catch {
    return [];
  }
}

// ---- Map controller: keep map view synced with "position" ----
function RecenterOnChange({
  position,
  zoom = 14,
}: {
  position: LatLng | null;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    // smooth & reliable re-center
    map.flyTo([position.lat, position.lng], zoom, {
      animate: true,
      duration: 0.8,
      easeLinearity: 0.25,
    });
  }, [map, position?.lat, position?.lng, zoom]);
  return null;
}

// Click anywhere to set marker
function ClickToSetMarker({
  onPick,
}: {
  onPick: (p: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationOnboarding() {
  useRedirectIfAuthenticated("/home");
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const rafRef = useRef<number | null>(null);

  const [current, setCurrent] = useState<LatLng | null>(null);
  const [address, setAddress] = useState<string>("");
  const [guessing, setGuessing] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Form state
  const [latInput, setLatInput] = useState<string>("");
  const [lngInput, setLngInput] = useState<string>("");
  const [pasteField, setPasteField] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'paste' | 'coords'>('search');
  const [mapLoading, setMapLoading] = useState(true);

  // Debounced forward geocoding
  useEffect(() => {
    let t: any;
    if (search.trim().length >= 3) {
      setSearching(true);
      t = setTimeout(async () => {
        const res = await forwardGeocode(search.trim());
        setSuggestions(res);
        setSearching(false);
        setSearchOpen(true);
      }, 350);
    } else {
      setSuggestions([]);
      setSearchOpen(false);
      setSearching(false);
    }
    return () => clearTimeout(t);
  }, [search]);

  // keep leaflet happy on resizes
  useEffect(() => {
    const onResize = () => {
      const map = mapRef.current;
      if (!map) return;
      setTimeout(() => map.invalidateSize(), 150);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // If user already picked a location earlier, skip (outside signup)
  useEffect(() => {
    const saved = localStorage.getItem("location");
    const auth = localStorage.getItem("auth");
    const isAuthed = !!auth && JSON.parse(auth)?.authenticated;
    const onboarding = (
      sessionStorage.getItem("onboardingFlow") || ""
    ).toLowerCase();

    if (onboarding !== "signup" && isAuthed && saved) {
      navigate("/home");
    }
  }, [navigate]);

  // Try to get device position (with graceful fallback)
  useEffect(() => {
    let mounted = true;

    const setDefaults = () => {
      const p = DEFAULT_CENTER;
      setCurrent(p);
      setLatInput(p.lat.toFixed(6));
      setLngInput(p.lng.toFixed(6));
      setGuessing(false);
    };

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      setDefaults();
      return;
    }

    const askPosition = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!mounted) return;
          const p = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setCurrent(p);
          setLatInput(p.lat.toFixed(6));
          setLngInput(p.lng.toFixed(6));
          setGuessing(false);
          setError("");
          // prefetch address
          const label = await reverseGeocode(p);
          setAddress(label || "");
        },
        () => {
          if (!mounted) return;
          setError("");
          setDefaults();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    const anyNav: any = navigator as any;
    if (anyNav.permissions?.query) {
      anyNav.permissions
        .query({ name: "geolocation" as PermissionName })
        .then(() => askPosition())
        .catch(() => askPosition());
    } else {
      askPosition();
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Reverse geocode after position settles (map move complete or state change)
  useEffect(() => {
    let active = true;
    const go = async () => {
      if (!current) return;
      const label = await reverseGeocode(current);
      if (active) setAddress(label || "");
    };
    // small debounce to avoid spamming on quick interactions
    const t = setTimeout(go, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [current?.lat, current?.lng]);

  // Map helpers
  const center = useMemo<LatLng>(() => current ?? DEFAULT_CENTER, [current]);

  const applyManualCoords = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isValidLat(lat) || !isValidLng(lng)) {
      setError(
        "Invalid coordinates. Latitude must be between -90 and 90; longitude between -180 and 180."
      );
      return;
    }
    const p = clampLatLng({ lat, lng });
    setCurrent(p);
    setError("");
  };

  const applyPaste = () => {
    const parsed = parseLatLngFromText(pasteField);
    if (!parsed) {
      setError(
        "Couldn’t parse coordinates or map link. Try a format like: 25.2048, 55.2708"
      );
      return;
    }
    const p = clampLatLng(parsed);
    setCurrent(p);
    setLatInput(p.lat.toFixed(6));
    setLngInput(p.lng.toFixed(6));
    setError("");
  };

  const resetToDubai = () => {
    const p = { ...DEFAULT_CENTER };
    setCurrent(p);
    setLatInput(p.lat.toFixed(6));
    setLngInput(p.lng.toFixed(6));
  };

  const useMyLocation = () => {
    setGuessing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCurrent(p);
        setLatInput(p.lat.toFixed(6));
        setLngInput(p.lng.toFixed(6));
        setGuessing(false);
        setError("");
      },
      () => {
        setGuessing(false);
        setError(
          "Couldn’t get your current location. You can still pick on the map."
        );
        resetToDubai();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onConfirm = async () => {
    if (!current) return;
    setSaving(true);
    const label = await reverseGeocode(current);
    localStorage.setItem(
      "location",
      JSON.stringify({
        ...current,
        address:
          label || `(${current.lat.toFixed(5)}, ${current.lng.toFixed(5)})`,
        setAt: new Date().toISOString(),
      })
    );
    setSaving(false);
    navigate("/auth/Identity"); // next onboarding step
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Choose your location</h1>
        <p className={styles.sub}>
          Drag the marker, click the map, search an address, or enter
          coordinates.
        </p>
      </header>

      <div className={styles.grid}>

        {/* LEFT: Controls */}
        <div className={styles.controls}>
          {/* Step heading */}
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Set your location</h2>
            <p className={styles.sectionSub}>Pick on the map or use one of the methods below.</p>
          </div>

          {/* Entry method picker */}
          <div className={styles.segmented} role="tablist" aria-label="Entry method">
            <button
              type="button"
              className={styles.segBtn}
              role="tab"
              aria-selected={mode === "search"}
              data-active={mode === "search"}
              onClick={() => setMode("search")}
            >
              Search
            </button>
            <button
              type="button"
              className={styles.segBtn}
              role="tab"
              aria-selected={mode === "paste"}
              data-active={mode === "paste"}
              onClick={() => setMode("paste")}
            >
              Paste link
            </button>
            <button
              type="button"
              className={styles.segBtn}
              role="tab"
              aria-selected={mode === "coords"}
              data-active={mode === "coords"}
              onClick={() => setMode("coords")}
            >
              Coordinates
            </button>
          </div>

          {/* Panels */}
          {mode === "search" && (
            <div className={styles.panel}>
              <label className={styles.label}>Search address / place</label>
              <div className={styles.searchWrap}>
                <input
                  className={styles.inputLg}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Dubai Mall"
                  onFocus={() => search.trim().length >= 3 && setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                />
                {searchOpen && (
                  <div className={styles.suggest}>
                    {searching ? (
                      <div className={styles.suggestItem}>Searching…</div>
                    ) : suggestions.length ? (
                      suggestions.map((s, i) => (
                        <button
                          key={s.display_name + i}
                          type="button"
                          className={styles.suggestItem}
                          onClick={() => {
                            const p = clampLatLng({
                              lat: parseFloat(s.lat),
                              lng: parseFloat(s.lon),
                            });
                            setCurrent(p);
                            setLatInput(p.lat.toFixed(6));
                            setLngInput(p.lng.toFixed(6));
                            setSearchOpen(false);
                            setError("");
                          }}
                        >
                          {s.display_name}
                        </button>
                      ))
                    ) : (
                      <div className={styles.suggestItem}>No results</div>
                    )}
                  </div>
                )}
              </div>
              <p className={styles.help}>Tip: type at least 3 characters to see suggestions.</p>
            </div>
          )}

          {mode === "paste" && (
            <div className={styles.panel}>
              <label className={styles.label}>Paste Google Maps link or “lat,lng”</label>
              <div className={styles.inline}>
                <input
                  className={styles.inputLg}
                  value={pasteField}
                  onChange={(e) => setPasteField(e.target.value)}
                  placeholder="https://maps.google.com/?q=25.2048,55.2708 or 25.2048, 55.2708"
                />
                <button type="button" className={styles.secondary} onClick={applyPaste}>
                  Use
                </button>
              </div>
              <p className={styles.help}>We’ll extract the coordinates if present.</p>
            </div>
          )}

          {mode === "coords" && (
            <div className={styles.panel}>
              <label className={styles.label}>Enter coordinates</label>
              <div className={styles.row2col}>
                <input
                  className={styles.inputLg}
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="Latitude e.g. 25.204800"
                  inputMode="decimal"
                />
                <input
                  className={styles.inputLg}
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  placeholder="Longitude e.g. 55.270800"
                  inputMode="decimal"
                />
              </div>
              <div className={styles.actionsInline}>
                <button type="button" className={styles.secondary} onClick={applyManualCoords}>
                  Apply
                </button>
                <button type="button" className={styles.ghost} onClick={resetToDubai}>
                  Reset to Dubai
                </button>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className={styles.quickRow}>
            <button type="button" className={styles.secondary} onClick={useMyLocation}>
              Use my current location
            </button>
            <button type="button" className={styles.secondary} onClick={resetToDubai}>
              Dubai default
            </button>
          </div>

          {/* Selected location summary */}
          {guessing ? (
            <p className={styles.hint}>Detecting your location… You can still pick manually.</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : null}

          {/* Main action */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              style={{ background: colors.accent, color: colors.white, opacity: current ? 1 : 0.6 }}
              disabled={!current || saving}
              onClick={onConfirm}
            >
              {saving ? "Saving…" : "Confirm location"}
            </button>
          </div>

          <p className={styles.footNote}>Click the map to set a marker. Drag to adjust precisely.</p>
        </div>
        {/* RIGHT: Map */}
        <div className={styles.mapCol}>
          {/* Floating map toolbar */}
          <div className={styles.mapToolbar}>
            <button
              className={styles.toolBtn}
              onClick={resetToDubai}
              title="Go to Dubai default"
            >
              Dubai
            </button>
            <button
              className={styles.toolBtn}
              onClick={useMyLocation}
              title="Use my location"
            >
              Locate
            </button>
          </div>

          <MapContainer
            center={[center.lat, center.lng]}
            zoom={13}
            scrollWheelZoom
            style={{ width: "100%", height: 520, borderRadius: 20 }}
            whenCreated={(map) => {
              mapRef.current = map;
              setMapLoading(true);
            }}
          >
            {/* Keep map synced with "current" */}
            <RecenterOnChange position={current} zoom={14} />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                loading: () => setMapLoading(true),
                tileloadstart: () => setMapLoading(true),
                load: () => setMapLoading(false),
              }}
            />

            <ClickToSetMarker
              onPick={(p) => {
                setCurrent(p);
                setLatInput(p.lat.toFixed(6));
                setLngInput(p.lng.toFixed(6));
                setError("");
              }}
            />

            {current && (
              <Marker
                position={[current.lat, current.lng]}
                draggable={true}
                eventHandlers={{
                  drag: (e) => {
                    // Keep map centered under the marker while dragging (smooth).
                    const m = e.target as L.Marker;
                    const ll = m.getLatLng();
                    if (rafRef.current) return;
                    rafRef.current = requestAnimationFrame(() => {
                      rafRef.current = null;
                      mapRef.current?.panTo(ll, { animate: false });
                    });
                  },
                  dragend: (e) => {
                    // Finalize position and gently re-center/zoom.
                    const m = e.target as L.Marker;
                    const ll = m.getLatLng();
                    const p = { lat: ll.lat, lng: ll.lng };
                    setCurrent(p);
                    setLatInput(p.lat.toFixed(6));
                    setLngInput(p.lng.toFixed(6));
                  },
                } as any}
              />
            )}
          </MapContainer>

          {/* Address chip overlay */}
          {address && (
            <div className={styles.addrChip} title={address}>
              {address}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
