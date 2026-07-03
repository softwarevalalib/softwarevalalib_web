import React from "react";
import { motion } from "framer-motion";
import pc1 from "../images/pc1.png";
import pc3 from "../images/pc2.png";
import pc2 from "../images/pc3.png";

function ServicesHeader() {
  return (
    <div className="h-100 lg:h160 bg-slate-950">
      <div className="flex items-center justify-center px-20 pt-30">
        <motion.img
          src={pc1}
          alt=""
          className="w-30 h-auto md:w-50 lg:w-70"
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0 }}
        />
        <motion.img
          src={pc2}
          alt=""
          className="w-30 h-auto md:w-50 lg:w-70"
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        />
        <motion.img
          src={pc3}
          alt=""
          className="w-30 h-auto md:w-50 lg:w-70"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 2.4 }}
        />
      </div>
      <h1 className=" text-center pt-20 md:pt-6 lg:pt-10 font-semibold text-5xl md:text-6xl lg:text-8xl text-orange-500 ">
        Our Services
      </h1>
      <p className="text-white text-center px-4 pt-4 mb-7 pb-5 md:text-xl lg:text-3xl md:px-10 lg:px-10 ">
        Comprehensive technology solutions designed to help your business thrive
        in Liberia's digital economy
      </p>
    </div>
  );
}

export default ServicesHeader;
