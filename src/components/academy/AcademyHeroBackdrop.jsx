import { useEffect, useState } from "react";
import AcademyImage from "./AcademyImage";
import { ACADEMY_ASSETS, HERO_SLIDES } from "../../data/academyMeta";

const SLIDE_MS = 5500;

/**
 * Full-bleed hero background slideshow + circular Academy logo (top-right).
 */
export default function AcademyHeroBackdrop({ children }) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || HERO_SLIDES.length < 2) return undefined;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <section
      className="relative min-h-[78vh] sm:min-h-[85vh] overflow-hidden bg-[#00274c]"
      aria-labelledby="academy-hero-heading"
    >
      {/* Sliding photo backgrounds */}
      <div className="absolute inset-0" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.src}
              alt=""
              className="h-full w-full object-cover object-center scale-105"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
        {/* Brand navy overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001a33]/92 via-[#00274c]/78 to-[#00274c]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001a33]/80 via-transparent to-[#001a33]/35" />
      </div>

      {/* Academy logo — top-right circular badge */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white shadow-lg shadow-black/25 ring-2 ring-white/90 overflow-hidden flex items-center justify-center p-1.5">
          <AcademyImage
            src={ACADEMY_ASSETS.logo}
            alt="SVL Training Academy"
            className="h-full w-full object-contain rounded-full"
          />
        </div>
      </div>

      {/* Slide indicators */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2"
        role="tablist"
        aria-label="Hero background slides"
      >
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={`Show slide ${index + 1}: ${slide.alt}`}
            onClick={() => setActive(index)}
            className={`h-2 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              index === active
                ? "w-7 bg-[#c10020]"
                : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      <div className="section-container section-padding relative z-10 flex items-center min-h-[78vh] sm:min-h-[85vh]">
        {children}
      </div>
    </section>
  );
}
