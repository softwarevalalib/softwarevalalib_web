import { FiCheckCircle } from "react-icons/fi";
import Reveal from "../Animations/Reveal";
import GroupImage from "../images/group.png";

const REASONS = [
  "30-day money back guarantee",
  "24/7 system monitoring & support",
  "Fixed, transparent pricing",
  "Local expertise, global standards",
];

/**
 * Digtek "Let's make something awesome together" block:
 * heading + checklist + CTA + decorative image.
 */
export default function WhyChooseUs() {
  return (
    <section className="section-padding bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Reveal direction="left">
            <div className="relative">
              <img
                src={GroupImage}
                alt="Software Vala Liberia team"
                className="w-full rounded-3xl shadow-xl object-cover aspect-[4/3]"
              />
              <div className="absolute -bottom-5 -left-5 w-full h-full rounded-3xl border-2 border-orange-500/30 -z-10" />
              <div className="absolute -top-5 -right-5 w-24 h-24 rounded-2xl bg-orange-500/15 blur-2xl" />
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.1}>
            <span className="eyebrow">Why Choose Us</span>
            <h2 className="section-heading mt-3">
              Let&apos;s make something <span className="accent">awesome</span> together
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
              We combine international engineering standards with deep local knowledge
              to deliver software, websites, and systems that truly work for your
              business in Liberia and beyond.
            </p>

            <ul className="mt-8 grid sm:grid-cols-2 gap-4">
              {REASONS.map((r) => (
                <li
                  key={r}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3"
                >
                  <FiCheckCircle className="text-orange-500 shrink-0" size={20} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {r}
                  </span>
                </li>
              ))}
            </ul>

            <a href="#contact" className="btn-primary mt-8">
              Explore More
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
