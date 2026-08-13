import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiGlobe, FiSmartphone, FiMonitor, FiDatabase, FiArrowRight,
  FiBookOpen, FiDollarSign, FiHeart, FiShoppingCart, FiTruck,
  FiSettings, FiLink,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import projectsData from "../data/projects.json";
import Footer from "../components/Footer";
import CTABanner from "../components/CTABanner";
import Reveal from "../Animations/Reveal";

function resolveProjectImage(fileName) {
  if (!fileName) return null;
  return `/assets/images/${fileName}`;
}

const categories = [
  "All",
  "Education",
  "Healthcare",
  "Finance & Banking",
  "E-commerce & Retail",
  "Business Operations",
  "Hospitality & Mobility",
  "Financial Integration",
];

const categoryIcons = {
  Education: FiBookOpen,
  Healthcare: FiHeart,
  "Finance & Banking": FiDollarSign,
  "E-commerce & Retail": FiShoppingCart,
  "Business Operations": FiMonitor,
  "Hospitality & Mobility": FiTruck,
  "Financial Integration": FiLink,
  "Web Development": FiGlobe,
  "Mobile Applications": FiSmartphone,
  "Software Development": FiMonitor,
  "Database & Systems": FiDatabase,
};

const categoryGradients = {
  Education: "from-blue-600 to-indigo-700",
  Healthcare: "from-rose-500 to-pink-600",
  "Finance & Banking": "from-emerald-500 to-teal-600",
  "E-commerce & Retail": "from-orange-500 to-amber-600",
  "Business Operations": "from-slate-600 to-slate-800",
  "Hospitality & Mobility": "from-cyan-500 to-blue-600",
  "Financial Integration": "from-violet-500 to-purple-600",
};

function getInitials(title) {
  return title
    .split(/[\s&()]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const Projects = () => {
  const [filter, setFilter] = useState("All");

  const filteredProjects =
    filter === "All"
      ? projectsData
      : projectsData.filter((p) => p.category === filter);

  return (
    <div>
      <section className="relative bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-cyan-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-500/10 blur-[100px] rounded-full" />
        </div>
        <div className="section-container section-padding relative z-10 text-center">
          <Reveal>
            <span className="eyebrow text-orange-400">Portfolio</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="section-heading text-white mt-3">
              Our Systems &amp; <span className="gradient-brand">Solutions</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Explore our portfolio of management systems and digital solutions
              built for businesses, institutions, and organizations across Liberia.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-950 py-8 sm:py-10 border-b border-slate-100 dark:border-slate-800 sticky top-16 md:top-28 z-30 transition-colors duration-300">
        <div className="section-container">
          <Reveal>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilter(category)}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                    filter === category
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="section-container">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
            Showing {filteredProjects.length} of {projectsData.length} systems
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {filteredProjects.map((project, index) => {
                const Icon = categoryIcons[project.category] || FiMonitor;
                const imageSrc = resolveProjectImage(project.image);
                const gradient = categoryGradients[project.category] || "from-slate-600 to-slate-800";
                const isExternal = project.link?.startsWith("http");

                return (
                  <motion.article
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
                    className="lift bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 group flex flex-col"
                  >
                    <div className={`relative h-48 sm:h-52 bg-gradient-to-br ${gradient} overflow-hidden`}>
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={`${project.title} cover`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                            <Icon size={32} className="text-white/80" />
                          </div>
                          <span className="text-white/60 text-2xl font-bold tracking-wider">
                            {getInitials(project.title)}
                          </span>
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
                        {project.category}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {project.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4 flex-1">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-lg text-xs font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      {isExternal ? (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-sm hover:text-orange-600 transition-colors group/link"
                        >
                          View Live Demo
                          <FiArrowRight className="transition-transform group-hover/link:translate-x-1" />
                        </a>
                      ) : (
                        <Link
                          to={project.link || "/contact"}
                          className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-sm hover:text-orange-600 transition-colors group/link"
                        >
                          Request Demo
                          <FiArrowRight className="transition-transform group-hover/link:translate-x-1" />
                        </Link>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <p className="text-center text-slate-400 py-12 text-lg">
              No systems found in this category.
            </p>
          )}
        </div>
      </section>

      <section className="bg-slate-950 section-padding">
        <div className="section-container text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Need a Custom System?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
              We can build, customize, or integrate any of these systems for your
              organization. Contact us today for a free consultation.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn-primary">
                Get Started
              </Link>
              <Link to="/services" className="btn-secondary">
                View Services
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <CTABanner />
      <Footer />
    </div>
  );
};

export default Projects;
