import { motion, useReducedMotion } from "framer-motion";

/**
 * Scroll-reveal wrapper.
 * Opacity stays at 1 so copy never disappears if intersection detection fails
 * (a common issue with nested overflow / transformed ancestors).
 */
const variants = {
  up: { hidden: { opacity: 1, y: 28 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 1, y: -28 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 1, x: -28 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 1, x: 28 }, visible: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 1, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
  fade: { hidden: { opacity: 1 }, visible: { opacity: 1 } },
};

function Reveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.55,
  once = true,
}) {
  const reduceMotion = useReducedMotion();
  const variant = variants[direction] || variants.up;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.05, margin: "0px 0px -32px 0px" }}
      variants={variant}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
