import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import styles from "./AuthEntry.module.css";
import AuthChoiceCard from "@/components/AuthChoiceCard/AuthChoiceCard";
import colors from "@/styles/colors";
import hand from "@/assets/hand.png";
import service from "@/assets/service.png";

type Role = "provider" | "consumer";

type Slide = {
  title: string;
  desc: string;
};

const slides: Slide[] = [
  {
    title: "Explanation Of Available Services",
    desc: "Waitress, Security, Hostess, Merchandise, Etc",
  },
  {
    title: "We Offer You A Systems",
    desc: "There Will Be Systems Of Payment Process, Chat Support, And Ratings",
  },
];

export default function AuthEntry() {
  const [role, setRole] = useState<Role | null>(null);
  const navigate = useNavigate();

  const onNext = () => {
    if (!role) return;
    navigate(`/auth/signup?role=${role}`);
  };

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", skipSnaps: false },
    [Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (idx: number) => emblaApi && emblaApi.scrollTo(idx),
    [emblaApi]
  );

  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <h1 className={styles.h1}>Please Choose Once</h1>
        <p className={styles.tagline}>Select One And Tell Us Who Are You, Thanks!!</p>
      </div>

      {/* Choice cards */}
      <div className={styles.grid} role="radiogroup" aria-label="Choose Your Role">
        <AuthChoiceCard
          title="Provider"
          imgSrc={service}
          selected={role === "provider"}
          onClick={() => setRole(role === "provider" ? null : "provider")}
        />
        <AuthChoiceCard
          title="Consumer"
          imgSrc={hand}
          selected={role === "consumer"}
          onClick={() => setRole(role === "consumer" ? null : "consumer")}
        />
      </div>

      {/* Carousel of info cards */}
      <div className={styles.carousel}>
        <div className={styles.embla} ref={emblaRef}>
          <div className={styles.emblaContainer}>
            {slides.map((s, i) => (
              <div className={styles.emblaSlide} key={i}>
                <article className={styles.infoCard} aria-roledescription="slide">
                  <h3 className={styles.infoTitle}>{s.title}</h3>
                  <p className={styles.infoDesc}>{s.desc}</p>
                </article>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.carouselControls}>
          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={scrollPrev}
            aria-label="Previous"
          >
            ‹
          </button>

          <div className={styles.dots} role="tablist" aria-label="Slides">
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

          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={scrollNext}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>

      <button
        className={styles.nextBtn}
        onClick={onNext}
        disabled={!role}
        type="button"
        style={{ background: colors.accent, color: colors.white }}
        aria-disabled={!role}
      >
        Next
      </button>
    </section>
  );
}
