import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import Reveal from "../Animations/Reveal";
import FloatingShapes from "./FloatingShapes";

/**
 * Digtek-style CTA banner with rocket-ish glow + "Talk to a Specialist".
 */
export default function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-slate-950 section-padding">
      <FloatingShapes variant="soft" />
      <div className="section-container relative z-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/15 via-slate-900 to-cyan-500/10 px-8 py-14 sm:px-16 sm:py-20 text-center">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-orange-500/30 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-cyan-500/30 blur-3xl" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="eyebrow text-orange-400">Let&apos;s Connect</span>
              <h2 className="section-heading text-white mt-3">
                Stay Connected With Cutting Edge <span className="gradient-brand">IT</span>
              </h2>
              <p className="mt-4 text-slate-300 text-base sm:text-lg">
                Tell us about your project and our specialists will help you choose the
                right solution — fast, affordable, and built to last.
              </p>
              <Link to="/contact" className="btn-primary mt-8 group">
                Talk To A Specialist
                <FiArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
