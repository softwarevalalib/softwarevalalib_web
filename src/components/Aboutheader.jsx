import { Link } from "react-router-dom";
import Reveal from "../Animations/Reveal";
import FloatingShapes from "./FloatingShapes";

export default function Aboutheader() {
  return (
    <section className="relative bg-slate-950 overflow-hidden">
      <FloatingShapes variant="hero" />
      <div className="section-container section-padding relative z-10 text-center">
        <Reveal>
          <span className="eyebrow text-orange-400">About Company</span>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="section-heading text-white mt-4">
            We Build Your{" "}
            <span className="block text-orange-500 mt-1">Digital Future</span>
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-3xl mx-auto mt-6 leading-relaxed">
            We build innovative software solutions that help businesses scale,
            automate processes, and deliver exceptional digital experiences.
          </p>
        </Reveal>

        <Reveal delay={0.35}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className="btn-primary w-full sm:w-auto">
              Get Started
            </Link>
            <Link to="/projects" className="btn-secondary w-full sm:w-auto">
              View Projects
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
