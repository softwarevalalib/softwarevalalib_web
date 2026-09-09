import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMonitor,
  FiArrowRight,
  FiBookOpen,
  FiDollarSign,
  FiHeart,
  FiShoppingCart,
  FiTruck,
  FiLink,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import projectsData from "../data/projects.json";
import Footer from "../components/Footer";
import CTABanner from "../components/CTABanner";
import DemoRequestModal from "../components/DemoRequestModal";
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
};

const Projects = () => {
  const [filter, setFilter] = useState("All");
  const [demoProject, setDemoProject] = useState(null);

  const filteredProjects =
    filter === "All"
      ? projectsData
      : projectsData.filter((p) => p.category === filter);

  return (
    <div className="bg-white">
      <section className="relative bg-[#00274c] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-1/4 w-72 h-72 bg-[#c10020]/20 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 blur-[100px] rounded-full" />
        </div>
        <div className="section-container section-padding relative z-10 text-center">
          <Reveal>
            <span className="eyebrow text-[#c10020]">Portfolio</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="section-heading text-white mt-3">
              Our Systems &amp; <span className="text-[#c10020]">Solutions</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Explore our portfolio of management systems and digital solutions
              built for businesses, institutions, and organizations across Liberia.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-6 sm:py-8 border-b border-[#00274c]/10 sticky top-16 md:top-28 z-30">
        <div className="section-container">
          <div
            className="flex flex-wrap justify-center gap-2 sm:gap-3"
            role="tablist"
            aria-label="Project categories"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={filter === category}
                onClick={() => setFilter(category)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  filter === category
                    ? "bg-[#c10020] text-white shadow-lg shadow-[#c10020]/25"
                    : "bg-slate-100 text-[#00274c]/80 hover:bg-[#00274c]/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-slate-50">
        <div className="section-container">
          <p className="text-center text-sm text-slate-500 mb-8">
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
                const isExternal = project.link?.startsWith("http");

                return (
                  <motion.article
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
                    className="lift bg-white rounded-2xl overflow-hidden shadow-sm border border-[#00274c]/8 group flex flex-col"
                  >
                    <div className="relative h-48 sm:h-52 bg-[#00274c] overflow-hidden">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={`${project.title} cover`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon size={48} className="text-white/30" />
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-white/95 text-[#c10020] px-3 py-1 rounded-full text-xs font-semibold">
                        {project.category}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-[#00274c] mb-2">
                        {project.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="bg-[#c10020]/8 text-[#c10020] px-2.5 py-1 rounded-lg text-xs font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-auto">
                        <button
                          type="button"
                          onClick={() => setDemoProject(project)}
                          className="inline-flex items-center gap-1.5 text-[#c10020] font-semibold text-sm hover:text-[#a0001a] transition-colors group/link"
                        >
                          Request Demo
                          <FiArrowRight className="transition-transform group-hover/link:translate-x-1" />
                        </button>
                        {isExternal && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#00274c] font-semibold text-sm hover:text-[#c10020] transition-colors"
                          >
                            Live Demo
                          </a>
                        )}
                      </div>
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

      <section className="bg-[#00274c] section-padding">
        <div className="section-container text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Need a Custom System?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-white/75 text-base sm:text-lg max-w-2xl mx-auto">
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

      <DemoRequestModal
        project={demoProject}
        open={Boolean(demoProject)}
        onClose={() => setDemoProject(null)}
      />
    </div>
  );
};

export default Projects;
