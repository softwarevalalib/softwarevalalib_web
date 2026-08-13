import { AiFillStar } from "react-icons/ai";

/** Renders a row of gold stars (read only). */
export default function StarRating({ count = 5, className = "" }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <AiFillStar key={i} className="star" size={16} />
      ))}
    </div>
  );
}
