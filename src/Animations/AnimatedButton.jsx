import { motion } from "framer-motion";

function AnimatedButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950"
    >
      Get Started
    </motion.button>
  );
}

export default AnimatedButton;
