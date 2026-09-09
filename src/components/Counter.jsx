import useCountUp from "../Animations/useCountUp";

/**
 * Animated stat counter. Renders a large number plus an optional suffix.
 */
export default function Counter({ end, suffix = "", prefix = "", decimals = 0, label }) {
  const { ref, display } = useCountUp(end, { decimals });

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <span className="font-display text-4xl sm:text-5xl font-extrabold text-[#ff6b81] tabular-nums">
        {prefix}
        {display}
        {suffix}
      </span>
      {label && (
        <span className="mt-2 text-sm font-medium text-white/75">{label}</span>
      )}
    </div>
  );
}
