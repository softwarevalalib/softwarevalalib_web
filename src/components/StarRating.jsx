import { AiFillStar } from "react-icons/ai";

/** Renders a row of gold stars. Pass `interactive` + `onChange` for forms. */
export default function StarRating({
  count = 5,
  value,
  interactive = false,
  onChange,
  size = 16,
  className = "",
}) {
  const filled = interactive ? value || 0 : count;

  if (!interactive) {
    return (
      <div className={`flex items-center gap-0.5 ${className}`} aria-label={`${filled} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <AiFillStar
            key={i}
            size={size}
            className={i < filled ? "star text-amber-400" : "text-slate-300"}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="radiogroup"
      aria-label="Rating"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const selected = starValue <= filled;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            onClick={() => onChange?.(starValue)}
            className="p-0.5 rounded transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c10020]"
          >
            <AiFillStar
              size={size}
              className={selected ? "text-amber-400" : "text-slate-300"}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
