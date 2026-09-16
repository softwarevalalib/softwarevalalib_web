import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Reveal from "../Animations/Reveal";
import FloatingShapes from "./FloatingShapes";
import VideoModal from "./VideoModal";
import StarRating from "./StarRating";
import {
  COMPANY_EMAIL,
  COMPANY_WHATSAPP,
  YOUTUBE_SHOWREEL_ID,
  YOUTUBE_SHOWREEL_URL,
} from "../config/company";

const WHATSAPP_URL = `https://wa.me/${COMPANY_WHATSAPP}?text=Hi%20SVL%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services.`;

export default function Homehero() {
  const [videoOpen, setVideoOpen] = useState(false);
  const tapRef = useRef({ count: 0, timer: null });

  const openOnYouTube = () => {
    window.open(YOUTUBE_SHOWREEL_URL, "_blank", "noopener,noreferrer");
  };

  const handlePlay = () => {
    tapRef.current.count += 1;
    if (tapRef.current.timer) clearTimeout(tapRef.current.timer);

    tapRef.current.timer = setTimeout(() => {
      if (tapRef.current.count >= 2) {
        openOnYouTube();
      } else {
        setVideoOpen(true);
      }
      tapRef.current.count = 0;
    }, 280);
  };

  return (
    <section className="relative overflow-hidden bg-[#00274c]" aria-labelledby="hero-heading">
      <FloatingShapes variant="hero" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#c10020]/20 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

      <div className="section-container relative z-10 grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center section-padding">
        <div className="text-white text-center lg:text-left">
          <Reveal delay={0.1}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white">
              <span className="w-2 h-2 rounded-full bg-[#c10020] animate-pulse" aria-hidden="true" />
              The Name of Trust
            </span>
          </Reveal>

          <Reveal delay={0.2}>
            <h1
              id="hero-heading"
              className="mt-5 font-display font-extrabold uppercase leading-[1.05] text-[clamp(2rem,8vw,4.5rem)]"
            >
              Software Vala
              <span className="block text-[#c10020] mt-1">Liberia</span>
            </h1>
          </Reveal>

          <Reveal delay={0.35}>
            <p className="mt-6 text-white/90 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Building reliable websites, mobile apps, and enterprise management systems
              for businesses and institutions across Liberia — with engineering excellence
              you can trust.
            </p>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <a href={`mailto:${COMPANY_EMAIL}`} className="btn-primary w-full sm:w-auto">
                Email Us
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wide bg-green-500 text-white transition-all duration-300 hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/30 w-full sm:w-auto"
              >
                WhatsApp
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.6}>
            <div className="mt-10 inline-flex items-center gap-3 rounded-2xl glass px-4 py-3 max-w-full">
              <div className="relative shrink-0">
                <span
                  className="absolute inset-0 rounded-full bg-[#e11d48]/40 animate-ping"
                  style={{ animation: "ping-ring 2s ease-out infinite" }}
                  aria-hidden="true"
                />
                <div className="relative grid place-items-center w-10 h-10 rounded-full bg-[#c10020] text-white font-bold text-sm">
                  450+
                </div>
              </div>
              <div className="text-left min-w-0">
                <StarRating count={5} />
                <p className="text-xs text-slate-300 mt-0.5">reviews from happy clients</p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal direction="scale" delay={0.3} className="relative pb-10 sm:pb-8 lg:pb-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/10 border border-slate-700/50"
          >
            <div className="bg-slate-900 px-3 sm:px-4 py-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" aria-hidden="true" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" aria-hidden="true" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" aria-hidden="true" />
              <span className="text-gray-400 text-xs sm:text-sm ml-2 sm:ml-3 truncate">
                app.js — Software Vala
              </span>
            </div>
            <div className="bg-[#1e1e1e] p-4 sm:p-7 font-mono text-[0.7rem] sm:text-sm overflow-x-auto text-gray-300">
              <p>
                <span className="text-purple-400">const</span>{" "}
                <span className="text-blue-400">company</span> = {"{"}
              </p>
              <p className="ml-4 sm:ml-6 text-gray-400">
                name: <span className="text-green-400">"SVL"</span>,
              </p>
              <p className="ml-4 sm:ml-6 text-gray-400">
                expertise: <span className="text-green-400">["Web", "Mobile", "SaaS"]</span>,
              </p>
              <p className="ml-4 sm:ml-6 text-gray-400">
                mission: <span className="text-green-400">"Building Digital Solutions"</span>,
              </p>
              <p>{"};"}</p>
              <br />
              <p>
                <span className="text-purple-400">function</span>{" "}
                <span className="text-yellow-400">launchProject</span>() {"{"}
              </p>
              <p className="ml-4 sm:ml-6 text-gray-400">
                return <span className="text-green-400">"Innovation Starts Here";</span>
              </p>
              <p>{"}"}</p>
              <br />
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-white"
                aria-hidden="true"
              >
                |
              </motion.span>
            </div>
          </motion.div>

          <button
            type="button"
            onClick={handlePlay}
            onDoubleClick={(e) => {
              e.preventDefault();
              if (tapRef.current.timer) clearTimeout(tapRef.current.timer);
              tapRef.current.count = 0;
              openOnYouTube();
            }}
            aria-label="Play showreel. Double-tap or double-click to open on YouTube."
            title="Play video — double-tap opens on YouTube"
            className="group absolute bottom-0 left-3 sm:-bottom-2 sm:-left-4 lg:-left-6 grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#c10020] text-white shadow-xl shadow-[#c10020]/40 transition-transform hover:scale-105 focus-visible:scale-105"
          >
            <span
              className="absolute inset-0 rounded-full border-2 border-[#e11d48]/40 animate-ping"
              style={{ animation: "ping-ring 2.2s ease-out infinite" }}
              aria-hidden="true"
            />
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="relative z-10 translate-x-0.5"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <VideoModal
            open={videoOpen}
            onClose={() => setVideoOpen(false)}
            videoId={YOUTUBE_SHOWREEL_ID}
          />
        </Reveal>
      </div>
    </section>
  );
}
