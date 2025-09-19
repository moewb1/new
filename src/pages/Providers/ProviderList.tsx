import React, { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import styles from "../Home/Home.module.css";
import { SERVICE_CATALOG, SERVICE_LABELS, STATIC_PROVIDERS, type ServiceInfo } from "./data";

function formatRate(minor: number | undefined) {
  if (!minor) return null;
  const major = Math.max(0, minor) / 100;
  return `AED ${major.toLocaleString("en-AE", { minimumFractionDigits: 0 })}/hr`;
}

export default function ProviderList() {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const [search] = useSearchParams();

  const selectedService = serviceId ? SERVICE_CATALOG[serviceId] : undefined;
  const title =
    search.get("title") || selectedService?.title || SERVICE_LABELS[serviceId || ""] || "Providers";

  const providers = useMemo(() => {
    const list = Object.values(STATIC_PROVIDERS);
    return serviceId ? list.filter((p) => p.serviceIds.includes(serviceId)) : list;
  }, [serviceId]);

  const otherServices = useMemo(() => {
    const all = Object.values(SERVICE_CATALOG);
    return selectedService ? all.filter((svc) => svc.id !== selectedService.id) : all;
  }, [selectedService]);

  const heroDescription =
    selectedService?.description ||
    "Browse our trusted professionals and tap through to request the help you need in minutes.";
  const heroRate = formatRate(selectedService?.hourlyRateMinor);

  return (
    <section className={styles.wrapper}>
      <header className={styles.providerHeader}>
        <div className={styles.providerHeaderText}>
          <span className={styles.providerHeaderEyebrow}>Service marketplace</span>
          <h1 className={styles.providerHeaderTitle}>{title}</h1>
          <p className={styles.providerHeaderLead}>{heroDescription}</p>
          <div className={styles.providerHeaderMeta}>
            <span>
              {providers.length} {providers.length === 1 ? "provider" : "providers"}
            </span>
            {heroRate ? <span>{heroRate}</span> : null}
          </div>
        </div>
        <div className={styles.providerHeaderActions}>
          <button className={styles.secondaryBtn} onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </header>

      {otherServices.length > 0 && (
        <div className={styles.providerHeaderChips}>
          {otherServices.slice(0, 6).map((svc) => (
            <button
              key={svc.id}
              type="button"
              className={styles.providerHeaderChip}
              onClick={() => navigate(`/providers/${svc.id}?title=${encodeURIComponent(svc.title)}`)}
            >
              {svc.title}
            </button>
          ))}
        </div>
      )}

      <div className={styles.providerListGrid}>
        {providers.map((provider) => {
          const providerServices = provider.serviceIds
            .map((sid) => SERVICE_CATALOG[sid])
            .filter((svc): svc is ServiceInfo => Boolean(svc));
          const featuredService = selectedService ?? providerServices[0] ?? null;
          const rateLabel = featuredService
            ? formatRate(featuredService.hourlyRateMinor)
            : "Custom quote";

          return (
            <article key={provider.id} className={styles.providerListCard}>
              <div className={styles.providerListTop}>
                <div className={styles.providerListAvatarWrap}>
                  <img src={provider.avatar} alt="" className={styles.providerListAvatar} />
                </div>
                <div>
                  <h3 className={styles.providerListTitle}>{provider.name}</h3>
                  <p className={styles.providerListMeta}>
                    ⭐ {provider.rating?.toFixed?.(1) ?? "4.8"} • {provider.jobsCompleted ?? 40} jobs
                  </p>
                  {provider.bio ? (
                    <p className={styles.providerListBio}>{provider.bio}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={styles.providerListRequest}
                  onClick={() => navigate(`/request/${provider.id}`)}
                >
                  Request
                </button>
              </div>

              {providerServices.length > 0 && (
                <div className={styles.providerListServices}>
                  {providerServices.map((svc) => (
                    <span key={svc.id} className={styles.providerListService}>
                      {svc.title}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.providerListFooter}>
                <div className={styles.providerListSummary}>
                  <span className={styles.providerListRate}>{rateLabel}</span>
                  <span className={styles.providerListLocation}>{provider.address || "Dubai, UAE"}</span>
                </div>
                <button
                  type="button"
                  className={styles.providerListSecondary}
                  onClick={() => navigate(`/provider/${provider.id}`)}
                >
                  View profile
                </button>
              </div>
            </article>
          );
        })}

        {providers.length === 0 && <div className={styles.emptyState}>No providers found.</div>}
      </div>
    </section>
  );
}
