import useCountUp from "../Animations/useCountUp";

/**
 * Animated stat counter. Renders a large number plus an optional suffix.
 */
export default function Counter({ end, suffix = "", prefix = "", decimals = 0, label }) {
  const { ref, display } = useCountUp(end, { decimals });

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <span className="font-display text-4xl sm:text-5xl font-extrabold gradient-brand tabular-nums">
        {prefix}
        {display}
        {suffix}
      </span>
      {label && (
        <span className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      )}
    </div>
  );
}
