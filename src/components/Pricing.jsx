import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import Reveal from "../Animations/Reveal";

const PLANS = [
  {
    name: "Starter website",
    monthly: 49,
    yearly: 39,
    tagline: "A small public website package",
    features: ["Responsive website", "Basic SEO", "Contact form", "1 month support", "Domain setup"],
    popular: false,
    quote: false,
  },
  {
    name: "Growth website",
    monthly: 99,
    yearly: 74,
    tagline: "A larger website package",
    features: ["Website with more pages", "SEO setup", "Content updates for the term", "6 months support", "Hosting for the term"],
    popular: true,
    quote: false,
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="section-padding bg-white transition-colors duration-300">
      <div className="section-container">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow">Pricing</span>
            <h2 className="section-heading mt-3">
              Our awesome <span className="accent">Pricing Plan</span>
            </h2>
            <p className="mt-4 text-slate-600 text-base sm:text-lg">
              The prices below are website packages already published by Software Vala Liberia. Custom software,
              management systems, mobile apps, and enterprise work are quoted from your requirements.
              Final pricing depends on project requirements.
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
                      ? "border-[#c10020] bg-[#c10020]/5 shadow-2xl shadow-[#c10020]/10 md:-translate-y-4"
                      : "border-slate-200 bg-white "
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c10020] text-white text-xs font-bold uppercase tracking-wide px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 ">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 ">{plan.tagline}</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="font-display text-5xl font-extrabold text-slate-900 ">${price}</span>
                    <span className="mb-1 text-slate-500 font-medium">/ {yearly ? "mo, billed yearly" : "Month"}</span>
                  </div>
                  <Link
                    to="/consultation"
                    className={`mt-6 block text-center rounded-xl font-semibold py-3 transition-all duration-300 ${
                      plan.popular
                        ? "bg-[#c10020] text-white hover:bg-[#a0001a] hover:-translate-y-0.5"
                        : "bg-slate-900 text-white hover:bg-[#c10020] "
                    }`}
                  >
                    Request free consultation
                  </Link>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-slate-600 ">
                        <span className="grid place-items-center w-5 h-5 rounded-full bg-[#c10020]/15 text-[#c10020] shrink-0">
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
          <Reveal delay={0.2}>
            <div className="rounded-3xl border border-[#00274c] bg-[#00274c] p-8 h-full text-white">
              <h3 className="text-lg font-bold">Custom software and enterprise systems</h3>
              <p className="mt-2 text-sm text-white/80">
                Management systems, mobile apps, integrations, and other scoped builds. No monthly package price is published for this work.
              </p>
              <p className="mt-6 font-display text-3xl font-extrabold">Request a quotation</p>
              <Link to="/request-quote" className="btn-primary mt-6">
                Request a quote
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
