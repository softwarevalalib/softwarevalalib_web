import React from "react";
import { motion } from "framer-motion";
import Reveal from "../Animations/Reveal";

export default function Homeheader() {
  return (
    <div className=" bg-slate-950  py-20 sm:flex flex-col  sm:px-10 lg:flex-row lg:py-28">
      <div className="text-white w-[90%] mx-auto py-3">
        <Reveal delay={0.5}>
          <h1 className="uppercase text-4xl font-bold py-3 sm:text-7xl ">
            software vala <br />
            <span className="text-7xl text-orange-500 sm:text-9xl">
              Liberia
            </span>
          </h1>
        </Reveal>

        <Reveal delay={1.6}>
          <span className="text-orange-500 uppercase bg-white rounded-2xl font-semibold px-3 py-1 my ">
            the name of trust
          </span>
        </Reveal>

        <Reveal delay={0.7}>
          <p className="py-4 sm:pr-10">
            Partner with one of the Best Web Designers in Liberia to take your
            brand to the next level. As a Top Web Design Company in Monrovia, we
            deliver powerful web solutions that drive traffic, leads, and sales.
          </p>
        </Reveal>

        <Reveal delay={0.9}>
          <a
            href="mailto:softwarevalaliberiainc@gmail.com"
            className="inline-flex items-center justify-center text-white bg-orange-500 uppercase px-6 py-2 rounded cursor-pointer sm:font-semibold"
          >
            Email
          </a>
          <a
            href="https://wa.me/231888636071?text=Hi%20SVL%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center text-white bg-green-500 uppercase px-6 py-2 rounded mx-3 cursor-pointer sm:font-semibold sm:ml-5"
          >
            WhatsApp
          </a>
        </Reveal>
      </div>

      {/* Motion */}
      <div className="px-5 hidden sm:block pt-7 ">
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl border border-slate-700"
        >
          {/* VS CODE HEADER */}
          <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>

            <span className="text-gray-400 text-sm ml-4">app.js — SVL</span>
          </div>

          {/* CODE AREA */}
          <div className="bg-[#1e1e1e] p-6 font-mono text-sm md:text-base">
            <p>
              <span className="text-purple-400">const</span>{" "}
              <span className="text-blue-400">company</span> = {"{"}
            </p>

            <p className="ml-6 text-gray-400">
              name:
              <span className="text-green-400"> "SVL"</span>,
            </p>

            <p className="ml-6 text-gray-400">
              expertise:
              <span className="text-green-400">
                {" "}
                ["Web Development", "Mobile Apps"]
              </span>
              ,
            </p>

            <p className="ml-6 text-gray-400">
              mission:
              <span className="text-green-400">
                {" "}
                "Building Digital Solutions"
              </span>
              ,
            </p>

            <p>{"};"}</p>

            <br />

            <p>
              <span className="text-purple-400">function</span>{" "}
              <span className="text-yellow-400">launchProject</span>() {"{"}
            </p>

            <p className="ml-6 text-gray-400">
              return
              <span className="text-green-400"> "Innovation Starts Here";</span>
            </p>

            <p>{"}"}</p>

            <br />

            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{
                repeat: Infinity,
                duration: 1,
              }}
              className="text-white"
            >
              |
            </motion.span>
          </div>
          <div className="absolute w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full"></div>
        </motion.div>
      </div>
    </div>
  );
}
