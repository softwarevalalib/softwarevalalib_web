import { Link } from "react-router-dom";
import { FiArrowRight, FiMonitor, FiSmartphone, FiGlobe } from "react-icons/fi";
import Reveal from "../Animations/Reveal";
import projectsData from "../data/projects.json";

const ICONS = { web: FiGlobe, mobile: FiSmartphone, software: FiMonitor };

const FEATURED = projectsData.slice(0, 6).map((p, i) => ({
  id: p.id,
  index: String(i + 1).padStart(2, "0"),
  title: p.title,
  category: p.category,
  tech: p.technologies[0] || "Tech",
  icon: [FiGlobe, FiSmartphone, FiMonitor, FiGlobe, FiMonitor, FiSmartphone][i],
}));

/**
 * Digtek-style case-study carousel with numbered items + category tags.
 */
export default function CaseStudies() {
  const doubled = [...FEATURED, ...FEATURED];

  return (
    <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-900 section-padding transition-colors duration-300">
      <div className="section-container mb-12">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow">Case Studies</span>
            <h2 className="section-heading mt-3">
              Real systems we built for real <span className="accent">businesses</span>
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-base sm:text-lg">
              Explore a selection of management systems and digital products delivered
              across education, finance, healthcare, and more.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="overflow-hidden">
        <div className="carousel-track">
          {doubled.map((item, i) => {
            const Icon = item.icon;
            return (
              <article
                key={`${item.id}-${i}`}
                className="lift w-[300px] sm:w-[360px] shrink-0 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden"
              >
                <div className="relative h-44 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,#f97316,transparent_60%)]" />
                  <Icon size={56} className="text-orange-400 relative z-10" />
                  <span className="absolute top-4 left-4 font-display text-5xl font-extrabold text-white/10">
                    {item.index}
                  </span>
                </div>
                <div className="p-6">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wide text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <Link
                    to="/projects"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors group"
                  >
                    Read More
                    <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
