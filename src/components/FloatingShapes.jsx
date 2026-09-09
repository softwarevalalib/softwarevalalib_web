import { motion } from "framer-motion";

/**
 * Decorative parallax floating blobs/shapes for hero and dark sections.
 * `variant` switches between distinct arrangements.
 */
export default function FloatingShapes({ variant = "hero" }) {
  const common = "float-shape";

  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* animated blobs */}
        <motion.div
          className={`${common} w-72 h-72 bg-cyan-500/20`}
          style={{ top: "8%", right: "6%" }}
          animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`${common} w-80 h-80 bg-[#c10020]/15`}
          style={{ bottom: "4%", left: "4%" }}
          animate={{ y: [0, 18, 0], x: [0, -14, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* orbiting ring — keep away from mobile text column */}
        <motion.div
          className="absolute rounded-full border border-white/10 hidden sm:block"
          style={{ width: 220, height: 220, top: "20%", left: "12%" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute rounded-full border border-[#e11d48]/20 hidden md:block"
          style={{ width: 140, height: 140, top: "50%", right: "14%" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        />
        {/* dotted grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>
    );
  }

  // generic soft glows for other dark sections
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className={`${common} w-64 h-64 bg-cyan-500/15`}
        style={{ top: "10%", left: "8%" }}
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`${common} w-72 h-72 bg-[#c10020]/10`}
        style={{ bottom: "6%", right: "10%" }}
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
