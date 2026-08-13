import { Link } from "react-router-dom";
import Reveal from "../Animations/Reveal";
import Software from "../images/Software.png";

const SKILLS = [
  { label: "Web & Software Development", value: 95 },
  { label: "Search Engine Optimization", value: 88 },
  { label: "Cloud & Infrastructure", value: 82 },
  { label: "UI/UX & Graphic Design", value: 90 },
];

function SkillBar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-sm font-bold text-orange-500">{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <Reveal direction="left" once>
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
            style={{ width: `${value}%` }}
          />
        </Reveal>
      </div>
    </div>
  );
}

export default function HomeAbout() {
  return (
    <section className="bg-slate-50 dark:bg-slate-900 section-padding transition-colors duration-300">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Reveal direction="left">
            <span className="eyebrow">About Company</span>
            <h2 className="section-heading mt-3">
              Skills to improve your <span className="accent">company brand</span>
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
              Software Vala Liberia is a full-stack development agency helping businesses
              in retail, finance, health, and corporate industries leverage the latest
              software technologies. We pride ourselves on being the best software
              development agency in Liberia.
            </p>

            <div className="mt-8 space-y-5">
              {SKILLS.map((s, i) => (
                <SkillBar key={s.label} label={s.label} value={s.value} />
              ))}
            </div>

            <Link to="/about" className="btn-primary mt-8">
              Explore More
            </Link>
          </Reveal>

          <Reveal direction="right" delay={0.1}>
            <div className="relative">
              <img
                src={Software}
                alt="Software Vala Liberia solutions"
                className="w-full rounded-3xl shadow-xl object-cover"
              />
              <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-2xl bg-cyan-500/20 blur-2xl" />
              <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
