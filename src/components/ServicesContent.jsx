import React from "react";
import { Link } from "react-router-dom";
import { FaLaptopCode } from "react-icons/fa";
import {
  FiGlobe,
  FiCloud,
  FiServer,
  FiWifi,
  FiBarChart2,
  FiBookOpen,
  FiShield,
  FiVideo,
  FiEdit3,
} from "react-icons/fi";
import Services from "../data/services.json";

const serviceIcons = {
  "Software Development": <FaLaptopCode className="h-6 w-6 text-cyan-700" />,
  "Web Development": <FiGlobe className="h-6 w-6 text-cyan-700" />,
  "Web Hosting": <FiServer className="h-6 w-6 text-cyan-700" />,
  "Cloud Services": <FiCloud className="h-6 w-6 text-cyan-700" />,
  "Network Infrastructure": <FiWifi className="h-6 w-6 text-cyan-700" />,
  "Digital Marketing": <FiBarChart2 className="h-6 w-6 text-cyan-700" />,
  "Training and Support": <FiBookOpen className="h-6 w-6 text-cyan-700" />,
  "Cybersecurity Services": <FiShield className="h-6 w-6 text-cyan-700" />,
  "CCTV Installation": <FiVideo className="h-6 w-6 text-cyan-700" />,
  "Graphic Design": <FiEdit3 className="h-6 w-6 text-cyan-700" />,
};

function ServicesContent() {
  return (
    <div className="bg-white flex flex-col item-center md:grid grid-cols-2 lg:grid-cols-3 justify-between gap-10 px-10 pb-10">
      {Services.map((service) => {
        return (
          <section
            key={service.id}
            className="bg-slate-50 rounded-lg px-5 py-5 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-center justify-center gap-3 pb-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-2xl">
                {serviceIcons[service.title] || service.icon}
              </span>
              <h3 className="font-bold text-center text-xl md:text-2xl lg:text-3xl">
                {service.title}
              </h3>
            </div>
            <p className="text-sm text-slate-700 mb-4">{service.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {service.features.map((feature, index) => {
                return (
                  <div key={index} className="w-full sm:w-auto">
                    <span className="block rounded-2xl bg-slate-200 px-4 py-3 text-sm shadow-sm transition-all duration-300 hover:scale-105">
                      {feature}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-cyan-700 transition-colors duration-200"
              >
                Get started
              </Link>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default ServicesContent;
