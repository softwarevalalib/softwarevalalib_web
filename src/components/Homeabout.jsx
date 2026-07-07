import Reveal from "../Animations/Reveal";

function Homeabout() {
  return (
    <section className="bg-slate-50 dark:bg-slate-900 section-padding transition-colors duration-300">
      <div className="section-container">
        <Reveal>
          <p className="section-label text-center">About Us</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="section-title text-center mt-3 mb-8">
            Software Vala Liberia
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-4xl mx-auto text-center">
            Software Vala Liberia is a{" "}
            <span className="font-bold text-orange-500">FULL STACK</span>{" "}
            development agency based in Liberia. We are passionate about helping
            businesses in the retail, finance, health and corporate industries
            fully leverage the latest software technologies. As a development team
            in Liberia, our tech team is dedicated to create websites and Mobile
            Applications that meet your exact needs because we pride ourselves on
            being the best software development agency in Liberia.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-4xl mx-auto text-center mt-6">
            We build corporate business websites and ecommerce websites for all
            kinds of businesses across industries in Liberia and beyond. Our
            services include responsive website design, ecommerce website
            development, WordPress web development, website maintenance, website
            redesign, SEO, mobile app dev, social media management, CCTV Camera
            Installation, Graphic Design and many more.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export default Homeabout;
