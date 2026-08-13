import { useEffect, useRef, useState } from "react";

/**
 * Animated counter that starts counting when the element scrolls into view.
 * Supports optional decimals and an optional "+" / "M+" suffix.
 */
export default function useCountUp(end, { duration = 2000, decimals = 0, startOnView = true } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const run = () => {
      if (started.current) return;
      started.current = true;
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        // easeOutExpo for a satisfying decel
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setValue(end * eased);
        if (progress < 1) requestAnimationFrame(tick);
        else setValue(end);
      };
      requestAnimationFrame(tick);
    };

    if (!startOnView) {
      run();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return { ref, display };
}
