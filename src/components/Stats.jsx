import Counter from "./Counter";
import Reveal from "../Animations/Reveal";
import FloatingShapes from "./FloatingShapes";
import { verifiedPublicStats } from "../data/companyStats";

/** Renders only management-verified figures. Hidden when none are set. */
export default function Stats() {
  const stats = verifiedPublicStats();
  if (!stats.length) return null;

  return (
    <section className="relative overflow-hidden bg-[#00274c] section-padding">
      <FloatingShapes variant="soft" />
      <div className="section-container relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {stats.map((s, i) => (
            <Reveal key={s.key} delay={i * 0.1} className="flex justify-center">
              <Counter end={s.value} suffix={s.suffix} label={s.label} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
