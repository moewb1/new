import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import styles from "./AuthEntry.module.css";
import AuthChoiceCard from "@/components/AuthChoiceCard/AuthChoiceCard";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import recruitMeLogo from "@/assets/recruitme-logo.svg";

type Role = "provider" | "consumer";

type Slide = {
  title: string;
  desc: string;
};

const slides: Slide[] = [
  {
    title: "YOUR STAFFING SOLUTION, SORTED",
    desc: "Find your crew in minutes with verified professionals ready for every service moment.",
  },
  {
    title: "TALENT ON TAP",
    desc: "Quality talent, zero drama. Transparent rates, instant chat, and real event photography.",
  },
  {
    title: "EVENT TOMORROW? WE'VE GOT YOU COVERED",
    desc: "WhatsApp our business desk and we rally vetted experts with bank-grade protection.",
  },
];

const roleContent: Record<
  Role,
  { label: string; highlight: string; description: string; roleBadge: string }
> = {
  consumer: {
    label: "Find Talent",
    highlight: "Build my crew",
    roleBadge: "Client / Recruiter",
    description:
      "Build your event roster in under three minutes with trusted professionals and transparent pricing.",
  },
  provider: {
    label: "Offer My Skills",
    highlight: "I’m ready to work",
    roleBadge: "Provider / Talent",
    description:
      "Showcase your licences, set your availability, and get booked by premium venues and brands.",
  },
};

export default function AuthEntry() {
  const [role, setRole] = useState<Role | null>(null);
  const [language, setLanguage] = useState<Language>("English");
  const navigate = useNavigate();

  useRedirectIfAuthenticated("/home");

  const onNext = () => {
    if (!role) return;
    navigate(`/auth/signup?role=${role}`);
  };

  const autoplay = useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [autoplay]);
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((idx: number) => emblaApi?.scrollTo(idx), [emblaApi]);

  const nextLabel = role ? `Get started as ${roleContent[role].label}` : "Choose how you want to start";

  return (
    <section className={styles.wrapper}>
      <header className={styles.headerRow}>
        <div className={styles.brandGroup}>
          <img src={recruitMeLogo} alt="Recruit Me" className={styles.logoImage} />
          <p className={styles.tagline}>Where talent meets opportunity.</p>
        </div>
        <p className={styles.localeNote}>Platform available in English • Serving venues across the UAE</p>
      </header>

      <div className={`${styles.hero} brand-spotlight`}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>THE STAFFING PLATFORM THAT ACTUALLY WORKS</h1>
          <p className={styles.heroSub}>
            Find quality crew in minutes, not days. Progressive onboarding, verified licences, and secure payouts backed
            by our UAE partners.
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.heroButton} onClick={onNext} disabled={!role}>
              GET STARTED
            </button>
            <span className={styles.heroSupport}>WhatsApp Business support • +971 50 123 4567</span>
          </div>
        </div>
      </div>

      <section className={styles.roleSection}>
        <div className={styles.roleHeader}>
          <h2 className={styles.roleTitle}>I&rsquo;m here to...</h2>
          <p className={styles.roleCaption}>Select the path that aligns with your goals.</p>
        </div>
        <div className={styles.roleGrid} role="radiogroup" aria-label="Choose your starting path">
          {(Object.keys(roleContent) as Role[]).map((key) => (
            <AuthChoiceCard
              key={key}
              role={key}
              label={roleContent[key].label}
              roleBadge={roleContent[key].roleBadge}
              highlight={roleContent[key].highlight}
              description={roleContent[key].description}
              selected={role === key}
              onSelect={(chosen) => setRole((current) => (current === chosen ? null : chosen))}
            />
          ))}
        </div>
      </section>

      <section className={styles.carousel} aria-label="Why teams choose Recruit Me">
        <div className={styles.embla} ref={emblaRef}>
          <div className={styles.emblaContainer}>
            {slides.map((slide, i) => (
              <div className={styles.emblaSlide} key={slide.title}>
                <article className={styles.infoCard} aria-roledescription="slide">
                  <h3 className={styles.infoTitle}>{slide.title}</h3>
                  <p className={styles.infoDesc}>{slide.desc}</p>
                </article>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.carouselControls}>
          <button type="button" className={styles.ctrlBtn} onClick={scrollPrev} aria-label="Previous slide">
            ‹
          </button>
          <div className={styles.dots} role="tablist" aria-label="Slide selector">
            {snaps.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={selected === i}
                aria-label={`Go to slide ${i + 1}`}
                className={styles.dot}
                data-active={selected === i ? "true" : "false"}
                onClick={() => scrollTo(i)}
                type="button"
              />
            ))}
          </div>
          <button type="button" className={styles.ctrlBtn} onClick={scrollNext} aria-label="Next slide">
            ›
          </button>
        </div>
      </section>

      <footer className={styles.footerNote}>
        {nextLabel}. By continuing you agree to our {" "}
        <a className={styles.footerLink} href="#terms">
          Terms & Conditions
        </a>{" "}
        and
        {" "}
        <a className={styles.footerLink} href="#privacy">
          Privacy Policy
        </a>
        .
      </footer>
    </section>
  );
}
