import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Reveal from "../Animations/Reveal";
import FloatingShapes from "./FloatingShapes";
import VideoModal from "./VideoModal";
import { Link } from "react-router-dom";
import { YOUTUBE_SHOWREEL_ID, YOUTUBE_SHOWREEL_URL } from "../config/company";
import { whatsappSpecialistUrl } from "../utils/whatsapp";

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
              <span className="w-2 h-2 rounded-full bg-[#c10020]" aria-hidden="true" />
              Software and digital solutions for modern organizations
            </span>
          </Reveal>

          <Reveal delay={0.2}>
            <h1
              id="hero-heading"
              className="mt-5 font-display font-extrabold leading-[1.08] text-[clamp(1.85rem,5.5vw,3.4rem)]"
            >
              Technology that helps your business work smarter and grow.
            </h1>
          </Reveal>

          <Reveal delay={0.35}>
            <p className="mt-6 text-white/90 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Software Vala Liberia designs and delivers websites, custom software, business management systems,
              mobile applications, cloud solutions, digital marketing, and technology services for businesses and
              institutions in Liberia and beyond.
            </p>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to="/consultation" className="btn-primary w-full sm:w-auto">
                Request a free consultation
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wide border-2 border-white text-white w-full sm:w-auto"
              >
                Explore our solutions
              </Link>
              <a
                href={whatsappSpecialistUrl({ page: "home" })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wide bg-green-600 text-white w-full sm:w-auto"
              >
                WhatsApp us
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.6}>
            <p className="mt-8 text-sm text-white/75">
              The Name of Trust · Monrovia, Liberia
            </p>
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
