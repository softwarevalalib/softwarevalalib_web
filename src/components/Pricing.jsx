import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import Reveal from "../Animations/Reveal";

const PLANS = [
  {
    name: "Starter Plan",
    monthly: 49,
    yearly: 39,
    tagline: "For small businesses getting online",
    features: ["Responsive Website", "Basic SEO", "Contact Form", "1 Month Support", "Domain Setup"],
    popular: false,
  },
  {
    name: "Premium Plan",
    monthly: 99,
    yearly: 74,
    tagline: "For growing brands that need more",
    features: ["Custom Web App", "Advanced SEO", "CMS & Dashboard", "6 Months Support", "Hosting Included", "Analytics"],
    popular: true,
  },
  {
    name: "Extended Plan",
    monthly: 149,
    yearly: 112,
    tagline: "For enterprises & complex systems",
    features: ["Full SaaS Platform", "API Integrations", "Dedicated PM", "12 Months Support", "Cloud & Security", "Training"],
    popular: false,
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="section-padding bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="section-container">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow">Pricing</span>
            <h2 className="section-heading mt-3">
              Our awesome <span className="accent">Pricing Plan</span>
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-base sm:text-lg">
              Transparent, fixed pricing. Switch to yearly and save 25%.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 flex justify-center">
            <div className="toggle-pill">
              <span className={`slider-thumb ${yearly ? "right" : ""}`} />
              <button
                type="button"
                className={!yearly ? "active" : ""}
                onClick={() => setYearly(false)}
              >
                Monthly
              </button>
              <button
                type="button"
                className={yearly ? "active" : ""}
                onClick={() => setYearly(true)}
              >
                Yearly
              </button>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3 items-start">
          {PLANS.map((plan, i) => {
            const price = yearly ? plan.yearly : plan.monthly;
            return (
              <Reveal key={plan.name} delay={i * 0.1}>
                <div
                  className={`relative rounded-3xl p-8 h-full border transition-all duration-300 ${
                    plan.popular
                      ? "border-orange-500 bg-orange-500/[0.04] shadow-2xl shadow-orange-500/10 md:-translate-y-4"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold uppercase tracking-wide px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.tagline}</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="font-display text-5xl font-extrabold text-slate-900 dark:text-white">${price}</span>
                    <span className="mb-1 text-slate-500 dark:text-slate-400 font-medium">/ {yearly ? "mo, billed yearly" : "Month"}</span>
                  </div>
                  <Link
                    to="/contact"
                    className={`mt-6 block text-center rounded-xl font-semibold py-3 transition-all duration-300 ${
                      plan.popular
                        ? "bg-orange-500 text-white hover:bg-orange-600 hover:-translate-y-0.5"
                        : "bg-slate-900 text-white hover:bg-orange-500 dark:bg-white dark:text-slate-950 dark:hover:bg-orange-500 dark:hover:text-white"
                    }`}
                  >
                    Get Started Now
                  </Link>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <span className="grid place-items-center w-5 h-5 rounded-full bg-orange-500/15 text-orange-500 shrink-0">
                          <FiCheck size={12} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
