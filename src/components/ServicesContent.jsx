import { Link } from "react-router-dom";
import { FaLaptopCode } from "react-icons/fa";
import {
  FiGlobe, FiCloud, FiServer, FiWifi, FiBarChart2,
  FiBookOpen, FiShield, FiVideo, FiEdit3,
} from "react-icons/fi";
import Services from "../data/services.json";
import Reveal from "../Animations/Reveal";

const serviceIcons = {
  "Software Development": <FaLaptopCode className="h-6 w-6" />,
  "Web Development": <FiGlobe className="h-6 w-6" />,
  "Web Hosting": <FiServer className="h-6 w-6" />,
  "Cloud Services": <FiCloud className="h-6 w-6" />,
  "Network Infrastructure": <FiWifi className="h-6 w-6" />,
  "Digital Marketing": <FiBarChart2 className="h-6 w-6" />,
  "Training and Support": <FiBookOpen className="h-6 w-6" />,
  "Cybersecurity Services": <FiShield className="h-6 w-6" />,
  "CCTV Installation": <FiVideo className="h-6 w-6" />,
  "Graphic Design": <FiEdit3 className="h-6 w-6" />,
};

function ServicesContent() {
  return (
    <section className="bg-slate-50 dark:bg-slate-900 pb-16 sm:pb-20 transition-colors duration-300">
      <div className="section-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {Services.map((service, index) => (
          <Reveal key={service.id} delay={index * 0.08}>
            <article className="h-full bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 card-hover group">
              <div className="flex items-center gap-4 pb-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  {serviceIcons[service.title] || service.icon}
                </span>
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                  {service.title}
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {service.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {service.features.map((feature, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors duration-300 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/20 group-hover:text-orange-700 dark:group-hover:text-orange-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 transition-all duration-300"
              >
                Get Started
              </Link>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default ServicesContent;
