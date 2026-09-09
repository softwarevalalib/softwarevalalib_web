import Counter from "./Counter";
import Reveal from "../Animations/Reveal";
import FloatingShapes from "./FloatingShapes";

/**
 * Success-stats band with animated counters + a trust badge, digtek-style.
 */
export default function Stats() {
  const stats = [
    { end: 500, suffix: "+", label: "Total Projects Delivered" },
    { end: 300, suffix: "M+", label: "Investment Generated" },
    { end: 1000, suffix: "+", label: "Brands That Trust Us" },
    { end: 98, suffix: "%", label: "Client Satisfaction" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#00274c] section-padding">
      <FloatingShapes variant="soft" />
      <div className="section-container relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="flex justify-center">
              <Counter end={s.end} suffix={s.suffix} label={s.label} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
