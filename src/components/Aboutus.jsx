import { Link } from "react-router-dom";
import GroupImage from "../images/group.png";
import Reveal from "../Animations/Reveal";

function Aboutus() {
  return (
    <section className="section-padding bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="section-container">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow">Our Story</span>
            <h2 className="section-heading mt-3 uppercase">
              Software Vala Liberia
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal direction="left" delay={0.2}>
            <div className="space-y-5 text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
              <p>
                Software Vala Liberia is a leading global software company with a
                growing footprint in Liberia. Our platform offers over 20 software
                solutions both locally and internationally tailored to education,
                finance, retail, and more. We are proud of our commitment to delivering
                high-quality software services at competitive, fixed prices.
              </p>
              <p>
                Software Development, Web Development, Web Hosting, Cloud Services,
                Network Infrastructure, Digital marketing, Training &amp; Support,
                Cybersecurity Services, CCTV Installation, Graphic Design and Solar
                Energy.
              </p>
              <p>
                As a leading Software Development agency and web design agency in
                Liberia, Software Vala Liberia, Inc. began with a simple mission: to
                bridge the technology gap in Liberia and provide world-class software
                solutions to local businesses and organizations.
              </p>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.3}>
            <div className="relative">
              <img
                src={GroupImage}
                alt="Software Vala Liberia team"
                className="w-full rounded-3xl shadow-xl object-cover aspect-4/3"
              />
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-3xl border-2 border-orange-500/30 -z-10" />
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.4}>
          <p className="mt-10 text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-4xl mx-auto text-center">
            Based in Paynesville, Monrovia, Liberia, we understand the unique challenges
            and opportunities that come with operating in Liberia&apos;s growing digital
            economy. Our team combines international expertise with local knowledge to
            deliver solutions that truly work for our clients. Our mission is to be the
            leading and most trusted provider of diverse software solutions in Liberia
            — committed to quality, affordability, and digital transformation.
          </p>
        </Reveal>

        <Reveal delay={0.5}>
          <div className="text-center mt-10">
            <Link to="/projects" className="btn-primary">
              View Our Projects
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default Aboutus;
