import Reveal from "../Animations/Reveal";

/**
 * "1k+ Brands Trust Us" style logo strip. Renders brand wordmarks (since we
 * have no brand images) as styled pills that subtly animate on hover.
 */
const BRANDS = ["LiberPay", "EduLink", "MedSave", "TradeHub", "BuildCorp", "AgriTech"];

export default function TrustStrip() {
  return (
    <section className="bg-white dark:bg-slate-950 section-padding transition-colors duration-300">
      <div className="section-container">
        <Reveal>
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 mb-8">
            1k+ Brands Trust Us
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-16">
            {BRANDS.map((b) => (
              <span
                key={b}
                className="text-xl sm:text-2xl font-display font-bold text-slate-400 dark:text-slate-600 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-300 grayscale hover:grayscale-0"
              >
                {b}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
