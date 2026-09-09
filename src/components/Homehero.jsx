import { useState } from "react";
import { motion } from "framer-motion";
import Reveal from "../Animations/Reveal";
import FloatingShapes from "./FloatingShapes";
import VideoModal from "./VideoModal";
import StarRating from "./StarRating";
import { COMPANY_EMAIL } from "../config/company";

const WHATSAPP_URL =
  "https://wa.me/231888636071?text=Hi%20SVL%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services.";

export default function Homehero() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#00274c]">
      <FloatingShapes variant="hero" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#c10020]/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="section-container relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center section-padding">
        {/* Left: copy */}
        <div className="text-white text-center lg:text-left">
          <Reveal delay={0.1}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white">
              <span className="w-2 h-2 rounded-full bg-[#c10020] animate-pulse" />
              The Name of Trust
            </span>
          </Reveal>

          <Reveal delay={0.2}>
            <h1 className="mt-5 font-display font-extrabold uppercase leading-[1.05] text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
              Software Vala
              <span className="block text-[#c10020] mt-1">Liberia</span>
            </h1>
          </Reveal>

          <Reveal delay={0.35}>
            <p className="mt-6 text-white text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Building reliable websites, mobile apps, and enterprise management systems
              for businesses and institutions across Liberia — with engineering excellence
              you can trust.
            </p>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href={`mailto:${COMPANY_EMAIL}`} className="btn-primary">
                Email Us
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wide bg-green-500 text-white transition-all duration-300 hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/30"
              >
                WhatsApp
              </a>
            </div>
          </Reveal>

          {/* trust badge */}
          <Reveal delay={0.6}>
            <div className="mt-10 inline-flex items-center gap-3 rounded-2xl glass px-4 py-3">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-[#e11d48]/40 animate-ping" style={{ animation: "ping-ring 2s ease-out infinite" }} />
                <div className="relative grid place-items-center w-10 h-10 rounded-full bg-[#c10020] text-white font-bold">450+</div>
              </div>
              <div className="text-left">
                <StarRating count={5} />
                <p className="text-xs text-slate-300 mt-0.5">reviews from happy clients</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right: visual + play badge */}
        <Reveal direction="scale" delay={0.3} className="relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/10 border border-slate-700/50"
          >
            <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-400 text-xs sm:text-sm ml-3">app.js — Software Vala</span>
            </div>
            <div className="bg-[#1e1e1e] p-5 sm:p-7 font-mono text-xs sm:text-sm overflow-x-auto text-gray-300">
              <p><span className="text-purple-400">const</span> <span className="text-blue-400">company</span> = {"{"}</p>
              <p className="ml-4 sm:ml-6 text-gray-400">name: <span className="text-green-400">"SVL"</span>,</p>
              <p className="ml-4 sm:ml-6 text-gray-400">expertise: <span className="text-green-400">["Web", "Mobile", "SaaS"]</span>,</p>
              <p className="ml-4 sm:ml-6 text-gray-400">mission: <span className="text-green-400">"Building Digital Solutions"</span>,</p>
              <p>{"};"}</p>
              <br />
              <p><span className="text-purple-400">function</span> <span className="text-yellow-400">launchProject</span>() {"{"}</p>
              <p className="ml-4 sm:ml-6 text-gray-400">return <span className="text-green-400">"Innovation Starts Here";</span></p>
              <p>{"}"}</p>
              <br />
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-white"
              >
                |
              </motion.span>
            </div>
          </motion.div>

          {/* circular play badge */}
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            aria-label="Play showreel"
            className="group absolute -bottom-6 -left-2 sm:-left-6 grid place-items-center w-20 h-20 rounded-full bg-[#c10020] text-white shadow-xl shadow-[#c10020]/40 transition-transform hover:scale-105"
          >
            <span className="absolute inset-0 rounded-full border-2 border-[#e11d48]/40 animate-ping" style={{ animation: "ping-ring 2.2s ease-out infinite" }} />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="relative z-10 translate-x-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} videoId="dQw4w9WgXcQ" />
        </Reveal>
      </div>
    </section>
  );
}
