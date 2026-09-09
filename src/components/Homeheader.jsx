import { motion } from "framer-motion";
import Reveal from "../Animations/Reveal";
import { COMPANY_EMAIL } from "../config/company";

export default function Homeheader() {
  return (
    <section className="relative bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-cyan-500/15 blur-[100px] rounded-full" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#c10020]/10 blur-[120px] rounded-full" />
      </div>

      <div className="section-container section-padding relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        <div className="text-white flex-1 text-center lg:text-left">
          <Reveal delay={0.1}>
            <span className="inline-block text-[#c10020] uppercase bg-white/10 backdrop-blur-sm rounded-full font-semibold px-4 py-1.5 text-xs sm:text-sm tracking-wider mb-4">
              The Name of Trust
            </span>
          </Reveal>

          <Reveal delay={0.2}>
            <h1 className="uppercase text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight">
              Software Vala{" "}
              <span className="block text-[#c10020] text-4xl sm:text-6xl lg:text-7xl xl:text-8xl mt-1">
                Liberia
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.35}>
            <p className="mt-6 text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Partner with one of the Best Web Designers in Liberia to take your
              brand to the next level. As a Top Web Design Company in Monrovia, we
              deliver powerful web solutions that drive traffic, leads, and sales.
            </p>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href={`mailto:${COMPANY_EMAIL}`} className="btn-primary">
                Email Us
              </a>
              <a
                href="https://wa.me/231888636071?text=Hi%20SVL%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wide bg-green-500 text-white transition-all duration-300 hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/30"
              >
                WhatsApp
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal direction="scale" delay={0.3} className="flex-1 w-full max-w-lg lg:max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/10 border border-slate-700/50"
          >
            <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-400 text-xs sm:text-sm ml-3">app.js — SVL</span>
            </div>

            <div className="bg-[#1e1e1e] p-4 sm:p-6 font-mono text-xs sm:text-sm overflow-x-auto">
              <p><span className="text-purple-400">const</span> <span className="text-blue-400">company</span> = {"{"}</p>
              <p className="ml-4 sm:ml-6 text-gray-400">name: <span className="text-green-400">"SVL"</span>,</p>
              <p className="ml-4 sm:ml-6 text-gray-400">expertise: <span className="text-green-400">["Web Dev", "Mobile Apps"]</span>,</p>
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
        </Reveal>
      </div>
    </section>
  );
}
