import { motion } from "framer-motion";
import pc1 from "../images/pc1.png";
import pc2 from "../images/pc2.png";
import pc3 from "../images/pc3.png";
import Reveal from "../Animations/Reveal";

function ServicesHeader() {
  return (
    <section className="relative bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-80 h-80 bg-orange-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="section-container section-padding relative z-10">
        <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-8 mb-8 sm:mb-12">
          <motion.img
            src={pc1}
            alt="Desktop illustration"
            className="w-16 sm:w-24 md:w-32 lg:w-40 h-auto"
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          />
          <motion.img
            src={pc2}
            alt="Laptop illustration"
            className="w-20 sm:w-28 md:w-36 lg:w-44 h-auto"
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          />
          <motion.img
            src={pc3}
            alt="Mobile illustration"
            className="w-16 sm:w-24 md:w-32 lg:w-40 h-auto"
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          />
        </div>

        <Reveal>
          <h1 className="text-center font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-orange-500">
            Our Services
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-white text-center mt-4 mb-2 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed text-slate-300">
            Comprehensive technology solutions designed to help your business thrive
            in Liberia&apos;s digital economy
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export default ServicesHeader;
