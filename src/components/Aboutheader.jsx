import { Link } from "react-router-dom";
import Reveal from "../Animations/Reveal";

function Aboutheader() {
  return (
    <section className="relative bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="section-container section-padding relative z-10 text-center">
        <Reveal>
          <div className="hero-text text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
            <span>We Build Your</span>
            <div className="word-slider font-bold">
              <span>Platforms</span>
              <span>Websites</span>
              <span>Applications</span>
              <span>SaaS</span>
              <span>Startups</span>
              <span>Network Infra.</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-3xl mx-auto mt-8 leading-relaxed">
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

export default Aboutheader;
