import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../Home/Home.module.css";
import { SERVICE_CATALOG, STATIC_PROVIDERS, type ServiceInfo } from "./data";
import CountryFlag from "react-country-flag";

const FALLBACK_SERVICE_IMAGE =
  "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?q=80&w=1200&auto=format&fit=crop";

const formatRate = (minor: number | undefined) => {
  if (!minor) return "AED —/hr";
  const major = Math.max(0, minor) / 100;
  return `AED ${major.toLocaleString("en-AE", { minimumFractionDigits: 0 })}/hr`;
};

export default function ProviderDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const p = id ? STATIC_PROVIDERS[id] : undefined;

  if (!p) {
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

  return (
    <section className={styles.wrapper}>
      <header className={styles.providerDetailHeader}>
        <div className={styles.providerDetailTop}>
          <img src={p.avatar} alt="" className={styles.providerDetailAvatar} />
          <div>
            <h1 className={styles.providerDetailName}>{p.name}</h1>
            <p className={styles.providerDetailMeta}>
              ⭐ {p.rating?.toFixed?.(1) ?? "4.8"} • {p.jobsCompleted ?? 40} jobs
            </p>
            <div className={styles.providerDetailMetaRow}>
              {p.nationality && (
                <span className={styles.nationalityTag}>
                  {p.nationalityCode && (
                    <CountryFlag
                      countryCode={p.nationalityCode}
                      svg
                      style={{ width: 18, height: 18, borderRadius: 6, marginRight: 6 }}
                    />
                  )}
                  {p.nationality}
                </span>
              )}
              {p.address && <span className={styles.providerDetailLocation}>{p.address}</span>}
              {p.preferredLanguage && (
                <span className={styles.providerDetailLanguage}>Language: {p.preferredLanguage}</span>
              )}
            </div>
          </div>
        </div>
        <div className={styles.providerDetailActions}>
          <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>Back</button>
          <button className={styles.primaryBtn} onClick={() => navigate(`/request/${p.id}`)}>Request Service</button>
        </div>
      </header>

      <div className={styles.centerRow}>
        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{fontWeight:900}}>About</span>
          </div>
          <div className={styles.listItem}>
            <span className={styles.listText}>{p.bio || '—'}</span>
          </div>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{fontWeight:900}}>Services</span>
          </div>
          <div className={styles.listItem}>
            <div className={styles.providerServiceCards}>
              {p.serviceIds.map((sid) => {
                const svc = SERVICE_CATALOG[sid] as ServiceInfo | undefined;
                if (!svc) return null;
                const cover = svc.image || FALLBACK_SERVICE_IMAGE;
                return (
                  <div key={sid} className={`${styles.providerServiceCard} ${styles.providerServiceCardWithImage}`}>
                    <div className={styles.providerServiceImageWrap}>
                      <img
                        src={cover}
                        alt=""
                        className={styles.providerServiceImage}
                        loading="lazy"
                        onError={(event) => {
                          (event.target as HTMLImageElement).src = FALLBACK_SERVICE_IMAGE;
                        }}
                      />
                      <span className={styles.providerServiceChip}>Featured</span>
                    </div>
                    <div className={styles.providerServiceTitle}>{svc.title}</div>
                    <div className={styles.providerServiceRate}>{formatRate(svc.hourlyRateMinor)}</div>
                    <p className={styles.providerServiceDesc}>{svc.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{fontWeight:900}}>Address</span>
          </div>
          <div className={styles.listItem}>
            <span className={styles.listText}>{p.address || '—'}</span>
          </div>
        </div>

        {p.fullBodyPhoto && (
          <div className={styles.listGroup}>
            <div className={styles.listItem}>
              <span className={styles.listText} style={{fontWeight:900}}>Full body photo</span>
            </div>
            <div className={styles.listItem}>
              <img
                src={p.fullBodyPhoto}
                alt={`Full body of ${p.name}`}
                className={styles.providerFullBody}
              />
            </div>
          </div>
        )}

        {p.gallery?.length ? (
          <div className={styles.listGroup}>
            <div className={styles.listItem}>
              <span className={styles.listText} style={{fontWeight:900}}>Gallery</span>
            </div>
            <div className={styles.listItem}>
              <div className={styles.providerGallery}>
                {p.gallery.map((url, idx) => (
                  <img
                    key={`${p.id}-gallery-${idx}`}
                    src={url}
                    alt={`${p.name} gallery ${idx + 1}`}
                    className={styles.providerGalleryImg}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {p.coords && (
          <div className={styles.listGroup}>
            <div className={styles.listItem}>
              <span className={styles.listText} style={{fontWeight:900}}>Location</span>
            </div>
            <div className={styles.providerMap}>
              <iframe
                title="Provider location"
                className={styles.providerMapIframe}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${p.coords.latitude},${p.coords.longitude}`)}&z=14&output=embed`}
              />
              <button
                type="button"
                className={styles.providerMapBtn}
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.coords.latitude},${p.coords.longitude}`)}`, "_blank", "noreferrer")}
              >
                Open in Maps
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
