import { Link } from "react-router-dom";
import { FaLaptopCode } from "react-icons/fa";
import { FiGlobe, FiServer, FiCloud, FiBarChart2, FiShield, FiArrowRight } from "react-icons/fi";
import Reveal from "../Animations/Reveal";
import Services from "../data/services.json";

const ICONS = {
  "Software Development": FaLaptopCode,
  "Web Development": FiGlobe,
  "Web Hosting": FiServer,
  "Cloud Services": FiCloud,
  "Digital Marketing": FiBarChart2,
  "Cybersecurity Services": FiShield,
};

const FEATURED = [
  "Software Development",
  "Web Development",
  "Digital Marketing",
  "Cloud Services",
  "Cybersecurity Services",
  "Web Hosting",
];

export default function HomeServices() {
  const items = FEATURED.map((title) => Services.find((s) => s.title === title)).filter(Boolean);

  return (
    <section className="section-padding bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="section-container">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow">What We Do</span>
            <h2 className="section-heading mt-3">
              Use technology to drive <span className="accent">growth</span> at your business
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-base sm:text-lg">
              From custom software to cloud and security — we deliver end-to-end
              solutions that move your business forward.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((service, i) => {
            const Icon = ICONS[service.title] || FaLaptopCode;
            return (
              <Reveal key={service.id} delay={i * 0.08}>
                <article className="lift h-full rounded-2xl p-7 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {service.description}
                  </p>
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors group/link"
                  >
                    Read More
                    <FiArrowRight className="transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
